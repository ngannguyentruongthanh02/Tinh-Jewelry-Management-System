/* =========================================
   XOA CAC BANG TRONG DATABASE TINH
========================================= */

DROP TABLE IF EXISTS InventoryLog;
DROP TABLE IF EXISTS Refund;
DROP TABLE IF EXISTS ReturnItem;
DROP TABLE IF EXISTS ReturnRequest;
DROP TABLE IF EXISTS Shipment;
DROP TABLE IF EXISTS Payment;
DROP TABLE IF EXISTS OrderItem;
DROP TABLE IF EXISTS [Order];
DROP TABLE IF EXISTS Cart_Item;
DROP TABLE IF EXISTS Cart;
DROP TABLE IF EXISTS Product_Image;
DROP TABLE IF EXISTS Product;
DROP TABLE IF EXISTS Category;
DROP TABLE IF EXISTS Admin;
DROP TABLE IF EXISTS Customer;
GO


USE TinhJewelryDB;
GO


-- =====================================================
-- 1. CUSTOMER
-- =====================================================

INSERT INTO Customer
(FullName, Phone, Email, Address, Password, CreatedAt)
VALUES
(N'Nguyen Minh Anh', '0901234567',
 'minhanh@gmail.com', N'Quan 1, TP. Ho Chi Minh',
 'DEMO_HASH_001', '2026-10-01'),

(N'Tran Hoang Nam', '0912345678',
 'hoangnam@gmail.com', N'Thu Duc, TP. Ho Chi Minh',
 'DEMO_HASH_002', '2026-10-05'),

(N'Le Thao Nguyen', '0923456789',
 'thaonguyen@gmail.com', N'Quan 7, TP. Ho Chi Minh',
 'DEMO_HASH_003', '2026-10-10'),

(N'Pham Gia Han', '0934567890',
 'giahan@gmail.com', N'Bien Hoa, Dong Nai',
 'DEMO_HASH_004', '2026-10-15'),

(N'Vo Thanh Tung', '0945678901',
 'thanhtung@gmail.com', N'Di An, Binh Duong',
 'DEMO_HASH_005', '2026-10-20');
GO

-- =====================================================
-- 2. ADMIN
-- =====================================================

INSERT INTO Admin
(FullName, Username, Password, Email, Role)
VALUES
(N'Nguyen Van Admin', 'admin',
 'DEMO_HASH_ADMIN_001',
 'admin@tinh.vn', 'Administrator'),

(N'Tran Thi Manager', 'manager',
 'DEMO_HASH_ADMIN_002',
 'manager@tinh.vn', 'Manager');
GO

-- =====================================================
-- 3. CATEGORY
-- =====================================================

INSERT INTO Category
(CategoryName, Description)
VALUES
(
    N'Vòng tay',
    N'Danh mục vòng tay bạc 925 của TĨNH, gồm các thiết kế tối giản, thanh lịch và dễ phối hợp với nhiều loại trang phục.'
),
(
    N'Dây chuyền',
    N'Danh mục dây chuyền bạc 925 của TĨNH, tập trung vào thiết kế tinh gọn, gồm dây chuyền không mặt, mặt hình học và mặt thanh.'
),
(
    N'Bộ sản phẩm DIY',
    N'Danh mục bộ sản phẩm tự thiết kế trang sức, dự kiến phát triển trong giai đoạn 2 khi thương hiệu đáp ứng được yêu cầu về nguồn cung và chi phí.'
);
GO


-- =====================================================
-- 4. PRODUCT
-- =====================================================

INSERT INTO Product
(
    ProductCode,
    ProductName,
    Description,
    Price,
    Material,
    Size,
    CareInstructions,
    Style,
    StockQuantity,
    StockStatus,
    CategoryID
)
SELECT
    V.ProductCode,
    V.ProductName,
    V.Description,
    V.Price,
    V.Material,
    V.Size,
    V.CareInstructions,
    V.Style,
    V.StockQuantity,
    V.StockStatus,
    V.CategoryID
FROM
(
    VALUES
    -- VONG TAY
    (
        'A01',
        N'Vòng tay bạc mảnh TĨNH',
        N'Thiết kế dạng dây mảnh, ít chi tiết trang trí, tạo vẻ thanh lịch và dễ phối cùng đồng hồ hoặc phụ kiện khác.',
        250000,
        N'Bạc 925 (dự kiến)',
        N'Chưa xác nhận',
        N'Bảo quản nơi khô ráo, hạn chế tiếp xúc với hóa chất và nước hoa.',
        N'Tối giản',
        20,
        N'Dự kiến',
        1
    ),
    (
        'A02',
        N'Vòng tay hình học TĨNH',
        N'Vòng tay có một chi tiết hình học nhỏ làm điểm nhấn, giữ tổng thể gọn và cân đối.',
        300000,
        N'Bạc 925 (dự kiến)',
        N'Chưa xác nhận',
        N'Lau nhẹ bằng khăn mềm và bảo quản trong hộp trang sức.',
        N'Hình học tối giản',
        15,
        N'Dự kiến',
        1
    ),
    (
        'A03',
        N'Vòng tay chuỗi thanh lịch TĨNH',
        N'Kết cấu chuỗi với các mắt nối nhỏ, tạo điểm nhấn từ cấu trúc sản phẩm thay vì họa tiết cầu kỳ.',
        350000,
        N'Bạc 925 (dự kiến)',
        N'Chưa xác nhận',
        N'Tránh va đập mạnh và bảo quản riêng khi không sử dụng.',
        N'Thanh lịch',
        15,
        N'Dự kiến',
        1
    ),

    -- DAY CHUYEN
    (
        'N01',
        N'Dây chuyền bạc mảnh TĨNH',
        N'Dây chuyền không có mặt trang trí, tập trung vào sự đơn giản của kết cấu dây.',
        250000,
        N'Bạc 925 (dự kiến)',
        N'Chưa xác nhận',
        N'Bảo quản nơi khô ráo, tránh tiếp xúc trực tiếp với hóa chất.',
        N'Tối giản',
        20,
        N'Dự kiến',
        2
    ),
    (
        'N02',
        N'Dây chuyền mặt hình học TĨNH',
        N'Dây chuyền có mặt hình tròn hoặc hình học nhỏ, tạo điểm nhấn vừa phải.',
        300000,
        N'Bạc 925 (dự kiến)',
        N'Chưa xác nhận',
        N'Lau bằng khăn mềm sau khi sử dụng và bảo quản trong hộp kín.',
        N'Hình học tối giản',
        15,
        N'Dự kiến',
        2
    ),
    (
        'N03',
        N'Dây chuyền mặt thanh TĨNH',
        N'Dây chuyền có mặt dạng thanh dài, thiết kế tinh gọn và dễ phối với trang phục.',
        350000,
        N'Bạc 925 (dự kiến)',
        N'Chưa xác nhận',
        N'Hạn chế tiếp xúc với nước hoa và chất tẩy rửa.',
        N'Thanh lịch',
        15,
        N'Dự kiến',
        2
    ),

    -- BO SAN PHAM DIY
    (
        'DIY01',
        N'Bộ tự phối vòng tay TĨNH',
        N'Bộ sản phẩm dự kiến gồm dây, hạt hoặc chi tiết trang trí, khóa nối và phụ kiện cần thiết để khách hàng tự phối vòng tay theo hướng dẫn.',
        NULL,
        N'Chưa xác nhận',
        N'Tùy thành phần bộ sản phẩm',
        N'Bảo quản các thành phần riêng biệt theo hướng dẫn sử dụng.',
        N'Tự sáng tạo',
        0,
        N'Chưa kinh doanh',
        3
    ),
    (
        'DIY02',
        N'Bộ tự thiết kế dây chuyền TĨNH',
        N'Bộ sản phẩm dự kiến gồm dây nền, mặt trang trí và phụ kiện kết nối phù hợp với mẫu hướng dẫn.',
        NULL,
        N'Chưa xác nhận',
        N'Tùy thành phần bộ sản phẩm',
        N'Bảo quản các thành phần trong bao bì phù hợp.',
        N'Cá nhân hóa',
        0,
        N'Chưa kinh doanh',
        3
    )
) AS V
(
    ProductCode,
    ProductName,
    Description,
    Price,
    Material,
    Size,
    CareInstructions,
    Style,
    StockQuantity,
    StockStatus,
    CategoryID
)
WHERE NOT EXISTS
(
    SELECT 1
    FROM Product P
    WHERE P.ProductCode = V.ProductCode
);

GO

-- KIỂM TRA
SELECT * FROM Product;
-- =====================================================
-- 5. PRODUCT_IMAGE
-- =====================================================

INSERT INTO Product_Image
(ProductID, ImageURL, IsPrimary)
SELECT
    P.ProductID,
    V.ImageURL,
    V.IsPrimary
FROM
(
    VALUES
    ('A01', 'images/products/A01-main.jpg', 1),
    ('A01', 'images/products/A01-detail.jpg', 0),

    ('A02', 'images/products/A02-main.jpg', 1),
    ('A02', 'images/products/A02-detail.jpg', 0),

    ('A03', 'images/products/A03-main.jpg', 1),
    ('A03', 'images/products/A03-detail.jpg', 0),

    ('N01', 'images/products/N01-main.jpg', 1),
    ('N01', 'images/products/N01-detail.jpg', 0),

    ('N02', 'images/products/N02-main.jpg', 1),
    ('N02', 'images/products/N02-detail.jpg', 0),

    ('N03', 'images/products/N03-main.jpg', 1),
    ('N03', 'images/products/N03-detail.jpg', 0),

    ('DIY01', 'images/products/DIY01-main.jpg', 1),
    ('DIY01', 'images/products/DIY01-detail.jpg', 0),

    ('DIY02', 'images/products/DIY02-main.jpg', 1),
    ('DIY02', 'images/products/DIY02-detail.jpg', 0)

) AS V(ProductCode, ImageURL, IsPrimary)
INNER JOIN Product P
    ON P.ProductCode = V.ProductCode;
GO


-- =============================================
-- 6. CART
-- =============================================

INSERT INTO Cart (CustomerID, CreatedAt)
SELECT CustomerID, DATEADD(DAY, -1, GETDATE())
FROM Customer
WHERE Email = 'nguyenvana@gmail.com';

INSERT INTO Cart (CustomerID, CreatedAt)
SELECT CustomerID, GETDATE()
FROM Customer
WHERE Email = 'tranthib@gmail.com';


-- =============================================
-- 7. CART_ITEM
-- =============================================

INSERT INTO Cart_Item
    (CartID, ProductID, Quantity, UnitPrice)
SELECT
    C.CartID,
    P.ProductID,
    V.Quantity,
    P.Price
FROM Cart C
JOIN Customer CU ON C.CustomerID = CU.CustomerID
JOIN (
    VALUES
    ('A01', 2, 'nguyenvana@gmail.com'),
    ('N01', 1, 'nguyenvana@gmail.com'),
    ('A02', 1, 'tranthib@gmail.com'),
    ('N02', 2, 'tranthib@gmail.com')
) V(ProductCode, Quantity, Email)
    ON CU.Email = V.Email
JOIN Product P ON P.ProductCode = V.ProductCode;


-- =============================================
-- 8. ORDER
-- =============================================

INSERT INTO [Order]
(
    OrderCode,
    CustomerID,
    AdminID,
    ReceiverName,
    ReceiverPhone,
    ShippingAddress,
    SubTotal,
    ShippingFee,
    TotalAmount,
    OrderStatus,
    CancelReason,
    CreatedAt,
    UpdatedAt
)
SELECT
    'ORD001',
    C.CustomerID,
    NULL,
    C.FullName,
    C.Phone,
    C.Address,
    850000,
    30000,
    880000,
    N'Đang xử lý',
    NULL,
    DATEADD(DAY, -2, GETDATE()),
    GETDATE()
FROM Customer C
WHERE C.Email = 'minhanh@gmail.com'
AND NOT EXISTS (
    SELECT 1 FROM [Order] WHERE OrderCode = 'ORD001'
);

INSERT INTO [Order]
(
    OrderCode,
    CustomerID,
    AdminID,
    ReceiverName,
    ReceiverPhone,
    ShippingAddress,
    SubTotal,
    ShippingFee,
    TotalAmount,
    OrderStatus,
    CancelReason,
    CreatedAt,
    UpdatedAt
)
SELECT
    'ORD002',
    C.CustomerID,
    NULL,
    C.FullName,
    C.Phone,
    C.Address,
    850000,
    30000,
    880000,
    N'Chờ thanh toán',
    NULL,
    DATEADD(DAY, -1, GETDATE()),
    GETDATE()
FROM Customer C
WHERE C.Email = 'hoangnam@gmail.com'
AND NOT EXISTS (
    SELECT 1 FROM [Order] WHERE OrderCode = 'ORD002'
);
GO

-- =============================================
-- 9. ORDER ITEM
-- =============================================

INSERT INTO OrderItem
(OrderID, ProductID, Quantity, UnitPrice, LineTotal)
SELECT
    O.OrderID,
    P.ProductID,
    V.Quantity,
    V.UnitPrice,
    V.Quantity * V.UnitPrice
FROM [Order] O
JOIN (
    VALUES
    ('ORD001', 'A01', 2, 250000),
    ('ORD001', 'N01', 1, 350000),
    ('ORD002', 'A02', 1, 300000),
    ('ORD002', 'N02', 1, 550000)
) V(OrderCode, ProductCode, Quantity, UnitPrice)
    ON O.OrderCode = V.OrderCode
JOIN Product P ON P.ProductCode = V.ProductCode;


-- =============================================
-- 10. PAYMENT
-- =============================================

INSERT INTO Payment
(
    OrderID,
    ConfirmedBy,
    PaymentMethod,
    Amount,
    PaymentStatus,
    TransactionInfo,
    ConfirmedAt
)
SELECT
    O.OrderID,
    NULL,
    N'COD',
    O.TotalAmount,
    N'Chưa thanh toán',
    N'Thanh toán khi nhận hàng',
    NULL
FROM [Order] O
WHERE O.OrderCode = 'ORD001';

INSERT INTO Payment
(
    OrderID,
    ConfirmedBy,
    PaymentMethod,
    Amount,
    PaymentStatus,
    TransactionInfo,
    ConfirmedAt
)
SELECT
    O.OrderID,
    NULL,
    N'Chuyển khoản',
    O.TotalAmount,
    N'Đã thanh toán',
    N'Giao dịch chuyển khoản DEMO002',
    GETDATE()
FROM [Order] O
WHERE O.OrderCode = 'ORD002';

-- =============================================
-- 11. SHIPMENT
-- =============================================

-- Đơn hàng ORD001
INSERT INTO Shipment
(
    OrderID,
    UpdatedBy,
    CarrierName,
    TrackingCode,
    HandoverTime,
    DeliveryStatus,
    DeliveredAt,
    Note
)
SELECT
    O.OrderID,
    (SELECT TOP 1 AdminID FROM Admin ORDER BY AdminID),
    N'Giao Hàng Tiết Kiệm',
    'GHTK-DEMO001',
    GETDATE(),
    N'Đang chuẩn bị',
    NULL,
    N'Đơn hàng đang được chuẩn bị để bàn giao cho đơn vị vận chuyển'
FROM [Order] O
WHERE O.OrderCode = 'ORD001';


-- Đơn hàng ORD002
INSERT INTO Shipment
(
    OrderID,
    UpdatedBy,
    CarrierName,
    TrackingCode,
    HandoverTime,
    DeliveryStatus,
    DeliveredAt,
    Note
)
SELECT
    O.OrderID,
    (SELECT TOP 1 AdminID FROM Admin ORDER BY AdminID),
    N'Giao Hàng Nhanh',
    'GHN-DEMO002',
    DATEADD(HOUR, -20, GETDATE()),
    N'Đã giao',
    DATEADD(HOUR, -2, GETDATE()),
    N'Đơn hàng đã được giao thành công'
FROM [Order] O
WHERE O.OrderCode = 'ORD002';


-- Đồng bộ trạng thái đơn hàng ORD002
UPDATE [Order]
SET
    OrderStatus = N'Đã giao',
    UpdatedAt = GETDATE()
WHERE OrderCode = 'ORD002';


-- =============================================
-- 12. RETURN REQUEST
-- =============================================

-- Khách hàng tạo yêu cầu hoàn tiền cho sản phẩm N02
INSERT INTO ReturnRequest
(
    OrderID,
    CustomerID,
    HandledBy,
    RequestType,
    Reason,
    ProductConditionDescription,
    EvidenceImage,
    RequestStatus,
    RejectReason,
    Resolution,
    InspectionResult,
    ReceivedAt,
    CreatedAt
)
SELECT
    O.OrderID,
    O.CustomerID,
    (SELECT TOP 1 AdminID FROM Admin ORDER BY AdminID),
    N'Hoàn tiền',
    N'Sản phẩm không đúng mong đợi',
    N'Sản phẩm còn nguyên vẹn, đầy đủ phụ kiện',
    N'images/returns/ORD002-evidence.jpg',
    N'Chờ xác nhận',
    NULL,
    NULL,
    NULL,
    NULL,
    GETDATE()
FROM [Order] O
WHERE O.OrderCode = 'ORD002';


-- =============================================
-- 13. RETURN ITEM
-- =============================================

INSERT INTO ReturnItem
(
    RequestID,
    OrderItemID,
    Quantity,
    ItemCondition
)
SELECT
    R.RequestID,
    OI.OrderItemID,
    1,
    N'Còn nguyên vẹn'
FROM ReturnRequest R
JOIN [Order] O ON R.OrderID = O.OrderID
JOIN OrderItem OI ON OI.OrderID = O.OrderID
JOIN Product P ON OI.ProductID = P.ProductID
WHERE O.OrderCode = 'ORD002'
  AND P.ProductCode = 'N02';


-- =============================================
-- 14. REFUND
-- =============================================

INSERT INTO Refund
(
    RequestID,
    OrderID,
    PaymentID,
    UpdatedBy,
    RefundAmount,
    RefundMethod,
    RefundStatus,
    ConfirmedAt
)
SELECT
    R.RequestID,
    O.OrderID,
    Pay.PaymentID,
    (SELECT TOP 1 AdminID FROM Admin ORDER BY AdminID),
    550000,
    N'Chuyển khoản ngân hàng',
    N'Chờ xử lý',
    NULL
FROM ReturnRequest R
JOIN [Order] O ON R.OrderID = O.OrderID
JOIN Payment Pay ON Pay.OrderID = O.OrderID
WHERE O.OrderCode = 'ORD002';


-- =============================================
-- 15. INVENTORY LOG
-- =============================================

-- Ghi nhận nhập kho sản phẩm A01
INSERT INTO InventoryLog
(
    ProductID,
    OrderID,
    RequestID,
    AdminID,
    ChangeQuantity,
    Reason,
    CreatedAt
)
SELECT
    P.ProductID,
    NULL,
    NULL,
    (SELECT TOP 1 AdminID FROM Admin ORDER BY AdminID),
    20,
    N'Nhập kho ban đầu',
    GETDATE()
FROM Product P
WHERE P.ProductCode = 'A01';


-- Ghi nhận xuất kho sản phẩm A01 theo đơn ORD001
INSERT INTO InventoryLog
(
    ProductID,
    OrderID,
    RequestID,
    AdminID,
    ChangeQuantity,
    Reason,
    CreatedAt
)
SELECT
    P.ProductID,
    O.OrderID,
    NULL,
    (SELECT TOP 1 AdminID FROM Admin ORDER BY AdminID),
    -2,
    N'Xuất kho theo đơn hàng ORD001',
    GETDATE()
FROM Product P
JOIN OrderItem OI ON P.ProductID = OI.ProductID
JOIN [Order] O ON OI.OrderID = O.OrderID
WHERE P.ProductCode = 'A01'
  AND O.OrderCode = 'ORD001';


-- Ghi nhận nhập lại sản phẩm N02 sau khi hoàn trả
INSERT INTO InventoryLog
(
    ProductID,
    OrderID,
    RequestID,
    AdminID,
    ChangeQuantity,
    Reason,
    CreatedAt
)
SELECT
    P.ProductID,
    O.OrderID,
    R.RequestID,
    (SELECT TOP 1 AdminID FROM Admin ORDER BY AdminID),
    1,
    N'Nhập lại sản phẩm từ yêu cầu hoàn trả',
    GETDATE()
FROM Product P
JOIN OrderItem OI ON P.ProductID = OI.ProductID
JOIN [Order] O ON OI.OrderID = O.OrderID
JOIN ReturnRequest R ON R.OrderID = O.OrderID
WHERE P.ProductCode = 'N02'
  AND O.OrderCode = 'ORD002';



-- =============================================
-- KIỂM TRA DỮ LIỆU
-- =============================================
SELECT * FROM Category;
SELECT * FROM Customer;
SELECT * FROM Admin;
SELECT * FROM Product;
SELECT * FROM Product_Image;
SELECT * FROM Cart;
SELECT * FROM Cart_Item;
SELECT * FROM [Order];
SELECT * FROM OrderItem;
SELECT * FROM Payment;
SELECT * FROM Shipment;
SELECT * FROM ReturnRequest;
SELECT * FROM ReturnItem;
SELECT * FROM Refund;
SELECT * FROM InventoryLog;
SELECT COUNT(*) AS TotalProducts
