/* GAU DHARA – cart.html: review items, change quantities, place the order.
   Cart contents live in localStorage (GD.cart, from nav.js); prices always come from the server. */
(function () {
  'use strict';
  const $ = (s, p = document) => p.querySelector(s);
  const $$ = (s, p = document) => [...p.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const EMOJI = { Milk: '🥛', Curd: '🥣', Paneer: '🧀', Buttermilk: '🥤', Chakka: '🍚', Lassi: '🍶' };
  const PHONE_RE = /^(\+91[\s-]?)?[6-9]\d{9}$/;
  const root = $('#cartRoot'), notice = $('#cartNotice');

  const burger = $('#burger'), menu = $('#menu');
  if (burger) burger.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    burger.setAttribute('aria-expanded', open); burger.textContent = open ? '✕' : '☰';
  });
  let toastTimer;
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }

  let byId = {}, cart = [], user = null, placed = null;

  async function init() {
    try { byId = Object.fromEntries((await GD.api('/api/products')).products.map(p => [p.id, p])); }
    catch (e) { root.innerHTML = `<div class="cart-empty"><p class="form-err">${esc(e.message)}</p></div>`; return; }
    user = await GD.ready;
    const stored = GD.cart.read();
    cart = stored.filter(i => byId[i.id]);
    if (cart.length < stored.length) {
      notice.textContent = 'Some items in your cart are no longer available and were removed.'; notice.hidden = false;
    }
    save(); render();
  }
  function save() { GD.cart.write(cart); }
  const lineTotal = i => byId[i.id].price * i.qty;
  const total = () => cart.reduce((n, i) => n + lineTotal(i), 0);
  const count = () => cart.reduce((n, i) => n + i.qty, 0);
  const thumb = p => p.image
    ? `<img src="${esc(p.image)}" alt="" referrerpolicy="no-referrer" data-emoji="${EMOJI[p.category] || '🥛'}">`
    : `<span aria-hidden="true">${EMOJI[p.category] || '🥛'}</span>`;

  function render() {
    if (placed) return renderPlaced();
    if (!cart.length) {
      root.innerHTML = `<div class="cart-empty"><div class="big-emoji" aria-hidden="true">🛒</div><h2>Your cart is empty</h2>
        <p>Fresh milk, curd, paneer and more are waiting for you.</p><a href="products.html" class="btn btn-green big">Browse Products</a></div>`;
      return;
    }
    root.innerHTML = `
    <div class="cart-layout">
      <section class="cart-items" aria-label="Items in your cart">
        <div class="cart-items-head"><span>${count()} item${count() > 1 ? 's' : ''}</span><button type="button" class="link-btn" id="clearCart">Clear cart</button></div>
        ${cart.map(i => { const p = byId[i.id]; return `
        <article class="cart-row" data-id="${p.id}">
          <div class="cr-pic">${thumb(p)}</div>
          <div class="cr-info"><b>${esc(p.name)}</b><span>${esc(p.quantity)} • ₹${p.price} each</span></div>
          <div class="cr-step" role="group" aria-label="Quantity for ${esc(p.name)} ${esc(p.quantity)}">
            <button type="button" data-act="dec" aria-label="Decrease quantity">−</button>
            <output aria-live="polite">${i.qty}</output>
            <button type="button" data-act="inc" aria-label="Increase quantity" ${i.qty >= 50 ? 'disabled' : ''}>+</button>
          </div>
          <b class="cr-total">₹${lineTotal(i)}</b>
          <button type="button" class="cr-del" data-act="del" aria-label="Remove ${esc(p.name)} ${esc(p.quantity)}">🗑</button>
        </article>`; }).join('')}
      </section>

      <aside class="cart-summary" aria-label="Order summary">
        <h2>Order Summary</h2>
        <dl class="sum">
          <div><dt>Items (${count()})</dt><dd>₹${total()}</dd></div>
          <div class="sum-total"><dt>Total</dt><dd>₹${total()}</dd></div>
        </dl>
        <p class="sum-note">💵 Cash on delivery. Delivery details are confirmed when we call you.</p>
        ${user ? checkoutForm() : `
          <div class="login-prompt"><p>Please log in to place your order. Your cart will be saved.</p>
          <a class="btn btn-green big" href="login.html?next=cart.html">Log in to checkout</a>
          <p class="auth-alt">New here? <a href="signup.html?next=cart.html">Create an account</a></p></div>`}
      </aside>
    </div>`;
    $$('img[data-emoji]', root).forEach(img => img.addEventListener('error', () => {
      const s = document.createElement('span'); s.textContent = img.dataset.emoji; s.setAttribute('aria-hidden', 'true'); img.replaceWith(s);
    }));
  }

  const checkoutForm = () => `
    <form class="form" id="orderForm" novalidate>
      <h3>Delivery details</h3>
      <label class="field"><span>Full name</span><input id="oName" type="text" required maxlength="80" autocomplete="name" value="${esc(user.name)}"></label>
      <label class="field"><span>Mobile number</span><input id="oPhone" type="tel" required maxlength="15" inputmode="numeric" autocomplete="tel" placeholder="10-digit mobile number" value="${esc(user.phone || '')}"></label>
      <label class="field"><span>Delivery address</span><textarea id="oAddress" required rows="3" maxlength="300" placeholder="House no., street, area, city, pincode" autocomplete="street-address"></textarea></label>
      <p class="form-err" id="orderErr" role="alert"></p>
      <button type="submit" class="btn btn-green big" id="orderBtn">Place Order • ₹${total()}</button>
    </form>`;

  function renderPlaced() {
    root.innerHTML = `<div class="cart-empty placed"><div class="big-emoji" aria-hidden="true">🎉</div>
      <h2>Order placed!</h2>
      <p>Thank you! Your order <b>#${placed.id}</b> for <b>₹${placed.total}</b> has been received. We will confirm it shortly. Pay cash on delivery.</p>
      <div class="placed-actions"><a href="account.html" class="btn btn-green big">View my orders</a><a href="products.html" class="btn btn-yellow big">Continue shopping</a></div></div>`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---- quantity / remove / clear (event delegation) ---- */
  root.addEventListener('click', e => {
    if (e.target.closest('#clearCart')) {
      if (confirm('Remove all items from your cart?')) { cart = []; save(); render(); }
      return;
    }
    const btn = e.target.closest('[data-act]'); if (!btn) return;
    const row = btn.closest('.cart-row'), id = +row.dataset.id, item = cart.find(i => i.id === id);
    if (!item) return;
    // keep what the person typed in the delivery form while the list re-renders
    const keep = ['oName', 'oPhone', 'oAddress'].map(k => { const el = document.getElementById(k); return el ? [k, el.value] : null; }).filter(Boolean);
    const p = byId[id];
    if (btn.dataset.act === 'inc' && item.qty < 50) item.qty++;
    if (btn.dataset.act === 'dec') item.qty--;
    if (btn.dataset.act === 'del' || item.qty < 1) { cart = cart.filter(i => i.id !== id); toast(`${p.name} (${p.quantity}) removed`); }
    save(); render();
    keep.forEach(([k, v]) => { const el = document.getElementById(k); if (el) el.value = v; });
  });

  /* ---- place order ---- */
  root.addEventListener('submit', async e => {
    if (e.target.id !== 'orderForm') return;
    e.preventDefault();
    const err = $('#orderErr'), btn = $('#orderBtn'); err.textContent = '';
    const name = $('#oName').value.trim(), phone = $('#oPhone').value.replace(/\s/g, ''), address = $('#oAddress').value.trim();
    if (name.length < 2) { err.textContent = 'Please enter your name.'; return $('#oName').focus(); }
    if (!PHONE_RE.test(phone)) { err.textContent = 'Please enter a valid 10-digit mobile number.'; return $('#oPhone').focus(); }
    if (address.length < 10) { err.textContent = 'Please enter your full delivery address.'; return $('#oAddress').focus(); }
    btn.disabled = true; const label = btn.textContent; btn.textContent = 'Placing order…';
    try {
      const { order } = await GD.api('/api/orders', { method: 'POST', body: { name, phone, address, items: cart.map(i => ({ id: i.id, qty: i.qty })) } });
      placed = order; cart = []; save(); render();
    } catch (ex) {
      if (ex.status === 401) { location.href = 'login.html?next=cart.html'; return; }
      err.textContent = ex.message; btn.disabled = false; btn.textContent = label;
    }
  });

  init();
})();
