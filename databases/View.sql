
USE TinhJewelryDB;
GO

/* =====================================================
   1. VIEW: THÔNG TIN CHI TIẾT SẢN PHẨM
   ===================================================== */

DROP VIEW IF EXISTS vw_ProductDetails;
GO

CREATE VIEW vw_ProductDetails
AS
SELECT
    P.ProductID,
    P.ProductCode,
    P.ProductName,
    P.Description,
    P.Price,
    P.Material,
    P.Size,
    P.Style,
    P.StockQuantity,
    P.StockStatus,
    C.CategoryName,
    PI.ImageURL AS PrimaryImage
FROM Product P
LEFT JOIN Category C
    ON P.CategoryID = C.CategoryID
LEFT JOIN Product_Image PI
    ON P.ProductID = PI.ProductID
    AND PI.IsPrimary = 1;
GO


/* =====================================================
   2. VIEW: THÔNG TIN ĐƠN HÀNG
   ===================================================== */

DROP VIEW IF EXISTS vw_OrderDetails;
GO

CREATE VIEW vw_OrderDetails
AS
SELECT
    O.OrderID,
    O.OrderCode,
    O.CustomerID,
    C.FullName AS CustomerName,
    C.Email,
    O.AdminID,
    A.FullName AS AdminName,
    O.ReceiverName,
    O.ReceiverPhone,
    O.ShippingAddress,
    O.SubTotal,
    O.ShippingFee,
    O.TotalAmount,
    O.OrderStatus,
    O.CancelReason,
    O.CreatedAt,
    O.UpdatedAt
FROM [Order] O
INNER JOIN Customer C
    ON O.CustomerID = C.CustomerID
LEFT JOIN Admin A
    ON O.AdminID = A.AdminID;
GO


/* =====================================================
   3. VIEW: CHI TIẾT SẢN PHẨM TRONG ĐƠN HÀNG
   ===================================================== */

DROP VIEW IF EXISTS vw_OrderItems;
GO

CREATE VIEW vw_OrderItems
AS
SELECT
    OI.OrderItemID,
    OI.OrderID,
    O.OrderCode,
    OI.ProductID,
    P.ProductCode,
    P.ProductName,
    OI.Quantity,
    OI.UnitPrice,
    OI.LineTotal
FROM OrderItem OI
INNER JOIN [Order] O
    ON OI.OrderID = O.OrderID
INNER JOIN Product P
    ON OI.ProductID = P.ProductID;
GO


/* =====================================================
   4. VIEW: THÔNG TIN THANH TOÁN
   ===================================================== */

DROP VIEW IF EXISTS vw_PaymentDetails;
GO

CREATE VIEW vw_PaymentDetails
AS
SELECT
    P.PaymentID,
    P.OrderID,
    O.OrderCode,
    O.CustomerID,
    C.FullName AS CustomerName,
    P.ConfirmedBy,
    A.FullName AS AdminName,
    P.PaymentMethod,
    P.Amount,
    P.PaymentStatus,
    P.TransactionInfo,
    P.ConfirmedAt
FROM Payment P
INNER JOIN [Order] O
    ON P.OrderID = O.OrderID
INNER JOIN Customer C
    ON O.CustomerID = C.CustomerID
LEFT JOIN Admin A
    ON P.ConfirmedBy = A.AdminID;
GO


/* =====================================================
   5. VIEW: TÌNH TRẠNG TỒN KHO
   ===================================================== */

DROP VIEW IF EXISTS vw_InventoryStatus;
GO

CREATE VIEW vw_InventoryStatus
AS
SELECT
    P.ProductID,
    P.ProductCode,
    P.ProductName,
    C.CategoryName,
    P.Material,
    P.StockQuantity,
    P.StockStatus,
    CASE
        WHEN P.StockQuantity = 0 THEN N'Hết hàng'
        WHEN P.StockQuantity <= 5 THEN N'Sắp hết hàng'
        ELSE N'Còn hàng'
    END AS InventoryWarning
FROM Product P
LEFT JOIN Category C
    ON P.CategoryID = C.CategoryID;
GO


/* =====================================================
   6. VIEW: THỐNG KÊ DOANH THU THEO THÁNG
   ===================================================== */

DROP VIEW IF EXISTS vw_RevenueStatistics;
GO

CREATE VIEW vw_RevenueStatistics
AS
SELECT
    YEAR(P.ConfirmedAt) AS RevenueYear,
    MONTH(P.ConfirmedAt) AS RevenueMonth,
    COUNT(P.PaymentID) AS TotalTransactions,
    SUM(P.Amount) AS TotalRevenue
FROM Payment P
WHERE P.PaymentStatus = N'Đã thanh toán'
  AND P.ConfirmedAt IS NOT NULL
GROUP BY
    YEAR(P.ConfirmedAt),
    MONTH(P.ConfirmedAt);
GO


/* =====================================================
   7. VIEW: THÔNG TIN ĐỔI TRẢ VÀ HOÀN TIỀN
   ===================================================== */

DROP VIEW IF EXISTS vw_ReturnRefundDetails;
GO

CREATE VIEW vw_ReturnRefundDetails
AS
SELECT
    RR.RequestID,
    RR.OrderID,
    O.OrderCode,
    RR.CustomerID,
    C.FullName AS CustomerName,
    RR.HandledBy,
    A.FullName AS AdminName,
    RR.RequestType,
    RR.Reason,
    RR.ProductConditionDescription,
    RR.RequestStatus,
    RR.RejectReason,
    RR.Resolution,
    RR.InspectionResult,
    RR.ReceivedAt,
    RR.CreatedAt,

    RI.ReturnItemID,
    RI.OrderItemID,
    P.ProductName,
    RI.Quantity AS ReturnQuantity,
    RI.ItemCondition,

    R.RefundID,
    R.RefundAmount,
    R.RefundMethod,
    R.RefundStatus,
    R.ConfirmedAt AS RefundConfirmedAt

FROM ReturnRequest RR
INNER JOIN [Order] O
    ON RR.OrderID = O.OrderID
INNER JOIN Customer C
    ON RR.CustomerID = C.CustomerID
LEFT JOIN Admin A
    ON RR.HandledBy = A.AdminID
LEFT JOIN ReturnItem RI
    ON RR.RequestID = RI.RequestID
LEFT JOIN OrderItem OI
    ON RI.OrderItemID = OI.OrderItemID
LEFT JOIN Product P
    ON OI.ProductID = P.ProductID
LEFT JOIN Refund R
    ON RR.RequestID = R.RequestID;
GO


USE TinhJewelryDB;
GO

-- TEST 1: Thông tin sản phẩm
SELECT * FROM vw_ProductDetails;
GO

-- TEST 2: Thông tin đơn hàng
SELECT * FROM vw_OrderDetails;
GO

-- TEST 3: Chi tiết sản phẩm trong đơn hàng
SELECT * FROM vw_OrderItems;
GO

-- TEST 4: Thông tin thanh toán
SELECT * FROM vw_PaymentDetails;
GO

-- TEST 5: Tình trạng tồn kho
SELECT * FROM vw_InventoryStatus;
GO

-- TEST 6: Thống kê doanh thu
SELECT * FROM vw_RevenueStatistics;
GO

-- TEST 7: Đổi trả và hoàn tiền
SELECT * FROM vw_ReturnRefundDetails;
GO


-- KIỂM TRA DANH SÁCH VIEW ĐÃ TẠO
SELECT
    name AS ViewName,
    create_date AS CreatedDate
FROM sys.views
WHERE name IN (
    'vw_ProductDetails',
    'vw_OrderDetails',
    'vw_OrderItems',
    'vw_PaymentDetails',
    'vw_InventoryStatus',
    'vw_RevenueStatistics',
    'vw_ReturnRefundDetails'
)
ORDER BY name;
GO
