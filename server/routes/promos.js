import { Router } from 'express';
import { query } from '../database.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/promos/validate
 * Public endpoint to validate promo code for customer cart/checkout
 */
router.post('/validate', async (req, res) => {
  const { code, subtotal } = req.body;

  if (!code) {
    return res.status(400).json({ valid: false, error: 'Promo code is required.' });
  }

  const cleanCode = code.trim().toUpperCase();
  const { rows } = await query(
    'SELECT * FROM promo_codes WHERE UPPER(code) = $1 AND is_active = 1',
    [cleanCode]
  );

  if (!rows || rows.length === 0) {
    return res.status(404).json({ valid: false, error: 'Invalid or inactive promo code.' });
  }

  const promo = rows[0];

  // Check expiration date
  if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
    return res.status(400).json({ valid: false, error: 'This promo code has expired.' });
  }

  // Check max uses
  if (promo.max_uses && promo.uses_count >= promo.max_uses) {
    return res.status(400).json({ valid: false, error: 'This promo code has reached its redemption limit.' });
  }

  // Check minimum spend
  const cartSubtotal = parseFloat(subtotal) || 0;
  const minSpend = parseFloat(promo.min_spend) || 0;
  if (cartSubtotal < minSpend) {
    return res.status(400).json({
      valid: false,
      error: `This promo requires a minimum purchase of $${minSpend.toFixed(2)}.`
    });
  }

  // Calculate discount amount
  let discountAmount = 0;
  const discountVal = parseFloat(promo.discount_value);
  if (promo.discount_type === 'percentage') {
    discountAmount = (cartSubtotal * discountVal) / 100;
  } else {
    discountAmount = Math.min(cartSubtotal, discountVal);
  }

  res.json({
    valid: true,
    id: promo.id,
    code: promo.code,
    discountType: promo.discount_type,
    discountValue: discountVal,
    discountAmount: Math.round(discountAmount * 100) / 100,
    minSpend: minSpend
  });
});

/**
 * GET /api/admin/promos
 * List all promo codes
 */
router.get('/admin', authenticateAdmin, async (req, res) => {
  const { rows } = await query('SELECT * FROM promo_codes ORDER BY id DESC');
  res.json(rows);
});

/**
 * POST /api/admin/promos
 * Create a new promo code
 */
router.post('/admin', authenticateAdmin, async (req, res) => {
  const { code, discount_type, discount_value, min_spend, expires_at, max_uses, is_active } = req.body;

  if (!code || !discount_type || discount_value === undefined) {
    return res.status(400).json({ error: 'Code, discount type, and discount value are required.' });
  }

  const cleanCode = code.trim().toUpperCase();
  const existing = await query('SELECT id FROM promo_codes WHERE UPPER(code) = $1', [cleanCode]);
  if (existing.rows.length > 0) {
    return res.status(400).json({ error: `Promo code "${cleanCode}" already exists.` });
  }

  const result = await query(`
    INSERT INTO promo_codes (code, discount_type, discount_value, min_spend, expires_at, max_uses, is_active)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `, [
    cleanCode,
    discount_type,
    parseFloat(discount_value) || 0,
    parseFloat(min_spend) || 0,
    expires_at || null,
    max_uses ? parseInt(max_uses) : null,
    is_active !== undefined ? (is_active ? 1 : 0) : 1
  ]);

  res.status(201).json(result.rows[0]);
});

/**
 * PUT /api/admin/promos/:id
 * Edit or toggle promo code
 */
router.put('/admin/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const { code, discount_type, discount_value, min_spend, expires_at, max_uses, is_active } = req.body;

  const existing = await query('SELECT * FROM promo_codes WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    return res.status(404).json({ error: 'Promo code not found.' });
  }

  const current = existing.rows[0];
  const newCode = code ? code.trim().toUpperCase() : current.code;

  if (code && newCode !== current.code) {
    const duplicate = await query('SELECT id FROM promo_codes WHERE UPPER(code) = $1 AND id != $2', [newCode, id]);
    if (duplicate.rows.length > 0) {
      return res.status(400).json({ error: `Promo code "${newCode}" is already in use.` });
    }
  }

  await query(`
    UPDATE promo_codes
    SET code = $1,
        discount_type = $2,
        discount_value = $3,
        min_spend = $4,
        expires_at = $5,
        max_uses = $6,
        is_active = $7
    WHERE id = $8
  `, [
    newCode,
    discount_type || current.discount_type,
    discount_value !== undefined ? parseFloat(discount_value) : current.discount_value,
    min_spend !== undefined ? parseFloat(min_spend) : current.min_spend,
    expires_at !== undefined ? (expires_at || null) : current.expires_at,
    max_uses !== undefined ? (max_uses ? parseInt(max_uses) : null) : current.max_uses,
    is_active !== undefined ? (is_active ? 1 : 0) : current.is_active,
    id
  ]);

  const updated = await query('SELECT * FROM promo_codes WHERE id = $1', [id]);
  res.json(updated.rows[0]);
});

/**
 * DELETE /api/admin/promos/:id
 * Delete a promo code
 */
router.delete('/admin/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  await query('DELETE FROM promo_codes WHERE id = $1', [id]);
  res.json({ success: true, message: 'Promo code removed successfully.' });
});

export default router;
