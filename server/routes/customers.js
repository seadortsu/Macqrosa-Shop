import { Router } from 'express';
import { query } from '../database.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = Router();

// Require admin credentials
router.use(authenticateAdmin);

// List all customers
router.get('/', async (req, res) => {
  try {
    const { search } = req.query;

    let sql = 'SELECT id, email, first_name, last_name, phone, tier, points, total_spent, orders_count, created_at FROM customers WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (search) {
      sql += ` AND (email LIKE $${paramIndex} OR first_name LIKE $${paramIndex + 1} OR last_name LIKE $${paramIndex + 2})`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      paramIndex += 3;
    }

    sql += ' ORDER BY total_spent DESC, id DESC';

    const { rows: customers } = await query(sql, params);

    const totalCustomers = customers.length;
    const totalRevenue = customers.reduce((sum, c) => sum + (parseFloat(c.total_spent) || 0), 0);
    const vipCount = customers.filter(c => parseFloat(c.total_spent) >= 500).length;

    res.json({
      summary: {
        totalCustomers,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        vipCount
      },
      customers
    });
  } catch (err) {
    console.error('Fetch customers error:', err);
    res.status(500).json({ error: 'Failed to fetch customer directory' });
  }
});

// Get single customer details with purchase history
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { rows: customerRows } = await query('SELECT id, email, first_name, last_name, phone, tier, points, total_spent, orders_count, created_at FROM customers WHERE id = $1', [id]);
    const customer = customerRows[0];

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const { rows: addresses } = await query('SELECT * FROM customer_addresses WHERE customer_id = $1', [id]);
    const { rows: orders } = await query('SELECT * FROM orders WHERE customer_id = $1 ORDER BY id DESC', [id]);

    const enrichedOrders = [];
    for (const o of orders) {
      const { rows: items } = await query('SELECT * FROM order_items WHERE order_id = $1', [o.id]);
      enrichedOrders.push({
        ...o,
        shippingAddress: JSON.parse(o.shipping_address),
        items
      });
    }

    res.json({
      customer,
      addresses,
      orders: enrichedOrders
    });
  } catch (err) {
    console.error('Fetch customer detail error:', err);
    res.status(500).json({ error: 'Failed to fetch customer profile' });
  }
});

// Update customer (admin-side: tier, notes, etc.)
router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { tier, phone, firstName, lastName } = req.body;

    const { rows: existing } = await query('SELECT * FROM customers WHERE id = $1', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const current = existing[0];
    await query(`
      UPDATE customers SET
        first_name = $1, last_name = $2, phone = $3, tier = $4
      WHERE id = $5
    `, [
      firstName || current.first_name,
      lastName || current.last_name,
      phone !== undefined ? phone : current.phone,
      tier || current.tier,
      id
    ]);

    const { rows: updated } = await query('SELECT id, email, first_name, last_name, phone, tier, points, total_spent, orders_count, created_at FROM customers WHERE id = $1', [id]);
    res.json(updated[0]);
  } catch (err) {
    console.error('Update customer error:', err);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// Delete/deactivate customer
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { rows } = await query('SELECT id, email FROM customers WHERE id = $1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Delete addresses, then customer
    await query('DELETE FROM customer_addresses WHERE customer_id = $1', [id]);
    await query('DELETE FROM customers WHERE id = $1', [id]);
    res.json({ success: true, message: `Customer ${rows[0].email} removed.` });
  } catch (err) {
    console.error('Delete customer error:', err);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

// Bulk operations
router.post('/bulk', async (req, res) => {
  try {
    const { action, ids, payload } = req.body;
    if (!action || !ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Missing action or customer IDs' });
    }

    if (action === 'delete') {
      const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
      // First delete addresses
      await query(`DELETE FROM customer_addresses WHERE customer_id IN (${placeholders})`, ids);
      // Then delete customers
      await query(`DELETE FROM customers WHERE id IN (${placeholders})`, ids);
      return res.json({ success: true, message: `Deleted ${ids.length} customers.` });
    }
    
    if (action === 'update_tier') {
      if (!payload || !payload.tier) {
        return res.status(400).json({ error: 'Missing tier payload' });
      }
      const placeholders = ids.map((_, i) => `$${i + 2}`).join(',');
      await query(`UPDATE customers SET tier = $1 WHERE id IN (${placeholders})`, [payload.tier, ...ids]);
      return res.json({ success: true, message: `Updated tier for ${ids.length} customers.` });
    }

    res.status(400).json({ error: 'Unknown bulk action' });
  } catch (err) {
    console.error('Bulk operation error:', err);
    res.status(500).json({ error: 'Failed to perform bulk operation' });
  }
});

export default router;
