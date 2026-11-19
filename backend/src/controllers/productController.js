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
    let {
      productCode, productName, description, price, material = 'Bạc 925',
      size = 'Free size', careInstructions, style = 'Tối giản', stockQuantity = 0, categoryID, imageUrl
    } = req.body;

    // Hỗ trợ cả định dạng từ form admin (name, code, desc, stock, category, image...)
    productName = productName || req.body.name;
    productCode = productCode || req.body.code || ('SP' + Date.now().toString().slice(-4));
    description = description || req.body.desc || '';
    careInstructions = careInstructions || req.body.care || '';
    if (req.body.stock !== undefined && req.body.stockQuantity === undefined) {
      stockQuantity = req.body.stock;
    }
    if (!categoryID && req.body.category) {
      const c = String(req.body.category).toLowerCase();
      categoryID = (c === 'bracelet' || c.includes('vòng') || c.includes('lắc')) ? 1 :
                   (c === 'necklace' || c.includes('dây')) ? 2 :
                   (c === 'diy' || c.includes('diy')) ? 3 : 1;
    }
    categoryID = categoryID || 1;
    imageUrl = imageUrl || req.body.image;

    if (!productName || !price) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp ít nhất: productName, price' });
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

/**
 * 5. API Sửa / Cập nhật sản phẩm
 * PUT /api/products/:id
 */
const updateProduct = async (req, res) => {
  const { id } = req.params;
  const numId = parseInt(id, 10);
  let {
    productCode, productName, description, price, material,
    size, careInstructions, style, stockQuantity, categoryID, imageUrl
  } = req.body;

  productName = productName || req.body.name;
  productCode = productCode || req.body.code;
  description = description !== undefined ? description : req.body.desc;
  careInstructions = careInstructions !== undefined ? careInstructions : req.body.care;
  if (req.body.stock !== undefined && stockQuantity === undefined) {
    stockQuantity = req.body.stock;
  }
  if (!categoryID && req.body.category) {
    const c = String(req.body.category).toLowerCase();
    categoryID = (c === 'bracelet' || c.includes('vòng') || c.includes('lắc')) ? 1 :
                 (c === 'necklace' || c.includes('dây')) ? 2 :
                 (c === 'diy' || c.includes('diy')) ? 3 : 1;
  }
  imageUrl = imageUrl || req.body.image;

  try {
    const pool = await connectDB();
    const checkRes = await pool.request()
      .input('ProductID', sql.Int, numId)
      .query(`SELECT ProductID FROM Product WHERE ProductID = @ProductID`);

    if (checkRes.recordset.length === 0) {
      return res.status(404).json({ success: false, message: `Không tìm thấy sản phẩm ID ${id}` });
    }

    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    const updateReq = new sql.Request(transaction);
    updateReq.input('ProductID', sql.Int, numId);
    if (productCode !== undefined) updateReq.input('ProductCode', sql.VarChar(30), productCode);
    if (productName !== undefined) updateReq.input('ProductName', sql.NVarChar(150), productName);
    if (description !== undefined) updateReq.input('Description', sql.NVarChar(sql.MAX), description);
    if (price !== undefined) updateReq.input('Price', sql.Decimal(12, 0), price);
    if (material !== undefined) updateReq.input('Material', sql.NVarChar(100), material);
    if (size !== undefined) updateReq.input('Size', sql.NVarChar(50), size);
    if (careInstructions !== undefined) updateReq.input('CareInstructions', sql.NVarChar(sql.MAX), careInstructions);
    if (style !== undefined) updateReq.input('Style', sql.NVarChar(50), style);
    if (stockQuantity !== undefined) {
      updateReq.input('StockQuantity', sql.Int, stockQuantity);
      updateReq.input('StockStatus', sql.NVarChar(20), stockQuantity > 0 ? 'Còn hàng' : 'Hết hàng');
    }
    if (categoryID !== undefined) updateReq.input('CategoryID', sql.Int, categoryID);

    let setClauses = [];
    if (productCode !== undefined) setClauses.push('ProductCode = @ProductCode');
    if (productName !== undefined) setClauses.push('ProductName = @ProductName');
    if (description !== undefined) setClauses.push('Description = @Description');
    if (price !== undefined) setClauses.push('Price = @Price');
    if (material !== undefined) setClauses.push('Material = @Material');
    if (size !== undefined) setClauses.push('Size = @Size');
    if (careInstructions !== undefined) setClauses.push('CareInstructions = @CareInstructions');
    if (style !== undefined) setClauses.push('Style = @Style');
    if (stockQuantity !== undefined) setClauses.push('StockQuantity = @StockQuantity, StockStatus = @StockStatus');
    if (categoryID !== undefined) setClauses.push('CategoryID = @CategoryID');

    if (setClauses.length > 0) {
      await updateReq.query(`UPDATE Product SET ${setClauses.join(', ')} WHERE ProductID = @ProductID`);
    }

    if (imageUrl) {
      const imgReq = new sql.Request(transaction);
      imgReq.input('ProductID', sql.Int, numId);
      imgReq.input('ImageURL', sql.VarChar(255), imageUrl);
      const existImg = await imgReq.query(`SELECT ImageID FROM Product_Image WHERE ProductID = @ProductID AND IsPrimary = 1`);
      if (existImg.recordset.length > 0) {
        await new sql.Request(transaction)
          .input('ProductID', sql.Int, numId)
          .input('ImageURL', sql.VarChar(255), imageUrl)
          .query(`UPDATE Product_Image SET ImageURL = @ImageURL WHERE ProductID = @ProductID AND IsPrimary = 1`);
      } else {
        await new sql.Request(transaction)
          .input('ProductID', sql.Int, numId)
          .input('ImageURL', sql.VarChar(255), imageUrl)
          .query(`INSERT INTO Product_Image (ProductID, ImageURL, IsPrimary) VALUES (@ProductID, @ImageURL, 1)`);
      }
    }

    await transaction.commit();

    // Lấy lại sản phẩm mới nhất
    const updated = await pool.request().input('ProductID', sql.Int, numId).query(`
      SELECT P.*, C.CategoryName, PI.ImageURL
      FROM Product P
      LEFT JOIN Category C ON P.CategoryID = C.CategoryID
      OUTER APPLY (SELECT TOP 1 ImageURL FROM Product_Image WHERE ProductID = P.ProductID ORDER BY IsPrimary DESC) PI
      WHERE P.ProductID = @ProductID
    `);

    return res.status(200).json({
      success: true,
      message: 'Cập nhật sản phẩm thành công!',
      data: updated.recordset[0]
    });
  } catch (error) {
    const idx = localProducts.findIndex(p => p.ProductID === numId || p.id === numId);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: `Không tìm thấy sản phẩm ID ${id}` });
    }
    const current = localProducts[idx];
    const updated = {
      ...current,
      ProductName: productName || current.ProductName || current.name,
      name: productName || current.name || current.ProductName,
      ProductCode: productCode || current.ProductCode || current.code,
      Description: description !== undefined ? description : current.Description,
      Price: price !== undefined ? Number(price) : current.Price,
      price: price !== undefined ? Number(price) : current.price,
      Material: material || current.Material,
      Size: size || current.Size,
      CareInstructions: careInstructions || current.CareInstructions,
      Style: style || current.Style,
      StockQuantity: stockQuantity !== undefined ? Number(stockQuantity) : current.StockQuantity,
      stock: stockQuantity !== undefined ? Number(stockQuantity) : current.stock,
      StockStatus: (stockQuantity !== undefined ? Number(stockQuantity) : current.StockQuantity) > 0 ? 'Còn hàng' : 'Hết hàng',
      CategoryID: categoryID ? Number(categoryID) : current.CategoryID,
      CategoryName: categoryID === 1 ? 'Vòng tay' : categoryID === 2 ? 'Dây chuyền' : current.CategoryName,
      ImageURL: imageUrl || current.ImageURL || current.image,
      image: imageUrl || current.image || current.ImageURL
    };
    localProducts[idx] = updated;

    return res.status(200).json({
      success: true,
      message: 'Cập nhật sản phẩm thành công (local)!',
      data: updated
    });
  }
};

/**
 * 6. API Xóa sản phẩm
 * DELETE /api/products/:id
 */
const deleteProduct = async (req, res) => {
  const { id } = req.params;
  const numId = parseInt(id, 10);

  try {
    const pool = await connectDB();
    const checkOrder = await pool.request()
      .input('ProductID', sql.Int, numId)
      .query(`SELECT TOP 1 OrderItemID FROM OrderItem WHERE ProductID = @ProductID`);

    if (checkOrder.recordset.length > 0) {
      // Đã có đơn hàng liên quan -> chuyển sang trạng thái Ngừng kinh doanh để bảo đảm toàn vẹn dữ liệu
      await pool.request()
        .input('ProductID', sql.Int, numId)
        .query(`UPDATE Product SET StockStatus = N'Ngừng kinh doanh', StockQuantity = 0 WHERE ProductID = @ProductID`);
      return res.status(200).json({
        success: true,
        message: 'Sản phẩm đã từng có đơn hàng nên được chuyển sang trạng thái "Ngừng kinh doanh" để bảo toàn lịch sử hóa đơn!'
      });
    }

    // Chưa có đơn hàng -> xóa sạch liên kết trong CSDL
    await pool.request().input('ProductID', sql.Int, numId).query(`
      DELETE FROM Cart_Item WHERE ProductID = @ProductID;
      DELETE FROM Product_Image WHERE ProductID = @ProductID;
      DELETE FROM Product WHERE ProductID = @ProductID;
    `);

    return res.status(200).json({
      success: true,
      message: 'Xóa sản phẩm thành công!'
    });
  } catch (error) {
    const idx = localProducts.findIndex(p => p.ProductID === numId || p.id === numId);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: `Không tìm thấy sản phẩm ID ${id}` });
    }
    localProducts.splice(idx, 1);
    return res.status(200).json({
      success: true,
      message: 'Xóa sản phẩm thành công!'
    });
  }
};

/**
 * 7. API Cập nhật nhanh số lượng tồn kho
 * PATCH /api/products/:id/stock
 */
const updateProductStock = async (req, res) => {
  const { id } = req.params;
  const { stockQuantity, stock } = req.body;
  const qty = stockQuantity !== undefined ? stockQuantity : stock;
  const numId = parseInt(id, 10);

  if (qty === undefined || qty < 0) {
    return res.status(400).json({ success: false, message: 'Số lượng tồn kho không hợp lệ!' });
  }

  try {
    const pool = await connectDB();
    const status = qty > 0 ? 'Còn hàng' : 'Hết hàng';
    await pool.request()
      .input('ProductID', sql.Int, numId)
      .input('StockQuantity', sql.Int, qty)
      .input('StockStatus', sql.NVarChar(20), status)
      .query(`UPDATE Product SET StockQuantity = @StockQuantity, StockStatus = @StockStatus WHERE ProductID = @ProductID`);

    return res.status(200).json({
      success: true,
      message: 'Cập nhật tồn kho thành công!',
      data: { productId: numId, stockQuantity: qty, stockStatus: status }
    });
  } catch (error) {
    const p = localProducts.find(item => item.ProductID === numId || item.id === numId);
    if (!p) return res.status(404).json({ success: false, message: `Không tìm thấy sản phẩm ID ${id}` });
    p.StockQuantity = Number(qty);
    p.stock = Number(qty);
    p.StockStatus = qty > 0 ? 'Còn hàng' : 'Hết hàng';
    return res.status(200).json({
      success: true,
      message: 'Cập nhật tồn kho thành công!',
      data: { productId: numId, stockQuantity: qty, stockStatus: p.StockStatus }
    });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  searchProducts,
  registerProduct,
  updateProduct,
  deleteProduct,
  updateProductStock
};
