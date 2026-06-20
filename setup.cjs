const fs = require('fs')
const path = require('path')

const write = (filePath, content) => {
  const fullPath = path.join(__dirname, filePath)
  const dir = path.dirname(fullPath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(fullPath, content)
  console.log('created: ' + filePath)
}

write('src/config/schema.sql', [
  "CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, phone VARCHAR(10) UNIQUE NOT NULL, name VARCHAR(100), email VARCHAR(100), gst_number VARCHAR(15), gst_business_name VARCHAR(200), created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW());",
  "CREATE TABLE IF NOT EXISTS addresses (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) ON DELETE CASCADE, name VARCHAR(50) NOT NULL, address TEXT NOT NULL, city VARCHAR(50) NOT NULL, pincode VARCHAR(6) NOT NULL, phone VARCHAR(10) NOT NULL, is_default BOOLEAN DEFAULT false, created_at TIMESTAMP DEFAULT NOW());",
  "CREATE TABLE IF NOT EXISTS staff (id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, phone VARCHAR(10) UNIQUE NOT NULL, pin VARCHAR(60) NOT NULL, role VARCHAR(20) NOT NULL DEFAULT 'staff', active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT NOW());",
  "CREATE TABLE IF NOT EXISTS categories (id VARCHAR(20) PRIMARY KEY, name VARCHAR(100) NOT NULL, icon VARCHAR(10), sort_order INTEGER DEFAULT 0);",
  "CREATE TABLE IF NOT EXISTS products (id VARCHAR(50) PRIMARY KEY, category_id VARCHAR(20) REFERENCES categories(id), name VARCHAR(200) NOT NULL, description TEXT, stock BOOLEAN DEFAULT true, photos JSONB DEFAULT '[]', created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW());",
  "CREATE TABLE IF NOT EXISTS product_sizes (id VARCHAR(50) PRIMARY KEY, product_id VARCHAR(50) REFERENCES products(id) ON DELETE CASCADE, label VARCHAR(200) NOT NULL, moq VARCHAR(50), stock BOOLEAN DEFAULT true, pricing_tiers JSONB NOT NULL DEFAULT '[]', sort_order INTEGER DEFAULT 0);",
  "CREATE TABLE IF NOT EXISTS otp_verifications (id SERIAL PRIMARY KEY, phone VARCHAR(10) NOT NULL, otp VARCHAR(6) NOT NULL, expires_at TIMESTAMP NOT NULL, verified BOOLEAN DEFAULT false, created_at TIMESTAMP DEFAULT NOW());",
  "CREATE TABLE IF NOT EXISTS orders (id VARCHAR(20) PRIMARY KEY, user_id INTEGER REFERENCES users(id), customer_name VARCHAR(100), customer_phone VARCHAR(10), address TEXT, city VARCHAR(50), pincode VARCHAR(6), delivery_type VARCHAR(20) DEFAULT 'standard', delivery_date DATE, delivery_slot VARCHAR(50), delivery_charge INTEGER DEFAULT 0, subtotal INTEGER NOT NULL, total INTEGER NOT NULL, payment_method VARCHAR(20) DEFAULT 'cod', payment_status VARCHAR(20) DEFAULT 'pending', status VARCHAR(20) DEFAULT 'pending', delivery_boy_id INTEGER, notes TEXT, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW());",
  "CREATE TABLE IF NOT EXISTS order_items (id SERIAL PRIMARY KEY, order_id VARCHAR(20) REFERENCES orders(id) ON DELETE CASCADE, product_id VARCHAR(50), product_name VARCHAR(200), size_id VARCHAR(50), size_label VARCHAR(200), quantity INTEGER NOT NULL, price_per_kg INTEGER NOT NULL, tier_label VARCHAR(50), total INTEGER NOT NULL);",
  "CREATE TABLE IF NOT EXISTS delivery_boys (id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, phone VARCHAR(10) UNIQUE NOT NULL, active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT NOW());",
  "CREATE TABLE IF NOT EXISTS photo_orders (id VARCHAR(20) PRIMARY KEY, customer_phone VARCHAR(10) NOT NULL, note TEXT, photo_url TEXT, status VARCHAR(20) DEFAULT 'pending', created_at TIMESTAMP DEFAULT NOW());",
  "CREATE TABLE IF NOT EXISTS delivery_assignments (id SERIAL PRIMARY KEY, order_id VARCHAR(20) REFERENCES orders(id), delivery_boy_id INTEGER REFERENCES delivery_boys(id), assigned_at TIMESTAMP DEFAULT NOW(), status VARCHAR(20) DEFAULT 'assigned');",
  "INSERT INTO categories (id, name, icon, sort_order) VALUES ('ld','LD Film','🎞',1),('pp','PP Bags','🛍',2),('bopp','BOPP Tape','📦',3),('bubble','Bubble Wrap','🫧',4),('stretch','Stretch Film','🌀',5),('shrink','Shrink Film','🔲',6),('hm','HM Bags','🛒',7),('courier','Courier Bags','📬',8) ON CONFLICT (id) DO NOTHING;",
  "INSERT INTO staff (name, phone, pin, role) VALUES ('Nikhil', '9876543210', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'super_admin') ON CONFLICT (phone) DO NOTHING;"
].join('\n'))

write('src/config/db.js', [
  "const { Pool } = require('pg');",
  "require('dotenv').config();",
  "const pool = new Pool({ host: process.env.DB_HOST, port: process.env.DB_PORT, database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD });",
  "pool.on('connect', () => console.log('Connected to PostgreSQL'));",
  "pool.on('error', (err) => console.error('DB error:', err));",
  "module.exports = pool;"
].join('\n'))

write('src/config/setupDb.js', [
  "const fs = require('fs');",
  "const path = require('path');",
  "const pool = require('./db');",
  "async function setupDatabase() {",
  "  try {",
  "    console.log('Setting up database...');",
  "    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');",
  "    await pool.query(schema);",
  "    console.log('Database schema created successfully!');",
  "    process.exit(0);",
  "  } catch (error) {",
  "    console.error('Database setup failed:', error.message);",
  "    process.exit(1);",
  "  }",
  "}",
  "setupDatabase();"
].join('\n'))

write('src/middleware/auth.js', [
  "const jwt = require('jsonwebtoken');",
  "require('dotenv').config();",
  "exports.authenticateUser = (req, res, next) => {",
  "  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];",
  "  if (!token) return res.status(401).json({ success: false, message: 'No token' });",
  "  try { req.user = jwt.verify(token, process.env.JWT_SECRET); next(); }",
  "  catch (e) { res.status(401).json({ success: false, message: 'Invalid token' }); }",
  "};",
  "exports.authenticateStaff = (req, res, next) => {",
  "  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];",
  "  if (!token) return res.status(401).json({ success: false, message: 'No token' });",
  "  try {",
  "    const decoded = jwt.verify(token, process.env.JWT_SECRET);",
  "    if (!decoded.role) return res.status(403).json({ success: false, message: 'Not authorized' });",
  "    req.staff = decoded; next();",
  "  } catch (e) { res.status(401).json({ success: false, message: 'Invalid token' }); }",
  "};",
  "exports.requireRole = function() {",
  "  const roles = Array.from(arguments);",
  "  return function(req, res, next) {",
  "    if (!roles.includes(req.staff && req.staff.role)) return res.status(403).json({ success: false, message: 'Insufficient permissions' });",
  "    next();",
  "  };",
  "};"
].join('\n'))

write('src/controllers/authController.js', [
  "const pool = require('../config/db');",
  "const jwt = require('jsonwebtoken');",
  "const bcrypt = require('bcryptjs');",
  "const axios = require('axios');",
  "require('dotenv').config();",
  "const genToken = (p) => jwt.sign(p, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });",
  "exports.sendOtp = async function(req, res) {",
  "  const phone = req.body.phone;",
  "  if (!phone || phone.length !== 10) return res.status(400).json({ success: false, message: 'Invalid phone' });",
  "  const otp = Math.floor(100000 + Math.random() * 900000).toString();",
  "  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);",
  "  try {",
  "    await pool.query('DELETE FROM otp_verifications WHERE phone=$1', [phone]);",
  "    await pool.query('INSERT INTO otp_verifications (phone,otp,expires_at) VALUES ($1,$2,$3)', [phone, otp, expiresAt]);",
  "    if (process.env.MSG91_AUTH_KEY && process.env.MSG91_AUTH_KEY !== 'YOUR_MSG91_KEY_HERE') {",
  "      await axios.post('https://control.msg91.com/api/v5/otp', { template_id: process.env.MSG91_TEMPLATE_ID, mobile: '91'+phone, authkey: process.env.MSG91_AUTH_KEY, otp });",
  "    } else { console.log('DEV OTP for '+phone+': '+otp); }",
  "    const r = { success: true, message: 'OTP sent' };",
  "    if (process.env.NODE_ENV === 'development') r.dev_otp = otp;",
  "    res.json(r);",
  "  } catch(e) { console.error(e); res.status(500).json({ success: false, message: 'Failed to send OTP' }); }",
  "};",
  "exports.verifyOtp = async function(req, res) {",
  "  const { phone, otp } = req.body;",
  "  if (!phone || !otp) return res.status(400).json({ success: false, message: 'Phone and OTP required' });",
  "  try {",
  "    const r = await pool.query('SELECT * FROM otp_verifications WHERE phone=$1 AND otp=$2 AND verified=false AND expires_at>NOW()', [phone, otp]);",
  "    if (!r.rows.length) return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });",
  "    await pool.query('UPDATE otp_verifications SET verified=true WHERE id=$1', [r.rows[0].id]);",
  "    let user = await pool.query('SELECT * FROM users WHERE phone=$1', [phone]);",
  "    if (!user.rows.length) user = await pool.query('INSERT INTO users (phone) VALUES ($1) RETURNING *', [phone]);",
  "    const token = genToken({ id: user.rows[0].id, phone, type: 'customer' });",
  "    res.json({ success: true, token, user: user.rows[0], isNewUser: !user.rows[0].name });",
  "  } catch(e) { console.error(e); res.status(500).json({ success: false, message: 'Verification failed' }); }",
  "};",
  "exports.staffLogin = async function(req, res) {",
  "  const { phone, pin } = req.body;",
  "  if (!phone || !pin) return res.status(400).json({ success: false, message: 'Phone and PIN required' });",
  "  try {",
  "    const r = await pool.query('SELECT * FROM staff WHERE phone=$1 AND active=true', [phone]);",
  "    if (!r.rows.length) return res.status(401).json({ success: false, message: 'Invalid credentials' });",
  "    const valid = await bcrypt.compare(pin, r.rows[0].pin);",
  "    if (!valid) return res.status(401).json({ success: false, message: 'Invalid PIN' });",
  "    const token = genToken({ id: r.rows[0].id, phone: r.rows[0].phone, role: r.rows[0].role, name: r.rows[0].name, type: 'staff' });",
  "    res.json({ success: true, token, staff: { id: r.rows[0].id, name: r.rows[0].name, phone: r.rows[0].phone, role: r.rows[0].role } });",
  "  } catch(e) { res.status(500).json({ success: false, message: 'Login failed' }); }",
  "};",
  "exports.updateProfile = async function(req, res) {",
  "  const { name, email, gst_number, gst_business_name } = req.body;",
  "  try {",
  "    const r = await pool.query('UPDATE users SET name=$1,email=$2,gst_number=$3,gst_business_name=$4,updated_at=NOW() WHERE id=$5 RETURNING *', [name, email, gst_number, gst_business_name, req.user.id]);",
  "    res.json({ success: true, user: r.rows[0] });",
  "  } catch(e) { res.status(500).json({ success: false, message: 'Update failed' }); }",
  "};"
].join('\n'))

write('src/controllers/productsController.js', [
  "const pool = require('../config/db');",
  "const cloudinary = require('cloudinary').v2;",
  "require('dotenv').config();",
  "cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });",
  "exports.getProducts = async function(req, res) {",
  "  try {",
  "    const cat = req.query.category_id;",
  "    let q = 'SELECT p.*, c.name as category_name, c.icon as category_icon, json_agg(ps.* ORDER BY ps.sort_order) as sizes FROM products p LEFT JOIN categories c ON p.category_id=c.id LEFT JOIN product_sizes ps ON ps.product_id=p.id WHERE p.stock=true';",
  "    const params = [];",
  "    if (cat) { q += ' AND p.category_id=$1'; params.push(cat); }",
  "    q += ' GROUP BY p.id,c.name,c.icon,c.sort_order ORDER BY c.sort_order,p.name';",
  "    const r = await pool.query(q, params);",
  "    res.json({ success: true, products: r.rows });",
  "  } catch(e) { res.status(500).json({ success: false, message: 'Failed to fetch products' }); }",
  "};",
  "exports.getCategories = async function(req, res) {",
  "  try { const r = await pool.query('SELECT * FROM categories ORDER BY sort_order'); res.json({ success: true, categories: r.rows }); }",
  "  catch(e) { res.status(500).json({ success: false, message: 'Failed to fetch categories' }); }",
  "};",
  "exports.searchProducts = async function(req, res) {",
  "  try {",
  "    const q = req.query.q;",
  "    if (!q) return res.json({ success: true, results: [] });",
  "    const r = await pool.query('SELECT p.id,p.name,p.photos,ps.id as size_id,ps.label as size_label,ps.pricing_tiers,ps.stock as size_stock,ps.moq FROM products p JOIN product_sizes ps ON ps.product_id=p.id WHERE p.stock=true AND (LOWER(p.name) LIKE LOWER($1) OR LOWER(ps.label) LIKE LOWER($1)) LIMIT 30', ['%'+q+'%']);",
  "    res.json({ success: true, results: r.rows });",
  "  } catch(e) { res.status(500).json({ success: false, message: 'Search failed' }); }",
  "};",
  "exports.createProduct = async function(req, res) {",
  "  const { id, category_id, name, description } = req.body;",
  "  try { const r = await pool.query('INSERT INTO products (id,category_id,name,description) VALUES ($1,$2,$3,$4) RETURNING *', [id, category_id, name, description]); res.json({ success: true, product: r.rows[0] }); }",
  "  catch(e) { res.status(500).json({ success: false, message: 'Failed to create product' }); }",
  "};",
  "exports.updateProduct = async function(req, res) {",
  "  const { name, description, stock } = req.body;",
  "  try { const r = await pool.query('UPDATE products SET name=$1,description=$2,stock=$3,updated_at=NOW() WHERE id=$4 RETURNING *', [name, description, stock, req.params.id]); res.json({ success: true, product: r.rows[0] }); }",
  "  catch(e) { res.status(500).json({ success: false, message: 'Failed to update product' }); }",
  "};",
  "exports.uploadPhoto = async function(req, res) {",
  "  try {",
  "    if (!req.file) return res.status(400).json({ success: false, message: 'No file' });",
  "    let url;",
  "    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_CLOUD_NAME !== 'YOUR_CLOUD_NAME') {",
  "      const r = await cloudinary.uploader.upload(req.file.path, { folder: 'packkart/products' });",
  "      url = r.secure_url;",
  "    } else { url = '/uploads/'+req.file.filename; }",
  "    const p = await pool.query('SELECT photos FROM products WHERE id=$1', [req.params.id]);",
  "    const photos = p.rows[0].photos || [];",
  "    photos.push(url);",
  "    await pool.query('UPDATE products SET photos=$1,updated_at=NOW() WHERE id=$2', [JSON.stringify(photos), req.params.id]);",
  "    res.json({ success: true, photoUrl: url, photos });",
  "  } catch(e) { console.error(e); res.status(500).json({ success: false, message: 'Upload failed' }); }",
  "};",
  "exports.deletePhoto = async function(req, res) {",
  "  try {",
  "    const p = await pool.query('SELECT photos FROM products WHERE id=$1', [req.params.id]);",
  "    const photos = (p.rows[0].photos||[]).filter(x => x !== req.body.photoUrl);",
  "    await pool.query('UPDATE products SET photos=$1 WHERE id=$2', [JSON.stringify(photos), req.params.id]);",
  "    res.json({ success: true, photos });",
  "  } catch(e) { res.status(500).json({ success: false, message: 'Delete failed' }); }",
  "};",
  "exports.updatePricingTiers = async function(req, res) {",
  "  try {",
  "    for (const u of req.body.updates) { await pool.query('UPDATE product_sizes SET pricing_tiers=$1 WHERE id=$2', [JSON.stringify(u.pricingTiers), u.sizeId]); }",
  "    res.json({ success: true, message: 'Rates updated' });",
  "  } catch(e) { res.status(500).json({ success: false, message: 'Failed to update rates' }); }",
  "};"
].join('\n'))

write('src/controllers/ordersController.js', [
  "const pool = require('../config/db');",
  "const genId = () => 'ORD' + Date.now().toString().slice(-6);",
  "exports.placeOrder = async function(req, res) {",
  "  const b = req.body;",
  "  const client = await pool.connect();",
  "  try {",
  "    await client.query('BEGIN');",
  "    const id = genId();",
  "    await client.query('INSERT INTO orders (id,user_id,customer_name,customer_phone,address,city,pincode,delivery_type,delivery_date,delivery_slot,delivery_charge,subtotal,total,payment_method) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)', [id, req.user.id, b.customer_name, req.user.phone, b.address, b.city, b.pincode, b.delivery_type, b.delivery_date, b.delivery_slot, b.delivery_charge, b.subtotal, b.total, b.payment_method]);",
  "    for (const item of b.items) { await client.query('INSERT INTO order_items (order_id,product_id,product_name,size_id,size_label,quantity,price_per_kg,tier_label,total) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)', [id, item.productId, item.productName, item.sizeId, item.sizeLabel, item.quantity, item.pricePerKg, item.tierLabel, item.pricePerKg*item.quantity]); }",
  "    await client.query('COMMIT');",
  "    res.json({ success: true, orderId: id, message: 'Order placed' });",
  "  } catch(e) { await client.query('ROLLBACK'); console.error(e); res.status(500).json({ success: false, message: 'Failed to place order' }); }",
  "  finally { client.release(); }",
  "};",
  "exports.getMyOrders = async function(req, res) {",
  "  try {",
  "    const r = await pool.query('SELECT o.*,json_agg(oi.*) as items,db.name as delivery_boy_name,db.phone as delivery_boy_phone FROM orders o LEFT JOIN order_items oi ON oi.order_id=o.id LEFT JOIN delivery_boys db ON db.id=o.delivery_boy_id WHERE o.user_id=$1 GROUP BY o.id,db.name,db.phone ORDER BY o.created_at DESC', [req.user.id]);",
  "    res.json({ success: true, orders: r.rows });",
  "  } catch(e) { res.status(500).json({ success: false, message: 'Failed to fetch orders' }); }",
  "};",
  "exports.getAllOrders = async function(req, res) {",
  "  try {",
  "    let q = 'SELECT o.*,json_agg(oi.*) as items,db.name as delivery_boy_name,db.phone as delivery_boy_phone FROM orders o LEFT JOIN order_items oi ON oi.order_id=o.id LEFT JOIN delivery_boys db ON db.id=o.delivery_boy_id WHERE 1=1';",
  "    const params = [];",
  "    if (req.query.status) { params.push(req.query.status); q += ' AND o.status=$'+params.length; }",
  "    if (req.query.date) { params.push(req.query.date); q += ' AND o.delivery_date=$'+params.length; }",
  "    q += ' GROUP BY o.id,db.name,db.phone ORDER BY o.created_at DESC';",
  "    const r = await pool.query(q, params);",
  "    res.json({ success: true, orders: r.rows });",
  "  } catch(e) { res.status(500).json({ success: false, message: 'Failed to fetch orders' }); }",
  "};",
  "exports.updateOrderStatus = async function(req, res) {",
  "  try { await pool.query('UPDATE orders SET status=$1,updated_at=NOW() WHERE id=$2', [req.body.status, req.params.id]); res.json({ success: true }); }",
  "  catch(e) { res.status(500).json({ success: false, message: 'Failed to update status' }); }",
  "};",
  "exports.assignDeliveryBoy = async function(req, res) {",
  "  try {",
  "    await pool.query(\"UPDATE orders SET delivery_boy_id=$1,status='confirmed',updated_at=NOW() WHERE id=$2\", [req.body.delivery_boy_id, req.params.id]);",
  "    await pool.query('INSERT INTO delivery_assignments (order_id,delivery_boy_id) VALUES ($1,$2)', [req.params.id, req.body.delivery_boy_id]);",
  "    res.json({ success: true });",
  "  } catch(e) { res.status(500).json({ success: false, message: 'Failed to assign' }); }",
  "};"
].join('\n'))

write('src/controllers/addressesController.js', [
  "const pool = require('../config/db');",
  "exports.getAddresses = async function(req, res) {",
  "  try { const r = await pool.query('SELECT * FROM addresses WHERE user_id=$1 ORDER BY is_default DESC,created_at DESC', [req.user.id]); res.json({ success: true, addresses: r.rows }); }",
  "  catch(e) { res.status(500).json({ success: false, message: 'Failed' }); }",
  "};",
  "exports.addAddress = async function(req, res) {",
  "  const { name, address, city, pincode, phone } = req.body;",
  "  try {",
  "    const cnt = await pool.query('SELECT COUNT(*) FROM addresses WHERE user_id=$1', [req.user.id]);",
  "    const isDefault = parseInt(cnt.rows[0].count) === 0;",
  "    const r = await pool.query('INSERT INTO addresses (user_id,name,address,city,pincode,phone,is_default) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *', [req.user.id, name, address, city, pincode, phone, isDefault]);",
  "    res.json({ success: true, address: r.rows[0] });",
  "  } catch(e) { res.status(500).json({ success: false, message: 'Failed' }); }",
  "};",
  "exports.updateAddress = async function(req, res) {",
  "  const { name, address, city, pincode, phone } = req.body;",
  "  try { const r = await pool.query('UPDATE addresses SET name=$1,address=$2,city=$3,pincode=$4,phone=$5 WHERE id=$6 AND user_id=$7 RETURNING *', [name, address, city, pincode, phone, req.params.id, req.user.id]); res.json({ success: true, address: r.rows[0] }); }",
  "  catch(e) { res.status(500).json({ success: false, message: 'Failed' }); }",
  "};",
  "exports.deleteAddress = async function(req, res) {",
  "  try { await pool.query('DELETE FROM addresses WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]); res.json({ success: true }); }",
  "  catch(e) { res.status(500).json({ success: false, message: 'Failed' }); }",
  "};",
  "exports.setDefault = async function(req, res) {",
  "  try {",
  "    await pool.query('UPDATE addresses SET is_default=false WHERE user_id=$1', [req.user.id]);",
  "    await pool.query('UPDATE addresses SET is_default=true WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);",
  "    res.json({ success: true });",
  "  } catch(e) { res.status(500).json({ success: false, message: 'Failed' }); }",
  "};"
].join('\n'))

write('src/controllers/deliveryBoysController.js', [
  "const pool = require('../config/db');",
  "exports.getDeliveryBoys = async function(req, res) {",
  "  try {",
  "    const r = await pool.query(\"SELECT db.*,COUNT(CASE WHEN o.delivery_date=CURRENT_DATE AND o.status!='delivered' THEN 1 END) as today_deliveries,COUNT(CASE WHEN o.status='delivered' THEN 1 END) as total_deliveries FROM delivery_boys db LEFT JOIN orders o ON o.delivery_boy_id=db.id GROUP BY db.id ORDER BY db.name\");",
  "    res.json({ success: true, deliveryBoys: r.rows });",
  "  } catch(e) { res.status(500).json({ success: false, message: 'Failed' }); }",
  "};",
  "exports.addDeliveryBoy = async function(req, res) {",
  "  try { const r = await pool.query('INSERT INTO delivery_boys (name,phone) VALUES ($1,$2) RETURNING *', [req.body.name, req.body.phone]); res.json({ success: true, deliveryBoy: r.rows[0] }); }",
  "  catch(e) { res.status(500).json({ success: false, message: 'Failed' }); }",
  "};",
  "exports.toggleActive = async function(req, res) {",
  "  try { const r = await pool.query('UPDATE delivery_boys SET active=NOT active WHERE id=$1 RETURNING *', [req.params.id]); res.json({ success: true, deliveryBoy: r.rows[0] }); }",
  "  catch(e) { res.status(500).json({ success: false, message: 'Failed' }); }",
  "};",
  "exports.getMyOrders = async function(req, res) {",
  "  try { const r = await pool.query('SELECT o.*,json_agg(oi.*) as items FROM orders o LEFT JOIN order_items oi ON oi.order_id=o.id WHERE o.delivery_boy_id=$1 AND o.delivery_date=CURRENT_DATE GROUP BY o.id ORDER BY o.delivery_slot', [req.params.id]); res.json({ success: true, orders: r.rows }); }",
  "  catch(e) { res.status(500).json({ success: false, message: 'Failed' }); }",
  "};"
].join('\n'))

write('src/routes/auth.js', [
  "const express = require('express');",
  "const router = express.Router();",
  "const c = require('../controllers/authController');",
  "const { authenticateUser } = require('../middleware/auth');",
  "router.post('/send-otp', c.sendOtp);",
  "router.post('/verify-otp', c.verifyOtp);",
  "router.post('/staff-login', c.staffLogin);",
  "router.put('/profile', authenticateUser, c.updateProfile);",
  "module.exports = router;"
].join('\n'))

write('src/routes/products.js', [
  "const express = require('express');",
  "const router = express.Router();",
  "const multer = require('multer');",
  "const upload = multer({ dest: 'uploads/' });",
  "const c = require('../controllers/productsController');",
  "const { authenticateStaff, requireRole } = require('../middleware/auth');",
  "router.get('/', c.getProducts);",
  "router.get('/categories', c.getCategories);",
  "router.get('/search', c.searchProducts);",
  "router.put('/rates/bulk', authenticateStaff, requireRole('super_admin','manager'), c.updatePricingTiers);",
  "router.post('/', authenticateStaff, requireRole('super_admin','manager'), c.createProduct);",
  "router.put('/:id', authenticateStaff, requireRole('super_admin','manager'), c.updateProduct);",
  "router.post('/:id/photos', authenticateStaff, requireRole('super_admin','manager'), upload.single('photo'), c.uploadPhoto);",
  "router.delete('/:id/photos', authenticateStaff, requireRole('super_admin','manager'), c.deletePhoto);",
  "module.exports = router;"
].join('\n'))

write('src/routes/orders.js', [
  "const express = require('express');",
  "const router = express.Router();",
  "const c = require('../controllers/ordersController');",
  "const { authenticateUser, authenticateStaff } = require('../middleware/auth');",
  "router.post('/', authenticateUser, c.placeOrder);",
  "router.get('/my', authenticateUser, c.getMyOrders);",
  "router.get('/all', authenticateStaff, c.getAllOrders);",
  "router.put('/:id/status', authenticateStaff, c.updateOrderStatus);",
  "router.put('/:id/assign', authenticateStaff, c.assignDeliveryBoy);",
  "module.exports = router;"
].join('\n'))

write('src/routes/addresses.js', [
  "const express = require('express');",
  "const router = express.Router();",
  "const c = require('../controllers/addressesController');",
  "const { authenticateUser } = require('../middleware/auth');",
  "router.get('/', authenticateUser, c.getAddresses);",
  "router.post('/', authenticateUser, c.addAddress);",
  "router.put('/:id', authenticateUser, c.updateAddress);",
  "router.delete('/:id', authenticateUser, c.deleteAddress);",
  "router.put('/:id/default', authenticateUser, c.setDefault);",
  "module.exports = router;"
].join('\n'))

write('src/routes/deliveryBoys.js', [
  "const express = require('express');",
  "const router = express.Router();",
  "const c = require('../controllers/deliveryBoysController');",
  "const { authenticateStaff, requireRole } = require('../middleware/auth');",
  "router.get('/', authenticateStaff, c.getDeliveryBoys);",
  "router.post('/', authenticateStaff, requireRole('super_admin','manager'), c.addDeliveryBoy);",
  "router.put('/:id/toggle', authenticateStaff, requireRole('super_admin','manager'), c.toggleActive);",
  "router.get('/:id/orders', authenticateStaff, c.getMyOrders);",
  "module.exports = router;"
].join('\n'))

write('src/server.js', [
  "const express = require('express');",
  "const cors = require('cors');",
  "const path = require('path');",
  "require('dotenv').config();",
  "const app = express();",
  "app.use(cors());",
  "app.use(express.json());",
  "app.use(express.urlencoded({ extended: true }));",
  "app.use('/uploads', express.static(path.join(__dirname, '../uploads')));",
  "app.use('/api/auth', require('./routes/auth'));",
  "app.use('/api/products', require('./routes/products'));",
  "app.use('/api/orders', require('./routes/orders'));",
  "app.use('/api/addresses', require('./routes/addresses'));",
  "app.use('/api/delivery-boys', require('./routes/deliveryBoys'));",
  "app.get('/api/health', (req, res) => res.json({ success: true, message: 'PackKart API running', version: '1.0.0' }));",
  "app.use('*', (req, res) => res.status(404).json({ success: false, message: 'Not found' }));",
  "const PORT = process.env.PORT || 3000;",
  "app.listen(PORT, () => { console.log('PackKart API running on http://localhost:'+PORT); console.log('Health: http://localhost:'+PORT+'/api/health'); });"
].join('\n'))

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
pkg.scripts = { start: 'node src/server.js', dev: 'nodemon src/server.js', setup: 'node src/config/setupDb.js' }
pkg.main = 'src/server.js'
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2))
console.log('updated package.json')

if (!fs.existsSync('uploads')) fs.mkdirSync('uploads')
console.log('created uploads folder')
console.log('\nAll done! Now run:')
console.log('  npm run setup')
console.log('  npm run dev')
