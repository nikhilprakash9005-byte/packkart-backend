const fs = require('fs');
const path = require('path');

// ── Add createSize to controller ─────────────────────────────────────────────
const ctrlPath = path.join(__dirname, 'src/controllers/productsController.js');
let ctrl = fs.readFileSync(ctrlPath, 'utf8');

if (!ctrl.includes('exports.createSize')) {
  ctrl += `
// Create a new size for a product
exports.createSize = async (req, res) => {
  const { id } = req.params;
  const { label, moq, stock, pricing_tiers } = req.body;
  try {
    const sizeId = id + '-s' + Date.now();
    const result = await pool.query(
      'INSERT INTO product_sizes (id, product_id, label, moq, stock, pricing_tiers, sort_order) VALUES ($1,$2,$3,$4,$5,$6, (SELECT COALESCE(MAX(sort_order),0)+1 FROM product_sizes WHERE product_id=$2)) RETURNING *',
      [sizeId, id, label, moq || '1 kg', stock !== false, JSON.stringify(pricing_tiers || []), id]
    );
    res.json({ success: true, size: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to create size: ' + error.message });
  }
};
`;
  fs.writeFileSync(ctrlPath, ctrl);
  console.log('✅ createSize added to controller');
} else {
  console.log('ℹ️  createSize already exists');
}

// ── Add route ────────────────────────────────────────────────────────────────
const routePath = path.join(__dirname, 'src/routes/products.js');
let route = fs.readFileSync(routePath, 'utf8');

if (!route.includes('createSize')) {
  // Add to require
  route = route.replace(
    /const c = require\('\.\.\/controllers\/productsController'\);/,
    `const c = require('../controllers/productsController');`
  );
  // Add route before module.exports
  route = route.replace(
    'module.exports = router;',
    `router.post('/:id/sizes', authenticateStaff, requireRole('super_admin', 'manager'), c.createSize);\nmodule.exports = router;`
  );
  fs.writeFileSync(routePath, route);
  console.log('✅ POST /:id/sizes route added');
} else {
  console.log('ℹ️  createSize route already exists');
}

console.log('\n✅ Done! Restart backend: npm run dev');
