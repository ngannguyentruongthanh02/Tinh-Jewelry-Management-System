/* ============ Tiện ích ============ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const fmt = n => n.toLocaleString('vi-VN') + 'đ';
const read = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } };
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const getProduct = id => PRODUCTS.find(p => p.id === Number(id));
const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const param = k => new URLSearchParams(location.search).get(k);

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
  const item = cart.find(i => i.id === p.id && i.size === size);
  const current = item ? item.qty : 0;
  if (current + qty > p.stock) return toast(`Chỉ còn ${p.stock} sản phẩm trong kho`);
  if (item) item.qty += qty; else cart.push({ id: p.id, size, qty });
  saveCart(cart);
  toast('Đã thêm vào giỏ hàng');
}

const SHIPPING = { standard: { label: 'Giao tiêu chuẩn (3-5 ngày)', fee: 30000 }, fast: { label: 'Giao nhanh (1-2 ngày)', fee: 50000 } };
const FREE_SHIP_FROM = 1000000;

function calcTotals(shipKey = 'standard') {
  const subtotal = getCart().reduce((s, i) => s + (getProduct(i.id)?.price || 0) * i.qty, 0);
  let shipping = subtotal === 0 ? 0 : SHIPPING[shipKey].fee;
  if (shipKey === 'standard' && subtotal >= FREE_SHIP_FROM) shipping = 0;
  return { subtotal, shipping, total: subtotal + shipping };
}

/* ============ Người dùng (demo bằng localStorage) ============ */
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
  const link = (href, text, key) => `<a href="${href}" class="${page === key || (key === 'account' && page === 'login') ? 'active' : ''}">${text}</a>`;

  $('#site-header').innerHTML = `
    <header class="header">
      <a href="index.html" class="logo">TĨNH</a>
      <button class="menu-toggle" aria-label="Menu">☰</button>
      <nav class="nav">
        ${link('index.html', 'Trang chủ', 'home')}
        ${link('products.html', 'Sản phẩm', 'products')}
        ${link('index.html#about', 'Về TĨNH', 'about')}
        ${link(user ? 'account.html' : 'login.html', user ? 'Xin chào, ' + escapeHtml(user.name.split(' ').pop()) : 'Đăng nhập', 'account')}
        <a href="cart.html" class="${page === 'cart' ? 'active' : ''}">Giỏ hàng<span class="cart-badge" id="cart-count">0</span></a>
      </nav>
    </header>`;

  $('#site-footer').innerHTML = `
    <footer class="footer">
      <div class="footer-grid">
        <div>
          <a href="index.html" class="logo">TĨNH</a>
          <p>Thương hiệu trang sức bạc theo đuổi vẻ đẹp tối giản, tinh tế và bền bỉ cùng thời gian.</p>
        </div>
        <div>
          <h4>Cửa hàng</h4>
          <a href="products.html?cat=ring">Nhẫn</a>
          <a href="products.html?cat=necklace">Dây chuyền</a>
          <a href="products.html?cat=earring">Bông tai</a>
          <a href="products.html?cat=bracelet">Lắc tay</a>
        </div>
        <div>
          <h4>Hỗ trợ</h4>
          <a href="account.html">Đơn hàng của tôi</a>
          <p>Đổi trả trong 7 ngày</p>
          <p>Hotline: 0900 000 000</p>
        </div>
      </div>
      <div class="copyright">© 2026 TĨNH Jewelry. All rights reserved.</div>
    </footer>`;

  $('.menu-toggle').addEventListener('click', () => $('.nav').classList.toggle('open'));
  updateCartCount();
}

/* ============ Template thẻ sản phẩm ============ */
function productCard(p) {
  const out = p.stock <= 0;
  return `
    <article class="product-card">
      ${out ? '<span class="tag-out">HẾT HÀNG</span>' : ''}
      <a class="thumb" href="product-detail.html?id=${p.id}"><img src="${p.image}" alt="${escapeHtml(p.name)}"></a>
      <div class="cat">${CATEGORIES[p.category]}</div>
      <h3><a href="product-detail.html?id=${p.id}">${escapeHtml(p.name)}</a></h3>
      <p class="price">${fmt(p.price)}</p>
      <button class="btn btn-small btn-outline" data-add="${p.id}" ${out ? 'disabled' : ''}>Thêm vào giỏ</button>
    </article>`;
}

function bindAddButtons(root = document) {
  $$('[data-add]', root).forEach(btn => btn.addEventListener('click', () => {
    const p = getProduct(btn.dataset.add);
    addToCart(p.id, SIZES[p.category][0]);
  }));
}

/* ============ Các trang ============ */
const pages = {};

/* ---- Trang chủ ---- */
pages.home = () => {
  const grid = $('#featured-grid');
  grid.innerHTML = PRODUCTS.filter(p => p.stock > 0).slice(0, 4).map(productCard).join('');
  bindAddButtons(grid);
  $('#category-grid').innerHTML = Object.entries(CATEGORIES).map(([key, name]) => {
    const sample = PRODUCTS.find(p => p.category === key);
    return `<a class="category-card" href="products.html?cat=${key}"><img src="${sample.image}" alt="${name}"><h3>${name}</h3></a>`;
  }).join('');
};

/* ---- Danh sách sản phẩm ---- */
pages.products = () => {
  const state = { cat: CATEGORIES[param('cat')] ? param('cat') : 'all', q: '', sort: 'default' };
  const grid = $('#product-grid');
  const chips = $('#chips');

  chips.innerHTML = [['all', 'Tất cả'], ...Object.entries(CATEGORIES)]
    .map(([k, v]) => `<button class="chip" data-cat="${k}">${v}</button>`).join('');

  function render() {
    $$('.chip', chips).forEach(c => c.classList.toggle('active', c.dataset.cat === state.cat));
    let list = PRODUCTS.filter(p =>
      (state.cat === 'all' || p.category === state.cat) &&
      p.name.toLowerCase().includes(state.q.toLowerCase()));
    if (state.sort === 'asc') list.sort((a, b) => a.price - b.price);
    if (state.sort === 'desc') list.sort((a, b) => b.price - a.price);
    if (state.sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    grid.innerHTML = list.length ? list.map(productCard).join('') : '<p class="empty">Không tìm thấy sản phẩm phù hợp.</p>';
    bindAddButtons(grid);
  }

  chips.addEventListener('click', e => { if (e.target.dataset.cat) { state.cat = e.target.dataset.cat; render(); } });
  $('#search').addEventListener('input', e => { state.q = e.target.value; render(); });
  $('#sort').addEventListener('change', e => { state.sort = e.target.value; render(); });
  render();
};

/* ---- Chi tiết sản phẩm ---- */
pages.detail = () => {
  const p = getProduct(param('id'));
  const box = $('#detail');
  if (!p) { box.innerHTML = '<p class="empty">Không tìm thấy sản phẩm. <a href="products.html"><u>Quay lại cửa hàng</u></a></p>'; return; }

  document.title = p.name + ' | TĨNH Jewelry';
  const out = p.stock <= 0;
  let size = SIZES[p.category][0];
  let qty = 1;

  box.innerHTML = `
    <div class="gallery"><img src="${p.image}" alt="${escapeHtml(p.name)}"></div>
    <div>
      <div class="cat">${CATEGORIES[p.category]}</div>
      <h1>${escapeHtml(p.name)}</h1>
      <p class="price">${fmt(p.price)}</p>
      <p class="desc">${escapeHtml(p.desc)}</p>
      <span class="label">${p.category === 'ring' ? 'Size nhẫn' : 'Kích thước'}</span>
      <div class="sizes" id="sizes">${SIZES[p.category].map((s, i) => `<button class="size ${i === 0 ? 'active' : ''}" data-size="${s}">${s}</button>`).join('')}</div>
      <span class="label">Số lượng</span>
      <div class="qty"><button id="minus">−</button><span id="qty">1</span><button id="plus">+</button></div>
      <p class="stock">${out ? 'Tạm hết hàng' : 'Còn ' + p.stock + ' sản phẩm'}</p>
      <button class="btn btn-block" id="add" ${out ? 'disabled' : ''}>Thêm vào giỏ hàng</button>
      <div class="specs">
        <div><span>Chất liệu</span><span>${p.material}</span></div>
        <div><span>Trọng lượng</span><span>${p.weight}</span></div>
        <div><span>Bảo hành</span><span>Làm sạch & đánh bóng trọn đời</span></div>
        <div><span>Đổi trả</span><span>Trong 7 ngày</span></div>
      </div>
    </div>`;

  $('#crumb-name').textContent = p.name;
  $('#sizes').addEventListener('click', e => {
    if (!e.target.dataset.size) return;
    size = e.target.dataset.size;
    $$('.size').forEach(b => b.classList.toggle('active', b === e.target));
  });
  $('#minus').addEventListener('click', () => { qty = Math.max(1, qty - 1); $('#qty').textContent = qty; });
  $('#plus').addEventListener('click', () => { qty = Math.min(p.stock || 1, qty + 1); $('#qty').textContent = qty; });
  $('#add').addEventListener('click', () => addToCart(p.id, size, qty));

  const related = PRODUCTS.filter(r => r.id !== p.id && r.category === p.category).concat(PRODUCTS.filter(r => r.category !== p.category)).slice(0, 4);
  $('#related-grid').innerHTML = related.map(productCard).join('');
  bindAddButtons($('#related-grid'));
};

/* ---- Giỏ hàng ---- */
pages.cart = () => {
  const body = $('#cart-body');
  const layout = $('#cart-layout');

  function render() {
    const cart = getCart();
    if (!cart.length) {
      layout.innerHTML = '<div class="empty" style="grid-column:1/-1">Giỏ hàng của bạn đang trống.<br><br><a href="products.html" class="btn">Tiếp tục mua sắm</a></div>';
      return;
    }
    const { subtotal, shipping, total } = calcTotals();
    body.innerHTML = cart.map((it, idx) => {
      const p = getProduct(it.id);
      return `<tr>
        <td><div class="cart-item"><img src="${p.image}" alt=""><div><h3><a href="product-detail.html?id=${p.id}">${escapeHtml(p.name)}</a></h3><small>Size: ${it.size}</small></div></div></td>
        <td>${fmt(p.price)}</td>
        <td><div class="qty" style="margin:0"><button data-dec="${idx}">−</button><span>${it.qty}</span><button data-inc="${idx}">+</button></div></td>
        <td>${fmt(p.price * it.qty)}</td>
        <td><button class="remove" data-del="${idx}" title="Xóa">×</button></td>
      </tr>`;
    }).join('');
    $('#sum-sub').textContent = fmt(subtotal);
    $('#sum-ship').textContent = shipping === 0 ? 'Miễn phí' : fmt(shipping);
    $('#sum-total').textContent = fmt(total);
    const left = FREE_SHIP_FROM - subtotal;
    $('#sum-note').textContent = left > 0 ? `Mua thêm ${fmt(left)} để được miễn phí vận chuyển.` : 'Bạn được miễn phí vận chuyển tiêu chuẩn.';
  }

  body.addEventListener('click', e => {
    const cart = getCart();
    const t = e.target;
    if (t.dataset.inc !== undefined) {
      const it = cart[t.dataset.inc];
      if (it.qty + 1 > getProduct(it.id).stock) return toast('Đã đạt số lượng tồn kho');
      it.qty++;
    } else if (t.dataset.dec !== undefined) {
      const it = cart[t.dataset.dec];
      it.qty = Math.max(1, it.qty - 1);
    } else if (t.dataset.del !== undefined) {
      cart.splice(t.dataset.del, 1);
    } else return;
    saveCart(cart);
    render();
  });
  render();
};

/* ---- Thanh toán ---- */
pages.checkout = () => {
  if (!getCart().length) { location.href = 'cart.html'; return; }
  const user = currentUser();
  if (user) {
    $('#name').value = user.name || '';
    $('#email').value = user.email || '';
    $('#phone').value = user.phone || '';
  }

  $('#ship-options').innerHTML = Object.entries(SHIPPING).map(([k, v], i) =>
    `<label class="radio"><input type="radio" name="shipping" value="${k}" ${i === 0 ? 'checked' : ''}> ${v.label}<small>${v.fee}</small></label>`).join('');

  function renderSummary() {
    const shipKey = $('input[name="shipping"]:checked').value;
    const { subtotal, shipping, total } = calcTotals(shipKey);
    $('#mini-items').innerHTML = getCart().map(i => {
      const p = getProduct(i.id);
      return `<div class="mini-item"><span>${escapeHtml(p.name)} (${i.size}) × ${i.qty}</span><span>${fmt(p.price * i.qty)}</span></div>`;
    }).join('');
    $('#sum-sub').textContent = fmt(subtotal);
    $('#sum-ship').textContent = shipping === 0 ? 'Miễn phí' : fmt(shipping);
    $('#sum-total').textContent = fmt(total);
    $$('#ship-options small').forEach((s, i) => {
      const key = Object.keys(SHIPPING)[i];
      const free = key === 'standard' && subtotal >= FREE_SHIP_FROM;
      s.textContent = free ? 'Miễn phí' : fmt(SHIPPING[key].fee);
    });
  }
  $$('input[name="shipping"]').forEach(r => r.addEventListener('change', renderSummary));
  renderSummary();

  function validate() {
    let ok = true;
    const rules = {
      name: v => v.trim().length >= 2,
      email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
      phone: v => /^(0|\+84)\d{9}$/.test(v.replace(/\s/g, '')),
      address: v => v.trim().length >= 5,
      city: v => v.trim().length >= 2
    };
    Object.entries(rules).forEach(([id, test]) => {
      const f = $('#' + id).closest('.field');
      const valid = test($('#' + id).value);
      f.classList.toggle('invalid', !valid);
      if (!valid) ok = false;
    });
    return ok;
  }

  $('#checkout-form').addEventListener('submit', e => {
    e.preventDefault();
    if (!validate()) return toast('Vui lòng kiểm tra lại thông tin');
    const shipKey = $('input[name="shipping"]:checked').value;
    const totals = calcTotals(shipKey);
    const order = {
      id: 'TINH' + Date.now().toString().slice(-8),
      date: new Date().toISOString(),
      userEmail: currentUser()?.email || $('#email').value.trim().toLowerCase(),
      customer: { name: $('#name').value.trim(), email: $('#email').value.trim(), phone: $('#phone').value.trim(), address: $('#address').value.trim() + ', ' + $('#city').value.trim() },
      shippingMethod: shipKey,
      payment: $('input[name="payment"]:checked').value,
      note: $('#note').value.trim(),
      items: getCart().map(i => { const p = getProduct(i.id); return { id: p.id, name: p.name, size: i.size, qty: i.qty, price: p.price }; }),
      ...totals,
      status: 'Chờ xác nhận'
    };
    const orders = read('orders', []);
    orders.unshift(order);
    write('orders', orders);
    saveCart([]);
    location.href = 'account.html?new=' + order.id;
  });
};

/* ---- Đăng nhập / Đăng ký ---- */
pages.login = () => {
  if (currentUser()) { location.href = 'account.html'; return; }
  const loginForm = $('#login-form'), regForm = $('#register-form');

  $$('.tab').forEach(tab => tab.addEventListener('click', () => {
    $$('.tab').forEach(t => t.classList.toggle('active', t === tab));
    loginForm.hidden = tab.dataset.tab !== 'login';
    regForm.hidden = tab.dataset.tab !== 'register';
  }));

  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const email = $('#l-email').value.trim().toLowerCase();
    const pass = $('#l-pass').value;
    const user = getUsers().find(u => u.email === email && u.password === pass);
    if (!user) { $('#l-msg').textContent = 'Email hoặc mật khẩu không đúng.'; return; }
    write('currentUser', { name: user.name, email: user.email, phone: user.phone });
    location.href = param('next') || 'account.html';
  });

  regForm.addEventListener('submit', e => {
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
    users.push({ name, email, phone, password: pass }); // DEMO: thực tế phải băm mật khẩu ở backend
    write('users', users);
    write('currentUser', { name, email, phone });
    location.href = 'account.html';
  });
};

/* ---- Tài khoản ---- */
pages.account = () => {
  const user = currentUser();
  if (!user) { location.href = 'login.html'; return; }

  $('#profile').innerHTML = `
    <h3>${escapeHtml(user.name)}</h3>
    <p>${escapeHtml(user.email)}</p>
    <p>${escapeHtml(user.phone || '')}</p>
    <button class="btn btn-outline btn-block" id="logout">Đăng xuất</button>`;
  $('#logout').addEventListener('click', () => { localStorage.removeItem('currentUser'); location.href = 'index.html'; });

  const newId = param('new');
  if (newId) $('#alert').innerHTML = `<div class="alert">Đặt hàng thành công! Mã đơn của bạn: <strong>${escapeHtml(newId)}</strong>. TĨNH sẽ liên hệ xác nhận sớm nhất.</div>`;

  const statusClass = s => s === 'Đã hủy' ? 'cancel' : s === 'Đã giao' ? 'done' : '';
  const payLabel = { cod: 'Thanh toán khi nhận hàng', bank: 'Chuyển khoản ngân hàng', card: 'Thẻ tín dụng/ghi nợ' };

  function render() {
    const orders = read('orders', []).filter(o => o.userEmail === user.email.toLowerCase());
    const list = $('#orders');
    if (!orders.length) { list.innerHTML = '<p class="empty">Bạn chưa có đơn hàng nào. <a href="products.html"><u>Mua sắm ngay</u></a></p>'; return; }
    list.innerHTML = orders.map(o => `
      <div class="order">
        <div class="order-head">
          <span><strong>${o.id}</strong> · ${new Date(o.date).toLocaleString('vi-VN')}</span>
          <span class="status ${statusClass(o.status)}">${o.status}</span>
        </div>
        <div class="order-body">
          ${o.items.map(i => `<div class="mini-item"><span>${escapeHtml(i.name)} (${i.size}) × ${i.qty}</span><span>${fmt(i.price * i.qty)}</span></div>`).join('')}
          <div class="mini-item" style="color:#7a7a7a"><span>Phí vận chuyển</span><span>${o.shipping === 0 ? 'Miễn phí' : fmt(o.shipping)}</span></div>
          <div class="mini-item" style="color:#7a7a7a"><span>Thanh toán</span><span>${payLabel[o.payment] || o.payment}</span></div>
          <div class="mini-item" style="color:#7a7a7a"><span>Giao đến</span><span>${escapeHtml(o.customer.address)}</span></div>
        </div>
        <div class="order-foot">
          <strong>Tổng: ${fmt(o.total)}</strong>
          ${o.status === 'Chờ xác nhận' ? `<button class="btn btn-small btn-danger" data-cancel="${o.id}">Hủy đơn</button>` : ''}
        </div>
      </div>`).join('');
  }

  $('#orders').addEventListener('click', e => {
    const id = e.target.dataset.cancel;
    if (!id || !confirm('Bạn chắc chắn muốn hủy đơn hàng này?')) return;
    const orders = read('orders', []);
    const o = orders.find(x => x.id === id);
    if (o) o.status = 'Đã hủy';
    write('orders', orders);
    render();
  });
  render();
};

/* ============ Khởi chạy ============ */
document.addEventListener('DOMContentLoaded', () => {
  renderLayout();
  const fn = pages[document.body.dataset.page];
  if (fn) fn();
});