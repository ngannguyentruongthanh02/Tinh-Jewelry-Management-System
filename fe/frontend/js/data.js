/* Dữ liệu sản phẩm mẫu.
   Khi có backend SQL Server, thay mảng này bằng dữ liệu lấy từ API (fetch). */

const CATEGORIES = {
  ring: 'Nhẫn',
  necklace: 'Dây chuyền',
  earring: 'Bông tai',
  bracelet: 'Lắc tay'
};

const SIZES = {
  ring: ['6', '7', '8', '9', '10'],
  necklace: ['40cm', '45cm', '50cm'],
  earring: ['Free size'],
  bracelet: ['16cm', '17cm', '18cm']
};

const DEFAULT_PRODUCTS = [
  { id: 1, name: 'Nhẫn bạc Luna', category: 'ring', price: 890000, stock: 20, image: 'images/ring-1.svg',
    desc: 'Nhẫn bạc 925 đính đá zirconia, dáng mảnh nhẹ nhàng, phù hợp đeo hằng ngày.', material: 'Bạc 925', weight: '2.1g' },
  { id: 2, name: 'Nhẫn bạc Sương', category: 'ring', price: 750000, stock: 15, image: 'images/ring-2.svg',
    desc: 'Nhẫn trơn bản nhỏ với bề mặt xước mờ, phong cách tối giản.', material: 'Bạc 925', weight: '1.8g' },
  { id: 3, name: 'Dây chuyền Nguyệt', category: 'necklace', price: 1290000, stock: 12, image: 'images/necklace-1.svg',
    desc: 'Dây chuyền mặt trăng khuyết, chuỗi bạc mảnh dài 45cm có thể điều chỉnh.', material: 'Bạc 925', weight: '3.4g' },
  { id: 4, name: 'Dây chuyền Giọt Sương', category: 'necklace', price: 1090000, stock: 8, image: 'images/necklace-2.svg',
    desc: 'Mặt dây hình giọt nước đính đá, tạo điểm nhấn thanh lịch trên cổ.', material: 'Bạc 925', weight: '3.0g' },
  { id: 5, name: 'Bông tai Vân', category: 'earring', price: 650000, stock: 25, image: 'images/earring-1.svg',
    desc: 'Bông tai dáng tròn nhỏ, khóa chốt chắc chắn, không gây kích ứng da.', material: 'Bạc 925', weight: '1.5g' },
  { id: 6, name: 'Bông tai Lệ', category: 'earring', price: 790000, stock: 0, image: 'images/earring-2.svg',
    desc: 'Bông tai thả hình giọt dài, chuyển động nhẹ nhàng theo từng nhịp bước.', material: 'Bạc 925', weight: '2.2g' },
  { id: 7, name: 'Lắc tay Mây', category: 'bracelet', price: 990000, stock: 18, image: 'images/bracelet-1.svg',
    desc: 'Lắc tay xích mảnh với khóa tôm hùm, có thể đeo riêng hoặc xếp lớp.', material: 'Bạc 925', weight: '4.0g' },
  { id: 8, name: 'Lắc tay Gió', category: 'bracelet', price: 1190000, stock: 10, image: 'images/bracelet-2.svg',
    desc: 'Lắc tay bản vừa, bề mặt bóng gương, mang lại vẻ sang trọng tinh tế.', material: 'Bạc 925', weight: '5.2g' }
];

/* Sản phẩm: ưu tiên dữ liệu do quản trị viên chỉnh sửa (lưu trong trình duyệt),
   nếu chưa có thì dùng danh sách mặc định ở trên. */
function loadProducts() {
  try {
    const saved = JSON.parse(localStorage.getItem('products'));
    if (Array.isArray(saved)) return saved;
  } catch (e) { /* bỏ qua */ }
  return DEFAULT_PRODUCTS.map(p => ({ ...p }));
}
const PRODUCTS = loadProducts();
