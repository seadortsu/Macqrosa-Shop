import { Router } from 'express';
import { query, pool } from '../database.js';
import { authenticateCustomer, optionalCustomer, authenticateAdmin } from '../middleware/auth.js';
import { sendSmsNotification } from '../services/sms.js';

const router = Router();

/* =========================================================================
   STOREFRONT ORDER PLACEMENT & CUSTOMER ORDERS
   ========================================================================= */

// Place a new order
router.post('/', optionalCustomer, async (req, res) => {
  const client = await pool.connect();
  try {
    const { items, customerInfo, shippingAddress, paymentMethod, promoCode } = req.body;

    if (!items || !items.length || !customerInfo || !shippingAddress) {
      return res.status(400).json({ error: 'Incomplete order payload.' });
    }

    await client.query('BEGIN');

    let subtotal = 0;
    const verifiedItems = [];

    // Verify stock and compute subtotal from actual product records
    for (const it of items) {
      const { rows: prodRows } = await client.query('SELECT id, title, price, stock, image_url FROM products WHERE id = $1', [it.productId]);
      const prod = prodRows[0];
      if (!prod) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Product ID ${it.productId} not found.` });
      }
      if (prod.stock < it.quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: `Insufficient stock for "${prod.title}". Only ${prod.stock} flacons remain in our reserves.`
        });
      }

      const itemTotal = parseFloat(prod.price) * it.quantity;
      subtotal += itemTotal;
      verifiedItems.push({
        productId: prod.id,
        title: prod.title,
        price: parseFloat(prod.price),
        quantity: it.quantity,
        total: itemTotal,
        imageUrl: prod.image_url,
        currentStock: prod.stock
      });
    }

    // Discounts & shipping logic
    let discount = 0;
    if (promoCode) {
      const cleanCode = promoCode.trim().toUpperCase();
      const { rows: promoRows } = await client.query(
        'SELECT * FROM promo_codes WHERE UPPER(code) = $1 AND is_active = 1',
        [cleanCode]
      );
      if (promoRows && promoRows.length > 0) {
        const promo = promoRows[0];
        const minSpend = parseFloat(promo.min_spend) || 0;
        if (subtotal >= minSpend) {
          if (promo.discount_type === 'percentage') {
            discount = (subtotal * parseFloat(promo.discount_value)) / 100;
          } else {
            discount = Math.min(subtotal, parseFloat(promo.discount_value));
          }
          // Increment promo usage
          await client.query('UPDATE promo_codes SET uses_count = uses_count + 1 WHERE id = $1', [promo.id]);
        }
      }
    }

    // Dynamic settings for shipping and tax
    let freeShippingThreshold = 150;
    let standardShippingFee = 15.00;
    let taxRate = 8.5;

    const { rows: settingRows } = await client.query("SELECT value FROM site_settings WHERE key = 'store_settings'");
    if (settingRows && settingRows.length > 0) {
      try {
        const s = JSON.parse(settingRows[0].value);
        if (s.freeShippingThreshold !== undefined) freeShippingThreshold = parseFloat(s.freeShippingThreshold);
        if (s.standardShippingFee !== undefined) standardShippingFee = parseFloat(s.standardShippingFee);
        if (s.taxRate !== undefined) taxRate = parseFloat(s.taxRate);
      } catch (err) {
        // Fallback to defaults
      }
    }

    const discountedSubtotal = Math.max(0, subtotal - discount);
    const shippingFee = discountedSubtotal >= freeShippingThreshold ? 0 : standardShippingFee;
    const tax = parseFloat(((discountedSubtotal * taxRate) / 100).toFixed(2));
    const totalAmount = parseFloat((discountedSubtotal + shippingFee + tax).toFixed(2));

    const orderNumber = `MQ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    let customerId = req.customer ? req.customer.id : null;
    const customerEmail = (customerInfo.email || (req.customer && req.customer.email)).toLowerCase().trim();
    const customerName = `${customerInfo.firstName || ''} ${customerInfo.lastName || ''}`.trim() || 'Valued Patron';

    // If customerId is null, check if email matches existing customer
    if (!customerId) {
      const { rows: existingRows } = await client.query('SELECT id FROM customers WHERE email = $1', [customerEmail]);
      if (existingRows.length > 0) customerId = existingRows[0].id;
    }

    // Insert order
    const trackingNum = `MQ-FEDEX-${Math.floor(1000000 + Math.random() * 9000000)}`;
    const { rows: orderRows } = await client.query(`
      INSERT INTO orders (
        order_number, customer_id, customer_email, customer_name,
        shipping_address, subtotal, shipping_fee, tax, total_amount,
        status, payment_method, payment_status, tracking_number,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', $10, 'pending', $11, $12, $13)
      RETURNING id
    `, [
      orderNumber,
      customerId,
      customerEmail,
      customerName,
      JSON.stringify(shippingAddress),
      discountedSubtotal,
      shippingFee,
      tax,
      totalAmount,
      paymentMethod || 'Credit Card (Place Vendôme Gateway)',
      trackingNum,
      now,
      now
    ]);

    const orderId = orderRows[0].id;

    // Insert order items and decrement product stock
    for (const it of verifiedItems) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, product_title, product_price, quantity, total_price, image_url) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [orderId, it.productId, it.title, it.price, it.quantity, it.total, it.imageUrl]
      );
      await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [it.quantity, it.productId]);
      const newStock = it.currentStock - it.quantity;
      await client.query(
        'INSERT INTO inventory_logs (product_id, product_title, change_amount, reason, previous_stock, new_stock, logged_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [it.productId, it.title, -it.quantity, `Customer Order: ${orderNumber}`, it.currentStock, newStock, now]
      );
    }

    // Update customer statistics if registered
    if (customerId) {
      const earnedPoints = Math.floor(totalAmount);
      await client.query(`
        UPDATE customers SET
          total_spent = total_spent + $1,
          orders_count = orders_count + 1,
          points = points + $2
        WHERE id = $3
      `, [totalAmount, earnedPoints, customerId]);
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      order: {
        id: orderId,
        orderNumber,
        totalAmount,
        subtotal: discountedSubtotal,
        shippingFee,
        tax,
        status: 'pending',
        trackingNumber: trackingNum,
        createdAt: now,
        customerName,
        customerEmail,
        shippingAddress,
        items: verifiedItems
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Order placement error:', err);
    res.status(500).json({ error: 'Failed to process order' });
  } finally {
    client.release();
  }
});

// Get order by order number (Public/Order Confirmation)
router.get('/:orderNumber', async (req, res) => {
  try {
    const { rows: orderRows } = await query('SELECT * FROM orders WHERE order_number = $1', [req.params.orderNumber]);
    const order = orderRows[0];
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const { rows: items } = await query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);

    res.json({
      ...order,
      shippingAddress: JSON.parse(order.shipping_address),
      items
    });
  } catch (err) {
    console.error('Fetch order error:', err);
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
});

// Get customer order history
router.get('/customer/history', authenticateCustomer, async (req, res) => {
  try {
    const { rows: orders } = await query('SELECT * FROM orders WHERE customer_id = $1 ORDER BY id DESC', [req.customer.id]);
    const enrichedOrders = [];
    for (const o of orders) {
      const { rows: items } = await query('SELECT * FROM order_items WHERE order_id = $1', [o.id]);
      enrichedOrders.push({
        ...o,
        shippingAddress: JSON.parse(o.shipping_address),
        items
      });
    }
    res.json(enrichedOrders);
  } catch (err) {
    console.error('Customer history error:', err);
    res.status(500).json({ error: 'Failed to fetch customer history' });
  }
});

/* =========================================================================
   ADMIN ORDER MANAGEMENT
   ========================================================================= */

// Get all orders (Admin with filters)
router.get('/admin/all', authenticateAdmin, async (req, res) => {
  try {
    const { status, search } = req.query;

    let sql = 'SELECT * FROM orders WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (status && status !== 'all') {
      sql += ` AND status = $${paramIndex}`;
      params.push(status.toLowerCase());
      paramIndex++;
    }

    if (search) {
      sql += ` AND (order_number LIKE $${paramIndex} OR customer_name LIKE $${paramIndex + 1} OR customer_email LIKE $${paramIndex + 2})`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      paramIndex += 3;
    }

    sql += ' ORDER BY id DESC';

    const { rows: orders } = await query(sql, params);

    const result = [];
    for (const o of orders) {
      const { rows: items } = await query('SELECT * FROM order_items WHERE order_id = $1', [o.id]);
      result.push({
        ...o,
        shippingAddress: JSON.parse(o.shipping_address),
        items
      });
    }

    res.json(result);
  } catch (err) {
    console.error('Admin all orders error:', err);
    res.status(500).json({ error: 'Failed to fetch orders for administration' });
  }
});

// Update order status (Admin)
router.put('/admin/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    const { status } = req.body;

    const allowed = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!allowed.includes(status.toLowerCase())) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${allowed.join(', ')}` });
    }

    const { rows: existingRows } = await query('SELECT id, order_number, shipping_address FROM orders WHERE id = $1', [orderId]);
    const existing = existingRows[0];
    if (!existing) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const now = new Date().toISOString();
    await query('UPDATE orders SET status = $1, updated_at = $2 WHERE id = $3', [status.toLowerCase(), now, orderId]);

    // Dispatch SMS notification if phone is present in address
    try {
      const addr = typeof existing.shipping_address === 'string' ? JSON.parse(existing.shipping_address) : existing.shipping_address;
      const phone = addr?.phone;
      if (phone && ['shipped', 'delivered'].includes(status.toLowerCase())) {
        sendSmsNotification(phone, `✨ MACQROSA: Your atelier order ${existing.order_number} status has been updated to "${status.toUpperCase()}".`);
      }
    } catch (e) {
      // ignore
    }

    res.json({ success: true, message: `Order ${existing.order_number} status updated to ${status}.` });
  } catch (err) {
    console.error('Admin update status error:', err);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Update tracking number (Admin)
router.put('/admin/:id/tracking', authenticateAdmin, async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    const { trackingNumber } = req.body;

    const { rows: existingRows } = await query('SELECT id FROM orders WHERE id = $1', [orderId]);
    if (existingRows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const now = new Date().toISOString();
    await query('UPDATE orders SET tracking_number = $1, updated_at = $2 WHERE id = $3', [trackingNumber, now, orderId]);

    res.json({ success: true, message: 'Tracking details updated.' });
  } catch (err) {
    console.error('Admin update tracking error:', err);
    res.status(500).json({ error: 'Failed to update tracking number' });
  }
});

export default router;
