
USE TinhJewelryDB;
GO

/* =============================================
   1. TRIGGER: TRỪ TỒN KHO KHI THÊM ORDER ITEM
   ============================================= */

DROP TRIGGER IF EXISTS trg_OrderItem_Insert;
GO

CREATE TRIGGER trg_OrderItem_Insert
ON OrderItem
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    -- Kiểm tra tồn kho
    IF EXISTS (
        SELECT 1
        FROM Product P
        JOIN (
            SELECT ProductID, SUM(Quantity) AS TotalQuantity
            FROM inserted
            GROUP BY ProductID
        ) I ON P.ProductID = I.ProductID
        WHERE P.StockQuantity < I.TotalQuantity
    )
    BEGIN
        THROW 50001, N'Số lượng tồn kho không đủ.', 1;
    END;

    -- Trừ tồn kho
    UPDATE P
    SET P.StockQuantity = P.StockQuantity - I.TotalQuantity
    FROM Product P
    JOIN (
        SELECT ProductID, SUM(Quantity) AS TotalQuantity
        FROM inserted
        GROUP BY ProductID
    ) I ON P.ProductID = I.ProductID;
END;
GO


/* =============================================
   2. TRIGGER: HOÀN TỒN KHO KHI XÓA ORDER ITEM
   ============================================= */

DROP TRIGGER IF EXISTS trg_OrderItem_Delete;
GO

CREATE TRIGGER trg_OrderItem_Delete
ON OrderItem
AFTER DELETE
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE P
    SET P.StockQuantity = P.StockQuantity + D.TotalQuantity
    FROM Product P
    JOIN (
        SELECT ProductID, SUM(Quantity) AS TotalQuantity
        FROM deleted
        GROUP BY ProductID
    ) D ON P.ProductID = D.ProductID;
END;
GO


/* =============================================
   3. TRIGGER: CẬP NHẬT TỒN KHO KHI SỬA ORDER ITEM
   ============================================= */

DROP TRIGGER IF EXISTS trg_OrderItem_Update;
GO

CREATE TRIGGER trg_OrderItem_Update
ON OrderItem
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @StockChange TABLE (
        ProductID INT,
        ChangeQuantity INT
    );

    -- Tính chênh lệch số lượng
    INSERT INTO @StockChange (ProductID, ChangeQuantity)
    SELECT ProductID, SUM(ChangeQuantity)
    FROM (
        SELECT ProductID, -SUM(Quantity) AS ChangeQuantity
        FROM inserted
        GROUP BY ProductID

        UNION ALL

        SELECT ProductID, SUM(Quantity) AS ChangeQuantity
        FROM deleted
        GROUP BY ProductID
    ) X
    GROUP BY ProductID;

    -- Kiểm tra tồn kho
    IF EXISTS (
        SELECT 1
        FROM Product P
        JOIN @StockChange S ON P.ProductID = S.ProductID
        WHERE P.StockQuantity + S.ChangeQuantity < 0
    )
    BEGIN
        THROW 50002, N'Số lượng tồn kho không đủ để cập nhật.', 1;
    END;

    -- Cập nhật tồn kho
    UPDATE P
    SET P.StockQuantity = P.StockQuantity + S.ChangeQuantity
    FROM Product P
    JOIN @StockChange S ON P.ProductID = S.ProductID;
END;
GO


/* =============================================
   4. TRIGGER: CẬP NHẬT ĐƠN HÀNG KHI THANH TOÁN
   ============================================= */

DROP TRIGGER IF EXISTS trg_Payment_Update;
GO

CREATE TRIGGER trg_Payment_Update
ON Payment
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT UPDATE(PaymentStatus)
        RETURN;

    UPDATE O
    SET O.OrderStatus = N'Đã thanh toán',
        O.UpdatedAt = GETDATE()
    FROM [Order] O
    JOIN inserted I ON O.OrderID = I.OrderID
    JOIN deleted D ON I.PaymentID = D.PaymentID
    WHERE I.PaymentStatus = N'Đã thanh toán'
      AND (
          D.PaymentStatus IS NULL
          OR D.PaymentStatus <> N'Đã thanh toán'
      );
END;
GO


/* =============================================
   5. TRIGGER: ĐỒNG BỘ TRẠNG THÁI GIAO HÀNG
   ============================================= */

DROP TRIGGER IF EXISTS trg_Shipment_Update;
GO

CREATE TRIGGER trg_Shipment_Update
ON Shipment
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT UPDATE(DeliveryStatus)
        RETURN;

    -- Cập nhật thời gian giao hàng
    UPDATE S
    SET S.DeliveredAt = GETDATE()
    FROM Shipment S
    JOIN inserted I ON S.ShipmentID = I.ShipmentID
    JOIN deleted D ON I.ShipmentID = D.ShipmentID
    WHERE I.DeliveryStatus = N'Đã giao hàng'
      AND (
          D.DeliveryStatus IS NULL
          OR D.DeliveryStatus <> N'Đã giao hàng'
      )
      AND S.DeliveredAt IS NULL;

    -- Cập nhật trạng thái đơn hàng
    UPDATE O
    SET O.OrderStatus = N'Đã giao hàng',
        O.UpdatedAt = GETDATE()
    FROM [Order] O
    JOIN inserted I ON O.OrderID = I.OrderID
    JOIN deleted D ON I.ShipmentID = D.ShipmentID
    WHERE I.DeliveryStatus = N'Đã giao hàng'
      AND (
          D.DeliveryStatus IS NULL
          OR D.DeliveryStatus <> N'Đã giao hàng'
      );
END;
GO


/* =============================================
   6. TRIGGER: CẬP NHẬT THỜI GIAN HOÀN TIỀN
   ============================================= */

DROP TRIGGER IF EXISTS trg_Refund_Update;
GO

CREATE TRIGGER trg_Refund_Update
ON Refund
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT UPDATE(RefundStatus)
        RETURN;

    UPDATE R
    SET R.ConfirmedAt = GETDATE()
    FROM Refund R
    JOIN inserted I ON R.RefundID = I.RefundID
    JOIN deleted D ON I.RefundID = D.RefundID
    WHERE I.RefundStatus = N'Đã hoàn tiền'
      AND (
          D.RefundStatus IS NULL
          OR D.RefundStatus <> N'Đã hoàn tiền'
      )
      AND R.ConfirmedAt IS NULL;
END;
GO


/* =============================================
   7. TRIGGER: CẬP NHẬT TRẠNG THÁI TỒN KHO
   ============================================= */

DROP TRIGGER IF EXISTS trg_Product_UpdateStockStatus;
GO

CREATE TRIGGER trg_Product_UpdateStockStatus
ON Product
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT UPDATE(StockQuantity)
        RETURN;

    UPDATE P
    SET P.StockStatus =
        CASE
            WHEN P.StockQuantity > 0 THEN N'Còn hàng'
            ELSE N'Hết hàng'
        END
    FROM Product P
    JOIN inserted I ON P.ProductID = I.ProductID;
END;
GO


/* =============================================
   KIỂM TRA 7 TRIGGER ĐÃ TẠO
   ============================================= */

SELECT
    name AS TriggerName,
    OBJECT_NAME(parent_id) AS TableName,
    is_disabled AS IsDisabled
FROM sys.triggers
WHERE name IN (
    'trg_OrderItem_Insert',
    'trg_OrderItem_Delete',
    'trg_OrderItem_Update',
    'trg_Payment_Update',
    'trg_Shipment_Update',
    'trg_Refund_Update',
    'trg_Product_UpdateStockStatus'
)
ORDER BY name;
GO


USE TinhJewelryDB;
GO

SELECT 'Product' AS TableName, COUNT(*) AS TotalRows FROM Product
UNION ALL
SELECT 'Order', COUNT(*) FROM [Order]
UNION ALL
SELECT 'OrderItem', COUNT(*) FROM OrderItem
UNION ALL
SELECT 'Payment', COUNT(*) FROM Payment
UNION ALL
SELECT 'Shipment', COUNT(*) FROM Shipment
UNION ALL
SELECT 'Refund', COUNT(*) FROM Refund;
GO

-- Kiểm tra tồn kho
SELECT ProductID, ProductName, StockQuantity, StockStatus
FROM Product;
GO