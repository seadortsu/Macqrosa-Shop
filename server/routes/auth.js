import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../database.js';
import {
  authenticateCustomer,
  authenticateAdmin,
  JWT_SECRET_CUSTOMER,
  JWT_SECRET_ADMIN
} from '../middleware/auth.js';

const router = Router();

/* =========================================================================
   CUSTOMER AUTHENTICATION
   ========================================================================= */

// Customer Registration
router.post('/customer/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'Please provide email, password, first name, and last name.' });
    }

    const { rows: existingRows } = await query('SELECT id FROM customers WHERE email = $1', [email.toLowerCase().trim()]);
    if (existingRows.length > 0) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    const now = new Date().toISOString();

    const { rows: insertRows } = await query(`
      INSERT INTO customers (email, password_hash, first_name, last_name, phone, tier, points, total_spent, orders_count, created_at)
      VALUES ($1, $2, $3, $4, $5, 'Circle Privé Member', 200, 0, 0, $6)
      RETURNING id
    `, [email.toLowerCase().trim(), passwordHash, firstName, lastName, phone || '', now]);

    const customerId = insertRows[0].id;

    // Create default address if provided
    if (req.body.address) {
      const addr = req.body.address;
      await query(`
        INSERT INTO customer_addresses (customer_id, address_line1, address_line2, city, state, postal_code, country, is_default)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 1)
      `, [customerId, addr.addressLine1 || '', addr.addressLine2 || '', addr.city || '', addr.state || '', addr.postalCode || '', addr.country || 'United States']);
    }

    const { rows: customerRows } = await query('SELECT id, email, first_name, last_name, phone, tier, points, total_spent, orders_count FROM customers WHERE id = $1', [customerId]);
    const customer = customerRows[0];
    const token = jwt.sign(
      { id: customer.id, email: customer.email, role: 'customer' },
      JWT_SECRET_CUSTOMER,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.first_name,
        lastName: customer.last_name,
        phone: customer.phone,
        tier: customer.tier,
        points: customer.points,
        totalSpent: customer.total_spent,
        ordersCount: customer.orders_count
      }
    });
  } catch (err) {
    console.error('Customer register error:', err);
    res.status(500).json({ error: 'Failed to create customer account' });
  }
});

// Customer Login
router.post('/customer/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide both email and password.' });
    }

    const { rows } = await query('SELECT * FROM customers WHERE email = $1', [email.toLowerCase().trim()]);
    const customer = rows[0];
    if (!customer) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = bcrypt.compareSync(password, customer.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: customer.id, email: customer.email, role: 'customer' },
      JWT_SECRET_CUSTOMER,
      { expiresIn: '7d' }
    );

    // Get addresses
    const { rows: addresses } = await query('SELECT * FROM customer_addresses WHERE customer_id = $1', [customer.id]);

    res.json({
      token,
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.first_name,
        lastName: customer.last_name,
        phone: customer.phone,
        tier: customer.tier,
        points: customer.points,
        totalSpent: customer.total_spent,
        ordersCount: customer.orders_count,
        addresses
      }
    });
  } catch (err) {
    console.error('Customer login error:', err);
    res.status(500).json({ error: 'Failed to authenticate customer' });
  }
});

// Customer Current Session Profile
router.get('/customer/me', authenticateCustomer, async (req, res) => {
  try {
    const { rows: customerRows } = await query('SELECT id, email, first_name, last_name, phone, tier, points, total_spent, orders_count, created_at FROM customers WHERE id = $1', [req.customer.id]);
    const customer = customerRows[0];
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const { rows: addresses } = await query('SELECT * FROM customer_addresses WHERE customer_id = $1', [customer.id]);
    const { rows: orders } = await query('SELECT * FROM orders WHERE customer_id = $1 ORDER BY created_at DESC', [customer.id]);

    res.json({
      customer: {
        id: customer.id,
        email: customer.email,
        firstName: customer.first_name,
        lastName: customer.last_name,
        phone: customer.phone,
        tier: customer.tier,
        points: customer.points,
        totalSpent: customer.total_spent,
        ordersCount: customer.orders_count,
        createdAt: customer.created_at,
        addresses,
        recentOrders: orders
      }
    });
  } catch (err) {
    console.error('Customer me error:', err);
    res.status(500).json({ error: 'Failed to retrieve profile' });
  }
});

/* =========================================================================
   ADMIN AUTHENTICATION (Completely separate from customers)
   ========================================================================= */

// Admin Login
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter staff credentials.' });
    }

    const { rows } = await query('SELECT * FROM admins WHERE email = $1', [email.toLowerCase().trim()]);
    const admin = rows[0];
    if (!admin) {
      return res.status(401).json({ error: 'Invalid administrator credentials.' });
    }

    const isMatch = bcrypt.compareSync(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid administrator credentials.' });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: 'admin', staffRole: admin.role },
      JWT_SECRET_ADMIN,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Admin authentication failed' });
  }
});

// Admin Current Session
router.get('/admin/me', authenticateAdmin, async (req, res) => {
  try {
    const { rows } = await query('SELECT id, email, name, role, created_at FROM admins WHERE id = $1', [req.admin.id]);
    const admin = rows[0];
    if (!admin) {
      return res.status(404).json({ error: 'Admin account not found' });
    }
    res.json({ admin });
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify admin status' });
  }
});

/* =========================================================================
   CUSTOMER PROFILE UPDATE
   ========================================================================= */

// Update customer profile
router.put('/customer/profile', authenticateCustomer, async (req, res) => {
  try {
    const { firstName, lastName, phone, email } = req.body;
    const customerId = req.customer.id;

    const { rows: existingRows } = await query('SELECT * FROM customers WHERE id = $1', [customerId]);
    const existing = existingRows[0];
    if (!existing) {
      return res.status(404).json({ error: 'Customer account not found' });
    }

    const newEmail = email ? email.toLowerCase().trim() : existing.email;

    // Check for email uniqueness if changing
    if (newEmail !== existing.email) {
      const { rows: dupeRows } = await query('SELECT id FROM customers WHERE email = $1 AND id != $2', [newEmail, customerId]);
      if (dupeRows.length > 0) {
        return res.status(400).json({ error: 'This email is already in use by another account.' });
      }
    }

    await query(`
      UPDATE customers SET
        first_name = $1,
        last_name = $2,
        phone = $3,
        email = $4
      WHERE id = $5
    `, [
      firstName || existing.first_name,
      lastName || existing.last_name,
      phone !== undefined ? phone : existing.phone,
      newEmail,
      customerId
    ]);

    const { rows: updatedRows } = await query('SELECT id, email, first_name, last_name, phone, tier, points, total_spent, orders_count, created_at FROM customers WHERE id = $1', [customerId]);
    const updated = updatedRows[0];

    res.json({
      customer: {
        id: updated.id,
        email: updated.email,
        firstName: updated.first_name,
        lastName: updated.last_name,
        phone: updated.phone,
        tier: updated.tier,
        points: updated.points,
        totalSpent: updated.total_spent,
        ordersCount: updated.orders_count,
        createdAt: updated.created_at
      }
    });
  } catch (err) {
    console.error('Customer profile update error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change customer password
router.put('/customer/password', authenticateCustomer, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const { rows } = await query('SELECT * FROM customers WHERE id = $1', [req.customer.id]);
    const customer = rows[0];
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const isMatch = bcrypt.compareSync(currentPassword, customer.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const newHash = bcrypt.hashSync(newPassword, salt);
    await query('UPDATE customers SET password_hash = $1 WHERE id = $2', [newHash, req.customer.id]);

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Customer password change error:', err);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Customer address management
router.post('/customer/addresses', authenticateCustomer, async (req, res) => {
  try {
    const { addressLine1, addressLine2, city, state, postalCode, country, isDefault } = req.body;
    if (!addressLine1 || !city || !state || !postalCode) {
      return res.status(400).json({ error: 'Address line 1, city, state, and postal code are required.' });
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await query('UPDATE customer_addresses SET is_default = 0 WHERE customer_id = $1', [req.customer.id]);
    }

    const { rows } = await query(`
      INSERT INTO customer_addresses (customer_id, address_line1, address_line2, city, state, postal_code, country, is_default)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [req.customer.id, addressLine1, addressLine2 || '', city, state, postalCode, country || 'United States', isDefault ? 1 : 0]);

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Add address error:', err);
    res.status(500).json({ error: 'Failed to add address' });
  }
});

router.put('/customer/addresses/:id', authenticateCustomer, async (req, res) => {
  try {
    const addressId = Number(req.params.id);
    const { addressLine1, addressLine2, city, state, postalCode, country, isDefault } = req.body;

    // Verify ownership
    const { rows: addrRows } = await query('SELECT * FROM customer_addresses WHERE id = $1 AND customer_id = $2', [addressId, req.customer.id]);
    if (addrRows.length === 0) {
      return res.status(404).json({ error: 'Address not found.' });
    }

    if (isDefault) {
      await query('UPDATE customer_addresses SET is_default = 0 WHERE customer_id = $1', [req.customer.id]);
    }

    await query(`
      UPDATE customer_addresses SET
        address_line1 = $1, address_line2 = $2, city = $3, state = $4,
        postal_code = $5, country = $6, is_default = $7
      WHERE id = $8
    `, [
      addressLine1 || addrRows[0].address_line1,
      addressLine2 !== undefined ? addressLine2 : addrRows[0].address_line2,
      city || addrRows[0].city,
      state || addrRows[0].state,
      postalCode || addrRows[0].postal_code,
      country || addrRows[0].country,
      isDefault ? 1 : addrRows[0].is_default,
      addressId
    ]);

    const { rows: updated } = await query('SELECT * FROM customer_addresses WHERE id = $1', [addressId]);
    res.json(updated[0]);
  } catch (err) {
    console.error('Update address error:', err);
    res.status(500).json({ error: 'Failed to update address' });
  }
});

router.delete('/customer/addresses/:id', authenticateCustomer, async (req, res) => {
  try {
    const addressId = Number(req.params.id);
    const { rows } = await query('SELECT * FROM customer_addresses WHERE id = $1 AND customer_id = $2', [addressId, req.customer.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Address not found.' });
    }
    await query('DELETE FROM customer_addresses WHERE id = $1', [addressId]);
    res.json({ success: true, message: 'Address removed.' });
  } catch (err) {
    console.error('Delete address error:', err);
    res.status(500).json({ error: 'Failed to delete address' });
  }
});

/* =========================================================================
   ADMIN PROFILE UPDATE
   ========================================================================= */

// Update admin profile
router.put('/admin/profile', authenticateAdmin, async (req, res) => {
  try {
    const { name, email } = req.body;
    const adminId = req.admin.id;

    const { rows: existingRows } = await query('SELECT * FROM admins WHERE id = $1', [adminId]);
    const existing = existingRows[0];
    if (!existing) {
      return res.status(404).json({ error: 'Admin account not found' });
    }

    const newEmail = email ? email.toLowerCase().trim() : existing.email;
    if (newEmail !== existing.email) {
      const { rows: dupeRows } = await query('SELECT id FROM admins WHERE email = $1 AND id != $2', [newEmail, adminId]);
      if (dupeRows.length > 0) {
        return res.status(400).json({ error: 'This email is already in use.' });
      }
    }

    await query('UPDATE admins SET name = $1, email = $2 WHERE id = $3', [
      name || existing.name,
      newEmail,
      adminId
    ]);

    const { rows: updated } = await query('SELECT id, email, name, role, created_at FROM admins WHERE id = $1', [adminId]);
    res.json({ admin: updated[0] });
  } catch (err) {
    console.error('Admin profile update error:', err);
    res.status(500).json({ error: 'Failed to update admin profile' });
  }
});

// Change admin password
router.put('/admin/password', authenticateAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters.' });
    }

    const { rows } = await query('SELECT * FROM admins WHERE id = $1', [req.admin.id]);
    const admin = rows[0];
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    const isMatch = bcrypt.compareSync(currentPassword, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const newHash = bcrypt.hashSync(newPassword, salt);
    await query('UPDATE admins SET password_hash = $1 WHERE id = $2', [newHash, req.admin.id]);

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Admin password change error:', err);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

export default router;

