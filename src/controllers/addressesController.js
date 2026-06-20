const pool = require('../config/db');
exports.getAddresses = async function(req, res) {
  try { const r = await pool.query('SELECT * FROM addresses WHERE user_id=$1 ORDER BY is_default DESC,created_at DESC', [req.user.id]); res.json({ success: true, addresses: r.rows }); }
  catch(e) { res.status(500).json({ success: false, message: 'Failed' }); }
};
exports.addAddress = async function(req, res) {
  const { name, address, city, pincode, phone } = req.body;
  try {
    const cnt = await pool.query('SELECT COUNT(*) FROM addresses WHERE user_id=$1', [req.user.id]);
    const isDefault = parseInt(cnt.rows[0].count) === 0;
    const r = await pool.query('INSERT INTO addresses (user_id,name,address,city,pincode,phone,is_default) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *', [req.user.id, name, address, city, pincode, phone, isDefault]);
    res.json({ success: true, address: r.rows[0] });
  } catch(e) { res.status(500).json({ success: false, message: 'Failed' }); }
};
exports.updateAddress = async function(req, res) {
  const { name, address, city, pincode, phone } = req.body;
  try { const r = await pool.query('UPDATE addresses SET name=$1,address=$2,city=$3,pincode=$4,phone=$5 WHERE id=$6 AND user_id=$7 RETURNING *', [name, address, city, pincode, phone, req.params.id, req.user.id]); res.json({ success: true, address: r.rows[0] }); }
  catch(e) { res.status(500).json({ success: false, message: 'Failed' }); }
};
exports.deleteAddress = async function(req, res) {
  try { await pool.query('DELETE FROM addresses WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]); res.json({ success: true }); }
  catch(e) { res.status(500).json({ success: false, message: 'Failed' }); }
};
exports.setDefault = async function(req, res) {
  try {
    await pool.query('UPDATE addresses SET is_default=false WHERE user_id=$1', [req.user.id]);
    await pool.query('UPDATE addresses SET is_default=true WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ success: false, message: 'Failed' }); }
};