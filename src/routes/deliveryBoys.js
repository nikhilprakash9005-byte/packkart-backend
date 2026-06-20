const express = require('express');
const router = express.Router();
const c = require('../controllers/deliveryBoysController');
const { authenticateStaff, requireRole } = require('../middleware/auth');
router.get('/', authenticateStaff, c.getDeliveryBoys);
router.post('/', authenticateStaff, requireRole('super_admin','manager'), c.addDeliveryBoy);
router.put('/:id/toggle', authenticateStaff, requireRole('super_admin','manager'), c.toggleActive);
router.get('/:id/orders', authenticateStaff, c.getMyOrders);
module.exports = router;