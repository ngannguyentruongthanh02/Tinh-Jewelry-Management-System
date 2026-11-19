/* =====================================================================
   KHU QUẢN TRỊ - TĨNH Jewelry
   Tích hợp Backend RESTful API (Node.js & SQL Server) + Fallback mượt mà
   Tài khoản quản trị:
     admin    (Administrator)  - Mật khẩu: admin123
     manager  (Manager)        - Mật khẩu: manager123
   ===================================================================== */

const API_BASE = 'http://localhost:5000/api';
let isBackendOnline = false;

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const fmt = n => Number(n).toLocaleString('vi-VN') + 'đ';
const read = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } };
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const STATUSES = ['Chờ xác nhận', 'Đã xác nhận', 'Đang giao', 'Đã giao', 'Đã hủy'];
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

function toast(msg, type = 'info') {
  let t = $('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.remove('error', 'success');
  if (type === 'error') t.classList.add('error');
  if (type === 'success') t.classList.add('success');
  t.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2500);
}

/* =====================================================================
   ĐỒNG BỘ DỮ LIỆU VỚI BACKEND RESTful API (NODE.JS + SQL SERVER)
   ===================================================================== */
async function syncWithBackend() {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2000);

    const [pRes, oRes] = await Promise.all([
      fetch(`${API_BASE}/products`, { signal: ctrl.signal }).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${API_BASE}/orders`, { signal: ctrl.signal }).then(r => r.ok ? r.json() : null).catch(() => null)
    ]);
    clearTimeout(timer);

    if (pRes && pRes.data && Array.isArray(pRes.data)) {
      isBackendOnline = true;
      pRes.data.forEach(apiP => {
        const id = apiP.ProductID || apiP.id;
        const existing = PRODUCTS.find(x => x.id === id);
        const mapped = {
          id: id,
          code: apiP.ProductCode || apiP.code || ('SP0' + id),
          name: apiP.ProductName || apiP.name,
          category: apiP.CategoryID === 1 ? 'bracelet' : apiP.CategoryID === 2 ? 'necklace' : (apiP.CategoryID === 3 ? 'diy' : (apiP.category || 'ring')),
          price: Number(apiP.Price || apiP.price || 0),
          stock: Number(apiP.StockQuantity !== undefined ? apiP.StockQuantity : (apiP.stock || 0)),
          material: apiP.Material || apiP.material || 'Bạc 925',
          weight: apiP.Size || apiP.weight || 'Free size',
          image: apiP.ImageURL || apiP.image || 'images/bracelet-1.svg',
          desc: apiP.Description || apiP.desc || ''
        };
        if (existing) Object.assign(existing, mapped);
        else PRODUCTS.push(mapped);
      });
      saveProducts();
    }

    if (oRes && oRes.data && Array.isArray(oRes.data)) {
      isBackendOnline = true;
      const allOrders = getOrders();
      oRes.data.forEach(apiO => {
        const ordId = apiO.OrderCode || apiO.id || ('ORD' + apiO.OrderID);
        const existing = allOrders.find(x => x.id === ordId || x.orderCode === ordId);
        const mapped = {
          id: ordId,
          orderCode: ordId,
          orderId: apiO.OrderID,
          date: apiO.CreatedAt || apiO.date || new Date().toISOString(),
          customer: apiO.customer || {
            name: apiO.ReceiverName || apiO.CustomerName || 'Khách hàng',
            phone: apiO.ReceiverPhone || apiO.CustomerPhone || '',
            email: apiO.CustomerEmail || '',
            address: apiO.ShippingAddress || ''
          },
          items: (apiO.items || []).map(it => ({
            id: it.ProductID || it.id,
            name: it.ProductName || it.name,
            size: it.Size || it.size || 'Free size',
            qty: it.Quantity || it.qty || 1,
            price: Number(it.UnitPrice || it.price || 0)
          })),
          subtotal: Number(apiO.SubTotal || apiO.subTotal || apiO.total || 0),
          shipping: Number(apiO.ShippingFee || apiO.shippingFee || 0),
          total: Number(apiO.TotalAmount || apiO.total || 0),
          payment: apiO.payment || 'COD',
          status: apiO.OrderStatus || apiO.status || 'Chờ xác nhận'
        };
        if (existing) Object.assign(existing, mapped);
        else allOrders.unshift(mapped);
      });
      saveOrders(allOrders);
    }
  } catch (err) {
    isBackendOnline = false;
  }
  updateApiStatusBadge();
}

function updateApiStatusBadge() {
  let badge = $('#api-status-badge');
  if (!badge) {
    badge = document.createElement('div');
    badge.id = 'api-status-badge';
    badge.className = 'api-badge';
    const topBar = $('.admin-top');
    if (topBar) topBar.appendChild(badge);
  }
  if (isBackendOnline) {
    badge.className = 'api-badge online';
    badge.innerHTML = `<span class="api-dot"></span> Backend API: Online (Port 5000)`;
    badge.title = 'Hệ thống đang kết nối trực tiếp với Node.js Backend Server và SQL Server';
  } else {
    badge.className = 'api-badge offline';
    badge.innerHTML = `<span class="api-dot"></span> Chế độ Offline`;
    badge.title = 'Chưa bật server Node.js hoặc port 5000 chưa mở, giao diện đang chạy offline';
  }
}

const page = document.body.dataset.page;
seedAdmins();

/* =====================================================================
   TRANG ĐĂNG NHẬP QUẢN TRỊ
   ===================================================================== */
if (page === 'admin-login') {
  if (read('currentAdmin', null)) location.href = 'index.html';

  $('#admin-login-form').addEventListener('submit', async e => {
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
  async function route() {
    let key = location.hash.slice(1);
    if (!SECTIONS.some(s => s.key === key)) key = 'dashboard';
    closeModal();
    $('#sidebar').classList.remove('open');
    $('#page-title').textContent = SECTIONS.find(s => s.key === key).label;
    renderNav(key);
    updateApiStatusBadge();
    views[key]();
  }
  window.addEventListener('hashchange', route);
  const refresh = () => route();

  const statusClass = s => {
    if (s === 'Đã hủy') return 'cancel';
    if (s === 'Đã giao') return 'done';
    if (s === 'Đã xác nhận') return 'confirmed';
    if (s === 'Chờ xác nhận') return 'pending';
    return '';
  };

  const orderTotals = () => {
    const valid = getOrders().filter(o => o.status !== 'Đã hủy');
    return { revenue: valid.reduce((s, o) => s + (o.total || 0), 0), count: getOrders().length };
  };

  /* ---------- 1. Tổng quan (Dashboard) ---------- */
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
          ${orders.length ? `<table class="data"><thead><tr><th>Mã</th><th>Khách</th><th>Tổng</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>
            ${orders.slice(0, 5).map(o => `<tr>
              <td><strong>${esc(o.id)}</strong></td>
              <td>${esc(o.customer?.name || '')}</td>
              <td>${fmt(o.total)}</td>
              <td><span class="status ${statusClass(o.status)}">${o.status}</span></td>
              <td>
                ${o.status === 'Chờ xác nhận' ? `<button class="btn btn-small btn-approve" data-approve="${esc(o.id)}" style="padding:3px 8px;font-size:12px">✓ Duyệt đơn</button>` : ''}
                <button class="link-btn" data-view="${esc(o.id)}">Chi tiết</button>
              </td>
            </tr>`).join('')}
          </tbody></table>` : '<p class="none">Chưa có đơn hàng.</p>'}
        </div>
        <div class="card"><h2>Cảnh báo tồn kho (≤ ${LOW_STOCK})</h2>
          ${low.length ? `<table class="data"><thead><tr><th>Sản phẩm</th><th>Còn lại</th></tr></thead><tbody>
            ${low.map(p => `<tr><td>${esc(p.name)}</td><td class="low">${p.stock}</td></tr>`).join('')}
          </tbody></table>` : '<p class="none">Tồn kho ổn định.</p>'}
        </div>
      </div>`;

    $$('[data-view]', $('#view')).forEach(b => b.addEventListener('click', () => orderDetail(b.dataset.view)));
    $$('[data-approve]', $('#view')).forEach(b => b.addEventListener('click', () => quickApproveOrder(b.dataset.approve)));
  };

  /* ---------- 2. Quản lý & Duyệt đơn hàng ---------- */
  const orderFilter = { status: 'all', q: '' };
  views.orders = () => {
    $('#view').innerHTML = `
      <div class="bar">
        <input class="input" id="o-q" type="search" placeholder="Tìm mã đơn, tên khách, SĐT..." value="${esc(orderFilter.q)}">
        <select class="input" id="o-status">
          <option value="all">Tất cả trạng thái</option>
          ${STATUSES.map(s => `<option ${orderFilter.status === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
        <span class="spacer"></span>
        <button class="btn btn-small btn-outline" id="o-refresh">↻ Làm mới</button>
      </div>
      <div class="table-wrap" id="o-table"></div>`;

    $('#o-q').addEventListener('input', e => { orderFilter.q = e.target.value; drawOrders(); });
    $('#o-status').addEventListener('change', e => { orderFilter.status = e.target.value; drawOrders(); });
    $('#o-refresh').addEventListener('click', async () => {
      toast('Đang đồng bộ đơn hàng từ máy chủ...');
      await syncWithBackend();
      drawOrders();
    });
    drawOrders();
  };

  function drawOrders() {
    const q = orderFilter.q.trim().toLowerCase();
    const list = getOrders().filter(o =>
      (orderFilter.status === 'all' || o.status === orderFilter.status) &&
      (!q || [o.id, o.customer?.name, o.customer?.phone, o.customer?.email].some(v => String(v || '').toLowerCase().includes(q))));

    $('#o-table').innerHTML = list.length ? `<table class="data"><thead><tr>
        <th>Mã đơn</th><th>Ngày đặt</th><th>Khách hàng</th><th>Tổng tiền</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>
      ${list.map(o => `<tr>
        <td><strong>${esc(o.id)}</strong></td>
        <td>${new Date(o.date).toLocaleString('vi-VN')}</td>
        <td>${esc(o.customer?.name || 'Khách hàng')}<br><span class="muted">${esc(o.customer?.phone || '')}</span></td>
        <td><strong>${fmt(o.total)}</strong></td>
        <td><span class="status ${statusClass(o.status)}">${o.status}</span></td>
        <td>
          <div class="actions">
            ${o.status === 'Chờ xác nhận' ? `<button class="btn btn-small btn-approve" data-approve="${esc(o.id)}">✓ Duyệt đơn</button>` : ''}
            <button class="link-btn" data-view="${esc(o.id)}">Chi tiết</button>
          </div>
        </td></tr>`).join('')}
      </tbody></table>` : '<p class="none">Không có đơn hàng phù hợp.</p>';

    $$('[data-view]', $('#o-table')).forEach(b => b.addEventListener('click', () => orderDetail(b.dataset.view)));
    $$('[data-approve]', $('#o-table')).forEach(b => b.addEventListener('click', () => quickApproveOrder(b.dataset.approve)));
  }

  // Duyệt đơn hàng nhanh (Chờ xác nhận -> Đã xác nhận)
  async function quickApproveOrder(id) {
    if (!confirm(`Bạn có chắc chắn muốn DUYỆT đơn hàng [${id}]?`)) return;
    await apiUpdateOrderStatus(id, 'Đã xác nhận');
  }

  // API Cập nhật trạng thái / Duyệt đơn hàng
  async function apiUpdateOrderStatus(id, newStatus, cancelReason) {
    try {
      const res = await fetch(`${API_BASE}/orders/${encodeURIComponent(id)}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, adminId: me.id, cancelReason })
      });
      if (res.ok) {
        const json = await res.json();
        console.log('API update order status:', json);
      }
    } catch (err) {
      console.warn('API update order offline fallback:', err);
    }

    // Cập nhật local
    const all = getOrders();
    const ord = all.find(x => x.id === id || x.orderCode === id);
    if (ord) {
      if (newStatus === 'Đã hủy' && ord.status !== 'Đã hủy') {
        ord.items.forEach(i => {
          const p = PRODUCTS.find(x => x.id === i.id);
          if (p) p.stock += i.qty;
        });
        saveProducts();
      }
      ord.status = newStatus;
      ord.orderStatus = newStatus;
      saveOrders(all);
    }
    toast(`Đã duyệt đơn [${id}] sang trạng thái: "${newStatus}"!`, 'success');
    closeModal();
    refresh();
  }

  const PAY = { cod: 'Thanh toán khi nhận hàng', bank: 'Chuyển khoản ngân hàng', card: 'Thẻ tín dụng/ghi nợ' };
  function orderDetail(id) {
    const o = getOrders().find(x => x.id === id || x.orderCode === id);
    if (!o) return;
    const locked = o.status === 'Đã hủy';
    openModal('Chi tiết đơn hàng ' + o.id, `
      <div class="detail-row"><span>Khách hàng</span><span><strong>${esc(o.customer?.name || '')}</strong></span></div>
      <div class="detail-row"><span>Liên hệ</span><span>${esc(o.customer?.phone || '')} · ${esc(o.customer?.email || '')}</span></div>
      <div class="detail-row"><span>Địa chỉ giao hàng</span><span>${esc(o.customer?.address || '')}</span></div>
      <div class="detail-row"><span>Hình thức thanh toán</span><span>${PAY[o.payment] || esc(o.payment)}</span></div>
      ${o.note ? `<div class="detail-row"><span>Ghi chú đơn</span><span>${esc(o.note)}</span></div>` : ''}
      <div style="margin:16px 0">
        <h4 style="font-size:14px;margin-bottom:8px;color:#555">Danh sách sản phẩm đặt mua:</h4>
        ${(o.items || []).map(i => `<div class="detail-row"><span>${esc(i.name)} (${esc(i.size)}) × ${i.qty}</span><span>${fmt(i.price * i.qty)}</span></div>`).join('')}
        <div class="detail-row"><span>Phí vận chuyển</span><span>${o.shipping ? fmt(o.shipping) : 'Miễn phí'}</span></div>
        <div class="detail-row" style="border-top:2px solid #ddd;padding-top:10px"><strong>Tổng cộng thanh toán</strong><strong style="color:var(--text);font-size:16px">${fmt(o.total)}</strong></div>
      </div>
      <div class="field"><label for="o-new-status">Duyệt & Cập nhật trạng thái đơn hàng</label>
        <select class="input" id="o-new-status" ${locked ? 'disabled' : ''}>${STATUSES.map(s => `<option ${s === o.status ? 'selected' : ''}>${s}</option>`).join('')}</select>
        ${locked ? '<p class="muted" style="font-size:12px;margin-top:6px">Đơn đã hủy không thể thay đổi.</p>' : ''}
      </div>
      <div class="modal-actions">
        <button class="btn btn-outline btn-small" id="m-close">Đóng</button>
        ${locked ? '' : '<button class="btn btn-small btn-approve" id="m-save">Lưu trạng thái</button>'}
      </div>`);

    $('#m-close').addEventListener('click', closeModal);
    if (!locked) {
      $('#m-save').addEventListener('click', async () => {
        const next = $('#o-new-status').value;
        if (next === o.status) return closeModal();
        if (next === 'Đã hủy') {
          if (!confirm('Hủy đơn này? Số lượng sản phẩm sẽ được tự động hoàn lại vào kho.')) return;
        }
        await apiUpdateOrderStatus(o.id, next);
      });
    }
  }

  /* ---------- 3. Quản lý sản phẩm (Thêm / Sửa / Xóa) ---------- */
  const prodFilter = { q: '', cat: 'all' };
  views.products = () => {
    $('#view').innerHTML = `
      <div class="bar">
        <input class="input" id="p-q" type="search" placeholder="Tìm kiếm sản phẩm theo tên, mã..." value="${esc(prodFilter.q)}">
        <select class="input" id="p-cat"><option value="all">Tất cả danh mục</option>
          ${Object.entries(CATEGORIES).map(([k, v]) => `<option value="${k}" ${prodFilter.cat === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
        <span class="spacer"></span>
        <button class="btn btn-small btn-outline" id="p-sync" style="margin-right:8px">↻ Đồng bộ</button>
        <button class="btn btn-small" id="p-add">+ Thêm sản phẩm mới</button>
      </div>
      <div class="table-wrap" id="p-table"></div>`;

    $('#p-q').addEventListener('input', e => { prodFilter.q = e.target.value; drawProducts(); });
    $('#p-cat').addEventListener('change', e => { prodFilter.cat = e.target.value; drawProducts(); });
    $('#p-add').addEventListener('click', () => productForm());
    $('#p-sync').addEventListener('click', async () => {
      toast('Đang tải danh sách sản phẩm từ máy chủ...');
      await syncWithBackend();
      drawProducts();
    });
    drawProducts();
  };

  function drawProducts() {
    const q = prodFilter.q.trim().toLowerCase();
    const list = PRODUCTS.filter(p => (prodFilter.cat === 'all' || p.category === prodFilter.cat) &&
      (p.name.toLowerCase().includes(q) || (p.code && p.code.toLowerCase().includes(q))));

    $('#p-table').innerHTML = list.length ? `<table class="data"><thead><tr>
        <th>Ảnh</th><th>Mã / Tên sản phẩm</th><th>Danh mục</th><th>Đơn giá</th><th>Tồn kho</th><th>Thao tác</th></tr></thead><tbody>
      ${list.map(p => `<tr>
        <td><img src="${esc(imgSrc(p))}" alt=""></td>
        <td>
          <span class="pill" style="font-size:10px;margin-bottom:4px">${esc(p.code || 'SP0' + p.id)}</span><br>
          <strong>${esc(p.name)}</strong>
        </td>
        <td>${CATEGORIES[p.category] || esc(p.category)}</td>
        <td><strong>${fmt(p.price)}</strong></td>
        <td class="${p.stock <= LOW_STOCK ? 'low' : ''}">${p.stock}${p.stock === 0 ? ' (Hết hàng)' : ''}</td>
        <td><div class="actions">
          <button class="link-btn" data-edit="${p.id}">Sửa</button>
          ${can(me, 'delete') ? `<button class="link-btn danger" data-del="${p.id}">Xóa</button>` : ''}
        </div></td></tr>`).join('')}
      </tbody></table>` : '<p class="none">Không có sản phẩm phù hợp.</p>';

    $$('[data-edit]', $('#p-table')).forEach(b => b.addEventListener('click', () => productForm(Number(b.dataset.edit))));
    $$('[data-del]', $('#p-table')).forEach(b => b.addEventListener('click', () => deleteProductHandler(Number(b.dataset.del))));
  }

  // Xóa sản phẩm qua API
  async function deleteProductHandler(id) {
    const p = PRODUCTS.find(x => x.id === id);
    if (!p || !confirm(`Bạn có chắc chắn muốn XÓA sản phẩm "${p.name}" (Mã: ${p.code || id}) khỏi hệ thống?`)) return;

    try {
      const res = await fetch(`${API_BASE}/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const json = await res.json();
        console.log('API delete product:', json);
      }
    } catch (err) {
      console.warn('API delete offline fallback:', err);
    }

    const idx = PRODUCTS.indexOf(p);
    if (idx !== -1) PRODUCTS.splice(idx, 1);
    saveProducts();
    toast(`Đã xóa sản phẩm "${p.name}" thành công!`, 'success');
    refresh();
  }

  // Form Thêm / Sửa sản phẩm
  function productForm(id) {
    const p = id ? PRODUCTS.find(x => x.id === id) : {
      code: 'SP' + Date.now().toString().slice(-4),
      name: '', category: 'bracelet', price: '', stock: 20,
      image: 'images/bracelet-1.svg', desc: '', material: 'Bạc 925', weight: 'Free size'
    };
    const images = [...new Set(DEFAULT_PRODUCTS.map(x => x.image))];

    openModal(id ? 'Sửa thông tin sản phẩm' : 'Thêm sản phẩm mới vào kho', `
      <form id="p-form" novalidate>
        <div class="form-grid">
          <div class="field"><label for="f-code">Mã sản phẩm</label><input class="input" id="f-code" value="${esc(p.code || '')}" placeholder="VD: A04"><div class="error">Vui lòng nhập mã</div></div>
          <div class="field"><label for="f-cat">Danh mục</label><select class="input" id="f-cat">${Object.entries(CATEGORIES).map(([k, v]) => `<option value="${k}" ${p.category === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
          <div class="field full"><label for="f-name">Tên sản phẩm</label><input class="input" id="f-name" value="${esc(p.name)}"><div class="error">Vui lòng nhập tên sản phẩm</div></div>
          <div class="field"><label for="f-price">Giá bán (VNĐ)</label><input class="input" id="f-price" type="number" min="0" step="1000" value="${esc(p.price)}"><div class="error">Giá phải lớn hơn 0</div></div>
          <div class="field"><label for="f-stock">Số lượng tồn kho</label><input class="input" id="f-stock" type="number" min="0" step="1" value="${esc(p.stock)}"><div class="error">Số lượng tồn kho không hợp lệ</div></div>
          <div class="field"><label for="f-weight">Kích thước / Trọng lượng</label><input class="input" id="f-weight" placeholder="VD: Free size / 45cm" value="${esc(p.weight)}"></div>
          <div class="field"><label for="f-material">Chất liệu</label><input class="input" id="f-material" value="${esc(p.material)}"></div>
          <div class="field full"><label for="f-image">Đường dẫn hình ảnh</label><input class="input" id="f-image" list="img-list" value="${esc(p.image)}"><datalist id="img-list">${images.map(i => `<option value="${i}">`).join('')}</datalist></div>
          <div class="field full"><label for="f-desc">Mô tả sản phẩm</label><textarea class="input" id="f-desc" rows="3">${esc(p.desc)}</textarea></div>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-outline btn-small" id="m-close">Hủy</button>
          <button class="btn btn-small" type="submit">${id ? 'Lưu cập nhật' : 'Thêm sản phẩm'}</button>
        </div>
      </form>`);

    $('#m-close').addEventListener('click', closeModal);
    $('#p-form').addEventListener('submit', async e => {
      e.preventDefault();
      const v = {
        code: $('#f-code').value.trim() || ('SP' + Date.now().toString().slice(-4)),
        name: $('#f-name').value.trim(),
        category: $('#f-cat').value,
        price: Number($('#f-price').value),
        stock: Number($('#f-stock').value),
        weight: $('#f-weight').value.trim() || 'Free size',
        material: $('#f-material').value.trim() || 'Bạc 925',
        image: $('#f-image').value.trim() || 'images/bracelet-1.svg',
        desc: $('#f-desc').value.trim()
      };

      const bad = {
        'f-name': !v.name,
        'f-price': !(v.price > 0),
        'f-stock': !Number.isInteger(v.stock) || v.stock < 0
      };
      Object.entries(bad).forEach(([k, b]) => $('#' + k).closest('.field').classList.toggle('invalid', b));
      if (Object.values(bad).some(Boolean)) return;

      // Gửi lên Backend API
      try {
        if (id) {
          // Sửa sản phẩm: PUT /api/products/:id
          const res = await fetch(`${API_BASE}/products/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productCode: v.code,
              productName: v.name,
              category: v.category,
              price: v.price,
              stockQuantity: v.stock,
              size: v.weight,
              material: v.material,
              imageUrl: v.image,
              description: v.desc
            })
          });
          if (res.ok) console.log('API update product successful');
        } else {
          // Thêm sản phẩm mới: POST /api/products
          const res = await fetch(`${API_BASE}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              productCode: v.code,
              productName: v.name,
              category: v.category,
              price: v.price,
              stockQuantity: v.stock,
              size: v.weight,
              material: v.material,
              imageUrl: v.image,
              description: v.desc
            })
          });
          if (res.ok) {
            const json = await res.json();
            if (json.data && json.data.productId) v.id = json.data.productId;
          }
        }
      } catch (err) {
        console.warn('Backend API offline, saved in local:', err);
      }

      if (id) {
        Object.assign(p, v);
      } else {
        const newId = v.id || (PRODUCTS.reduce((m, x) => Math.max(m, x.id), 0) + 1);
        PRODUCTS.push({ id: newId, ...v });
      }
      saveProducts();
      toast(id ? `Đã cập nhật sản phẩm "${v.name}"!` : `Đã thêm sản phẩm "${v.name}" vào kho!`, 'success');
      closeModal();
      refresh();
    });
  }

  /* ---------- 4. Quản lý Tồn kho ---------- */
  let onlyLow = false;
  views.inventory = () => {
    $('#view').innerHTML = `
      <div class="bar">
        <label style="display:flex;gap:8px;align-items:center;cursor:pointer"><input type="checkbox" id="i-low" ${onlyLow ? 'checked' : ''}> Chỉ hiện sản phẩm sắp hết (≤ ${LOW_STOCK})</label>
        <span class="spacer"></span>
        <button class="btn btn-small btn-outline" id="i-sync">↻ Đồng bộ kho</button>
      </div>
      <div class="table-wrap" id="i-table"></div>`;

    $('#i-low').addEventListener('change', e => { onlyLow = e.target.checked; drawInventory(); });
    $('#i-sync').addEventListener('click', async () => {
      toast('Đang đồng bộ số lượng tồn kho...');
      await syncWithBackend();
      drawInventory();
    });
    drawInventory();
  };

  function drawInventory() {
    const list = PRODUCTS.filter(p => !onlyLow || p.stock <= LOW_STOCK);
    $('#i-table').innerHTML = list.length ? `<table class="data"><thead><tr><th>Ảnh</th><th>Mã / Tên sản phẩm</th><th>Danh mục</th><th>Tồn hiện tại</th><th>Cập nhật số lượng</th></tr></thead><tbody>
      ${list.map(p => `<tr>
        <td><img src="${esc(imgSrc(p))}" alt=""></td>
        <td><span class="pill" style="font-size:10px">${esc(p.code || 'SP0' + p.id)}</span><br><strong>${esc(p.name)}</strong></td>
        <td>${CATEGORIES[p.category] || ''}</td>
        <td class="${p.stock <= LOW_STOCK ? 'low' : ''}"><strong>${p.stock}</strong></td>
        <td><div class="actions">
          <input class="stock-input" type="number" min="0" step="1" value="${p.stock}" data-stock-for="${p.id}">
          <button class="link-btn btn-approve" data-save="${p.id}" style="color:#fff">Lưu kho</button>
        </div></td></tr>`).join('')}
      </tbody></table>` : '<p class="none">Không có sản phẩm nào sắp hết hàng.</p>';

    $$('[data-save]', $('#i-table')).forEach(b => b.addEventListener('click', async () => {
      const id = Number(b.dataset.save);
      const val = Number($(`[data-stock-for="${id}"]`).value);
      if (!Number.isInteger(val) || val < 0) return toast('Số lượng tồn kho không hợp lệ', 'error');

      try {
        await fetch(`${API_BASE}/products/${id}/stock`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stockQuantity: val })
        });
      } catch (e) {
        console.warn('API stock update offline fallback');
      }

      const p = PRODUCTS.find(x => x.id === id);
      if (p) p.stock = val;
      saveProducts();
      toast(`Đã cập nhật tồn kho sản phẩm ID ${id} thành ${val}!`, 'success');
      refresh();
    }));
  }

  /* ---------- 5. Khách hàng ---------- */
  views.customers = () => {
    const users = read('users', []);
    const orders = getOrders();
    $('#view').innerHTML = `<div class="table-wrap">${users.length ? `<table class="data"><thead><tr>
        <th>Họ tên</th><th>Email</th><th>Số điện thoại</th><th>Số đơn</th><th>Đã chi tiêu</th></tr></thead><tbody>
      ${users.map(u => {
        const mine = orders.filter(o => (o.userEmail || o.customer?.email || '').toLowerCase() === u.email.toLowerCase());
        return `<tr><td><strong>${esc(u.name)}</strong></td><td>${esc(u.email)}</td><td>${esc(u.phone)}</td><td>${mine.length}</td>
          <td>${fmt(mine.filter(o => o.status !== 'Đã hủy').reduce((s, o) => s + (o.total || 0), 0))}</td></tr>`;
      }).join('')}</tbody></table>` : '<p class="none">Chưa có khách hàng đăng ký.</p>'}</div>`;
  };

  /* ---------- 6. Quản trị viên (chỉ Administrator) ---------- */
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

  // Khởi động trang và kích hoạt đồng bộ nền từ Backend API
  syncWithBackend().then(() => route());
}
