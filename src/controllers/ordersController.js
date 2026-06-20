const pool = require('../config/db');
const genId = () => 'ORD' + Date.now().toString().slice(-6);
exports.placeOrder = async function(req, res) {
  const b = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const id = genId();
    await client.query('INSERT INTO orders (id,user_id,customer_name,customer_phone,address,city,pincode,delivery_type,delivery_date,delivery_slot,delivery_charge,subtotal,total,payment_method) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)', [id, req.user.id, b.customer_name, req.user.phone, b.address, b.city, b.pincode, b.delivery_type, b.delivery_date, b.delivery_slot, b.delivery_charge, b.subtotal, b.total, b.payment_method]);
    for (const item of b.items) { await client.query('INSERT INTO order_items (order_id,product_id,product_name,size_id,size_label,quantity,price_per_kg,tier_label,total) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)', [id, item.productId, item.productName, item.sizeId, item.sizeLabel, item.quantity, item.pricePerKg, item.tierLabel, item.pricePerKg*item.quantity]); }
    await client.query('COMMIT');
    res.json({ success: true, orderId: id, message: 'Order placed' });
  } catch(e) { await client.query('ROLLBACK'); console.error(e); res.status(500).json({ success: false, message: 'Failed to place order' }); }
  finally { client.release(); }
};
exports.getMyOrders = async function(req, res) {
  try {
    const r = await pool.query('SELECT o.*,json_agg(oi.*) as items,db.name as delivery_boy_name,db.phone as delivery_boy_phone FROM orders o LEFT JOIN order_items oi ON oi.order_id=o.id LEFT JOIN delivery_boys db ON db.id=o.delivery_boy_id WHERE o.user_id=$1 GROUP BY o.id,db.name,db.phone ORDER BY o.created_at DESC', [req.user.id]);
    res.json({ success: true, orders: r.rows });
  } catch(e) { res.status(500).json({ success: false, message: 'Failed to fetch orders' }); }
};
exports.getAllOrders = async function(req, res) {
  try {
    let q = 'SELECT o.*,json_agg(oi.*) as items,db.name as delivery_boy_name,db.phone as delivery_boy_phone FROM orders o LEFT JOIN order_items oi ON oi.order_id=o.id LEFT JOIN delivery_boys db ON db.id=o.delivery_boy_id WHERE 1=1';
    const params = [];
    if (req.query.status) { params.push(req.query.status); q += ' AND o.status=$'+params.length; }
    if (req.query.date) { params.push(req.query.date); q += ' AND o.delivery_date=$'+params.length; }
    q += ' GROUP BY o.id,db.name,db.phone ORDER BY o.created_at DESC';
    const r = await pool.query(q, params);
    res.json({ success: true, orders: r.rows });
  } catch(e) { res.status(500).json({ success: false, message: 'Failed to fetch orders' }); }
};
exports.updateOrderStatus = async function(req, res) {
  try { await pool.query('UPDATE orders SET status=$1,updated_at=NOW() WHERE id=$2', [req.body.status, req.params.id]); res.json({ success: true }); }
  catch(e) { res.status(500).json({ success: false, message: 'Failed to update status' }); }
};
exports.assignDeliveryBoy = async function(req, res) {
  try {
    await pool.query("UPDATE orders SET delivery_boy_id=$1,status='confirmed',updated_at=NOW() WHERE id=$2", [req.body.delivery_boy_id, req.params.id]);
    await pool.query('INSERT INTO delivery_assignments (order_id,delivery_boy_id) VALUES ($1,$2)', [req.params.id, req.body.delivery_boy_id]);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ success: false, message: 'Failed to assign' }); }
};