const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const axios = require('axios');
require('dotenv').config();
const genToken = (p) => jwt.sign(p, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
exports.sendOtp = async function(req, res) {
  const phone = req.body.phone;
  if (!phone || phone.length !== 10) return res.status(400).json({ success: false, message: 'Invalid phone' });
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  try {
    await pool.query('DELETE FROM otp_verifications WHERE phone=$1', [phone]);
    await pool.query('INSERT INTO otp_verifications (phone,otp,expires_at) VALUES ($1,$2,$3)', [phone, otp, expiresAt]);
    if (process.env.MSG91_AUTH_KEY && process.env.MSG91_AUTH_KEY !== 'YOUR_MSG91_KEY_HERE') {
      await axios.post('https://control.msg91.com/api/v5/otp', { template_id: process.env.MSG91_TEMPLATE_ID, mobile: '91'+phone, authkey: process.env.MSG91_AUTH_KEY, otp });
    } else { console.log('DEV OTP for '+phone+': '+otp); }
    const r = { success: true, message: 'OTP sent' };
    if (process.env.NODE_ENV === 'development') r.dev_otp = otp;
    res.json(r);
  } catch(e) { console.error(e); res.status(500).json({ success: false, message: 'Failed to send OTP' }); }
};
exports.verifyOtp = async function(req, res) {
  const { phone, otp } = req.body;
  if (!phone || !otp) return res.status(400).json({ success: false, message: 'Phone and OTP required' });
  try {
    const r = await pool.query('SELECT * FROM otp_verifications WHERE phone=$1 AND otp=$2 AND verified=false AND expires_at>NOW()', [phone, otp]);
    if (!r.rows.length) return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    await pool.query('UPDATE otp_verifications SET verified=true WHERE id=$1', [r.rows[0].id]);
    let user = await pool.query('SELECT * FROM users WHERE phone=$1', [phone]);
    if (!user.rows.length) user = await pool.query('INSERT INTO users (phone) VALUES ($1) RETURNING *', [phone]);
    const token = genToken({ id: user.rows[0].id, phone, type: 'customer' });
    res.json({ success: true, token, user: user.rows[0], isNewUser: !user.rows[0].name });
  } catch(e) { console.error(e); res.status(500).json({ success: false, message: 'Verification failed' }); }
};
exports.staffLogin = async function(req, res) {
  const { phone, pin } = req.body;
  if (!phone || !pin) return res.status(400).json({ success: false, message: 'Phone and PIN required' });
  try {
    const r = await pool.query('SELECT * FROM staff WHERE phone=$1 AND active=true', [phone]);
    if (!r.rows.length) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const valid = await bcrypt.compare(pin, r.rows[0].pin);
    if (!valid) return res.status(401).json({ success: false, message: 'Invalid PIN' });
    const token = genToken({ id: r.rows[0].id, phone: r.rows[0].phone, role: r.rows[0].role, name: r.rows[0].name, type: 'staff' });
    res.json({ success: true, token, staff: { id: r.rows[0].id, name: r.rows[0].name, phone: r.rows[0].phone, role: r.rows[0].role } });
  } catch(e) { res.status(500).json({ success: false, message: 'Login failed' }); }
};
exports.updateProfile = async function(req, res) {
  const { name, email, gst_number, gst_business_name } = req.body;
  try {
    const r = await pool.query('UPDATE users SET name=$1,email=$2,gst_number=$3,gst_business_name=$4,updated_at=NOW() WHERE id=$5 RETURNING *', [name, email, gst_number, gst_business_name, req.user.id]);
    res.json({ success: true, user: r.rows[0] });
  } catch(e) { res.status(500).json({ success: false, message: 'Update failed' }); }
};