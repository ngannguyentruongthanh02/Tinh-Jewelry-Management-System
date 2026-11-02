
-- =====================================================
-- DATABASE: TinhJewelryDB
-- PROJECT: TINH JEWELRY E-COMMERCE
-- TOTAL: 15 TABLES
-- =====================================================

USE TinhJewelryDB;
GO

-- =====================================================
-- 1. CUSTOMER
-- =====================================================

CREATE TABLE Customer (
    CustomerID INT IDENTITY(1,1) PRIMARY KEY,
    FullName VARCHAR(100),
    Phone VARCHAR(15),
    Email VARCHAR(100) NOT NULL UNIQUE,
    Address VARCHAR(255),
    Password VARCHAR(255) NOT NULL,
    CreatedAt DATETIME
);
GO

-- =====================================================
-- 2. ADMIN
-- =====================================================

CREATE TABLE Admin (
    AdminID INT IDENTITY(1,1) PRIMARY KEY,
    FullName VARCHAR(100),
    Username VARCHAR(50),
    Password VARCHAR(255),
    Email VARCHAR(100),
    Role VARCHAR(30)
);
GO

-- =====================================================
-- 3. CATEGORY
-- =====================================================

CREATE TABLE Category (
    CategoryID INT IDENTITY(1,1) PRIMARY KEY,
    CategoryName VARCHAR(100),
    Description VARCHAR(MAX)
);
GO

-- =====================================================
-- 4. PRODUCT
-- =====================================================

CREATE TABLE Product (
    ProductID INT IDENTITY(1,1) PRIMARY KEY,
    ProductCode VARCHAR(30) UNIQUE,
    ProductName VARCHAR(150),
    Description VARCHAR(MAX),
    Price DECIMAL(12,0),
    Material VARCHAR(100),
    Size VARCHAR(50),
    CareInstructions VARCHAR(MAX),
    Style VARCHAR(50),
    StockQuantity INT,
    StockStatus VARCHAR(20),
    CategoryID INT NOT NULL,

    CONSTRAINT FK_Product_Category
        FOREIGN KEY (CategoryID)
        REFERENCES Category(CategoryID),

    CONSTRAINT CK_Product_Price
        CHECK (Price > 0),

    CONSTRAINT CK_Product_StockQuantity
        CHECK (StockQuantity >= 0)
);
GO

-- =====================================================
-- 5. PRODUCT_IMAGE
-- =====================================================

CREATE TABLE Product_Image (
    ImageID INT IDENTITY(1,1) PRIMARY KEY,
    ProductID INT NOT NULL,
    ImageURL VARCHAR(255),
    IsPrimary BIT,

    CONSTRAINT FK_ProductImage_Product
        FOREIGN KEY (ProductID)
        REFERENCES Product(ProductID)
);
GO

-- =====================================================
-- 6. CART
-- =====================================================

CREATE TABLE Cart (
    CartID INT IDENTITY(1,1) PRIMARY KEY,
    CustomerID INT NOT NULL,
    CreatedAt DATETIME,

    CONSTRAINT FK_Cart_Customer
        FOREIGN KEY (CustomerID)
        REFERENCES Customer(CustomerID)
);
GO

-- =====================================================
-- 7. CART_ITEM
-- =====================================================

CREATE TABLE Cart_Item (
    CartItemID INT IDENTITY(1,1) PRIMARY KEY,
    CartID INT NOT NULL,
    ProductID INT NOT NULL,
    Quantity INT,
    UnitPrice DECIMAL(12,0),
    LineTotal DECIMAL(12,0),

    CONSTRAINT FK_CartItem_Cart
        FOREIGN KEY (CartID)
        REFERENCES Cart(CartID),

    CONSTRAINT FK_CartItem_Product
        FOREIGN KEY (ProductID)
        REFERENCES Product(ProductID),

    CONSTRAINT CK_CartItem_Quantity
        CHECK (Quantity > 0)
);
GO

-- =====================================================
-- 8. ORDER
-- =====================================================

CREATE TABLE [Order] (
    OrderID INT IDENTITY(1,1) PRIMARY KEY,
    OrderCode VARCHAR(20) UNIQUE,
    CustomerID INT NOT NULL,
    AdminID INT,
    ReceiverName VARCHAR(100),
    ReceiverPhone VARCHAR(15),
    ShippingAddress VARCHAR(255),
    SubTotal DECIMAL(12,0),
    ShippingFee DECIMAL(12,0),
    TotalAmount DECIMAL(12,0),
    OrderStatus VARCHAR(20),
    CancelReason VARCHAR(255),
    CreatedAt DATETIME,
    UpdatedAt DATETIME,

    CONSTRAINT FK_Order_Customer
        FOREIGN KEY (CustomerID)
        REFERENCES Customer(CustomerID),

    CONSTRAINT FK_Order_Admin
        FOREIGN KEY (AdminID)
        REFERENCES Admin(AdminID)
);
GO

-- =====================================================
-- 9. ORDERITEM
-- =====================================================

CREATE TABLE OrderItem (
    OrderItemID INT IDENTITY(1,1) PRIMARY KEY,
    OrderID INT NOT NULL,
    ProductID INT NOT NULL,
    Quantity INT,
    UnitPrice DECIMAL(12,0),
    LineTotal DECIMAL(12,0),

    CONSTRAINT FK_OrderItem_Order
        FOREIGN KEY (OrderID)
        REFERENCES [Order](OrderID),

    CONSTRAINT FK_OrderItem_Product
        FOREIGN KEY (ProductID)
        REFERENCES Product(ProductID),

    CONSTRAINT CK_OrderItem_Quantity
        CHECK (Quantity > 0),

    CONSTRAINT CK_OrderItem_UnitPrice
        CHECK (UnitPrice > 0)
);
GO

-- =====================================================
-- 10. PAYMENT
-- =====================================================

CREATE TABLE Payment (
    PaymentID INT IDENTITY(1,1) PRIMARY KEY,
    OrderID INT NOT NULL,
    ConfirmedBy INT,
    PaymentMethod VARCHAR(20),
    Amount DECIMAL(12,0),
    PaymentStatus VARCHAR(20),
    TransactionInfo VARCHAR(255),
    ConfirmedAt DATETIME,

    CONSTRAINT FK_Payment_Order
        FOREIGN KEY (OrderID)
        REFERENCES [Order](OrderID),

    CONSTRAINT FK_Payment_Admin
        FOREIGN KEY (ConfirmedBy)
        REFERENCES Admin(AdminID)
);
GO

-- =====================================================
-- 11. SHIPMENT
-- =====================================================

CREATE TABLE Shipment (
    ShipmentID INT IDENTITY(1,1) PRIMARY KEY,
    OrderID INT NOT NULL,
    UpdatedBy INT NOT NULL,
    CarrierName VARCHAR(100),
    TrackingCode VARCHAR(50),
    HandoverTime DATETIME,
    DeliveryStatus VARCHAR(20),
    DeliveredAt DATETIME,
    Note VARCHAR(255),

    CONSTRAINT FK_Shipment_Order
        FOREIGN KEY (OrderID)
        REFERENCES [Order](OrderID),

    CONSTRAINT FK_Shipment_Admin
        FOREIGN KEY (UpdatedBy)
        REFERENCES Admin(AdminID)
);
GO

-- =====================================================
-- 12. RETURNREQUEST
-- =====================================================

CREATE TABLE ReturnRequest (
    RequestID INT IDENTITY(1,1) PRIMARY KEY,
    OrderID INT NOT NULL,
    CustomerID INT NOT NULL,
    HandledBy INT NOT NULL,
    RequestType VARCHAR(20),
    Reason VARCHAR(255),
    ProductConditionDescription VARCHAR(MAX),
    EvidenceImage VARCHAR(255),
    RequestStatus VARCHAR(20),
    RejectReason VARCHAR(255),
    Resolution VARCHAR(20),
    InspectionResult VARCHAR(MAX),
    ReceivedAt DATETIME,
    CreatedAt DATETIME,

    CONSTRAINT FK_ReturnRequest_Order
        FOREIGN KEY (OrderID)
        REFERENCES [Order](OrderID),

    CONSTRAINT FK_ReturnRequest_Customer
        FOREIGN KEY (CustomerID)
        REFERENCES Customer(CustomerID),

    CONSTRAINT FK_ReturnRequest_Admin
        FOREIGN KEY (HandledBy)
        REFERENCES Admin(AdminID)
);
GO

-- =====================================================
-- 13. RETURNITEM
-- =====================================================

CREATE TABLE ReturnItem (
    ReturnItemID INT IDENTITY(1,1) PRIMARY KEY,
    RequestID INT NOT NULL,
    OrderItemID INT NOT NULL,
    Quantity INT,
    ItemCondition VARCHAR(20),

    CONSTRAINT FK_ReturnItem_ReturnRequest
        FOREIGN KEY (RequestID)
        REFERENCES ReturnRequest(RequestID),

    CONSTRAINT FK_ReturnItem_OrderItem
        FOREIGN KEY (OrderItemID)
        REFERENCES OrderItem(OrderItemID)
);
GO

-- =====================================================
-- 14. REFUND
-- =====================================================

CREATE TABLE Refund (
    RefundID INT IDENTITY(1,1) PRIMARY KEY,
    RequestID INT,
    OrderID INT NOT NULL,
    PaymentID INT NOT NULL,
    UpdatedBy INT NOT NULL,
    RefundAmount DECIMAL(12,0),
    RefundMethod VARCHAR(100),
    RefundStatus VARCHAR(100),
    ConfirmedAt DATETIME,

    CONSTRAINT FK_Refund_ReturnRequest
        FOREIGN KEY (RequestID)
        REFERENCES ReturnRequest(RequestID),

    CONSTRAINT FK_Refund_Order
        FOREIGN KEY (OrderID)
        REFERENCES [Order](OrderID),

    CONSTRAINT FK_Refund_Payment
        FOREIGN KEY (PaymentID)
        REFERENCES Payment(PaymentID),

    CONSTRAINT FK_Refund_Admin
        FOREIGN KEY (UpdatedBy)
        REFERENCES Admin(AdminID)
);
GO

-- =====================================================
-- 15. INVENTORYLOG
-- =====================================================

CREATE TABLE InventoryLog (
    LogID INT IDENTITY(1,1) PRIMARY KEY,
    ProductID INT NOT NULL,
    OrderID INT,
    RequestID INT,
    AdminID INT NOT NULL,
    ChangeQuantity INT,
    Reason VARCHAR(220),
    CreatedAt DATETIME,

    CONSTRAINT FK_InventoryLog_Product
        FOREIGN KEY (ProductID)
        REFERENCES Product(ProductID),

    CONSTRAINT FK_InventoryLog_Order
        FOREIGN KEY (OrderID)
        REFERENCES [Order](OrderID),

    CONSTRAINT FK_InventoryLog_ReturnRequest
        FOREIGN KEY (RequestID)
        REFERENCES ReturnRequest(RequestID),

    CONSTRAINT FK_InventoryLog_Admin
        FOREIGN KEY (AdminID)
        REFERENCES Admin(AdminID)
);
GO
 


 -- Test===================
 
USE TinhJewelryDB;
GO

-- Kiểm tra danh sách 15 bảng
SELECT
    ROW_NUMBER() OVER (ORDER BY TABLE_NAME) AS STT,
    TABLE_NAME AS TableName
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;
GO

-- Kiểm tra tổng số bảng
SELECT COUNT(*) AS TotalTables
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE';
GO

-- Kiểm tra toàn bộ khóa ngoại
SELECT
    OBJECT_NAME(parent_object_id) AS TableName,
    name AS ForeignKeyName,
    OBJECT_NAME(referenced_object_id) AS ReferencedTable
FROM sys.foreign_keys
ORDER BY TableName;
GO
