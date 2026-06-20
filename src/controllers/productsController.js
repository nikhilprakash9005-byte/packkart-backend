const pool = require('../config/db');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Get all products (customer facing)
exports.getProducts = async (req, res) => {
  try {
    const { category_id } = req.query;
    let query = `
      SELECT p.*, c.name as category_name, c.icon as category_icon,
        json_agg(ps.* ORDER BY ps.sort_order) as sizes
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_sizes ps ON ps.product_id = p.id
      WHERE 1 = 1
    `;
    const params = [];
    if (category_id) { query += ` AND p.category_id = $1`; params.push(category_id); }
    query += ' GROUP BY p.id, c.name, c.icon, c.sort_order ORDER BY c.sort_order, p.name';
    const result = await pool.query(query, params);
    res.json({ success: true, products: result.rows });
  } catch (error) {
    console.error('getProducts error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get categories
exports.getCategories = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY sort_order');
    res.json({ success: true, categories: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
};

// Search products
exports.searchProducts = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json({ success: true, results: [] });
    const result = await pool.query(`
      SELECT p.id, p.name, p.photos, ps.id as size_id, ps.label as size_label,
        ps.pricing_tiers, ps.stock as size_stock, ps.moq
      FROM products p
      JOIN product_sizes ps ON ps.product_id = p.id
      WHERE p.stock = true AND (
        LOWER(p.name) LIKE LOWER($1) OR
        LOWER(ps.label) LIKE LOWER($1) OR
        LOWER(p.category_id) LIKE LOWER($1)
      )
      LIMIT 30
    `, [`%${q}%`]);
    res.json({ success: true, results: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Search failed' });
  }
};

// Admin: Create product
exports.createProduct = async (req, res) => {
  const { id, category_id, name, description } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO products (id, category_id, name, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, category_id, name, description]
    );
    res.json({ success: true, product: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create product' });
  }
};

// Admin: Update product
exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, description, stock } = req.body;
  try {
    const result = await pool.query(
      'UPDATE products SET name=$1, description=$2, stock=$3, updated_at=NOW() WHERE id=$4 RETURNING *',
      [name, description, stock, id]
    );
    res.json({ success: true, product: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update product' });
  }
};

// Admin: Upload product photo
exports.uploadPhoto = async (req, res) => {
  const { id } = req.params;
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    
    let photoUrl;
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    
    if (cloudName && apiKey && apiSecret) {
      const cloudinary = require('cloudinary').v2;
      cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
      const result = await cloudinary.uploader.upload(req.file.path, { folder: 'packkart/products' });
      photoUrl = result.secure_url;
      console.log('Uploaded to Cloudinary:', photoUrl);
    } else {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';
      photoUrl = `${backendUrl}/uploads/${req.file.filename}`;
    }
    
    const product = await pool.query('SELECT photos FROM products WHERE id = $1', [id]);
    const photos = product.rows[0].photos || [];
    photos.push(photoUrl);
    await pool.query('UPDATE products SET photos=$1, updated_at=NOW() WHERE id=$2', [JSON.stringify(photos), id]);
    res.json({ success: true, photoUrl, photos });
  } catch (error) {
    console.error('Photo upload error:', error.message);
    res.status(500).json({ success: false, message: 'Photo upload failed: ' + error.message });
  }
};

// Admin: Delete photo
exports.deletePhoto = async (req, res) => {
  const { id } = req.params;
  const { photoUrl } = req.body;
  try {
    const product = await pool.query('SELECT photos FROM products WHERE id = $1', [id]);
    const photos = (product.rows[0].photos || []).filter(p => p !== photoUrl);
    await pool.query('UPDATE products SET photos=$1 WHERE id=$2', [JSON.stringify(photos), id]);
    res.json({ success: true, photos });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete photo' });
  }
};

// Admin: Update pricing tiers (bulk rate editor)
exports.updatePricingTiers = async (req, res) => {
  const { updates } = req.body;
  try {
    for (const update of updates) {
      await pool.query(
        'UPDATE product_sizes SET pricing_tiers=$1 WHERE id=$2',
        [JSON.stringify(update.pricingTiers), update.sizeId]
      );
    }
    res.json({ success: true, message: 'Rates updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update rates' });
  }
};

// Admin: Update single size
exports.updateSize = async (req, res) => {
  const { id, sizeId } = req.params;
  const { label, moq, stock, pricing_tiers } = req.body;
  try {
    const result = await pool.query(
      'UPDATE product_sizes SET label=$1, moq=$2, stock=$3, pricing_tiers=$4 WHERE id=$5 AND product_id=$6 RETURNING *',
      [label, moq, stock, JSON.stringify(pricing_tiers), sizeId, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Size not found' });
    res.json({ success: true, size: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to update size: ' + error.message });
  }
};

// Admin: Create new size
exports.createSize = async (req, res) => {
  const { id } = req.params;
  const { label, moq, stock, pricing_tiers } = req.body;
  try {
    const sizeId = id + '-s' + Date.now();
    const sortRes = await pool.query(
      'SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM product_sizes WHERE product_id = $1',
      [id]
    );
    const sortOrder = parseInt(sortRes.rows[0].next_order) || 1;
    const result = await pool.query(
      'INSERT INTO product_sizes (id, product_id, label, moq, stock, pricing_tiers, sort_order) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      [sizeId, id, label, moq || '1 kg', stock !== false, JSON.stringify(pricing_tiers || []), sortOrder]
    );
    res.json({ success: true, size: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to create size: ' + error.message });
  }
};

// Admin: Delete size
exports.deleteSize = async (req, res) => {
  const { id, sizeId } = req.params;
  try {
    await pool.query(
      'DELETE FROM product_sizes WHERE id=$1 AND product_id=$2',
      [sizeId, id]
    );
    res.json({ success: true, message: 'Size deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to delete size' });
  }
};

exports.deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM product_sizes WHERE product_id=$1', [id]);
    await pool.query('DELETE FROM products WHERE id=$1', [id]);
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete product' });
  }
};
// Admin: Get ALL products including out-of-stock
exports.getProductsAdmin = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, c.name as category_name, c.icon as category_icon,
        json_agg(ps.* ORDER BY ps.sort_order) as sizes
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_sizes ps ON ps.product_id = p.id
      GROUP BY p.id, c.name, c.icon, c.sort_order
      ORDER BY c.sort_order, p.name
    `);
    res.json({ success: true, products: result.rows });
  } catch (error) {
    console.error('getProductsAdmin error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
