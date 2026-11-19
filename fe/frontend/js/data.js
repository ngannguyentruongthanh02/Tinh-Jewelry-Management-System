/* =====================================================================
   DỮ LIỆU SẢN PHẨM & DANH MỤC - TĨNH JEWELRY
   Chuẩn hóa theo Bảng 3.2, 3.3, 3.4 và SQL Server TinhJewelryDB
   ===================================================================== */

const CATEGORIES = {
  bracelet: 'Vòng tay',
  necklace: 'Dây chuyền',
  diy: 'Bộ sản phẩm DIY'
};

const SIZES = {
  bracelet: ['Free size', '16cm', '17cm', '18cm'],
  necklace: ['40cm', '45cm', '50cm'],
  diy: ['Tự điều chỉnh'],
  ring: ['6', '7', '8', '9', '10'],
  earring: ['Free size']
};

const DEFAULT_PRODUCTS = [
  {
    id: 1,
    code: 'A01',
    name: 'Vòng tay bạc mảnh TĨNH',
    category: 'bracelet',
    price: 250000,
    stock: 20,
    image: 'images/bracelet-1.svg',
    desc: 'Thiết kế dạng dây mảnh, ít chi tiết trang trí, tạo vẻ thanh lịch và dễ phối cùng đồng hồ hoặc phụ kiện khác.',
    material: 'Bạc 925',
    weight: 'Free size'
  },
  {
    id: 2,
    code: 'A02',
    name: 'Vòng tay hình học TĨNH',
    category: 'bracelet',
    price: 300000,
    stock: 15,
    image: 'images/bracelet-2.svg',
    desc: 'Vòng tay có một chi tiết hình học nhỏ làm điểm nhấn, giữ tổng thể gọn và cân đối.',
    material: 'Bạc 925',
    weight: 'Free size'
  },
  {
    id: 3,
    code: 'A03',
    name: 'Vòng tay chuỗi thanh lịch TĨNH',
    category: 'bracelet',
    price: 350000,
    stock: 15,
    image: 'images/bracelet-1.svg',
    desc: 'Kết cấu chuỗi với các mắt nối nhỏ, tạo điểm nhấn từ cấu trúc sản phẩm thay vì họa tiết cầu kỳ.',
    material: 'Bạc 925',
    weight: 'Free size'
  },
  {
    id: 4,
    code: 'N01',
    name: 'Dây chuyền bạc mảnh TĨNH',
    category: 'necklace',
    price: 250000,
    stock: 20,
    image: 'images/necklace-1.svg',
    desc: 'Dây chuyền không có mặt trang trí, tập trung vào sự đơn giản của kết cấu dây.',
    material: 'Bạc 925',
    weight: '45cm'
  },
  {
    id: 5,
    code: 'N02',
    name: 'Dây chuyền mặt hình học TĨNH',
    category: 'necklace',
    price: 300000,
    stock: 15,
    image: 'images/necklace-2.svg',
    desc: 'Dây chuyền có mặt hình tròn hoặc hình học nhỏ, tạo điểm nhấn vừa phải.',
    material: 'Bạc 925',
    weight: '45cm'
  },
  {
    id: 6,
    code: 'N03',
    name: 'Dây chuyền mặt thanh TĨNH',
    category: 'necklace',
    price: 350000,
    stock: 15,
    image: 'images/necklace-1.svg',
    desc: 'Dây chuyền có mặt dạng thanh dài, thiết kế tinh gọn và dễ phối với trang phục.',
    material: 'Bạc 925',
    weight: '50cm'
  },
  {
    id: 7,
    code: 'DIY01',
    name: 'Bộ tự phối vòng tay TĨNH',
    category: 'diy',
    price: 390000,
    stock: 30,
    image: 'images/bracelet-1.svg',
    desc: 'Cho phép khách hàng tự phối hợp thành phần dây, hạt, khóa nối và hoàn thiện vòng tay theo hướng dẫn.',
    material: 'Bạc 925 và phụ kiện',
    weight: 'Tự điều chỉnh'
  },
  {
    id: 8,
    code: 'DIY02',
    name: 'Bộ tự thiết kế dây chuyền TĨNH',
    category: 'diy',
    price: 420000,
    stock: 25,
    image: 'images/necklace-2.svg',
    desc: 'Tạo cơ hội cho khách hàng lựa chọn cách kết hợp các thành phần dây nền, mặt trang trí trong phạm vi bộ sản phẩm.',
    material: 'Bạc 925 và phụ kiện',
    weight: 'Tự điều chỉnh'
  }
];

function loadProducts() {
  try {
    const saved = JSON.parse(localStorage.getItem('products'));
    if (Array.isArray(saved) && saved.length > 0) return saved;
  } catch (e) { /* bỏ qua */ }
  return DEFAULT_PRODUCTS.map(p => ({ ...p }));
}
const PRODUCTS = loadProducts();
