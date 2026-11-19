const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getProductById,
  searchProducts,
  registerProduct,
  updateProduct,
  deleteProduct,
  updateProductStock
} = require('../controllers/productController');

// GET /api/products/search?keyword=... (phải đặt trước /:id để tránh trùng route)
router.get('/search', searchProducts);

// GET /api/products (Lấy danh sách sản phẩm)
router.get('/', getAllProducts);

// GET /api/products/:id (Lấy chi tiết sản phẩm)
router.get('/:id', getProductById);

// POST /api/products (Thêm / Đăng ký sản phẩm mới)
router.post('/', registerProduct);

// PUT /api/products/:id (Sửa / Cập nhật sản phẩm)
router.put('/:id', updateProduct);

// DELETE /api/products/:id (Xóa sản phẩm)
router.delete('/:id', deleteProduct);

// PATCH /api/products/:id/stock (Cập nhật tồn kho nhanh)
router.patch('/:id/stock', updateProductStock);

module.exports = router;
