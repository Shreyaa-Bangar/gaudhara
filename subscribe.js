/* GAU DHARA – subscribe.html. Needs supabase-config.js and nav.js (for GD.ready / GD.user). Prices shown here are for display only:
   the subscribe() database function takes the real price from the products table. */
(function () {
  'use strict';
  const $ = (s, p = document) => p.querySelector(s);
  const $$ = (s, p = document) => [...p.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = n => '₹' + Number(n).toLocaleString('en-IN');
  const FREQ = { daily: ['Every day', 30], alternate: ['Alternate days', 15], weekly: ['Once a week', 4] };   // [label, deliveries in ~30 days]
  const PHONE_RE = /^(\+91[\s-]?)?[6-9]\d{9}$/;

  const burger = $('#burger'), menu = $('#menu');
  if (burger) burger.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    burger.setAttribute('aria-expanded', open); burger.textContent = open ? '✕' : '☰';
  });
  let toastTimer;
  function toast(msg) { const t = $('#toast'); if (!t) return; t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2400); }
  function setErr(input, msg) {
    const f = input.closest('.field'), out = f && $('.err', f);
    if (f) f.classList.toggle('bad', !!msg);
    if (out) out.textContent = msg || '';
    return !msg;
  }

  /* ---- products grouped by name, sizes as chips ---- */
  const form = $('#subForm'), sel = $('#sProduct'), sizes = $('#sSizes'), priceLine = $('#sPrice');
  let groups = [], chosen = null;     // chosen = product row for the selected size
  const dateIn = $('#sStart');
  const iso = d => { const z = n => String(n).padStart(2, '0'); return d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()); };
  const today = new Date(), max = new Date(); max.setDate(max.getDate() + 60);
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  dateIn.min = iso(today); dateIn.max = iso(max); dateIn.value = iso(tomorrow);

  function showPrice() {
    const qty = Math.floor(Number($('#sQty').value));
    if (!chosen || !(qty >= 1)) { priceLine.className = 'price-line'; priceLine.textContent = 'Select a size to see the price'; return; }
    const f = $('input[name=freq]:checked').value, per = chosen.price * qty;
    priceLine.className = 'price-line set';
    priceLine.innerHTML = `${money(per)} per delivery <small style="font-size:.8rem;font-family:var(--body)">· about ${money(per * FREQ[f][1])} for 30 days</small>`;
  }
  function drawSizes() {
    const g = groups[sel.selectedIndex]; chosen = null;
    sizes.innerHTML = g ? g.rows.map(r => `<button type="button" class="chip" data-id="${r.id}" aria-pressed="false">${esc(r.quantity)}</button>`).join('') : '';
    showPrice();
  }
  sizes.addEventListener('click', e => {
    const b = e.target.closest('.chip'); if (!b) return;
    const g = groups[sel.selectedIndex]; chosen = g.rows.find(r => String(r.id) === b.dataset.id);
    $$('.chip', sizes).forEach(c => { const on = c === b; c.classList.toggle('on', on); c.setAttribute('aria-pressed', on); });
    setErr(sizes, ''); showPrice();
  });
  sel.addEventListener('change', drawSizes);
  $('#sQty').addEventListener('input', showPrice);
  $$('input[name=freq]').forEach(r => r.addEventListener('change', showPrice));
  $$('.field input, .field textarea').forEach(i => i.addEventListener('input', () => setErr(i, '')));

  sb.from('products').select('id,name,category,quantity,price').eq('active', true).order('id').then(({ data: products, error }) => {
    if (error) throw error;
    const map = new Map();
    products.forEach(p => { if (!map.has(p.name)) map.set(p.name, { name: p.name, rows: [] }); map.get(p.name).rows.push(p); });
    groups = [...map.values()];
    groups.forEach(g => g.rows.sort((a, b) => a.price - b.price));
    sel.innerHTML = groups.map(g => `<option>${esc(g.name)}</option>`).join('');
    const want = new URLSearchParams(location.search).get('product');
    const i = groups.findIndex(g => g.name === want); if (i >= 0) sel.selectedIndex = i;
    drawSizes();
  }).catch(ex => { $('#formErr').textContent = ex.message; });

  /* ---- my subscriptions ---- */
  const list = $('#subList');
  async function loadMine() {
    const { data: subscriptions, error } = await sb.from('subscriptions').select('*').eq('user_id', GD.user.id).order('id', { ascending: false }).limit(100);
    if (error) throw error;
    list.innerHTML = subscriptions.length ? subscriptions.map(s => `
      <article class="order-card">
        <header><span>${esc(s.product_name)} (${esc(s.quantity)}) × ${s.qty}</span><span class="status ${esc(s.status)}">${esc(s.status)}</span></header>
        <small>${esc((FREQ[s.frequency] || [s.frequency])[0])} • from ${esc(s.start_date)} • ${money(s.price * s.qty)} per delivery</small>
        <div class="sub-actions">
          ${s.status === 'active' ? `<button type="button" data-sub="${s.id}" data-to="paused">Pause</button>` : ''}
          ${s.status === 'paused' ? `<button type="button" data-sub="${s.id}" data-to="active">Resume</button>` : ''}
          ${s.status !== 'cancelled' ? `<button type="button" data-sub="${s.id}" data-to="cancelled">Cancel</button>` : ''}
        </div>
      </article>`).join('') : '<p class="sub2">You have no subscriptions yet.</p>';
  }
  list.addEventListener('click', async e => {
    const b = e.target.closest('button[data-sub]'); if (!b) return;
    if (b.dataset.to === 'cancelled' && !confirm('Cancel this subscription? This cannot be undone.')) return;
    b.disabled = true;
    try { const { error } = await sb.from('subscriptions').update({ status: b.dataset.to }).eq('id', Number(b.dataset.sub)); if (error) throw error; toast('Subscription ' + b.dataset.to); await loadMine(); }
    catch (ex) { toast(ex.message); b.disabled = false; }
  });

  GD.ready.then(u => {
    if (!u) return;
    $('#sName').value = u.name || ''; $('#sPhone').value = u.phone || '';
    loadMine().catch(ex => { list.innerHTML = `<p class="form-err">${esc(ex.message)}</p>`; });
  });

  /* ---- submit ---- */
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const err = $('#formErr'); err.textContent = '';
    const name = $('#sName'), phone = $('#sPhone'), addr = $('#sAddress'), qty = $('#sQty'), start = dateIn;
    const q = Math.floor(Number(qty.value));
    const checks = [
      [sizes, chosen ? '' : 'Please choose a size.'],
      [qty, q >= 1 && q <= 20 ? '' : 'Choose 1 to 20.'],
      [start, start.value && start.value >= start.min && start.value <= start.max ? '' : 'Pick a date within the next 60 days.'],
      [name, name.value.trim().length >= 2 ? '' : 'Enter your name.'],
      [phone, PHONE_RE.test(phone.value.replace(/\s/g, '')) ? '' : 'Enter a valid 10-digit mobile number.'],
      [addr, addr.value.trim().length >= 10 ? '' : 'Enter your full delivery address.']
    ];
    let bad = null; checks.forEach(([el, m]) => { if (!setErr(el, m) && !bad) bad = el; });
    if (bad) { (bad.focus ? bad : $('.chip', sizes) || sel).focus(); return; }
    if (!GD.user) { location.href = 'login.html?next=subscribe.html'; return; }
    const btn = $('button[type=submit]', form); btn.disabled = true; btn.textContent = 'Starting…';
    try {
      const { error } = await sb.rpc('subscribe', { p_product_id: chosen.id, p_qty: q, p_frequency: $('input[name=freq]:checked').value, p_start: start.value,
        p_name: name.value.trim(), p_phone: phone.value.replace(/[\s-]/g, '').replace(/^\+91/, ''), p_address: addr.value.trim() });
      if (error) throw error;
      toast('Subscription started! 🎉'); addr.value = ''; await loadMine(); list.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (ex) { if (/log in/i.test(ex.message)) { location.href = 'login.html?next=subscribe.html'; return; } err.textContent = ex.message; }
    btn.disabled = false; btn.textContent = 'Start Subscription';
  });
})();
