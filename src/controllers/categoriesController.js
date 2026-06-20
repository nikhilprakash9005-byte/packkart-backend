
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
