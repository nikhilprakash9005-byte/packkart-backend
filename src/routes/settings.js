
const express = require('express');
const router = express.Router();
const { authenticateStaff, requireRole } = require('../middleware/auth');
const s = require('../controllers/settingsController');

// Public settings (website reads this)
router.get('/public', s.getPublicSettings);

// Admin settings
router.get('/', authenticateStaff, s.getSettings);
router.put('/', authenticateStaff, requireRole('super_admin'), s.updateSettings);

// Staff management
router.get('/staff', authenticateStaff, requireRole('super_admin'), s.getStaff);
router.post('/staff', authenticateStaff, requireRole('super_admin'), s.addStaff);
router.delete('/staff/:id', authenticateStaff, requireRole('super_admin'), s.deleteStaff);
router.put('/staff/:id', authenticateStaff, requireRole('super_admin'), s.updateStaff);

// Admin OTP login
router.post('/admin-otp/send', s.sendAdminOtp);
router.post('/admin-otp/verify', s.verifyAdminOtp);

module.exports = router;
