/* GAU DHARA – shared by every page: API helper + Login / Contact buttons + logged-in state in the navbar.
   Wrapped in a function so it never clashes with the $ / $$ helpers in script.js and offers.js. */
(function () {
  'use strict';

  /* ---- tiny fetch wrapper used by all pages: GD.api('/api/...', { method, body }) ---- */
  async function api(path, { method = 'GET', body } = {}) {
    const opts = { method, credentials: 'same-origin', headers: {} };
    if (method !== 'GET') { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body || {}); }
    if (method === 'DELETE') opts.headers['X-Requested-With'] = 'fetch';
    let res;
    try { res = await fetch(path, opts); }
    catch (e) { const err = new Error('Cannot reach the server. Is it running? (node server/server.js)'); err.offline = true; throw err; }
    let data = {};
    try { data = await res.json(); } catch (e) { /* non-JSON reply */ }
    if (!res.ok) { const err = new Error(data.error || 'Something went wrong (' + res.status + ').'); err.status = res.status; throw err; }
    return data;
  }

  /* only allow same-site relative pages after login (prevents open redirects) */
  function safeNext(value, fallback) {
    return /^[a-z0-9_-]+\.html(#[\w-]*)?$/i.test(value || '') ? value : fallback;
  }

  /* ---- shared cart (localStorage): [{ id: productRowId, qty }] – used by products.html and cart.html ---- */
  const CART_KEY = 'gdCart';
  const cart = {
    read() {
      try {
        const c = JSON.parse(localStorage.getItem(CART_KEY));
        return Array.isArray(c) ? c.filter(i => Number.isInteger(i.id) && Number.isInteger(i.qty) && i.qty > 0).map(i => ({ id: i.id, qty: Math.min(i.qty, 50) })) : [];
      } catch (e) { return []; }
    },
    write(items) { try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch (e) { /* private mode */ } },
    count() { return this.read().reduce((n, i) => n + i.qty, 0); }
  };

  const GD = window.GD = { api, safeNext, cart, user: null };
  GD.ready = api('/api/auth/me').then(d => (GD.user = d.user)).catch(() => null);

  const loginBtn = document.getElementById('loginBtn');
  const contactBtn = document.getElementById('contactBtn');
  if (contactBtn) contactBtn.addEventListener('click', () => { location.href = 'contact.html'; });
  const footContact = document.getElementById('footContact');
  if (footContact) { footContact.setAttribute('href', 'contact.html'); }

  GD.ready.then(user => {
    if (!loginBtn) return;
    if (!user) {
      loginBtn.addEventListener('click', () => { location.href = 'login.html'; });
      return;
    }
    // Logged in: show "Hi, Name", plus an Admin button for admins and a Logout button
    const first = user.name.split(' ')[0];
    loginBtn.textContent = '👤 Hi, ' + first;
    loginBtn.title = user.email;
    if (user.role === 'admin') loginBtn.addEventListener('click', () => { location.href = 'admin.html'; });
    else loginBtn.addEventListener('click', () => { location.href = 'account.html'; });
    const out = document.createElement('button');
    out.type = 'button'; out.className = 'btn btn-outline-nav'; out.textContent = 'Logout';
    out.addEventListener('click', async () => {
      try { await api('/api/auth/logout', { method: 'POST' }); } catch (e) { /* ignore */ }
      location.reload();
    });
    loginBtn.after(out);
    if (user.role === 'admin') loginBtn.textContent = '🛠 Admin Portal';
  });
})();
