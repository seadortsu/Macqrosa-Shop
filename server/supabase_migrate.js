import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || 'YOUR_PROJECT_REF';
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || 'YOUR_ACCESS_TOKEN';

async function executeSql(query) {
  const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`SQL Execution failed (${res.status}): ${errorText}`);
  }

  return await res.json();
}

async function migrateAndSeed() {
  console.log('🚀 Step 1: Creating database schema on Supabase...');
  const schemaSql = fs.readFileSync(path.join(__dirname, 'supabase_schema.sql'), 'utf-8');
  await executeSql(schemaSql);
  console.log('✅ Schema tables and indexes created successfully.');

  console.log('🌱 Step 2: Seeding initial data...');

  // 1. Admin & Demo Customer
  const admins = await executeSql('SELECT count(*) as count FROM admins;');
  if (parseInt(admins[0].count) === 0) {
    const salt = bcrypt.genSaltSync(10);
    const adminHash = bcrypt.hashSync('Master123!', salt);
    const customerHash = bcrypt.hashSync('Client123!', salt);

    await executeSql(`
      INSERT INTO admins (email, password_hash, name, role, created_at)
      VALUES ('admin@macqrosa.com', '${adminHash}', 'Claire Sinclair', 'super_admin', NOW());
      
      INSERT INTO customers (email, password_hash, first_name, last_name, phone, tier, points, total_spent, orders_count, created_at)
      VALUES ('demo@macqrosa.com', '${customerHash}', 'Claire', 'Sinclair', '+1 (555) 839-2910', 'Circle Privé Member', 1250, 945.00, 3, NOW())
      RETURNING id;
    `);

    await executeSql(`
      INSERT INTO customer_addresses (customer_id, address_line1, address_line2, city, state, postal_code, country, is_default)
      SELECT id, '740 Park Avenue', 'Apt 12B', 'New York', 'NY', '10021', 'United States', 1
      FROM customers WHERE email = 'demo@macqrosa.com';
    `);
    console.log('  • Admin and demo customer created.');
  }

  // 2. Categories
  const cats = await executeSql('SELECT count(*) as count FROM categories;');
  if (parseInt(cats[0].count) === 0) {
    await executeSql(`
      INSERT INTO categories (name, slug, description, image_url) VALUES
      ('Skincare', 'skincare', 'Rare French botanical extracts and cellular regenerative formulas.', 'https://lh3.googleusercontent.com/aida-public/AB6AXuBtWSnePUN2J9jOyuNAbWYmze1a_u1s1Ho1ZjaCa71ZxzDk3d4LZfuPXyZZgHQGkJDreFrYo2y1YHE1aXJRep4rEILl7aQA-Cqu803quIb75M0akh9qkuzYb6f5T9zJwIRFS1JJ8l-1rYa_I1OhHNgxkyqslwY3R1fob_bG408pPy19UF3r6wTwxzwzCAINbgK8iaER0NqxhGyMb8eMyNBjk4kT8_qbpy4EFIlb57ojKK84cZkjJTd7cw'),
      ('Complexion', 'complexion', 'Liquid velvet foundations, luminous skin tints, and micro-milled finishing veils.', 'https://lh3.googleusercontent.com/aida-public/AB6AXuB2yKkW3_9w2G5mJ_nL4Xw9PqC5Y6m9A4z6e_0k6aQ2y-D-u6zWjX1rN5tY'),
      ('Lips & Eyes', 'lips-and-eyes', 'Saturated pigment elixirs and 24K infused glosses for timeless elegance.', 'https://lh3.googleusercontent.com/aida-public/AB6AXuD_Rs5s3PkFbjqZOWcihHCxuWDliuVh8-2Z-RraGhSQ-PF6ErQuLyUBMWnIBKX-pF33_Y-o0W6NurXDh_tuXWys6F_3QP-npaFuGPGt0e02DfqsMcfsIuvj4yEvNqAs5ikCH_XXF8ao7JpbvclVO8baHP7yO7d04JJR17IpmUmWVcgwjgV1_rYXgSVeq2IHFoEwU3T-elagdIniE38NDaplsOXsn_hi_1OzDkpbvjztDS3HyhOVPM3mjw'),
      ('Fragrance', 'fragrance', 'High-concentration extraits de parfum crafted with Grasse harvest florals.', 'https://lh3.googleusercontent.com/aida-public/AB6AXuCq1W3_e1r9N_2vY5o_8xL4kQ6p0sM-7zW3jX1rN5tY'),
      ('Gifting Atelier', 'gifting-atelier', 'Bespoke vanity coffrets, curated discovery sets, and Place Vendôme wax-sealed editions.', 'https://lh3.googleusercontent.com/aida-public/AB6AXuDtWSnePUN2J9jOyuNAbWYmze1a_u1s1Ho1');
    `);
    console.log('  • Luxury categories seeded.');
  }

  // 3. Products
  const prods = await executeSql('SELECT count(*) as count FROM products;');
  if (parseInt(prods[0].count) === 0) {
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

    for (const p of products) {
      const escape = (str) => str ? `'${String(str).replace(/'/g, "''")}'` : 'NULL';
      await executeSql(`
        INSERT INTO products (
          title, subtitle, slug, category, discipline, price, compare_at_price,
          rating, reviews_count, description, benefits, ingredients,
          sensorial_fragrance, sensorial_texture, sensorial_finish,
          clinical_metric_1_val, clinical_metric_1_lbl, clinical_metric_2_val, clinical_metric_2_lbl,
          volume, stock, image_url, gallery_json, shades_json, is_featured, is_bestseller,
          created_at, updated_at
        ) VALUES (
          ${escape(p.title)}, ${escape(p.subtitle)}, ${escape(p.slug)}, ${escape(p.category)}, ${escape(p.discipline)},
          ${p.price}, ${p.compare_at_price ? p.compare_at_price : 'NULL'}, ${p.rating}, ${p.reviews_count},
          ${escape(p.description)}, ${escape(p.benefits)}, ${escape(p.ingredients)},
          ${escape(p.sensorial_fragrance)}, ${escape(p.sensorial_texture)}, ${escape(p.sensorial_finish)},
          ${escape(p.clinical_metric_1_val)}, ${escape(p.clinical_metric_1_lbl)}, ${escape(p.clinical_metric_2_val)}, ${escape(p.clinical_metric_2_lbl)},
          ${escape(p.volume)}, ${p.stock}, ${escape(p.image_url)}, ${escape(p.gallery_json)}, ${escape(p.shades_json)},
          ${p.is_featured}, ${p.is_bestseller}, NOW(), NOW()
        );
      `);
    }
    console.log('  • Luxury catalog products seeded.');
  }

  // 4. Site Settings & Gateways
  const settings = await executeSql('SELECT count(*) as count FROM site_settings;');
  if (parseInt(settings[0].count) === 0) {
    const storeSettings = JSON.stringify({
      storeName: 'Macqrosa',
      tagline: 'Haute Parfumerie & Cosmétiques',
      contactEmail: 'support@macqrosa.com',
      currency: 'USD',
      timezone: 'America/New_York',
      freeShippingThreshold: 150,
      standardShippingFee: 15,
      taxRate: 8.5,
      enableReviews: true,
      enableWishlist: true,
      orderPrefix: 'MQ'
    }).replace(/'/g, "''");

    const gatewaysConfig = JSON.stringify({
      payment: {
        provider: 'paystack',
        paystackEnabled: true,
        paystackPublicKey: 'pk_test_sample_macqrosa_2026',
        paystackSecretKey: 'sk_test_sample_macqrosa_2026',
        paystackCurrency: 'USD',
        houseAccountEnabled: true
      },
      email: {
        provider: 'smtp',
        smtpHost: 'smtp.macqrosa.com',
        smtpPort: '587',
        smtpUser: 'concierge@macqrosa.com',
        smtpPass: '',
        senderEmail: 'concierge@macqrosa.com',
        senderName: 'Macqrosa Luxury Atelier'
      }
    }).replace(/'/g, "''");

    await executeSql(`
      INSERT INTO site_settings (key, value) VALUES
      ('store_settings', '${storeSettings}'),
      ('gateways_config', '${gatewaysConfig}')
      ON CONFLICT (key) DO NOTHING;
    `);
    console.log('  • Default site settings and gateways configured.');
  }

  // 5. Promo Codes
  const promos = await executeSql('SELECT count(*) as count FROM promo_codes;');
  if (parseInt(promos[0].count) === 0) {
    await executeSql(`
      INSERT INTO promo_codes (code, discount_type, discount_value, min_spend, max_uses, uses_count, is_active) VALUES
      ('LUMIERE', 'percentage', 15.00, 0, 1000, 38, 1),
      ('VENDOME20', 'fixed', 20.00, 150.00, 500, 14, 1),
      ('NOIR10', 'percentage', 10.00, 50.00, 250, 6, 1);
    `);
    console.log('  • VIP promo codes seeded.');
  }

  console.log('\n📊 Step 3: Verifying Supabase tables...');
  const tableCounts = await executeSql(`
    SELECT 
      (SELECT count(*) FROM categories) as categories,
      (SELECT count(*) FROM products) as products,
      (SELECT count(*) FROM admins) as admins,
      (SELECT count(*) FROM site_settings) as settings,
      (SELECT count(*) FROM promo_codes) as promo_codes;
  `);

  console.log('🎉 Migration & Seed Complete! Supabase Database Stats:');
  console.table(tableCounts[0]);
}

migrateAndSeed().catch((err) => {
  console.error('❌ Migration error:', err);
  process.exit(1);
});
