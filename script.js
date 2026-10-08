/* GAU DHARA – vanilla JavaScript */
'use strict';
const $ = (s, p = document) => p.querySelector(s);
const $$ = (s, p = document) => [...p.querySelectorAll(s)];

/* ===== 1. PRODUCT DATA – edit names, quantities, colours, icons here ===== */
const PRODUCTS = [
  { name:'Milk',       icon:'🥛', color:'c-blue',   info:'Fresh, creamy milk from local cows.', qty:['1 L','500 ml'], types:['Toned','Double Toned'] },
  { name:'Curd',       icon:'🥣', color:'c-green',  info:'Thick, set curd with natural cultures.', qty:['250 g','500 g'] },
  { name:'Paneer',     icon:'🧀', color:'c-yellow', info:'Soft, fresh paneer made daily.', qty:['100 g','250 g','500 g'] },
  { name:'Buttermilk', icon:'🥤', color:'c-pink',   info:'Light, cooling and spiced.', qty:['500 ml','1 L'] },
  { name:'Chakka',     icon:'🍚', color:'c-purple', info:'Strained curd, perfect for shrikhand.', qty:['500 ml','1 L'] },
  { name:'Lassi',      icon:'🍶', color:'c-blue',   info:'Sweet, chilled and refreshing.', qty:['200 ml'] }
];

/* ===== 2. TOAST + MODAL ===== */
const toast = $('#toast'); let toastTimer;
function showToast(msg) {
  toast.textContent = msg; toast.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}
function showModal(title, text) {
  $('#modalTitle').textContent = title; $('#modalText').textContent = text;
  $('#modal').hidden = false; $('#modalClose').focus();
}
$('#modalClose').onclick = () => $('#modal').hidden = true;
$('#modal').onclick = e => { if (e.target.id === 'modal') e.target.hidden = true; };
document.addEventListener('keydown', e => { if (e.key === 'Escape') { $('#modal').hidden = true; $('#chat').hidden = true; } });

/* ===== 3. BUILD PRODUCT CARDS ===== */
const cart = [];
const grid = $('#productGrid');
PRODUCTS.forEach(p => {
  const card = document.createElement('article');
  card.className = `card ${p.color} reveal`;
  const chips = (arr, group) => arr.map(v => `<button class="chip" data-group="${group}">${v}</button>`).join('');
  card.innerHTML = `
    <div class="pic" aria-hidden="true">${p.icon}</div>
    <h3>${p.icon} ${p.name}</h3>
    <p class="info">${p.info}</p>
    <span class="lbl">Quantity:</span><div class="chips">${chips(p.qty, 'qty')}</div>
    ${p.types ? `<span class="lbl">Types:</span><div class="chips">${chips(p.types, 'type')}</div>` : ''}
    <p class="sel" aria-live="polite"></p>
    <button class="btn btn-green add">Add to Cart</button>`;
  grid.appendChild(card);

  const chosen = { qty: null, type: null };
  const sel = $('.sel', card);
  // Quantity / type selection
  $$('.chip', card).forEach(chip => chip.addEventListener('click', () => {
    $$(`.chip[data-group="${chip.dataset.group}"]`, card).forEach(c => c.classList.remove('on'));
    chip.classList.add('on');
    chosen[chip.dataset.group] = chip.textContent;
    sel.textContent = `✔ ${chip.textContent} selected`;
  }));
  // Add to cart
  $('.add', card).addEventListener('click', () => {
    if (!chosen.qty) { sel.textContent = 'Please choose a quantity first.'; showToast('Choose a quantity first'); return; }
    if (p.types && !chosen.type) { sel.textContent = 'Please choose a type too.'; showToast('Choose a type first'); return; }
    cart.push({ name: p.name, ...chosen });
    $('#cartCount').textContent = cart.length;
    showToast(`${p.name} (${chosen.qty}${chosen.type ? ', ' + chosen.type : ''}) added to cart`);
  });
});
$('#cartBtn').onclick = () => cart.length
  ? showModal('Your cart', cart.map(i => `${i.name} ${i.qty}${i.type ? ' – ' + i.type : ''}`).join(' • '))
  : showToast('Your cart is empty');

/* ===== 4. NAVBAR: hamburger, active link, chat link ===== */
const burger = $('#burger'), menu = $('#menu');
burger.onclick = () => {
  const open = menu.classList.toggle('open');
  burger.setAttribute('aria-expanded', open);
  burger.textContent = open ? '✕' : '☰';
};
$$('.links a[href^="#"]').forEach(a => a.addEventListener('click', () => { menu.classList.remove('open'); burger.textContent = '☰'; }));
const sections = $$('main section[id]');
function setActive() {
  let current = 'home';
  sections.forEach(s => { if (scrollY + 160 >= s.offsetTop) current = s.id; });
  if (current === 'products') current = 'home';
  $$('.links a[href^="#"]').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + current));
}
$('#loginBtn').onclick = () => showModal('Login / Sign In', 'Accounts are coming soon. For now you can browse and add items to your cart.');
$('#contactBtn').onclick = () => showModal('Contact Us', 'Email: hello@gaudhara.example • Phone: +91 00000 00000');
$$('[data-social]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); showToast(`${a.dataset.social} page coming soon`); }));

/* ===== 5. SCROLL: top button, reveal ===== */
const toTop = $('#toTop');
addEventListener('scroll', () => { toTop.hidden = scrollY < 500; setActive(); }, { passive: true });
toTop.onclick = () => scrollTo({ top: 0, behavior: 'smooth' });
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .15 });
$$('.reveal').forEach(el => io.observe(el));

/* ===== 6. INSIGHTS: read more / less ===== */
$$('.readmore').forEach(btn => btn.addEventListener('click', () => {
  const more = btn.previousElementSibling, open = more.hidden;
  more.hidden = !open;
  btn.textContent = open ? 'Show Less ↑' : 'Read More →';
  btn.setAttribute('aria-expanded', open);
}));

/* ===== 7. CAMPAIGN MODAL ===== */
$('#joinBtn').onclick = () => showModal('Thank you! 🌾', 'You are part of the GAU DHARA campaign. Know your farmer, choose fresh and support local.');

/* ===== 8. CHATBOT ===== */
const chat = $('#chat'), body = $('#chatBody');
function openChat() {
  chat.hidden = false;
  if (!body.children.length) addMsg('Hi! 👋 I’m your Gau Dhara assistant. How can I help you today?', 'bot');
  $('#chatInput').focus();
}
$('#chatFab').onclick = () => chat.hidden ? openChat() : chat.hidden = true;
$('#chatClose').onclick = () => chat.hidden = true;
['#navChat', '#footChat'].forEach(id => $(id).addEventListener('click', e => { e.preventDefault(); menu.classList.remove('open'); openChat(); }));

function addMsg(text, who) {
  const m = document.createElement('div');
  m.className = 'msg ' + who; m.textContent = text;
  body.appendChild(m); body.scrollTop = body.scrollHeight;
  return m;
}
// Keyword → reply. First match wins. Add your own here.
const REPLIES = [
  [['milk'], 'Our milk is available in 1 L and 500 ml packs, with Toned and Double Toned options.'],
  [['curd', 'paneer', 'lassi', 'buttermilk', 'chakka', 'product'], 'We offer Milk, Curd, Paneer, Buttermilk, Chakka and Lassi. Check the Our Products section for sizes.'],
  [['deliver', 'order'], 'We provide direct farm-to-home delivery. Please contact us for delivery availability.'],
  [['price', 'cost', 'rate'], 'Please select a product to view available quantities and pricing.'],
  [['human', 'agent', 'call', 'contact'], 'Our team will be happy to help. Use the Contact Us button at the top of the page.'],
  [['general', 'about', 'hello', 'hi'], 'GAU DHARA supplies fresh dairy directly from farmers to your home. Ask me about products or delivery!']
];
function reply(text) {
  const t = text.toLowerCase();
  const hit = REPLIES.find(([keys]) => keys.some(k => t.includes(k)));
  return hit ? hit[1] : 'I’m still learning! You can contact our team for more help.';
}
function send(text) {
  text = text.trim(); if (!text) return;
  addMsg(text, 'user');
  const typing = addMsg('', 'bot'); typing.classList.add('typing');
  typing.innerHTML = '<span></span><span></span><span></span>';
  setTimeout(() => { typing.classList.remove('typing'); typing.textContent = reply(text); body.scrollTop = body.scrollHeight; }, 900);
}
$('#chatForm').addEventListener('submit', e => {
  e.preventDefault();
  const input = $('#chatInput');
  if (!input.value.trim()) { input.focus(); return; }   // basic validation
  send(input.value); input.value = '';
});
$$('#quick button').forEach(b => b.addEventListener('click', () => send(b.textContent)));
setActive();




/* GAU DHARA – vanilla JavaScript */
'use strict';
const $ = (s, p = document) => p.querySelector(s) || document.createElement('div'); // safe: never null
const $$ = (s, p = document) => [...p.querySelectorAll(s)];

/* ===== 1. PRODUCT DATA – edit names, quantities, colours, icons here ===== */
const PRODUCTS = [
  { name:'Milk',       icon:'🥛', color:'c-blue',   info:'Fresh, creamy milk from local cows.', qty:['1 L','500 ml'], types:['Toned','Double Toned'] },
  { name:'Curd',       icon:'🥣', color:'c-green',  info:'Thick, set curd with natural cultures.', qty:['250 g','500 g'] },
  { name:'Paneer',     icon:'🧀', color:'c-yellow', info:'Soft, fresh paneer made daily.', qty:['100 g','250 g','500 g'] },
  { name:'Buttermilk', icon:'🥤', color:'c-pink',   info:'Light, cooling and spiced.', qty:['500 ml','1 L'] },
  { name:'Chakka',     icon:'🍚', color:'c-purple', info:'Strained curd, perfect for shrikhand.', qty:['500 ml','1 L'] },
  { name:'Lassi',      icon:'🍶', color:'c-blue',   info:'Sweet, chilled and refreshing.', qty:['200 ml'] }
];

/* ===== 2. TOAST + MODAL ===== */
const toast = $('#toast'); let toastTimer;
function showToast(msg) {
  toast.textContent = msg; toast.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2200);
}
function showModal(title, text) {
  $('#modalTitle').textContent = title; $('#modalText').textContent = text;
  $('#modal').hidden = false; $('#modalClose').focus();
}
$('#modalClose').onclick = () => $('#modal').hidden = true;
$('#modal').onclick = e => { if (e.target.id === 'modal') e.target.hidden = true; };
document.addEventListener('keydown', e => { if (e.key === 'Escape') { $('#modal').hidden = true; $('#chat').hidden = true; } });

/* ===== 3. BUILD PRODUCT CARDS ===== */
const cart = [];
const grid = $('#productGrid');
PRODUCTS.forEach(p => {
  const card = document.createElement('article');
  card.className = `card ${p.color} reveal`;
  const chips = (arr, group) => arr.map(v => `<button class="chip" data-group="${group}">${v}</button>`).join('');
  card.innerHTML = `
    <div class="pic" aria-hidden="true">${p.icon}</div>
    <h3>${p.icon} ${p.name}</h3>
    <p class="info">${p.info}</p>
    <span class="lbl">Quantity:</span><div class="chips">${chips(p.qty, 'qty')}</div>
    ${p.types ? `<span class="lbl">Types:</span><div class="chips">${chips(p.types, 'type')}</div>` : ''}
    <p class="sel" aria-live="polite"></p>
    <button class="btn btn-green add">Add to Cart</button>`;
  grid.appendChild(card);

  const chosen = { qty: null, type: null };
  const sel = $('.sel', card);
  // Quantity / type selection
  $$('.chip', card).forEach(chip => chip.addEventListener('click', () => {
    $$(`.chip[data-group="${chip.dataset.group}"]`, card).forEach(c => c.classList.remove('on'));
    chip.classList.add('on');
    chosen[chip.dataset.group] = chip.textContent;
    sel.textContent = `✔ ${chip.textContent} selected`;
  }));
  // Add to cart
  $('.add', card).addEventListener('click', () => {
    if (!chosen.qty) { sel.textContent = 'Please choose a quantity first.'; showToast('Choose a quantity first'); return; }
    if (p.types && !chosen.type) { sel.textContent = 'Please choose a type too.'; showToast('Choose a type first'); return; }
    cart.push({ name: p.name, ...chosen });
    $('#cartCount').textContent = cart.length;
    showToast(`${p.name} (${chosen.qty}${chosen.type ? ', ' + chosen.type : ''}) added to cart`);
  });
});
$('#cartBtn').onclick = () => cart.length
  ? showModal('Your cart', cart.map(i => `${i.name} ${i.qty}${i.type ? ' – ' + i.type : ''}`).join(' • '))
  : showToast('Your cart is empty');

/* ===== 4. NAVBAR: hamburger, active link, chat link ===== */
const burger = $('#burger'), menu = $('#menu');
burger.onclick = () => {
  const open = menu.classList.toggle('open');
  burger.setAttribute('aria-expanded', open);
  burger.textContent = open ? '✕' : '☰';
};
$$('.links a[href^="#"]').forEach(a => a.addEventListener('click', () => { menu.classList.remove('open'); burger.textContent = '☰'; }));
const sections = $$('main section[id]');
function setActive() {
  let current = 'home';
  sections.forEach(s => { if (scrollY + 160 >= s.offsetTop) current = s.id; });
  if (current === 'products') current = 'home';
  $$('.links a[href^="#"]').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + current));
}
$('#loginBtn').onclick = () => showModal('Login / Sign In', 'Accounts are coming soon. For now you can browse and add items to your cart.');
$('#contactBtn').onclick = () => showModal('Contact Us', 'Email: hello@gaudhara.example • Phone: +91 00000 00000');
$$('[data-social]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); showToast(`${a.dataset.social} page coming soon`); }));

/* ===== 5. SCROLL: top button, reveal ===== */
const toTop = $('#toTop');
addEventListener('scroll', () => { toTop.hidden = scrollY < 500; setActive(); }, { passive: true });
toTop.onclick = () => scrollTo({ top: 0, behavior: 'smooth' });
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .15 });
$$('.reveal').forEach(el => io.observe(el));

/* ===== 6. INSIGHTS: read more / less ===== */
$$('.readmore').forEach(btn => btn.addEventListener('click', () => {
  const more = btn.previousElementSibling, open = more.hidden;
  more.hidden = !open;
  btn.textContent = open ? 'Show Less ↑' : 'Read More →';
  btn.setAttribute('aria-expanded', open);
}));

/* ===== 7. CAMPAIGN MODAL ===== */
$('#joinBtn').onclick = () => showModal('Thank you! 🌾', 'You are part of the GAU DHARA campaign. Know your farmer, choose fresh and support local.');

/* ===== 8. CHATBOT ===== */
const chat = $('#chat'), body = $('#chatBody');
function openChat() {
  chat.hidden = false;
  if (!body.children.length) addMsg('Hi! 👋 I’m your Gau Dhara assistant. How can I help you today?', 'bot');
  $('#chatInput').focus();
}
$('#chatFab').onclick = () => chat.hidden ? openChat() : chat.hidden = true;
$('#chatClose').onclick = () => chat.hidden = true;
['#navChat', '#footChat'].forEach(id => $(id).addEventListener('click', e => { e.preventDefault(); menu.classList.remove('open'); openChat(); }));

function addMsg(text, who) {
  const m = document.createElement('div');
  m.className = 'msg ' + who; m.textContent = text;
  body.appendChild(m); body.scrollTop = body.scrollHeight;
  return m;
}
// Keyword → reply. First match wins. Add your own here.
const REPLIES = [
  [['milk'], 'Our milk is available in 1 L and 500 ml packs, with Toned and Double Toned options.'],
  [['curd', 'paneer', 'lassi', 'buttermilk', 'chakka', 'product'], 'We offer Milk, Curd, Paneer, Buttermilk, Chakka and Lassi. Check the Our Products section for sizes.'],
  [['deliver', 'order'], 'We provide direct farm-to-home delivery. Please contact us for delivery availability.'],
  [['price', 'cost', 'rate'], 'Please select a product to view available quantities and pricing.'],
  [['human', 'agent', 'call', 'contact'], 'Our team will be happy to help. Use the Contact Us button at the top of the page.'],
  [['general', 'about', 'hello', 'hi'], 'GAU DHARA supplies fresh dairy directly from farmers to your home. Ask me about products or delivery!']
];
function reply(text) {
  const t = text.toLowerCase();
  const hit = REPLIES.find(([keys]) => keys.some(k => t.includes(k)));
  return hit ? hit[1] : 'I’m still learning! You can contact our team for more help.';
}
function send(text) {
  text = text.trim(); if (!text) return;
  addMsg(text, 'user');
  const typing = addMsg('', 'bot'); typing.classList.add('typing');
  typing.innerHTML = '<span></span><span></span><span></span>';
  setTimeout(() => { typing.classList.remove('typing'); typing.textContent = reply(text); body.scrollTop = body.scrollHeight; }, 900);
}
$('#chatForm').addEventListener('submit', e => {
  e.preventDefault();
  const input = $('#chatInput');
  if (!input.value.trim()) { input.focus(); return; }   // basic validation
  send(input.value); input.value = '';
});
$$('#quick button').forEach(b => b.addEventListener('click', () => send(b.textContent)));
setActive();


// PRODUCTS PAGE JAVASCRIPT
// Paste at the END of your existing script.js.
// It reuses your $ / $$ helpers and showToast(), and only runs on products.html.

function initProductsPage() {
  /* ===== 1. PRODUCT DATA – edit prices, names, images here (prices are placeholders) ===== */
  const DESC = {
    'Toned Milk': 'Fresh and wholesome milk with a balanced taste for everyday nutrition.',
    'Double Toned Milk': 'Light and refreshing milk with reduced fat, perfect for everyday use.',
    'Curd': 'Creamy, fresh and naturally cultured curd for everyday meals.',
    'Paneer': 'Soft and fresh paneer, perfect for curries, snacks and homemade recipes.',
    'Buttermilk': 'Cool, refreshing and lightly spiced buttermilk for a refreshing break.',
    'Chakka': 'Thick, creamy and rich dairy goodness, perfect for traditional recipes and desserts.',
    'Lassi': 'Smooth and refreshing lassi made for a delicious dairy treat.'
  };
  const EMOJI = { Milk:'🥛', Curd:'🥣', Paneer:'🧀', Buttermilk:'🥤', Chakka:'🍚', Lassi:'🍶' };
  const COLOR = { Milk:'c-blue', Curd:'c-green', Paneer:'c-yellow', Buttermilk:'c-pink', Chakka:'c-purple', Lassi:'c-blue' };
  const A = 'assets/products/';
  const products = [
    { id:1,  name:'Toned Milk',        category:'Milk',       quantity:'1 L',    price:60,  image:A+'milk-toned-1l.png' },
    { id:2,  name:'Toned Milk',        category:'Milk',       quantity:'500 ml', price:30,  image:A+'milk-toned-500ml.png' },
    { id:3,  name:'Double Toned Milk', category:'Milk',       quantity:'1 L',    price:56,  image:A+'milk-double-toned-1l.png' },
    { id:4,  name:'Double Toned Milk', category:'Milk',       quantity:'500 ml', price:28,  image:A+'milk-double-toned-500ml.png' },
    { id:5,  name:'Curd',              category:'Curd',       quantity:'250 g',  price:30,  image:A+'curd-250g.png' },
    { id:6,  name:'Curd',              category:'Curd',       quantity:'500 g',  price:55,  image:A+'curd-500g.png' },
    { id:7,  name:'Paneer',            category:'Paneer',     quantity:'100 g',  price:45,  image:A+'paneer-100g.png' },
    { id:8,  name:'Paneer',            category:'Paneer',     quantity:'250 g',  price:105, image:A+'paneer-250g.png' },
    { id:9,  name:'Paneer',            category:'Paneer',     quantity:'500 g',  price:200, image:A+'paneer-500g.png' },
    { id:10, name:'Buttermilk',        category:'Buttermilk', quantity:'500 ml', price:20,  image:A+'buttermilk-500ml.png' },
    { id:11, name:'Buttermilk',        category:'Buttermilk', quantity:'1 L',    price:35,  image:A+'buttermilk-1l.png' },
    { id:12, name:'Chakka',            category:'Chakka',     quantity:'500 ml', price:90,  image:A+'chakka-500ml.png' },
    { id:13, name:'Chakka',            category:'Chakka',     quantity:'1 L',    price:170, image:A+'chakka-1l.png' },
    { id:14, name:'Lassi',             category:'Lassi',      quantity:'200 ml', price:25,  image:A+'lassi-200ml.png' }
  ];
  const byId = Object.fromEntries(products.map(p => [p.id, p]));
  const grid = $('#pGrid');

  /* ===== 2. IMAGE with emoji fallback (page never breaks if a file is missing) ===== */
  function picHTML(p) {
    return `<img src="${p.image}" alt="${p.name} ${p.quantity}" loading="lazy" data-emoji="${EMOJI[p.category]}">`;
  }
  function useFallback(root) {
    $$('img[data-emoji]', root).forEach(img => img.addEventListener('error', () => {
      const s = document.createElement('span');
      s.className = 'p-emoji'; s.textContent = img.dataset.emoji; s.setAttribute('aria-hidden', 'true');
      img.replaceWith(s);
    }));
  }

  /* ===== 3. RENDER CARDS ===== */
  grid.innerHTML = products.map(p => `
    <article class="pcard ${COLOR[p.category]}" data-id="${p.id}">
      <span class="badge">${p.category}</span>
      <div class="p-pic">${picHTML(p)}</div>
      <h3>${p.name}</h3>
      <p class="qty">${p.quantity}</p>
      <p class="desc">${DESC[p.name]}</p>
      <div class="pcard-foot">
        <span class="price">₹${p.price}</span>
        <button type="button" class="btn add" data-add="${p.id}">Add to Cart</button>
      </div>
    </article>`).join('');
  useFallback(grid);
  const cards = $$('.pcard', grid);

  /* ===== 4. FILTER + SEARCH (they work together) ===== */
  let category = 'All', query = '';
  function showCard(card, ok) {
    if (ok) {
      if (card.hidden) {
        card.hidden = false;
        requestAnimationFrame(() => requestAnimationFrame(() => card.classList.remove('is-off')));
      } else card.classList.remove('is-off');
    } else {
      card.classList.add('is-off');
      setTimeout(() => { if (card.classList.contains('is-off')) card.hidden = true; }, 250);
    }
  }
  function applyFilters() {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    let shown = 0;
    cards.forEach(card => {
      const p = byId[card.dataset.id];
      // searchable words: name, category, quantity ("500", "ml", and "500ml")
      const words = (p.name + ' ' + p.category + ' ' + p.quantity).toLowerCase().split(/\s+/)
        .concat(p.quantity.toLowerCase().replace(/\s/g, ''));
      const ok = (category === 'All' || p.category === category) &&
                 terms.every(t => words.some(w => w.startsWith(t)));
      if (ok) shown++;
      showCard(card, ok);
    });
    $('#pCount').textContent = `Showing ${shown} of ${products.length} products`;
    $('#pEmpty').hidden = shown > 0;
  }
  $('#pFilters').addEventListener('click', e => {
    const b = e.target.closest('.p-filter'); if (!b) return;
    $$('.p-filter').forEach(x => { x.classList.remove('on'); x.setAttribute('aria-pressed', 'false'); });
    b.classList.add('on'); b.setAttribute('aria-pressed', 'true');
    category = b.dataset.cat; applyFilters();
  });
  $('#pSearch').addEventListener('input', e => { query = e.target.value; applyFilters(); });
  $('#pReset').addEventListener('click', () => {
    query = ''; $('#pSearch').value = '';
    $('.p-filter[data-cat="All"]').click();
  });
  applyFilters();

  /* ===== 5. CART (saved in localStorage so it survives page changes) ===== */
  let cart = [];                                   // [{id, qty}]
  try { cart = JSON.parse(localStorage.getItem('gdCart')) || []; } catch (e) { cart = []; }
  const drawer = $('#drawer'), bg = $('#drawerBg');

  function renderCart() {
    try { localStorage.setItem('gdCart', JSON.stringify(cart)); } catch (e) {}
    $('#cartCount').textContent = cart.reduce((n, i) => n + i.qty, 0);
    const total = cart.reduce((n, i) => n + i.qty * byId[i.id].price, 0);
    $('#drawerTotal').textContent = '₹' + total;
    $('#drawerList').innerHTML = cart.length ? cart.map(i => {
      const p = byId[i.id];
      return `<div class="c-item">
        <div><b>${p.name}</b><small>${p.quantity} • ₹${p.price} each</small></div>
        <b>₹${p.price * i.qty}</b>
        <div class="c-ctrl">
          <button type="button" data-act="dec" data-id="${p.id}" aria-label="Decrease quantity">−</button>
          <span>${i.qty}</span>
          <button type="button" data-act="inc" data-id="${p.id}" aria-label="Increase quantity">+</button>
          <button type="button" class="c-del" data-act="del" data-id="${p.id}">Remove</button>
        </div></div>`;
    }).join('') : '<p class="c-empty">🛒 Your cart is empty.<br>Add some fresh dairy!</p>';
  }
  function addToCart(id) {
    const item = cart.find(i => i.id === id);
    item ? item.qty++ : cart.push({ id, qty: 1 });
    renderCart();
    const p = byId[id];
    showToast(`${p.name} (${p.quantity}) added to cart!`);
    const btn = $('#cartBtn'); btn.classList.remove('bump'); void btn.offsetWidth; btn.classList.add('bump');
  }
  function openDrawer()  { drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false'); bg.hidden = false; }
  function closeDrawer() { drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); bg.hidden = true; }

  $('#drawerList').addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const id = +b.dataset.id, item = cart.find(i => i.id === id);
    if (b.dataset.act === 'inc') item.qty++;
    if (b.dataset.act === 'dec') item.qty--;
    if (b.dataset.act === 'del' || item.qty < 1) cart = cart.filter(i => i.id !== id);
    renderCart();
  });
  $('#cartBtn').onclick = openDrawer;              // overrides the home-page cart popup
  $('#drawerClose').onclick = closeDrawer;
  bg.onclick = closeDrawer;
  $('#checkoutBtn').onclick = () => showToast(cart.length ? 'Checkout feature coming soon.' : 'Your cart is empty.');
  renderCart();

  /* ===== 6. PRODUCT DETAILS MODAL ===== */
  const pm = $('#pModal'); let pmId = null;
  function openDetails(id) {
    const p = byId[id]; pmId = id;
    $('#pmPic').innerHTML = picHTML(p); useFallback($('#pmPic'));
    $('#pmCat').textContent = p.category;
    $('#pmName').textContent = p.name;
    $('#pmQty').textContent = p.quantity;
    $('#pmDesc').textContent = DESC[p.name];
    $('#pmPrice').textContent = '₹' + p.price;
    pm.hidden = false; $('#pmClose').focus();
  }
  function closeDetails() { pm.hidden = true; }
  grid.addEventListener('click', e => {
    const add = e.target.closest('[data-add]');
    if (add) { addToCart(+add.dataset.add); return; }       // Add to Cart button
    const card = e.target.closest('.pcard');
    if (card) openDetails(+card.dataset.id);                // anywhere else on the card
  });
  $('#pmAdd').onclick = () => { addToCart(pmId); closeDetails(); };
  $('#pmClose').onclick = closeDetails;
  pm.addEventListener('click', e => { if (e.target === pm) closeDetails(); });   // click outside
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeDetails(); closeDrawer(); } });
}
// Only run on products.html (the page that has #pGrid)
if (document.getElementById('pGrid')) initProductsPage();