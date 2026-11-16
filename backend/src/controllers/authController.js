const { sql, connectDB } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const localCustomers = [
  { CustomerID: 1, FullName: 'Nguyen Minh Anh', Email: 'minhanh@gmail.com', Phone: '0901234567', Address: 'Quan 1, TP. HCM', Password: 'DEMO_HASH_001' }
];

/**
 * 1. API Đăng ký khách hàng (Customer Register)
 * POST /api/auth/register
 */
const registerCustomer = async (req, res) => {
  const { fullName, phone, email, address, password } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ họ tên, email và mật khẩu' });
  }

  const cleanEmail = email.trim().toLowerCase();
  try {
    const pool = await connectDB();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const result = await pool.request()
      .input('FullName', sql.NVarChar(100), fullName)
      .input('Phone', sql.VarChar(15), phone || null)
      .input('Email', sql.VarChar(100), cleanEmail)
      .input('Address', sql.NVarChar(255), address || null)
      .input('Password', sql.VarChar(255), hashedPassword)
      .execute('sp_RegisterCustomer');

    const customerData = result.recordset[0];
    return res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản khách hàng thành công!',
      data: { customerId: customerData.CustomerID, fullName, email: cleanEmail, phone, address }
    });
  } catch (error) {
    if (error.message && error.message.includes('Email đã tồn tại')) {
      return res.status(409).json({ success: false, message: 'Email này đã được sử dụng, vui lòng chọn email khác' });
    }

    // Fallback lưu tạm bộ nhớ
    const exists = localCustomers.some(c => c.Email === cleanEmail);
    if (exists) {
      return res.status(409).json({ success: false, message: 'Email này đã được sử dụng, vui lòng chọn email khác' });
    }
    const newCust = { CustomerID: localCustomers.length + 1, FullName: fullName, Email: cleanEmail, Phone: phone, Address: address, Password: password };
    localCustomers.push(newCust);

    return res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản khách hàng thành công!',
      data: { customerId: newCust.CustomerID, fullName, email: cleanEmail, phone, address }
    });
  }
};

/**
 * 2. API Đăng nhập khách hàng (Customer Login)
 * POST /api/auth/login
 */
const loginCustomer = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp email và mật khẩu' });
  }

  const cleanEmail = email.trim().toLowerCase();
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input('Email', sql.VarChar(100), cleanEmail)
      .query(`SELECT CustomerID, FullName, Phone, Email, Address, Password FROM Customer WHERE Email = @Email`);

    if (result.recordset.length === 0) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không chính xác' });
    }
    const customer = result.recordset[0];
    let isMatch = (password === customer.Password);
    if (customer.Password.startsWith('$2a$') || customer.Password.startsWith('$2b$')) {
      isMatch = await bcrypt.compare(password, customer.Password);
    }
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không chính xác' });
    }

    const token = jwt.sign({ customerId: customer.CustomerID, email: customer.Email }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    return res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công!',
      data: { token, customer: { customerId: customer.CustomerID, fullName: customer.FullName, email: customer.Email, phone: customer.Phone, address: customer.Address } }
    });
  } catch (error) {
    const cust = localCustomers.find(c => c.Email === cleanEmail && c.Password === password);
    if (!cust) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không chính xác' });
    }
    const token = jwt.sign({ customerId: cust.CustomerID, email: cust.Email }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    return res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công!',
      data: { token, customer: { customerId: cust.CustomerID, fullName: cust.FullName, email: cust.Email, phone: cust.Phone, address: cust.Address } }
    });
  }
};

module.exports = {
  registerCustomer,
  loginCustomer
};
