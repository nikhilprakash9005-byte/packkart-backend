const fs = require('fs');
const path = require('path');

// ── 1. Add getProductsAdmin + deleteProduct + category routes to productsController ──
const ctrlPath = path.join(__dirname, 'src/controllers/productsController.js');
let ctrl = fs.readFileSync(ctrlPath, 'utf8');

if (!ctrl.includes('exports.getProductsAdmin')) {
  ctrl += `
// Admin: Get ALL products including out-of-stock
exports.getProductsAdmin = async (req, res) => {
  try {
    const result = await pool.query(\`
      SELECT p.*, c.name as category_name, c.icon as category_icon,
        json_agg(ps.* ORDER BY ps.sort_order) as sizes
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_sizes ps ON ps.product_id = p.id
      GROUP BY p.id, c.name, c.icon, c.sort_order
      ORDER BY c.sort_order, p.name
    \`);
    res.json({ success: true, products: result.rows });
  } catch (error) {
    console.error('getProductsAdmin error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
`;
  console.log('✅ getProductsAdmin added');
}

if (!ctrl.includes('exports.deleteProduct')) {
  ctrl += `
// Admin: Delete product and all its sizes
exports.deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM product_sizes WHERE product_id=$1', [id]);
    await pool.query('DELETE FROM products WHERE id=$1', [id]);
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete product: ' + error.message });
  }
};
`;
  console.log('✅ deleteProduct added');
}

fs.writeFileSync(ctrlPath, ctrl);

// ── 2. Add category controller ──
const catCtrlPath = path.join(__dirname, 'src/controllers/categoriesController.js');
if (!fs.existsSync(catCtrlPath)) {
  fs.writeFileSync(catCtrlPath, `
const pool = require('../config/db');

exports.createCategory = async (req, res) => {
  const { id, name, icon, sort_order } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO categories (id, name, icon, sort_order) VALUES ($1,$2,$3,$4) RETURNING *',
      [id, name, icon || '📦', sort_order || 99]
    );
    res.json({ success: true, category: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create category: ' + error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    // Delete all sizes of products in this category
    await pool.query('DELETE FROM product_sizes WHERE product_id IN (SELECT id FROM products WHERE category_id=$1)', [id]);
    // Delete all products in this category
    await pool.query('DELETE FROM products WHERE category_id=$1', [id]);
    // Delete the category
    await pool.query('DELETE FROM categories WHERE id=$1', [id]);
    res.json({ success: true, message: 'Category and all products deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete category: ' + error.message });
  }
};
`);
  console.log('✅ categoriesController.js created');
}

// ── 3. Add routes ──
const routesPath = path.join(__dirname, 'src/routes/products.js');
let routes = fs.readFileSync(routesPath, 'utf8');

if (!routes.includes('getProductsAdmin')) {
  routes = routes.replace(
    'module.exports = router;',
    `router.get('/all', authenticateStaff, requireRole('super_admin','manager'), c.getProductsAdmin);\nrouter.delete('/:id', authenticateStaff, requireRole('super_admin'), c.deleteProduct);\nmodule.exports = router;`
  );
  fs.writeFileSync(routesPath, routes);
  console.log('✅ /all and DELETE /:id routes added');
}

// ── 4. Add category routes ──
const serverPath = path.join(__dirname, 'src/server.js');
let server = fs.readFileSync(serverPath, 'utf8');

if (!server.includes('categoriesRouter') && !server.includes('/api/categories')) {
  // Create categories route file
  fs.writeFileSync(path.join(__dirname, 'src/routes/categories.js'), `
const express = require('express');
const router = express.Router();
const { authenticateStaff, requireRole } = require('../middleware/auth');
const { createCategory, deleteCategory } = require('../controllers/categoriesController');

router.post('/', authenticateStaff, requireRole('super_admin'), createCategory);
router.delete('/:id', authenticateStaff, requireRole('super_admin'), deleteCategory);

module.exports = router;
`);

  // Add to server.js
  server = server.replace(
    "app.use('/api/products', require('./routes/products'));",
    "app.use('/api/products', require('./routes/products'));\napp.use('/api/categories', require('./routes/categories'));"
  );
  fs.writeFileSync(serverPath, server);
  console.log('✅ /api/categories route added to server.js');
} else {
  console.log('ℹ️  Categories route already exists');
}

console.log('\n✅ All patches done! Restart: npm run dev');
