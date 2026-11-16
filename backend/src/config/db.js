const sql = require('mssql');
require('dotenv').config();

const dbConfig = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '',
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE || 'TinhJewelryDB',
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: true,
    instanceName: process.env.DB_INSTANCE || undefined,
    connectTimeout: 5000 // Timeout 5s nếu chưa bật TCP/IP
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let poolPromise = null;
let isConnected = false;

const connectDB = async () => {
  if (isConnected && poolPromise) return poolPromise;

  try {
    poolPromise = await new sql.ConnectionPool(dbConfig).connect();
    isConnected = true;
    console.log('✅ Đã kết nối thành công đến SQL Server Database:', dbConfig.database);
    return poolPromise;
  } catch (err) {
    isConnected = false;
    poolPromise = null;
    // Không crash server, ném lỗi để controller biết và tự động chuyển sang dữ liệu an toàn
    throw err;
  }
};

const getIsConnected = () => isConnected;

module.exports = {
  sql,
  connectDB,
  getIsConnected
};
