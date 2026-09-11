import { Router } from 'express';
import { query } from '../database.js';
import { authenticateAdmin } from '../middleware/auth.js';
import logger from '../logger.js';

const router = Router();

// GET all pages
router.get('/', async (req, res) => {
  try {
    const { rows } = await query('SELECT id, title, slug, status, created_at, updated_at FROM pages');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pages' });
  }
});

// GET single page by slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM pages WHERE slug = $1 AND status = $2', [req.params.slug, 'published']);
    if (rows.length === 0) return res.status(404).json({ error: 'Page not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch page' });
  }
});

// GET single page by id for admin
router.get('/admin/:id', authenticateAdmin, async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM pages WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Page not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch page' });
  }
});

// POST new page
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { title, slug, content_blocks, meta_title, meta_description, status } = req.body;
    const { rows } = await query(`
      INSERT INTO pages (title, slug, content_blocks, meta_title, meta_description, status)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
    `, [title, slug, content_blocks, meta_title, meta_description, status || 'draft']);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create page' });
  }
});

// PUT update page
router.put('/:id', authenticateAdmin, async (req, res) => {
  try {
    const { title, slug, content_blocks, meta_title, meta_description, status } = req.body;
    const { rows } = await query(`
      UPDATE pages 
      SET title = $1, slug = $2, content_blocks = $3, meta_title = $4, meta_description = $5, status = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $7 RETURNING *
    `, [title, slug, content_blocks, meta_title, meta_description, status, req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update page' });
  }
});

// DELETE page
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    await query('DELETE FROM pages WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete page' });
  }
});

export default router;
