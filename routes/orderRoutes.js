const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/authMiddleware');
const { placeOrder, getMyOrders, getSellerOrders } = require('../controllers/orderController');

router.post('/', protect, requireRole('customer'), placeOrder);
router.get('/mine', protect, requireRole('customer'), getMyOrders);
router.get('/seller', protect, requireRole('seller'), getSellerOrders);

module.exports = router;
