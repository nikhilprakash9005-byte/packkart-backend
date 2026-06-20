const pool = require('../config/db');
exports.getDeliveryBoys = async function(req, res) {
  try {
    const r = await pool.query("SELECT db.*,COUNT(CASE WHEN o.delivery_date=CURRENT_DATE AND o.status!='delivered' THEN 1 END) as today_deliveries,COUNT(CASE WHEN o.status='delivered' THEN 1 END) as total_deliveries FROM delivery_boys db LEFT JOIN orders o ON o.delivery_boy_id=db.id GROUP BY db.id ORDER BY db.name");
    res.json({ success: true, deliveryBoys: r.rows });
  } catch(e) { res.status(500).json({ success: false, message: 'Failed' }); }
};
exports.addDeliveryBoy = async function(req, res) {
  try { const r = await pool.query('INSERT INTO delivery_boys (name,phone) VALUES ($1,$2) RETURNING *', [req.body.name, req.body.phone]); res.json({ success: true, deliveryBoy: r.rows[0] }); }
  catch(e) { res.status(500).json({ success: false, message: 'Failed' }); }
};
exports.toggleActive = async function(req, res) {
  try { const r = await pool.query('UPDATE delivery_boys SET active=NOT active WHERE id=$1 RETURNING *', [req.params.id]); res.json({ success: true, deliveryBoy: r.rows[0] }); }
  catch(e) { res.status(500).json({ success: false, message: 'Failed' }); }
};
exports.getMyOrders = async function(req, res) {
  try { const r = await pool.query('SELECT o.*,json_agg(oi.*) as items FROM orders o LEFT JOIN order_items oi ON oi.order_id=o.id WHERE o.delivery_boy_id=$1 AND o.delivery_date=CURRENT_DATE GROUP BY o.id ORDER BY o.delivery_slot', [req.params.id]); res.json({ success: true, orders: r.rows }); }
  catch(e) { res.status(500).json({ success: false, message: 'Failed' }); }
};