import 'dotenv/config';
import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';

import { initDatabase, query } from './database.js';
import logger from './logger.js';

import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import categoryRoutes from './routes/categories.js';
import orderRoutes from './routes/orders.js';
import inventoryRoutes from './routes/inventory.js';
import customerRoutes from './routes/customers.js';
import analyticsRoutes from './routes/analytics.js';
import paymentRoutes from './routes/payments.js';
import uploadRoutes from './routes/upload.js';
import settingsRoutes from './routes/settings.js';
import promoRoutes from './routes/promos.js';
import adminUserRoutes from './routes/adminUsers.js';
import notificationRoutes from './routes/notifications.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize database & seed luxury catalog
// Wrapped in async IIFE for Passenger compatibility (no top-level await)
(async () => {
  await initDatabase();
  logger.info('Database initialized and verified with seed data.');
})();

/* =========================================================================
   SECURITY & MIDDLEWARE
   ========================================================================= */

// Helmet — Secure HTTP headers
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for SPA compatibility
  crossOriginEmbedderPolicy: false,
}));

// CORS
app.use(cors());

// Body parsing
app.use(express.json({ limit: '10mb' }));

// Morgan HTTP request logging piped to Winston
app.use(morgan('short', {
  stream: {
    write: (message) => logger.http(message.trim())
  }
}));

// Rate limiter — Auth endpoints (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: 'Too many authentication attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter — General API (lenient)
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 120,
  message: { error: 'Rate limit exceeded. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/* =========================================================================
   API ROUTES
   ========================================================================= */

// Apply rate limiters
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/payments', apiLimiter, paymentRoutes);

// Standard API routes
app.use('/api/products', apiLimiter, productRoutes);
app.use('/api/categories', apiLimiter, categoryRoutes);
app.use('/api/orders', apiLimiter, orderRoutes);
app.use('/api/admin/inventory', apiLimiter, inventoryRoutes);
app.use('/api/admin/customers', apiLimiter, customerRoutes);
app.use('/api/admin/analytics', apiLimiter, analyticsRoutes);
app.use('/api/settings', apiLimiter, settingsRoutes);
app.use('/api/promos', apiLimiter, promoRoutes);
app.use('/api/admin/promos', apiLimiter, promoRoutes);
app.use('/api/admin/users', apiLimiter, adminUserRoutes);
app.use('/api/admin/notifications', apiLimiter, notificationRoutes);
app.use('/api/upload', uploadRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Macqrosa Luxury Atelier Backend',
    timestamp: new Date().toISOString()
  });
});

/* =========================================================================
   SEO — Dynamic Meta-Tag Injection for Crawlers
   ========================================================================= */

const distPath = path.join(__dirname, '../dist');
const publicPath = path.join(__dirname, '../public');

// Serve static assets
app.use('/images', express.static(path.join(publicPath, 'images')));
app.use(express.static(distPath));

// SEO meta injection for product and category pages
app.get('*', async (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api')) {
    return next();
  }

  const indexPath = path.join(distPath, 'index.html');

  // Check if dist/index.html exists (production build)
  if (!fs.existsSync(indexPath)) {
    return res.status(200).send('Macqrosa Backend API active. Run the Vite frontend dev server at port 5173.');
  }

  let html = fs.readFileSync(indexPath, 'utf-8');

  try {
    // Product page: /product/:slug
    const productMatch = req.path.match(/^\/product\/([a-z0-9-]+)$/);
    if (productMatch) {
      const slug = productMatch[1];
      const { rows } = await query('SELECT title, subtitle, description, image_url, price FROM products WHERE slug = $1', [slug]);
      const product = rows[0];

      if (product) {
        const metaTags = `
          <title>${product.title} — Macqrosa</title>
          <meta name="description" content="${(product.subtitle || product.description).substring(0, 160)}" />
          <meta property="og:title" content="${product.title} — Macqrosa" />
          <meta property="og:description" content="${(product.subtitle || product.description).substring(0, 160)}" />
          <meta property="og:image" content="${product.image_url}" />
          <meta property="og:type" content="product" />
          <meta property="product:price:amount" content="${product.price}" />
          <meta property="product:price:currency" content="GHS" />
        `;
        html = html.replace('</head>', `${metaTags}</head>`);
      }
    }

    // Catalog page: /catalog
    if (req.path === '/catalog' || req.path.startsWith('/catalog')) {
      const metaTags = `
        <title>Luxury Collection — Macqrosa</title>
        <meta name="description" content="Explore the complete Macqrosa luxury skincare, complexion, fragrance, and gifting collection. Rare French botanicals and 24K gold-infused formulations." />
        <meta property="og:title" content="Luxury Collection — Macqrosa" />
        <meta property="og:description" content="Explore the complete Macqrosa luxury collection." />
      `;
      html = html.replace('</head>', `${metaTags}</head>`);
    }
  } catch (err) {
    logger.error('SEO meta injection error', { error: err.message, path: req.path });
  }

  res.send(html);
});

/* =========================================================================
   CENTRALIZED ERROR HANDLER
   ========================================================================= */

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
  });

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred. Please try again.'
      : err.message,
  });
});

/* =========================================================================
   START SERVER
   ========================================================================= */

// Start server (Phusion Passenger hooks into listen(), and standalone uses PORT)
app.listen(PORT, () => {
  logger.info(`✨ Macqrosa API Server running on http://localhost:${PORT}`);
});

// Export app for Passenger entry point (app.js)
export default app;
