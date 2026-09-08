import { Router } from 'express';
import { query } from '../database.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = Router();

// Public: Get all categories
router.get('/', async (req, res) => {
  try {
    const { rows: categories } = await query('SELECT * FROM categories ORDER BY id ASC');
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Public: Get categories with product counts
router.get('/summary', async (req, res) => {
  try {
    const { rows: categories } = await query('SELECT * FROM categories ORDER BY id ASC');
    const enriched = [];
    for (const cat of categories) {
      const { rows: countRows } = await query(
        "SELECT count(*) as count FROM products WHERE LOWER(category) = LOWER($1) OR LOWER(discipline) = LOWER($2)",
        [cat.name, cat.name]
      );
      enriched.push({
        ...cat,
        product_count: parseInt(countRows[0].count) || 0
      });
    }
    res.json(enriched);
  } catch (err) {
    console.error('Categories summary error:', err);
    res.status(500).json({ error: 'Failed to fetch categories summary' });
  }
});

// Admin: Get categories with product counts
router.get('/admin/summary', authenticateAdmin, async (req, res) => {
  try {
    const { rows: categories } = await query('SELECT * FROM categories ORDER BY id ASC');
    const enriched = [];
    for (const cat of categories) {
      const { rows: countRows } = await query(
        "SELECT count(*) as count FROM products WHERE LOWER(category) = LOWER($1) OR LOWER(discipline) = LOWER($2)",
        [cat.name, cat.name]
      );
      enriched.push({
        ...cat,
        product_count: parseInt(countRows[0].count) || 0
      });
    }
    res.json(enriched);
  } catch (err) {
    console.error('Categories summary error:', err);
    res.status(500).json({ error: 'Failed to fetch categories summary' });
  }
});

// Admin: Create category
router.post('/admin', authenticateAdmin, async (req, res) => {
  try {
    const { name, description, image_url } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Check for duplicate slug
    const { rows: existing } = await query('SELECT id FROM categories WHERE slug = $1', [slug]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'A category with this name already exists.' });
    }

    const { rows } = await query(
      'INSERT INTO categories (name, slug, description, image_url) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, slug, description || '', image_url || '']
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Create category error:', err);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Admin: Update category
router.put('/admin/:id', authenticateAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, description, image_url } = req.body;

    const { rows: existing } = await query('SELECT * FROM categories WHERE id = $1', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const current = existing[0];
    const newName = name || current.name;
    const newSlug = name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : current.slug;

    await query(
      'UPDATE categories SET name = $1, slug = $2, description = $3, image_url = $4 WHERE id = $5',
      [newName, newSlug, description !== undefined ? description : current.description, image_url !== undefined ? image_url : current.image_url, id]
    );

    const { rows: updated } = await query('SELECT * FROM categories WHERE id = $1', [id]);
    res.json(updated[0]);
  } catch (err) {
    console.error('Update category error:', err);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Admin: Delete category (with protection)
router.delete('/admin/:id', authenticateAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);

    const { rows: catRows } = await query('SELECT * FROM categories WHERE id = $1', [id]);
    if (catRows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const catName = catRows[0].name;
    const { rows: productRows } = await query(
      "SELECT count(*) as count FROM products WHERE LOWER(category) = LOWER($1)",
      [catName]
    );
    const productCount = parseInt(productRows[0].count) || 0;

    if (productCount > 0) {
      return res.status(400).json({
        error: `Cannot delete category "${catName}" — it has ${productCount} product(s). Reassign products first.`
      });
    }

    await query('DELETE FROM categories WHERE id = $1', [id]);
    res.json({ success: true, message: `Category "${catName}" deleted successfully.` });
  } catch (err) {
    console.error('Delete category error:', err);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;

