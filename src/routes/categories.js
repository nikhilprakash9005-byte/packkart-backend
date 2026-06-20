
const express = require('express');
const router = express.Router();
const { authenticateStaff, requireRole } = require('../middleware/auth');
const { createCategory, deleteCategory } = require('../controllers/categoriesController');

router.post('/', authenticateStaff, requireRole('super_admin'), createCategory);
router.delete('/:id', authenticateStaff, requireRole('super_admin'), deleteCategory);

module.exports = router;
