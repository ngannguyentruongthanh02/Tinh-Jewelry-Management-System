const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getProductById,
  searchProducts,
  registerProduct
} = require('../controllers/productController');

// GET /api/products/search?keyword=... (phải đặt trước /:id để tránh trùng route)
router.get('/search', searchProducts);

// GET /api/products
router.get('/', getAllProducts);

// GET /api/products/:id
router.get('/:id', getProductById);

// POST /api/products (Nhập / Đăng ký sản phẩm mới)
router.post('/', registerProduct);

module.exports = router;
