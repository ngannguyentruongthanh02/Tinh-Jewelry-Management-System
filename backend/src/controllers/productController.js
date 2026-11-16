const { sql, connectDB } = require('../config/db');

// Dữ liệu sản phẩm chuẩn theo Bảng 3.2, 3.3, 3.4 trong đồ án
const DEFAULT_PRODUCTS = [
  {
    ProductID: 1,
    ProductCode: "A01",
    ProductName: "Vòng tay bạc mảnh TĨNH",
    Description: "Thiết kế dạng dây mảnh, ít chi tiết trang trí, tạo vẻ thanh lịch và dễ phối cùng đồng hồ hoặc phụ kiện khác.",
    Price: 250000,
    Material: "Bạc 925",
    Size: "Free size",
    CareInstructions: "Bảo quản nơi khô ráo, hạn chế tiếp xúc với hóa chất và nước hoa.",
    Style: "Tối giản",
    StockQuantity: 20,
    StockStatus: "Còn hàng",
    CategoryID: 1,
    CategoryName: "Vòng tay",
    ImageURL: "images/bracelet-1.svg"
  },
  {
    ProductID: 2,
    ProductCode: "A02",
    ProductName: "Vòng tay hình học TĨNH",
    Description: "Vòng tay có một chi tiết hình học nhỏ làm điểm nhấn, giữ tổng thể gọn và cân đối.",
    Price: 300000,
    Material: "Bạc 925",
    Size: "Free size",
    CareInstructions: "Lau nhẹ bằng khăn mềm và bảo quản trong hộp trang sức.",
    Style: "Hình học tối giản",
    StockQuantity: 15,
    StockStatus: "Còn hàng",
    CategoryID: 1,
    CategoryName: "Vòng tay",
    ImageURL: "images/bracelet-2.svg"
  },
  {
    ProductID: 3,
    ProductCode: "A03",
    ProductName: "Vòng tay chuỗi thanh lịch TĨNH",
    Description: "Kết cấu chuỗi với các mắt nối nhỏ, tạo điểm nhấn từ cấu trúc sản phẩm thay vì họa tiết cầu kỳ.",
    Price: 350000,
    Material: "Bạc 925",
    Size: "Free size",
    CareInstructions: "Tránh va đập mạnh và bảo quản riêng khi không sử dụng.",
    Style: "Thanh lịch",
    StockQuantity: 15,
    StockStatus: "Còn hàng",
    CategoryID: 1,
    CategoryName: "Vòng tay",
    ImageURL: "images/bracelet-1.svg"
  },
  {
    ProductID: 4,
    ProductCode: "N01",
    ProductName: "Dây chuyền bạc mảnh TĨNH",
    Description: "Dây chuyền không có mặt trang trí, tập trung vào sự đơn giản của kết cấu dây.",
    Price: 250000,
    Material: "Bạc 925",
    Size: "45cm",
    CareInstructions: "Bảo quản nơi khô ráo, tránh tiếp xúc trực tiếp với hóa chất.",
    Style: "Tối giản",
    StockQuantity: 20,
    StockStatus: "Còn hàng",
    CategoryID: 2,
    CategoryName: "Dây chuyền",
    ImageURL: "images/necklace-1.svg"
  },
  {
    ProductID: 5,
    ProductCode: "N02",
    ProductName: "Dây chuyền mặt hình học TĨNH",
    Description: "Dây chuyền có mặt hình tròn hoặc hình học nhỏ, tạo điểm nhấn vừa phải.",
    Price: 300000,
    Material: "Bạc 925",
    Size: "45cm",
    CareInstructions: "Lau bằng khăn mềm sau khi sử dụng và bảo quản trong hộp kín.",
    Style: "Hình học tối giản",
    StockQuantity: 15,
    StockStatus: "Còn hàng",
    CategoryID: 2,
    CategoryName: "Dây chuyền",
    ImageURL: "images/necklace-2.svg"
  },
  {
    ProductID: 6,
    ProductCode: "N03",
    ProductName: "Dây chuyền mặt thanh TĨNH",
    Description: "Dây chuyền có mặt dạng thanh dài, thiết kế tinh gọn và dễ phối với trang phục.",
    Price: 350000,
    Material: "Bạc 925",
    Size: "50cm",
    CareInstructions: "Bảo quản nơi khô ráo, tránh cọ xát với các kim loại cứng.",
    Style: "Thanh lịch",
    StockQuantity: 15,
    StockStatus: "Còn hàng",
    CategoryID: 2,
    CategoryName: "Dây chuyền",
    ImageURL: "images/necklace-1.svg"
  },
  {
    ProductID: 7,
    ProductCode: "DIY01",
    ProductName: "Bộ tự phối vòng tay TĨNH",
    Description: "Cho phép khách hàng tự phối hợp thành phần dây, hạt, khóa nối và hoàn thiện vòng tay.",
    Price: 390000,
    Material: "Bạc 925 và phụ kiện",
    Size: "Tự điều chỉnh",
    CareInstructions: "Bảo quản các thành phần trong bao bì phù hợp theo hướng dẫn.",
    Style: "DIY sáng tạo",
    StockQuantity: 30,
    StockStatus: "Còn hàng",
    CategoryID: 3,
    CategoryName: "Bộ sản phẩm DIY",
    ImageURL: "images/bracelet-1.svg"
  },
  {
    ProductID: 8,
    ProductCode: "DIY02",
    ProductName: "Bộ tự thiết kế dây chuyền TĨNH",
    Description: "Tạo cơ hội cho khách hàng lựa chọn cách kết hợp các thành phần dây nền, mặt trang trí trong phạm vi bộ sản phẩm.",
    Price: 420000,
    Material: "Bạc 925 và phụ kiện",
    Size: "Tự điều chỉnh",
    CareInstructions: "Bảo quản các thành phần trong bao bì phù hợp.",
    Style: "Cá nhân hóa",
    StockQuantity: 25,
    StockStatus: "Còn hàng",
    CategoryID: 3,
    CategoryName: "Bộ sản phẩm DIY",
    ImageURL: "images/necklace-2.svg"
  }
];

let localProducts = [...DEFAULT_PRODUCTS];

/**
 * 1. API Lấy danh sách sản phẩm
 * GET /api/products
 */
const getAllProducts = async (req, res) => {
  try {
    const pool = await connectDB();
    const { categoryId, keyword, minPrice, maxPrice } = req.query;

    if (!categoryId && !keyword && !minPrice && !maxPrice) {
      const result = await pool.request().execute('sp_GetAllProducts');
      return res.status(200).json({
        success: true,
        source: 'SQL Server',
        total: result.recordset.length,
        data: result.recordset
      });
    }

    let query = `
      SELECT 
        P.ProductID, P.ProductCode, P.ProductName, P.Description,
        P.Price, P.Material, P.Size, P.CareInstructions, P.Style,
        P.StockQuantity, P.StockStatus, C.CategoryID, C.CategoryName, PI.ImageURL
      FROM Product AS P
      LEFT JOIN Category AS C ON P.CategoryID = C.CategoryID
      OUTER APPLY (
        SELECT TOP (1) ImageURL FROM Product_Image WHERE ProductID = P.ProductID ORDER BY IsPrimary DESC, ImageID ASC
      ) AS PI
      WHERE 1=1
    `;

    const request = pool.request();
    if (categoryId) {
      query += ` AND P.CategoryID = @CategoryID`;
      request.input('CategoryID', sql.Int, parseInt(categoryId, 10));
    }
    if (keyword) {
      query += ` AND (P.ProductName LIKE @Keyword OR P.ProductCode LIKE @Keyword)`;
      request.input('Keyword', sql.NVarChar, `%${keyword}%`);
    }
    if (minPrice) {
      query += ` AND P.Price >= @MinPrice`;
      request.input('MinPrice', sql.Decimal(12, 0), parseFloat(minPrice));
    }
    if (maxPrice) {
      query += ` AND P.Price <= @MaxPrice`;
      request.input('MaxPrice', sql.Decimal(12, 0), parseFloat(maxPrice));
    }
    query += ` ORDER BY P.ProductID ASC`;

    const result = await request.query(query);
    return res.status(200).json({
      success: true,
      source: 'SQL Server',
      total: result.recordset.length,
      data: result.recordset
    });
  } catch (error) {
    // Nếu kết nối SQL Server gặp sự cố (ví dụ TCP/IP chưa bật), fallback về dữ liệu mẫu chuẩn của đề tài
    const { categoryId, keyword } = req.query;
    let filtered = [...localProducts];
    if (categoryId) {
      filtered = filtered.filter(p => p.CategoryID === parseInt(categoryId, 10));
    }
    if (keyword) {
      const kw = keyword.toLowerCase();
      filtered = filtered.filter(p => p.ProductName.toLowerCase().includes(kw) || p.ProductCode.toLowerCase().includes(kw));
    }
    return res.status(200).json({
      success: true,
      source: 'Mock Database (Ready for SQL Server)',
      total: filtered.length,
      data: filtered
    });
  }
};

/**
 * 2. API Lấy chi tiết sản phẩm theo ID
 * GET /api/products/:id
 */
const getProductById = async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await connectDB();
    const productResult = await pool.request()
      .input('ProductID', sql.Int, parseInt(id, 10))
      .query(`
        SELECT P.*, C.CategoryName
        FROM Product AS P
        LEFT JOIN Category AS C ON P.CategoryID = C.CategoryID
        WHERE P.ProductID = @ProductID
      `);

    if (productResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: `Không tìm thấy sản phẩm ID ${id}` });
    }

    const product = productResult.recordset[0];
    const imagesResult = await pool.request()
      .input('ProductID', sql.Int, parseInt(id, 10))
      .query(`SELECT ImageID, ImageURL, IsPrimary FROM Product_Image WHERE ProductID = @ProductID ORDER BY IsPrimary DESC`);
    product.images = imagesResult.recordset;

    return res.status(200).json({ success: true, data: product });
  } catch (error) {
    const product = localProducts.find(p => p.ProductID === parseInt(id, 10));
    if (!product) {
      return res.status(404).json({ success: false, message: `Không tìm thấy sản phẩm ID ${id}` });
    }
    return res.status(200).json({ success: true, data: product });
  }
};

/**
 * 3. API Tìm kiếm sản phẩm
 * GET /api/products/search?keyword=...
 */
const searchProducts = async (req, res) => {
  const { keyword } = req.query;
  if (!keyword) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp từ khóa tìm kiếm' });
  }
  try {
    const pool = await connectDB();
    const result = await pool.request()
      .input('Keyword', sql.NVarChar(100), keyword)
      .execute('sp_SearchProduct');

    return res.status(200).json({ success: true, total: result.recordset.length, data: result.recordset });
  } catch (error) {
    const kw = keyword.toLowerCase();
    const found = localProducts.filter(p => p.ProductName.toLowerCase().includes(kw) || p.ProductCode.toLowerCase().includes(kw));
    return res.status(200).json({ success: true, total: found.length, data: found });
  }
};

/**
 * 4. API Nhập / Đăng ký sản phẩm mới (Dành cho Admin / Quản lý kho)
 * POST /api/products
 */
const registerProduct = async (req, res) => {
  const {
    productCode, productName, description, price, material = 'Bạc 925',
    size = 'Free size', careInstructions, style = 'Tối giản', stockQuantity = 0, categoryID, imageUrl
  } = req.body;

  if (!productCode || !productName || !price || !categoryID) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đủ: productCode, productName, price, categoryID' });
  }

  try {
    const pool = await connectDB();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    const insertRequest = new sql.Request(transaction);
    const insertResult = await insertRequest
      .input('ProductCode', sql.VarChar(30), productCode)
      .input('ProductName', sql.NVarChar(150), productName)
      .input('Description', sql.NVarChar(sql.MAX), description || '')
      .input('Price', sql.Decimal(12, 0), price)
      .input('Material', sql.NVarChar(100), material)
      .input('Size', sql.NVarChar(50), size)
      .input('CareInstructions', sql.NVarChar(sql.MAX), careInstructions || '')
      .input('Style', sql.NVarChar(50), style)
      .input('StockQuantity', sql.Int, stockQuantity)
      .input('StockStatus', sql.NVarChar(20), stockQuantity > 0 ? 'Còn hàng' : 'Hết hàng')
      .input('CategoryID', sql.Int, categoryID)
      .query(`
        INSERT INTO Product (ProductCode, ProductName, Description, Price, Material, Size, CareInstructions, Style, StockQuantity, StockStatus, CategoryID)
        OUTPUT INSERTED.ProductID
        VALUES (@ProductCode, @ProductName, @Description, @Price, @Material, @Size, @CareInstructions, @Style, @StockQuantity, @StockStatus, @CategoryID)
      `);

    const newProductID = insertResult.recordset[0].ProductID;
    if (imageUrl) {
      await new sql.Request(transaction)
        .input('ProductID', sql.Int, newProductID)
        .input('ImageURL', sql.VarChar(255), imageUrl)
        .input('IsPrimary', sql.Bit, 1)
        .query(`INSERT INTO Product_Image (ProductID, ImageURL, IsPrimary) VALUES (@ProductID, @ImageURL, @IsPrimary)`);
    }

    await transaction.commit();
    return res.status(201).json({
      success: true,
      message: 'Nhập / Đăng ký sản phẩm mới thành công!',
      data: { productId: newProductID, productCode, productName, price, stockQuantity, categoryID }
    });
  } catch (error) {
    // Fallback lưu local
    const newP = {
      ProductID: localProducts.length + 1,
      ProductCode: productCode,
      ProductName: productName,
      Description: description,
      Price: Number(price),
      Material: material,
      Size: size,
      StockQuantity: Number(stockQuantity),
      StockStatus: stockQuantity > 0 ? 'Còn hàng' : 'Hết hàng',
      CategoryID: Number(categoryID),
      CategoryName: categoryID === 1 ? 'Vòng tay' : categoryID === 2 ? 'Dây chuyền' : 'Bộ sản phẩm DIY',
      ImageURL: imageUrl || 'images/bracelet-1.svg'
    };
    localProducts.push(newP);
    return res.status(201).json({
      success: true,
      message: 'Nhập / Đăng ký sản phẩm mới thành công!',
      data: newP
    });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  searchProducts,
  registerProduct
};
