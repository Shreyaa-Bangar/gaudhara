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

/* =====================================================================
   PRODUCTS PAGE (products.html)
   Database rows are one-per-size (e.g. "Paneer 100 g", "Paneer 250 g"). Here they are GROUPED by name,
   so each product appears once and the shopper picks a quantity; the price shows after that choice.
   Products come from GET /api/products (edit them in the Admin portal); if the server can't be reached,
   the built-in list below is shown so the page never looks empty.
   ===================================================================== */
const FALLBACK_PRODUCTS = [
  { id:1,  name:'Toned Milk',        category:'Milk',       quantity:'1 L',    price:60 },
  { id:2,  name:'Toned Milk',        category:'Milk',       quantity:'500 ml', price:30 },
  { id:3,  name:'Double Toned Milk', category:'Milk',       quantity:'1 L',    price:56 },
  { id:4,  name:'Double Toned Milk', category:'Milk',       quantity:'500 ml', price:28 },
  { id:5,  name:'Curd',              category:'Curd',       quantity:'250 g',  price:30 },
  { id:6,  name:'Curd',              category:'Curd',       quantity:'500 g',  price:55 },
  { id:7,  name:'Paneer',            category:'Paneer',     quantity:'100 g',  price:45 },
  { id:8,  name:'Paneer',            category:'Paneer',     quantity:'250 g',  price:105 },
  { id:9,  name:'Paneer',            category:'Paneer',     quantity:'500 g',  price:200 },
  { id:10, name:'Buttermilk',        category:'Buttermilk', quantity:'500 ml', price:20 },
  { id:11, name:'Buttermilk',        category:'Buttermilk', quantity:'1 L',    price:35 },
  { id:12, name:'Chakka',            category:'Chakka',     quantity:'500 ml', price:90 },
  { id:13, name:'Chakka',            category:'Chakka',     quantity:'1 L',    price:170 },
  { id:14, name:'Lassi',             category:'Lassi',      quantity:'200 ml', price:25 }
];
const EMOJI = { Milk:'🥛', Curd:'🥣', Paneer:'🧀', Buttermilk:'🥤', Chakka:'🍚', Lassi:'🍶' };
const COLOR = { Milk:'c-blue', Curd:'c-green', Paneer:'c-yellow', Buttermilk:'c-pink', Chakka:'c-purple', Lassi:'c-blue' };
const DEFAULT_DESC = 'Fresh dairy from GAU DHARA, delivered straight from the farm.';
const HINT = 'Select a quantity to see the price';

// Product names/descriptions come from the database, so always escape before putting them in HTML.
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

async function loadProducts() {
  try {
    return (await GD.api('/api/products')).products;      // from Supabase (see nav.js)
  } catch (e) {
    console.warn('Could not load products from the database – showing the built-in list.', e);
    return FALLBACK_PRODUCTS;
  }
}

async function initProductsPage() {
  const rows = await loadProducts();
  const byId = Object.fromEntries(rows.map(p => [p.id, p]));
  const grid = $('#pGrid');

  /* ===== 1. GROUP size-rows into one product each (cheapest/smallest size first) ===== */
  const map = new Map(), groups = [];
  rows.forEach(r => {
    const key = r.name.trim().toLowerCase();
    if (!map.has(key)) { const g = { idx: groups.length, name: r.name, category: r.category, description: '', image: '', variants: [] }; map.set(key, g); groups.push(g); }
    const g = map.get(key);
    g.variants.push(r);
    g.description = g.description || r.description || '';
    g.image = g.image || r.image || '';
  });
  groups.forEach(g => g.variants.sort((a, b) => a.price - b.price));
  const selected = {};                                   // group index -> chosen variant (row) id
  const emojiOf = g => EMOJI[g.category] || '🥛';

  /* ===== 2. CATEGORY FILTER BUTTONS (built from the products, so new categories appear automatically) ===== */
  const categories = [...new Set(groups.map(g => g.category))];
  $('#pFilters').innerHTML = ['All', ...categories].map((c, i) =>
    `<button type="button" class="p-filter${i ? '' : ' on'}" data-cat="${esc(c)}" aria-pressed="${i ? 'false' : 'true'}">${esc(c)}</button>`).join('');

  /* ===== 3. IMAGE with emoji fallback (page never breaks if a file is missing) ===== */
  function picHTML(g) {
    if (!g.image) return `<span class="p-emoji" aria-hidden="true">${emojiOf(g)}</span>`;
    return `<img src="${esc(g.image)}" alt="${esc(g.name)}" loading="lazy" referrerpolicy="no-referrer" data-emoji="${emojiOf(g)}">`;
  }
  function useFallback(root) {
    $$('img[data-emoji]', root).forEach(img => img.addEventListener('error', () => {
      const s = document.createElement('span');
      s.className = 'p-emoji'; s.textContent = img.dataset.emoji; s.setAttribute('aria-hidden', 'true');
      img.replaceWith(s);
    }));
  }
  const chipsHTML = g => g.variants.map(v =>
    `<button type="button" class="chip" role="radio" aria-checked="false" data-g="${g.idx}" data-v="${v.id}">${esc(v.quantity)}</button>`).join('');
  const priceText = g => selected[g.idx] ? '₹' + byId[selected[g.idx]].price : HINT;

  /* ===== 4. RENDER CARDS (one per product) ===== */
  grid.innerHTML = groups.map(g => `
    <article class="pcard ${COLOR[g.category] || 'c-green'}" data-g="${g.idx}">
      <span class="badge">${esc(g.category)}</span>
      <div class="p-pic">${picHTML(g)}</div>
      <h3>${esc(g.name)}</h3>
      <p class="desc">${esc(g.description || DEFAULT_DESC)}</p>
      <p class="lbl">Quantity</p>
      <div class="chips" role="radiogroup" aria-label="Quantity for ${esc(g.name)}">${chipsHTML(g)}</div>
      <div class="pcard-foot">
        <span class="price-line" aria-live="polite">${HINT}</span>
        <button type="button" class="btn add" data-add="${g.idx}">Add to Cart</button>
      </div>
    </article>`).join('');
  useFallback(grid);
  const cards = $$('.pcard', grid);

  // keep a card's chips + price in sync with the selection (also used by the details popup)
  function syncCard(g) {
    const card = cards[g.idx], v = selected[g.idx];
    $$('.chip', card).forEach(c => { const on = +c.dataset.v === v; c.classList.toggle('on', on); c.setAttribute('aria-checked', on); });
    const pl = $('.price-line', card);
    pl.textContent = priceText(g); pl.classList.toggle('set', !!v);
  }
  function choose(gi, vid) { selected[gi] = vid; syncCard(groups[gi]); if (!pm.hidden && pmIdx === gi) syncModal(); }

  /* ===== 5. FILTER + SEARCH (they work together) ===== */
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
    cards.forEach((card, i) => {
      const g = groups[i];
      // searchable words: name, category and every size ("500", "ml", and "500ml")
      const words = (g.name + ' ' + g.category + ' ' + g.variants.map(v => v.quantity).join(' ')).toLowerCase().split(/\s+/)
        .concat(g.variants.map(v => v.quantity.toLowerCase().replace(/\s/g, '')));
      const ok = (category === 'All' || g.category === category) && terms.every(t => words.some(w => w.startsWith(t)));
      if (ok) shown++;
      showCard(card, ok);
    });
    $('#pCount').textContent = `Showing ${shown} of ${groups.length} products`;
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

  /* ===== 6. CART (shared store in nav.js, so cart.html sees the same items) ===== */
  let cart = GD.cart.read().filter(i => byId[i.id]);     // drop anything no longer sold
  const drawer = $('#drawer'), bg = $('#drawerBg');
  function renderCart() {
    GD.cart.write(cart);
    $('#cartCount').textContent = cart.reduce((n, i) => n + i.qty, 0);
    $('#drawerTotal').textContent = '₹' + cart.reduce((n, i) => n + i.qty * byId[i.id].price, 0);
    $('#checkoutBtn').classList.toggle('disabled', !cart.length);
    $('#drawerList').innerHTML = cart.length ? cart.map(i => {
      const p = byId[i.id];
      return `<div class="c-item">
        <div><b>${esc(p.name)}</b><small>${esc(p.quantity)} • ₹${p.price} each</small></div>
        <b>₹${p.price * i.qty}</b>
        <div class="c-ctrl">
          <button type="button" data-act="dec" data-id="${p.id}" aria-label="Decrease quantity">−</button>
          <span>${i.qty}</span>
          <button type="button" data-act="inc" data-id="${p.id}" aria-label="Increase quantity">+</button>
          <button type="button" class="c-del" data-act="del" data-id="${p.id}">Remove</button>
        </div></div>`;
    }).join('') : '<p class="c-empty">🛒 Your cart is empty.<br>Add some fresh dairy!</p>';
  }
  function addToCart(gi) {
    const g = groups[gi], vid = selected[gi];
    if (!vid) {                                           // no quantity chosen yet: guide the shopper
      showToast(`Please select a quantity for ${g.name}`);
      const box = $('.chips', cards[gi]); box.classList.remove('need'); void box.offsetWidth; box.classList.add('need');
      return false;
    }
    const item = cart.find(i => i.id === vid);
    if (item) { if (item.qty >= 50) { showToast('Maximum 50 per item'); return false; } item.qty++; } else cart.push({ id: vid, qty: 1 });
    renderCart();
    showToast(`${g.name} (${byId[vid].quantity}) added to cart!`);
    const btn = $('#cartBtn'); btn.classList.remove('bump'); void btn.offsetWidth; btn.classList.add('bump');
    return true;
  }
  function openDrawer()  { drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false'); bg.hidden = false; }
  function closeDrawer() { drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); bg.hidden = true; }
  $('#drawerList').addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const id = +b.dataset.id, item = cart.find(i => i.id === id);
    if (!item) return;
    if (b.dataset.act === 'inc' && item.qty < 50) item.qty++;
    if (b.dataset.act === 'dec') item.qty--;
    if (b.dataset.act === 'del' || item.qty < 1) cart = cart.filter(i => i.id !== id);
    renderCart();
  });
  $('#cartBtn').onclick = openDrawer;              // overrides the home-page cart popup
  $('#drawerClose').onclick = closeDrawer;
  bg.onclick = closeDrawer;
  $('#checkoutBtn').addEventListener('click', e => { if (!cart.length) { e.preventDefault(); showToast('Your cart is empty.'); } });
  renderCart();

  /* ===== 7. PRODUCT DETAILS POPUP (same quantity chips + price) ===== */
  const pm = $('#pModal'); let pmIdx = null;
  function syncModal() {
    const g = groups[pmIdx];
    $$('.chip', $('#pmChips')).forEach(c => { const on = +c.dataset.v === selected[pmIdx]; c.classList.toggle('on', on); c.setAttribute('aria-checked', on); });
    const pr = $('#pmPrice'); pr.textContent = priceText(g); pr.classList.toggle('set', !!selected[pmIdx]);
  }
  function openDetails(gi) {
    const g = groups[gi]; pmIdx = gi;
    $('#pmPic').innerHTML = picHTML(g); useFallback($('#pmPic'));
    $('#pmCat').textContent = g.category;
    $('#pmName').textContent = g.name;
    $('#pmDesc').textContent = g.description || DEFAULT_DESC;
    $('#pmChips').innerHTML = chipsHTML(g);
    syncModal();
    pm.hidden = false; $('#pmClose').focus();
  }
  function closeDetails() { pm.hidden = true; }
  $('#pmChips').addEventListener('click', e => { const c = e.target.closest('.chip'); if (c) choose(+c.dataset.g, +c.dataset.v); });
  $('#pmAdd').onclick = () => { if (addToCart(pmIdx)) closeDetails(); else { const b = $('#pmChips'); b.classList.remove('need'); void b.offsetWidth; b.classList.add('need'); } };
  $('#pmClose').onclick = closeDetails;
  pm.addEventListener('click', e => { if (e.target === pm) closeDetails(); });   // click outside

  grid.addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (chip) { choose(+chip.dataset.g, +chip.dataset.v); return; }              // pick a quantity
    const add = e.target.closest('[data-add]');
    if (add) { addToCart(+add.dataset.add); return; }                            // Add to Cart button
    const card = e.target.closest('.pcard');
    if (card) openDetails(+card.dataset.g);                                      // anywhere else on the card
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeDetails(); closeDrawer(); } });
  applyFilters();
}
// Only run on products.html (the page that has #pGrid)
if (document.getElementById('pGrid')) initProductsPage();
