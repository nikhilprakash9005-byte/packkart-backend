const fs = require('fs');
const path = require('path');

// ── Patch productsController.js ──────────────────────────────────────────────
const ctrlPath = path.join(__dirname, 'src/controllers/productsController.js');
let ctrl = fs.readFileSync(ctrlPath, 'utf8');

if (!ctrl.includes('exports.updateSize')) {
  ctrl += `
// Update single size (label, moq, stock, pricing_tiers)
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
    res.status(500).json({ success: false, message: 'Failed to update size' });
  }
};
`;
  fs.writeFileSync(ctrlPath, ctrl);
  console.log('✅ productsController.js patched');
} else {
  console.log('ℹ️  productsController.js already has updateSize');
}

// ── Patch routes/products.js ─────────────────────────────────────────────────
const routePath = path.join(__dirname, 'src/routes/products.js');
let route = fs.readFileSync(routePath, 'utf8');

if (!route.includes('updateSize')) {
  // Add to destructured import
  route = route.replace(
    /const \{([^}]+)\} = require\('\.\.\/controllers\/productsController'\);/,
    (match, inner) => `const {${inner.trimEnd()}, updateSize } = require('../controllers/productsController');`
  );
  // Add route before module.exports
  route = route.replace(
    'module.exports = router;',
    `router.put('/:id/sizes/:sizeId', authenticateStaff, requireRole('super_admin', 'manager'), updateSize);\nmodule.exports = router;`
  );
  fs.writeFileSync(routePath, route);
  console.log('✅ routes/products.js patched');
} else {
  console.log('ℹ️  routes/products.js already has updateSize route');
}

console.log('\n✅ Backend patch complete! Restart with: npm run dev');
