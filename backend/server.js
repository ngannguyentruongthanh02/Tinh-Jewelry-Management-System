const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectDB } = require('./src/config/db');
const productRoutes = require('./src/routes/productRoutes');
const authRoutes = require('./src/routes/authRoutes');
const orderRoutes = require('./src/routes/orderRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Kiểm tra kết nối CSDL khi khởi động server
connectDB()
  .then(() => console.log('Database connected successfully'))
  .catch(err => console.warn('Lưu ý: Chưa thể kết nối ngay tới SQL Server, hãy đảm bảo SQL Server đang chạy và thông tin trong .env là chính xác.'));

// Routes
app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Chào mừng bạn đến với API Hệ thống Quản lý Trang sức TĨNH (Tinh Jewelry Management System)',
    endpoints: {
      products: {
        getAll: 'GET /api/products',
        getDetail: 'GET /api/products/:id',
        search: 'GET /api/products/search?keyword=...',
        registerProduct: 'POST /api/products (Thêm sản phẩm mới)',
        updateProduct: 'PUT /api/products/:id (Sửa thông tin sản phẩm)',
        deleteProduct: 'DELETE /api/products/:id (Xóa sản phẩm)',
        updateStock: 'PATCH /api/products/:id/stock (Cập nhật nhanh tồn kho)'
      },
      auth: {
        register: 'POST /api/auth/register (Đăng ký tài khoản khách hàng)',
        login: 'POST /api/auth/login (Đăng nhập tài khoản khách hàng)'
      },
      orders: {
        getAll: 'GET /api/orders (Lấy tất cả đơn hàng cho Admin)',
        getStats: 'GET /api/orders/stats (Thống kê đơn hàng và doanh thu)',
        create: 'POST /api/orders (Lưu đơn hàng mới từ khách hàng)',
        getDetail: 'GET /api/orders/:id (Xem chi tiết đơn hàng)',
        updateStatus: 'PUT /api/orders/:id/status (Duyệt / Cập nhật trạng thái đơn hàng)',
        getByCustomer: 'GET /api/orders/customer/:customerId (Xem lịch sử đơn của khách)'
      }
    }
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Không tìm thấy tài nguyên: ${req.method} ${req.originalUrl}`
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Đã xảy ra lỗi trên máy chủ',
    error: err.message
  });
});

// Khởi chạy server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Tinh Jewelry Backend Server đang chạy tại port ${PORT}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log(`=======================================================`);
});
