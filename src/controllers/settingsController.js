
const pool = require('../config/db');
const bcrypt = require('bcryptjs');

// Get all settings (public - for website)
exports.getPublicSettings = async (req, res) => {
  try {
    const result = await pool.query('SELECT key, value FROM site_settings ORDER BY group_name, sort_order');
    const settings = {};
    result.rows.forEach(r => { settings[r.key] = r.value; });
    res.json({ success: true, settings });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// Get all settings with metadata (admin)
exports.getSettings = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM site_settings ORDER BY group_name, sort_order');
    const grouped = {};
    const flat = {};
    result.rows.forEach(r => {
      if (!grouped[r.group_name]) grouped[r.group_name] = [];
      grouped[r.group_name].push(r);
      flat[r.key] = r.value;
    });
    res.json({ success: true, settings: result.rows, grouped, flat });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// Update multiple settings
exports.updateSettings = async (req, res) => {
  const { settings } = req.body;
  try {
    for (const [key, value] of Object.entries(settings)) {
      await pool.query('UPDATE site_settings SET value=\$1 WHERE key=\$2', [value, key]);
    }
    res.json({ success: true, message: 'Settings saved' });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// Get staff
exports.getStaff = async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, phone, role, created_at FROM staff ORDER BY id');
    res.json({ success: true, staff: result.rows });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// Add staff
exports.addStaff = async (req, res) => {
  const { name, phone, pin, role } = req.body;
  try {
    const hashedPin = await bcrypt.hash(String(pin), 10);
    const result = await pool.query(
      'INSERT INTO staff (name, phone, pin, role) VALUES (\$1,\$2,\$3,\$4) RETURNING id, name, phone, role',
      [name, phone, hashedPin, role || 'manager']
    );
    res.json({ success: true, staff: result.rows[0] });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// Delete staff
exports.deleteStaff = async (req, res) => {
  const { id } = req.params;
  try {
    const check = await pool.query('SELECT role FROM staff WHERE id=\$1', [id]);
    if (check.rows[0]?.role === 'super_admin') return res.status(403).json({ success: false, message: 'Cannot delete super admin' });
    await pool.query('DELETE FROM staff WHERE id=\$1', [id]);
    res.json({ success: true });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// Update staff
exports.updateStaff = async (req, res) => {
  const { id } = req.params;
  const { pin, phone, name } = req.body;
  try {
    if (pin) {
      const hashedPin = await bcrypt.hash(String(pin), 10);
      await pool.query('UPDATE staff SET pin=\$1 WHERE id=\$2', [hashedPin, id]);
    }
    if (phone) await pool.query('UPDATE staff SET phone=\$1 WHERE id=\$2', [phone, id]);
    if (name) await pool.query('UPDATE staff SET name=\$1 WHERE id=\$2', [name, id]);
    res.json({ success: true });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// Admin OTP send
exports.sendAdminOtp = async (req, res) => {
  const { phone } = req.body;
  try {
    const staff = await pool.query('SELECT id FROM staff WHERE phone=\$1', [phone]);
    if (!staff.rows.length) return res.status(404).json({ success: false, message: 'Phone not registered as staff' });
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    
    await pool.query('DELETE FROM admin_otps WHERE phone=\$1', [phone]);
    await pool.query('INSERT INTO admin_otps (phone, otp, expires_at) VALUES (\$1,\$2,\$3)', [phone, otp, expires]);
    
    // TODO: Send via MSG91 when configured
    console.log('Admin OTP for', phone, ':', otp);
    
    res.json({ success: true, message: 'OTP sent', dev_otp: process.env.NODE_ENV === 'production' ? undefined : otp });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// Admin OTP verify
exports.verifyAdminOtp = async (req, res) => {
  const { phone, otp } = req.body;
  const jwt = require('jsonwebtoken');
  try {
    const result = await pool.query(
      'SELECT * FROM admin_otps WHERE phone=\$1 AND otp=\$2 AND used=false AND expires_at > NOW()',
      [phone, otp]
    );
    if (!result.rows.length) return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    
    await pool.query('UPDATE admin_otps SET used=true WHERE id=\$1', [result.rows[0].id]);
    
    const staff = await pool.query('SELECT id, name, phone, role FROM staff WHERE phone=\$1', [phone]);
    const token = jwt.sign({ staffId: staff.rows[0].id, role: staff.rows[0].role }, process.env.JWT_SECRET || 'packkart-secret', { expiresIn: '24h' });
    
    res.json({ success: true, token, staff: staff.rows[0] });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
