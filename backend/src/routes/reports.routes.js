const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/orders', reportController.getOrdersReport);
router.get('/orders/pdf', reportController.exportOrdersPDF);
router.get('/inventory', reportController.getInventoryReport);
router.get('/dashboard', reportController.getDashboardStats);

module.exports = router;
