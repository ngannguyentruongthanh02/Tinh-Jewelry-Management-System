# TÀI LIỆU ĐẶC TẢ CHI TIẾT CÁC API - HỆ THỐNG TRANG SỨC TĨNH (TINH JEWELRY)

Hệ thống API được thiết kế dựa trên CSDL SQL Server `TinhJewelryDB` và các Stored Procedure có sẵn trong dự án:
- `sp_GetAllProducts`, `sp_SearchProduct`
- `sp_RegisterCustomer`
- `sp_CreateOrder`, `sp_AddToCart`

---

## 1. TỔNG QUAN DANH SÁCH API YÊU CẦU

| Nhóm API | Method | Endpoint | Chức năng | Stored Procedure / Bảng liên quan |
| :--- | :--- | :--- | :--- | :--- |
| **1. Lấy sản phẩm** | `GET` | `/api/products` | Lấy danh sách sản phẩm (hỗ trợ lọc danh mục Vòng tay, Dây chuyền, DIY) | `sp_GetAllProducts`, bảng `Product`, `Category`, `Product_Image` |
| | `GET` | `/api/products/:id` | Lấy chi tiết 1 sản phẩm kèm ảnh | Bảng `Product`, `Product_Image` |
| | `GET` | `/api/products/search?keyword=...` | Tìm kiếm sản phẩm theo tên, mã hoặc danh mục | `sp_SearchProduct` |
| **2. Nhập / Đăng ký** | `POST` | `/api/auth/register` | **Đăng ký tài khoản khách hàng** mới | `sp_RegisterCustomer`, bảng `Customer` |
| | `POST` | `/api/auth/login` | Đăng nhập tài khoản khách hàng (sinh JWT token) | Bảng `Customer` |
| | `POST` | `/api/products` | **Nhập / Đăng ký sản phẩm mới** vào hệ thống & kho | Bảng `Product`, `Product_Image`, `InventoryLog` |
| **3. Lưu đơn hàng** | `POST` | `/api/orders` | **Lưu đơn hàng mới** (kiểm tra tồn kho, trừ kho, ghi log) | `sp_CreateOrder`, bảng `Order`, `OrderItem`, `InventoryLog`, `Payment` |
| | `GET` | `/api/orders/:id` | Xem chi tiết thông tin đơn hàng và danh sách món | Bảng `[Order]`, `OrderItem`, `Product` |
| | `GET` | `/api/orders/customer/:customerId`| Xem lịch sử các đơn hàng của 1 khách hàng | Bảng `[Order]` |

---

## 2. CHI TIẾT TỪNG API

### 🔹 PHẦN 1: CÁC API LẤY SẢN PHẨM

#### 1.1. Lấy toàn bộ danh sách sản phẩm
- **URL**: `GET /api/products`
- **Query Parameters (Tùy chọn)**:
  - `categoryId`: Lọc theo ID danh mục (1: Vòng tay, 2: Dây chuyền, 3: Bộ sản phẩm DIY)
  - `keyword`: Lọc theo từ khóa
  - `minPrice`: Giá tối thiểu
  - `maxPrice`: Giá tối đa
- **Response thành công (HTTP 200 OK)**:
```json
{
  "success": true,
  "total": 8,
  "data": [
    {
      "ProductID": 1,
      "ProductCode": "A01",
      "ProductName": "Vòng tay bạc mảnh TĨNH",
      "Description": "Thiết kế dạng dây mảnh, ít chi tiết trang trí, tạo vẻ thanh lịch...",
      "Price": 250000,
      "Material": "Bạc 925",
      "Size": "Free size",
      "CareInstructions": "Bảo quản nơi khô ráo, hạn chế tiếp xúc hóa chất...",
      "Style": "Tối giản",
      "StockQuantity": 20,
      "StockStatus": "Còn hàng",
      "CategoryName": "Vòng tay",
      "ImageURL": "images/bracelet-1.svg"
    },
    {
      "ProductID": 4,
      "ProductCode": "N01",
      "ProductName": "Dây chuyền bạc mảnh TĨNH",
      "Description": "Dây chuyền không có mặt trang trí, tập trung vào sự đơn giản...",
      "Price": 250000,
      "Material": "Bạc 925",
      "Size": "45cm",
      "CareInstructions": "Bảo quản nơi khô ráo...",
      "Style": "Tối giản",
      "StockQuantity": 20,
      "StockStatus": "Còn hàng",
      "CategoryName": "Dây chuyền",
      "ImageURL": "images/necklace-1.svg"
    }
  ]
}
```

#### 1.2. Lấy chi tiết một sản phẩm
- **URL**: `GET /api/products/:id` (Ví dụ: `/api/products/1`)
- **Response thành công (HTTP 200 OK)**:
```json
{
  "success": true,
  "data": {
    "ProductID": 1,
    "ProductCode": "A01",
    "ProductName": "Vòng tay bạc mảnh TĨNH",
    "Description": "Thiết kế dạng dây mảnh, ít chi tiết trang trí...",
    "Price": 250000,
    "Material": "Bạc 925",
    "Size": "Free size",
    "StockQuantity": 20,
    "StockStatus": "Còn hàng",
    "CategoryID": 1,
    "CategoryName": "Vòng tay",
    "images": [
      { "ImageID": 1, "ImageURL": "images/bracelet-1.svg", "IsPrimary": true }
    ]
  }
}
```

#### 1.3. Tìm kiếm sản phẩm
- **URL**: `GET /api/products/search?keyword=vòng`
- **Gọi Stored Procedure**: `sp_SearchProduct @Keyword`

---

### 🔹 PHẦN 2: CÁC API NHẬP / ĐĂNG KÝ

*(Lưu ý: "Nhập / đăng kí" có 2 ngữ cảnh thông dụng trong đề bài, hệ thống hỗ trợ cả 2)*

#### 2.1. Đăng ký tài khoản khách hàng (Customer Register)
- **URL**: `POST /api/auth/register`
- **Content-Type**: `application/json`
- **Stored Procedure sử dụng**: `sp_RegisterCustomer`
- **Request Body**:
```json
{
  "fullName": "Nguyễn Minh Anh",
  "phone": "0901234567",
  "email": "minhanh@gmail.com",
  "address": "123 Lê Lợi, Quận 1, TP. Hồ Chí Minh",
  "password": "Password123"
}
```
- **Response thành công (HTTP 201 Created)**:
```json
{
  "success": true,
  "message": "Đăng ký tài khoản khách hàng thành công!",
  "data": {
    "customerId": 6,
    "fullName": "Nguyễn Minh Anh",
    "email": "minhanh@gmail.com",
    "phone": "0901234567",
    "address": "123 Lê Lợi, Quận 1, TP. Hồ Chí Minh"
  }
}
```
- **Response lỗi nếu Email đã tồn tại (HTTP 409 Conflict)**:
```json
{
  "success": false,
  "message": "Email này đã được sử dụng, vui lòng chọn email khác"
}
```

#### 2.2. Nhập / Đăng ký sản phẩm mới vào kho (Product Register / Import)
Dùng cho quản trị viên/kho nhập các mẫu mã mới theo Bảng 3.2, 3.3, 3.4:
- **URL**: `POST /api/products`
- **Content-Type**: `application/json`
- **Request Body**:
```json
{
  "productCode": "DIY01",
  "productName": "Bộ tự phối vòng tay TĨNH",
  "description": "Cho phép khách hàng tự phối hợp thành phần dây, hạt, khóa nối và hoàn thiện vòng tay.",
  "price": 390000,
  "material": "Bạc 925 và phụ kiện",
  "size": "Tự điều chỉnh",
  "careInstructions": "Bảo quản nơi khô ráo trong túi zip.",
  "style": "DIY sáng tạo",
  "stockQuantity": 30,
  "categoryID": 3,
  "imageUrl": "images/diy-bracelet.svg",
  "adminId": 1
}
```
- **Cơ chế xử lý**:
  1. Kiểm tra `productCode` chưa tồn tại.
  2. `INSERT` vào bảng `Product`.
  3. `INSERT` vào bảng `Product_Image`.
  4. `INSERT` vào bảng `InventoryLog` để ghi nhận nhật ký nhập hàng.
- **Response thành công (HTTP 201 Created)**:
```json
{
  "success": true,
  "message": "Nhập / Đăng ký sản phẩm mới thành công!",
  "data": {
    "productId": 9,
    "productCode": "DIY01",
    "productName": "Bộ tự phối vòng tay TĨNH",
    "price": 390000,
    "stockQuantity": 30,
    "stockStatus": "Còn hàng",
    "categoryID": 3
  }
}
```

---

### 🔹 PHẦN 3: CÁC API LƯU ĐƠN HÀNG (ORDER APIS)

#### 3.1. Lưu đơn hàng mới (Create Order)
- **URL**: `POST /api/orders`
- **Content-Type**: `application/json`
- **Cơ chế xử lý chuẩn ACID (SQL Transaction)**:
  1. Kiểm tra tồn kho của từng món hàng (`StockQuantity >= Quantity`). Nếu thiếu báo lỗi ngay.
  2. Tính tổng tiền: `SubTotal` = SUM(Quantity × UnitPrice), `TotalAmount` = SubTotal + ShippingFee.
  3. Sinh mã đơn: `ORD` + timestamp (ví dụ: `ORD89234125`).
  4. Thêm đơn hàng vào bảng `[Order]`.
  5. Thêm chi tiết vào bảng `OrderItem`.
  6. Trừ số lượng tồn kho `Product.StockQuantity` và cập nhật `StockStatus`.
  7. Ghi nhận giao dịch xuất kho vào `InventoryLog` (`Reason = 'Xuất kho do tạo đơn hàng...'`).
  8. Tạo bản ghi ban đầu vào bảng `Payment` với trạng thái `Pending`.
- **Request Body (Gửi từ giỏ hàng checkout)**:
```json
{
  "customerId": 1,
  "receiverName": "Nguyễn Minh Anh",
  "receiverPhone": "0901234567",
  "shippingAddress": "123 Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
  "shippingFee": 30000,
  "paymentMethod": "COD",
  "adminId": 1,
  "items": [
    {
      "productId": 1,
      "quantity": 1,
      "unitPrice": 250000
    },
    {
      "productId": 4,
      "quantity": 2,
      "unitPrice": 250000
    }
  ]
}
```
- **Response thành công (HTTP 201 Created)**:
```json
{
  "success": true,
  "message": "Lưu đơn hàng thành công!",
  "data": {
    "orderId": 105,
    "orderCode": "ORD89234125",
    "customerId": 1,
    "receiverName": "Nguyễn Minh Anh",
    "receiverPhone": "0901234567",
    "shippingAddress": "123 Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
    "subTotal": 750000,
    "shippingFee": 30000,
    "totalAmount": 780000,
    "orderStatus": "Pending",
    "paymentMethod": "COD",
    "items": [
      {
        "productId": 1,
        "productName": "Vòng tay bạc mảnh TĨNH",
        "quantity": 1,
        "unitPrice": 250000,
        "lineTotal": 250000
      },
      {
        "productId": 4,
        "productName": "Dây chuyền bạc mảnh TĨNH",
        "quantity": 2,
        "unitPrice": 250000,
        "lineTotal": 500000
      }
    ]
  }
}
```

#### 3.2. Lấy thông tin chi tiết đơn hàng
- **URL**: `GET /api/orders/:id` (Ví dụ: `/api/orders/105`)
- **Response**: Trả về đầy đủ thông tin đơn hàng, thông tin khách hàng, phương thức thanh toán và danh sách sản phẩm đã đặt.

---

## 3. HƯỚNG DẪN CÀI ĐẶT & CHẠY BACKEND

### Bước 1: Mở thư mục backend và cài đặt thư viện
```bash
cd c:\DoAn\Tinh-Jewelry-Management-System\backend
npm install
```

### Bước 2: Cấu hình file `.env`
Mở file `.env` và cập nhật thông tin SQL Server trên máy bạn:
```env
PORT=5000
DB_USER=sa
DB_PASSWORD=Mật_Khẩu_SQL_Server_Của_Bạn
DB_SERVER=localhost
DB_DATABASE=TinhJewelryDB
DB_PORT=1433
DB_ENCRYPT=false
JWT_SECRET=tinh_jewelry_secret_key_2026
```

### Bước 3: Khởi động Server
```bash
npm start
# Hoặc chế độ lập trình tự reload:
npm run dev
```
Server sẽ chạy tại: `http://localhost:5000`

---

## 4. HƯỚNG DẪN TÍCH HỢP VÀO FRONTEND (`fe/frontend/js/main.js`)

Để gọi API từ frontend, thay thế các hàm demo `localStorage` trong `fe/frontend/js/main.js` bằng `fetch()`:

### 1. Lấy sản phẩm từ API:
```javascript
async function fetchProductsFromAPI() {
  try {
    const res = await fetch('http://localhost:5000/api/products');
    const result = await res.json();
    if (result.success) {
      return result.data;
    }
  } catch (err) {
    console.error('Không thể tải sản phẩm từ backend:', err);
  }
}
```

### 2. Đăng ký tài khoản:
```javascript
async function registerCustomerAPI(customerData) {
  const res = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(customerData)
  });
  return await res.json();
}
```

### 3. Lưu đơn hàng khi thanh toán (Checkout):
```javascript
async function submitOrderAPI(orderPayload) {
  const res = await fetch('http://localhost:5000/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderPayload)
  });
  return await res.json();
}
```
