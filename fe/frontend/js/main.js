/* =====================================================================
   TĨNH JEWELRY - MAIN JAVASCRIPT
   - Gọi API Backend (fetch()) lấy danh mục & sản phẩm thay thế dữ liệu tĩnh
   - Quản lý giỏ hàng và đồng bộ kho hàng theo thời gian thực
   - Quy trình đặt hàng & thanh toán (COD / Chuyển khoản QR / Thẻ quốc tế)
   ===================================================================== */

const API_BASE = 'http://localhost:5000/api';

/* ============ Tiện ích ============ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const fmt = n => (Number(n) || 0).toLocaleString('vi-VN') + 'đ';
const read = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } };
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const getProduct = id => PRODUCTS.find(p => Number(p.id) === Number(id));
const escapeHtml = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const param = k => new URLSearchParams(location.search).get(k);

/* ============ Gọi API Backend (fetch()) lấy sản phẩm thay thế tĩnh ============ */
async function fetchProductsFromBackend() {
  try {
    const res = await fetch(`${API_BASE}/products`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json && json.data && Array.isArray(json.data) && json.data.length > 0) {
      const mapped = json.data.map(apiP => {
        const id = Number(apiP.ProductID || apiP.id);
        const catId = Number(apiP.CategoryID);
        const categoryKey = catId === 1 ? 'bracelet' : catId === 2 ? 'necklace' : (catId === 3 ? 'diy' : (apiP.category || 'bracelet'));
        return {
          id: id,
          code: apiP.ProductCode || apiP.code || ('SP0' + id),
          name: apiP.ProductName || apiP.name,
          category: categoryKey,
          price: Number(apiP.Price || apiP.price || 0),
          stock: Number(apiP.StockQuantity !== undefined ? apiP.StockQuantity : (apiP.stock || 0)),
          material: apiP.Material || apiP.material || 'Bạc 925',
          weight: apiP.Size || apiP.weight || 'Free size',
          image: apiP.ImageURL || apiP.image || 'images/bracelet-1.svg',
          desc: apiP.Description || apiP.desc || ''
        };
      });

      if (mapped.length > 0) {
        PRODUCTS.length = 0;
        mapped.forEach(p => PRODUCTS.push(p));
        write('products', PRODUCTS);
        console.log('✓ Đã tải', mapped.length, 'sản phẩm từ Backend REST API (port 5000)');
        return true;
      }
    }
  } catch (err) {
    console.warn('Backend API chưa sẵn sàng hoặc offline, sử dụng dữ liệu sản phẩm dự phòng:', err.message);
  }
  return false;
}

/* ============ Giỏ hàng ============ */
const getCart = () => read('cart', []);
const saveCart = c => { write('cart', c); updateCartCount(); };
const cartCount = () => getCart().reduce((s, i) => s + i.qty, 0);

function updateCartCount() {
  const el = $('#cart-count');
  if (el) el.textContent = cartCount();
}

function addToCart(id, size, qty = 1) {
  const p = getProduct(id);
  if (!p || p.stock <= 0) return toast('Sản phẩm đã hết hàng');
  const cart = getCart();
  const item = cart.find(i => Number(i.id) === Number(p.id) && i.size === size);
  const current = item ? item.qty : 0;
  if (current + qty > p.stock) return toast(`Chỉ còn ${p.stock} sản phẩm trong kho`);
  if (item) item.qty += qty; else cart.push({ id: p.id, size, qty });
  saveCart(cart);
  toast(`Đã thêm "${p.name}" vào giỏ hàng`);
}

/* ============ Vận chuyển & Ưu đãi ============ */
const SHIPPING = {
  standard: { label: 'Giao tiêu chuẩn (3-5 ngày)', fee: 30000 },
  fast: { label: 'Giao hỏa tốc (1-2 ngày)', fee: 50000 }
};
const FREE_SHIP_FROM = 1000000;

const COUPONS = {
  'TINH10': { type: 'percent', value: 10, label: 'Giảm 10% tổng đơn hàng' },
  'FREESHIP': { type: 'ship', value: 100, label: 'Miễn phí giao hàng' },
  'GIAM50K': { type: 'fixed', value: 50000, label: 'Giảm ngay 50.000đ' }
};
const getCoupon = () => read('appliedCoupon', null);
const setCoupon = c => write('appliedCoupon', c);

function calcTotals(shipKey = 'standard') {
  const cart = getCart();
  const subtotal = cart.reduce((s, i) => s + (getProduct(i.id)?.price || 0) * i.qty, 0);
  let shipping = subtotal === 0 ? 0 : (SHIPPING[shipKey]?.fee || 30000);
  if (shipKey === 'standard' && subtotal >= FREE_SHIP_FROM) shipping = 0;

  const couponCode = getCoupon();
  let discount = 0;
  if (couponCode && COUPONS[couponCode] && subtotal > 0) {
    const cp = COUPONS[couponCode];
    if (cp.type === 'percent') discount = Math.round(subtotal * (cp.value / 100));
    else if (cp.type === 'fixed') discount = Math.min(subtotal, cp.value);
    else if (cp.type === 'ship') shipping = 0;
  }

  const total = Math.max(0, subtotal - discount + shipping);
  return { subtotal, shipping, discount, total, coupon: couponCode ? COUPONS[couponCode] : null };
}

/* ============ Người dùng ============ */
const getUsers = () => read('users', []);
const currentUser = () => read('currentUser', null);

/* ============ Toast ============ */
function toast(msg) {
  let t = $('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), 2200);
}

/* ============ Header / Footer dùng chung ============ */
function renderLayout() {
  const page = document.body.dataset.page;
  const user = currentUser();
  const admin = read('currentAdmin', null);
  const link = (href, text, key) => `<a href="${href}" class="${page === key || (key === 'account' && page === 'login') ? 'active' : ''}">${text}</a>`;

  const headerEl = $('#site-header');
  if (headerEl) {
    headerEl.innerHTML = `
      <header class="header">
        <a href="index.html" class="logo">TĨNH</a>
        <button class="menu-toggle" aria-label="Menu">☰</button>
        <nav class="nav">
          ${link('index.html', 'Trang chủ', 'home')}
          ${link('products.html', 'Sản phẩm', 'products')}
          ${link('index.html#about', 'Về TĨNH', 'about')}
          ${link(user ? 'account.html' : 'login.html', user ? 'Xin chào, ' + escapeHtml(user.name.split(' ').pop()) : 'Đăng nhập', 'account')}
          <a href="cart.html" class="${page === 'cart' ? 'active' : ''}">Giỏ hàng<span class="cart-badge" id="cart-count">0</span></a>
          <a href="${admin ? 'admin/index.html' : 'admin/login.html'}" class="nav-admin">${admin ? 'Vào trang quản trị' : 'Quản trị'}</a>
        </nav>
      </header>`;
    $('.menu-toggle', headerEl)?.addEventListener('click', () => $('.nav', headerEl).classList.toggle('open'));
  }

  const footerEl = $('#site-footer');
  if (footerEl) {
    footerEl.innerHTML = `
      <footer class="footer">
        <div class="footer-grid">
          <div>
            <a href="index.html" class="logo">TĨNH</a>
            <p>Thương hiệu trang sức bạc theo đuổi vẻ đẹp tối giản, tinh tế và bền bỉ cùng thời gian.</p>
          </div>
          <div>
            <h4>Cửa hàng</h4>
            <a href="products.html?cat=bracelet">Vòng tay</a>
            <a href="products.html?cat=necklace">Dây chuyền</a>
            <a href="products.html?cat=diy">Bộ sản phẩm DIY</a>
          </div>
          <div>
            <h4>Hỗ trợ</h4>
            <a href="account.html">Đơn hàng của tôi</a>
            <p>Đổi trả trong 7 ngày</p>
            <p>Hotline: 0900 000 000</p>
            <a href="admin/login.html">Dành cho quản trị viên</a>
          </div>
        </div>
        <div class="copyright">© 2026 TĨNH Jewelry. All rights reserved.</div>
      </footer>`;
  }

  updateCartCount();
}

/* ============ Template thẻ sản phẩm ============ */
function productCard(p) {
  const out = p.stock <= 0;
  const catName = CATEGORIES[p.category] || p.category || 'Trang sức';
  return `
    <article class="product-card">
      ${out ? '<span class="tag-out">HẾT HÀNG</span>' : ''}
      <a class="thumb" href="product-detail.html?id=${p.id}"><img src="${p.image}" alt="${escapeHtml(p.name)}"></a>
      <div class="cat">${catName}</div>
      <h3><a href="product-detail.html?id=${p.id}">${escapeHtml(p.name)}</a></h3>
      <p class="price">${fmt(p.price)}</p>
      <button class="btn btn-small btn-outline" data-add="${p.id}" ${out ? 'disabled' : ''}>Thêm vào giỏ</button>
    </article>`;
}

function bindAddButtons(root = document) {
  $$('[data-add]', root).forEach(btn => btn.addEventListener('click', () => {
    const p = getProduct(btn.dataset.add);
    if (!p) return;
    const sizes = SIZES[p.category] || ['Free size'];
    addToCart(p.id, sizes[0]);
  }));
}

/* ============ Các trang giao diện ============ */
const pages = {};

/* ---- 1. Trang chủ ---- */
pages.home = () => {
  const grid = $('#featured-grid');
  if (grid) {
    grid.innerHTML = PRODUCTS.filter(p => p.stock > 0).slice(0, 4).map(productCard).join('');
    bindAddButtons(grid);
  }
  const catGrid = $('#category-grid');
  if (catGrid) {
    catGrid.innerHTML = Object.entries(CATEGORIES).map(([key, name]) => {
      const sample = PRODUCTS.find(p => p.category === key);
      const img = (sample && sample.image) ? sample.image : 'images/bracelet-1.svg';
      return `<a class="category-card" href="products.html?cat=${key}"><img src="${img}" alt="${name}"><h3>${name}</h3></a>`;
    }).join('');
  }
};

/* ---- 2. Danh sách sản phẩm (Có tìm kiếm & lọc động) ---- */
pages.products = () => {
  const state = { cat: CATEGORIES[param('cat')] ? param('cat') : 'all', q: '', sort: 'default' };
  const grid = $('#product-grid');
  const chips = $('#chips');

  if (chips) {
    chips.innerHTML = [['all', 'Tất cả'], ...Object.entries(CATEGORIES)]
      .map(([k, v]) => `<button class="chip" data-cat="${k}">${v}</button>`).join('');
  }

  function render() {
    $$('.chip', chips).forEach(c => c.classList.toggle('active', c.dataset.cat === state.cat));
    let list = PRODUCTS.filter(p =>
      (state.cat === 'all' || p.category === state.cat) &&
      (p.name.toLowerCase().includes(state.q.toLowerCase()) || (p.code && p.code.toLowerCase().includes(state.q.toLowerCase()))));
    
    if (state.sort === 'asc') list.sort((a, b) => a.price - b.price);
    if (state.sort === 'desc') list.sort((a, b) => b.price - a.price);
    if (state.sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name, 'vi'));

    if (grid) {
      grid.innerHTML = list.length ? list.map(productCard).join('') : '<p class="empty" style="grid-column:1/-1;text-align:center;padding:40px">Không tìm thấy sản phẩm phù hợp.</p>';
      bindAddButtons(grid);
    }
  }

  chips?.addEventListener('click', e => {
    if (e.target.dataset.cat) {
      state.cat = e.target.dataset.cat;
      render();
    }
  });

  const searchInput = $('#search');
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      state.q = e.target.value.trim();
      render();
    });
  }

  const sortSelect = $('#sort');
  if (sortSelect) {
    sortSelect.addEventListener('change', e => {
      state.sort = e.target.value;
      render();
    });
  }

  render();
};

/* ---- 3. Chi tiết sản phẩm (Lấy chi tiết qua API hoặc fallback) ---- */
pages.detail = async () => {
  const prodId = param('id');
  let p = getProduct(prodId);

  // Thử gọi API chi tiết sản phẩm từ Backend để lấy thông tin mới nhất
  if (prodId) {
    try {
      const res = await fetch(`${API_BASE}/products/${prodId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          const apiP = json.data;
          const id = Number(apiP.ProductID || apiP.id);
          const catId = Number(apiP.CategoryID);
          const categoryKey = catId === 1 ? 'bracelet' : catId === 2 ? 'necklace' : (catId === 3 ? 'diy' : (apiP.category || 'bracelet'));
          p = {
            id: id,
            code: apiP.ProductCode || apiP.code || ('SP0' + id),
            name: apiP.ProductName || apiP.name,
            category: categoryKey,
            price: Number(apiP.Price || apiP.price || 0),
            stock: Number(apiP.StockQuantity !== undefined ? apiP.StockQuantity : (apiP.stock || 0)),
            material: apiP.Material || apiP.material || 'Bạc 925',
            weight: apiP.Size || apiP.weight || 'Free size',
            image: apiP.ImageURL || (apiP.images && apiP.images[0]?.ImageURL) || apiP.image || 'images/bracelet-1.svg',
            desc: apiP.Description || apiP.desc || ''
          };
        }
      }
    } catch (e) {
      /* dùng fallback từ getProduct */
    }
  }

  const box = $('#detail');
  if (!p) {
    if (box) box.innerHTML = '<p class="empty">Không tìm thấy sản phẩm. <a href="products.html"><u>Quay lại cửa hàng</u></a></p>';
    return;
  }

  document.title = p.name + ' | TĨNH Jewelry';
  const out = p.stock <= 0;
  const sizeList = (SIZES[p.category] && SIZES[p.category].length) ? SIZES[p.category] : ['Free size'];
  let size = sizeList[0];
  let qty = 1;

  if (box) {
    box.innerHTML = `
      <div class="gallery"><img src="${p.image}" alt="${escapeHtml(p.name)}"></div>
      <div>
        <div class="cat">${CATEGORIES[p.category] || p.category || 'Trang sức'}</div>
        <h1>${escapeHtml(p.name)}</h1>
        <p class="price">${fmt(p.price)}</p>
        <p class="desc">${escapeHtml(p.desc)}</p>
        <span class="label">${p.category === 'ring' ? 'Size nhẫn' : 'Kích thước / Phân loại'}</span>
        <div class="sizes" id="sizes">${sizeList.map((s, i) => `<button class="size ${i === 0 ? 'active' : ''}" data-size="${s}">${s}</button>`).join('')}</div>
        <span class="label">Số lượng</span>
        <div class="qty">
          <button id="minus">−</button>
          <span id="qty">1</span>
          <button id="plus">+</button>
        </div>
        <p class="stock" style="margin-top:8px;color:${out ? 'var(--danger)' : '#2e7d32'};font-weight:500;">
          ${out ? '⚠️ Tạm hết hàng' : `✓ Còn ${p.stock} sản phẩm trong kho`}
        </p>
        <button class="btn btn-block" id="add" ${out ? 'disabled' : ''}>Thêm vào giỏ hàng</button>
        <div class="specs">
          <div><span>Chất liệu</span><span>${p.material}</span></div>
          <div><span>Trọng lượng</span><span>${p.weight}</span></div>
          <div><span>Bảo hành</span><span>Làm sạch & đánh bóng trọn đời</span></div>
          <div><span>Đổi trả</span><span>Trong 7 ngày theo chính sách</span></div>
        </div>
      </div>`;

    $('#crumb-name').textContent = p.name;
    $('#sizes')?.addEventListener('click', e => {
      if (!e.target.dataset.size) return;
      size = e.target.dataset.size;
      $$('.size').forEach(b => b.classList.toggle('active', b === e.target));
    });
    $('#minus')?.addEventListener('click', () => { qty = Math.max(1, qty - 1); $('#qty').textContent = qty; });
    $('#plus')?.addEventListener('click', () => {
      if (qty >= p.stock) return toast(`Kho chỉ còn ${p.stock} sản phẩm`);
      qty++;
      $('#qty').textContent = qty;
    });
    $('#add')?.addEventListener('click', () => addToCart(p.id, size, qty));
  }

  const related = PRODUCTS.filter(r => r.id !== p.id && r.category === p.category).concat(PRODUCTS.filter(r => r.category !== p.category)).slice(0, 4);
  const relGrid = $('#related-grid');
  if (relGrid) {
    relGrid.innerHTML = related.map(productCard).join('');
    bindAddButtons(relGrid);
  }
};

/* ---- 4. Giỏ hàng hoàn thiện (Cart) ---- */
pages.cart = () => {
  const body = $('#cart-body');
  const layout = $('#cart-layout');

  function render() {
    const cart = getCart();
    if (!cart.length) {
      if (layout) {
        layout.innerHTML = `
          <div class="empty" style="grid-column:1/-1;text-align:center;padding:60px 20px;">
            <div style="font-size:48px;margin-bottom:16px;">🛍️</div>
            <h2>Giỏ hàng của bạn đang trống</h2>
            <p style="color:#777;margin:12px 0 24px;">Hãy khám phá những món trang sức bạc tối giản và tinh tế từ TĨNH.</p>
            <a href="products.html" class="btn">Khám phá sản phẩm ngay</a>
          </div>`;
      }
      return;
    }

    const { subtotal, shipping, discount, total } = calcTotals();

    // Render danh sách sản phẩm trong giỏ
    if (body) {
      body.innerHTML = cart.map((it, idx) => {
        const p = getProduct(it.id);
        if (!p) return '';
        const itemTotal = p.price * it.qty;
        const isMaxStock = it.qty >= p.stock;
        return `<tr>
          <td>
            <div class="cart-item">
              <a href="product-detail.html?id=${p.id}"><img src="${p.image}" alt="${escapeHtml(p.name)}"></a>
              <div>
                <h3><a href="product-detail.html?id=${p.id}">${escapeHtml(p.name)}</a></h3>
                <small>Phân loại: <strong>${it.size}</strong></small><br>
                <small style="color:${p.stock <= 5 ? 'var(--danger)' : '#777'}">Tồn kho máy chủ: ${p.stock}</small>
              </div>
            </div>
          </td>
          <td><strong>${fmt(p.price)}</strong></td>
          <td>
            <div class="qty" style="margin:0;display:inline-flex;align-items:center;">
              <button data-dec="${idx}" title="Giảm số lượng">−</button>
              <input class="qty-input" type="number" min="1" max="${p.stock}" value="${it.qty}" data-qty-idx="${idx}">
              <button data-inc="${idx}" ${isMaxStock ? 'disabled style="opacity:0.5"' : ''} title="Tăng số lượng">+</button>
            </div>
          </td>
          <td><strong>${fmt(itemTotal)}</strong></td>
          <td><button class="remove" data-del="${idx}" title="Xóa khỏi giỏ">×</button></td>
        </tr>`;
      }).join('');
    }

    // Thanh tiến trình Miễn phí vận chuyển
    const shipProgress = $('#ship-progress');
    if (shipProgress) {
      const percent = Math.min(100, Math.round((subtotal / FREE_SHIP_FROM) * 100));
      const left = FREE_SHIP_FROM - subtotal;
      shipProgress.innerHTML = `
        <div style="display:flex;justify-content:space-between;font-weight:500;">
          <span>${left > 0 ? `Mua thêm <strong>${fmt(left)}</strong> để được Miễn phí giao hàng` : '🎉 Bạn đã được MIỄN PHÍ VẬN CHUYỂN!'}</span>
          <span>${percent}%</span>
        </div>
        <div class="ship-bar-outer"><div class="ship-bar-inner" style="width:${percent}%"></div></div>`;
    }

    // Tóm tắt tiền
    if ($('#sum-sub')) $('#sum-sub').textContent = fmt(subtotal);
    const rowDisc = $('#row-discount');
    if (rowDisc) {
      if (discount > 0) {
        rowDisc.style.display = 'flex';
        $('#sum-discount').textContent = `-${fmt(discount)}`;
      } else {
        rowDisc.style.display = 'none';
      }
    }
    if ($('#sum-ship')) $('#sum-ship').textContent = shipping === 0 ? 'Miễn phí' : fmt(shipping);
    if ($('#sum-total')) $('#sum-total').textContent = fmt(total);

    // Hiển thị coupon đã áp dụng
    const appliedCoupon = getCoupon();
    const couponAppliedBox = $('#coupon-applied');
    if (couponAppliedBox) {
      if (appliedCoupon && COUPONS[appliedCoupon]) {
        couponAppliedBox.innerHTML = `
          <div class="coupon-tag">
            <span>✓ Đã áp dụng: <strong>${appliedCoupon}</strong> (${COUPONS[appliedCoupon].label})</span>
            <button id="btn-remove-coupon" title="Hủy mã">✕</button>
          </div>`;
      } else {
        couponAppliedBox.innerHTML = '';
      }
    }
  }

  // Bắt sự kiện click tăng/giảm/xóa
  body?.addEventListener('click', e => {
    const cart = getCart();
    const t = e.target;
    if (t.dataset.inc !== undefined) {
      const it = cart[t.dataset.inc];
      const p = getProduct(it.id);
      if (it.qty + 1 > p.stock) return toast(`Kho chỉ còn ${p.stock} sản phẩm`);
      it.qty++;
    } else if (t.dataset.dec !== undefined) {
      const it = cart[t.dataset.dec];
      if (it.qty <= 1) {
        if (!confirm('Bạn có muốn xóa sản phẩm này khỏi giỏ hàng?')) return;
        cart.splice(t.dataset.dec, 1);
      } else {
        it.qty--;
      }
    } else if (t.dataset.del !== undefined) {
      cart.splice(t.dataset.del, 1);
      toast('Đã xóa sản phẩm khỏi giỏ hàng');
    } else return;
    saveCart(cart);
    render();
  });

  // Bắt sự kiện thay đổi trực tiếp ô số lượng
  body?.addEventListener('change', e => {
    if (e.target.dataset.qtyIdx !== undefined) {
      const cart = getCart();
      const idx = e.target.dataset.qtyIdx;
      const it = cart[idx];
      const p = getProduct(it.id);
      let val = parseInt(e.target.value, 10);
      if (isNaN(val) || val < 1) val = 1;
      if (val > p.stock) {
        toast(`Kho chỉ còn ${p.stock} sản phẩm`);
        val = p.stock;
      }
      it.qty = val;
      saveCart(cart);
      render();
    }
  });

  // Nút xóa toàn bộ giỏ hàng
  $('#btn-clear-all')?.addEventListener('click', () => {
    if (!confirm('Bạn có chắc chắn muốn làm trống giỏ hàng?')) return;
    saveCart([]);
    setCoupon(null);
    render();
    toast('Đã xóa toàn bộ giỏ hàng');
  });

  // Áp dụng mã giảm giá
  $('#btn-apply-coupon')?.addEventListener('click', () => {
    const code = ($('#coupon-code')?.value || '').trim().toUpperCase();
    if (!code) return toast('Vui lòng nhập mã ưu đãi');
    if (COUPONS[code]) {
      setCoupon(code);
      toast(`Áp dụng mã ${code} thành công!`);
      render();
    } else {
      toast('Mã ưu đãi không hợp lệ. Hãy thử mã TINH10 hoặc FREESHIP nhé!');
    }
  });

  // Hủy mã giảm giá
  $('#cart-layout')?.addEventListener('click', e => {
    if (e.target.id === 'btn-remove-coupon') {
      setCoupon(null);
      toast('Đã hủy mã ưu đãi');
      render();
    }
  });

  render();
};

/* ---- 5. Thanh toán hoàn thiện (Checkout) ---- */
pages.checkout = () => {
  if (!getCart().length) { location.href = 'cart.html'; return; }
  const user = currentUser();
  if (user) {
    if ($('#name')) $('#name').value = user.name || '';
    if ($('#email')) $('#email').value = user.email || '';
    if ($('#phone')) $('#phone').value = user.phone || '';
  }

  // Tùy chọn vận chuyển
  const shipContainer = $('#ship-options');
  if (shipContainer) {
    shipContainer.innerHTML = Object.entries(SHIPPING).map(([k, v], i) =>
      `<label class="radio">
        <input type="radio" name="shipping" value="${k}" ${i === 0 ? 'checked' : ''}>
        <span>${v.label}</span>
        <small>${fmt(v.fee)}</small>
      </label>`).join('');
  }

  // Phương thức thanh toán (COD / Chuyển khoản QR / Thẻ quốc tế)
  const payRadios = $$('input[name="payment"]');
  const codDetail = $('#cod-detail');
  const bankDetail = $('#bank-detail');
  const cardDetail = $('#card-detail');
  const tempOrderCode = 'TINH' + Math.floor(100000 + Math.random() * 900000);

  function updatePaymentView() {
    const checked = $('input[name="payment"]:checked')?.value || 'cod';
    if (codDetail) codDetail.style.display = checked === 'cod' ? 'block' : 'none';
    if (bankDetail) {
      bankDetail.style.display = checked === 'bank' ? 'block' : 'none';
      if (checked === 'bank') {
        const shipKey = $('input[name="shipping"]:checked')?.value || 'standard';
        const { total } = calcTotals(shipKey);
        if ($('#bank-memo')) $('#bank-memo').textContent = tempOrderCode;
        if ($('#vietqr-img')) {
          $('#vietqr-img').src = `https://img.vietqr.io/image/MB-0900123456789-compact2.png?amount=${total}&addInfo=${tempOrderCode}`;
        }
      }
    }
    if (cardDetail) cardDetail.style.display = checked === 'card' ? 'block' : 'none';
  }
  payRadios.forEach(r => r.addEventListener('change', updatePaymentView));

  function renderSummary() {
    const shipKey = $('input[name="shipping"]:checked')?.value || 'standard';
    const { subtotal, shipping, discount, total } = calcTotals(shipKey);

    // Danh sách sản phẩm mini bên phải
    if ($('#mini-items')) {
      $('#mini-items').innerHTML = getCart().map(i => {
        const p = getProduct(i.id);
        if (!p) return '';
        return `
          <div class="mini-item">
            <span><strong>${escapeHtml(p.name)}</strong> (${i.size}) × ${i.qty}</span>
            <span>${fmt(p.price * i.qty)}</span>
          </div>`;
      }).join('');
    }

    if ($('#sum-sub')) $('#sum-sub').textContent = fmt(subtotal);
    const discRow = $('#checkout-row-discount');
    if (discRow) {
      if (discount > 0) {
        discRow.style.display = 'flex';
        $('#checkout-sum-discount').textContent = `-${fmt(discount)}`;
      } else {
        discRow.style.display = 'none';
      }
    }
    if ($('#sum-ship')) $('#sum-ship').textContent = shipping === 0 ? 'Miễn phí' : fmt(shipping);
    if ($('#sum-total')) $('#sum-total').textContent = fmt(total);

    // Cập nhật giá ship trong các lựa chọn
    $$('#ship-options small').forEach((s, i) => {
      const key = Object.keys(SHIPPING)[i];
      const free = key === 'standard' && subtotal >= FREE_SHIP_FROM;
      s.textContent = free ? 'Miễn phí' : fmt(SHIPPING[key].fee);
    });

    // Cập nhật mã VietQR theo tổng tiền
    if ($('input[name="payment"]:checked')?.value === 'bank' && $('#vietqr-img')) {
      $('#vietqr-img').src = `https://img.vietqr.io/image/MB-0900123456789-compact2.png?amount=${total}&addInfo=${tempOrderCode}`;
    }

    // Hiển thị coupon ở checkout
    const appliedCoupon = getCoupon();
    const tagBox = $('#checkout-coupon-tag');
    if (tagBox) {
      if (appliedCoupon && COUPONS[appliedCoupon]) {
        tagBox.innerHTML = `
          <div class="coupon-tag" style="margin-bottom:12px">
            <span>✓ Đã áp dụng: <strong>${appliedCoupon}</strong></span>
            <button id="btn-checkout-del-coupon">✕</button>
          </div>`;
      } else {
        tagBox.innerHTML = '';
      }
    }
  }

  $$('input[name="shipping"]').forEach(r => r.addEventListener('change', renderSummary));
  updatePaymentView();
  renderSummary();

  // Áp dụng coupon tại trang checkout
  $('#btn-checkout-coupon')?.addEventListener('click', () => {
    const code = ($('#checkout-coupon-code')?.value || '').trim().toUpperCase();
    if (!code) return toast('Vui lòng nhập mã ưu đãi');
    if (COUPONS[code]) {
      setCoupon(code);
      toast(`Áp dụng mã ${code} thành công!`);
      renderSummary();
    } else {
      toast('Mã ưu đãi không hợp lệ. Thử mã TINH10 hoặc FREESHIP nhé!');
    }
  });

  // Hủy coupon tại trang checkout
  $('#checkout-coupon-tag')?.addEventListener('click', e => {
    if (e.target.id === 'btn-checkout-del-coupon') {
      setCoupon(null);
      toast('Đã hủy mã ưu đãi');
      renderSummary();
    }
  });

  // Xác thực dữ liệu nhập form
  function validate() {
    let ok = true;
    const rules = {
      name: v => v.trim().length >= 2,
      email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      phone: v => /^(0|\+84)[3|5|7|8|9][0-9]{8}$/.test(v.replace(/\s/g, '')),
      address: v => v.trim().length >= 5,
      city: v => v.trim().length >= 2
    };
    Object.entries(rules).forEach(([id, test]) => {
      const el = $('#' + id);
      if (!el) return;
      const f = el.closest('.field');
      const valid = test(el.value);
      if (f) f.classList.toggle('invalid', !valid);
      if (!valid) ok = false;
    });
    return ok;
  }

  // Xử lý gửi đơn hàng (Gọi fetch() gửi lên Backend)
  $('#checkout-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    if (!validate()) return toast('Vui lòng kiểm tra lại thông tin màu đỏ');

    const submitBtn = $('#btn-submit-order');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Đang xử lý đơn hàng...';
    }

    const shipKey = $('input[name="shipping"]:checked')?.value || 'standard';
    const totals = calcTotals(shipKey);
    let orderId = tempOrderCode;
    const orderItems = getCart().map(i => {
      const p = getProduct(i.id);
      return { id: p.id, name: p.name, size: i.size, qty: i.qty, price: p.price };
    });

    const orderData = {
      id: orderId,
      date: new Date().toISOString(),
      userEmail: currentUser()?.email || $('#email').value.trim().toLowerCase(),
      customer: {
        name: $('#name').value.trim(),
        email: $('#email').value.trim(),
        phone: $('#phone').value.trim(),
        address: $('#address').value.trim() + ', ' + $('#city').value.trim()
      },
      shippingMethod: shipKey,
      payment: $('input[name="payment"]:checked')?.value || 'cod',
      note: $('#note')?.value.trim() || '',
      items: orderItems,
      ...totals,
      status: 'Chờ xác nhận'
    };

    // Gọi API POST /api/orders lên Backend REST API
    try {
      const payload = {
        customerId: currentUser()?.id || 1,
        receiverName: orderData.customer.name,
        receiverPhone: orderData.customer.phone,
        shippingAddress: orderData.customer.address,
        shippingFee: totals.shipping || 0,
        paymentMethod: orderData.payment,
        adminId: 1,
        items: orderData.items.map(it => ({
          productId: it.id,
          quantity: it.qty,
          unitPrice: it.price
        }))
      };

      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data && (json.data.orderCode || json.data.orderId)) {
          orderId = json.data.orderCode || ('ORD' + json.data.orderId);
          orderData.id = orderId;
          orderData.orderCode = orderId;
        }
      }
    } catch (err) {
      console.warn('Backend order offline fallback:', err);
    }

    // Cập nhật tồn kho sản phẩm
    orderData.items.forEach(i => {
      const p = getProduct(i.id);
      if (p) p.stock = Math.max(0, p.stock - i.qty);
    });
    write('products', PRODUCTS);

    // Lưu vào lịch sử đơn hàng
    const orders = read('orders', []);
    orders.unshift(orderData);
    write('orders', orders);

    // Xóa giỏ hàng và coupon
    saveCart([]);
    setCoupon(null);

    toast('🎉 Đặt hàng thành công! Đang chuyển hướng...');
    setTimeout(() => {
      location.href = 'account.html?new=' + orderData.id;
    }, 700);
  });
};

/* ---- 6. Đăng nhập / Đăng ký ---- */
pages.login = () => {
  if (currentUser()) { location.href = 'account.html'; return; }
  const loginForm = $('#login-form'), regForm = $('#register-form');

  $$('.tab').forEach(tab => tab.addEventListener('click', () => {
    $$('.tab').forEach(t => t.classList.toggle('active', t === tab));
    loginForm.hidden = tab.dataset.tab !== 'login';
    regForm.hidden = tab.dataset.tab !== 'register';
  }));

  loginForm?.addEventListener('submit', e => {
    e.preventDefault();
    const email = $('#l-email').value.trim().toLowerCase();
    const pass = $('#l-pass').value;
    const user = getUsers().find(u => u.email === email && u.password === pass);
    if (!user) { $('#l-msg').textContent = 'Email hoặc mật khẩu không đúng.'; return; }
    write('currentUser', { name: user.name, email: user.email, phone: user.phone });
    location.href = param('next') || 'account.html';
  });

  regForm?.addEventListener('submit', e => {
    e.preventDefault();
    const name = $('#r-name').value.trim();
    const email = $('#r-email').value.trim().toLowerCase();
    const phone = $('#r-phone').value.trim();
    const pass = $('#r-pass').value;
    const pass2 = $('#r-pass2').value;
    const msg = $('#r-msg');
    if (name.length < 2) return msg.textContent = 'Vui lòng nhập họ tên.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return msg.textContent = 'Email không hợp lệ.';
    if (!/^(0|\+84)\d{9}$/.test(phone.replace(/\s/g, ''))) return msg.textContent = 'Số điện thoại không hợp lệ.';
    if (pass.length < 6) return msg.textContent = 'Mật khẩu tối thiểu 6 ký tự.';
    if (pass !== pass2) return msg.textContent = 'Mật khẩu nhập lại không khớp.';
    const users = getUsers();
    if (users.some(u => u.email === email)) return msg.textContent = 'Email này đã được đăng ký.';
    users.push({ name, email, phone, password: pass });
    write('users', users);
    write('currentUser', { name, email, phone });
    location.href = 'account.html';
  });
};

/* ---- 7. Tài khoản & Lịch sử đơn hàng ---- */
pages.account = () => {
  const user = currentUser();
  if (!user) { location.href = 'login.html'; return; }

  const profBox = $('#profile');
  if (profBox) {
    profBox.innerHTML = `
      <h3>${escapeHtml(user.name)}</h3>
      <p>${escapeHtml(user.email)}</p>
      <p>${escapeHtml(user.phone || '')}</p>
      <button class="btn btn-outline btn-block" id="logout">Đăng xuất</button>`;
    $('#logout')?.addEventListener('click', () => { localStorage.removeItem('currentUser'); location.href = 'index.html'; });
  }

  const newId = param('new');
  if (newId) {
    const alertBox = $('#alert');
    if (alertBox) {
      alertBox.innerHTML = `
        <div class="alert">
          🎉 <strong>Đặt hàng thành công!</strong> Mã đơn của bạn là: <strong>${escapeHtml(newId)}</strong>.<br>
          Đơn hàng đã được đồng bộ lên hệ thống máy chủ TĨNH Jewelry. Quản trị viên sẽ sớm liên hệ xác nhận và giao hàng.
        </div>`;
    }
  }

  const statusClass = s => (s === 'Đã hủy' ? 'cancel' : (s === 'Đã xác nhận' || s === 'Đã giao') ? 'done' : '');
  const payLabel = { cod: 'Thanh toán khi nhận hàng (COD)', bank: 'Chuyển khoản VietQR', card: 'Thẻ tín dụng / ghi nợ' };

  function render() {
    const orders = read('orders', []).filter(o => o.userEmail === user.email.toLowerCase() || !o.userEmail);
    const list = $('#orders');
    if (!list) return;
    if (!orders.length) { list.innerHTML = '<p class="empty">Bạn chưa có đơn hàng nào. <a href="products.html"><u>Mua sắm ngay</u></a></p>'; return; }
    list.innerHTML = orders.map(o => `
      <div class="order">
        <div class="order-head">
          <span><strong>${o.id}</strong> · ${new Date(o.date).toLocaleString('vi-VN')}</span>
          <span class="status ${statusClass(o.status)}">${o.status}</span>
        </div>
        <div class="order-body">
          ${o.items.map(i => `<div class="mini-item"><span>${escapeHtml(i.name)} (${i.size}) × ${i.qty}</span><span>${fmt(i.price * i.qty)}</span></div>`).join('')}
          ${o.discount ? `<div class="mini-item" style="color:#2e7d32"><span>Ưu đãi giảm giá</span><span>-${fmt(o.discount)}</span></div>` : ''}
          <div class="mini-item" style="color:#7a7a7a"><span>Phí vận chuyển</span><span>${o.shipping === 0 ? 'Miễn phí' : fmt(o.shipping)}</span></div>
          <div class="mini-item" style="color:#7a7a7a"><span>Thanh toán</span><span>${payLabel[o.payment] || o.payment}</span></div>
          <div class="mini-item" style="color:#7a7a7a"><span>Giao đến</span><span>${escapeHtml(o.customer?.address || '')}</span></div>
        </div>
        <div class="order-foot">
          <strong>Tổng thanh toán: ${fmt(o.total)}</strong>
          ${o.status === 'Chờ xác nhận' ? `<button class="btn btn-small btn-danger" data-cancel="${o.id}">Hủy đơn</button>` : ''}
        </div>
      </div>`).join('');
  }

  $('#orders')?.addEventListener('click', e => {
    const id = e.target.dataset.cancel;
    if (!id || !confirm('Bạn chắc chắn muốn hủy đơn hàng này?')) return;
    const orders = read('orders', []);
    const o = orders.find(x => x.id === id);
    if (o && o.status === 'Chờ xác nhận') {
      o.status = 'Đã hủy';
      o.items.forEach(i => { const p = getProduct(i.id); if (p) p.stock += i.qty; });
      write('products', PRODUCTS);
    }
    write('orders', orders);
    render();
  });

  render();
};

/* ============ Khởi chạy toàn trang ============ */
document.addEventListener('DOMContentLoaded', async () => {
  renderLayout();
  // 1. Gọi lệnh fetch() từ BE để thay thế dữ liệu tĩnh
  await fetchProductsFromBackend();
  // 2. Chạy logic riêng của từng trang
  const fn = pages[document.body.dataset.page];
  if (fn) fn();
});
