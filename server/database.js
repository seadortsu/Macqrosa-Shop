import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve DB path relative to this file so it works under cPanel Passenger
const dbPath = path.join(__dirname, 'macqrosa.db');
const db = new Database(dbPath);



/**
 * Helper: run a query through the shared pool.
 * Convenience wrapper so route files can do:
 *   const { rows } = await query('SELECT ...', [param])
 */
export function query(text, params = []) {
  return new Promise((resolve, reject) => {
    try {
      const sqliteText = text.replace(/\$\d+/g, '?');
      const stmt = db.prepare(sqliteText);
      const isSelect = sqliteText.trim().toUpperCase().startsWith('SELECT');
      const isReturning = sqliteText.toUpperCase().includes('RETURNING');
      
      if (isSelect || isReturning) {
        const rows = stmt.all(...params);
        resolve({ rows });
      } else {
        const result = stmt.run(...params);
        resolve({ rowCount: result.changes });
      }
    } catch (err) {
      reject(err);
    }
  });
}

export const pool = {
  connect: async () => ({
    query: query,
    release: () => {}
  })
};

/* =========================================================================
   DATABASE INITIALIZATION — PostgreSQL
   ========================================================================= */

export async function initDatabase() {
  try {
    // Create tables (PostgreSQL syntax)
    db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        description TEXT,
        image_url TEXT
      );

      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        phone TEXT,
        tier TEXT DEFAULT 'Circle Privé Member',
        points INTEGER DEFAULT 450,
        total_spent NUMERIC(10,2) DEFAULT 0,
        orders_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS customer_addresses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
        address_line1 TEXT NOT NULL,
        address_line2 TEXT,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        postal_code TEXT NOT NULL,
        country TEXT NOT NULL DEFAULT 'United States',
        is_default INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'super_admin',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER,
        product_title TEXT NOT NULL,
        product_price NUMERIC(10,2) NOT NULL,
        quantity INTEGER NOT NULL,
        total_price NUMERIC(10,2) NOT NULL,
        image_url TEXT
      );

      CREATE TABLE IF NOT EXISTS inventory_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        product_title TEXT NOT NULL,
        change_amount INTEGER NOT NULL,
        reason TEXT NOT NULL,
        previous_stock INTEGER NOT NULL,
        new_stock INTEGER NOT NULL,
        logged_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        customer_name TEXT NOT NULL,
        customer_tier TEXT DEFAULT 'Circle Privé',
        rating INTEGER NOT NULL,
        title TEXT NOT NULL,
        comment TEXT NOT NULL,
        verified_purchase INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS site_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS promo_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        discount_type TEXT NOT NULL,
        discount_value NUMERIC(10,2) NOT NULL,
        min_spend NUMERIC(10,2) DEFAULT 0,
        expires_at DATETIME,
        max_uses INTEGER,
        uses_count INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS product_variants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        sku TEXT,
        variant_label TEXT NOT NULL,
        variant_type TEXT NOT NULL DEFAULT 'size',
        price_modifier NUMERIC(10,2) DEFAULT 0,
        stock INTEGER NOT NULL DEFAULT 0,
        image_url TEXT,
        is_default INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS notification_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        channel TEXT NOT NULL DEFAULT 'email',
        subject TEXT,
        body TEXT NOT NULL,
        is_default INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS notification_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        template_id INTEGER REFERENCES notification_templates(id),
        channel TEXT NOT NULL,
        recipient TEXT NOT NULL,
        subject TEXT,
        body_preview TEXT,
        status TEXT DEFAULT 'sent',
        sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Seed initial data if tables are empty
    await seedInitialData();
  } catch (err) {
    console.error('Error initializing database:', err);
    throw err;
  }
}

/* =========================================================================
   SEED DATA
   ========================================================================= */

async function seedInitialData() {
  // ----- Admins & Customers -----
  const { rows: adminRows } = await query('SELECT count(*) as count FROM admins');
  if (parseInt(adminRows[0].count) === 0) {
    const salt = bcrypt.genSaltSync(10);
    const adminHash = bcrypt.hashSync('admin123', salt);

    await query(`
      INSERT INTO admins (email, password_hash, name, role, created_at)
      VALUES ($1, $2, $3, $4, $5)
    `, ['admin@macqrosa.com', adminHash, 'Claire Sinclair', 'super_admin', new Date().toISOString()]);

    const customerHash = bcrypt.hashSync('customer123', salt);
    const custRes = await query(`
      INSERT INTO customers (email, password_hash, first_name, last_name, phone, tier, points, total_spent, orders_count, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `, ['claire@vendome.com', customerHash, 'Claire', 'Sinclair', '+1 (555) 839-2910', 'Circle Privé Member', 1250, 945.00, 3, new Date(Date.now() - 30 * 86400000).toISOString()]);

    const customerId = custRes.rows[0].id;
    await query(`
      INSERT INTO customer_addresses (customer_id, address_line1, address_line2, city, state, postal_code, country, is_default)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 1)
    `, [customerId, '740 Park Avenue', 'Apt 12B', 'New York', 'NY', '10021', 'United States']);
  }

  // ----- Categories -----
  const { rows: catRows } = await query('SELECT count(*) as count FROM categories');
  if (parseInt(catRows[0].count) === 0) {
    const categories = [
      { name: 'Skincare', slug: 'skincare', description: 'Rare French botanical extracts and cellular regenerative formulas.', image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBtWSnePUN2J9jOyuNAbWYmze1a_u1s1Ho1ZjaCa71ZxzDk3d4LZfuPXyZZgHQGkJDreFrYo2y1YHE1aXJRep4rEILl7aQA-Cqu803quIb75M0akh9qkuzYb6f5T9zJwIRFS1JJ8l-1rYa_I1OhHNgxkyqslwY3R1fob_bG408pPy19UF3r6wTwxzwzCAINbgK8iaER0NqxhGyMb8eMyNBjk4kT8_qbpy4EFIlb57ojKK84cZkjJTd7cw' },
      { name: 'Complexion', slug: 'complexion', description: 'Liquid velvet foundations, luminous skin tints, and micro-milled finishing veils.', image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB2yKkW3_9w2G5mJ_nL4Xw9PqC5Y6m9A4z6e_0k6aQ2y-D-u6zWjX1rN5tY' },
      { name: 'Lips & Eyes', slug: 'lips-and-eyes', description: 'Saturated pigment elixirs and 24K infused glosses for timeless elegance.', image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD_Rs5s3PkFbjqZOWcihHCxuWDliuVh8-2Z-RraGhSQ-PF6ErQuLyUBMWnIBKX-pF33_Y-o0W6NurXDh_tuXWys6F_3QP-npaFuGPGt0e02DfqsMcfsIuvj4yEvNqAs5ikCH_XXF8ao7JpbvclVO8baHP7yO7d04JJR17IpmUmWVcgwjgV1_rYXgSVeq2IHFoEwU3T-elagdIniE38NDaplsOXsn_hi_1OzDkpbvjztDS3HyhOVPM3mjw' },
      { name: 'Fragrance', slug: 'fragrance', description: 'High-concentration extraits de parfum crafted with Grasse harvest florals.', image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCq1W3_e1r9N_2vY5o_8xL4kQ6p0sM-7zW3jX1rN5tY' },
      { name: 'Gifting Atelier', slug: 'gifting-atelier', description: 'Bespoke vanity coffrets, curated discovery sets, and Place Vendôme wax-sealed editions.', image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDtWSnePUN2J9jOyuNAbWYmze1a_u1s1Ho1' }
    ];

    for (const c of categories) {
      await query(
        'INSERT INTO categories (name, slug, description, image_url) VALUES ($1, $2, $3, $4)',
        [c.name, c.slug, c.description, c.image_url]
      );
    }
  }

  // ----- Products -----
  const products = [
      {
        title: "L'Éclat d'Or 24K Radiant Youth Infusion",
        subtitle: "The Signature Cellular Nectar",
        slug: "leclat-dor-24k-radiant-youth-infusion",
        category: "Skincare",
        discipline: "Skincare",
        price: 265.00,
        compare_at_price: 295.00,
        rating: 4.98,
        reviews_count: 142,
        description: "Sculpted with rare French alpine bio-actives and pure 24-karat colloidal gold suspension. Engineered for an indelible, skin-whispered radiance that transcends time.",
        benefits: "Stimulates deep collagen synthesis, imparts instantaneous luminous gold reflection, restores compromised moisture barriers, and refines dermal texture.",
        ingredients: "Pure 24K Colloidal Bio-Gold, French Alpine Edelweiss Meristem Cell Extract, Hydrolyzed Hyaluronic Spheres, Grasse Rose Hydrosol, Cold-Pressed Squalane, Niacinamide 5%.",
        sensorial_fragrance: "Subtle notes of Grasse May Rose, Sun-Warmed Bergamot & White Amber",
        sensorial_texture: "Silk-velvet nectar that absorbs weightlessly into the epidermis",
        sensorial_finish: "Instant candlelit luminescence with zero tacky residue",
        clinical_metric_1_val: "99.4%",
        clinical_metric_1_lbl: "Noted Visible Increase in Cellular Radiance",
        clinical_metric_2_val: "96.8%",
        clinical_metric_2_lbl: "Demonstrated Marked Reduction in Fine Expression Lines",
        volume: "50 ml / 1.7 fl. oz.",
        stock: 38,
        image_url: "/images/products/leclat_dor.jpg",
        gallery_json: JSON.stringify(["/images/products/leclat_dor.jpg", "/images/hero/hero_banner.jpg"]),
        shades_json: JSON.stringify([]),
        is_featured: 1,
        is_bestseller: 1
      },
      {
        title: "Crème Sublime Régénérante",
        subtitle: "Intensive Cellular Rejuvenation Balm",
        slug: "creme-sublime-regenerante",
        category: "Skincare",
        discipline: "Skincare",
        price: 320.00,
        compare_at_price: null,
        rating: 4.95,
        reviews_count: 89,
        description: "An opulent rich cream harnessing cold-plasma extracted black orchid polyphenols. Melts upon contact to deliver continuous 72-hour moisture cushion and cellular density.",
        benefits: "Visibly lifts contour lines, envelops skin in a velvety restorative seal, and neutralizes oxidative stress.",
        ingredients: "Black Orchid Cryo-Polyphenols, Bio-identical Ceramide Complex (NP, AP, EOP), Marine Collagen Peptides, Shea Butter Nilotica, 24K Gold Leaf Micro-particles.",
        sensorial_fragrance: "Warm Bourbon Vanilla, White Heliotrope, Cedarwood",
        sensorial_texture: "Rich whipped butter transforming into liquid satin",
        sensorial_finish: "Velveteen dewy cushion with firming veil",
        clinical_metric_1_val: "98.2%",
        clinical_metric_1_lbl: "Reported Immediate Barrier Restoration",
        clinical_metric_2_val: "94.5%",
        clinical_metric_2_lbl: "Measured Increase in Elasticity After 21 Days",
        volume: "60 ml / 2.0 fl. oz.",
        stock: 24,
        image_url: "/images/products/creme_sublime.jpg",
        gallery_json: JSON.stringify(["/images/products/creme_sublime.jpg"]),
        shades_json: JSON.stringify([]),
        is_featured: 1,
        is_bestseller: 1
      },
      {
        title: "Sérum Luminescence Botanique",
        subtitle: "Phyto-Retinol Radiance Correcting Nectar",
        slug: "serum-luminescence-botanique",
        category: "Skincare",
        discipline: "Skincare",
        price: 195.00,
        compare_at_price: 215.00,
        rating: 4.91,
        reviews_count: 64,
        description: "A gentle alternative to synthetic retinoids, blending cold-pressed bakuchiol with sea fennel extracts. Polishes uneven pigmentation without sensitizing the skin barrier.",
        benefits: "Fades hyperpigmentation, smooths uneven skin texture, and enhances cellular turnover without redness.",
        ingredients: "Pure Organic Bakuchiol 2%, Crithmum Maritimum Extract, Ascorbyl Tetraisopalmitate (Lipophilic Vitamin C), Ferulic Acid.",
        sensorial_fragrance: "Herbaceous Crushed Leaves, Green Mandarin, Neroli Petals",
        sensorial_texture: "Weightless bi-phase liquid elixir",
        sensorial_finish: "Silky matte radiance",
        clinical_metric_1_val: "92.7%",
        clinical_metric_1_lbl: "Observed Even Tone and Clarity in 14 Days",
        clinical_metric_2_val: "100%",
        clinical_metric_2_lbl: "Experienced Zero Peeling or Irritation",
        volume: "30 ml / 1.0 fl. oz.",
        stock: 8,
        image_url: "/images/products/serum_luminescence.jpg",
        gallery_json: JSON.stringify(["/images/products/serum_luminescence.jpg"]),
        shades_json: JSON.stringify([]),
        is_featured: 1,
        is_bestseller: 1
      },
      {
        title: "Teint Soyeux Voile Parfait",
        subtitle: "Luminous Silk Fluid Foundation SPF 30",
        slug: "teint-soyeux-voile-parfait",
        category: "Complexion",
        discipline: "Complexion",
        price: 135.00,
        compare_at_price: null,
        rating: 4.88,
        reviews_count: 112,
        description: "An ultra-fluid complexion veil infused with microscopic light-refracting pearls. Seamlessly adapts to skin undertones with medium, breathable buildable coverage.",
        benefits: "Shields against UV and HEV blue light, controls shine while preserving incandescent glow for up to 16 hours.",
        ingredients: "Micronized Non-Nano Zinc Oxide 12%, Pearl Essence, Hyaluronic Squalane, White Tea Leaf Infusion, Vitamin E.",
        sensorial_fragrance: "Whisper of White Violet & Clean Powdery Orris",
        sensorial_texture: "Featherweight fluid cream",
        sensorial_finish: "Soft-focus demi-matte satin",
        clinical_metric_1_val: "97.1%",
        clinical_metric_1_lbl: "Confirmed 16-Hour Transfer-Resistant Wear",
        clinical_metric_2_val: "95.0%",
        clinical_metric_2_lbl: "Agreed Complexion Looked Airbrushed in Real Life",
        volume: "30 ml / 1.0 fl. oz.",
        stock: 45,
        image_url: "/images/products/teint_soyeux.jpg",
        gallery_json: JSON.stringify(["/images/products/teint_soyeux.jpg"]),
        shades_json: JSON.stringify([
          { name: "01 Ivoire Pur", hex: "#F7ECE1" },
          { name: "02 Porcelaine Chaude", hex: "#F3E3D3" },
          { name: "03 Beige Doré", hex: "#E7CBB3" },
          { name: "04 Miel Lumineux", hex: "#D6AF8A" },
          { name: "05 Ambre Riche", hex: "#B8865C" },
          { name: "06 Ébène Royal", hex: "#6F452A" }
        ]),
        is_featured: 1,
        is_bestseller: 1
      },
      {
        title: "Rouge Impérial Baume Velours",
        subtitle: "Haute Couture Satin Lip Lacquer",
        slug: "rouge-imperial-baume-velours",
        category: "Lips & Eyes",
        discipline: "Lips & Eyes",
        price: 78.00,
        compare_at_price: null,
        rating: 4.96,
        reviews_count: 73,
        description: "Handcrafted in our Place Vendôme studio. Enriched with botanical oils and concentrated mineral pigments encased in heavy fluted gold brass casing.",
        benefits: "Cushions lips with moisture for 12 hours while delivering rich one-stroke color saturation.",
        ingredients: "French Camellia Seed Oil, Organic Shea Butter, Candelilla Wax, Castor Seed Oil, Pure Iron Oxides, 24K Micro Gold Flakes.",
        sensorial_fragrance: "Gentle Parisian Rose de Mai and Madagascar Vanilla Pod",
        sensorial_texture: "Buttery balm glide with weightless lacquer cushion",
        sensorial_finish: "Editorial satin lustre",
        clinical_metric_1_val: "99.0%",
        clinical_metric_1_lbl: "Felt Instant Lip Hydration Cushion",
        clinical_metric_2_val: "98.5%",
        clinical_metric_2_lbl: "Reported Zero Feathering Along Lip Line",
        volume: "3.8 g / 0.13 oz.",
        stock: 5,
        image_url: "/images/products/rouge_imperial.jpg",
        gallery_json: JSON.stringify(["/images/products/rouge_imperial.jpg"]),
        shades_json: JSON.stringify([
          { name: "N° 01 Rouge Vendôme", hex: "#9E1B28" },
          { name: "N° 02 Bois de Rose", hex: "#B85C66" },
          { name: "N° 03 Nude Alabâtre", hex: "#C78C7B" },
          { name: "N° 04 Bordeaux Profond", hex: "#5C1D24" }
        ]),
        is_featured: 1,
        is_bestseller: 0
      },
      {
        title: "Soleil d'Or Extrait de Parfum",
        subtitle: "Place Vendôme Pure Essence (35% Concentration)",
        slug: "soleil-dor-extrait-de-parfum",
        category: "Fragrance",
        discipline: "Fragrance",
        price: 380.00,
        compare_at_price: null,
        rating: 5.00,
        reviews_count: 51,
        description: "An intoxicating golden amber floral extrait that captures late afternoon sun across Parisian limestone palaces. Distilled from rare Grasse harvest Centifolia roses and aged bourbon resins.",
        benefits: "Unparalleled longevity (24+ hours on pulse points) with an intimate yet commanding magnetic sillage.",
        ingredients: "Alcohol Denat, Grasse Rose Centifolia Absolute, Ambergris Resinoid, Madagascar Vanilla Bourbon, Italian Bergamot Essence, Cashmeran, Sandalwood Mysore.",
        sensorial_fragrance: "Top: Bergamot Zest & Pink Peppercorn • Heart: Rose Centifolia & Orris • Base: Golden Amber & Aged Mysore Sandalwood",
        sensorial_texture: "Silky perfume oil infusion",
        sensorial_finish: "Luminous, golden sensorial aura",
        clinical_metric_1_val: "24h+",
        clinical_metric_1_lbl: "Indelible Lasting Power on Skin & Fabric",
        clinical_metric_2_val: "35%",
        clinical_metric_2_lbl: "Pure Master Perfumer Extrait Concentration",
        volume: "100 ml / 3.4 fl. oz.",
        stock: 19,
        image_url: "/images/products/soleil_dor.jpg",
        gallery_json: JSON.stringify(["/images/products/soleil_dor.jpg"]),
        shades_json: JSON.stringify([]),
        is_featured: 1,
        is_bestseller: 1
      },
      {
        title: "Le Coffret Découverte Impérial",
        subtitle: "Limited Edition Collector's Vanity Set",
        slug: "le-coffret-decouverte-imperial",
        category: "Gifting Atelier",
        discipline: "Gifting Atelier",
        price: 495.00,
        compare_at_price: 580.00,
        rating: 4.99,
        reviews_count: 38,
        description: "The ultimate expression of Macqrosa luxury. Houses the 24K Youth Infusion (50ml), Crème Sublime (60ml), and a travel miniature of Soleil d'Or Extrait (15ml) in handcrafted gilded lacquer cabinetry.",
        benefits: "A complete youth-restoration protocol sealed with personalized wax crest and diamond-engraved brass plate.",
        ingredients: "Includes full size L'Éclat d'Or 24K (50ml), Crème Sublime Régénérante (60ml), and Soleil d'Or Extrait (15ml).",
        sensorial_fragrance: "Harmonized signature Place Vendôme botanical bouquet",
        sensorial_texture: "Complete ritual progression from nectar to velvet balm",
        sensorial_finish: "Transformative full-spectrum cellular luminosity",
        clinical_metric_1_val: "100%",
        clinical_metric_1_lbl: "Reported Total Skin Rejuvenation Within 28 Days",
        clinical_metric_2_val: "Collector",
        clinical_metric_2_lbl: "Individually Numbered Limited Production Run",
        volume: "Atelier Presentation Box",
        stock: 12,
        image_url: "/images/products/coffret_imperial.jpg",
        gallery_json: JSON.stringify(["/images/products/coffret_imperial.jpg"]),
        shades_json: JSON.stringify([]),
        is_featured: 1,
        is_bestseller: 0
      },
      {
        title: "Masque d'Or Régénération Nocturne",
        subtitle: "24K Colloidal Gold Cellular Recovery Mask",
        slug: "masque-dor-regeneration-nocturne",
        category: "Skincare",
        discipline: "Skincare",
        price: 240.00,
        compare_at_price: null,
        rating: 4.97,
        reviews_count: 58,
        description: "An intensive overnight alchemy infusion combining 24-karat bio-gold suspension with alpine stem-cells. Recharges cellular mitochondrial energy while you slumber.",
        benefits: "Firms slackened contour lines, erases fatigue markers, and imparts luminous dawn glow.",
        ingredients: "Colloidal 24K Gold, Alpine Edelweiss Meristem Cells, Bio-Peptide Matrix, Ceramide NP, Shea Nilotica, Rose Hydrosol.",
        sensorial_fragrance: "Night-blooming Jasmine, Grasse Rose & Golden Amber",
        sensorial_texture: "Velveteen crystal balm that melts into epidermal warmth",
        sensorial_finish: "Cocooning nourishing veil with zero pore occlusion",
        clinical_metric_1_val: "99.2%",
        clinical_metric_1_lbl: "Woke With Restored Skin Density & Elasticity",
        clinical_metric_2_val: "97.4%",
        clinical_metric_2_lbl: "Noticed Radiant Translucent Morning Complexion",
        volume: "50 ml / 1.7 fl. oz.",
        stock: 22,
        image_url: "/images/products/masque_dor.jpg",
        gallery_json: JSON.stringify(["/images/products/masque_dor.jpg"]),
        shades_json: JSON.stringify([]),
        is_featured: 1,
        is_bestseller: 1
      },
      {
        title: "Élixir des Yeux Renaissance",
        subtitle: "Palladium Ceramic Tip Eye Contour Concentrate",
        slug: "elixir-des-yeux-renaissance",
        category: "Skincare",
        discipline: "Skincare",
        price: 175.00,
        compare_at_price: 190.00,
        rating: 4.94,
        reviews_count: 82,
        description: "A precision cryogenic eye nectar dispensed through a palladium ceramic cooling wand. Drains micro-congestion, tightens orbital folds, and smooths expression shadows.",
        benefits: "Instantly diminishes under-eye puffiness, lifts hooded lids, and illuminates dark circles.",
        ingredients: "Hexapeptide-8, Caffeine Cyclodextrin Complex, Marine Sea Kelp Bio-Ferment, Chlorella Extract, Niacinamide, Micronized Mica.",
        sensorial_fragrance: "Fragrance-Free (Ophthalmologist Certified Formula)",
        sensorial_texture: "Chilled liquid silk with instantaneous smoothing cushion",
        sensorial_finish: "Tightening soft-focus radiance without creasing",
        clinical_metric_1_val: "-42%",
        clinical_metric_1_lbl: "Clinical Reduction in Periorbital Puffiness",
        clinical_metric_2_val: "98.1%",
        clinical_metric_2_lbl: "Reported Brighter, Well-Rested Eye Contour",
        volume: "15 ml / 0.5 fl. oz.",
        stock: 30,
        image_url: "/images/products/elixir_yeux.jpg",
        gallery_json: JSON.stringify(["/images/products/elixir_yeux.jpg"]),
        shades_json: JSON.stringify([]),
        is_featured: 1,
        is_bestseller: 0
      },
      {
        title: "Poudre de Diamant Lumière",
        subtitle: "Micro-Milled 24K Sunburst Illuminating Compact",
        slug: "poudre-de-diamant-lumiere",
        category: "Complexion",
        discipline: "Complexion",
        price: 95.00,
        compare_at_price: null,
        rating: 4.93,
        reviews_count: 94,
        description: "Encased in an opulent fluted brass compact with mirror. Hand-milled in France with diamond light prisms that blur pores and bathe cheekbones in candlelit warmth.",
        benefits: "Sets complexion with invisible weightless veil while reflecting ambient candlelight.",
        ingredients: "Diamond Powder, Synthetic Fluorphlogopite, Squalane, Vitamin E, Micronized 24K Gold Mica, Silica.",
        sensorial_fragrance: "Faint Parisian Iris & Violet Petals",
        sensorial_texture: "Micro-fine cashmere powder veil",
        sensorial_finish: "Incandescent soft-focus diffused glow",
        clinical_metric_1_val: "100%",
        clinical_metric_1_lbl: "Zero Flashback or Cakey Creasing in 4K Daylight",
        clinical_metric_2_val: "95.6%",
        clinical_metric_2_lbl: "Maintained Fresh Satin Complexion For 12 Hours",
        volume: "10 g / 0.35 oz.",
        stock: 18,
        image_url: "/images/products/poudre_diamant.jpg",
        gallery_json: JSON.stringify(["/images/products/poudre_diamant.jpg"]),
        shades_json: JSON.stringify([
          { name: "01 Lumière Céleste", hex: "#FFF6E5" },
          { name: "02 Soleil Vendôme", hex: "#E8C28A" }
        ]),
        is_featured: 1,
        is_bestseller: 1
      },
      {
        title: "Huile Sublime Corps & Bain",
        subtitle: "Grasse Rose & 24K Shimmering Dry Body Nectar",
        slug: "huile-sublime-corps-et-bain",
        category: "Body & Bath",
        discipline: "Body & Bath",
        price: 155.00,
        compare_at_price: null,
        rating: 4.96,
        reviews_count: 67,
        description: "A decadent dry body oil bottled in faceted cut crystal. Suspends golden mineral shimmer and Centifolia rose extracts for satin-smooth, glistening limbs.",
        benefits: "Deeply nourishes dry skin, leaves non-greasy golden sheen, and scents body with lasting Parisian sillage.",
        ingredients: "Sweet Almond Oil, Jojoba Seed Oil, Argan Kernel Oil, Rose Centifolia Extract, 24K Golden Mica, Vitamin E Acetate.",
        sensorial_fragrance: "May Rose, Bergamot Blossom, Sandalwood, Warm Amber",
        sensorial_texture: "Featherlight dry oil absorbing in seconds",
        sensorial_finish: "Dry-touch luminous golden shimmer with supple skin feel",
        clinical_metric_1_val: "99.0%",
        clinical_metric_1_lbl: "Noted Instant Satin Softness Across Limbs & Décolleté",
        clinical_metric_2_val: "24h",
        clinical_metric_2_lbl: "Continuous Moisture Lock Without Staining Silk",
        volume: "100 ml / 3.4 fl. oz.",
        stock: 14,
        image_url: "/images/products/huile_sublime.jpg",
        gallery_json: JSON.stringify(["/images/products/huile_sublime.jpg"]),
        shades_json: JSON.stringify([]),
        is_featured: 1,
        is_bestseller: 0
      },
      {
        title: "Brume Botanique Apaisante",
        subtitle: "Cellular Rose Hydrosol & Glacier Water Facial Mist",
        slug: "brume-botanique-apaisante",
        category: "Skincare",
        discipline: "Skincare",
        price: 85.00,
        compare_at_price: null,
        rating: 4.90,
        reviews_count: 76,
        description: "An invigorating micro-fine botanical cloud distilled from organic Grasse roses and Mont Blanc glacier water. Resets pH balance and revives fatigued skin on demand.",
        benefits: "Instantly quenches surface dehydration, soothes sensitivity, and primes face for serum absorption.",
        ingredients: "Organic Rosa Damascena Flower Water, Alpine Glacier Mineral Water, Aloe Barbadensis Leaf Juice, Centella Asiatica Extract, Sodium Hyaluronate.",
        sensorial_fragrance: "Dewy Fresh-Cut Grasse Roses at Dawn",
        sensorial_texture: "Micro-atomized golden moisture cloud",
        sensorial_finish: "Refreshing dewy aura with immediate cooling relief",
        clinical_metric_1_val: "+85%",
        clinical_metric_1_lbl: "Immediate Skin Hydration Surge Upon First Spritz",
        clinical_metric_2_val: "100%",
        clinical_metric_2_lbl: "Non-Comedogenic & Suitable For Reactive Skin",
        volume: "120 ml / 4.0 fl. oz.",
        stock: 35,
        image_url: "/images/products/brume_botanique.jpg",
        gallery_json: JSON.stringify(["/images/products/brume_botanique.jpg"]),
        shades_json: JSON.stringify([]),
        is_featured: 1,
        is_bestseller: 1
      }
    ];

    const { rows: prodRows } = await query('SELECT count(*) as count FROM products');
    const now = new Date().toISOString();
    if (parseInt(prodRows[0].count) === 0) {
      for (const p of products) {
        await query(`
          INSERT INTO products (
            title, subtitle, slug, category, discipline, price, compare_at_price,
            rating, reviews_count, description, benefits, ingredients,
            sensorial_fragrance, sensorial_texture, sensorial_finish,
            clinical_metric_1_val, clinical_metric_1_lbl, clinical_metric_2_val, clinical_metric_2_lbl,
            volume, stock, image_url, gallery_json, shades_json, is_featured, is_bestseller,
            created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7,
            $8, $9, $10, $11, $12,
            $13, $14, $15,
            $16, $17, $18, $19,
            $20, $21, $22, $23, $24, $25, $26,
            $27, $28
          )
        `, [
          p.title, p.subtitle, p.slug, p.category, p.discipline, p.price, p.compare_at_price,
          p.rating, p.reviews_count, p.description, p.benefits, p.ingredients,
          p.sensorial_fragrance, p.sensorial_texture, p.sensorial_finish,
          p.clinical_metric_1_val, p.clinical_metric_1_lbl, p.clinical_metric_2_val, p.clinical_metric_2_lbl,
          p.volume, p.stock, p.image_url, p.gallery_json, p.shades_json, p.is_featured, p.is_bestseller,
          now, now
        ]);
      }
    } else {
      for (const p of products) {
        const { rows: existingP } = await query('SELECT id FROM products WHERE slug = $1', [p.slug]);
        if (existingP.length === 0) {
          await query(`
            INSERT INTO products (
              title, subtitle, slug, category, discipline, price, compare_at_price,
              rating, reviews_count, description, benefits, ingredients,
              sensorial_fragrance, sensorial_texture, sensorial_finish,
              clinical_metric_1_val, clinical_metric_1_lbl, clinical_metric_2_val, clinical_metric_2_lbl,
              volume, stock, image_url, gallery_json, shades_json, is_featured, is_bestseller,
              created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7,
              $8, $9, $10, $11, $12,
              $13, $14, $15,
              $16, $17, $18, $19,
              $20, $21, $22, $23, $24, $25, $26,
              $27, $28
            )
          `, [
            p.title, p.subtitle, p.slug, p.category, p.discipline, p.price, p.compare_at_price,
            p.rating, p.reviews_count, p.description, p.benefits, p.ingredients,
            p.sensorial_fragrance, p.sensorial_texture, p.sensorial_finish,
            p.clinical_metric_1_val, p.clinical_metric_1_lbl, p.clinical_metric_2_val, p.clinical_metric_2_lbl,
            p.volume, p.stock, p.image_url, p.gallery_json, p.shades_json, p.is_featured, p.is_bestseller,
            now, now
          ]);
        }
      }
    }

  // ----- Reviews -----
  const { rows: revRows } = await query('SELECT count(*) as count FROM reviews');
  if (parseInt(revRows[0].count) === 0) {
    const reviews = [
      { product_id: 1, customer_name: "Eleanor Vance-Croft", customer_tier: "Circle Privé Member", rating: 5, title: "Pure liquid sorcery on the skin", comment: "I have used high-end formulations for two decades, but L'Éclat d'Or exists in a stratosphere of its own. Within 3 nights, morning dehydration lines vanished and that golden glow is unmatched.", created_at: "2024-10-18T14:30:00Z" },
      { product_id: 1, customer_name: "Countess Jacqueline de M.", customer_tier: "Ambassadrice d'Or", rating: 5, title: "Worth every single centime", comment: "The texture is impossibly lightweight yet deeply restorative. The glass flacon on my vanity is sheer art, and the results are clinical grade.", created_at: "2024-10-22T09:15:00Z" },
      { product_id: 2, customer_name: "Genevieve Moreau", customer_tier: "Circle Privé Member", rating: 5, title: "The richest, most sensorial balm in Paris", comment: "Crème Sublime saved my skin during transcontinental travel. The velvet cushion finish keeps your face looking plump and luminous all day.", created_at: "2024-10-25T11:40:00Z" }
    ];

    for (const r of reviews) {
      await query(
        'INSERT INTO reviews (product_id, customer_name, customer_tier, rating, title, comment, verified_purchase, created_at) VALUES ($1, $2, $3, $4, $5, $6, 1, $7)',
        [r.product_id, r.customer_name, r.customer_tier, r.rating, r.title, r.comment, r.created_at]
      );
    }
  }

  // ----- Sample Orders -----
  const { rows: ordRows } = await query('SELECT count(*) as count FROM orders');
  if (parseInt(ordRows[0].count) === 0) {
    const orders = [
      {
        order_number: "MQ-2024-8841",
        customer_id: 1,
        customer_email: "claire@vendome.com",
        customer_name: "Claire Sinclair",
        shipping_address: JSON.stringify({ addressLine1: "740 Park Avenue", addressLine2: "Apt 12B", city: "New York", state: "NY", postalCode: "10021", country: "United States" }),
        subtotal: 585.00, shipping_fee: 0, tax: 51.19, total_amount: 636.19,
        status: "processing", payment_method: "Credit Card (•••• 8821)", payment_status: "paid",
        tracking_number: "MQ-FEDEX-9920148",
        created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
        updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
        items: [
          { product_id: 1, product_title: "L'Éclat d'Or 24K Radiant Youth Infusion", product_price: 265.00, quantity: 1, total_price: 265.00, image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuBtWSnePUN2J9jOyuNAbWYmze1a_u1s1Ho1ZjaCa71ZxzDk3d4LZfuPXyZZgHQGkJDreFrYo2y1YHE1aXJRep4rEILl7aQA-Cqu803quIb75M0akh9qkuzYb6f5T9zJwIRFS1JJ8l-1rYa_I1OhHNgxkyqslwY3R1fob_bG408pPy19UF3r6wTwxzwzCAINbgK8iaER0NqxhGyMb8eMyNBjk4kT8_qbpy4EFIlb57ojKK84cZkjJTd7cw" },
          { product_id: 2, product_title: "Crème Sublime Régénérante", product_price: 320.00, quantity: 1, total_price: 320.00, image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuB2yKkW3_9w2G5mJ_nL4Xw9PqC5Y6m9A4z6e_0k6aQ2y-D-u6zWjX1rN5tY" }
        ]
      },
      {
        order_number: "MQ-2024-8729",
        customer_id: 1,
        customer_email: "claire@vendome.com",
        customer_name: "Claire Sinclair",
        shipping_address: JSON.stringify({ addressLine1: "740 Park Avenue", addressLine2: "Apt 12B", city: "New York", state: "NY", postalCode: "10021", country: "United States" }),
        subtotal: 380.00, shipping_fee: 0, tax: 33.25, total_amount: 413.25,
        status: "delivered", payment_method: "Apple Pay", payment_status: "paid",
        tracking_number: "MQ-FEDEX-8819204",
        created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
        updated_at: new Date(Date.now() - 11 * 86400000).toISOString(),
        items: [
          { product_id: 6, product_title: "Soleil d'Or Extrait de Parfum", product_price: 380.00, quantity: 1, total_price: 380.00, image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCq1W3_e1r9N_2vY5o_8xL4kQ6p0sM-7zW3jX1rN5tY" }
        ]
      },
      {
        order_number: "MQ-2024-8610",
        customer_id: null,
        customer_email: "henrietta.dupont@geneve.ch",
        customer_name: "Henrietta Dupont",
        shipping_address: JSON.stringify({ addressLine1: "12 Quai du Mont-Blanc", addressLine2: "", city: "Geneva", state: "GE", postalCode: "1201", country: "Switzerland" }),
        subtotal: 495.00, shipping_fee: 0, tax: 43.31, total_amount: 538.31,
        status: "shipped", payment_method: "Place Vendôme House Account", payment_status: "paid",
        tracking_number: "MQ-DHL-3819241",
        created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
        updated_at: new Date(Date.now() - 4 * 86400000).toISOString(),
        items: [
          { product_id: 7, product_title: "Le Coffret Découverte Impérial", product_price: 495.00, quantity: 1, total_price: 495.00, image_url: "https://lh3.googleusercontent.com/aida-public/AB6AXuBtWSnePUN2J9jOyuNAbWYmze1a_u1s1Ho1ZjaCa71ZxzDk3d4LZfuPXyZZgHQGkJDreFrYo2y1YHE1aXJRep4rEILl7aQA-Cqu803quIb75M0akh9qkuzYb6f5T9zJwIRFS1JJ8l-1rYa_I1OhHNgxkyqslwY3R1fob_bG408pPy19UF3r6wTwxzwzCAINbgK8iaER0NqxhGyMb8eMyNBjk4kT8_qbpy4EFIlb57ojKK84cZkjJTd7cw" }
        ]
      }
    ];

    for (const o of orders) {
      const orderRes = await query(`
        INSERT INTO orders (
          order_number, customer_id, customer_email, customer_name,
          shipping_address, subtotal, shipping_fee, tax, total_amount,
          status, payment_method, payment_status, tracking_number,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING id
      `, [
        o.order_number, o.customer_id, o.customer_email, o.customer_name,
        o.shipping_address, o.subtotal, o.shipping_fee, o.tax, o.total_amount,
        o.status, o.payment_method, o.payment_status, o.tracking_number,
        o.created_at, o.updated_at
      ]);

      const orderId = orderRes.rows[0].id;
      for (const it of o.items) {
        await query(
          'INSERT INTO order_items (order_id, product_id, product_title, product_price, quantity, total_price, image_url) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [orderId, it.product_id, it.product_title, it.product_price, it.quantity, it.total_price, it.image_url]
        );
      }
    }
  }

  // ----- Site Settings -----
  const { rows: settingRows } = await query('SELECT count(*) as count FROM site_settings');
  if (parseInt(settingRows[0].count) === 0) {
    const defaultSettings = [
      {
        key: 'store_settings',
        value: JSON.stringify({
          storeName: 'Macqrosa',
          tagline: 'Haute Parfumerie & Cosmétiques',
          contactEmail: 'support@macqrosa.com',
          contactPhone: '+33 1 42 60 00 00',
          currency: 'USD',
          timezone: 'America/New_York',
          address: '15 Place Vendôme',
          city: 'Paris',
          country: 'France',
          freeShippingThreshold: 150,
          standardShippingFee: 15,
          taxRate: 8.5,
          enableReviews: true,
          enableWishlist: true,
          enableGuestCheckout: false,
          maintenanceMode: false,
          lowStockThreshold: 10,
          orderPrefix: 'MQ',
        })
      },
      {
        key: 'homepage_cms',
        value: JSON.stringify({
          heroBadge: 'Harper’s Bazaar Luxury Icons Winner • Best Miracle Face Oil',
          heroTitle: 'L’Éclat d’Or:',
          heroSubtitle: 'The 24K Radiant Youth Infusion',
          heroDescription: 'Sculpted with rare French alpine bio-actives and pure 24-karat colloidal gold suspension. Engineered for an indelible, skin-whispered radiance that transcends time.',
          heroBannerImage: '/images/hero/hero_banner.jpg',
          primaryCtaText: 'Explore The Collection',
          primaryCtaLink: '/catalog',
          secondaryCtaText: 'Book Atelier Consultation',
          metric1Val: '99.4%',
          metric1Lbl: 'Cellular Luminosity',
          metric2Val: '24K',
          metric2Lbl: 'Colloidal Gold Core',
          metric3Val: 'Grasse',
          metric3Lbl: 'Harvest Extraction',
          brandStorySubtitle: 'Place Vendôme Laboratory',
          brandStoryTitle: 'Where Ancient Alchemy Meets French Phyto-Chemistry',
          brandStoryDescription: 'Founded in Paris, Macqrosa pioneers the fusion of cold-plasma botanical extracts with suspended 24-karat colloidal bio-gold. Our clean, clinical formulas are certified cruelty-free and engineered without synthetic parabens, phthalates, or microplastics.',
          brandStoryImage: 'https://lh3.googleusercontent.com/aida/AEtjO1VDjASZU-mDV00ion1vG2kC1WzPrAssBdNCXOoQH7xCWD2h9oRVIeeIul8cKcYv5qWzDF7CQ-yE6LkfYZckclPZK2a7IbBr1t-_QuW2lW_WMBGy9ejBnqlmtXN0bWF_JE-jAZGvQiwCkdvQhq5ny2Wl5JVc2fXwE59TCg43JEqGVp_uoYcrSkgyKNJxw9xRKRFwaODTxsSs-Xn4wXfQdQL9pW7BKfXaS1zJawzbKCiX1svmwMO1aA6rSjZI',
          brandStoryQuote: 'An indelible, candlelit radiance that awakens tired complexions from the very first application.',
          brandStoryQuoteAuthor: 'Verified Efficacy',
          services: [
            { title: 'White Glove Courier', desc: 'Complimentary climate-controlled transit', icon: 'local_shipping' },
            { title: 'Signature Gold Boxing', desc: 'Sealed with Place Vendôme wax emblem', icon: 'featured_seasonal_and_gifts' },
            { title: 'Deluxe Ritual Samples', desc: '3 tailored miniature flacons per order', icon: 'science' },
            { title: 'Bespoke Monogramming', desc: 'Diamond-point flacon engraving', icon: 'history_edu' }
          ]
        })
      },
      {
        key: 'theme_config',
        value: JSON.stringify({
          preset: 'champagne_gold',
          primaryColor: '#181615',
          secondaryColor: '#C5A059',
          accentGlow: '#FEF9E7',
          bannerBg: '#181615',
          bannerText: '#FFFFFF',
          announcementText: 'Free shipping on orders over $150 — Use code LUMIERE for 15% VIP Maison discount',
          fontHeading: 'Bodoni Moda',
          fontBody: 'Hanken Grotesk'
        })
      },
      {
        key: 'footer_config',
        value: JSON.stringify({
          email: 'concierge@macqrosa.com',
          phone: '+33 1 42 60 00 00',
          address: '15 Place Vendôme, 75001 Paris, France',
          hours: 'Mon–Sat: 10:00 – 19:00 CET',
          instagram: '@macqrosaparis',
          facebook: 'macqrosaparis',
          twitter: '@macqrosa'
        })
      },
      {
        key: 'system_alerts',
        value: JSON.stringify({
          enabled: false,
          type: 'info',
          message: 'Maison Announcement: Complimentary 24K Miniature with all orders over $200 today.',
          linkText: 'Explore Gifts',
          linkUrl: '/catalog'
        })
      },
      {
        key: 'admin_workspace',
        value: JSON.stringify({
          tableDensity: 'relaxed',
          accentColor: '#C5A059',
          showKpiRevenue: true,
          showKpiOrders: true,
          showKpiAov: true,
          showKpiConversion: true
        })
      },
      {
        key: 'gateways_config',
        value: JSON.stringify({
          payment: {
            provider: 'paystack',
            paystackEnabled: true,
            paystackPublicKey: 'pk_test_sample_macqrosa_2026',
            paystackSecretKey: 'sk_test_sample_macqrosa_2026',
            paystackCurrency: 'USD',
            stripeEnabled: false,
            stripePublishableKey: '',
            stripeSecretKey: '',
            houseAccountEnabled: true
          },
          email: {
            provider: 'smtp',
            smtpHost: 'smtp.macqrosa.com',
            smtpPort: '587',
            smtpUser: 'concierge@macqrosa.com',
            smtpPass: '',
            senderEmail: 'concierge@macqrosa.com',
            senderName: 'Macqrosa Luxury Atelier',
            enableOrderConfirmation: true,
            enableShippingNotification: true
          },
          sms: {
            provider: 'arkesel',
            apiKey: '',
            senderId: 'MACQROSA',
            enabled: false,
            notifyOnOrder: true,
            notifyOnDispatch: true
          }
        })
      }
    ];

    for (const s of defaultSettings) {
      await query(
        'INSERT INTO site_settings (key, value) VALUES ($1, $2)',
        [s.key, s.value]
      );
    }
  }

  // Ensure gateways_config exists even if site_settings was already seeded
  const { rows: gwRows } = await query("SELECT key FROM site_settings WHERE key = 'gateways_config'");
  if (gwRows.length === 0) {
    await query("INSERT INTO site_settings (key, value) VALUES ('gateways_config', $1)", [
      JSON.stringify({
        payment: {
          provider: 'paystack',
          paystackEnabled: true,
          paystackPublicKey: 'pk_test_sample_macqrosa_2026',
          paystackSecretKey: 'sk_test_sample_macqrosa_2026',
          paystackCurrency: 'USD',
          stripeEnabled: false,
          stripePublishableKey: '',
          stripeSecretKey: '',
          houseAccountEnabled: true
        },
        email: {
          provider: 'smtp',
          smtpHost: 'smtp.macqrosa.com',
          smtpPort: '587',
          smtpUser: 'concierge@macqrosa.com',
          smtpPass: '',
          senderEmail: 'concierge@macqrosa.com',
          senderName: 'Macqrosa Luxury Atelier',
          enableOrderConfirmation: true,
          enableShippingNotification: true
        },
        sms: {
          provider: 'arkesel',
          apiKey: '',
          senderId: 'MACQROSA',
          enabled: false,
          notifyOnOrder: true,
          notifyOnDispatch: true
        }
      })
    ]);
  }

  // ----- Promo Codes -----
  const { rows: promoRows } = await query('SELECT count(*) as count FROM promo_codes');
  if (parseInt(promoRows[0].count) === 0) {
    const promoCodes = [
      {
        code: 'LUMIERE',
        discount_type: 'percentage',
        discount_value: 15,
        min_spend: 0,
        expires_at: null,
        max_uses: 1000,
        uses_count: 38,
        is_active: 1
      },
      {
        code: 'VENDOME20',
        discount_type: 'fixed',
        discount_value: 20,
        min_spend: 150,
        expires_at: null,
        max_uses: 500,
        uses_count: 14,
        is_active: 1
      },
      {
        code: 'NOIR10',
        discount_type: 'percentage',
        discount_value: 10,
        min_spend: 50,
        expires_at: null,
        max_uses: 250,
        uses_count: 6,
        is_active: 1
      }
    ];

    for (const p of promoCodes) {
      await query(`
        INSERT INTO promo_codes (code, discount_type, discount_value, min_spend, expires_at, max_uses, uses_count, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [p.code, p.discount_type, p.discount_value, p.min_spend, p.expires_at, p.max_uses, p.uses_count, p.is_active]);
    }
  }

  // ----- Notification Templates -----
  const { rows: tmplRows } = await query('SELECT count(*) as count FROM notification_templates');
  if (parseInt(tmplRows[0].count) === 0) {
    const now = new Date().toISOString();
    const templates = [
      {
        name: 'Order Confirmation',
        channel: 'email',
        subject: 'Macqrosa — Order Confirmation {{orderNumber}}',
        body: `<div style="font-family:'Georgia',serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
  <div style="text-align:center;padding:30px 0;border-bottom:2px solid #c9a96e;">
    <h1 style="font-size:28px;letter-spacing:3px;color:#c9a96e;margin:0;">MACQROSA</h1>
    <p style="color:#888;font-size:12px;letter-spacing:2px;margin-top:5px;">LUXURY ATELIER • PLACE VENDÔME</p>
  </div>
  <div style="padding:30px 20px;">
    <h2 style="font-size:20px;color:#333;">Merci, {{customerName}}</h2>
    <p style="color:#666;line-height:1.6;">Your order <strong>{{orderNumber}}</strong> has been confirmed and is being prepared with the utmost care in our atelier.</p>
    <p style="color:#666;">Total: <strong>\${{totalAmount}}</strong></p>
  </div>
  <div style="text-align:center;padding:20px;background:#f8f6f3;color:#888;font-size:11px;">
    <p>© ${new Date().getFullYear()} Macqrosa — Place Vendôme, Paris</p>
  </div>
</div>`,
        is_default: 1
      },
      {
        name: 'Order Confirmation SMS',
        channel: 'sms',
        subject: null,
        body: '✨ MACQROSA: Merci {{customerName}}! Your order {{orderNumber}} is confirmed. Total: ${{totalAmount}}. We are preparing your treasures at our Place Vendôme atelier.',
        is_default: 1
      },
      {
        name: 'Shipping Update',
        channel: 'email',
        subject: 'Macqrosa — Your Order Has Shipped {{orderNumber}}',
        body: `<div style="font-family:'Georgia',serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
  <div style="text-align:center;padding:30px 0;border-bottom:2px solid #c9a96e;">
    <h1 style="font-size:28px;letter-spacing:3px;color:#c9a96e;margin:0;">MACQROSA</h1>
  </div>
  <div style="padding:30px 20px;">
    <h2 style="font-size:20px;color:#333;">Your Order Is On Its Way</h2>
    <p style="color:#666;line-height:1.6;">Dear {{customerName}}, your order <strong>{{orderNumber}}</strong> has been dispatched via our White Glove Courier service.</p>
    <p style="color:#666;">Tracking: <strong>{{trackingNumber}}</strong></p>
  </div>
</div>`,
        is_default: 1
      },
      {
        name: 'Shipping Update SMS',
        channel: 'sms',
        subject: null,
        body: '📦 MACQROSA: Order {{orderNumber}} has shipped! Track: {{trackingNumber}}. Expect delivery within 3-5 business days.',
        is_default: 1
      },
      {
        name: 'Promotional Announcement',
        channel: 'email',
        subject: 'Macqrosa — Exclusive Offer Inside',
        body: `<div style="font-family:'Georgia',serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
  <div style="text-align:center;padding:30px 0;border-bottom:2px solid #c9a96e;">
    <h1 style="font-size:28px;letter-spacing:3px;color:#c9a96e;margin:0;">MACQROSA</h1>
    <p style="color:#888;font-size:12px;letter-spacing:2px;margin-top:5px;">AN EXCLUSIVE INVITATION</p>
  </div>
  <div style="padding:30px 20px;text-align:center;">
    <h2 style="font-size:24px;color:#333;">Dear {{customerName}},</h2>
    <p style="color:#666;line-height:1.8;font-size:15px;">You have been selected for an exclusive offer from the Macqrosa atelier. Visit our collection to discover what awaits.</p>
    <a href="{{ctaLink}}" style="display:inline-block;background:#181615;color:#fff;padding:14px 32px;text-decoration:none;font-size:13px;letter-spacing:2px;margin-top:20px;border-radius:2px;">EXPLORE NOW</a>
  </div>
</div>`,
        is_default: 0
      }
    ];

    for (const t of templates) {
      await query(`
        INSERT INTO notification_templates (name, channel, subject, body, is_default, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [t.name, t.channel, t.subject, t.body, t.is_default, now, now]);
    }
  }
}
