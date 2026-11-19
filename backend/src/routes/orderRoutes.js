const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrderById,
  getOrdersByCustomerId,
  getAllOrders,
  updateOrderStatus,
  getOrderStats
} = require('../controllers/orderController');

// GET /api/orders/stats (Thống kê đơn hàng cho dashboard - đặt trước /:id)
router.get('/stats', getOrderStats);

// GET /api/orders (Lấy danh sách tất cả đơn hàng cho Admin)
router.get('/', getAllOrders);

// POST /api/orders (Lưu / Tạo đơn hàng từ khách)
router.post('/', createOrder);

// GET /api/orders/:id (Lấy chi tiết đơn hàng)
router.get('/:id', getOrderById);

// PUT /api/orders/:id/status (Duyệt / Cập nhật trạng thái đơn hàng)
router.put('/:id/status', updateOrderStatus);
router.patch('/:id/status', updateOrderStatus);

// GET /api/orders/customer/:customerId (Lấy danh sách đơn của một khách hàng)
router.get('/customer/:customerId', getOrdersByCustomerId);

module.exports = router;
