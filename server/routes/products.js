import { Router } from 'express';
import { query } from '../database.js';
import { authenticateAdmin, authenticateSuperAdmin, optionalCustomer } from '../middleware/auth.js';

const router = Router();

/* =========================================================================
   PUBLIC / STOREFRONT PRODUCT ROUTES
   ========================================================================= */

// Get all products with filtering, search, sorting
router.get('/', async (req, res) => {
  try {
    const { category, discipline, search, minPrice, maxPrice, inStock, sort, limit, featured, bestseller } = req.query;

    let sql = 'SELECT * FROM products WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (category && category !== 'all') {
      sql += ` AND (LOWER(category) = LOWER($${paramIndex}) OR LOWER(discipline) = LOWER($${paramIndex + 1}))`;
      params.push(category, category);
      paramIndex += 2;
    }

    if (discipline && discipline !== 'all') {
      sql += ` AND LOWER(discipline) = LOWER($${paramIndex})`;
      params.push(discipline);
      paramIndex++;
    }

    if (search) {
      sql += ` AND (LOWER(title) LIKE LOWER($${paramIndex}) OR LOWER(subtitle) LIKE LOWER($${paramIndex + 1}) OR LOWER(description) LIKE LOWER($${paramIndex + 2}))`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      paramIndex += 3;
    }

    if (minPrice) {
      sql += ` AND price >= $${paramIndex}`;
      params.push(Number(minPrice));
      paramIndex++;
    }

    if (maxPrice) {
      sql += ` AND price <= $${paramIndex}`;
      params.push(Number(maxPrice));
      paramIndex++;
    }

    if (inStock === 'true') {
      sql += ' AND stock > 0';
    }

    if (featured === 'true') {
      sql += ' AND is_featured = 1';
    }

    if (bestseller === 'true') {
      sql += ' AND is_bestseller = 1';
    }

    // Sorting
    switch (sort) {
      case 'price_asc':
        sql += ' ORDER BY price ASC';
        break;
      case 'price_desc':
        sql += ' ORDER BY price DESC';
        break;
      case 'rating':
        sql += ' ORDER BY rating DESC';
        break;
      case 'newest':
        sql += ' ORDER BY id DESC';
        break;
      case 'bestseller':
      default:
        sql += ' ORDER BY is_bestseller DESC, is_featured DESC, id ASC';
        break;
    }

    if (limit) {
      sql += ` LIMIT $${paramIndex}`;
      params.push(Number(limit));
      paramIndex++;
    }

    const { rows } = await query(sql, params);

    const products = rows.map(p => ({
      ...p,
      gallery: p.gallery_json ? JSON.parse(p.gallery_json) : [p.image_url],
      shades: p.shades_json ? JSON.parse(p.shades_json) : []
    }));

    res.json(products);
  } catch (err) {
    console.error('Fetch products error:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product by ID or slug
router.get('/:idOrSlug', async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    let productRows;

    if (!isNaN(Number(idOrSlug))) {
      const result = await query('SELECT * FROM products WHERE id = $1', [Number(idOrSlug)]);
      productRows = result.rows;
    } else {
      const result = await query('SELECT * FROM products WHERE slug = $1', [idOrSlug]);
      productRows = result.rows;
    }

    const product = productRows[0];
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const { rows: reviews } = await query('SELECT * FROM reviews WHERE product_id = $1 ORDER BY id DESC', [product.id]);
    const { rows: variants } = await query('SELECT * FROM product_variants WHERE product_id = $1 ORDER BY is_default DESC, id ASC', [product.id]);

    const result = {
      ...product,
      gallery: product.gallery_json ? JSON.parse(product.gallery_json) : [product.image_url],
      shades: product.shades_json ? JSON.parse(product.shades_json) : [],
      reviews,
      variants
    };

    res.json(result);
  } catch (err) {
    console.error('Fetch product detail error:', err);
    res.status(500).json({ error: 'Failed to fetch product details' });
  }
});

// Add customer review
router.post('/:id/reviews', optionalCustomer, async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const { customerName, rating, title, comment } = req.body;

    if (!customerName || !rating || !title || !comment) {
      return res.status(400).json({ error: 'Please provide all review fields.' });
    }

    const tier = req.customer ? 'Circle Privé Member' : 'Verified Patron';
    const now = new Date().toISOString();

    await query(`
      INSERT INTO reviews (product_id, customer_name, customer_tier, rating, title, comment, verified_purchase, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, 1, $7)
    `, [productId, customerName, tier, Number(rating), title, comment, now]);

    // Update product rating and reviews count
    const { rows: statsRows } = await query('SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM reviews WHERE product_id = $1', [productId]);
    const stats = statsRows[0];
    await query('UPDATE products SET rating = $1, reviews_count = $2 WHERE id = $3', [
      parseFloat(parseFloat(stats.avg_rating).toFixed(2)),
      parseInt(stats.count),
      productId
    ]);

    res.status(201).json({ success: true, message: 'Review successfully submitted.' });
  } catch (err) {
    console.error('Add review error:', err);
    res.status(500).json({ error: 'Failed to post review' });
  }
});

/* =========================================================================
   ADMIN PRODUCT MANAGEMENT (CRUD)
   ========================================================================= */

// Create product (Admin)
router.post('/admin/create', authenticateAdmin, async (req, res) => {
  try {
    const {
      title, subtitle, category, discipline, price, compareAtPrice,
      description, benefits, ingredients, volume, stock, image_url,
      sensorialFragrance, sensorialTexture, sensorialFinish,
      clinicalMetric1Val, clinicalMetric1Lbl, clinicalMetric2Val, clinicalMetric2Lbl,
      isFeatured, isBestseller, shades
    } = req.body;

    if (!title || !category || !price || !description || !image_url) {
      return res.status(400).json({ error: 'Title, category, price, description, and image URL are required.' });
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);
    const now = new Date().toISOString();
    const parsedStock = Number(stock) || 0;

    const { rows: insertRows } = await query(`
      INSERT INTO products (
        title, subtitle, slug, category, discipline, price, compare_at_price,
        rating, reviews_count, description, benefits, ingredients,
        sensorial_fragrance, sensorial_texture, sensorial_finish,
        clinical_metric_1_val, clinical_metric_1_lbl, clinical_metric_2_val, clinical_metric_2_lbl,
        volume, stock, image_url, gallery_json, shades_json, is_featured, is_bestseller,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        5.0, 0, $8, $9, $10,
        $11, $12, $13,
        $14, $15, $16, $17,
        $18, $19, $20, $21, $22, $23, $24,
        $25, $26
      )
      RETURNING id
    `, [
      title,
      subtitle || '',
      slug,
      category,
      discipline || category,
      Number(price),
      compareAtPrice ? Number(compareAtPrice) : null,
      description,
      benefits || '',
      ingredients || '',
      sensorialFragrance || 'Delicate floral botanical harmony',
      sensorialTexture || 'Silk liquid emulsion',
      sensorialFinish || 'Luminous radiant cushion',
      clinicalMetric1Val || '98%',
      clinicalMetric1Lbl || 'High Patient Satisfaction',
      clinicalMetric2Val || '24h',
      clinicalMetric2Lbl || 'Continuous Barrier Hydration',
      volume || '50 ml / 1.7 fl. oz.',
      parsedStock,
      image_url,
      JSON.stringify([image_url]),
      shades ? JSON.stringify(shades) : JSON.stringify([]),
      isFeatured ? 1 : 0,
      isBestseller ? 1 : 0,
      now,
      now
    ]);

    const newProductId = insertRows[0].id;

    // Log initial stock in inventory logs
    await query(`
      INSERT INTO inventory_logs (product_id, product_title, change_amount, reason, previous_stock, new_stock, logged_at)
      VALUES ($1, $2, $3, 'Initial Stock Entry', 0, $4, $5)
    `, [newProductId, title, parsedStock, parsedStock, now]);

    const { rows: createdRows } = await query('SELECT * FROM products WHERE id = $1', [newProductId]);
    const createdProduct = createdRows[0];

    res.status(201).json({
      success: true,
      product: {
        ...createdProduct,
        gallery: createdProduct.gallery_json ? JSON.parse(createdProduct.gallery_json) : [createdProduct.image_url],
        shades: createdProduct.shades_json ? JSON.parse(createdProduct.shades_json) : []
      }
    });
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product (Admin)
router.put('/admin/:id', authenticateAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { rows: existingRows } = await query('SELECT * FROM products WHERE id = $1', [id]);
    const existing = existingRows[0];
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const {
      title, subtitle, category, discipline, price, compareAtPrice,
      description, benefits, ingredients, volume, stock, image_url,
      sensorialFragrance, sensorialTexture, sensorialFinish,
      isFeatured, isBestseller
    } = req.body;

    const newStock = stock !== undefined ? Number(stock) : existing.stock;
    const now = new Date().toISOString();

    // Check if stock changed
    if (newStock !== existing.stock) {
      const diff = newStock - existing.stock;
      await query(`
        INSERT INTO inventory_logs (product_id, product_title, change_amount, reason, previous_stock, new_stock, logged_at)
        VALUES ($1, $2, $3, 'Admin Stock Edit', $4, $5, $6)
      `, [id, title || existing.title, diff, existing.stock, newStock, now]);
    }

    await query(`
      UPDATE products SET
        title = $1,
        subtitle = $2,
        category = $3,
        discipline = $4,
        price = $5,
        compare_at_price = $6,
        description = $7,
        benefits = $8,
        ingredients = $9,
        volume = $10,
        stock = $11,
        image_url = $12,
        sensorial_fragrance = $13,
        sensorial_texture = $14,
        sensorial_finish = $15,
        is_featured = $16,
        is_bestseller = $17,
        updated_at = $18
      WHERE id = $19
    `, [
      title || existing.title,
      subtitle !== undefined ? subtitle : existing.subtitle,
      category || existing.category,
      discipline || existing.discipline,
      price !== undefined ? Number(price) : existing.price,
      compareAtPrice !== undefined ? (compareAtPrice ? Number(compareAtPrice) : null) : existing.compare_at_price,
      description || existing.description,
      benefits !== undefined ? benefits : existing.benefits,
      ingredients !== undefined ? ingredients : existing.ingredients,
      volume || existing.volume,
      newStock,
      image_url || existing.image_url,
      sensorialFragrance || existing.sensorial_fragrance,
      sensorialTexture || existing.sensorial_texture,
      sensorialFinish || existing.sensorial_finish,
      isFeatured !== undefined ? (isFeatured ? 1 : 0) : existing.is_featured,
      isBestseller !== undefined ? (isBestseller ? 1 : 0) : existing.is_bestseller,
      now,
      id
    ]);

    const { rows: updatedRows } = await query('SELECT * FROM products WHERE id = $1', [id]);
    const updated = updatedRows[0];
    res.json({
      success: true,
      product: {
        ...updated,
        gallery: updated.gallery_json ? JSON.parse(updated.gallery_json) : [updated.image_url],
        shades: updated.shades_json ? JSON.parse(updated.shades_json) : []
      }
    });
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product (Admin)
router.delete('/admin/:id', authenticateAdmin, authenticateSuperAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { rows: existingRows } = await query('SELECT id, title FROM products WHERE id = $1', [id]);
    const existing = existingRows[0];
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await query('DELETE FROM products WHERE id = $1', [id]);
    res.json({ success: true, message: `Product "${existing.title}" successfully removed.` });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

/* =========================================================================
   PRODUCT VARIANTS
   ========================================================================= */

// Get variants for a product
router.get('/admin/:id/variants', authenticateAdmin, async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const { rows } = await query('SELECT * FROM product_variants WHERE product_id = $1 ORDER BY is_default DESC, id ASC', [productId]);
    res.json(rows);
  } catch (err) {
    console.error('Fetch variants error:', err);
    res.status(500).json({ error: 'Failed to fetch variants' });
  }
});

// Add a variant
router.post('/admin/:id/variants', authenticateAdmin, async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const { sku, variantLabel, variantType, priceModifier, stock, imageUrl, isDefault } = req.body;

    if (!variantLabel || !variantType) {
      return res.status(400).json({ error: 'Variant label and type are required.' });
    }

    // If setting as default, unset others
    if (isDefault) {
      await query('UPDATE product_variants SET is_default = 0 WHERE product_id = $1', [productId]);
    }

    const now = new Date().toISOString();
    const { rows } = await query(`
      INSERT INTO product_variants (product_id, sku, variant_label, variant_type, price_modifier, stock, image_url, is_default, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      productId,
      sku || null,
      variantLabel,
      variantType,
      Number(priceModifier) || 0,
      Number(stock) || 0,
      imageUrl || null,
      isDefault ? 1 : 0,
      now
    ]);

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Add variant error:', err);
    res.status(500).json({ error: 'Failed to add variant' });
  }
});

// Update a variant
router.put('/admin/variants/:variantId', authenticateAdmin, async (req, res) => {
  try {
    const variantId = Number(req.params.variantId);
    const { rows: existing } = await query('SELECT * FROM product_variants WHERE id = $1', [variantId]);
    if (existing.length === 0) return res.status(404).json({ error: 'Variant not found' });

    const current = existing[0];
    const { sku, variantLabel, variantType, priceModifier, stock, imageUrl, isDefault } = req.body;

    if (isDefault) {
      await query('UPDATE product_variants SET is_default = 0 WHERE product_id = $1', [current.product_id]);
    }

    await query(`
      UPDATE product_variants SET
        sku = $1, variant_label = $2, variant_type = $3, price_modifier = $4,
        stock = $5, image_url = $6, is_default = $7
      WHERE id = $8
    `, [
      sku !== undefined ? sku : current.sku,
      variantLabel || current.variant_label,
      variantType || current.variant_type,
      priceModifier !== undefined ? Number(priceModifier) : current.price_modifier,
      stock !== undefined ? Number(stock) : current.stock,
      imageUrl !== undefined ? imageUrl : current.image_url,
      isDefault !== undefined ? (isDefault ? 1 : 0) : current.is_default,
      variantId
    ]);

    const { rows: updated } = await query('SELECT * FROM product_variants WHERE id = $1', [variantId]);
    res.json(updated[0]);
  } catch (err) {
    console.error('Update variant error:', err);
    res.status(500).json({ error: 'Failed to update variant' });
  }
});

// Delete a variant
router.delete('/admin/variants/:variantId', authenticateAdmin, async (req, res) => {
  try {
    const variantId = Number(req.params.variantId);
    const { rows } = await query('SELECT * FROM product_variants WHERE id = $1', [variantId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Variant not found' });

    await query('DELETE FROM product_variants WHERE id = $1', [variantId]);
    res.json({ success: true, message: 'Variant deleted.' });
  } catch (err) {
    console.error('Delete variant error:', err);
    res.status(500).json({ error: 'Failed to delete variant' });
  }
});

export default router;

