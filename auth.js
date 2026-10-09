/* GAU DHARA – login.html, signup.html, contact.html, account.html
   Needs nav.js (provides window.GD with the API helper). */
(function () {
  'use strict';
  const $ = (s, p = document) => p.querySelector(s);
  const $$ = (s, p = document) => [...p.querySelectorAll(s)];

  /* ---- navbar burger (these pages don't load script.js) ---- */
  const burger = $('#burger'), menu = $('#menu');
  if (burger) burger.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    burger.setAttribute('aria-expanded', open); burger.textContent = open ? '✕' : '☰';
  });

  /* ---- toast ---- */
  let toastTimer;
  function toast(msg) {
    const t = $('#toast'); if (!t) return;
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
  }

  /* ---- field helpers ---- */
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const PHONE_RE = /^(\+91[\s-]?)?[6-9]\d{9}$/;
  function setErr(input, msg) {
    const field = input.closest('.field'), out = field && $('.err', field);
    if (field) field.classList.toggle('bad', !!msg);
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (out) out.textContent = msg || '';
    return !msg;
  }
  // run each check; returns true only if all pass (and focuses the first bad field)
  function validate(checks) {
    let firstBad = null;
    checks.forEach(([input, msg]) => { if (!setErr(input, msg) && !firstBad) firstBad = input; });
    if (firstBad) firstBad.focus();
    return !firstBad;
  }
  function busy(form, on, label) {
    const b = $('button[type="submit"]', form);
    if (on) { b.dataset.label = b.textContent; b.textContent = label; } else b.textContent = b.dataset.label || b.textContent;
    b.disabled = on;
  }
  $$('.pw-toggle').forEach(btn => btn.addEventListener('click', () => {
    const input = btn.previousElementSibling, show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    btn.textContent = show ? 'Hide' : 'Show';
    btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
  }));
  // clear an error as soon as the person starts fixing the field
  $$('.field input, .field textarea').forEach(i => i.addEventListener('input', () => setErr(i, '')));

  const params = new URLSearchParams(location.search);
  const next = GD.safeNext(params.get('next'), '');
  // keep the ?next= link when moving between login and signup
  if (next) {
    const a = $('#toSignup') || $('#toLogin');
    if (a) a.href += '?next=' + encodeURIComponent(next);
  }
  const goAfterAuth = user => { location.href = next || (user.role === 'admin' ? 'admin.html' : 'products.html'); };

  /* ================= LOGIN ================= */
  const loginForm = $('#loginForm');
  if (loginForm) {
    GD.ready.then(u => { if (u) goAfterAuth(u); });
    loginForm.addEventListener('submit', async e => {
      e.preventDefault();
      const email = $('#email'), pw = $('#password'), err = $('#formErr');
      err.textContent = '';
      if (!validate([
        [email, EMAIL_RE.test(email.value.trim()) ? '' : 'Enter a valid email address.'],
        [pw, pw.value ? '' : 'Enter your password.']
      ])) return;
      busy(loginForm, true, 'Logging in…');
      try {
        const { user } = await GD.api('/api/auth/login', { method: 'POST', body: { email: email.value, password: pw.value } });
        goAfterAuth(user);
      } catch (ex) { err.textContent = ex.message; busy(loginForm, false); }
    });
  }

  /* ================= SIGN UP ================= */
  const signupForm = $('#signupForm');
  if (signupForm) {
    GD.ready.then(u => { if (u) goAfterAuth(u); });
    signupForm.addEventListener('submit', async e => {
      e.preventDefault();
      const name = $('#name'), email = $('#email'), phone = $('#phone'), pw = $('#password'), cf = $('#confirm'), err = $('#formErr');
      err.textContent = '';
      const pwBad = pw.value.length < 8 || !/[A-Za-z]/.test(pw.value) || !/\d/.test(pw.value);
      if (!validate([
        [name, name.value.trim().length >= 2 ? '' : 'Enter your full name.'],
        [email, EMAIL_RE.test(email.value.trim()) ? '' : 'Enter a valid email address.'],
        [phone, !phone.value.trim() || PHONE_RE.test(phone.value.replace(/\s/g, '')) ? '' : 'Enter a valid 10-digit mobile number.'],
        [pw, pwBad ? 'Use at least 8 characters with a letter and a number.' : ''],
        [cf, cf.value === pw.value ? '' : 'Passwords do not match.']
      ])) return;
      busy(signupForm, true, 'Creating account…');
      try {
        const { user } = await GD.api('/api/auth/signup', { method: 'POST', body: { name: name.value, email: email.value, phone: phone.value, password: pw.value } });
        goAfterAuth(user);
      } catch (ex) { err.textContent = ex.message; busy(signupForm, false); }
    });
  }

  /* ================= CONTACT ================= */
  const contactForm = $('#contactForm');
  if (contactForm) {
    GD.ready.then(u => { if (u) { $('#name').value = u.name; $('#email').value = u.email; $('#phone').value = u.phone || ''; } });
    contactForm.addEventListener('submit', async e => {
      e.preventDefault();
      const name = $('#name'), email = $('#email'), phone = $('#phone'), msg = $('#message'), err = $('#formErr'), ok = $('#formOk');
      err.textContent = ''; ok.hidden = true;
      if (!validate([
        [name, name.value.trim().length >= 2 ? '' : 'Enter your name.'],
        [email, EMAIL_RE.test(email.value.trim()) ? '' : 'Enter a valid email address.'],
        [phone, !phone.value.trim() || PHONE_RE.test(phone.value.replace(/\s/g, '')) ? '' : 'Enter a valid 10-digit mobile number.'],
        [msg, msg.value.trim().length >= 10 ? '' : 'Please write at least 10 characters.']
      ])) return;
      busy(contactForm, true, 'Sending…');
      try {
        await GD.api('/api/contact', { method: 'POST', body: { name: name.value, email: email.value, phone: phone.value, subject: $('#subject').value, message: msg.value } });
        ok.hidden = false; msg.value = ''; ok.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      } catch (ex) { err.textContent = ex.message; }
      busy(contactForm, false);
    });
  }

  /* ================= MY ACCOUNT ================= */
  const list = $('#ordersList');
  if (list) {
    const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    GD.ready.then(async user => {
      if (!user) { location.href = 'login.html?next=account.html'; return; }
      $('#accName').textContent = 'Hi, ' + user.name + ' 👋';
      $('#accEmail').textContent = user.email;
      try {
        const { orders } = await GD.api('/api/orders/mine');
        list.innerHTML = orders.length ? orders.map(o => `
          <article class="order-card">
            <header><span>Order #${o.id}</span><span class="status ${esc(o.status.replace(/\s/g, ''))}">${esc(o.status)}</span></header>
            <small>${esc(o.created_at)} UTC • Total ₹${o.total}</small>
            <ul>${o.items.map(i => `<li>${esc(i.name)} (${esc(i.quantity)}) × ${i.qty}</li>`).join('')}</ul>
          </article>`).join('') : '<p class="sub2">You haven’t placed any orders yet.</p>';
      } catch (ex) { list.innerHTML = `<p class="form-err">${esc(ex.message)}</p>`; }
    });
  }
})();
