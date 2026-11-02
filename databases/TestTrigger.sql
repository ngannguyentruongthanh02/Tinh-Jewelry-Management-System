use TinhJewelryDB
go
/* =====================================================
   PHẦN 3: TEST TRIGGER
   ===================================================== */


/* TEST 1: ORDER ITEM INSERT */

BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @TestProductID INT;
    DECLARE @TestOrderID INT;
    DECLARE @StockBefore INT;

    SELECT TOP 1 @TestProductID = ProductID
    FROM Product
    WHERE StockQuantity >= 2
    ORDER BY ProductID;

    SELECT TOP 1 @TestOrderID = OrderID
    FROM [Order]
    ORDER BY OrderID;

    IF @TestProductID IS NULL OR @TestOrderID IS NULL
        THROW 50010, N'Test 1: Không có sản phẩm đủ tồn kho hoặc đơn hàng.', 1;

    SELECT @StockBefore = StockQuantity
    FROM Product
    WHERE ProductID = @TestProductID;

    INSERT INTO OrderItem (OrderID, ProductID, Quantity, UnitPrice)
    VALUES (@TestOrderID, @TestProductID, 2, 100000);

    SELECT
        N'TEST 1 - INSERT' AS TestName,
        @StockBefore AS StockBefore,
        StockQuantity AS StockAfter,
        @StockBefore - StockQuantity AS QuantityDeducted
    FROM Product
    WHERE ProductID = @TestProductID;

    ROLLBACK TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    SELECT N'TEST 1 FAILED' AS TestName, ERROR_MESSAGE() AS ErrorMessage;
END CATCH;
GO


/* TEST 2: ORDER ITEM DELETE */

BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @DeleteItemID INT;
    DECLARE @DeleteProductID INT;
    DECLARE @DeleteStockBefore INT;
    DECLARE @DeleteQuantity INT;

    SELECT TOP 1
        @DeleteItemID = OrderItemID,
        @DeleteProductID = ProductID,
        @DeleteQuantity = Quantity
    FROM OrderItem
    ORDER BY OrderItemID;

    IF @DeleteItemID IS NULL
        THROW 50011, N'Test 2: OrderItem không có dữ liệu.', 1;

    SELECT @DeleteStockBefore = StockQuantity
    FROM Product
    WHERE ProductID = @DeleteProductID;

    DELETE FROM OrderItem
    WHERE OrderItemID = @DeleteItemID;

    SELECT
        N'TEST 2 - DELETE' AS TestName,
        @DeleteStockBefore AS StockBefore,
        StockQuantity AS StockAfter,
        StockQuantity - @DeleteStockBefore AS QuantityRestored,
        @DeleteQuantity AS ExpectedRestored
    FROM Product
    WHERE ProductID = @DeleteProductID;

    ROLLBACK TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    SELECT N'TEST 2 FAILED' AS TestName, ERROR_MESSAGE() AS ErrorMessage;
END CATCH;
GO


/* TEST 3: ORDER ITEM UPDATE */

BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @UpdateItemID INT;
    DECLARE @UpdateProductID INT;
    DECLARE @UpdateStockBefore INT;

    SELECT TOP 1
        @UpdateItemID = OrderItemID,
        @UpdateProductID = ProductID
    FROM OrderItem
    ORDER BY OrderItemID;

    IF @UpdateItemID IS NULL
        THROW 50012, N'Test 3: OrderItem không có dữ liệu.', 1;

    SELECT @UpdateStockBefore = StockQuantity
    FROM Product
    WHERE ProductID = @UpdateProductID;

    UPDATE OrderItem
    SET Quantity = Quantity + 1
    WHERE OrderItemID = @UpdateItemID;

    SELECT
        N'TEST 3 - UPDATE' AS TestName,
        @UpdateStockBefore AS StockBefore,
        StockQuantity AS StockAfter,
        @UpdateStockBefore - StockQuantity AS QuantityDeducted
    FROM Product
    WHERE ProductID = @UpdateProductID;

    ROLLBACK TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    SELECT N'TEST 3 FAILED' AS TestName, ERROR_MESSAGE() AS ErrorMessage;
END CATCH;
GO


/* TEST 4: PAYMENT UPDATE */

BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @TestPaymentID INT;

    SELECT TOP 1 @TestPaymentID = PaymentID
    FROM Payment
    ORDER BY PaymentID;

    IF @TestPaymentID IS NULL
        THROW 50013, N'Test 4: Payment không có dữ liệu.', 1;

    UPDATE Payment
    SET PaymentStatus = N'Đã thanh toán'
    WHERE PaymentID = @TestPaymentID;

    SELECT
        N'TEST 4 - PAYMENT' AS TestName,
        P.PaymentStatus,
        O.OrderStatus
    FROM Payment P
    JOIN [Order] O ON P.OrderID = O.OrderID
    WHERE P.PaymentID = @TestPaymentID;

    ROLLBACK TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    SELECT N'TEST 4 FAILED' AS TestName, ERROR_MESSAGE() AS ErrorMessage;
END CATCH;
GO


/* TEST 5: SHIPMENT UPDATE */

BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @TestShipmentID INT;

    SELECT TOP 1 @TestShipmentID = ShipmentID
    FROM Shipment
    ORDER BY ShipmentID;

    IF @TestShipmentID IS NULL
        THROW 50014, N'Test 5: Shipment không có dữ liệu.', 1;

    UPDATE Shipment
    SET DeliveryStatus = N'Đã giao hàng'
    WHERE ShipmentID = @TestShipmentID;

    SELECT
        N'TEST 5 - SHIPMENT' AS TestName,
        S.DeliveryStatus,
        S.DeliveredAt,
        O.OrderStatus
    FROM Shipment S
    JOIN [Order] O ON S.OrderID = O.OrderID
    WHERE S.ShipmentID = @TestShipmentID;

    ROLLBACK TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    SELECT N'TEST 5 FAILED' AS TestName, ERROR_MESSAGE() AS ErrorMessage;
END CATCH;
GO


/* TEST 6: REFUND UPDATE */

BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @TestRefundID INT;

    SELECT TOP 1 @TestRefundID = RefundID
    FROM Refund
    ORDER BY RefundID;

    IF @TestRefundID IS NULL
        THROW 50015, N'Test 6: Refund không có dữ liệu.', 1;

    UPDATE Refund
    SET RefundStatus = N'Đã hoàn tiền'
    WHERE RefundID = @TestRefundID;

    SELECT
        N'TEST 6 - REFUND' AS TestName,
        RefundStatus,
        ConfirmedAt
    FROM Refund
    WHERE RefundID = @TestRefundID;

    ROLLBACK TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    SELECT N'TEST 6 FAILED' AS TestName, ERROR_MESSAGE() AS ErrorMessage;
END CATCH;
GO


/* TEST 7: PRODUCT STOCK STATUS */

BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @StatusProductID INT;

    SELECT TOP 1 @StatusProductID = ProductID
    FROM Product
    ORDER BY ProductID;

    IF @StatusProductID IS NULL
        THROW 50016, N'Test 7: Product không có dữ liệu.', 1;

    -- Test hết hàng
    UPDATE Product
    SET StockQuantity = 0
    WHERE ProductID = @StatusProductID;

    SELECT
        N'TEST 7A - OUT OF STOCK' AS TestName,
        ProductID,
        StockQuantity,
        StockStatus
    FROM Product
    WHERE ProductID = @StatusProductID;

    -- Test còn hàng
    UPDATE Product
    SET StockQuantity = 10
    WHERE ProductID = @StatusProductID;

    SELECT
        N'TEST 7B - IN STOCK' AS TestName,
        ProductID,
        StockQuantity,
        StockStatus
    FROM Product
    WHERE ProductID = @StatusProductID;

    ROLLBACK TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    SELECT N'TEST 7 FAILED' AS TestName, ERROR_MESSAGE() AS ErrorMessage;
END CATCH;
GO