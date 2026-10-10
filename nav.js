/* GAU DHARA – shared by every page (SUPABASE version).
   - GD.api(path, { method, body }) keeps the same "/api/..." calls the pages already use, but answers them
     with Supabase (database + login) instead of our own Node server. Response shapes are unchanged.
   - Login/Contact buttons + logged-in state in the navbar, and the shared cart.
   Needs window.sb, created in supabase-config.js (load it BEFORE this file).
   Wrapped in a function so it never clashes with the $ / $$ helpers in script.js and offers.js. */
(function () {
  'use strict';

  /* ---------------------------------------------------------------- helpers */
  function fail(message, status) { const e = new Error(message); if (status) e.status = status; return e; }
  const offline = () => { const e = fail('Cannot reach the server. Check your internet connection and try again.'); e.offline = true; return e; };

  // Turn a Supabase/PostgREST error into the same Error(message, status) the pages already handle.
  function mapError(error) {
    const msg = (error && error.message) || 'Something went wrong.';
    if (/failed to fetch|networkerror|load failed|network request failed/i.test(msg)) return offline();
    if (error.code === '42501' || /row-level security|permission denied/i.test(msg)) return fail('You do not have permission to do that.', 403);
    if (error.code === 'PGRST301' || /jwt (expired|invalid)/i.test(msg)) return fail('Your session has expired. Please log in again.', 401);
    if (error.code === '23505') return fail('That already exists.', 409);
    return fail(msg, error.status && error.status >= 400 && error.status < 600 ? error.status : undefined);
  }
  async function unwrap(promise) {
    const { data, error, count } = await promise;
    if (error) throw mapError(error);
    return count !== undefined && count !== null && data === null ? count : data;
  }

  const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const PHONE_RE = /^(\+91[\s-]?)?[6-9]\d{9}$/;
  const ORDER_STATUSES = ['Pending', 'Confirmed', 'Out for delivery', 'Delivered', 'Cancelled'];
  const MSG_STATUSES = ['new', 'read', 'resolved'];

  /* ------------------------------------------------- who is logged in */
  let profileCache = null;
  async function sessionUser() {
    const { data, error } = await sb.auth.getSession();
    if (error || !data || !data.session) { profileCache = null; return null; }
    const u = data.session.user;
    if (profileCache && profileCache.id === u.id) return profileCache;
    const { data: p } = await sb.from('profiles').select('id,name,email,phone,role').eq('id', u.id).maybeSingle();
    if (p) return (profileCache = p);
    // profile row not readable yet: fall back to what Supabase Auth knows (never grants admin)
    const meta = u.user_metadata || {};
    return { id: u.id, name: meta.name || u.email, email: u.email, phone: meta.phone || '', role: 'customer' };
  }
  async function requireUser() { const u = await sessionUser(); if (!u) throw fail('Please log in to continue.', 401); return u; }
  async function requireAdmin() { const u = await requireUser(); if (u.role !== 'admin') throw fail('Admin access only.', 403); return u; }

  const withItems = o => { const { order_items, ...rest } = o; return { ...rest, items: order_items || [] }; };
  async function attachEmails(orders) {
    const ids = [...new Set(orders.map(o => o.user_id))];
    if (!ids.length) return orders;
    const rows = await unwrap(sb.from('profiles').select('id,email').in('id', ids));
    const email = Object.fromEntries((rows || []).map(r => [r.id, r.email]));
    return orders.map(o => ({ ...o, user_email: email[o.user_id] || '' }));
  }
  const ORDER_SELECT = '*, order_items(*)';

  function productFields(body, partial) {
    const f = {};
    const name = str(body.name, 80), category = str(body.category, 40), quantity = str(body.quantity, 30);
    const description = str(body.description, 400), image = str(body.image, 300);
    if (!partial || 'name' in body) { if (!name) throw fail('Product name is required.', 400); f.name = name; }
    if (!partial || 'category' in body) { if (!category) throw fail('Category is required.', 400); f.category = category; }
    if (!partial || 'quantity' in body) { if (!quantity) throw fail('Quantity (e.g. 500 ml) is required.', 400); f.quantity = quantity; }
    if (!partial || 'price' in body) {
      const price = Number(body.price);
      if (!Number.isInteger(price) || price < 0 || price > 100000) throw fail('Price must be a whole number in rupees.', 400);
      f.price = price;
    }
    if ('description' in body) f.description = description;
    if ('image' in body) {
      if (image && !/^(https?:\/\/|assets\/)[^\s"'<>]+$/i.test(image)) throw fail('Image must be an https:// link or a path starting with assets/.', 400);
      f.image = image;
    }
    if ('active' in body) f.active = !!body.active;
    return f;
  }
  // an update/delete that RLS silently filtered out comes back with zero rows
  const mustChange = (rows, what) => { if (!rows || !rows.length) throw fail(what + ' not found (or you are not allowed to change it).', 404); };

  /* ----------------------------------------------------------- the routes */
  const routes = [];
  const route = (method, pattern, fn) => routes.push({ method, re: new RegExp('^' + pattern.replace(/:(\w+)/g, '(?<$1>\\d+)') + '$'), fn });

  /* public */
  route('GET', '/api/products', async () => ({
    products: await unwrap(sb.from('products').select('id,name,category,quantity,price,description,image').eq('active', true).order('id'))
  }));

  route('POST', '/api/contact', async ({ body }) => {
    const name = str(body.name, 80), email = str(body.email, 120).toLowerCase(), phone = str(body.phone, 20);
    const subject = str(body.subject, 120), message = str(body.message, 2000);
    if (name.length < 2) throw fail('Please enter your name.', 400);
    if (!EMAIL_RE.test(email)) throw fail('Please enter a valid email address.', 400);
    if (phone && !PHONE_RE.test(phone.replace(/\s/g, ''))) throw fail('Please enter a valid 10-digit mobile number.', 400);
    if (message.length < 10) throw fail('Please write a message of at least 10 characters.', 400);
    const { error } = await sb.from('messages').insert({ name, email, phone: phone || null, subject, message });
    if (error) throw mapError(error);
    return { ok: true };
  });

  /* auth */
  route('POST', '/api/auth/signup', async ({ body }) => {
    const name = str(body.name, 60), email = str(body.email, 120).toLowerCase(), phone = str(body.phone, 20);
    const password = typeof body.password === 'string' ? body.password : '';
    if (name.length < 2) throw fail('Please enter your full name.', 400);
    if (!EMAIL_RE.test(email)) throw fail('Please enter a valid email address.', 400);
    if (phone && !PHONE_RE.test(phone.replace(/\s/g, ''))) throw fail('Please enter a valid 10-digit mobile number.', 400);
    if (password.length < 8 || password.length > 100 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) throw fail('Password must be at least 8 characters and include a letter and a number.', 400);
    const exists = () => fail('An account with this email already exists. Try logging in.', 409);
    const { data, error } = await sb.auth.signUp({ email, password, options: { data: { name, phone } } });
    if (error) { if (/already (registered|exists)/i.test(error.message)) throw exists(); throw mapError(error); }
    // with "Confirm email" ON, Supabase answers an existing address with a fake user that has no identities
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) throw exists();
    profileCache = null;
    if (!data.session) throw fail('Account created! We sent a confirmation link to ' + email + '. Please confirm your email, then log in.', 202);
    return { user: { id: data.user.id, name, email, phone, role: 'customer' } };
  });

  route('POST', '/api/auth/login', async ({ body }) => {
    const email = str(body.email, 120).toLowerCase(), password = typeof body.password === 'string' ? body.password : '';
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      if (/invalid login credentials/i.test(error.message)) throw fail('Incorrect email or password.', 401);
      if (/email not confirmed/i.test(error.message)) throw fail('Please confirm your email first (check your inbox), then log in.', 401);
      if (/rate limit|too many/i.test(error.message)) throw fail('Too many attempts. Please wait a few minutes and try again.', 429);
      throw mapError(error);
    }
    profileCache = null;
    return { user: await sessionUser() };
  });

  route('POST', '/api/auth/logout', async () => { await sb.auth.signOut(); profileCache = null; return { ok: true }; });
  route('GET', '/api/auth/me', async () => ({ user: await sessionUser() }));

  /* customer */
  route('POST', '/api/orders', async ({ body }) => {
    await requireUser();
    const name = str(body.name, 80), address = str(body.address, 300);
    const phone = str(body.phone, 20).replace(/[\s-]/g, '').replace(/^\+91/, '');   // the database stores plain 10 digits
    if (name.length < 2) throw fail('Please enter your name.', 400);
    if (!/^[6-9]\d{9}$/.test(phone)) throw fail('Please enter a valid 10-digit mobile number.', 400);
    if (address.length < 10) throw fail('Please enter your full delivery address.', 400);
    if (!Array.isArray(body.items) || !body.items.length || body.items.length > 30) throw fail('Your cart is empty.', 400);
    const items = body.items.map(i => ({ id: Number(i.id), qty: Math.floor(Number(i.qty)) }));
    if (items.some(i => !Number.isInteger(i.id) || !(i.qty >= 1 && i.qty <= 50))) throw fail('Quantity must be between 1 and 50.', 400);
    // the place_order() database function prices the order itself, so the browser cannot change prices
    const { data, error } = await sb.rpc('place_order', { p_name: name, p_phone: phone, p_address: address, p_items: items });
    if (error) {
      if (error.code === '42501' || /log in/i.test(error.message)) throw fail('Please log in to continue.', 401);
      throw mapError(error);
    }
    return { order: { id: data.id, total: data.total } };
  });

  route('GET', '/api/orders/mine', async () => {
    const user = await requireUser();
    const rows = await unwrap(sb.from('orders').select(ORDER_SELECT).eq('user_id', user.id).order('id', { ascending: false }).limit(200));
    return { orders: rows.map(withItems) };
  });

  /* admin (the database's RLS policies enforce this too; the checks here just give clean error messages) */
  route('GET', '/api/admin/stats', async () => {
    await requireAdmin();
    const head = { count: 'exact', head: true };
    const [products, customers, orders, pendingOrders, newMessages] = await Promise.all([
      unwrap(sb.from('products').select('id', head).eq('active', true)),
      unwrap(sb.from('profiles').select('id', head).eq('role', 'customer')),
      unwrap(sb.from('orders').select('id', head)),
      unwrap(sb.from('orders').select('id', head).eq('status', 'Pending')),
      unwrap(sb.from('messages').select('id', head).eq('status', 'new'))
    ]);
    // revenue = sum of non-cancelled orders (fine for a small shop; Supabase returns up to 1000 rows per request)
    const totals = await unwrap(sb.from('orders').select('total').neq('status', 'Cancelled'));
    const revenue = (totals || []).reduce((n, o) => n + o.total, 0);
    const recent = await unwrap(sb.from('orders').select(ORDER_SELECT).order('id', { ascending: false }).limit(5));
    return { stats: { products, customers, orders, pendingOrders, revenue, newMessages }, recentOrders: (await attachEmails(recent)).map(withItems) };
  });

  route('GET', '/api/admin/products', async () => { await requireAdmin(); return { products: await unwrap(sb.from('products').select('*').order('id')) }; });
  route('POST', '/api/admin/products', async ({ body }) => {
    await requireAdmin();
    const f = productFields(body, false);
    const rows = await unwrap(sb.from('products').insert({ description: '', image: '', active: true, ...f }).select('id'));
    return { id: rows[0].id };
  });
  route('PUT', '/api/admin/products/:id', async ({ body, params }) => {
    await requireAdmin();
    const f = productFields(body, true);
    if (!Object.keys(f).length) throw fail('Nothing to update.', 400);
    mustChange(await unwrap(sb.from('products').update(f).eq('id', Number(params.id)).select('id')), 'Product');
    return { ok: true };
  });
  route('DELETE', '/api/admin/products/:id', async ({ params }) => {
    await requireAdmin();
    mustChange(await unwrap(sb.from('products').delete().eq('id', Number(params.id)).select('id')), 'Product');
    return { ok: true };
  });

  route('GET', '/api/admin/orders', async () => {
    await requireAdmin();
    const rows = await unwrap(sb.from('orders').select(ORDER_SELECT).order('id', { ascending: false }).limit(200));
    return { orders: (await attachEmails(rows)).map(withItems) };
  });
  route('PATCH', '/api/admin/orders/:id', async ({ body, params }) => {
    await requireAdmin();
    if (!ORDER_STATUSES.includes(body.status)) throw fail('Invalid status.', 400);
    mustChange(await unwrap(sb.from('orders').update({ status: body.status }).eq('id', Number(params.id)).select('id')), 'Order');
    return { ok: true };
  });

  route('GET', '/api/admin/messages', async () => {
    await requireAdmin();
    return { messages: await unwrap(sb.from('messages').select('*').order('id', { ascending: false }).limit(300)) };
  });
  route('PATCH', '/api/admin/messages/:id', async ({ body, params }) => {
    await requireAdmin();
    if (!MSG_STATUSES.includes(body.status)) throw fail('Invalid status.', 400);
    mustChange(await unwrap(sb.from('messages').update({ status: body.status }).eq('id', Number(params.id)).select('id')), 'Message');
    return { ok: true };
  });
  route('DELETE', '/api/admin/messages/:id', async ({ params }) => {
    await requireAdmin();
    mustChange(await unwrap(sb.from('messages').delete().eq('id', Number(params.id)).select('id')), 'Message');
    return { ok: true };
  });

  route('GET', '/api/admin/users', async () => {
    await requireAdmin();
    const [users, orders] = await Promise.all([
      unwrap(sb.from('profiles').select('*').order('created_at', { ascending: false })),
      unwrap(sb.from('orders').select('user_id'))
    ]);
    const n = {}; (orders || []).forEach(o => { n[o.user_id] = (n[o.user_id] || 0) + 1; });
    return { users: users.map(u => ({ ...u, orders: n[u.id] || 0 })) };
  });

  /* ---- GD.api: same signature as before, so no page needs to change ---- */
  async function api(path, { method = 'GET', body } = {}) {
    if (typeof sb === 'undefined' || !window.sb) {
      const e = fail('Supabase is not set up. Make sure supabase-config.js is loaded before nav.js on this page.'); e.offline = true; throw e;
    }
    const r = routes.find(x => x.method === method && x.re.test(path));
    if (!r) throw fail('Unknown request: ' + method + ' ' + path, 404);
    try { return await r.fn({ body: body || {}, params: r.re.exec(path).groups || {} }); }
    catch (e) { if (e && (e.status !== undefined || e.offline)) throw e; throw mapError(e); }
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
    const first = (user.name || user.email || 'there').split(' ')[0];
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
