import { Router } from 'express';
import { query } from '../database.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = Router();

// All inventory routes require admin credentials
router.use(authenticateAdmin);

// Get inventory overview with health checks & low stock alerts
router.get('/', async (req, res) => {
  try {
    const { rows: products } = await query(`
      SELECT id, title, subtitle, category, discipline, price, stock, image_url, updated_at
      FROM products
      ORDER BY stock ASC
    `);

    const lowStockThreshold = 10;
    let totalStockCount = 0;
    let totalInventoryValuation = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    const items = products.map(p => {
      const price = parseFloat(p.price);
      totalStockCount += p.stock;
      totalInventoryValuation += p.stock * price;

      let status = 'in_stock';
      if (p.stock === 0) {
        status = 'out_of_stock';
        outOfStockCount++;
      } else if (p.stock <= lowStockThreshold) {
        status = 'low_stock';
        lowStockCount++;
      }

      return {
        ...p,
        price,
        status,
        valuation: parseFloat((p.stock * price).toFixed(2))
      };
    });

    res.json({
      summary: {
        totalStockCount,
        totalInventoryValuation: parseFloat(totalInventoryValuation.toFixed(2)),
        lowStockCount,
        outOfStockCount,
        totalSKUs: products.length,
        lowStockThreshold
      },
      items
    });
  } catch (err) {
    console.error('Inventory list error:', err);
    res.status(500).json({ error: 'Failed to retrieve inventory records' });
  }
});

// Adjust stock level with reason and audit log
router.post('/adjust', async (req, res) => {
  try {
    const { productId, changeAmount, newStock, reason } = req.body;

    const { rows: prodRows } = await query('SELECT id, title, stock FROM products WHERE id = $1', [Number(productId)]);
    const prod = prodRows[0];
    if (!prod) {
      return res.status(404).json({ error: 'Product not found' });
    }

    let calculatedNewStock = prod.stock;
    let diff = 0;

    if (newStock !== undefined && newStock !== null) {
      calculatedNewStock = Math.max(0, Number(newStock));
      diff = calculatedNewStock - prod.stock;
    } else if (changeAmount !== undefined && changeAmount !== null) {
      diff = Number(changeAmount);
      calculatedNewStock = Math.max(0, prod.stock + diff);
    } else {
      return res.status(400).json({ error: 'Specify either changeAmount or newStock.' });
    }

    const now = new Date().toISOString();
    const actionReason = reason || 'Manual Admin Stock Adjustment';

    await query('UPDATE products SET stock = $1, updated_at = $2 WHERE id = $3', [calculatedNewStock, now, prod.id]);

    await query(`
      INSERT INTO inventory_logs (product_id, product_title, change_amount, reason, previous_stock, new_stock, logged_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [prod.id, prod.title, diff, actionReason, prod.stock, calculatedNewStock, now]);

    res.json({
      success: true,
      product: {
        id: prod.id,
        title: prod.title,
        previousStock: prod.stock,
        newStock: calculatedNewStock,
        diff
      }
    });
  } catch (err) {
    console.error('Adjust inventory error:', err);
    res.status(500).json({ error: 'Failed to adjust inventory level' });
  }
});

// Get stock adjustment audit trail
router.get('/logs', async (req, res) => {
  try {
    const { rows: logs } = await query('SELECT * FROM inventory_logs ORDER BY id DESC LIMIT 50');
    res.json(logs);
  } catch (err) {
    console.error('Inventory logs error:', err);
    res.status(500).json({ error: 'Failed to retrieve inventory logs' });
  }
});

export default router;
