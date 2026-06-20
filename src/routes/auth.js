const express = require('express');
const router = express.Router();
const c = require('../controllers/authController');
const { authenticateUser } = require('../middleware/auth');
router.post('/send-otp', c.sendOtp);
router.post('/verify-otp', c.verifyOtp);
router.post('/staff-login', c.staffLogin);
router.put('/profile', authenticateUser, c.updateProfile);
module.exports = router;