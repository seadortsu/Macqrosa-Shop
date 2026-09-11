import { Router } from 'express';
import { query } from '../database.js';
import { authenticateAdmin } from '../middleware/auth.js';
import logger from '../logger.js';

const router = Router();

// GET all menus
router.get('/', async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM menus');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch menus' });
  }
});

// GET menu by handle with items
router.get('/:handle', async (req, res) => {
  try {
    const { rows: menuRows } = await query('SELECT * FROM menus WHERE handle = $1', [req.params.handle]);
    if (menuRows.length === 0) return res.status(404).json({ error: 'Menu not found' });
    
    const menu = menuRows[0];
    const { rows: itemsRows } = await query('SELECT * FROM menu_items WHERE menu_id = $1 ORDER BY order_index ASC', [menu.id]);
    
    // Nest items
    const rootItems = itemsRows.filter(i => !i.parent_id);
    const nest = (parent) => {
      parent.children = itemsRows.filter(i => i.parent_id === parent.id).map(nest);
      return parent;
    };
    menu.items = rootItems.map(nest);

    res.json(menu);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});

// POST new menu
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { name, handle, location } = req.body;
    const { rows } = await query('INSERT INTO menus (name, handle, location) VALUES ($1, $2, $3) RETURNING *', [name, handle, location || null]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create menu' });
  }
});

// PUT update menu
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { name, handle, location } = req.body;
    const { rows } = await query('UPDATE menus SET name = $1, handle = $2, location = $3 WHERE id = $4 RETURNING *', [name, handle, location || null, req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update menu' });
  }
});

// POST new menu item
router.post('/items', authenticateAdmin, async (req, res) => {
  try {
    const { menu_id, parent_id, label, url, target, order_index, show_desktop, show_tablet, show_mobile } = req.body;
    // We get menu_id from body here instead of params because frontend sends it to /api/menus/items
    const { rows } = await query(`
      INSERT INTO menu_items (menu_id, parent_id, label, url, target, order_index, show_desktop, show_tablet, show_mobile)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *
    `, [
      menu_id, parent_id || null, label, url, target || '_self', order_index || 0,
      show_desktop !== undefined ? show_desktop : 1,
      show_tablet !== undefined ? show_tablet : 1,
      show_mobile !== undefined ? show_mobile : 1
    ]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add menu item' });
  }
});

// PUT update menu item
router.put('/items/:itemId', authenticateAdmin, async (req, res) => {
  try {
    const { parent_id, label, url, target, order_index, show_desktop, show_tablet, show_mobile } = req.body;
    const { rows } = await query(`
      UPDATE menu_items 
      SET parent_id = $1, label = $2, url = $3, target = $4, order_index = $5, show_desktop = $6, show_tablet = $7, show_mobile = $8
      WHERE id = $9 RETURNING *
    `, [
      parent_id || null, label, url, target || '_self', order_index || 0,
      show_desktop !== undefined ? show_desktop : 1,
      show_tablet !== undefined ? show_tablet : 1,
      show_mobile !== undefined ? show_mobile : 1,
      req.params.itemId
    ]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update menu item' });
  }
});

// DELETE menu item
router.delete('/items/:itemId', authenticateAdmin, async (req, res) => {
  try {
    await query('DELETE FROM menu_items WHERE id = $1', [req.params.itemId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
});

export default router;
