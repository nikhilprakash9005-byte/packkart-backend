const fs = require('fs');
const path = require('path');

// ── Settings Controller ──────────────────────────────────────────────────────
fs.writeFileSync(path.join(__dirname, 'src/controllers/settingsController.js'), `
const pool = require('../config/db');

// Get all settings
exports.getSettings = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM site_settings ORDER BY group_name, sort_order');
    const grouped = {};
    for (const row of result.rows) {
      if (!grouped[row.group_name]) grouped[row.group_name] = [];
      grouped[row.group_name].push(row);
    }
    res.json({ success: true, settings: result.rows, grouped });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// Update single setting
exports.updateSetting = async (req, res) => {
  const { key } = req.params;
  const { value } = req.body;
  try {
    await pool.query('UPDATE site_settings SET value=$1 WHERE key=$2', [value, key]);
    res.json({ success: true });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// Update multiple settings at once
exports.updateSettings = async (req, res) => {
  const { settings } = req.body; // { key: value, ... }
  try {
    for (const [key, value] of Object.entries(settings)) {
      await pool.query('UPDATE site_settings SET value=$1 WHERE key=$2', [value, key]);
    }
    res.json({ success: true, message: 'Settings saved' });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// Get pages
exports.getPages = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM site_pages ORDER BY id');
    res.json({ success: true, pages: result.rows });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// Update page
exports.updatePage = async (req, res) => {
  const { id } = req.params;
  const { title, content, meta_title, meta_description, is_published } = req.body;
  try {
    await pool.query(
      'UPDATE site_pages SET title=$1, content=$2, meta_title=$3, meta_description=$4, is_published=$5, updated_at=NOW() WHERE id=$6',
      [title, content, meta_title, meta_description, is_published, id]
    );
    res.json({ success: true });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// Get navigation
exports.getNavigation = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM site_navigation ORDER BY position, sort_order');
    res.json({ success: true, navigation: result.rows });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// Update navigation item
exports.updateNavItem = async (req, res) => {
  const { id } = req.params;
  const { label, url, is_active } = req.body;
  try {
    await pool.query('UPDATE site_navigation SET label=$1, url=$2, is_active=$3 WHERE id=$4', [label, url, is_active, id]);
    res.json({ success: true });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// Add navigation item
exports.addNavItem = async (req, res) => {
  const { label, url, position, sort_order } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO site_navigation (label, url, position, sort_order) VALUES ($1,$2,$3,$4) RETURNING *',
      [label, url, position || 'header', sort_order || 99]
    );
    res.json({ success: true, item: result.rows[0] });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// Delete navigation item
exports.deleteNavItem = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM site_navigation WHERE id=$1', [id]);
    res.json({ success: true });
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
  const bcrypt = require('bcryptjs');
  try {
    const hashedPin = await bcrypt.hash(String(pin), 10);
    const result = await pool.query(
      'INSERT INTO staff (name, phone, pin, role) VALUES ($1,$2,$3,$4) RETURNING id, name, phone, role',
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
    await pool.query('DELETE FROM staff WHERE id=$1', [id]);
    res.json({ success: true });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
};

// Update staff PIN
exports.updateStaffPin = async (req, res) => {
  const { id } = req.params;
  const { pin, phone } = req.body;
  const bcrypt = require('bcryptjs');
  try {
    if (pin) {
      const hashedPin = await bcrypt.hash(String(pin), 10);
      await pool.query('UPDATE staff SET pin=$1 WHERE id=$2', [hashedPin, id]);
    }
    if (phone) {
      await pool.query('UPDATE staff SET phone=$1 WHERE id=$2', [phone, id]);
    }
    res.json({ success: true });
  } catch(e) {
    res.status(500).json({ success: false, message: e.message });
  }
};
`);

// ── Settings Routes ──────────────────────────────────────────────────────────
fs.writeFileSync(path.join(__dirname, 'src/routes/settings.js'), `
const express = require('express');
const router = express.Router();
const { authenticateStaff, requireRole } = require('../middleware/auth');
const s = require('../controllers/settingsController');

// Settings - super_admin + manager can read, only super_admin can write
router.get('/', authenticateStaff, s.getSettings);
router.put('/:key', authenticateStaff, requireRole('super_admin'), s.updateSetting);
router.put('/', authenticateStaff, requireRole('super_admin'), s.updateSettings);

// Pages
router.get('/pages', authenticateStaff, s.getPages);
router.put('/pages/:id', authenticateStaff, requireRole('super_admin'), s.updatePage);

// Navigation
router.get('/navigation', authenticateStaff, s.getNavigation);
router.post('/navigation', authenticateStaff, requireRole('super_admin'), s.addNavItem);
router.put('/navigation/:id', authenticateStaff, requireRole('super_admin'), s.updateNavItem);
router.delete('/navigation/:id', authenticateStaff, requireRole('super_admin'), s.deleteNavItem);

// Staff management
router.get('/staff', authenticateStaff, requireRole('super_admin'), s.getStaff);
router.post('/staff', authenticateStaff, requireRole('super_admin'), s.addStaff);
router.delete('/staff/:id', authenticateStaff, requireRole('super_admin'), s.deleteStaff);
router.put('/staff/:id', authenticateStaff, requireRole('super_admin'), s.updateStaffPin);

module.exports = router;
`);

// ── Add to server.js ─────────────────────────────────────────────────────────
const serverPath = path.join(__dirname, 'src/server.js');
let server = fs.readFileSync(serverPath, 'utf8');
if (!server.includes('/api/settings')) {
  server = server.replace(
    "app.use('/api/categories', require('./routes/categories'));",
    "app.use('/api/categories', require('./routes/categories'));\napp.use('/api/settings', require('./routes/settings'));"
  );
  if (!server.includes('/api/settings')) {
    // fallback if categories line not found
    server = server.replace(
      "app.use('/api/products', require('./routes/products'));",
      "app.use('/api/products', require('./routes/products'));\napp.use('/api/settings', require('./routes/settings'));"
    );
  }
  fs.writeFileSync(serverPath, server);
  console.log('✅ /api/settings added to server.js');
} else {
  console.log('ℹ️  /api/settings already exists');
}

console.log('✅ Settings routes and controller created!');
console.log('Now run: node cms-db-patch.cjs && npm run dev');
