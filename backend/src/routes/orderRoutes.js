const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrderById,
  getOrdersByCustomerId
} = require('../controllers/orderController');

// POST /api/orders (Lưu / Tạo đơn hàng)
router.post('/', createOrder);

// GET /api/orders/:id (Lấy chi tiết đơn hàng)
router.get('/:id', getOrderById);

// GET /api/orders/customer/:customerId (Lấy danh sách đơn của một khách hàng)
router.get('/customer/:customerId', getOrdersByCustomerId);

module.exports = router;
