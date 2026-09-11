-- =========================================================================
-- MACQROSA LUXURY ATELIER — SUPABASE POSTGRESQL SCHEMA & INITIAL DATA
-- =========================================================================

-- 1. Categories
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT
);

-- 2. Products
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  discipline TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  compare_at_price NUMERIC(10,2),
  rating NUMERIC(3,2) DEFAULT 4.9,
  reviews_count INTEGER DEFAULT 0,
  description TEXT NOT NULL,
  benefits TEXT,
  ingredients TEXT,
  sensorial_fragrance TEXT,
  sensorial_texture TEXT,
  sensorial_finish TEXT,
  clinical_metric_1_val TEXT,
  clinical_metric_1_lbl TEXT,
  clinical_metric_2_val TEXT,
  clinical_metric_2_lbl TEXT,
  volume TEXT,
  stock INTEGER NOT NULL DEFAULT 50,
  image_url TEXT NOT NULL,
  gallery_json TEXT,
  shades_json TEXT,
  is_featured INTEGER DEFAULT 0,
  is_bestseller INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Customers
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  tier TEXT DEFAULT 'Circle Privé Member',
  points INTEGER DEFAULT 450,
  total_spent NUMERIC(10,2) DEFAULT 0,
  orders_count INTEGER DEFAULT 0,
  reset_token TEXT,
  reset_token_expires TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. Customer Addresses
CREATE TABLE IF NOT EXISTS customer_addresses (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'United States',
  is_default INTEGER DEFAULT 1
);

-- 5. Admins
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'super_admin',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. Orders
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  shipping_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax NUMERIC(10,2) NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'paid',
  payment_reference TEXT,
  tracking_number TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER,
  product_title TEXT NOT NULL,
  product_price NUMERIC(10,2) NOT NULL,
  quantity INTEGER NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  image_url TEXT
);

-- 8. Inventory Logs
CREATE TABLE IF NOT EXISTS inventory_logs (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_title TEXT NOT NULL,
  change_amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  logged_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_tier TEXT DEFAULT 'Circle Privé',
  rating INTEGER NOT NULL,
  title TEXT NOT NULL,
  comment TEXT NOT NULL,
  verified_purchase INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 10. Site Settings
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 11. Promo Codes
CREATE TABLE IF NOT EXISTS promo_codes (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL,
  discount_value NUMERIC(10,2) NOT NULL,
  min_spend NUMERIC(10,2) DEFAULT 0,
  expires_at TIMESTAMPTZ,
  max_uses INTEGER,
  uses_count INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 12. Product Variants
CREATE TABLE IF NOT EXISTS product_variants (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT,
  variant_label TEXT NOT NULL,
  variant_type TEXT NOT NULL DEFAULT 'size',
  price_modifier NUMERIC(10,2) DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  is_default INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 13. Notification Templates
CREATE TABLE IF NOT EXISTS notification_templates (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'email',
  subject TEXT,
  body TEXT NOT NULL,
  is_default INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 14. Notification Logs
CREATE TABLE IF NOT EXISTS notification_logs (
  id SERIAL PRIMARY KEY,
  template_id INTEGER REFERENCES notification_templates(id),
  channel TEXT NOT NULL,
  recipient TEXT NOT NULL,
  subject TEXT,
  body_preview TEXT,
  status TEXT DEFAULT 'sent',
  sent_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 15. Media
CREATE TABLE IF NOT EXISTS media (
  id SERIAL PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  alt_text TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 16. Menus
CREATE TABLE IF NOT EXISTS menus (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  handle TEXT UNIQUE NOT NULL,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 17. Menu Items
CREATE TABLE IF NOT EXISTS menu_items (
  id SERIAL PRIMARY KEY,
  menu_id INTEGER NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
  parent_id INTEGER REFERENCES menu_items(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  url TEXT,
  target TEXT DEFAULT '_self',
  order_index INTEGER DEFAULT 0,
  show_desktop INTEGER DEFAULT 1,
  show_tablet INTEGER DEFAULT 1,
  show_mobile INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 18. Pages
CREATE TABLE IF NOT EXISTS pages (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content_blocks TEXT,
  meta_title TEXT,
  meta_description TEXT,
  status TEXT DEFAULT 'published',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for optimal performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_discipline ON products(discipline);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
