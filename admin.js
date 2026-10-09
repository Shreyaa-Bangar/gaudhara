/* GAU DHARA – Admin portal logic. All data comes from /api/admin/* (server checks the admin role on every call). */
(function () {
  'use strict';
  const $ = (s, p = document) => p.querySelector(s);
  const $$ = (s, p = document) => [...p.querySelectorAll(s)];
  // Everything from the database is user-supplied text, so it is always escaped before going into HTML.
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = n => '₹' + Number(n).toLocaleString('en-IN');
  const when = s => esc(s) + ' UTC';
  const ORDER_STATUSES = ['Pending', 'Confirmed', 'Out for delivery', 'Delivered', 'Cancelled'];

  let toastTimer;
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }
  const banner = $('#banner');
  function fail(err) {
    if (err.status === 401 || err.status === 403) { location.href = 'login.html?next=admin.html'; return; }
    banner.textContent = err.message; banner.hidden = false;
  }
  const api = (p, o) => GD.api(p, o);

  /* ---------- access gate ---------- */
  GD.ready.then(user => {
    const gate = $('#gate');
    if (!user) { location.replace('login.html?next=admin.html'); return; }
    if (user.role !== 'admin') {
      gate.innerHTML = '<div><h1>🚫 Admins only</h1><p style="margin:10px 0">Your account does not have access to this page.</p><a href="index.html">Back to the website</a></div>';
      return;
    }
    gate.hidden = true; $('#shell').hidden = false;
    $('#whoami').textContent = user.email;
    showTab('dashboard');
  });

  /* ---------- tabs ---------- */
  const TITLES = { dashboard: 'Dashboard', products: 'Products', orders: 'Orders', messages: 'Messages', users: 'Customers' };
  const LOADERS = { dashboard: loadDashboard, products: loadProducts, orders: loadOrders, messages: loadMessages, users: loadUsers };
  let currentTab = 'dashboard';
  function showTab(name) {
    currentTab = name;
    $$('.tab').forEach(t => t.classList.toggle('on', t.dataset.tab === name));
    $$('.panel').forEach(p => { p.hidden = p.id !== 'tab-' + name; });
    $('#pageTitle').textContent = TITLES[name];
    banner.hidden = true;
    closeSide();
    LOADERS[name]().catch(fail);
    refreshPills();
  }
  $('.side nav').addEventListener('click', e => { const b = e.target.closest('.tab'); if (b) showTab(b.dataset.tab); });
  $('#refresh').addEventListener('click', () => { LOADERS[currentTab]().then(() => toast('Refreshed')).catch(fail); refreshPills(); });
  $('#logout').addEventListener('click', async () => { try { await api('/api/auth/logout', { method: 'POST' }); } catch (e) {} location.href = 'login.html'; });
  const side = $('#side'), menuBtn = $('#menuBtn');
  function closeSide() { side.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); }
  menuBtn.addEventListener('click', () => menuBtn.setAttribute('aria-expanded', side.classList.toggle('open')));

  async function refreshPills() {
    try {
      const { stats } = await api('/api/admin/stats');
      const set = (id, n) => { const el = $(id); el.textContent = n; el.hidden = !n; };
      set('#pillOrders', stats.pendingOrders); set('#pillMsgs', stats.newMessages);
    } catch (e) { /* the active tab already reports errors */ }
  }

  /* ---------- table helper ---------- */
  function table(el, heads, rows, emptyText) {
    el.innerHTML = `<thead><tr>${heads.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>` +
      (rows.length ? rows.join('') : `<tr><td class="empty" colspan="${heads.length}">${emptyText}</td></tr>`) + '</tbody>';
  }
  const statusSelect = (id, cur) => `<select data-order-status="${id}" aria-label="Order ${id} status">${ORDER_STATUSES.map(s => `<option${s === cur ? ' selected' : ''}>${s}</option>`).join('')}</select>`;
  const itemsHTML = o => `<details><summary>${o.items.reduce((n, i) => n + i.qty, 0)} item(s)</summary><ul>${o.items.map(i => `<li>${esc(i.name)} (${esc(i.quantity)}) × ${i.qty} = ${money(i.price * i.qty)}</li>`).join('')}</ul></details>`;

  /* ---------- dashboard ---------- */
  async function loadDashboard() {
    const { stats: s, recentOrders } = await api('/api/admin/stats');
    $('#stats').innerHTML = [
      ['Revenue', money(s.revenue), ''], ['Total orders', s.orders, ''], ['Pending orders', s.pendingOrders, s.pendingOrders ? 'warn' : ''],
      ['New messages', s.newMessages, s.newMessages ? 'warn' : ''], ['Products live', s.products, ''], ['Customers', s.customers, '']
    ].map(([label, val, cls]) => `<div class="stat ${cls}"><b>${val}</b><span>${label}</span></div>`).join('');
    table($('#recentTable'), ['Order', 'Customer', 'Total', 'Status', 'Placed'],
      recentOrders.map(o => `<tr><td>#${o.id}</td><td>${esc(o.name)}<span class="sub">${esc(o.phone)}</span></td><td>${money(o.total)}</td><td><span class="tag">${esc(o.status)}</span></td><td>${when(o.created_at)}</td></tr>`),
      'No orders yet.');
  }

  /* ---------- products ---------- */
  let products = [];
  async function loadProducts() {
    products = (await api('/api/admin/products')).products;
    $('#catList').innerHTML = [...new Set(products.map(p => p.category))].map(c => `<option value="${esc(c)}">`).join('');
    table($('#productsTable'), ['#', 'Product', 'Category', 'Size', 'Price', 'Visible', ''],
      products.map(p => `<tr class="${p.active ? '' : 'off'}"><td>${p.id}</td><td>${esc(p.name)}<span class="sub">${esc(p.description).slice(0, 70)}</span></td><td>${esc(p.category)}</td><td>${esc(p.quantity)}</td><td>${money(p.price)}</td>
        <td><button type="button" class="btn ghost sm" data-toggle="${p.id}">${p.active ? 'Hide' : 'Show'}</button></td>
        <td class="actions"><button type="button" class="btn ghost sm" data-edit="${p.id}">Edit</button><button type="button" class="btn danger sm" data-del="${p.id}">Delete</button></td></tr>`),
      'No products yet. Click “Add product”.');
  }
  const pModal = $('#pModal'), pForm = $('#pForm'), pErr = $('#pErr');
  function openProduct(p) {
    pErr.textContent = '';
    $('#pTitle').textContent = p ? 'Edit product' : 'Add product';
    $('#pId').value = p ? p.id : '';
    $('#pName').value = p ? p.name : ''; $('#pCat').value = p ? p.category : ''; $('#pQty').value = p ? p.quantity : '';
    $('#pPrice').value = p ? p.price : ''; $('#pDesc').value = p ? p.description : ''; $('#pImg').value = p ? p.image : '';
    $('#pActive').checked = p ? !!p.active : true;
    pModal.hidden = false; $('#pName').focus();
  }
  const closeProduct = () => { pModal.hidden = true; };
  $('#addProduct').addEventListener('click', () => openProduct(null));
  $('#pCancel').addEventListener('click', closeProduct);
  pModal.addEventListener('mousedown', e => { if (e.target === pModal) closeProduct(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeProduct(); });
  pForm.addEventListener('submit', async e => {
    e.preventDefault(); pErr.textContent = '';
    const id = $('#pId').value;
    const body = { name: $('#pName').value, category: $('#pCat').value, quantity: $('#pQty').value, price: $('#pPrice').value === '' ? NaN : Number($('#pPrice').value),
      description: $('#pDesc').value, image: $('#pImg').value, active: $('#pActive').checked };
    const btn = $('#pSave'); btn.disabled = true;
    try {
      await api(id ? '/api/admin/products/' + id : '/api/admin/products', { method: id ? 'PUT' : 'POST', body });
      closeProduct(); toast(id ? 'Product updated' : 'Product added'); await loadProducts(); refreshPills();
    } catch (err) { pErr.textContent = err.message; }
    btn.disabled = false;
  });
  $('#productsTable').addEventListener('click', async e => {
    const edit = e.target.closest('[data-edit]'), del = e.target.closest('[data-del]'), tog = e.target.closest('[data-toggle]');
    try {
      if (edit) openProduct(products.find(p => p.id === +edit.dataset.edit));
      if (tog) {
        const p = products.find(x => x.id === +tog.dataset.toggle);
        await api('/api/admin/products/' + p.id, { method: 'PUT', body: { active: !p.active } });
        toast(p.active ? 'Hidden from website' : 'Now visible'); await loadProducts();
      }
      if (del) {
        const p = products.find(x => x.id === +del.dataset.del);
        if (!confirm(`Delete “${p.name} ${p.quantity}” permanently?\n(Tip: use Hide to keep it but remove it from the website.)`)) return;
        await api('/api/admin/products/' + p.id, { method: 'DELETE' });
        toast('Product deleted'); await loadProducts();
      }
    } catch (err) { fail(err); }
  });

  /* ---------- orders ---------- */
  let orders = [];
  $('#orderFilter').insertAdjacentHTML('beforeend', ORDER_STATUSES.map(s => `<option>${s}</option>`).join(''));
  function renderOrders() {
    const f = $('#orderFilter').value, list = f ? orders.filter(o => o.status === f) : orders;
    table($('#ordersTable'), ['Order', 'Customer', 'Delivery address', 'Items', 'Total', 'Placed', 'Status'],
      list.map(o => `<tr><td>#${o.id}</td><td>${esc(o.name)}<span class="sub">${esc(o.phone)}</span><span class="sub">${esc(o.user_email)}</span></td><td>${esc(o.address)}</td><td>${itemsHTML(o)}</td><td>${money(o.total)}</td><td>${when(o.created_at)}</td><td>${statusSelect(o.id, o.status)}</td></tr>`),
      'No orders to show.');
  }
  async function loadOrders() { orders = (await api('/api/admin/orders')).orders; renderOrders(); }
  $('#orderFilter').addEventListener('change', renderOrders);
  $('#ordersTable').addEventListener('change', async e => {
    const sel = e.target.closest('[data-order-status]'); if (!sel) return;
    try { await api('/api/admin/orders/' + sel.dataset.orderStatus, { method: 'PATCH', body: { status: sel.value } }); toast('Order status updated'); await loadOrders(); refreshPills(); }
    catch (err) { fail(err); loadOrders().catch(() => {}); }
  });

  /* ---------- messages ---------- */
  let messages = [];
  function renderMessages() {
    const f = $('#msgFilter').value, list = f ? messages.filter(m => m.status === f) : messages;
    $('#msgList').innerHTML = list.length ? list.map(m => `
      <article class="msg ${esc(m.status)}">
        <header><b>${esc(m.name)}</b><span class="tag ${m.status === 'resolved' ? 'ok' : ''}">${esc(m.status)}</span></header>
        <div class="meta"><a href="mailto:${esc(m.email)}">${esc(m.email)}</a>${m.phone ? ' • ' + esc(m.phone) : ''} • ${when(m.created_at)}${m.subject ? ' • ' + esc(m.subject) : ''}</div>
        <p>${esc(m.message)}</p>
        <div class="row-end">
          ${m.status !== 'read' ? `<button type="button" class="btn ghost sm" data-msg="${m.id}" data-set="read">Mark read</button>` : ''}
          ${m.status !== 'resolved' ? `<button type="button" class="btn primary sm" data-msg="${m.id}" data-set="resolved">Mark resolved</button>` : ''}
          <button type="button" class="btn danger sm" data-msg-del="${m.id}">Delete</button>
        </div>
      </article>`).join('') : '<p class="msg-empty">No messages to show.</p>';
  }
  async function loadMessages() { messages = (await api('/api/admin/messages')).messages; renderMessages(); }
  $('#msgFilter').addEventListener('change', renderMessages);
  $('#msgList').addEventListener('click', async e => {
    const set = e.target.closest('[data-set]'), del = e.target.closest('[data-msg-del]');
    try {
      if (set) { await api('/api/admin/messages/' + set.dataset.msg, { method: 'PATCH', body: { status: set.dataset.set } }); await loadMessages(); refreshPills(); }
      if (del) {
        if (!confirm('Delete this message permanently?')) return;
        await api('/api/admin/messages/' + del.dataset.msgDel, { method: 'DELETE' }); toast('Message deleted'); await loadMessages(); refreshPills();
      }
    } catch (err) { fail(err); }
  });

  /* ---------- customers ---------- */
  async function loadUsers() {
    const { users } = await api('/api/admin/users');
    table($('#usersTable'), ['#', 'Name', 'Email', 'Phone', 'Role', 'Orders', 'Joined'],
      users.map(u => `<tr><td>${u.id}</td><td>${esc(u.name)}</td><td>${esc(u.email)}</td><td>${esc(u.phone) || '—'}</td><td><span class="tag ${u.role === 'admin' ? 'admin' : ''}">${esc(u.role)}</span></td><td>${u.orders}</td><td>${when(u.created_at)}</td></tr>`),
      'No users yet.');
  }
})();
