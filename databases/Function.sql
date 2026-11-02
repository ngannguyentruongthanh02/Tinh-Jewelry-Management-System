
USE TinhJewelryDB;
GO

/* =====================================================
   1. FUNCTION: KIỂM TRA TRẠNG THÁI TỒN KHO
   ===================================================== */

DROP FUNCTION IF EXISTS fn_GetProductStockStatus;
GO

CREATE FUNCTION fn_GetProductStockStatus
(
    @ProductID INT
)
RETURNS NVARCHAR(30)
AS
BEGIN
    DECLARE @Status NVARCHAR(30);

    SELECT @Status =
        CASE
            WHEN StockQuantity > 0 THEN N'Còn hàng'
            ELSE N'Hết hàng'
        END
    FROM Product
    WHERE ProductID = @ProductID;

    RETURN ISNULL(@Status, N'Không tồn tại');
END;
GO


/* =====================================================
   2. FUNCTION: TÍNH TỔNG TIỀN ĐƠN HÀNG
   ===================================================== */

DROP FUNCTION IF EXISTS fn_CalculateOrderTotal;
GO

CREATE FUNCTION fn_CalculateOrderTotal
(
    @OrderID INT
)
RETURNS DECIMAL(18,0)
AS
BEGIN
    DECLARE @SubTotal DECIMAL(18,0);
    DECLARE @ShippingFee DECIMAL(18,0);
    DECLARE @Total DECIMAL(18,0);

    -- Lấy phí vận chuyển
    SELECT @ShippingFee = ShippingFee
    FROM [Order]
    WHERE OrderID = @OrderID;

    -- Kiểm tra đơn hàng
    IF @@ROWCOUNT = 0
        RETURN 0;

    -- Tính tổng tiền sản phẩm
    SELECT @SubTotal = ISNULL(SUM(LineTotal), 0)
    FROM OrderItem
    WHERE OrderID = @OrderID;

    -- Tính tổng tiền đơn hàng
    SET @Total = ISNULL(@SubTotal, 0)
               + ISNULL(@ShippingFee, 0);

    RETURN @Total;
END;
GO


/* =====================================================
   3. FUNCTION: TÍNH TỔNG TIỀN KHÁCH HÀNG ĐÃ CHI TRẢ
   ===================================================== */

DROP FUNCTION IF EXISTS fn_GetCustomerTotalSpent;
GO

CREATE FUNCTION fn_GetCustomerTotalSpent
(
    @CustomerID INT
)
RETURNS DECIMAL(18,0)
AS
BEGIN
    DECLARE @TotalSpent DECIMAL(18,0);

    SELECT @TotalSpent = ISNULL(SUM(P.Amount), 0)
    FROM Payment P
    INNER JOIN [Order] O
        ON P.OrderID = O.OrderID
    WHERE O.CustomerID = @CustomerID
      AND P.PaymentStatus = N'Đã thanh toán';

    RETURN ISNULL(@TotalSpent, 0);
END;
GO


/* =====================================================
   4. FUNCTION: THỐNG KÊ DOANH THU THEO THÁNG
   ===================================================== */

DROP FUNCTION IF EXISTS fn_GetMonthlyRevenue;
GO

CREATE FUNCTION fn_GetMonthlyRevenue
(
    @Month INT,
    @Year INT
)
RETURNS TABLE
AS
RETURN
(
    SELECT
        @Month AS RevenueMonth,
        @Year AS RevenueYear,
        ISNULL(SUM(P.Amount), 0) AS TotalRevenue
    FROM Payment P
    WHERE P.PaymentStatus = N'Đã thanh toán'
      AND P.ConfirmedAt >= DATEFROMPARTS(@Year, @Month, 1)
      AND P.ConfirmedAt < DATEADD(
            MONTH, 1, DATEFROMPARTS(@Year, @Month, 1)
          )
);
GO


/* =====================================================
   KIỂM TRA 4 FUNCTION ĐÃ ĐƯỢC TẠO
   ===================================================== */

SELECT
    name AS FunctionName,
    type_desc AS FunctionType
FROM sys.objects
WHERE name IN (
    'fn_GetProductStockStatus',
    'fn_CalculateOrderTotal',
    'fn_GetCustomerTotalSpent',
    'fn_GetMonthlyRevenue'
)
ORDER BY name;
GO



USE TinhJewelryDB;
GO

/* TEST 1: TRẠNG THÁI TỒN KHO */

SELECT
    ProductID,
    ProductName,
    StockQuantity,
    dbo.fn_GetProductStockStatus(ProductID) AS StockStatus
FROM Product;
GO


/* TEST 2: TÍNH TỔNG TIỀN ĐƠN HÀNG */

SELECT
    OrderID,
    OrderCode,
    SubTotal,
    ShippingFee,
    TotalAmount AS StoredTotal,
    dbo.fn_CalculateOrderTotal(OrderID) AS CalculatedTotal
FROM [Order];
GO


/* TEST 3: TỔNG TIỀN KHÁCH HÀNG ĐÃ CHI TRẢ */

SELECT
    CustomerID,
    FullName,
    dbo.fn_GetCustomerTotalSpent(CustomerID) AS TotalSpent
FROM Customer;
GO


/* TEST 4: DOANH THU THEO THÁNG */

SELECT *
FROM dbo.fn_GetMonthlyRevenue(11, 2026);
GO

