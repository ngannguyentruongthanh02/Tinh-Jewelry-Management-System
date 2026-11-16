const express = require('express');
const router = express.Router();
const {
  registerCustomer,
  loginCustomer
} = require('../controllers/authController');

// POST /api/auth/register (Đăng ký tài khoản khách hàng)
router.post('/register', registerCustomer);

// POST /api/auth/login (Đăng nhập tài khoản khách hàng)
router.post('/login', loginCustomer);

module.exports = router;
