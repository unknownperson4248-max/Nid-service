(function () {
  'use strict';
  const app = document.getElementById('app');
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const ICONS = {
    telegram: '<path d="M22 3L2 10.5l6 2.2L18 6l-7.5 8.5.3 5 3-3.5 4.2 3z" fill="currentColor" stroke="none"/>',
    megaphone: '<path d="M3 11v2a1 1 0 0 0 1 1h2l4 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M14 7a5 5 0 0 1 0 10M16 4a9 9 0 0 1 0 16"/>',
    google: '<path fill="#4285F4" stroke="none" d="M21.6 12.23c0-.68-.06-1.33-.17-1.96H12v3.71h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.23c1.89-1.74 2.99-4.3 2.99-7.28z"/><path fill="#34A853" stroke="none" d="M12 22c2.7 0 4.96-.9 6.62-2.42l-3.23-2.51c-.9.6-2.04.96-3.39.96-2.6 0-4.8-1.76-5.59-4.12H3.07v2.59A10 10 0 0 0 12 22z"/><path fill="#FBBC05" stroke="none" d="M6.41 13.91a6 6 0 0 1 0-3.82V7.5H3.07a10 10 0 0 0 0 9z"/><path fill="#EA4335" stroke="none" d="M12 5.97c1.47 0 2.79.5 3.83 1.5l2.86-2.86A10 10 0 0 0 12 2a10 10 0 0 0-8.93 5.5l3.34 2.59C7.2 7.73 9.4 5.97 12 5.97z"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>', wallet: '<path d="M3 7h15a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 7l12-3v3"/><circle cx="16.5" cy="12.5" r="1.3" fill="currentColor" stroke="none"/>',
    bell: '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>', box: '<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', gift: '<rect x="3" y="8" width="18" height="4"/><path d="M5 12v9h14v-9"/><path d="M12 8v13"/><path d="M12 8S10 3 7.5 4.5 9 8 12 8zm0 0s2-5 4.5-3.5S15 8 12 8z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>', diamond: '<path d="M6 3h12l3 6-9 12L3 9z"/><path d="M3 9h18M9 3l-3 6 6 12M15 3l3 6-6 12"/>',
    crown: '<path d="M3 17h18M4 7l4 4 4-7 4 7 4-4-2 10H6z"/>', thumb: '<path d="M7 10v11H4V10zM7 10l4-7a2 2 0 0 1 2 3l-1 4h6a2 2 0 0 1 2 2l-1.5 7H7"/>',
    phone: '<path d="M5 4h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    right: '<path d="M9 6l6 6-6 6"/>', left: '<path d="M15 6l-6 6 6 6"/>', bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    server: '<rect x="3" y="4" width="18" height="7" rx="1.5"/><rect x="3" y="13" width="18" height="7" rx="1.5"/><circle cx="7" cy="7.5" r="1" fill="currentColor" stroke="none"/><circle cx="7" cy="16.5" r="1" fill="currentColor" stroke="none"/>',
    card: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>', check: '<path d="M20 6L9 17l-5-5"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    x: '<path d="M18 6L6 18M6 6l12 12"/>', logout: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M10 17l5-5-5-5M15 12H3"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>', info: '<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/>',
    alert: '<path d="M12 3l9 16H3z"/><path d="M12 9v4M12 17h.01"/>', whatsapp: '<path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3z"/><path d="M8.5 8.5c0 4 3 7 7 7 .6 0 1.2-.5 1.3-1.1.1-.4-.1-.6-.4-.8l-1.6-.8c-.2-.1-.5 0-.6.2l-.5.7c-1.1-.4-2-1.3-2.4-2.4l.7-.5c.2-.1.3-.4.2-.6l-.8-1.6c-.1-.3-.4-.5-.8-.4-.6.1-1.1.7-1.1 1.3z" fill="currentColor" stroke="none"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>', edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>', star: '<path d="M12 3l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 18l-5.9 3 1.2-6.5L2.5 9.9 9 9z"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    tag: '<path d="M3 11l8-8 10 10-8 8z"/><circle cx="8" cy="8" r="1.5" fill="currentColor" stroke="none"/>', eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/>', dollar: '<path d="M12 2v20M17 6a4 4 0 0 0-4-2H10a3 3 0 0 0 0 6h4a3 3 0 0 1 0 6h-3a4 4 0 0 1-4-2"/>',
  };
  const icon = (n, cls = 'ic') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;

  const T = {
    dashboard: { bn: 'ড্যাশবোর্ড', en: 'Dashboard' }, addMoney: { bn: 'অ্যাড মানি', en: 'Add Money' }, recharge: { bn: 'রিচার্জ', en: 'Recharge' },
    orders: { bn: 'অর্ডার', en: 'Orders' }, referrals: { bn: 'রেফারেল', en: 'Referrals' }, profile: { bn: 'প্রোফাইল', en: 'Profile' },
    transactions: { bn: 'লেনদেন', en: 'Transactions' }, allCats: { bn: 'সব', en: 'All' }, txnHistory: { bn: 'ট্রানজেকশন হিস্টোরি', en: 'Transaction history' }, rules: { bn: 'নিয়ম ও শর্তাবলী', en: 'Rules & Regulations' }, cancelOrder: { bn: 'অর্ডার বাতিল ও রিফান্ড', en: 'Cancel order & refund' },
    home: { bn: 'হোম', en: 'Home' }, services: { bn: 'সার্ভিস', en: 'Services' }, balance: { bn: 'ব্যালেন্স', en: 'Balance' },
    walletBalance: { bn: 'ওয়ালেট ব্যালেন্স', en: 'Wallet Balance' }, quickServices: { bn: 'জনপ্রিয় সার্ভিস', en: 'Popular Now' },
    priceList: { bn: 'মূল্য তালিকা', en: 'Price List' }, recentOrders: { bn: 'সাম্প্রতিক অর্ডার', en: 'Recent Orders' },
    noticeBoard: { bn: 'নোটিশ বোর্ড', en: 'Notice Board' }, allServices: { bn: 'সকল সার্ভিস', en: 'All Services' },
    orderHistory: { bn: 'অর্ডার হিস্টোরি', en: 'Order History' }, orderNow: { bn: 'অর্ডার করুন', en: 'Order Now' },
    total: { bn: 'মোট', en: 'Total' }, price: { bn: 'দাম', en: 'Price' }, from: { bn: 'শুরু', en: 'From' },
    login: { bn: 'লগইন', en: 'Login' }, register: { bn: 'রেজিস্টার', en: 'Register' }, logout: { bn: 'লগআউট', en: 'Logout' },
    name: { bn: 'নাম', en: 'Name' }, phone: { bn: 'মোবাইল নম্বর', en: 'Mobile number' }, password: { bn: 'পাসওয়ার্ড', en: 'Password' },
    email: { bn: 'ইমেইল', en: 'Email' }, phoneOpt: { bn: 'মোবাইল নম্বর (ঐচ্ছিক)', en: 'Mobile number (optional)' }, emailOrPhone: { bn: 'ইমেইল বা ফোন', en: 'Email or phone' }, orDiv: { bn: 'অথবা', en: 'or' }, gLogin: { bn: 'Google দিয়ে চালিয়ে যান', en: 'Continue with Google' },
    refOpt: { bn: 'রেফার কোড (ঐচ্ছিক)', en: 'Referral code (optional)' }, haveAcc: { bn: 'অ্যাকাউন্ট আছে?', en: 'Have an account?' },
    noAcc: { bn: 'অ্যাকাউন্ট নেই?', en: 'No account?' }, status: { bn: 'স্ট্যাটাস', en: 'Status' }, time: { bn: 'সময়', en: 'Time' },
    customer: { bn: 'কাস্টমার', en: 'Customer' }, pending: { bn: 'পেন্ডিং', en: 'Pending' }, done: { bn: 'সম্পন্ন', en: 'Done' },
    processing: { bn: 'প্রসেসিং', en: 'Processing' }, rejected: { bn: 'বাতিল', en: 'Rejected' }, approved: { bn: 'অনুমোদিত', en: 'Approved' },
    amount: { bn: 'এমাউন্ট', en: 'Amount' }, method: { bn: 'মাধ্যম', en: 'Method' }, senderNo: { bn: 'যে নম্বর থেকে পাঠিয়েছেন', en: 'Sender number' },
    trxid: { bn: 'ট্রানজেকশন আইডি (TrxID)', en: 'Transaction ID (TrxID)' }, submit: { bn: 'সাবমিট', en: 'Submit' },
    depositNote: { bn: 'নিচের নম্বরে Send Money করে ডিটেইলস দিন। এডমিন ভেরিফাই করে ব্যালেন্স যোগ করবে।', en: 'Send Money to the number below and submit the details. Admin will verify and add balance.' },
    yourRef: { bn: 'আপনার রেফার কোড', en: 'Your referral code' }, refBy: { bn: 'রেফার করে', en: 'Referred' }, earned: { bn: 'আয়', en: 'Earned' },
    refNote: { bn: 'বন্ধুকে কোড দিন। তার প্রথম ডিপোজিট অনুমোদন হলে আপনি বোনাস পাবেন।', en: 'Share your code. You earn a bonus when your friend\'s first deposit is approved.' },
    copy: { bn: 'কপি', en: 'Copy' }, copied: { bn: 'কপি হয়েছে', en: 'Copied' }, share: { bn: 'শেয়ার', en: 'Share' },
    changePass: { bn: 'পাসওয়ার্ড পরিবর্তন', en: 'Change password' }, save: { bn: 'সেভ', en: 'Save' }, newPass: { bn: 'নতুন পাসওয়ার্ড', en: 'New password' },
    noOrders: { bn: 'কোনো অর্ডার নেই', en: 'No orders yet' }, orderPlaced: { bn: 'অর্ডার সম্পন্ন হয়েছে', en: 'Order placed' },
    depositSent: { bn: 'ডিপোজিট রিকোয়েস্ট পাঠানো হয়েছে', en: 'Deposit request sent' }, lowBalance: { bn: 'ব্যালেন্স কম। অ্যাড মানি করুন।', en: 'Low balance. Add money first.' },
    orderId: { bn: 'অর্ডার আইডি', en: 'Order ID' }, support: { bn: 'সাপোর্ট', en: 'Support' }, needHelp: { bn: 'সাহায্য লাগবে?', en: 'Need help?' },
    viewAll: { bn: 'সব দেখুন', en: 'View all' }, min: { bn: 'সর্বনিম্ন', en: 'Min' }, service: { bn: 'সার্ভিস', en: 'Service' },
    welcome: { bn: 'স্বাগতম', en: 'Welcome' }, loginSub: { bn: 'লগইন করে সার্ভিস নিন', en: 'Log in to use the services' },
    wrong: { bn: 'ইমেইল/নম্বর বা পাসওয়ার্ড ভুল', en: 'Wrong email/number or password' }, exists: { bn: 'এই ইমেইলে অ্যাকাউন্ট আছে', en: 'This email already has an account' },
    fillAll: { bn: 'সব ঘর পূরণ করুন', en: 'Fill all fields' }, details: { bn: 'ডিটেইলস', en: 'Details' },
  };
  let S = { user: null, settings: null, services: [], cats: [], notices: [], live: [], lang: localStorage.getItem('lang') || 'bn', route: 'home', param: '', drawer: false, homeCat: '__all' };
  const t = (o) => (o == null ? '' : typeof o === 'string' ? o : o[S.lang] || o.bn || o.en || '');
  const u = (k) => { const o = S.settings && S.settings.texts && S.settings.texts[k]; if (o) return o; const e = T[k]; return e ? (S.lang === 'en' ? e.en : e.bn) : k; };
  const L = (g, k) => !(S.settings && S.settings.layout && S.settings.layout[g] && S.settings.layout[g][k] === false);
  const money = (n) => `${(S.settings && S.settings.currency) || '৳'}${Math.round(+n || 0).toLocaleString('en-US')}`;
  const initials = (n) => String(n || '?').trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const LEVELS = [
    { n: 'Starter', b: '🌱', min: 0, ring: 'linear-gradient(135deg,#9aa6b2,#636d78)' },
    { n: 'Bronze', b: '🥉', min: 1000, ring: 'linear-gradient(135deg,#eaa266,#b5692a)' },
    { n: 'Silver', b: '🥈', min: 5000, ring: 'linear-gradient(135deg,#eef0f3,#9aa1ab)' },
    { n: 'Gold', b: '🥇', min: 15000, ring: 'linear-gradient(135deg,#f7da85,#c99a3b)' },
    { n: 'Platinum', b: '💠', min: 40000, ring: 'linear-gradient(135deg,#8fe0fb,#2bb6ef)' },
    { n: 'Diamond', b: '💎', min: 100000, ring: 'linear-gradient(135deg,#c9b8ff,#8b5cf6)' },
    { n: 'Legend', b: '👑', min: 250000, ring: 'linear-gradient(135deg,#ffd27a,#ef4444)' },
  ];
  function levelOf(tp) { tp = Number(tp) || 0; let i = 0; for (let k = 0; k < LEVELS.length; k++) if (tp >= LEVELS[k].min) i = k; const cur = LEVELS[i]; const next = LEVELS[i + 1] || null; return { i, name: cur.n, badge: cur.b, ring: cur.ring, min: cur.min, next, pct: next ? Math.max(5, Math.min(100, Math.round((tp - cur.min) / (next.min - cur.min) * 100))) : 100, remain: next ? Math.max(0, next.min - tp) : 0 }; }
  function framedAvatar(name, tp, size) { const L = levelOf(tp); const s = size || 40; return `<span class="av-frame" style="background:${L.ring};width:${s + 6}px;height:${s + 6}px" title="${esc(L.name)}"><span class="avatar" style="width:${s}px;height:${s}px;font-size:${Math.round(s * 0.38)}px">${initials(name)}</span><span class="av-badge" style="font-size:${Math.round(s * 0.36)}px">${L.badge}</span></span>`; }
  const ago = (ts) => { const s = Math.floor((Date.now() - ts) / 1000); if (s < 60) return S.lang === 'en' ? 'just now' : 'এইমাত্র'; const m = Math.floor(s / 60); if (m < 60) return m + (S.lang === 'en' ? ' min ago' : ' মিনিট আগে'); const h = Math.floor(m / 60); if (h < 24) return h + (S.lang === 'en' ? ' hr ago' : ' ঘণ্টা আগে'); return Math.floor(h / 24) + (S.lang === 'en' ? ' d ago' : ' দিন আগে'); };

  async function api(path, body, method) {
    const opt = { method: method || (body ? 'POST' : 'GET'), headers: {} };
    if (body) { opt.headers['content-type'] = 'application/json'; opt.body = JSON.stringify(body); }
    try { const r = await fetch(path, opt); return await r.json(); } catch (e) { return { ok: false, error: 'net' }; }
  }
  let toastT;
  function toast(msg) { let el = $('#toast'); if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; document.body.appendChild(el); } el.textContent = msg; el.style.display = ''; clearTimeout(toastT); toastT = setTimeout(() => (el.style.display = 'none'), 2200); }
  const svcColor = (s) => s.color || '#0f766e';

  /* ---------- auth ---------- */
  let authMode = 'login';
  function renderAuth() {
    document.documentElement.className = S.lang === 'en' ? 'en' : '';
    app.setAttribute('aria-busy', 'false');
    const B = S.settings || { brandA: 'WizeFF', brandB: 'TopUp', tagline: { bn: 'দ্রুত • নিরাপদ • বিশ্বস্ত', en: 'Fast • Safe • Reliable' } };
    app.innerHTML = `<div class="auth"><div class="auth-card">
      <div class="auth-logo">${B.logo ? `<img class="auth-logo-img" src="${esc(B.logo)}" alt="">` : `<div class="logo-mark">${icon('bolt')}</div>`}
        <h1>${esc(B.brandA)} <em>${esc(B.brandB)}</em></h1><p>${esc(t(B.tagline))}</p></div>
      <div class="auth-tabs"><button data-am="login" class="${authMode === 'login' ? 'on' : ''}">${u('login')}</button><button data-am="register" class="${authMode === 'register' ? 'on' : ''}">${u('register')}</button></div>
      <div id="auth-err"></div>
      <form id="auth-form">
        ${authMode === 'register' ? `<div class="field"><label>${u('name')}</label><input name="name" autocomplete="name" maxlength="60" required></div>
        <div class="field"><label>${u('email')}</label><input name="email" type="email" autocomplete="email" inputmode="email" placeholder="you@gmail.com" maxlength="120" required></div>` : `<div class="field"><label>${u('emailOrPhone')}</label><input name="id" type="text" autocomplete="username" placeholder="you@gmail.com" maxlength="120" required></div>`}
        <div class="field"><label>${u('password')}</label><input name="password" type="password" autocomplete="${authMode === 'register' ? 'new-password' : 'current-password'}" minlength="6" maxlength="100" required></div>
        ${authMode === 'register' ? `<div class="field"><label>${u('phoneOpt')}</label><input name="phone" type="tel" inputmode="numeric" autocomplete="tel" placeholder="01XXXXXXXXX" maxlength="11"></div>
        <div class="field"><label>${u('refOpt')}</label><input name="ref" maxlength="10" placeholder="ABC123"></div>` : ''}
        <button class="btn" type="submit">${authMode === 'login' ? u('login') : u('register')}${icon('right')}</button>
      </form>
      ${B.googleOn ? `<div class="or-div"><span>${u('orDiv')}</span></div>
      <a class="g-btn" href="/auth/google/start">${icon('google')}<span>${u('gLogin')}</span></a>` : ''}
      <p style="text-align:center;margin-top:16px;color:var(--muted);font-size:13.5px">${authMode === 'login' ? u('noAcc') : u('haveAcc')}
        <a href="#" data-am="${authMode === 'login' ? 'register' : 'login'}" style="color:var(--brand);font-weight:700">${authMode === 'login' ? u('register') : u('login')}</a></p>
    </div></div>`;
  }
  const langSeg = () => `<span class="lang-seg"><button data-lang="bn" class="${S.lang === 'bn' ? 'on' : ''}">বাংলা</button><button data-lang="en" class="${S.lang === 'en' ? 'on' : ''}">EN</button></span>`;

  async function doAuth(form) {
    const d = Object.fromEntries(new FormData(form));
    const errEl = $('#auth-err');
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (authMode === 'register') {
      if (!(d.name || '').trim() || !emailRe.test(d.email || '')) { errEl.innerHTML = `<div class="err-msg">${S.lang === 'en' ? 'Enter your name and a valid email' : 'নাম ও সঠিক ইমেইল দিন'}</div>`; return; }
      if ((d.phone || '').trim() && !/^01\d{9}$/.test(d.phone.trim())) { errEl.innerHTML = `<div class="err-msg">${S.lang === 'en' ? 'Enter a valid 11-digit number' : 'সঠিক ১১ ডিজিটের নম্বর দিন'}</div>`; return; }
    } else if (!(d.id || '').trim()) { errEl.innerHTML = `<div class="err-msg">${u('fillAll')}</div>`; return; }
    if ((d.password || '').length < 6) { errEl.innerHTML = `<div class="err-msg">${S.lang === 'en' ? 'Password at least 6 characters' : 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষর'}</div>`; return; }
    const btn = $('#auth-form .btn'); btn.disabled = true;
    const r = await api('/api/auth/' + authMode, d);
    btn.disabled = false;
    if (r.ok) { S.user = r.user; await loadHome(); location.hash = '#home'; render(); }
    else { const msg = r.error === 'wrong' ? u('wrong') : r.error === 'exists' ? u('exists') : r.error === 'too_many' ? (S.lang === 'en' ? 'Too many tries, wait a bit' : 'অনেকবার চেষ্টা, একটু অপেক্ষা করুন') : u('fillAll'); errEl.innerHTML = `<div class="err-msg">${msg}</div>`; }
  }

  /* ---------- shell ---------- */
  function renderShell() {
    document.documentElement.className = S.lang === 'en' ? 'en' : '';
    const B = S.settings;
    app.setAttribute('aria-busy', 'false');
    app.innerHTML = `
      <header class="top"><div class="top-in">
        <button class="icon-btn" data-act="drawer" aria-label="menu">${icon('menu')}</button>
        <div class="logo">${B.logo ? `<img class="logo-img" src="${esc(B.logo)}" alt="">` : ''}<span class="logo-t">${esc(B.brandA)} <em>${esc(B.brandB)}</em></span></div>
        <div class="top-right">
          <div class="wallet" data-nav="deposit" title="${u('addMoney')}">${icon('wallet')}<span>${money(S.user.balance)}</span></div>
          ${S.user.role === 'admin' ? `<a class="icon-btn admin-ic" href="/admin" title="Admin panel" aria-label="Admin panel">${icon('shield')}</a>` : ''}
          ${(() => { const L = levelOf(S.user.topup); return `<button class="av-frame" data-nav="profile" style="background:${L.ring}" title="${esc(L.name)} • ${money(S.user.topup)}"><span class="avatar">${initials(S.user.name)}</span><span class="av-badge">${L.badge}</span></button>`; })()}
        </div>
      </div></header>
      <main class="wrap page" id="view"></main>
      ${tabbar()}
      ${B.whatsapp ? `<a class="wa-float" href="https://wa.me/${esc(B.whatsapp)}" target="_blank" rel="noopener" aria-label="${u('support')}">${icon('whatsapp')}</a>` : ''}
      ${drawer()}
      <div class="scrim ${S.drawer ? 'on' : ''}" data-act="drawer-close"></div>`;
    renderRoute();
  }
  function tabbar() {
    const defs = [
      ['home', 'home', u('home'), 'home'],
      ['orders', 'box', u('orders'), 'orders'],
      ['deposit', 'plus', u('addMoney'), 'addMoney'],
      ['transactions', 'wallet', u('transactions'), 'transactions'],
      ['profile', 'user', u('profile'), 'profile'],
    ].filter((x) => L('nav', x[3]));
    const tab = ([r, ic, lbl, key]) => `<button class="tab ${key === 'addMoney' ? 'tab-pls' : ''} ${S.route === r ? 'on' : ''}" data-nav="${r}">${key === 'addMoney' ? `<span class="pls">${icon(ic)}</span>` : icon(ic)}<span>${esc(lbl)}</span></button>`;
    return `<nav class="tabbar"><div class="tabbar-in">${defs.map(tab).join('')}</div></nav>`;
  }
  function drawer() {
    const drItem = (r, ic, lbl, on, color, img) => `<button class="dr-item ${on ? 'on' : ''}" data-nav="${r}"><span class="dr-ic ${img ? 'img' : ''}" ${!img && color ? `style="background:${color}!important"` : ''}>${img ? `<img src="${esc(img)}" alt="">` : icon(ic)}</span><span class="dr-l">${esc(lbl)}</span><span class="dr-ch">${icon('right')}</span></button>`;
    const nav = [['home', 'home', u('dashboard')]];
    // services grouped: category header -> its products
    const active = S.services.filter((s) => s.active);
    const cats = (S.cats || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
    let svcHtml = '';
    cats.forEach((c) => { const items = active.filter((s) => (s.cat || '') === c.id); if (items.length) svcHtml += `<div class="dr-sec">${esc(t(c.name))}</div>` + items.map((s) => drItem('service/' + s.id, s.icon || 'bolt', t(s.name), false, svcColor(s), s.image)).join(''); });
    const uncat = active.filter((s) => !cats.some((c) => c.id === (s.cat || '')));
    if (uncat.length) svcHtml += `<div class="dr-sec">${u('services')}</div>` + uncat.map((s) => drItem('service/' + s.id, s.icon || 'bolt', t(s.name), false, svcColor(s), s.image)).join('');
    return `<aside class="drawer ${S.drawer ? 'on' : ''}">
      <div class="dr-head"><div class="dr-top"><button class="dr-back" data-act="drawer-close" aria-label="back">${icon('left')}</button>
        <div class="logo">${S.settings.logo ? `<img class="logo-img" src="${esc(S.settings.logo)}" alt="">` : ''}<span class="logo-t">${esc(S.settings.brandA)} <em>${esc(S.settings.brandB)}</em></span></div></div></div>
      <div class="dr-body">
        <div class="dr-prof" data-nav="profile">
          <span class="dr-av">${initials(S.user.name)}</span>
          <div class="dr-prof-t"><b>${esc(S.user.name)}</b><small>${esc(S.user.phone || '')}</small></div>
          <span class="dr-ch">${icon('right')}</span>
        </div>
        <div class="dr-wallet">
          <div class="dr-wl"><span>${u('walletBalance')}</span><b>${money(S.user.balance)}</b></div>
          <button class="dr-wbtn" data-nav="deposit">${icon('plus')}<span>${u('addMoney')}</span></button>
        </div>
        ${nav.map(([r, ic, lbl]) => drItem(r, ic, lbl, S.route === r)).join('')}
        ${svcHtml}
        <button class="dr-item dr-logout" data-act="logout"><span class="dr-ic" style="background:#2a2f3a!important">${icon('logout')}</span><span class="dr-l">${u('logout')}</span></button>
      </div></aside>`;
  }

  /* ---------- routes ---------- */
  function renderRoute() {
    const v = $('#view'); if (!v) return;
    const [r, p] = (location.hash.replace(/^#/, '') || 'home').split('/');
    S.route = r; S.param = p || '';
    if (r === 'home') return viewHome(v);
    if (r === 'service') return viewService(v, p);
    if (r === 'orders') return viewOrders(v);
    if (r === 'deposit') return viewDeposit(v);
    if (r === 'transactions') return viewTransactions(v);
    if (r === 'profile') return viewProfile(v);
    viewHome(v);
  }

  function viewHome(v) {
    const active = S.services.filter((s) => s.active);
    // products filtered by a selectable category tab bar (categories shown side by side)
    const allCats = (S.cats || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
    const cats = allCats.filter((c) => active.some((s) => (s.cat || '') === c.id));
    const uncat = active.filter((s) => !allCats.some((c) => c.id === (s.cat || '')));
    const tabList = [{ id: '__all', name: { bn: u('allCats'), en: 'All' } }, ...cats];
    if (uncat.length) tabList.push({ id: '__other', name: { bn: u('services'), en: 'Other' } });
    if (!S.homeCat || !tabList.some((c) => c.id === S.homeCat)) S.homeCat = '__all';
    const sel = S.homeCat;
    const shown = sel === '__all' ? active : sel === '__other' ? uncat : active.filter((s) => (s.cat || '') === sel);
    const catTabs = tabList.length > 1 ? `<div class="cat-tabs">${tabList.map((c) => `<button class="cat-tab ${c.id === sel ? 'on' : ''}" data-cat="${esc(c.id)}">${esc(t(c.name))}</button>`).join('')}</div>` : '';
    // reference layout: featured -> "Popular Now", then one titled section per category
    const isEn = S.lang === 'en';
    const sections = [];
    const featured = active.filter((s) => s.featured);
    if (featured.length) sections.push({ name: isEn ? 'Popular Now' : 'জনপ্রিয়', items: featured });
    cats.forEach((c) => { const items = active.filter((s) => (s.cat || '') === c.id); if (items.length) sections.push({ name: t(c.name), items }); });
    if (uncat.length) sections.push({ name: isEn ? 'Other' : 'অন্যান্য', items: uncat });
    void catTabs; void shown;
    const catSections = sections.length
      ? sections.map((sec) => `<div class="cat-h"><span>${esc(sec.name)}</span></div><div class="qgrid">${sec.items.map(qsCard).join('')}</div>`).join('')
      : `<div class="cat-h"><span>${u('quickServices')}</span></div><div class="qgrid">${emptyBox(u('services'))}</div>`;
    const B = S.settings || {};
    const en = S.lang === 'en';
    const banners = (B.banners || []).filter((b) => b && b.img);
    // single notice, shown as a strip overlaid on the banner picture
    const n1 = (L('home', 'notices') && S.notices.length) ? S.notices[0] : null;
    const noticeBar = n1 ? `<div class="promo-notice ${n1.type === 'urgent' ? 'urgent' : ''}">${icon(n1.type === 'urgent' ? 'alert' : 'bell')}<div class="pn-marq"><span>${esc(t(n1.title))}${t(n1.body) ? ' — ' + esc(t(n1.body)) : ''}</span></div></div>` : '';
    const bannerHtml = L('home', 'hero') && banners.length
      ? `<div class="promo">
          <div class="promo-track">${banners.map((b) => `<div class="promo-slide"${b.link ? ` data-nav="${esc(b.link)}" role="button"` : ''}><img src="${esc(b.img)}" alt="" loading="eager"></div>`).join('')}</div>
          ${banners.length > 1 ? `<div class="promo-dots">${banners.map((_, i) => `<i${i === 0 ? ' class="on"' : ''}></i>`).join('')}</div>` : ''}
          ${noticeBar}
        </div>`
      : (n1 ? `<div class="promo promo-bar">${noticeBar}</div>` : '');
    const waN = (B.whatsapp || '').replace(/[^0-9]/g, '');
    const tgLink = (vv) => { vv = String(vv || '').trim(); if (!vv) return ''; return /^https?:\/\//i.test(vv) ? vv : 'https://t.me/' + vv.replace(/^@/, ''); };
    const tg = tgLink(B.telegram), tgc = tgLink(B.telegramCh);
    const chBtn = (cls, href, ic, label) => href ? `<a class="ch-btn ${cls}" href="${esc(href)}" target="_blank" rel="noopener">${icon(ic)}<span>${label}</span></a>` : '';
    const brand = `${esc(B.brandA || '')} ${esc(B.brandB || '')}`.trim();
    const foot = `<div class="home-foot">
      ${(waN || tg || tgc) ? `<div class="hf-contact">
        <h3>${en ? 'Contact & support' : 'যোগাযোগ ও সাপোর্ট'}</h3>
        <p>${en ? 'Choose a channel — we respond as soon as we can' : 'একটি চ্যানেল বেছে নিন — দ্রুত উত্তর দেওয়া হবে'}</p>
        ${chBtn('wa', waN ? 'https://wa.me/' + waN : '', 'whatsapp', 'WhatsApp')}
        ${chBtn('tg', tg, 'telegram', 'Telegram')}
        ${chBtn('tg', tgc, 'megaphone', en ? 'Telegram channel' : 'টেলিগ্রাম চ্যানেল')}
      </div>` : ''}
      <div class="hf-brandrow">${B.logo ? `<img class="hf-logo" src="${esc(B.logo)}" alt="">` : `<span class="logo-mark">${icon('bolt')}</span>`}
        <div class="hf-brand"><b>${brand}</b>${B.footerAbout ? `<p>${esc(B.footerAbout)}</p>` : `<small>${esc(t(B.tagline))}</small>`}${waN ? `<p class="hf-wa">WHATSAPP : ${esc(B.whatsapp)}</p>` : ''}</div></div>
      <div class="hf-bottom">
        <div class="hf-copy">© ${new Date().getFullYear()} ${brand}. ${en ? 'All rights reserved.' : 'সর্বস্বত্ব সংরক্ষিত।'}</div>
        ${(B.rules || B.privacy) ? `<div class="hf-links">${B.rules ? `<a data-doc="terms">${en ? 'Terms & Conditions' : 'শর্তাবলী'}</a>` : ''}${B.privacy ? `<a data-doc="privacy">${en ? 'Privacy Policy' : 'প্রাইভেসি পলিসি'}</a>` : ''}</div>` : ''}
        ${B.poweredBy ? `<div class="hf-power">Powered by <b>${esc(B.poweredBy)}</b></div>` : ''}
      </div></div>`;
    v.innerHTML = `
      ${bannerHtml}
      ${L('home', 'products') ? catSections : ''}

      ${L('home', 'recent') ? `<div class="sec-h">${icon('clock')}${u('recentOrders')}<span class="live-dot"><i></i>LIVE</span></div>
      <div class="card">${S.live.length ? S.live.map(liveRow).join('') : emptyBox(u('noOrders'))}</div>` : ''}

      ${foot}
      <div style="height:10px"></div>`;
    $$('.cat-tab').forEach((b) => b.addEventListener('click', () => { S.homeCat = b.dataset.cat; viewHome(v); }));
    if (banners.length > 1) initPromo(v);
  }

  let promoTimer = null;
  function initPromo(root) {
    const track = root.querySelector('.promo-track'); if (!track) return;
    const dots = [...root.querySelectorAll('.promo-dots i')];
    const n = track.children.length;
    const sync = () => { const i = Math.round(track.scrollLeft / track.clientWidth); dots.forEach((d, j) => d.classList.toggle('on', j === i)); };
    track.addEventListener('scroll', () => window.requestAnimationFrame(sync), { passive: true });
    dots.forEach((d, j) => d.addEventListener('click', () => track.scrollTo({ left: j * track.clientWidth, behavior: 'smooth' })));
    if (promoTimer) clearInterval(promoTimer);
    promoTimer = setInterval(() => {
      if (document.hidden || !document.body.contains(track)) { clearInterval(promoTimer); promoTimer = null; return; }
      const i = Math.round(track.scrollLeft / track.clientWidth);
      track.scrollTo({ left: ((i + 1) % n) * track.clientWidth, behavior: 'smooth' });
    }, 4500);
  }
  const svcIcon = (s, cls) => s.image ? `<span class="${cls} img"><img src="${esc(s.image)}" alt="" loading="lazy"></span>` : `<span class="${cls}" style="background:linear-gradient(135deg,${svcColor(s)},${svcColor(s)}cc)">${icon(s.icon || 'bolt')}</span>`;
  const qsCard = (s) => `<button class="qs" data-nav="service/${esc(s.id)}" style="--c:${svcColor(s)}">
    ${s.featured ? `<span class="qs-badge">HOT</span>` : ''}
    <span class="qs-art">${s.image ? `<img src="${esc(s.image)}" alt="" loading="lazy">` : `<span class="qs-ic">${icon(s.icon || 'bolt')}</span>`}</span>
    <span class="qs-lbl"><b>${esc(t(s.name))}</b></span></button>`;
  const svcHasVariable = (s) => (s.fields || []).some((f) => (f.type === 'select' && (f.options || []).some((o) => typeof o.price === 'number')) || (f.type === 'number' && f.priceFromValue));
  function svcMinPrice(s) {
    let base = +s.price || 0; const prices = [];
    (s.fields || []).forEach((f) => { if (f.type === 'select') (f.options || []).forEach((o) => { if (typeof o.price === 'number') prices.push(o.price); }); if (f.type === 'number' && f.priceFromValue && f.min) prices.push(f.min); });
    return prices.length ? base + Math.min(...prices) : base;
  }
  function priceList() {
    const rows = [];
    S.services.filter((s) => s.active).forEach((s) => {
      const opts = (s.fields || []).find((f) => f.type === 'select' && (f.options || []).some((o) => typeof o.price === 'number'));
      const pm = pricingOf(s);
      if (variantsOf(s).length) variantsOf(s).forEach((x) => { const xp = x.pricing || {}; rows.push([`${t(s.name)} — ${x.name}${xp.mode === 'qty' ? ' (' + (+xp.baseQty || 0).toLocaleString('en-US') + ')' : ''}`, xp.mode === 'qty' ? +xp.basePrice || 0 : +x.price || 0]); });
      else if (pm.mode === 'qty') rows.push([`${t(s.name)} — ${(+pm.P.baseQty || 0).toLocaleString('en-US')}`, +pm.P.basePrice || 0]);
      else if (opts) opts.options.filter((o) => typeof o.price === 'number').slice(0, 6).forEach((o) => rows.push([`${t(s.name)} — ${o.label}`, o.price]));
      else rows.push([t(s.name), svcMinPrice(s)]);
    });
    return `<div class="price-head"><span>${u('service')}</span><span>${u('price')}</span></div>` +
      rows.slice(0, 14).map(([n, p]) => `<div class="price-row"><b>${esc(n)}</b><span class="pr">${money(p)}</span></div>`).join('');
  }
  const liveRow = (m) => `<div class="ord-row"><span class="ord-av">${initials((m.un || '?').replace(/\*/g, ''))}</span>
    <span class="ord-main"><b>${esc(m.un || 'Customer')}</b><small>${esc(t(m.n))} • ${ago(m.ts)}</small></span>
    ${statusBadge(m.status)}</div>`;
  function statusBadge(st) {
    const map = { done: ['b-done', 'check', u('done')], pending: ['b-pending', 'clock', u('pending')], processing: ['b-processing', 'refresh', u('processing')], rejected: ['b-rejected', 'x', u('rejected')], approved: ['b-approved', 'check', u('approved')] };
    const [c, ic, lbl] = map[st] || map.pending;
    return `<span class="badge ${c}">${icon(ic)}${lbl}</span>`;
  }
  const emptyBox = (msg) => `<div class="empty">${icon('box')}<div>${esc(msg)}</div></div>`;

  /* ---------- service order ---------- */
  function viewService(v, id) {
    const s = S.services.find((x) => x.id === id && x.active);
    if (!s) { v.innerHTML = emptyBox(u('services')); return; }
    const en = S.lang === 'en';
    const eff0 = effOf(s, variantsOf(s).length ? variantsOf(s)[0].id : '');
    const methods = (S.settings.depositMethods || []).filter((m) => (m.numbers || []).some((n) => n.number));
    v.innerHTML = `
      <div class="ph"><button class="back" data-back>${icon('left')}</button><div><h2>${esc(t(s.name))}</h2><div class="sub">${esc(t(s.sub))}</div></div></div>
      ${t(s.note) ? `<div class="notice"><div class="notice-h">${icon('info')}<span>${u('details')}</span></div><div class="notice-b">${esc(t(s.note))}</div></div>` : ''}
      <div id="ord-err"></div>
      <form id="svc-form">
        <div class="card card-pad co-card">
          <div class="co-sec">${en ? 'Your details' : 'আপনার তথ্য'}</div>
          ${variantsOf(s).length ? `<div class="field"><label>${en ? 'Choose type' : 'ধরন বেছে নিন'} <span class="req">*</span></label>
            <input type="hidden" name="variant" value="${esc(variantsOf(s)[0].id)}">
            <div class="pk-grid vr-grid" data-pkg="variant">${variantsOf(s).map((x, i) => `<button type="button" class="pk ${i === 0 ? 'on' : ''}" data-pk="variant" data-v="${esc(x.id)}"><span class="pk-l">${esc(x.name)}</span><span class="pk-note">${esc(variantRate(x))}</span></button>`).join('')}</div></div>` : ''}
          ${(s.fields || []).filter((f) => !(pricingOf(eff0).needQty && f.key === pricingOf(eff0).qKey)).map(fieldHtml).join('')}
          <div id="qty-wrap">${qtyBoxHtml(eff0)}</div>
          ${(s.guideImg || s.guideNote) ? `<div class="guide-box"><div class="guide-h">${icon('info')}<span>${en ? 'How to order' : 'কিভাবে অর্ডার করবেন'}</span></div>${s.guideImg ? `<a href="${esc(s.guideImg)}" target="_blank" rel="noopener"><img class="guide-img" src="${esc(s.guideImg)}" alt=""></a>` : ''}${s.guideNote ? `<div class="guide-note">${esc(s.guideNote)}</div>` : ''}</div>` : ''}
        </div>
        <div class="card card-pad co-card">
          <div class="co-sec">${en ? 'Payment method' : 'পেমেন্ট মেথড'}</div>
          <div class="pay-opts">
            <button type="button" class="pay-opt" data-pay="wallet"><span class="pay-ic">${icon('wallet')}</span><b>${en ? 'Wallet' : 'ওয়ালেট'}</b><small class="pay-wbal"></small></button>
            <button type="button" class="pay-opt" data-pay="direct"><span class="pay-ic">${icon('card')}</span><b>${en ? 'Direct' : 'ডাইরেক্ট'}</b><small>bKash, Nagad…</small></button>
          </div>
          <div id="pay-direct" style="display:none">
            <div class="pay-note">${en ? 'Send' : 'নিচের নম্বরে'} <b class="pay-amt" id="pay-amt">${money(0)}</b> ${en ? 'to one of these numbers, then enter the TrxID. Admin verifies & delivers.' : 'সেন্ড মানি করে TrxID দিন। এডমিন ভেরিফাই করে ডেলিভার করবে।'}</div>
            <div class="pm-list" id="pm-list"></div>
            <div class="field"><label>TrxID <span class="req">*</span></label><input name="dtrxid" maxlength="40" placeholder="TrxID"></div>
          </div>
          <input type="hidden" name="payVia" value="wallet">
        </div>
        <div class="total-box"><span class="t">${u('total')}</span><span class="v" id="ord-total">${money(0)}</span></div>
        <button class="btn" type="submit">${icon('check')}${en ? 'Buy now' : 'অর্ডার করুন'}</button>
      </form>
      <div style="height:10px"></div>`;
    const form = $('#svc-form');
    const walletBal = S.user.balance || 0;
    let lastAmt = -1;
    // show only the payment numbers whose amount range fits the order total
    const renderPm = (amount) => {
      const host = $('#pm-list'); if (!host) return;
      const prev = (form.querySelector('[name=dmethod]:checked') || {}).value || '';
      const rows = [];
      methods.forEach((m) => (m.numbers || []).forEach((n) => {
        if (!n.number) return;
        const mn = +n.min || 0; const mx = (n.max == null || n.max === '') ? null : +n.max;
        if (amount > 0 && (amount < mn || (mx != null && amount > mx))) return; // out of this number's range
        const val = m.label + ' (' + n.number + ')';
        rows.push(`<label class="pm-opt"><input type="radio" name="dmethod" value="${esc(val)}" ${val === prev ? 'checked' : ''}><span class="pm-main"><b>${esc(m.label)}</b>${n.type ? `<em>${esc(n.type)}</em>` : ''}<code>${esc(n.number)}</code></span><span class="pm-copy" data-copy="${esc(n.number)}">${icon('copy')}</span></label>`);
      }));
      host.innerHTML = rows.length ? rows.join('')
        : `<div class="muted" style="font-size:12.5px;padding:4px 2px">${methods.length ? (en ? 'No payment number accepts this amount — try a different amount or ask support.' : 'এই অ্যামাউন্টের জন্য কোনো পেমেন্ট নম্বর নেই — অন্য অ্যামাউন্ট দিন বা সাপোর্টে বলুন।') : (en ? 'No payment numbers set yet.' : 'এখনো পেমেন্ট নম্বর সেট করা হয়নি।')}</div>`;
    };
    const recalc = () => {
      const pr = wzPrice(s, formVals(form)); const total = pr.ok ? pr.amount : 0;
      $('#ord-total').textContent = money(total);
      const pe = pricingOf(effOf(s, formVals(form).variant));
      const qe = $('#qty-err'); if (qe) { const touched = String(formVals(form)[pe.qKey] || '') !== ''; qe.textContent = (!pr.ok && touched && pr.err !== 'qty_required') ? qtyErrText(pr.err, pe.P) : ''; }
      const pa = $('#pay-amt'); if (pa) pa.textContent = money(total);
      const wb = $('.pay-wbal'); if (wb) wb.innerHTML = (total > 0 && walletBal < total) ? `<span class="pay-low">${en ? 'Low balance' : 'ব্যালেন্স কম'}</span>` : money(walletBal);
      if (total !== lastAmt) { lastAmt = total; renderPm(total); }
    };
    const selectPay = (mode) => { form.querySelector('[name=payVia]').value = mode; form.querySelectorAll('.pay-opt').forEach((b) => b.classList.toggle('on', b.dataset.pay === mode)); const pd = $('#pay-direct'); if (pd) pd.style.display = mode === 'direct' ? '' : 'none'; };
    form.querySelectorAll('.pay-opt').forEach((b) => b.addEventListener('click', () => selectPay(b.dataset.pay)));
    form.addEventListener('input', recalc); form.addEventListener('change', recalc); recalc();
    selectPay(walletBal <= 0 ? 'direct' : 'wallet');
    // package tiles: tap to select, fills the hidden input
    form.querySelectorAll('[data-pk]').forEach((btn) => btn.addEventListener('click', () => {
      const key = btn.dataset.pk;
      form.querySelectorAll(`[data-pk="${key}"]`).forEach((b) => b.classList.remove('on'));
      btn.classList.add('on');
      form.querySelector(`input[name="${key}"]`).value = btn.dataset.v;
      if (key === 'variant') { const qw = $('#qty-wrap'); if (qw) { const old = qw.querySelector('input'); const keep = old ? old.value : ''; qw.innerHTML = qtyBoxHtml(effOf(s, btn.dataset.v)); const ni = qw.querySelector('input'); if (ni && keep) ni.value = keep; } }
      recalc();
    }));
    // image upload fields: buyer attaches a picture
    form.querySelectorAll('[data-imgup]').forEach((box) => {
      const key = box.dataset.imgup, file = box.querySelector('input[type=file]'), prev = box.querySelector('.img-up-prev'), btn = box.querySelector('.img-up-btn');
      btn.addEventListener('click', () => file.click());
      file.addEventListener('change', async () => {
        const f = file.files[0]; if (!f) return;
        if (f.size > 3 * 1024 * 1024) { toast(S.lang === 'en' ? 'Max 3MB' : 'সর্বোচ্চ ৩MB'); return; }
        const dataUrl = await new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(f); });
        prev.innerHTML = '<div class="spin" style="width:20px;height:20px;margin:0"></div>'; btn.disabled = true;
        const up = await api('/api/upload', { dataUrl }); btn.disabled = false;
        if (up.ok) { form.querySelector(`input[name="${key}"]`).value = up.path; prev.innerHTML = `<img src="${esc(up.path)}" alt="">`; box.classList.add('has'); btn.innerHTML = `${icon('check')}${S.lang === 'en' ? 'Change' : 'বদলান'}`; }
        else { prev.innerHTML = icon('images'); toast(S.lang === 'en' ? 'Upload failed' : 'আপলোড ব্যর্থ'); }
      });
    });
    form.addEventListener('submit', async (e) => { e.preventDefault(); await placeOrder(s, form); });
  }
  function fieldHtml(f) {
    const lbl = `<label>${esc(t(f.label))} ${f.required ? '<span class="req">*</span>' : ''}</label>`;
    if (f.type === 'select') return `<div class="field">${lbl}
      <input type="hidden" name="${esc(f.key)}" value="">
      <div class="pk-grid" data-pkg="${esc(f.key)}">${(f.options || []).map((o) => `<button type="button" class="pk" data-pk="${esc(f.key)}" data-v="${esc(o.value || o.label)}"><span class="pk-l">${esc(o.label)}</span>${o.note ? `<span class="pk-note">${esc(o.note)}</span>` : ''}${typeof o.price === 'number' ? `<span class="pk-p">${money(o.price)}</span>` : ''}</button>`).join('')}</div></div>`;
    if (f.type === 'textarea') return `<div class="field">${lbl}<textarea name="${esc(f.key)}" ${f.required ? 'required' : ''} maxlength="500" placeholder="${esc(f.ph || '')}"></textarea></div>`;
    if (f.type === 'image') return `<div class="field">${lbl}
      <input type="hidden" name="${esc(f.key)}" value="">
      <div class="img-up" data-imgup="${esc(f.key)}"><div class="img-up-prev">${icon('images')}</div>
        <button type="button" class="img-up-btn">${icon('plus')}${S.lang === 'en' ? 'Upload image' : 'ছবি দিন'}</button>
        <input type="file" accept="image/*" hidden></div></div>`;
    const type = f.type === 'number' ? 'number' : f.type === 'phone' ? 'tel' : 'text';
    const extra = f.type === 'number' ? `inputmode="numeric" ${f.min != null ? `min="${f.min}"` : ''} ${f.max != null ? `max="${f.max}"` : ''}` : f.type === 'phone' ? 'inputmode="numeric" maxlength="11"' : 'maxlength="300"';
    const lim = f.type === 'number' && (f.min != null || f.max != null) ? `<div class="qty-hint">${[f.min != null ? `${S.lang === 'en' ? 'Minimum order' : 'সর্বনিম্ন অর্ডার'}: <b>${esc(f.min)}</b>` : '', f.max != null ? `${S.lang === 'en' ? 'Maximum order' : 'সর্বোচ্চ অর্ডার'}: <b>${esc(f.max)}</b>` : ''].filter(Boolean).join(' · ')}</div>` : '';
    return `<div class="field${lim ? ' qty-field' : ''}">${lbl}<input name="${esc(f.key)}" type="${type}" ${extra} ${f.required ? 'required' : ''} placeholder="${esc(f.ph || '')}">${lim}</div>`;
  }
  const formVals = (form) => Object.fromEntries(new FormData(form));
  // price preview uses the SAME engine as the server (wzPrice is injected before this script)
  function calcPrice(s, vals) { const r = wzPrice(s, vals); return r.ok ? r.amount : 0; }
  // sub-products (variants): each has its own price config; same pick rule as the engine
  const variantsOf = (s) => ((s && s.variants) || []).filter((x) => x && x.active !== false);
  const effOf = (s, vid) => { const x = variantsOf(s).find((y) => String(y.id) === String(vid == null ? '' : vid)); return x ? { ...s, price: x.price, pricing: x.pricing } : s; };
  const variantRate = (x) => { const P = x.pricing || {}; return P.mode === 'qty' ? `${money(+P.basePrice || 0)} / ${(+P.baseQty || 0).toLocaleString('en-US')}` : money(+x.price || 0); };
  const pricingOf = (s) => { const P = (s && s.pricing) || {}; const mode = (P.mode === 'qty' || P.mode === 'formula') ? P.mode : 'fixed'; return { P, mode, qKey: String(P.qtyKey || 'quantity'), needQty: mode === 'qty' || (mode === 'formula' && !!P.useQty) }; };
  function qtyErrText(code, P) {
    const en = S.lang === 'en'; const minQ = Math.max(1, Math.floor(+P.minQty || 0)), maxQ = Math.floor(+P.maxQty || 0), step = Math.max(1, Math.floor(+P.step || 1));
    const m = { qty_required: en ? 'Enter a quantity' : 'পরিমাণ লিখুন', qty_invalid: en ? 'Quantity must be a whole number' : 'পরিমাণ পূর্ণ সংখ্যা হতে হবে',
      qty_min: (en ? 'Minimum ' : 'সর্বনিম্ন ') + minQ, qty_max: (en ? 'Maximum ' : 'সর্বোচ্চ ') + maxQ,
      qty_step: (en ? 'Use steps of ' : 'ধাপ হতে হবে ') + step + (Math.floor(+P.minQty || 0) > 0 ? (en ? ' from ' : ', শুরু ') + Math.floor(+P.minQty || 0) : ''),
      amount_min: (en ? 'Minimum order ' : 'সর্বনিম্ন অর্ডার ') + money(+P.minAmount || 0), amount_max: (en ? 'Maximum order ' : 'সর্বোচ্চ অর্ডার ') + money(+P.maxAmount || 0),
      config: en ? 'Price not set for this product' : 'এই প্রোডাক্টের দাম সেট করা নেই',
      variant_required: en ? 'Choose a type first' : 'আগে ধরন বেছে নিন' };
    return m[code] || u('fillAll');
  }
  function qtyBoxHtml(s) {
    const { P, mode, qKey, needQty } = pricingOf(s); if (!needQty) return '';
    const en = S.lang === 'en'; const minQ = Math.max(1, Math.floor(+P.minQty || 0)), maxQ = Math.floor(+P.maxQty || 0), step = Math.max(1, Math.floor(+P.step || 1));
    const rate = mode === 'qty' ? `${money(+P.basePrice || 0)} / ${(+P.baseQty || 0).toLocaleString('en-US')}` : '';
    const lims = [`${en ? 'Minimum order' : 'সর্বনিম্ন অর্ডার'}: <b>${minQ.toLocaleString('en-US')}</b>`, maxQ > 0 ? `${en ? 'Maximum order' : 'সর্বোচ্চ অর্ডার'}: <b>${maxQ.toLocaleString('en-US')}</b>` : '', step > 1 ? `${en ? 'Step' : 'ধাপ'}: ${step.toLocaleString('en-US')}` : ''].filter(Boolean).join(' · ');
    return `<div class="field qty-field"><label>${esc(P.qtyLabel || (en ? 'Quantity' : 'পরিমাণ'))} <span class="req">*</span></label>
      <input name="${esc(qKey)}" type="number" inputmode="numeric" min="${minQ}" ${maxQ > 0 ? `max="${maxQ}"` : ''} step="${step}" placeholder="${minQ}" required>
      ${rate ? `<div class="qty-rate">${en ? 'Rate' : 'রেট'}: <b>${rate}</b></div>` : ''}
      <div class="qty-hint">${lims}</div><div class="qty-err" id="qty-err"></div></div>`;
  }
  async function placeOrder(s, form) {
    const en = S.lang === 'en';
    const vals = formVals(form); const errEl = $('#ord-err');
    for (const f of s.fields || []) if (f.required && !vals[f.key]) { errEl.innerHTML = `<div class="err-msg">${u('fillAll')}</div>`; return; }
    const pq = wzPrice(s, vals);
    if (!pq.ok) { errEl.innerHTML = `<div class="err-msg">${qtyErrText(pq.err, pricingOf(effOf(s, vals.variant)).P)}</div>`; return; }
    const amount = pq.amount;
    if (amount <= 0) { errEl.innerHTML = `<div class="err-msg">${u('fillAll')}</div>`; return; }
    const payVia = vals.payVia || 'wallet';
    const payload = { svcId: s.id, fields: vals, payVia };
    if (payVia === 'direct') {
      if (!vals.dmethod) { errEl.innerHTML = `<div class="err-msg">${en ? 'Choose a payment number above' : 'উপরে একটি পেমেন্ট নম্বর বাছুন'}</div>`; return; }
      if (!vals.dtrxid || vals.dtrxid.trim().length < 4) { errEl.innerHTML = `<div class="err-msg">${en ? 'Enter a valid TrxID' : 'সঠিক TrxID দিন'}</div>`; return; }
      payload.method = vals.dmethod; payload.trxid = vals.dtrxid.trim();
    } else if (S.user.balance < amount) {
      errEl.innerHTML = `<div class="err-msg">${u('lowBalance')} — ${en ? 'use Direct bKash/Nagad below' : 'নিচে ডাইরেক্ট bKash/Nagad দিন'}</div>`; return;
    }
    const btn = $('#svc-form .btn'); btn.disabled = true;
    const r = await api('/api/order', payload);
    btn.disabled = false;
    if (r.ok) {
      if (typeof r.balance === 'number') S.user.balance = r.balance;
      toast((payVia === 'direct' ? (en ? 'Order placed — payment will be verified' : 'অর্ডার হয়েছে — পেমেন্ট যাচাই হবে') : u('orderPlaced')) + ' • ' + r.order.id);
      location.hash = '#orders'; await loadHome(); render();
    }
    else if (r.error === 'balance') { errEl.innerHTML = `<div class="err-msg">${u('lowBalance')} — ${en ? 'use Direct bKash/Nagad' : 'ডাইরেক্ট bKash/Nagad দিন'}</div>`; }
    else if (r.error === 'field' && r.code) { errEl.innerHTML = `<div class="err-msg">${qtyErrText(r.code, pricingOf(effOf(s, vals.variant)).P)}</div>`; }
    else if (r.error === 'pay') { errEl.innerHTML = `<div class="err-msg">${en ? 'Enter a valid TrxID' : 'সঠিক TrxID দিন'}</div>`; }
    else { errEl.innerHTML = `<div class="err-msg">${u('fillAll')}</div>`; }
  }

  /* ---------- orders ---------- */
  async function viewOrders(v) {
    v.innerHTML = `<div class="ph"><button class="back" data-back>${icon('left')}</button><h2>${u('orderHistory')}</h2></div><div class="spin"></div>`;
    const r = await api('/api/orders');
    if (S.route !== 'orders') return;
    const items = (r.items || []);
    v.innerHTML = `<div class="ph"><button class="back" data-back>${icon('left')}</button><h2>${u('orderHistory')}</h2></div>
      ${items.length ? `<div class="ord-list">${items.map(orderRow).join('')}</div>` : emptyBox(u('noOrders'))}<div style="height:10px"></div>`;
  }
  const orderRow = (o) => { const data = esc(JSON.stringify({ id: o.id, svcId: o.svcId, svcName: o.svcName, fields: o.fields, amount: o.amount, status: o.status, ts: o.ts, note: o.note, respImg: o.respImg }));
    return `<div class="ord-card" data-order='${data}'>
      <div class="ord-top"><span class="ord-av">${icon('box')}</span><span class="ord-main"><b>${esc(t(o.svcName))}</b><small>${o.id} • ${ago(o.ts)}</small></span>${statusBadge(o.status)}</div>
      <div class="ord-foot"><span class="ord-amt">${money(o.amount)}</span><button class="ord-det" data-order='${data}'>${icon('eye')}${u('details')}${icon('right')}</button></div>
    </div>`; };

  /* ---------- deposit / add money ---------- */
  async function viewDeposit(v) {
    const methods = (S.settings.depositMethods || []).filter((m) => (m.numbers || []).some((n) => n.number));
    const min = S.settings.minDeposit || 20, max = 100000;
    const en = S.lang === 'en';
    let amount = null, activeTab = 0;
    const pickNumber = (m, amt) => { const nums = (m.numbers || []).filter((n) => n.number); if (amt == null) return nums[0] || null; return nums.find((n) => amt >= (n.min || 0) && (n.max == null || amt <= n.max)) || null; };

    async function loadHistory() {
      const dr = await api('/api/deposits'); const el = $('#dep-list'); if (!el) return;
      el.innerHTML = (dr.items && dr.items.length) ? dr.items.map((d) => `<div class="ord-row"><span class="ord-av">${icon('wallet')}</span><span class="ord-main"><b>${money(d.amount)} • ${esc(d.method)}</b><small>${d.id} • ${ago(d.ts)}</small></span>${statusBadge(d.status === 'pending' ? 'pending' : d.status === 'approved' ? 'approved' : 'rejected')}</div>`).join('') : emptyBox(u('noOrders'));
    }

    function renderPanel() {
      const panel = $('#pm-panel'), form = $('#dep-form'); if (!panel || !methods.length) return;
      const m = methods[activeTab]; if (!m) return;
      const num = pickNumber(m, amount);
      if (num) {
        form.hidden = false;
        form.querySelector('[name=method]').value = m.label; form.querySelector('[name=toNumber]').value = num.number;
        panel.innerHTML = `<div class="pay-detail" style="--c:${m.color || 'var(--brand)'}">
          <div class="pay-steps"><span>1 ${en ? 'Send Money' : 'টাকা পাঠান'}</span><span>2 ${en ? 'Copy TrxID' : 'TrxID কপি'}</span><span>3 ${en ? 'Submit' : 'সাবমিট'}</span></div>
          <div class="pay-num-lbl">${esc(m.label)}${num.label ? ' · ' + esc(num.label) : ''} (${esc(num.type || 'Personal')}) ${en ? 'number' : 'নম্বর'}</div>
          <div class="pay-num"><b>${esc(num.number)}</b><button type="button" class="pay-copy" data-copy="${esc(num.number)}">${icon('copy')}${u('copy')}</button></div>
          <p class="pay-hint">${u('depositNote')}</p></div>`;
      } else {
        form.hidden = true;
        panel.innerHTML = `<div class="notice urgent"><div class="notice-b">${en ? `${m.label} is not available for ${money(amount)}. Try a different amount or method.` : `${esc(m.label)} দিয়ে ${money(amount)} পাঠানো যাচ্ছে না। অন্য এমাউন্ট বা মাধ্যম ব্যবহার করুন।`}</div></div>`;
      }
    }

    function renderStep() {
      if (amount == null) {
        v.innerHTML = `<div class="ph"><button class="back" data-back>${icon('left')}</button><h2>${u('addMoney')}</h2></div>
          <div class="card card-pad dep-amt-card">
            <div class="dep-amt-icon">${icon('wallet')}</div>
            <h3>${en ? 'Add money to wallet' : 'ওয়ালেটে টাকা যোগ করুন'}</h3>
            <p class="muted">${en ? 'Send money to the number and enter the transaction ID' : 'নম্বরে টাকা পাঠিয়ে ট্রানজ্যাকশন আইডি দিন'}</p>
            <div class="dep-range">${en ? 'Min' : 'সর্বনিম্ন'} ${money(min)} — ${en ? 'Max' : 'সর্বোচ্চ'} ${money(max)}</div>
            <input id="dep-amt-input" type="number" inputmode="numeric" placeholder="${en ? 'Enter amount' : 'টাকার পরিমাণ লিখুন'}">
            <div id="dep-amt-err"></div>
            <button class="btn" id="dep-amt-next">${en ? 'Continue' : 'ঠিক আছে, এগিয়ে যান'}</button>
          </div>
          <div class="sec-h">${icon('clock')}${en ? 'Deposit history' : 'ডিপোজিট হিস্টোরি'}</div>
          <div class="card" id="dep-list"><div class="spin"></div></div><div style="height:10px"></div>`;
        $('#dep-amt-next').addEventListener('click', () => {
          const val = Math.round(Number($('#dep-amt-input').value));
          if (!Number.isFinite(val) || val < min || val > max) { $('#dep-amt-err').innerHTML = `<div class="err-msg">${en ? `Enter an amount between ${money(min)} and ${money(max)}` : `${money(min)} থেকে ${money(max)} এর মধ্যে এমাউন্ট লিখুন`}</div>`; return; }
          amount = val; activeTab = Math.max(0, methods.findIndex((m) => pickNumber(m, amount))); renderStep();
        });
        $('#dep-amt-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#dep-amt-next').click(); });
        loadHistory();
        return;
      }
      v.innerHTML = `<div class="ph"><button class="back" data-back>${icon('left')}</button><h2>${u('addMoney')}</h2></div>
        <div class="dep-sum"><span>${en ? 'Amount' : 'এমাউন্ট'}</span><b>${money(amount)}</b><button type="button" id="dep-change-amt">${en ? 'Change' : 'পরিবর্তন'}</button></div>
        ${methods.length ? `<div class="pay-lbl">${en ? 'Which method?' : 'কোন মাধ্যমে পাঠাবেন?'}</div>
        <div class="pm-tabs">${methods.map((m, i) => { const avail = !!pickNumber(m, amount); return `<button type="button" class="pm-tab ${i === activeTab ? 'on' : ''} ${avail ? '' : 'na'}" data-tab="${i}" style="--c:${m.color || 'var(--brand)'}"><span class="pm-tab-dot"></span>${esc(m.label)}${avail ? '' : `<small>${en ? 'unavailable' : 'অনুপলব্ধ'}</small>`}</button>`; }).join('')}</div>
        <div id="pm-panel"></div>` : `<div class="notice urgent"><div class="notice-b">${en ? 'Payment numbers not set yet. Contact support.' : 'পেমেন্ট নম্বর এখনো সেট করা হয়নি। সাপোর্টে যোগাযোগ করুন।'}</div></div>`}
        <div id="dep-err" style="margin-top:14px"></div>
        <form id="dep-form" class="card card-pad" ${methods.length ? '' : 'hidden'}>
          <input type="hidden" name="method" value=""><input type="hidden" name="toNumber" value=""><input type="hidden" name="amount" value="${amount}">
          <div class="field"><label>${u('trxid')} <span class="req">*</span></label><input name="trxid" maxlength="40" placeholder="TrxID" required></div>
          <button class="btn" type="submit">${icon('check')}${u('submit')}</button>
        </form>
        <div class="sec-h">${icon('clock')}${en ? 'Deposit history' : 'ডিপোজিট হিস্টোরি'}</div>
        <div class="card" id="dep-list"><div class="spin"></div></div><div style="height:10px"></div>`;
      renderPanel();
      $$('.pm-tab').forEach((b) => b.addEventListener('click', () => { activeTab = +b.dataset.tab; $$('.pm-tab').forEach((x) => x.classList.remove('on')); b.classList.add('on'); renderPanel(); }));
      const back = $('#dep-change-amt'); if (back) back.addEventListener('click', () => { amount = null; renderStep(); });
      $('#dep-form').addEventListener('submit', async (e) => { e.preventDefault(); await submitDeposit(e.target); });
      loadHistory();
    }
    renderStep();
  }
  async function submitDeposit(form) {
    const d = Object.fromEntries(new FormData(form)); const errEl = $('#dep-err');
    if (!d.method || (d.trxid || '').length < 4 || +d.amount < (S.settings.minDeposit || 20)) { errEl.innerHTML = `<div class="err-msg">${u('fillAll')}</div>`; return; }
    const btn = form.querySelector('.btn'); btn.disabled = true;
    const r = await api('/api/deposit', d); btn.disabled = false;
    if (r.ok) { toast(u('depositSent')); location.hash = '#home'; renderRoute(); }
    else errEl.innerHTML = `<div class="err-msg">${u('fillAll')}</div>`;
  }

  /* ---------- referrals ---------- */
  async function viewTransactions(v) {
    const en = S.lang === 'en';
    v.innerHTML = `<div class="ph"><button class="back" data-back>${icon('left')}</button><h2>${u('transactions')}</h2></div>
      <div id="rank-wrap"></div>
      <div class="txn-bal"><div class="txn-bal-t"><span>${u('walletBalance')}</span><b>${money(S.user.balance)}</b></div>
        <button class="txn-add" data-nav="deposit">${icon('plus')}<span>${u('addMoney')}</span></button></div>
      <div id="lb-wrap"></div>
      <div id="ref-wrap"></div>
      <div class="sec-h">${icon('clock')}${u('txnHistory')}</div>
      <div class="card" id="txn-list"><div class="spin"></div></div><div style="height:10px"></div>`;
    const [rf, dr, lb] = await Promise.all([api('/api/referrals'), api('/api/deposits'), api('/api/leaderboard')]);
    if (S.route !== 'transactions') return;
    const rkw = $('#rank-wrap');
    if (rkw) {
      const L = levelOf(S.user.topup); const myRank = (lb && lb.me && lb.me.rank) || 0;
      rkw.innerHTML = `<div class="rank-card">
        <div class="rank-top">${framedAvatar(S.user.name, S.user.topup, 56)}
          <div class="rank-meta"><div class="rank-name">${L.badge} ${L.name}${myRank ? `<span class="rank-no">#${myRank}</span>` : ''}</div>
            <div class="rank-sub">${en ? 'Total top-up' : 'মোট টপ-আপ'}: <b>${money(S.user.topup)}</b></div></div></div>
        ${L.next
          ? `<div class="rank-bar"><i style="width:${L.pct}%"></i></div><div class="rank-next">${money(L.remain)} ${en ? 'more to' : 'আরও দিলে'} ${L.next.b} ${L.next.n}</div>`
          : `<div class="rank-next">${en ? 'Max level reached' : 'সর্বোচ্চ লেভেল'} 🎉</div>`}</div>`;
    }
    const lw = $('#lb-wrap');
    if (lw && lb && lb.items && lb.items.length) {
      lw.innerHTML = `<div class="sec-h">${icon('bolt')}${en ? 'Top rankings' : 'টপ র‍্যাংকিং'}</div>
        <div class="card lb-card">${lb.items.map((x, idx) => { const L = levelOf(x.topup); return `<div class="lb-row"><span class="lb-rank r${idx + 1}">${idx + 1}</span><span class="ord-main"><b>${esc(x.name)}</b><small>${L.badge} ${L.name}</small></span><b class="lb-amt">${money(x.topup)}</b></div>`; }).join('')}</div>`;
    }
    const rw = $('#ref-wrap');
    if (rw && rf && rf.ok) {
      const link = location.origin + '/?ref=' + (rf.ref || '');
      rw.innerHTML = `<div class="sec-h">${icon('gift')}${en ? 'Refer & earn' : 'রেফার করে আয়'}</div>
        <div class="ref-card">
          <div class="ref-lbl">${u('yourRef')}</div><div class="ref-code">${esc(rf.ref || '')}</div>
          <div class="ref-row"><button class="ref-btn solid" data-copy="${esc(link)}">${icon('copy')}${u('copy')}</button><button class="ref-btn" data-share="${esc(link)}">${icon('gift')}${u('share')}</button></div>
        </div>
        <div class="ref-stats"><div class="ref-stat"><span>${u('refBy')}</span><b>${rf.count || 0}</b></div><div class="ref-stat"><span>${u('earned')}</span><b>${money(rf.earned || 0)}</b></div></div>
        <div class="notice"><div class="notice-b">${u('refNote')} ${en ? 'Bonus' : 'বোনাস'}: ${money(rf.bonus || 0)}</div></div>`;
    }
    const el = $('#txn-list'); if (!el) return;
    el.innerHTML = (dr && dr.items && dr.items.length)
      ? dr.items.map((d) => `<div class="ord-row"><span class="ord-av txn-in">${icon('wallet')}</span><span class="ord-main"><b>+ ${money(d.amount)} • ${esc(d.method)}</b><small>${esc(d.id)} • ${ago(d.ts)}</small></span>${statusBadge(d.status === 'pending' ? 'pending' : d.status === 'approved' ? 'approved' : 'rejected')}</div>`).join('')
      : emptyBox(en ? 'No transactions yet' : 'এখনো কোনো লেনদেন নেই');
  }

  /* ---------- profile ---------- */
  function viewProfile(v) {
    v.innerHTML = `<div class="ph"><button class="back" data-back>${icon('left')}</button><h2>${u('profile')}</h2></div>
      <div class="card card-pad" style="text-align:center;margin-bottom:14px">${framedAvatar(S.user.name, S.user.topup, 72)}
        <h2 style="font-size:20px;margin-top:10px">${esc(S.user.name)}</h2><div class="muted">${esc(S.user.phone)}</div>
        ${(() => { const L = levelOf(S.user.topup); return `<div class="lvl-chip">${L.badge} ${L.name}</div>`; })()}
</div>
      <div class="card"><div class="kv" style="padding:14px 16px"><span class="k">${u('balance')}</span><span class="v">${money(S.user.balance)}</span></div></div>
      <div id="pf-msg"></div>
      <form id="pf-form" class="card card-pad" style="margin-top:14px">
        <div class="field"><label>${u('name')}</label><input name="name" value="${esc(S.user.name)}" maxlength="60"></div>
        <div class="field"><label>${u('email')}</label><input name="email" type="email" value="${esc(S.user.email || '')}" maxlength="120" placeholder="you@gmail.com"></div>
        <div class="field"><label>${u('newPass')} <span class="hint">(${S.lang === 'en' ? 'leave blank to keep' : 'না বদলালে খালি রাখুন'})</span></label><input name="password" type="password" minlength="6" maxlength="100" autocomplete="new-password"></div>
        <button class="btn" type="submit">${icon('check')}${u('save')}</button>
      </form>
      ${S.settings.whatsapp ? `<a class="btn btn-ghost" href="https://wa.me/${esc(S.settings.whatsapp)}" target="_blank" rel="noopener">${icon('whatsapp')}${u('support')}</a>` : ''}
      <button class="btn btn-ghost" data-act="logout" style="color:var(--bad);margin-top:12px">${icon('logout')}${u('logout')}</button><div style="height:10px"></div>`;
    $('#pf-form').addEventListener('submit', async (e) => {
      e.preventDefault(); const d = Object.fromEntries(new FormData(e.target));
      if (!d.password) delete d.password;
      const r = await api('/api/profile', d);
      if (r.ok) { S.user = { ...S.user, ...r.user }; $('#pf-msg').innerHTML = `<div class="ok-msg">${u('save')} ✓</div>`; render(); } });
  }

  /* ---------- order detail sheet ---------- */
  function orderSheet(o) {
    const svc = S.services.find((x) => x.id === o.svcId);
    const rows = Object.entries(o.fields || {}).map(([k, val]) => { const f = svc && (svc.fields || []).find((x) => x.key === k); const isImg = /^\/img\/[a-z0-9]{10,24}$/.test(String(val)); return `<div class="kv"><span class="k">${esc(f ? t(f.label) : (k === 'variant' ? (S.lang === 'en' ? 'Type' : 'ধরন') : k === 'quantity' ? (S.lang === 'en' ? 'Quantity' : 'পরিমাণ') : k))}</span>${isImg ? `<a class="v" href="${esc(val)}" target="_blank" rel="noopener"><img src="${esc(val)}" alt="" style="max-width:120px;max-height:120px;border-radius:10px;border:1px solid var(--line)"></a>` : `<span class="v">${esc(val)}</span>`}</div>`; }).join('');
    openSheet(`<div class="sheet-h"><h3>${esc(t(o.svcName))}</h3><button class="x" data-sheet-close>${icon('x')}</button></div>
      <div style="margin-bottom:12px">${statusBadge(o.status)}</div>
      <div class="kv"><span class="k">${u('orderId')}</span><span class="v">${esc(o.id)}</span></div>
      ${rows}
      <div class="kv"><span class="k">${u('amount')}</span><span class="v">${money(o.amount)}</span></div>
      <div class="kv"><span class="k">${u('time')}</span><span class="v">${new Date(o.ts).toLocaleString('en-GB')}</span></div>
      ${(o.note || o.respImg) ? `<div class="resp"><div class="resp-h">${icon('check')}${S.lang === 'en' ? 'Admin response' : 'অ্যাডমিন রেসপন্স'}</div>
        ${o.note ? `<div class="resp-b" id="resp-txt">${esc(o.note)}</div><button class="btn btn-ghost btn-sm" data-copy="${esc(o.note)}" style="margin-top:8px">${icon('copy')}${u('copy')}</button>` : ''}
        ${o.respImg ? `<a class="resp-img" href="${esc(o.respImg)}" target="_blank" rel="noopener"><img src="${esc(o.respImg)}" alt="" loading="lazy"><span class="resp-dl">${icon('eye')}${S.lang === 'en' ? 'View / download' : 'দেখুন / ডাউনলোড'}</span></a>` : ''}
      </div>` : ''}
      ${o.status === 'pending' && o.key ? `<button class="btn btn-ghost" data-cancel-order="${esc(o.key)}" style="color:var(--bad);margin-top:14px;width:100%">${icon('x')}${u('cancelOrder')}</button>` : ''}`);
  }
  function openSheet(html) { const s = document.createElement('div'); s.className = 'modal-scrim'; s.dataset.sheet = '1'; s.innerHTML = `<div class="sheet">${html}</div>`; document.body.appendChild(s); }
  function docSheet(kind) { const en = S.lang === 'en'; const title = kind === 'privacy' ? (en ? 'Privacy Policy' : 'প্রাইভেসি পলিসি') : (en ? 'Terms & Conditions' : 'শর্তাবলী'); const body = kind === 'privacy' ? (S.settings.privacy || '') : (S.settings.rules || ''); openSheet(`<div class="sheet-h"><h3>${esc(title)}</h3><button class="x" data-sheet-close>${icon('x')}</button></div><div class="doc-body">${esc(body)}</div>`); }

  /* ---------- events ---------- */
  document.addEventListener('click', async (e) => {
    const lang = e.target.closest('[data-lang]'); if (lang) { S.lang = lang.dataset.lang; localStorage.setItem('lang', S.lang); render(); return; }
    const am = e.target.closest('[data-am]'); if (am) { e.preventDefault(); authMode = am.dataset.am; renderAuth(); return; }
    const nav = e.target.closest('[data-nav]'); if (nav) { if (S.drawer) closeDrawer(); location.hash = '#' + nav.dataset.nav; return; }
    const back = e.target.closest('[data-back]'); if (back) { history.length > 1 ? history.back() : (location.hash = '#home'); return; }
    if (e.target.closest('[data-act="drawer"]')) { S.drawer = true; render(); return; }
    if (e.target.closest('[data-act="drawer-close"]')) { closeDrawer(); return; }
    if (e.target.closest('[data-act="logout"]')) { await api('/api/auth/logout', {}); S.user = null; location.hash = '#home'; render(); return; }
    const cp = e.target.closest('[data-copy]'); if (cp) { navigator.clipboard && navigator.clipboard.writeText(cp.dataset.copy); toast(u('copied')); return; }
    const sh = e.target.closest('[data-share]'); if (sh) { if (navigator.share) navigator.share({ url: sh.dataset.share, title: S.settings.brandA + ' ' + S.settings.brandB }); else { navigator.clipboard && navigator.clipboard.writeText(sh.dataset.share); toast(u('copied')); } return; }
    const ord = e.target.closest('[data-order]'); if (ord) { try { orderSheet(JSON.parse(ord.dataset.order)); } catch (x) {} return; }
    const co = e.target.closest('[data-cancel-order]'); if (co) { const en = S.lang === 'en'; if (!confirm(en ? 'Cancel this order and get a full refund?' : 'অর্ডার বাতিল করে পুরো টাকা ফেরত নিবেন?')) return; const r = await api('/api/order-cancel', { key: co.dataset.cancelOrder }); if (r.ok) { if (typeof r.balance === 'number') S.user.balance = r.balance; const m = document.querySelector('[data-sheet]'); if (m) m.remove(); toast(en ? 'Cancelled & refunded ✓' : 'বাতিল ও রিফান্ড হয়েছে ✓'); render(); } else toast(r.error === 'not_pending' ? (en ? 'Only pending orders can be cancelled' : 'শুধু পেন্ডিং অর্ডার বাতিল করা যায়') : 'Error'); return; }
    const doc = e.target.closest('[data-doc]'); if (doc) { e.preventDefault(); docSheet(doc.dataset.doc); return; }
    if (e.target.closest('[data-sheet-close]') || (e.target.classList && e.target.classList.contains('modal-scrim'))) { const m = document.querySelector('[data-sheet]'); if (m) m.remove(); return; }
  });
  document.addEventListener('submit', (e) => { if (e.target.id === 'auth-form') { e.preventDefault(); doAuth(e.target); } });
  window.addEventListener('hashchange', () => { if (!S.user) return; if (S.drawer) S.drawer = false; const m = document.querySelector('[data-sheet]'); if (m) m.remove(); renderRoute(); updateTabs(); window.scrollTo(0, 0); });
  function updateTabs() { document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('on', b.dataset.nav === S.route)); document.querySelectorAll('.dr-item').forEach((b) => b.classList.toggle('on', b.dataset.nav === S.route)); }

  function closeDrawer() { S.drawer = false; const d = $('.drawer'), sc = document.querySelector('.scrim'); if (d) d.classList.remove('on'); if (sc) sc.classList.remove('on'); }
  function render() { if (!S.user) renderAuth(); else renderShell(); }

  /* ---------- boot ---------- */
  async function loadHome() { const r = await api('/api/home'); if (r.ok) { S.settings = r.settings; S.services = r.services || []; S.cats = r.cats || []; S.notices = r.notices || []; S.live = r.live || []; if (r.user) S.user = r.user; } }
  async function boot() {
    const qs = new URLSearchParams(location.search);
    const qref = qs.get('ref'); if (qref) sessionStorage.setItem('ref', qref);
    const ge = qs.get('e');
    if (ge) { const en = S.lang === 'en'; const m = ge === 'google_off' ? (en ? 'Google login is not set up' : 'Google লগইন সেট করা নেই') : ge === 'blocked' ? (en ? 'Account blocked' : 'অ্যাকাউন্ট ব্লকড') : (en ? 'Google sign-in failed, try again' : 'Google লগইন ব্যর্থ, আবার চেষ্টা করুন'); setTimeout(() => toast(m), 400); history.replaceState(null, '', location.pathname + location.hash); }
    const me = await api('/api/me'); S.settings = me.settings;
    if (me.user) { S.user = me.user; await loadHome(); }
    if (!location.hash) location.hash = '#home';
    render();
    // light live refresh of recent orders every 25s on home
    setInterval(async () => { if (S.user && S.route === 'home' && !S.drawer && !document.hidden) { const r = await api('/api/home'); if (r.ok) { S.live = r.live || []; if (r.user) S.user = r.user; const v = $('#view'); if (v && S.route === 'home') viewHome(v); const w = $('.wallet span'); } } }, 45000);
  }
  boot();
})();
