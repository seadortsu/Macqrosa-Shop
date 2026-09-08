import jwt from 'jsonwebtoken';

export const JWT_SECRET_CUSTOMER = process.env.JWT_SECRET_CUSTOMER || 'macqrosa_customer_secret_key_2026';
export const JWT_SECRET_ADMIN = process.env.JWT_SECRET_ADMIN || 'macqrosa_admin_secret_key_2026';

export function authenticateCustomer(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Customer authorization required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET_CUSTOMER);
    if (decoded.role !== 'customer') {
      return res.status(403).json({ error: 'Access forbidden: Customer account required' });
    }
    req.customer = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired customer session' });
  }
}

export function optionalCustomer(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET_CUSTOMER);
    if (decoded.role === 'customer') {
      req.customer = decoded;
    }
  } catch (e) {
    // Ignore invalid token for optional auth
  }
  next();
}

export function authenticateAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Admin authorization required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET_ADMIN);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Access forbidden: Admin credentials required' });
    }
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired admin session' });
  }
}

/**
 * Super-admin gate. Must be used AFTER authenticateAdmin.
 * Restricts access to only users with staffRole === 'super_admin'.
 */
export function authenticateSuperAdmin(req, res, next) {
  if (!req.admin) {
    return res.status(401).json({ error: 'Admin authorization required' });
  }

  if (req.admin.staffRole !== 'super_admin') {
    return res.status(403).json({ error: 'Access restricted to super administrators only.' });
  }

  next();
}
