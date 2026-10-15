/* GAU DHARA – Offers page (vanilla JavaScript). Loaded with "defer", so the HTML is ready. */
'use strict';
const $ = (s, p = document) => p.querySelector(s);
const $$ = (s, p = document) => [...p.querySelectorAll(s)];

/* ===== 1. DATA – edit products, prices and image links here ===== */
const PRODUCTS = [
  { cat:'Doodh',  name:'Doodh / Milk', emoji:'🥛', off:20, now:48,  was:60,  desc:'Fresh daily milk for tea, coffee, breakfast and family meals.', img:'https://nutritionsource.hsph.harvard.edu/wp-content/uploads/2024/11/AdobeStock_354060824-1024x683.jpeg' },
  { cat:'Dahi',   name:'Dahi / Curd',  emoji:'🥣', off:15, now:42,  was:50,  desc:'Thick, creamy and perfect for every Indian meal.', img:'https://www.ruchiskitchen.com/wp-content/uploads/2014/06/How-to-set-curd-in-winters-11-768x1152.jpg.webp' },
  { cat:'Lassi',  name:'Lassi',        emoji:'🍶', off:25, now:30,  was:40,  desc:'Cool, creamy and refreshing — your perfect dairy drink.', img:'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRp9pt_VtVx0X9IqCDCsWGlS41ZEJt9NGAZWtc6waFv0LQ5ZOLQQYLRLz8&s=10' },
  { cat:'Paneer', name:'Paneer',       emoji:'🧀', off:18, now:205, was:250, desc:'Soft, fresh paneer for curries, snacks and celebrations.', img:'https://5.imimg.com/data5/ANDROID/Default/2023/3/EH/YT/EO/108385388/product-jpeg-500x500.jpg' },
  { cat:'Ghee',   name:'Ghee',         emoji:'🍯', off:20, now:400, was:500, desc:'Rich, aromatic ghee for cooking, sweets and festive recipes.', img:'https://patnamlopalleruchulu.in/wp-content/uploads/2024/09/JERSEY-COW-GHEE-580x560.jpg' },
];
const FESTIVALS = [
  { emoji:'🪔', fest:'DIWALI',          title:'Diwali Doodh & Ghee Combo', off:'20% OFF',        desc:'Buy festive dairy essentials and save more this Diwali.', msg:'Diwali Offer selected! 🪔 Enjoy 20% OFF on the festive combo.' },
  { emoji:'🎀', fest:'RAKSHA BANDHAN',  title:'Rakhi Family Treat',        off:'15% OFF',        desc:'Family-size dahi and lassi combo.', msg:'Raksha Bandhan Offer selected! 🎀 Enjoy 15% OFF on the family treat.' },
  { emoji:'🌈', fest:'HOLI',            title:'Rangon Wali Lassi',         off:'Buy 3 Get 1 FREE', desc:'Make your Holi celebrations cooler and tastier.', msg:'Holi Offer selected! 🌈 Buy 3 lassi and get 1 FREE.' },
  { emoji:'🦚', fest:'JANMASHTAMI',     title:'Makhan Mishri Special',     off:'18% OFF',        desc:'Special chakka and ghee combo for Janmashtami.', msg:'Janmashtami Offer selected! 🦚 Enjoy 18% OFF on chakka and ghee.' },
  { emoji:'🏹', fest:'DUSSEHRA',        title:'Goodness Wins',             off:'20% OFF',        desc:'Save on selected family dairy packs.', msg:'Dussehra Offer selected! 🏹 Enjoy 20% OFF on family dairy packs.' },
  { emoji:'🌺', fest:'NAVRATRI',        title:'Satvik Dairy Picks',        off:'15% OFF',        desc:'Paneer and dahi combo for your festive meals.', msg:'Navratri Offer selected! 🌺 Enjoy 15% OFF on paneer and dahi.' },
  { emoji:'🐘', fest:'GANESH CHATURTHI',title:'Modak Making Combo',        off:'20% OFF',        desc:'Ghee and milk combo for your festive sweets.', msg:'Ganesh Chaturthi Offer selected! 🐘 Enjoy 20% OFF on ghee and milk.' },
  { emoji:'❄️', fest:'WINTER SPECIAL',  title:'Warm & Wholesome',          off:'25% OFF',        desc:'Special savings on milk and ghee combos.', msg:'Winter Special selected! ❄️ Enjoy 25% OFF on milk and ghee combos.' },
  { emoji:'🎄', fest:'CHRISTMAS',       title:'Merry Dairy Treats',        off:'20% OFF',        desc:'Celebrate Christmas with a special family dairy pack.', msg:'Christmas Offer selected! 🎄 Enjoy 20% OFF on the family dairy pack.' }
];

/* ===== 2. TOAST ===== */
const toast = $('#toast'); let toastTimer;
function showToast(msg) {
  toast.textContent = msg; toast.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

/* ===== 3. IMAGES with graceful fallback (no broken-image icons) ===== */
function imgHTML(src, alt, emoji) {
  return `<img src="${src}" alt="${alt}" loading="lazy" referrerpolicy="no-referrer" data-emoji="${emoji}">`;
}
function swapToFallback(img) {
  const f = document.createElement('div');
  f.className = 'img-fallback'; f.textContent = img.dataset.emoji;
  f.setAttribute('role', 'img'); f.setAttribute('aria-label', img.alt);
  img.replaceWith(f);
}
function watchImages(root) {
  $$('img[data-emoji]', root).forEach(img => {
    img.addEventListener('error', () => swapToFallback(img));
    if (img.complete && img.naturalWidth === 0 && img.src) swapToFallback(img);   // already failed
  });
}

/* ===== 4. RENDER PRODUCT CARDS ===== */
const grid = $('#productGrid');
grid.innerHTML = PRODUCTS.map(p => `
  <article class="card" data-cat="${p.cat}">
    <span class="disc">${p.off}% OFF</span>
    <div class="img-box">${imgHTML(p.img, p.name + ' – fresh GAU DHARA dairy', p.emoji)}</div>
    <div class="card-body">
      <span class="cat">${p.cat.toUpperCase()}</span>
      <h3>${p.name}</h3>
      <p>${p.desc}</p>
      <div class="prices"><span class="old">₹${p.was}</span><span class="new">₹${p.now}</span></div>
      <button type="button" class="btn btn-green" data-grab="${p.cat}" data-emoji="${p.emoji}">Grab Offer</button>
    </div>
  </article>`).join('');
watchImages(grid);

/* Hero image (milk) */
$('#heroImg').innerHTML = imgHTML(PRODUCTS[0].img, 'Glass of fresh milk from GAU DHARA', '🥛');
watchImages($('#heroImg'));

/* ===== 5. FILTER ===== */
$('#filters').addEventListener('click', e => {
  const btn = e.target.closest('.filter'); if (!btn) return;
  $$('.filter').forEach(b => { b.classList.remove('on'); b.setAttribute('aria-pressed', 'false'); });
  btn.classList.add('on'); btn.setAttribute('aria-pressed', 'true');
  $$('.card', grid).forEach(card => {
    const show = btn.dataset.cat === 'All' || card.dataset.cat === btn.dataset.cat;
    card.hidden = !show;
    card.classList.remove('pop');
    if (show) { void card.offsetWidth; card.classList.add('pop'); }   // restart the animation
  });
});

/* ===== 6. GRAB OFFER + COUNTER ===== */
let offerCount = 0;
grid.addEventListener('click', e => {
  const btn = e.target.closest('[data-grab]'); if (!btn) return;
  offerCount++;
  $('#offerCount').textContent = offerCount;
  showToast(`${btn.dataset.grab} offer added successfully! ${btn.dataset.emoji}`);
});

/* ===== 7. FESTIVAL CARDS ===== */
$('#festGrid').innerHTML = FESTIVALS.map((f, i) => `
  <article class="fest reveal">
    <span class="emoji" aria-hidden="true">${f.emoji}</span>
    <small>${f.fest}</small>
    <h3>${f.title}</h3>
    <span class="off">${f.off}</span>
    <p>${f.desc}</p>
    <button type="button" data-fest="${i}">View Offer →</button>
  </article>`).join('');
$('#festGrid').addEventListener('click', e => {
  const btn = e.target.closest('[data-fest]'); if (!btn) return;
  showToast(FESTIVALS[btn.dataset.fest].msg);
});

/* ===== 8. NAVBAR: hamburger, smooth scroll, header buttons ===== */
const burger = $('#burger'), menu = $('#menu');
function closeMenu() { menu.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); burger.textContent = '☰'; }
burger.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  burger.setAttribute('aria-expanded', open); burger.textContent = open ? '✕' : '☰';
});
// Smooth scroll for links like href="#offers" (other pages' links work normally)
$$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
  const id = a.getAttribute('href');
  if (id.length > 1 && $(id)) { e.preventDefault(); $(id).scrollIntoView({ behavior: 'smooth' }); closeMenu(); }
}));
$$('[data-social]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); showToast(`${a.dataset.social} page coming soon`); }));

/* ===== 9. BACK TO TOP + SCROLL REVEAL ===== */
const toTop = $('#toTop');
addEventListener('scroll', () => { toTop.hidden = scrollY < 500; }, { passive: true });
toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));
// Fade/slide elements in once as they enter the screen
$$('.card, .reveal').forEach(el => { if (!el.classList.contains('reveal')) el.classList.add('reveal'); });
const io = new IntersectionObserver(entries => entries.forEach(en => {
  if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
}), { threshold: .12 });
$$('.reveal').forEach(el => io.observe(el));