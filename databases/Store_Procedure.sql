
USE TinhJewelryDB;
GO

/* =====================================================
   PHAN 1: XOA STORE PROCEDURE CU NEU DA TON TAI
===================================================== */

DROP PROCEDURE IF EXISTS sp_RegisterCustomer;
DROP PROCEDURE IF EXISTS sp_GetAllProducts;
DROP PROCEDURE IF EXISTS sp_SearchProduct;
DROP PROCEDURE IF EXISTS sp_AddToCart;
DROP PROCEDURE IF EXISTS sp_CreateOrder;
DROP PROCEDURE IF EXISTS sp_ConfirmPayment;
DROP PROCEDURE IF EXISTS sp_CreateReturnRequest;
GO


/* =====================================================
   1. DANG KY KHACH HANG
   Bang: Customer
===================================================== */

CREATE PROCEDURE sp_RegisterCustomer
    @FullName NVARCHAR(100),
    @Phone VARCHAR(15),
    @Email VARCHAR(100),
    @Address NVARCHAR(255),
    @Password VARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT 1
        FROM Customer
        WHERE Email = @Email
    )
    BEGIN
        RAISERROR(N'Email đã tồn tại!', 16, 1);
        RETURN;
    END;

    INSERT INTO Customer
        (FullName, Phone, Email, Address, Password, CreatedAt)
    VALUES
        (@FullName, @Phone, @Email, @Address, @Password, GETDATE());

    SELECT
        SCOPE_IDENTITY() AS CustomerID,
        N'Đăng ký thành công!' AS Message;
END;
GO


/* =====================================================
   2. LAY DANH SACH SAN PHAM
   Bang: Product, Category, Product_Image
===================================================== */

CREATE PROCEDURE sp_GetAllProducts
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        P.ProductID,
        P.ProductCode,
        P.ProductName,
        P.Description,
        P.Price,
        P.Material,
        P.Size,
        P.CareInstructions,
        P.Style,
        P.StockQuantity,
        P.StockStatus,
        C.CategoryName,
        PI.ImageURL
    FROM Product AS P
    LEFT JOIN Category AS C
        ON P.CategoryID = C.CategoryID
    OUTER APPLY
    (
        SELECT TOP (1)
            ImageURL
        FROM Product_Image
        WHERE ProductID = P.ProductID
        ORDER BY IsPrimary DESC, ImageID ASC
    ) AS PI
    ORDER BY P.ProductID;
END;
GO


/* =====================================================
   3. TIM KIEM SAN PHAM
   Bang: Product, Category
===================================================== */

CREATE PROCEDURE sp_SearchProduct
    @Keyword NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

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
        C.CategoryName
    FROM Product AS P
    LEFT JOIN Category AS C
        ON P.CategoryID = C.CategoryID
    WHERE
        P.ProductName LIKE N'%' + @Keyword + N'%'
        OR P.ProductCode LIKE '%' + @Keyword + '%'
        OR C.CategoryName LIKE N'%' + @Keyword + N'%'
    ORDER BY P.ProductID;
END;
GO


/* =====================================================
   4. THEM SAN PHAM VAO GIO HANG
   Bang: Cart, Cart_Item, Product
===================================================== */

CREATE PROCEDURE sp_AddToCart
    @CustomerID INT,
    @ProductID INT,
    @Quantity INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @CartID INT;
    DECLARE @Price DECIMAL(12,0);
    DECLARE @Stock INT;
    DECLARE @CurrentQuantity INT;

    IF @Quantity <= 0
    BEGIN
        RAISERROR(N'Số lượng phải lớn hơn 0!', 16, 1);
        RETURN;
    END;

    IF NOT EXISTS (
        SELECT 1
        FROM Customer
        WHERE CustomerID = @CustomerID
    )
    BEGIN
        RAISERROR(N'Khách hàng không tồn tại!', 16, 1);
        RETURN;
    END;

    SELECT
        @Price = Price,
        @Stock = StockQuantity
    FROM Product
    WHERE ProductID = @ProductID;

    IF @Price IS NULL
    BEGIN
        RAISERROR(N'Sản phẩm không tồn tại!', 16, 1);
        RETURN;
    END;

    SELECT @CartID = CartID
    FROM Cart
    WHERE CustomerID = @CustomerID;

    IF @CartID IS NULL
    BEGIN
        INSERT INTO Cart (CustomerID, CreatedAt)
        VALUES (@CustomerID, GETDATE());

        SET @CartID = SCOPE_IDENTITY();
    END;

    SELECT @CurrentQuantity = Quantity
    FROM Cart_Item
    WHERE CartID = @CartID
      AND ProductID = @ProductID;

    IF ISNULL(@CurrentQuantity, 0) + @Quantity > @Stock
    BEGIN
        RAISERROR(N'Số lượng sản phẩm trong kho không đủ!', 16, 1);
        RETURN;
    END;

    IF EXISTS (
        SELECT 1
        FROM Cart_Item
        WHERE CartID = @CartID
          AND ProductID = @ProductID
    )
    BEGIN
        UPDATE Cart_Item
        SET
            Quantity = Quantity + @Quantity,
            UnitPrice = @Price
        WHERE CartID = @CartID
          AND ProductID = @ProductID;
    END
    ELSE
    BEGIN
        INSERT INTO Cart_Item
            (CartID, ProductID, Quantity, UnitPrice)
        VALUES
            (@CartID, @ProductID, @Quantity, @Price);
    END;

    SELECT N'Thêm sản phẩm vào giỏ hàng thành công!' AS Message;
END;
GO


/* =====================================================
   5. TAO DON HANG
   Bang: Cart, Cart_Item, Order, OrderItem,
         Product, InventoryLog
===================================================== */

CREATE PROCEDURE sp_CreateOrder
    @CustomerID INT,
    @ReceiverName NVARCHAR(100),
    @ReceiverPhone VARCHAR(15),
    @ShippingAddress NVARCHAR(255),
    @ShippingFee DECIMAL(12,0),
    @AdminID INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @CartID INT;
    DECLARE @OrderID INT;
    DECLARE @SubTotal DECIMAL(12,0);
    DECLARE @TotalAmount DECIMAL(12,0);
    DECLARE @OrderCode VARCHAR(30);

    BEGIN TRY
        BEGIN TRANSACTION;

        SELECT @CartID = CartID
        FROM Cart
        WHERE CustomerID = @CustomerID;

        IF @CartID IS NULL
            THROW 50001, N'Khách hàng chưa có giỏ hàng!', 1;

        IF NOT EXISTS (
            SELECT 1
            FROM Cart_Item
            WHERE CartID = @CartID
        )
            THROW 50002, N'Giỏ hàng đang trống!', 1;

        IF NOT EXISTS (
            SELECT 1
            FROM Admin
            WHERE AdminID = @AdminID
        )
            THROW 50003, N'Admin không tồn tại!', 1;

        IF EXISTS (
            SELECT 1
            FROM Cart_Item CI
            INNER JOIN Product P
                ON CI.ProductID = P.ProductID
            WHERE CI.CartID = @CartID
              AND CI.Quantity > P.StockQuantity
        )
            THROW 50004, N'Số lượng sản phẩm trong kho không đủ!', 1;

        SELECT @SubTotal = SUM(Quantity * UnitPrice)
        FROM Cart_Item
        WHERE CartID = @CartID;

        SET @TotalAmount = @SubTotal + ISNULL(@ShippingFee, 0);

        SET @OrderCode =
            'ORD' + CONVERT(VARCHAR(20),
                DATEDIFF_BIG(MILLISECOND, '20000101', GETDATE()));

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
            CreatedAt,
            UpdatedAt
        )
        VALUES
        (
            @OrderCode,
            @CustomerID,
            @AdminID,
            @ReceiverName,
            @ReceiverPhone,
            @ShippingAddress,
            @SubTotal,
            ISNULL(@ShippingFee, 0),
            @TotalAmount,
            N'Pending',
            GETDATE(),
            GETDATE()
        );

        SET @OrderID = SCOPE_IDENTITY();

        INSERT INTO OrderItem
            (OrderID, ProductID, Quantity, UnitPrice)
        SELECT
            @OrderID,
            ProductID,
            Quantity,
            UnitPrice
        FROM Cart_Item
        WHERE CartID = @CartID;

        /* Cap nhat ton kho */

        UPDATE P
        SET
            P.StockQuantity = P.StockQuantity - CI.Quantity,
            P.StockStatus =
                CASE
                    WHEN P.StockQuantity - CI.Quantity <= 0
                        THEN N'Hết hàng'
                    ELSE N'Còn hàng'
                END
        FROM Product P
        INNER JOIN Cart_Item CI
            ON P.ProductID = CI.ProductID
        WHERE CI.CartID = @CartID;

        /* Ghi lich su kho */

        INSERT INTO InventoryLog
        (
            ProductID,
            OrderID,
            AdminID,
            ChangeQuantity,
            Reason,
            CreatedAt
        )
        SELECT
            ProductID,
            @OrderID,
            @AdminID,
            -Quantity,
            N'Xuất kho do tạo đơn hàng',
            GETDATE()
        FROM Cart_Item
        WHERE CartID = @CartID;

        /* Xoa san pham khoi gio hang */

        DELETE FROM Cart_Item
        WHERE CartID = @CartID;

        COMMIT TRANSACTION;

        SELECT
            @OrderID AS OrderID,
            @OrderCode AS OrderCode,
            @SubTotal AS SubTotal,
            @ShippingFee AS ShippingFee,
            @TotalAmount AS TotalAmount,
            N'Tạo đơn hàng thành công!' AS Message;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;
    END CATCH;
END;
GO


/* =====================================================
   6. XAC NHAN THANH TOAN
   Bang: Payment, Order
===================================================== */

CREATE PROCEDURE sp_ConfirmPayment
    @OrderID INT,
    @ConfirmedBy INT = NULL,
    @PaymentMethod NVARCHAR(50),
    @Amount DECIMAL(12,0),
    @TransactionInfo NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (
            SELECT 1
            FROM [Order]
            WHERE OrderID = @OrderID
        )
            THROW 50005, N'Đơn hàng không tồn tại!', 1;

        IF @Amount <= 0
            THROW 50006, N'Số tiền thanh toán không hợp lệ!', 1;

        IF EXISTS (
            SELECT 1
            FROM Payment
            WHERE OrderID = @OrderID
              AND PaymentStatus = N'Paid'
        )
            THROW 50007, N'Đơn hàng đã được thanh toán!', 1;

        IF @Amount <> (
            SELECT TotalAmount
            FROM [Order]
            WHERE OrderID = @OrderID
        )
            THROW 50008, N'Số tiền thanh toán không khớp với đơn hàng!', 1;

        IF EXISTS (
            SELECT 1
            FROM Payment
            WHERE OrderID = @OrderID
        )
        BEGIN
            UPDATE Payment
            SET
                ConfirmedBy = @ConfirmedBy,
                PaymentMethod = @PaymentMethod,
                Amount = @Amount,
                PaymentStatus = N'Paid',
                TransactionInfo = @TransactionInfo,
                ConfirmedAt = GETDATE()
            WHERE OrderID = @OrderID;
        END
        ELSE
        BEGIN
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
            VALUES
            (
                @OrderID,
                @ConfirmedBy,
                @PaymentMethod,
                @Amount,
                N'Paid',
                @TransactionInfo,
                GETDATE()
            );
        END;

        UPDATE [Order]
        SET
            OrderStatus = N'Paid',
            UpdatedAt = GETDATE()
        WHERE OrderID = @OrderID;

        COMMIT TRANSACTION;

        SELECT N'Xác nhận thanh toán thành công!' AS Message;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;
    END CATCH;
END;
GO


/* =====================================================
   7. TAO YEU CAU DOI / TRA HANG
   Bang: ReturnRequest, ReturnItem, Order, OrderItem
===================================================== */

CREATE PROCEDURE sp_CreateReturnRequest
    @OrderID INT,
    @CustomerID INT,
    @RequestType NVARCHAR(50),
    @Reason NVARCHAR(500),
    @ProductConditionDescription NVARCHAR(500),
    @EvidenceImage NVARCHAR(500) = NULL,
    @OrderItemID INT,
    @Quantity INT,
    @ItemCondition NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @RequestID INT;
    DECLARE @OrderedQuantity INT;
    DECLARE @ReturnedQuantity INT;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (
            SELECT 1
            FROM [Order]
            WHERE OrderID = @OrderID
              AND CustomerID = @CustomerID
        )
            THROW 50009, N'Đơn hàng không tồn tại hoặc không thuộc khách hàng này!', 1;

        IF @Quantity <= 0
            THROW 50010, N'Số lượng yêu cầu phải lớn hơn 0!', 1;

        SELECT @OrderedQuantity = Quantity
        FROM OrderItem
        WHERE OrderItemID = @OrderItemID
          AND OrderID = @OrderID;

        IF @OrderedQuantity IS NULL
            THROW 50011, N'Sản phẩm không thuộc đơn hàng này!', 1;

        SELECT @ReturnedQuantity = ISNULL(SUM(RI.Quantity), 0)
        FROM ReturnItem RI
        INNER JOIN ReturnRequest RR
            ON RI.RequestID = RR.RequestID
        WHERE RI.OrderItemID = @OrderItemID
          AND RR.RequestStatus <> N'Rejected';

        IF @ReturnedQuantity + @Quantity > @OrderedQuantity
            THROW 50012, N'Số lượng yêu cầu vượt quá số lượng đã mua!', 1;

        INSERT INTO ReturnRequest
        (
            OrderID,
            CustomerID,
            RequestType,
            Reason,
            ProductConditionDescription,
            EvidenceImage,
            RequestStatus,
            CreatedAt
        )
        VALUES
        (
            @OrderID,
            @CustomerID,
            @RequestType,
            @Reason,
            @ProductConditionDescription,
            @EvidenceImage,
            N'Pending',
            GETDATE()
        );

        SET @RequestID = SCOPE_IDENTITY();

        INSERT INTO ReturnItem
        (
            RequestID,
            OrderItemID,
            Quantity,
            ItemCondition
        )
        VALUES
        (
            @RequestID,
            @OrderItemID,
            @Quantity,
            @ItemCondition
        );

        COMMIT TRANSACTION;

        SELECT
            @RequestID AS RequestID,
            N'Tạo yêu cầu đổi/trả hàng thành công!' AS Message;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;
    END CATCH;
END;
GO


/* =====================================================
   PHAN 2: KIEM TRA 7 STORE PROCEDURE
===================================================== */

SELECT
    name AS ProcedureName,
    create_date AS CreatedDate,
    modify_date AS ModifiedDate
FROM sys.procedures
WHERE name IN
(
    'sp_RegisterCustomer',
    'sp_GetAllProducts',
    'sp_SearchProduct',
    'sp_AddToCart',
    'sp_CreateOrder',
    'sp_ConfirmPayment',
    'sp_CreateReturnRequest'
)
ORDER BY name;
GO


/* =====================================================
   PHAN 3: TEST LAY SAN PHAM
===================================================== */

EXEC sp_GetAllProducts;
GO

EXEC sp_SearchProduct
    @Keyword = N'Vòng tay';
GO

