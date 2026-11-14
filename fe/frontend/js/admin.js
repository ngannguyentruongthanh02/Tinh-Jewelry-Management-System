/* =====================================================================
   KHU QUẢN TRỊ - TĨNH Jewelry (bản demo chạy trên trình duyệt)
   Tài khoản lấy từ bảng Admin trong SQL:
     admin    (Administrator)  - mật khẩu demo: admin123
     manager  (Manager)        - mật khẩu demo: manager123
   LƯU Ý: mật khẩu ở đây chỉ để thử giao diện. Khi có backend, việc đăng nhập
   phải kiểm tra băm mật khẩu (PasswordHash) ở phía máy chủ.
   ===================================================================== */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const fmt = n => Number(n).toLocaleString('vi-VN') + 'đ';
const read = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } };
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const STATUSES = ['Chờ xác nhận', 'Đang giao', 'Đã giao', 'Đã hủy'];
const ROLE_LABEL = { Administrator: 'Administrator', Manager: 'Manager' };
const LOW_STOCK = 5;

/* Quyền theo vai trò */
const PERMS = {
  Administrator: ['dashboard', 'orders', 'products', 'inventory', 'customers', 'admins', 'delete'],
  Manager: ['dashboard', 'orders', 'products', 'inventory', 'customers']
};
const can = (admin, perm) => (PERMS[admin.role] || []).includes(perm);

/* ---------- Dữ liệu quản trị viên (khớp INSERT INTO Admin) ---------- */
function seedAdmins() {
  if (read('admins', null)) return;
  write('admins', [
    { id: 1, fullName: 'Nguyen Van Admin', username: 'admin', password: 'admin123', email: 'admin@tinh.vn', role: 'Administrator' },
    { id: 2, fullName: 'Tran Thi Manager', username: 'manager', password: 'manager123', email: 'manager@tinh.vn', role: 'Manager' }
  ]);
}
const getAdmins = () => read('admins', []);
const saveProducts = () => write('products', PRODUCTS);
const getOrders = () => read('orders', []);
const saveOrders = o => write('orders', o);
const imgSrc = p => /^(https?:|data:)/.test(p.image) ? p.image : '../' + p.image;

function toast(msg) {
  let t = $('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2200);
}

const page = document.body.dataset.page;
seedAdmins();

/* =====================================================================
   TRANG ĐĂNG NHẬP QUẢN TRỊ
   ===================================================================== */
if (page === 'admin-login') {
  if (read('currentAdmin', null)) location.href = 'index.html';

  $('#admin-login-form').addEventListener('submit', e => {
    e.preventDefault();
    const username = $('#a-user').value.trim().toLowerCase();
    const password = $('#a-pass').value;
    const msg = $('#a-msg');
    if (!username || !password) { msg.textContent = 'Vui lòng nhập tên đăng nhập và mật khẩu.'; return; }
    const a = getAdmins().find(x => x.username.toLowerCase() === username && x.password === password);
    if (!a) { msg.textContent = 'Tên đăng nhập hoặc mật khẩu không đúng.'; return; }
    write('currentAdmin', { id: a.id });
    location.href = 'index.html';
  });
}

/* =====================================================================
   TRANG QUẢN TRỊ
   ===================================================================== */
/* Kiểm tra đăng nhập (lấy lại thông tin mới nhất từ danh sách admin) */
const _session = read('currentAdmin', null);
const _me = _session && getAdmins().find(a => a.id === _session.id);
if (page === 'admin' && !_me) { localStorage.removeItem('currentAdmin'); location.href = 'login.html'; }

if (page === 'admin' && _me) {
  const me = _me;

  const SECTIONS = [
    { key: 'dashboard', label: 'Tổng quan' },
    { key: 'orders', label: 'Đơn hàng' },
    { key: 'products', label: 'Sản phẩm' },
    { key: 'inventory', label: 'Tồn kho' },
    { key: 'customers', label: 'Khách hàng' },
    { key: 'admins', label: 'Quản trị viên' }
  ].filter(s => can(me, s.key));

  $('#who').innerHTML = `<strong>${esc(me.fullName)}</strong>${esc(me.email)}<br><span class="pill ${me.role === 'Administrator' ? 'admin' : ''}" style="margin-top:6px">${ROLE_LABEL[me.role]}</span>`;
  $('#logout').addEventListener('click', () => { localStorage.removeItem('currentAdmin'); location.href = 'login.html'; });
  $('#side-toggle').addEventListener('click', () => $('#sidebar').classList.toggle('open'));

  function renderNav(active) {
    const pending = getOrders().filter(o => o.status === 'Chờ xác nhận').length;
    $('#side-nav').innerHTML = SECTIONS.map(s =>
      `<a href="#${s.key}" class="${s.key === active ? 'active' : ''}">${s.label}${s.key === 'orders' && pending ? `<span class="count">${pending}</span>` : ''}</a>`).join('');
  }

  /* ---------- Modal ---------- */
  const modal = $('#modal');
  function openModal(title, html) { $('#modal-title').textContent = title; $('#modal-body').innerHTML = html; modal.hidden = false; }
  function closeModal() { modal.hidden = true; $('#modal-body').innerHTML = ''; }
  $('#modal-close').addEventListener('click', closeModal);
  modal.addEventListener('mousedown', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  /* ---------- Bộ định tuyến ---------- */
  const views = {};
  function route() {
    let key = location.hash.slice(1);
    if (!SECTIONS.some(s => s.key === key)) key = 'dashboard';
    closeModal();
    $('#sidebar').classList.remove('open');
    $('#page-title').textContent = SECTIONS.find(s => s.key === key).label;
    renderNav(key);
    views[key]();
  }
  window.addEventListener('hashchange', route);
  const refresh = () => route();

  const statusClass = s => s === 'Đã hủy' ? 'cancel' : s === 'Đã giao' ? 'done' : '';
  const orderTotals = () => {
    const valid = getOrders().filter(o => o.status !== 'Đã hủy');
    return { revenue: valid.reduce((s, o) => s + o.total, 0), count: getOrders().length };
  };

  /* ---------- Tổng quan ---------- */
  views.dashboard = () => {
    const orders = getOrders();
    const { revenue } = orderTotals();
    const pending = orders.filter(o => o.status === 'Chờ xác nhận').length;
    const low = PRODUCTS.filter(p => p.stock <= LOW_STOCK);
    $('#view').innerHTML = `
      <div class="stats">
        <div class="stat"><small>Doanh thu</small><strong>${fmt(revenue)}</strong></div>
        <div class="stat"><small>Tổng đơn hàng</small><strong>${orders.length}</strong></div>
        <div class="stat ${pending ? 'warn' : ''}"><small>Chờ xác nhận</small><strong>${pending}</strong></div>
        <div class="stat ${low.length ? 'warn' : ''}"><small>Sắp hết hàng</small><strong>${low.length}</strong></div>
      </div>
      <div class="cols">
        <div class="card"><h2>Đơn hàng mới nhất</h2>
          ${orders.length ? `<table class="data"><thead><tr><th>Mã</th><th>Khách</th><th>Tổng</th><th>Trạng thái</th></tr></thead><tbody>
            ${orders.slice(0, 5).map(o => `<tr><td>${esc(o.id)}</td><td>${esc(o.customer.name)}</td><td>${fmt(o.total)}</td><td><span class="status ${statusClass(o.status)}">${o.status}</span></td></tr>`).join('')}
          </tbody></table>` : '<p class="none">Chưa có đơn hàng.</p>'}
        </div>
        <div class="card"><h2>Cảnh báo tồn kho (≤ ${LOW_STOCK})</h2>
          ${low.length ? `<table class="data"><thead><tr><th>Sản phẩm</th><th>Còn lại</th></tr></thead><tbody>
            ${low.map(p => `<tr><td>${esc(p.name)}</td><td class="low">${p.stock}</td></tr>`).join('')}
          </tbody></table>` : '<p class="none">Tồn kho ổn định.</p>'}
        </div>
      </div>`;
  };

  /* ---------- Đơn hàng ---------- */
  const orderFilter = { status: 'all', q: '' };
  views.orders = () => {
    $('#view').innerHTML = `
      <div class="bar">
        <input class="input" id="o-q" type="search" placeholder="Tìm mã đơn, tên, SĐT..." value="${esc(orderFilter.q)}">
        <select class="input" id="o-status">
          <option value="all">Tất cả trạng thái</option>
          ${STATUSES.map(s => `<option ${orderFilter.status === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </div>
      <div class="table-wrap" id="o-table"></div>`;
    $('#o-q').addEventListener('input', e => { orderFilter.q = e.target.value; drawOrders(); });
    $('#o-status').addEventListener('change', e => { orderFilter.status = e.target.value; drawOrders(); });
    drawOrders();
  };

  function drawOrders() {
    const q = orderFilter.q.trim().toLowerCase();
    const list = getOrders().filter(o =>
      (orderFilter.status === 'all' || o.status === orderFilter.status) &&
      (!q || [o.id, o.customer.name, o.customer.phone, o.customer.email].some(v => String(v).toLowerCase().includes(q))));
    $('#o-table').innerHTML = list.length ? `<table class="data"><thead><tr>
        <th>Mã đơn</th><th>Ngày đặt</th><th>Khách hàng</th><th>Tổng tiền</th><th>Trạng thái</th><th></th></tr></thead><tbody>
      ${list.map(o => `<tr>
        <td><strong>${esc(o.id)}</strong></td>
        <td>${new Date(o.date).toLocaleString('vi-VN')}</td>
        <td>${esc(o.customer.name)}<br><span class="muted">${esc(o.customer.phone)}</span></td>
        <td>${fmt(o.total)}</td>
        <td><span class="status ${statusClass(o.status)}">${o.status}</span></td>
        <td><button class="link-btn" data-view="${esc(o.id)}">Chi tiết</button></td></tr>`).join('')}
      </tbody></table>` : '<p class="none">Không có đơn hàng phù hợp.</p>';
    $$('[data-view]', $('#o-table')).forEach(b => b.addEventListener('click', () => orderDetail(b.dataset.view)));
  }

  const PAY = { cod: 'Thanh toán khi nhận hàng', bank: 'Chuyển khoản ngân hàng', card: 'Thẻ tín dụng/ghi nợ' };
  function orderDetail(id) {
    const o = getOrders().find(x => x.id === id);
    if (!o) return;
    const locked = o.status === 'Đã hủy';
    openModal('Đơn ' + o.id, `
      <div class="detail-row"><span>Khách hàng</span><span>${esc(o.customer.name)}</span></div>
      <div class="detail-row"><span>Liên hệ</span><span>${esc(o.customer.phone)} · ${esc(o.customer.email)}</span></div>
      <div class="detail-row"><span>Giao đến</span><span>${esc(o.customer.address)}</span></div>
      <div class="detail-row"><span>Thanh toán</span><span>${PAY[o.payment] || esc(o.payment)}</span></div>
      ${o.note ? `<div class="detail-row"><span>Ghi chú</span><span>${esc(o.note)}</span></div>` : ''}
      <div style="margin:16px 0">
        ${o.items.map(i => `<div class="detail-row"><span>${esc(i.name)} (${esc(i.size)}) × ${i.qty}</span><span>${fmt(i.price * i.qty)}</span></div>`).join('')}
        <div class="detail-row"><span>Phí vận chuyển</span><span>${o.shipping ? fmt(o.shipping) : 'Miễn phí'}</span></div>
        <div class="detail-row"><strong>Tổng cộng</strong><strong>${fmt(o.total)}</strong></div>
      </div>
      <div class="field"><label for="o-new-status">Cập nhật trạng thái</label>
        <select class="input" id="o-new-status" ${locked ? 'disabled' : ''}>${STATUSES.map(s => `<option ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}</select>
        ${locked ? '<p class="muted" style="font-size:12px;margin-top:6px">Đơn đã hủy không thể thay đổi.</p>' : ''}
      </div>
      <div class="modal-actions">
        <button class="btn btn-outline btn-small" id="m-close">Đóng</button>
        ${locked ? '' : '<button class="btn btn-small" id="m-save">Lưu trạng thái</button>'}
      </div>`);
    $('#m-close').addEventListener('click', closeModal);
    if (!locked) $('#m-save').addEventListener('click', () => {
      const next = $('#o-new-status').value;
      if (next === o.status) return closeModal();
      if (next === 'Đã hủy') {
        if (!confirm('Hủy đơn này? Số lượng sản phẩm sẽ được hoàn lại vào kho và không thể hoàn tác.')) return;
        o.items.forEach(i => { const p = PRODUCTS.find(x => x.id === i.id); if (p) p.stock += i.qty; });
        saveProducts();
      }
      const all = getOrders();
      all.find(x => x.id === id).status = next;
      saveOrders(all);
      toast('Đã cập nhật đơn ' + id);
      closeModal(); refresh();
    });
  }

  /* ---------- Sản phẩm ---------- */
  const prodFilter = { q: '', cat: 'all' };
  views.products = () => {
    $('#view').innerHTML = `
      <div class="bar">
        <input class="input" id="p-q" type="search" placeholder="Tìm sản phẩm..." value="${esc(prodFilter.q)}">
        <select class="input" id="p-cat"><option value="all">Tất cả loại</option>
          ${Object.entries(CATEGORIES).map(([k, v]) => `<option value="${k}" ${prodFilter.cat === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
        <span class="spacer"></span>
        <button class="btn btn-small" id="p-add">+ Thêm sản phẩm</button>
      </div>
      <div class="table-wrap" id="p-table"></div>`;
    $('#p-q').addEventListener('input', e => { prodFilter.q = e.target.value; drawProducts(); });
    $('#p-cat').addEventListener('change', e => { prodFilter.cat = e.target.value; drawProducts(); });
    $('#p-add').addEventListener('click', () => productForm());
    drawProducts();
  };

  function drawProducts() {
    const q = prodFilter.q.trim().toLowerCase();
    const list = PRODUCTS.filter(p => (prodFilter.cat === 'all' || p.category === prodFilter.cat) && p.name.toLowerCase().includes(q));
    $('#p-table').innerHTML = list.length ? `<table class="data"><thead><tr>
        <th></th><th>Tên sản phẩm</th><th>Loại</th><th>Giá</th><th>Tồn kho</th><th></th></tr></thead><tbody>
      ${list.map(p => `<tr>
        <td><img src="${esc(imgSrc(p))}" alt=""></td>
        <td><strong>${esc(p.name)}</strong></td>
        <td>${CATEGORIES[p.category] || esc(p.category)}</td>
        <td>${fmt(p.price)}</td>
        <td class="${p.stock <= LOW_STOCK ? 'low' : ''}">${p.stock}${p.stock === 0 ? ' (hết)' : ''}</td>
        <td><div class="actions">
          <button class="link-btn" data-edit="${p.id}">Sửa</button>
          ${can(me, 'delete') ? `<button class="link-btn danger" data-del="${p.id}">Xóa</button>` : ''}
        </div></td></tr>`).join('')}
      </tbody></table>` : '<p class="none">Không có sản phẩm phù hợp.</p>';
    $$('[data-edit]', $('#p-table')).forEach(b => b.addEventListener('click', () => productForm(Number(b.dataset.edit))));
    $$('[data-del]', $('#p-table')).forEach(b => b.addEventListener('click', () => {
      const p = PRODUCTS.find(x => x.id === Number(b.dataset.del));
      if (!p || !confirm(`Xóa sản phẩm "${p.name}"?`)) return;
      PRODUCTS.splice(PRODUCTS.indexOf(p), 1);
      saveProducts(); toast('Đã xóa sản phẩm'); refresh();
    }));
  }

  function productForm(id) {
    const p = id ? PRODUCTS.find(x => x.id === id) : { name: '', category: 'ring', price: '', stock: 0, image: 'images/ring-1.svg', desc: '', material: 'Bạc 925', weight: '' };
    const images = [...new Set(DEFAULT_PRODUCTS.map(x => x.image))];
    openModal(id ? 'Sửa sản phẩm' : 'Thêm sản phẩm', `
      <form id="p-form" novalidate>
        <div class="form-grid">
          <div class="field full"><label for="f-name">Tên sản phẩm</label><input class="input" id="f-name" value="${esc(p.name)}"><div class="error">Vui lòng nhập tên</div></div>
          <div class="field"><label for="f-cat">Loại</label><select class="input" id="f-cat">${Object.entries(CATEGORIES).map(([k, v]) => `<option value="${k}" ${p.category === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
          <div class="field"><label for="f-price">Giá (VNĐ)</label><input class="input" id="f-price" type="number" min="0" step="1000" value="${esc(p.price)}"><div class="error">Giá phải lớn hơn 0</div></div>
          <div class="field"><label for="f-stock">Tồn kho</label><input class="input" id="f-stock" type="number" min="0" step="1" value="${esc(p.stock)}"><div class="error">Số lượng không hợp lệ</div></div>
          <div class="field"><label for="f-weight">Trọng lượng</label><input class="input" id="f-weight" placeholder="VD: 2.1g" value="${esc(p.weight)}"></div>
          <div class="field"><label for="f-material">Chất liệu</label><input class="input" id="f-material" value="${esc(p.material)}"></div>
          <div class="field"><label for="f-image">Đường dẫn ảnh</label><input class="input" id="f-image" list="img-list" value="${esc(p.image)}"><datalist id="img-list">${images.map(i => `<option value="${i}">`).join('')}</datalist></div>
          <div class="field full"><label for="f-desc">Mô tả</label><textarea class="input" id="f-desc" rows="3">${esc(p.desc)}</textarea></div>
        </div>
        <p class="muted" style="font-size:12px;margin-bottom:14px">Ảnh mới: bỏ file vào thư mục <code>frontend/images</code> rồi nhập <code>images/ten-file.jpg</code>.</p>
        <div class="modal-actions"><button type="button" class="btn btn-outline btn-small" id="m-close">Hủy</button><button class="btn btn-small" type="submit">Lưu</button></div>
      </form>`);
    $('#m-close').addEventListener('click', closeModal);
    $('#p-form').addEventListener('submit', e => {
      e.preventDefault();
      const v = {
        name: $('#f-name').value.trim(), category: $('#f-cat').value, price: Number($('#f-price').value),
        stock: Number($('#f-stock').value), weight: $('#f-weight').value.trim(), material: $('#f-material').value.trim() || 'Bạc 925',
        image: $('#f-image').value.trim() || 'images/ring-1.svg', desc: $('#f-desc').value.trim()
      };
      const bad = { 'f-name': !v.name, 'f-price': !(v.price > 0), 'f-stock': !Number.isInteger(v.stock) || v.stock < 0 };
      Object.entries(bad).forEach(([k, b]) => $('#' + k).closest('.field').classList.toggle('invalid', b));
      if (Object.values(bad).some(Boolean)) return;
      if (id) Object.assign(p, v);
      else PRODUCTS.push({ id: PRODUCTS.reduce((m, x) => Math.max(m, x.id), 0) + 1, ...v });
      saveProducts(); toast(id ? 'Đã cập nhật sản phẩm' : 'Đã thêm sản phẩm'); closeModal(); refresh();
    });
  }

  /* ---------- Tồn kho ---------- */
  let onlyLow = false;
  views.inventory = () => {
    $('#view').innerHTML = `
      <div class="bar">
        <label style="display:flex;gap:8px;align-items:center;cursor:pointer"><input type="checkbox" id="i-low" ${onlyLow ? 'checked' : ''}> Chỉ hiện sản phẩm sắp hết (≤ ${LOW_STOCK})</label>
      </div>
      <div class="table-wrap" id="i-table"></div>`;
    $('#i-low').addEventListener('change', e => { onlyLow = e.target.checked; drawInventory(); });
    drawInventory();
  };

  function drawInventory() {
    const list = PRODUCTS.filter(p => !onlyLow || p.stock <= LOW_STOCK);
    $('#i-table').innerHTML = list.length ? `<table class="data"><thead><tr><th></th><th>Sản phẩm</th><th>Loại</th><th>Tồn hiện tại</th><th>Cập nhật số lượng</th></tr></thead><tbody>
      ${list.map(p => `<tr>
        <td><img src="${esc(imgSrc(p))}" alt=""></td>
        <td><strong>${esc(p.name)}</strong></td>
        <td>${CATEGORIES[p.category] || ''}</td>
        <td class="${p.stock <= LOW_STOCK ? 'low' : ''}">${p.stock}</td>
        <td><div class="actions"><input class="stock-input" type="number" min="0" step="1" value="${p.stock}" data-stock-for="${p.id}"><button class="link-btn" data-save="${p.id}">Lưu</button></div></td></tr>`).join('')}
      </tbody></table>` : '<p class="none">Không có sản phẩm nào sắp hết hàng.</p>';
    $$('[data-save]', $('#i-table')).forEach(b => b.addEventListener('click', () => {
      const id = Number(b.dataset.save);
      const val = Number($(`[data-stock-for="${id}"]`).value);
      if (!Number.isInteger(val) || val < 0) return toast('Số lượng không hợp lệ');
      PRODUCTS.find(x => x.id === id).stock = val;
      saveProducts(); toast('Đã cập nhật tồn kho'); refresh();
    }));
  }

  /* ---------- Khách hàng ---------- */
  views.customers = () => {
    const users = read('users', []);
    const orders = getOrders();
    $('#view').innerHTML = `<div class="table-wrap">${users.length ? `<table class="data"><thead><tr>
        <th>Họ tên</th><th>Email</th><th>Số điện thoại</th><th>Số đơn</th><th>Đã chi tiêu</th></tr></thead><tbody>
      ${users.map(u => {
        const mine = orders.filter(o => o.userEmail === u.email.toLowerCase());
        return `<tr><td><strong>${esc(u.name)}</strong></td><td>${esc(u.email)}</td><td>${esc(u.phone)}</td><td>${mine.length}</td>
          <td>${fmt(mine.filter(o => o.status !== 'Đã hủy').reduce((s, o) => s + o.total, 0))}</td></tr>`;
      }).join('')}</tbody></table>` : '<p class="none">Chưa có khách hàng đăng ký.</p>'}</div>`;
  };

  /* ---------- Quản trị viên (chỉ Administrator) ---------- */
  views.admins = () => {
    const list = getAdmins();
    $('#view').innerHTML = `
      <div class="bar"><span class="spacer"></span><button class="btn btn-small" id="ad-add">+ Thêm quản trị viên</button></div>
      <div class="table-wrap"><table class="data"><thead><tr><th>Họ tên</th><th>Tên đăng nhập</th><th>Email</th><th>Vai trò</th><th></th></tr></thead><tbody>
      ${list.map(a => `<tr>
        <td><strong>${esc(a.fullName)}</strong>${a.id === me.id ? ' <span class="muted">(bạn)</span>' : ''}</td>
        <td>${esc(a.username)}</td><td>${esc(a.email)}</td>
        <td><span class="pill ${a.role === 'Administrator' ? 'admin' : ''}">${a.role}</span></td>
        <td><div class="actions"><button class="link-btn" data-aedit="${a.id}">Sửa</button>
          ${a.id !== me.id ? `<button class="link-btn danger" data-adel="${a.id}">Xóa</button>` : ''}</div></td></tr>`).join('')}
      </tbody></table></div>
      <p class="muted" style="margin-top:14px;font-size:13px">Vai trò <strong>Administrator</strong> có toàn quyền. <strong>Manager</strong> quản lý đơn hàng, sản phẩm, tồn kho nhưng không xóa sản phẩm và không quản lý tài khoản quản trị.</p>`;
    $('#ad-add').addEventListener('click', () => adminForm());
    $$('[data-aedit]').forEach(b => b.addEventListener('click', () => adminForm(Number(b.dataset.aedit))));
    $$('[data-adel]').forEach(b => b.addEventListener('click', () => {
      const id = Number(b.dataset.adel);
      const a = getAdmins().find(x => x.id === id);
      if (!a || !confirm(`Xóa tài khoản "${a.username}"?`)) return;
      write('admins', getAdmins().filter(x => x.id !== id));
      toast('Đã xóa tài khoản'); refresh();
    }));
  };

  function adminForm(id) {
    const a = id ? getAdmins().find(x => x.id === id) : { fullName: '', username: '', email: '', role: 'Manager' };
    openModal(id ? 'Sửa quản trị viên' : 'Thêm quản trị viên', `
      <form id="ad-form" novalidate>
        <div class="field"><label for="g-name">Họ và tên</label><input class="input" id="g-name" value="${esc(a.fullName)}"><div class="error">Vui lòng nhập họ tên</div></div>
        <div class="field"><label for="g-user">Tên đăng nhập</label><input class="input" id="g-user" value="${esc(a.username)}" ${id ? 'readonly' : ''}><div class="error" id="g-user-err">Tên đăng nhập không hợp lệ hoặc đã tồn tại</div></div>
        <div class="field"><label for="g-email">Email</label><input class="input" id="g-email" type="email" value="${esc(a.email)}"><div class="error">Email không hợp lệ</div></div>
        <div class="field"><label for="g-role">Vai trò</label><select class="input" id="g-role" ${id === me.id ? 'disabled' : ''}>
          ${['Administrator', 'Manager'].map(r => `<option ${a.role === r ? 'selected' : ''}>${r}</option>`).join('')}</select></div>
        <div class="field"><label for="g-pass">Mật khẩu ${id ? '(để trống nếu không đổi)' : '(tối thiểu 6 ký tự)'}</label><input class="input" id="g-pass" type="password" autocomplete="new-password"><div class="error">Mật khẩu tối thiểu 6 ký tự</div></div>
        <div class="modal-actions"><button type="button" class="btn btn-outline btn-small" id="m-close">Hủy</button><button class="btn btn-small" type="submit">Lưu</button></div>
      </form>`);
    $('#m-close').addEventListener('click', closeModal);
    $('#ad-form').addEventListener('submit', e => {
      e.preventDefault();
      const all = getAdmins();
      const v = { fullName: $('#g-name').value.trim(), username: $('#g-user').value.trim(), email: $('#g-email').value.trim(), role: $('#g-role').value, pass: $('#g-pass').value };
      const bad = {
        'g-name': v.fullName.length < 2,
        'g-user': !/^[A-Za-z0-9_.]{3,30}$/.test(v.username) || (!id && all.some(x => x.username.toLowerCase() === v.username.toLowerCase())),
        'g-email': !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email),
        'g-pass': (!id && v.pass.length < 6) || (id && v.pass && v.pass.length < 6)
      };
      Object.entries(bad).forEach(([k, b]) => $('#' + k).closest('.field').classList.toggle('invalid', b));
      if (Object.values(bad).some(Boolean)) return;
      /* Không cho hạ quyền Administrator cuối cùng */
      if (id && a.role === 'Administrator' && v.role !== 'Administrator' && all.filter(x => x.role === 'Administrator').length <= 1)
        return toast('Phải còn ít nhất một Administrator');
      if (id) {
        Object.assign(all.find(x => x.id === id), { fullName: v.fullName, email: v.email, role: id === me.id ? me.role : v.role });
        if (v.pass) all.find(x => x.id === id).password = v.pass;
      } else {
        all.push({ id: all.reduce((m, x) => Math.max(m, x.id), 0) + 1, fullName: v.fullName, username: v.username, email: v.email, role: v.role, password: v.pass });
      }
      write('admins', all); toast('Đã lưu tài khoản'); closeModal(); refresh();
    });
  }

  route();
}
