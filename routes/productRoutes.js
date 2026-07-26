const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/authMiddleware');
const {
  getProducts,
  getProduct,
  getMyProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');

// NOTE: /seller/mine must be declared before /:id so Express doesn't
// treat "seller" as a product id.
router.get('/', getProducts);
router.get('/seller/mine', protect, requireRole('seller'), getMyProducts);
router.get('/:id', getProduct);
router.post('/', protect, requireRole('seller'), createProduct);
router.put('/:id', protect, requireRole('seller'), updateProduct);
router.delete('/:id', protect, requireRole('seller'), deleteProduct);

module.exports = router;
