import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../database.js';
import { authenticateAdmin } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/admin/users
 * List all admin/staff users
 */
router.get('/', authenticateAdmin, async (req, res) => {
  const { rows } = await query(`
    SELECT id, email, name, role, created_at
    FROM admins
    ORDER BY id ASC
  `);
  res.json(rows);
});

/**
 * POST /api/admin/users
 * Add a new staff/admin member
 */
router.post('/', authenticateAdmin, async (req, res) => {
  const { email, password, name, role } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const existing = await query('SELECT id FROM admins WHERE LOWER(email) = $1', [cleanEmail]);
  if (existing.rows.length > 0) {
    return res.status(400).json({ error: 'An admin account with this email already exists.' });
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);
  const userRole = role || 'store_manager';

  const result = await query(`
    INSERT INTO admins (email, password_hash, name, role, created_at)
    VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
    RETURNING id, email, name, role, created_at
  `, [cleanEmail, passwordHash, name.trim(), userRole]);

  res.status(201).json(result.rows[0]);
});

/**
 * PUT /api/admin/users/:id
 * Update staff/admin details or password
 */
router.put('/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, email, role, password } = req.body;

  const existing = await query('SELECT * FROM admins WHERE id = $1', [id]);
  if (existing.rows.length === 0) {
    return res.status(404).json({ error: 'Admin account not found.' });
  }

  const current = existing.rows[0];
  const newEmail = email ? email.trim().toLowerCase() : current.email;

  if (email && newEmail !== current.email) {
    const duplicate = await query('SELECT id FROM admins WHERE LOWER(email) = $1 AND id != $2', [newEmail, id]);
    if (duplicate.rows.length > 0) {
      return res.status(400).json({ error: 'This email is already in use by another admin.' });
    }
  }

  let passwordHash = current.password_hash;
  if (password && password.trim()) {
    const salt = bcrypt.genSaltSync(10);
    passwordHash = bcrypt.hashSync(password.trim(), salt);
  }

  await query(`
    UPDATE admins
    SET name = $1,
        email = $2,
        role = $3,
        password_hash = $4
    WHERE id = $5
  `, [
    name ? name.trim() : current.name,
    newEmail,
    role || current.role,
    passwordHash,
    id
  ]);

  const updated = await query('SELECT id, email, name, role, created_at FROM admins WHERE id = $1', [id]);
  res.json(updated.rows[0]);
});

/**
 * DELETE /api/admin/users/:id
 * Remove a staff member (prevent removing self or sole super_admin)
 */
router.delete('/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;

  if (req.admin && req.admin.id === parseInt(id)) {
    return res.status(400).json({ error: 'You cannot delete your own admin account.' });
  }

  const countRes = await query('SELECT count(*) as count FROM admins WHERE role = $1', ['super_admin']);
  const targetUser = await query('SELECT role FROM admins WHERE id = $1', [id]);

  if (targetUser.rows.length === 0) {
    return res.status(404).json({ error: 'Admin user not found.' });
  }

  if (targetUser.rows[0].role === 'super_admin' && parseInt(countRes.rows[0].count) <= 1) {
    return res.status(400).json({ error: 'Cannot delete the only remaining Super Admin account.' });
  }

  await query('DELETE FROM admins WHERE id = $1', [id]);
  res.json({ success: true, message: 'Admin user removed successfully.' });
});

export default router;
