(function () {
  'use strict';
  const root = document.getElementById('admin');
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n) => '৳' + Math.round(+n || 0).toLocaleString('en-US');
  const ICONS = {
    dash: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
    box: '<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/>', wallet: '<path d="M3 7h15a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 7l12-3v3"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M3 21a6 6 0 0 1 12 0"/><path d="M16 5.5a3.5 3.5 0 0 1 0 6.5M16 21a6 6 0 0 0-2-4.5"/>',
    bell: '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>', cog: '<circle cx="12" cy="12" r="3.2"/><path d="M19 12a7 7 0 0 0-.1-1.3l2-1.5-2-3.4-2.4 1a7 7 0 0 0-2.2-1.3L14 2h-4l-.3 2.2a7 7 0 0 0-2.2 1.3l-2.4-1-2 3.4 2 1.5A7 7 0 0 0 5 12a7 7 0 0 0 .1 1.3l-2 1.5 2 3.4 2.4-1a7 7 0 0 0 2.2 1.3L10 22h4l.3-2.2a7 7 0 0 0 2.2-1.3l2.4 1 2-3.4-2-1.5A7 7 0 0 0 19 12z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', x: '<path d="M18 6L6 18M6 6l12 12"/>', check: '<path d="M20 6L9 17l-5-5"/>', edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    trash: '<path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13h10l1-13"/>', logout: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M10 17l5-5-5-5M15 12H3"/>',
    refresh: '<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>', money: '<path d="M12 2v20M17 6a4 4 0 0 0-4-2H10a3 3 0 0 0 0 6h4a3 3 0 0 1 0 6h-3a4 4 0 0 1-4-2"/>',
    menu: '<path d="M3 6h18M3 12h18M3 18h18"/>', back: '<path d="M15 6l-6 6 6 6"/>', eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>', lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>', bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  };
  const icon = (n, cls = 'ic') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;
  let toastT; function toast(m) { let e = $('#toast'); if (!e) { e = document.createElement('div'); e.id = 'toast'; e.className = 'toast'; document.body.appendChild(e); } e.textContent = m; e.style.display = ''; clearTimeout(toastT); toastT = setTimeout(() => e.style.display = 'none', 2000); }
  async function api(path, body, method) { const o = { method: method || (body ? 'POST' : 'GET'), headers: {} }; if (body) { o.headers['content-type'] = 'application/json'; o.body = JSON.stringify(body); } try { const r = await fetch(path, o); return await r.json(); } catch (e) { return { ok: false, error: 'net' }; } }

  let S = { me: null, tab: 'dash', stats: {}, services: [], cats: [], menuOpen: false };

  /* ---------- boot ---------- */
  async function boot() { const me = await api('/api/me'); S.me = me.user; root.setAttribute('aria-busy', 'false'); if (!S.me) return renderLogin(); if (S.me.role !== 'admin') return renderNoAdmin(); renderShell(); go('dash'); }
  function renderLogin(err) {
    root.innerHTML = `<div class="login"><form class="login-card" id="lf"><div class="mark">${icon('lock')}</div><h2>Admin Login</h2><p>WizeFF TopUp</p>
      ${err ? `<div class="err">${esc(err)}</div>` : ''}
      <div class="field"><label>Mobile number</label><input name="phone" type="tel" inputmode="numeric" maxlength="11" placeholder="01XXXXXXXXX" required></div>
      <div class="field"><label>Password</label><input name="password" type="password" required></div>
      <button class="btn" style="width:100%">${icon('lock')}Login</button></form></div>`;
    $('#lf').addEventListener('submit', async (e) => { e.preventDefault(); const d = Object.fromEntries(new FormData(e.target)); const r = await api('/api/auth/login', d); if (r.ok && r.user.role === 'admin') { S.me = r.user; renderShell(); go('dash'); } else if (r.ok) renderNoAdmin(); else renderLogin('Wrong number or password'); });
  }
  function renderNoAdmin() { root.innerHTML = `<div class="login"><div class="login-card" style="text-align:center"><div class="mark">${icon('lock')}</div><h2>Not an admin</h2><p>This account has no admin access.</p><a class="btn" href="/">Go to app</a></div></div>`; }

  const NAV = [['dash', 'dash', 'Dashboard'], ['orders', 'box', 'Orders'], ['deposits', 'wallet', 'Deposits'], ['services', 'grid', 'Services'], ['users', 'users', 'Users'], ['notices', 'bell', 'Notices'], ['texts', 'edit', 'Texts'], ['layout', 'grid', 'Layout'], ['settings', 'cog', 'Settings']];
  function renderShell() {
    root.innerHTML = `<div class="wrap">
      <aside class="side ${S.menuOpen ? 'on' : ''}"><div class="brand"><span class="mark">${icon('bolt')}</span><b>WizeFF Admin</b></div>
        <nav>${NAV.map(([k, ic, l]) => `<button data-tab="${k}" class="${S.tab === k ? 'on' : ''}">${icon(ic)}<span>${l}</span><span class="count ${k}-count" style="display:none"></span></button>`).join('')}</nav>
        <div class="foot"><a href="/">${icon('eye')}View site</a><button data-act="logout">${icon('logout')}Logout</button></div></aside>
      <div class="side-scrim ${S.menuOpen ? 'on' : ''}" data-act="menu-close"></div>
      <main class="main"><div class="topbar"><button class="menu-btn" data-act="menu">${icon('menu')}</button><h1 id="title">Dashboard</h1><button class="btn btn-ghost btn-sm refresh" data-act="refresh">${icon('refresh')}Refresh</button></div>
        <div id="content"><div class="spin"></div></div></main></div>`;
    loadCounts();
  }
  async function loadCounts() { const r = await api('/api/admin/overview'); if (r.ok) { S.stats = r.stats; const po = $('.orders-count'), pd = $('.deposits-count'); if (po && r.stats.pendingOrders) { po.textContent = r.stats.pendingOrders; po.style.display = ''; } if (pd && r.stats.pendingDeposits) { pd.textContent = r.stats.pendingDeposits; pd.style.display = ''; } } }

  function go(tab) { S.tab = tab; document.querySelectorAll('.side nav button').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab)); const titles = { dash: 'Dashboard', orders: 'Orders', deposits: 'Deposits', services: 'Services & Forms', users: 'Users', notices: 'Notices', texts: 'Website texts', layout: 'Layout (show / hide)', settings: 'Settings' }; $('#title').textContent = titles[tab]; S.menuOpen = false; syncMenu(); const views = { dash: vDash, orders: vOrders, deposits: vDeposits, services: vServices, users: vUsers, notices: vNotices, texts: vTexts, layout: vLayout, settings: vSettings }; (views[tab] || vDash)(); }
  function syncMenu() { const s = $('.side'), sc = $('.side-scrim'); if (s) s.classList.toggle('on', S.menuOpen); if (sc) sc.classList.toggle('on', S.menuOpen); }

  /* ---------- dashboard ---------- */
  async function vDash() {
    const c = $('#content'); c.innerHTML = '<div class="spin"></div>';
    const r = await api('/api/admin/overview'); const s = r.stats || {};
    c.innerHTML = `<div class="stats">
      ${stat('box', s.orders || 0, 'Total orders')}
      ${stat('box', s.pendingOrders || 0, 'Pending orders', s.pendingOrders > 0)}
      ${stat('wallet', s.pendingDeposits || 0, 'Pending deposits', s.pendingDeposits > 0)}
      ${stat('users', s.users || 0, 'Users')}
      ${stat('money', money(s.revenue || 0), 'Revenue (done)')}
    </div>
    <div class="card"><div class="card-h">${icon('box')}Recent orders<button class="btn btn-sm" data-tab="orders" style="margin-left:auto">All</button></div><div id="dash-orders"><div class="spin"></div></div></div>`;
    const o = await api('/api/admin/orders'); const items = (o.items || []).slice(0, 8);
    $('#dash-orders').innerHTML = items.length ? ordersTable(items) : '<div class="empty">No orders</div>';
  }
  const stat = (ic, n, l, warn) => `<div class="stat ${warn ? 'warn' : ''}">${icon(ic)}<div class="n">${n}</div><div class="l">${l}</div></div>`;

  /* ---------- orders ---------- */
  let orderFilter = '';
  async function vOrders() {
    const c = $('#content');
    c.innerHTML = `<div class="tabs">${['', 'pending', 'processing', 'done', 'rejected'].map((s) => `<button data-of="${s}" class="${orderFilter === s ? 'on' : ''}">${s || 'All'}</button>`).join('')}</div><div id="olist"><div class="spin"></div></div>`;
    const r = await api('/api/admin/orders' + (orderFilter ? '?status=' + orderFilter : ''));
    $('#olist').innerHTML = (r.items && r.items.length) ? `<div class="card">${ordersTable(r.items)}</div>` : '<div class="empty">No orders</div>';
  }
  function ordersTable(items) {
    return `<table class="tbl"><thead><tr><th>Order</th><th>Customer</th><th>Service</th><th>Amount</th><th>Status</th><th></th></tr></thead><tbody>
      ${items.map((o) => `<tr><td class="mono">${esc(o.id)}<div class="muted">${new Date(o.ts).toLocaleString('en-GB')}</div></td>
        <td>${esc(o.uname || '')}</td><td>${esc(tl(o.svcName))}</td><td><b>${money(o.amount)}</b></td>
        <td>${badge(o.status)}</td><td><button class="btn btn-ghost btn-sm" data-oview='${esc(JSON.stringify(o))}'>${icon('eye')}View</button></td></tr>`).join('')}
    </tbody></table>`;
  }
  function orderModal(o) {
    const svc = S.services.find((x) => x.id === o.svcId);
    const rows = Object.entries(o.fields || {}).map(([k, v]) => { const f = svc && (svc.fields || []).find((x) => x.key === k); const isImg = /^\/img\/[a-z0-9]{10,24}$/.test(String(v)); return `<div><span class="k">${esc(f ? tl(f.label) : k)}:</span> ${isImg ? `<a href="${esc(v)}" target="_blank" rel="noopener"><img src="${esc(v)}" alt="" style="max-width:140px;max-height:140px;border-radius:8px;border:1px solid var(--line);vertical-align:middle"></a>` : `<b>${esc(v)}</b>`}</div>`; }).join('');
    modal(`Order ${esc(o.id)}`, `
      <div class="flex" style="margin-bottom:10px">${badge(o.status)}<span class="pill">${new Date(o.ts).toLocaleString('en-GB')}</span></div>
      <div class="kvs"><div><span class="k">Customer:</span> <b>${esc(o.uname)}</b></div><div><span class="k">Service:</span> <b>${esc(tl(o.svcName))}</b></div><div><span class="k">Amount:</span> <b>${money(o.amount)}</b></div>${rows}</div>
      <div class="field"><label>Status (set manually)</label><select id="o-status">${['pending', 'processing', 'done', 'rejected'].map((s) => `<option value="${s}" ${o.status === s ? 'selected' : ''}>${s === 'done' ? 'done (complete)' : s === 'rejected' ? 'rejected / cancel (refunds balance)' : s}</option>`).join('')}</select></div>
      <div class="field"><label>Response message to customer</label><textarea id="o-note" maxlength="1000" placeholder="e.g. Delivered. Thanks!">${esc(o.note || '')}</textarea></div>
      <div class="field"><label>Response image (optional)</label><div class="flex"><div id="o-imgprev" class="iconbox" style="width:54px;height:54px;background:#eef2f5;overflow:hidden">${o.respImg ? `<img src="${esc(o.respImg)}" style="width:100%;height:100%;object-fit:cover">` : icon('eye')}</div>
        <button type="button" class="btn btn-ghost btn-sm" id="o-imgbtn">${icon('plus')}Upload image</button><button type="button" class="btn btn-bad btn-sm" id="o-imgdel" ${o.respImg ? '' : 'style="display:none"'}>Remove</button></div>
        <input type="file" id="o-imgfile" accept="image/*" style="display:none"><div class="muted" style="font-size:11px;margin-top:4px">The customer sees this image in their order. Max 2MB.</div></div>`,
      `<button class="btn btn-ghost" data-close>Close</button><button class="btn btn-ok" id="o-save">${icon('check')}Save</button>`);
    let respImg = o.respImg || '';
    $('#o-imgbtn').addEventListener('click', () => $('#o-imgfile').click());
    $('#o-imgdel').addEventListener('click', () => { respImg = ''; $('#o-imgprev').innerHTML = icon('eye'); $('#o-imgdel').style.display = 'none'; });
    $('#o-imgfile').addEventListener('change', async (e) => { const f = e.target.files[0]; if (!f) return; if (f.size > 2 * 1024 * 1024) { toast('Max 2MB'); return; } const dataUrl = await new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(f); }); toast('Uploading...'); const up = await api('/api/admin/upload', { dataUrl }); if (up.ok) { respImg = up.path; $('#o-imgprev').innerHTML = `<img src="${esc(up.path)}" style="width:100%;height:100%;object-fit:cover">`; $('#o-imgdel').style.display = ''; } else toast('Upload failed'); });
    $('#o-save').addEventListener('click', async () => { const r = await api('/api/admin/order', { key: o.key, status: $('#o-status').value, note: $('#o-note').value, respImg }); if (r.ok) { toast('Updated'); closeModal(); vOrders(); loadCounts(); } else toast('Error'); });
  }

  /* ---------- deposits ---------- */
  let depFilter = 'pending';
  async function vDeposits() {
    const c = $('#content');
    c.innerHTML = `<div class="tabs">${['pending', 'approved', 'rejected', ''].map((s) => `<button data-df="${s}" class="${depFilter === s ? 'on' : ''}">${s || 'All'}</button>`).join('')}</div><div id="dlist"><div class="spin"></div></div>`;
    const r = await api('/api/admin/deposits' + (depFilter ? '?status=' + depFilter : ''));
    const items = r.items || [];
    $('#dlist').innerHTML = items.length ? `<div class="card"><table class="tbl"><thead><tr><th>ID</th><th>Customer</th><th>Method</th><th>Sender</th><th>TrxID</th><th>Amount</th><th>Status</th><th></th></tr></thead><tbody>
      ${items.map((d) => `<tr><td class="mono">${esc(d.id)}<div class="muted">${new Date(d.ts).toLocaleString('en-GB')}</div></td><td>${esc(d.uname)}</td><td>${esc(d.method)}</td><td class="mono">${esc(d.sender)}</td><td class="mono">${esc(d.trxid)}</td><td><b>${money(d.amount)}</b></td><td>${badge(d.status === 'approved' ? 'approved' : d.status === 'rejected' ? 'rejected' : 'pending')}</td>
        <td>${d.status === 'pending' ? `<div class="flex"><button class="btn btn-ok btn-sm" data-dep-ok="${esc(d.key)}">${icon('check')}Approve</button><button class="btn btn-bad btn-sm" data-dep-no="${esc(d.key)}">Reject</button></div>` : ''}</td></tr>`).join('')}
    </tbody></table></div>` : '<div class="empty">No deposits</div>';
  }

  /* ---------- services (form builder) ---------- */
  async function vServices() {
    const c = $('#content');
    const r = await api('/api/admin/services'); S.services = r.services || []; S.cats = r.cats || [];
    c.innerHTML = `<div class="flex" style="margin-bottom:14px"><button class="btn" data-act="new-svc">${icon('plus')}New service</button><button class="btn btn-ghost" data-act="edit-cats">Categories</button><span class="muted">${S.services.length} services</span></div>
      <div class="row-wrap" id="svc-list">${S.services.map(svcItem).join('') || '<div class="empty">No services</div>'}</div>`;
  }
  function svcItem(s, i) {
    return `<div class="item"><div class="flex" style="justify-content:space-between">
      <div class="flex"><span class="iconbox" style="background:${s.color || '#0f766e'}">${icon(iconName(s.icon))}</span>
        <div><b>${esc(tl(s.name))}</b> ${s.active ? '' : '<span class="pill">off</span>'} ${s.featured ? '<span class="pill">★ featured</span>' : ''}<div class="muted" style="font-size:12.5px">${esc(tl(s.sub))} • ${(s.fields || []).length} fields • ${catName(s.cat)}</div></div></div>
      <div class="flex"><button class="btn btn-ghost btn-sm" data-edit-svc="${s.id}">${icon('edit')}Edit</button><button class="btn btn-bad btn-sm" data-del-svc="${s.id}">${icon('trash')}</button></div></div></div>`;
  }
  const iconName = (n) => (ICONS[n] ? n : 'bolt');
  const catName = (id) => { const c = S.cats.find((x) => x.id === id); return c ? tl(c.name) : id || '-'; };

  let editing = null; // service being edited (deep copy)
  function newService() { editing = { id: 'svc' + Date.now().toString(36), cat: (S.cats[0] || {}).id || 'topup', icon: 'bolt', color: '#0f766e', active: true, featured: false, price: 0, name: '', sub: '', note: '', fields: [] }; svcModal(); }
  function editService(id) { const s = S.services.find((x) => x.id === id); editing = JSON.parse(JSON.stringify(s)); if (!editing.fields) editing.fields = []; svcModal(); }
  function svcModal() {
    const s = editing;
    modal(tl(s.name) ? 'Edit product' : 'New product', `
      <div class="field"><label>Product name <span class="req">*</span></label><input id="f-name" value="${esc(tl(s.name))}" placeholder="e.g. Free Fire Diamond"></div>
      <div class="field"><label>Short line</label><input id="f-sub" value="${esc(tl(s.sub))}" placeholder="e.g. Player ID diye top-up"></div>
      <div class="field"><label>Note / instruction</label><textarea id="f-note">${esc(tl(s.note))}</textarea></div>
      <div class="field"><label>Product image (optional)</label>
        <div class="flex"><div id="f-imgprev" class="iconbox" style="width:54px;height:54px;background:#eef2f5;overflow:hidden">${s.image ? `<img src="${esc(s.image)}" style="width:100%;height:100%;object-fit:cover">` : icon('eye')}</div>
          <button type="button" class="btn btn-ghost btn-sm" id="f-imgbtn">${icon('plus')}Upload image</button>
          ${s.image ? `<button type="button" class="btn btn-bad btn-sm" id="f-imgdel">Remove</button>` : ''}</div>
        <input type="file" id="f-imgfile" accept="image/*" style="display:none"><div class="muted" style="font-size:11px;margin-top:4px">Shows on the product box and page. Max 2MB.</div></div>
      <div class="grid2">
        <div class="field"><label>Category</label><select id="f-cat">${S.cats.map((c) => `<option value="${esc(c.id)}" ${s.cat === c.id ? 'selected' : ''}>${esc(tl(c.name))}</option>`).join('')}</select></div>
        <div class="field"><label>Icon (if no image)</label><select id="f-icon">${['bolt', 'diamond', 'crown', 'thumb', 'phone', 'wallet', 'box', 'grid', 'money', 'eye'].map((n) => `<option value="${n}" ${s.icon === n ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
        <div class="field"><label>Color</label><input id="f-color" type="color" value="${esc(s.color || '#0f766e')}" style="height:42px;padding:3px"></div>
        <div class="field"><label>Base price (৳)</label><input id="f-price" type="number" value="${s.price || 0}"><div class="muted" style="font-size:11px">0 = price from options below</div></div>
      </div>
      <div class="flex" style="margin:4px 0 14px">
        <label class="flex" style="gap:6px"><input type="checkbox" id="f-active" ${s.active ? 'checked' : ''} style="width:auto"> Active</label>
        <label class="flex" style="gap:6px"><input type="checkbox" id="f-featured" ${s.featured ? 'checked' : ''} style="width:auto"> Featured</label>
      </div>
      <div style="margin-bottom:8px"><b style="font-family:var(--disp)">Order boxes (fields)</b><div class="muted" style="font-size:12px">Quick add a ready box, then edit it. Each box can be required or optional.</div></div>
      <div class="qa-row">${[['player', 'FF Player ID', 'bolt'], ['dropdown', 'Dropdown / package', 'grid'], ['image', 'Image upload', 'eye'], ['number', 'Number', 'money'], ['note', 'Note', 'edit'], ['blank', 'Blank box', 'plus']].map(([k, lbl, ic]) => `<button type="button" class="qa" data-qa="${k}">${icon(ic)}${lbl}</button>`).join('')}</div>
      <div id="fields-wrap">${s.fields.map(fieldEditor).join('')}</div>`,
      `<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-ok" id="svc-save">${icon('check')}Save product</button>`);
    $('#svc-save').addEventListener('click', saveService);
    $('#f-imgbtn').addEventListener('click', () => $('#f-imgfile').click());
    $('#f-imgfile').addEventListener('change', uploadImage);
    const del = $('#f-imgdel'); if (del) del.addEventListener('click', () => { readFieldsFromDom(); syncSvcText(); editing.image = ''; svcModal(); });
  }
  function syncSvcText() { const g = (id) => { const el = $(id); return el ? el.value : undefined; }; const n = g('#f-name'); if (n !== undefined) editing.name = n.trim(); const sb = g('#f-sub'); if (sb !== undefined) editing.sub = sb.trim(); const no = g('#f-note'); if (no !== undefined) editing.note = no.trim(); const cat = g('#f-cat'); if (cat !== undefined) editing.cat = cat; const ic = g('#f-icon'); if (ic !== undefined) editing.icon = ic; const col = g('#f-color'); if (col !== undefined) editing.color = col; const pr = g('#f-price'); if (pr !== undefined) editing.price = Number(pr) || 0; const ac = $('#f-active'); if (ac) editing.active = ac.checked; const fe = $('#f-featured'); if (fe) editing.featured = fe.checked; }
  async function uploadImage(e) {
    const file = e.target.files[0]; if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast('Image too big (max 2MB)'); return; }
    readFieldsFromDom(); syncSvcText();
    const dataUrl = await new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(file); });
    toast('Uploading...');
    const r = await api('/api/admin/upload', { dataUrl });
    if (r.ok) { editing.image = r.path; svcModal(); } else toast('Upload failed');
  }
  function fieldEditor(f, i) {
    return `<div class="fieldrow" data-fi="${i}">
      <div class="flex"><span class="pill">#${i + 1}</span><b style="flex:1">${esc(tl(f.label)) || '(field)'}</b><button class="btn btn-bad btn-sm" data-del-field="${i}">${icon('trash')}</button></div>
      <div class="grid2" style="margin-top:8px">
        <div class="field"><label>Box label</label><input data-ff="${i}:label" value="${esc(tl(f.label))}" placeholder="e.g. Player ID"></div>
        <div class="field"><label>Key (english, no space)</label><input data-ff="${i}:key" value="${esc(f.key || '')}" placeholder="auto"></div>
        <div class="field"><label>Type</label><select data-ff="${i}:type">${[['text', 'Single line text'], ['number', 'Number'], ['phone', 'Phone number'], ['select', 'Dropdown / package (choose one)'], ['textarea', 'Multi-line note'], ['date', 'Date'], ['image', 'Image upload (buyer attaches a picture)']].map(([tp, lbl]) => `<option value="${tp}" ${f.type === tp ? 'selected' : ''}>${lbl}</option>`).join('')}</select></div>
        <div class="field"><label>Placeholder</label><input data-ff="${i}:ph" value="${esc(f.ph || '')}"></div>
        <div class="field"><label class="flex" style="gap:6px;margin-top:24px"><input type="checkbox" data-ff="${i}:required" ${f.required ? 'checked' : ''} style="width:auto"> Required</label></div>
      </div>
      ${f.type === 'number' ? `<div class="grid2"><div class="field"><label>Min</label><input type="number" data-ff="${i}:min" value="${f.min != null ? f.min : ''}"></div><div class="field"><label>Max</label><input type="number" data-ff="${i}:max" value="${f.max != null ? f.max : ''}"></div><div class="field"><label class="flex" style="gap:6px"><input type="checkbox" data-ff="${i}:priceFromValue" ${f.priceFromValue ? 'checked' : ''} style="width:auto"> Value = price</label></div></div>` : ''}
      ${f.type === 'select' ? `<div><div class="muted" style="font-size:12px;margin:4px 0">Options (label + price; empty price = no charge)</div><div data-opts="${i}">${(f.options || []).map((o, oi) => optRow(i, oi, o)).join('')}</div><button class="btn btn-ghost btn-sm" data-add-opt="${i}">${icon('plus')}Add option</button></div>` : ''}
    </div>`;
  }
  const optRow = (fi, oi, o) => `<div class="opt-row" data-opt="${fi}:${oi}"><input data-fo="${fi}:${oi}:label" placeholder="label e.g. 100 💎" value="${esc(o.label || '')}"><input data-fo="${fi}:${oi}:price" type="number" placeholder="price" value="${o.price != null ? o.price : ''}" style="max-width:110px"><button class="btn btn-bad btn-sm" data-del-opt="${fi}:${oi}">${icon('x')}</button></div>`;

  function readFieldsFromDom() {
    // sync editing.fields from inputs
    document.querySelectorAll('[data-ff]').forEach((el) => {
      const [i, pathRaw] = el.dataset.ff.split(':'); const path = pathRaw; const f = editing.fields[+i]; if (!f) return;
      let val = el.type === 'checkbox' ? el.checked : el.value;
      if (path === 'min' || path === 'max') val = el.value === '' ? null : Number(el.value);
      f[path] = val;
    });
    document.querySelectorAll('[data-fo]').forEach((el) => {
      const [fi, oi, key] = el.dataset.fo.split(':'); const f = editing.fields[+fi]; if (!f || !f.options || !f.options[+oi]) return;
      if (key === 'price') f.options[+oi].price = el.value === '' ? undefined : Number(el.value); else f.options[+oi].label = el.value;
    });
  }
  async function saveService() {
    readFieldsFromDom(); syncSvcText();
    const s = editing;
    if (!tl(s.name)) { toast('Name required'); return; }
    s.fields = (s.fields || []).map((f) => { const lbl = tl(f.label); if (!f.key) f.key = (lbl || 'f').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'f' + Math.random().toString(36).slice(2, 5); if (f.type === 'select') f.options = (f.options || []).filter((o) => o.label); return f; });
    const list = S.services.slice(); const idx = list.findIndex((x) => x.id === s.id);
    if (idx >= 0) list[idx] = s; else list.push(s);
    const r = await api('/api/admin/services', { services: list });
    if (r.ok) { S.services = list; toast('Saved'); closeModal(); vServices(); } else toast('Error');
  }

  /* ---------- categories ---------- */
  function editCats() {
    modal('Categories', `<div id="cats-wrap">${S.cats.map(catRow).join('')}</div><button class="btn btn-ghost btn-sm" data-act="add-cat">${icon('plus')}Add category</button>`,
      `<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-ok" id="cats-save">${icon('check')}Save</button>`);
    $('#cats-save').addEventListener('click', async () => {
      const cats = [...document.querySelectorAll('[data-cat]')].map((el) => { const nm = el.querySelector('[data-cname]').value.trim(); return { id: el.querySelector('[data-ck]').value.trim() || nm.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'c' + Math.random().toString(36).slice(2, 6), name: nm }; }).filter((c) => c.name);
      const r = await api('/api/admin/cats', { cats }); if (r.ok) { S.cats = cats; toast('Saved'); closeModal(); vServices(); } else toast('Error');
    });
  }
  const catRow = (c) => `<div class="fieldrow" data-cat><div class="grid2"><div class="field"><label>Category name</label><input data-cname value="${esc(tl(c.name))}" placeholder="e.g. Game Top-Up"></div><div class="field"><label>ID (english)</label><input data-ck value="${esc(c.id)}" placeholder="auto"></div></div></div>`;

  /* ---------- users ---------- */
  async function vUsers() {
    const c = $('#content'); c.innerHTML = '<div class="spin"></div>';
    const r = await api('/api/admin/users'); const items = r.items || [];
    c.innerHTML = `<div class="card"><table class="tbl"><thead><tr><th>Name</th><th>Phone</th><th>Balance</th><th>Role</th><th></th></tr></thead><tbody>
      ${items.map((x) => `<tr><td><b>${esc(x.name)}</b> ${x.blocked ? '<span class="pill">blocked</span>' : ''}<div class="muted mono">${esc(x.ref)}</div></td><td class="mono">${esc(x.phone)}</td><td><b>${money(x.balance)}</b></td><td>${x.role === 'admin' ? '<span class="badge b-approved">admin</span>' : 'user'}</td>
        <td><button class="btn btn-ghost btn-sm" data-user='${esc(JSON.stringify(x))}'>${icon('edit')}Manage</button></td></tr>`).join('')}
    </tbody></table></div>`;
  }
  function userModal(x) {
    modal('Manage user', `<div class="kvs"><div><span class="k">Balance:</span> <b>${money(x.balance)}</b></div><div><span class="k">Referral code:</span> <b>${esc(x.ref || '')}</b></div></div>
      <div class="grid2" style="margin-top:12px"><div class="field"><label>Name</label><input id="u-name" value="${esc(x.name)}" maxlength="60"></div><div class="field"><label>Phone (login ID)</label><input id="u-phone" value="${esc(x.phone)}" maxlength="11" inputmode="numeric"></div></div>
      <div class="field"><label>New password <span class="muted" style="font-weight:500">(leave empty to keep)</span></label><input id="u-pass" type="text" minlength="6" maxlength="100" autocomplete="off"></div>
      <div class="grid2" style="margin-top:12px"><div class="field"><label>Add / subtract balance (৳)</label><input id="u-add" type="number" placeholder="e.g. 100 or -50"></div><div class="field"><label>Set exact balance (৳)</label><input id="u-set" type="number" placeholder="leave blank"></div></div>
      <div class="field"><label>Role</label><select id="u-role"><option value="user" ${x.role === 'user' ? 'selected' : ''}>user</option><option value="admin" ${x.role === 'admin' ? 'selected' : ''}>admin</option></select></div>
      <label class="flex" style="gap:6px"><input type="checkbox" id="u-block" ${x.blocked ? 'checked' : ''} style="width:auto"> Blocked</label>`,
      `<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-ok" id="u-save">${icon('check')}Save</button>`);
    $('#u-save').addEventListener('click', async () => {
      const body = { id: x.id, role: $('#u-role').value, blocked: $('#u-block').checked, name: $('#u-name').value.trim(), phone: $('#u-phone').value.trim() };
      if ($('#u-pass').value) { if ($('#u-pass').value.length < 6) { toast('Password: min 6'); return; } body.password = $('#u-pass').value; }
      if ($('#u-add').value) body.addBalance = Number($('#u-add').value);
      if ($('#u-set').value) body.setBalance = Number($('#u-set').value);
      const r = await api('/api/admin/user', body); if (r.ok) { toast('Saved'); closeModal(); vUsers(); } else toast(r.error === 'exists' ? 'This phone already has an account' : r.error === 'phone' ? 'Phone must be 01XXXXXXXXX' : r.error === 'self' ? 'You cannot remove your own admin' : 'Error');
    });
  }

  /* ---------- notices ---------- */
  let notices = [];
  async function vNotices() {
    const c = $('#content'); const r = await api('/api/admin/notices'); notices = r.notices || [];
    c.innerHTML = `<div class="flex" style="margin-bottom:14px"><button class="btn" data-act="add-notice">${icon('plus')}Add notice</button></div><div id="nlist" class="row-wrap">${renderNotices()}</div>`;
  }
  const renderNotices = () => notices.map((n, i) => `<div class="item"><div class="field"><label>Title</label><input data-nf="${i}:title" value="${esc(tl(n.title))}"></div>
    <div class="field"><label>Message</label><textarea data-nf="${i}:body">${esc(tl(n.body))}</textarea></div>
    <div class="flex" style="justify-content:space-between"><select data-nf="${i}:type" style="max-width:160px"><option value="info" ${n.type === 'info' ? 'selected' : ''}>info</option><option value="urgent" ${n.type === 'urgent' ? 'selected' : ''}>urgent</option></select><button class="btn btn-bad btn-sm" data-del-notice="${i}">${icon('trash')}Delete</button></div></div>`).join('') || '<div class="empty">No notices</div>';
  function saveNotices() {
    document.querySelectorAll('[data-nf]').forEach((el) => { const [i, path] = el.dataset.nf.split(':'); const n = notices[+i]; if (!n) return; n[path] = el.value; });
  }

  /* ---------- website texts (every label on the site) ---------- */
  async function vTexts() {
    const c = $('#content'); c.innerHTML = '<div class="spin"></div>';
    const r = await api('/api/admin/settings'); const cur = (r.settings && r.settings.texts) || {}; const def = r.textDefaults || {};
    c.innerHTML = `<div class="card"><div class="card-h">${icon('edit')}Every text on the website<span class="muted" style="font-weight:500;font-size:12px;margin-left:8px">Leave a box empty to keep the default (shown in grey).</span></div>
      <div class="card-b"><input id="tx-q" placeholder="Search text..." style="margin-bottom:12px">
      <div id="tx-list" class="grid2">${Object.keys(def).map((k) => `<div class="field" data-tx-row="${esc((def[k] + ' ' + (cur[k] || '')).toLowerCase())}"><label>${esc(def[k])}</label><input data-tx="${esc(k)}" maxlength="200" value="${esc(cur[k] || '')}" placeholder="${esc(def[k])}"></div>`).join('')}</div></div></div>
      <div style="margin-top:16px" class="flex"><button class="btn btn-ok" id="tx-save">${icon('check')}Save texts</button><button class="btn btn-ghost" id="tx-reset">Reset all to default</button></div>`;
    $('#tx-q').addEventListener('input', (e) => { const q = e.target.value.toLowerCase(); document.querySelectorAll('[data-tx-row]').forEach((el) => { el.style.display = !q || el.dataset.txRow.includes(q) ? '' : 'none'; }); });
    const save = async (texts) => { const r2 = await api('/api/admin/settings', { settings: { texts } }); toast(r2.ok ? 'Saved ✓' : 'Error'); if (r2.ok) vTexts(); };
    $('#tx-save').addEventListener('click', () => { const texts = {}; document.querySelectorAll('[data-tx]').forEach((el) => { if (el.value.trim()) texts[el.dataset.tx] = el.value.trim(); }); save(texts); });
    $('#tx-reset').addEventListener('click', () => { if (confirm('Reset every text to default?')) save({}); });
  }

  /* ---------- layout: show / hide parts of the site ---------- */
  async function vLayout() {
    const c = $('#content'); c.innerHTML = '<div class="spin"></div>';
    const r = await api('/api/admin/settings'); const l = (r.settings && r.settings.layout) || {};
    const groups = [
      ['home', 'Dashboard sections', [['notices', 'Notice board'], ['products', 'Products (category boxes)'], ['recent', 'Recent orders (LIVE)']]],
      ['menu', '3-dot menu items', [['orders', 'Order history'], ['referrals', 'Referrals'], ['profile', 'Profile']]],
      ['nav', 'Bottom navigation bar', [['orders', 'Orders'], ['addMoney', '+ Add money (center)'], ['referrals', 'Referrals'], ['profile', 'Profile']]],
    ];
    c.innerHTML = groups.map(([g, title, items]) => `<div class="card" style="margin-bottom:16px"><div class="card-h">${icon('grid')}${title}</div><div class="card-b">
      ${items.map(([k, lbl]) => `<label class="flex" style="justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--line)"><span style="font-weight:600">${lbl}</span><input type="checkbox" data-lay="${g}:${k}" ${!(l[g] && l[g][k] === false) ? 'checked' : ''} style="width:22px;height:22px"></label>`).join('')}
    </div></div>`).join('') + `<button class="btn btn-ok" id="lay-save">${icon('check')}Save layout</button>`;
    $('#lay-save').addEventListener('click', async () => {
      const layout = {}; document.querySelectorAll('[data-lay]').forEach((el) => { const [g, k] = el.dataset.lay.split(':'); (layout[g] = layout[g] || {})[k] = el.checked; });
      const r2 = await api('/api/admin/settings', { settings: { layout } }); toast(r2.ok ? 'Saved ✓' : 'Error');
    });
  }

  /* ---------- settings ---------- */
  async function vSettings() {
    const c = $('#content'); c.innerHTML = '<div class="spin"></div>';
    const r = await api('/api/admin/settings'); const s = r.settings || {};
    S.logo = s.logo || '';
    c.innerHTML = `<div class="card"><div class="card-h">${icon('eye')}Website, SEO & Theme</div><div class="card-b">
      <div class="field"><label>Website title (browser tab & Google)</label><input id="s-seot" maxlength="90" value="${esc(s.seoTitle || '')}" placeholder="e.g. WizeFF TopUp – Free Fire Diamond Top Up BD"></div>
      <div class="field"><label>Description (Google & share preview)</label><textarea id="s-seod" maxlength="300" placeholder="Short line about your service">${esc(s.seoDesc || '')}</textarea><div class="muted" style="font-size:11px">Shows under your site name on Google and when the link is shared.</div></div>
      <div class="grid2">
        <div class="field"><label>Logo</label><div class="flex"><div id="s-logoprev" class="iconbox" style="width:54px;height:54px;background:#eef2f5;overflow:hidden">${s.logo ? `<img src="${esc(s.logo)}" style="width:100%;height:100%;object-fit:cover">` : icon('eye')}</div>
          <button type="button" class="btn btn-ghost btn-sm" id="s-logobtn">${icon('plus')}Upload logo</button><button type="button" class="btn btn-bad btn-sm" id="s-logodel" ${s.logo ? '' : 'style="display:none"'}>Remove</button></div>
          <input type="file" id="s-logofile" accept="image/*" style="display:none"><div class="muted" style="font-size:11px;margin-top:4px">Square image works best. Also used as the browser icon.</div></div>
        <div class="field"><label>Theme color</label><div class="flex"><input id="s-theme" type="color" value="${esc(s.themeColor || '#0f766e')}" style="width:70px;height:46px;padding:3px"><span class="muted" style="font-size:12px">Whole site follows this color.</span></div>
          <div class="flex" style="margin-top:8px">${['#0f766e', '#2563eb', '#7c3aed', '#db2777', '#ea580c', '#0e1726', '#16a34a', '#dc2626'].map((h) => `<button type="button" data-theme-pick="${h}" style="width:28px;height:28px;border-radius:8px;border:2px solid #fff;box-shadow:0 0 0 1px #cbd5e1;background:${h}"></button>`).join('')}</div></div>
      </div>
    </div></div>
    <div class="card" style="margin-top:16px"><div class="card-h">${icon('cog')}General</div><div class="card-b">
      <div class="grid2"><div class="field"><label>Brand name A</label><input id="s-a" value="${esc(s.brandA || '')}"></div><div class="field"><label>Brand name B (colored)</label><input id="s-b" value="${esc(s.brandB || '')}"></div>
      <div class="field"><label>Tagline</label><input id="s-tbn" value="${esc(tl(s.tagline))}"></div><div></div>
      <div class="field"><label>Currency</label><input id="s-cur" value="${esc(s.currency || '৳')}" maxlength="3"></div><div class="field"><label>Min deposit (৳)</label><input id="s-min" type="number" value="${s.minDeposit || 20}"></div>
      <div class="field"><label>Referral bonus (৳)</label><input id="s-ref" type="number" value="${s.referralBonus || 0}"></div><div class="field"><label>WhatsApp (support)</label><input id="s-wa" value="${esc(s.whatsapp || '')}" placeholder="8801XXXXXXXXX"></div></div>
    </div></div>
    <div class="card" style="margin-top:16px"><div class="card-h">${icon('wallet')}Payment numbers<button class="btn btn-sm" data-act="add-method" style="margin-left:auto">${icon('plus')}Add</button></div><div class="card-b"><div id="methods">${(s.depositMethods || []).map(methodRow).join('')}</div></div></div>
    <div style="margin-top:16px"><button class="btn btn-ok" id="s-save">${icon('check')}Save settings</button></div>`;
    $('#s-save').addEventListener('click', saveSettings);
    $('#s-logobtn').addEventListener('click', () => $('#s-logofile').click());
    $('#s-logodel').addEventListener('click', () => { S.logo = ''; $('#s-logoprev').innerHTML = icon('eye'); $('#s-logodel').style.display = 'none'; });
    $('#s-logofile').addEventListener('change', async (e) => {
      const file = e.target.files[0]; if (!file) return;
      if (file.size > 2 * 1024 * 1024) { toast('Image too big (max 2MB)'); return; }
      const dataUrl = await new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(file); });
      toast('Uploading...'); const up = await api('/api/admin/upload', { dataUrl });
      if (up.ok) { S.logo = up.path; $('#s-logoprev').innerHTML = `<img src="${esc(up.path)}" style="width:100%;height:100%;object-fit:cover">`; $('#s-logodel').style.display = ''; toast('Logo ready — press Save'); } else toast('Upload failed');
    });
    document.querySelectorAll('[data-theme-pick]').forEach((b) => b.addEventListener('click', () => { $('#s-theme').value = b.dataset.themePick; }));
  }
  const methodRow = (m) => `<div class="fieldrow" data-method><div class="grid2"><div class="field"><label>Label</label><input data-ml value="${esc(m.label || '')}"></div><div class="field"><label>Number</label><input data-mn value="${esc(m.number || '')}" placeholder="01XXXXXXXXX"></div><div class="field"><label>Type</label><input data-mt value="${esc(m.type || 'Personal')}"></div><div class="field"><label>Color</label><input data-mc type="color" value="${esc(m.color || '#0f766e')}" style="height:42px;padding:3px"></div></div><div style="text-align:right"><button class="btn btn-bad btn-sm" data-del-method>${icon('trash')}</button></div></div>`;
  async function saveSettings() {
    const methods = [...document.querySelectorAll('[data-method]')].map((el) => ({ id: (el.querySelector('[data-ml]').value || 'm').toLowerCase().replace(/[^a-z0-9]/g, ''), label: el.querySelector('[data-ml]').value.trim(), number: el.querySelector('[data-mn]').value.trim(), type: el.querySelector('[data-mt]').value.trim(), color: el.querySelector('[data-mc]').value })).filter((m) => m.label);
    const settings = { seoTitle: $('#s-seot').value.trim(), seoDesc: $('#s-seod').value.trim(), logo: S.logo || '', themeColor: $('#s-theme').value, brandA: $('#s-a').value.trim(), brandB: $('#s-b').value.trim(), tagline: $('#s-tbn').value.trim(), currency: $('#s-cur').value.trim() || '৳', minDeposit: Number($('#s-min').value) || 20, referralBonus: Number($('#s-ref').value) || 0, whatsapp: $('#s-wa').value.replace(/[^0-9]/g, ''), depositMethods: methods };
    const r = await api('/api/admin/settings', { settings }); if (r.ok) toast('Saved ✓'); else toast('Error');
  }

  /* ---------- helpers ---------- */
  const tl = (o) => (o == null ? '' : typeof o === 'string' ? o : o.bn || o.en || '');
  function badge(st) { const m = { done: ['b-done', 'Done'], pending: ['b-pending', 'Pending'], processing: ['b-processing', 'Processing'], rejected: ['b-rejected', 'Rejected'], approved: ['b-approved', 'Approved'] }; const [c, l] = m[st] || m.pending; return `<span class="badge ${c}">${l}</span>`; }
  function modal(title, body, footer) { closeModal(); const s = document.createElement('div'); s.className = 'scrim'; s.id = 'modal'; s.innerHTML = `<div class="modal"><div class="modal-h"><h3>${esc(title)}</h3><button class="x" data-close>${icon('x')}</button></div><div class="modal-b">${body}</div><div class="modal-f">${footer}</div></div>`; document.body.appendChild(s); }
  function closeModal() { const m = $('#modal'); if (m) m.remove(); }

  /* ---------- events ---------- */
  document.addEventListener('click', async (e) => {
    const tab = e.target.closest('[data-tab]'); if (tab) { go(tab.dataset.tab); return; }
    if (e.target.closest('[data-act="menu"]')) { S.menuOpen = true; syncMenu(); return; }
    if (e.target.closest('[data-act="menu-close"]')) { S.menuOpen = false; syncMenu(); return; }
    if (e.target.closest('[data-act="refresh"]')) { go(S.tab); loadCounts(); return; }
    if (e.target.closest('[data-act="logout"]')) { await api('/api/auth/logout', {}); location.reload(); return; }
    if (e.target.closest('[data-close]') || (e.target.classList && e.target.classList.contains('scrim'))) { closeModal(); return; }
    const of = e.target.closest('[data-of]'); if (of) { orderFilter = of.dataset.of; vOrders(); return; }
    const df = e.target.closest('[data-df]'); if (df) { depFilter = df.dataset.df; vDeposits(); return; }
    const ov = e.target.closest('[data-oview]'); if (ov) { try { orderModal(JSON.parse(ov.dataset.oview)); } catch (x) {} return; }
    const dok = e.target.closest('[data-dep-ok]'); if (dok) { if (confirm('Approve this deposit and add balance?')) { const r = await api('/api/admin/deposit', { key: dok.dataset.depOk, status: 'approved' }); if (r.ok) { toast('Approved'); vDeposits(); loadCounts(); } } return; }
    const dno = e.target.closest('[data-dep-no]'); if (dno) { if (confirm('Reject this deposit?')) { const r = await api('/api/admin/deposit', { key: dno.dataset.depNo, status: 'rejected' }); if (r.ok) { toast('Rejected'); vDeposits(); loadCounts(); } } return; }
    if (e.target.closest('[data-act="new-svc"]')) { newService(); return; }
    if (e.target.closest('[data-act="edit-cats"]')) { editCats(); return; }
    const es = e.target.closest('[data-edit-svc]'); if (es) { editService(es.dataset.editSvc); return; }
    const ds = e.target.closest('[data-del-svc]'); if (ds) { if (confirm('Delete this service?')) { const list = S.services.filter((x) => x.id !== ds.dataset.delSvc); const r = await api('/api/admin/services', { services: list }); if (r.ok) { S.services = list; toast('Deleted'); vServices(); } } return; }
    if (e.target.closest('[data-act="add-field"]')) { readFieldsFromDom(); editing.fields.push({ key: '', type: 'text', required: false, label: '' }); $('#fields-wrap').innerHTML = editing.fields.map(fieldEditor).join(''); return; }
    const qa = e.target.closest('[data-qa]'); if (qa) { readFieldsFromDom();
      const presets = {
        player: { key: 'player_id', type: 'number', required: true, label: 'Player ID', ph: 'XXXXXXXXX' },
        dropdown: { key: 'package', type: 'select', required: true, label: 'Package', options: [{ label: 'Option 1', price: 0 }] },
        image: { key: 'screenshot', type: 'image', required: false, label: 'Upload image (optional)' },
        number: { key: 'qty', type: 'number', required: true, label: 'Quantity' },
        note: { key: 'note', type: 'textarea', required: false, label: 'Note (optional)' },
        blank: { key: '', type: 'text', required: false, label: '' },
      };
      editing.fields.push(JSON.parse(JSON.stringify(presets[qa.dataset.qa] || presets.blank)));
      $('#fields-wrap').innerHTML = editing.fields.map(fieldEditor).join(''); return; }
    const delF = e.target.closest('[data-del-field]'); if (delF) { readFieldsFromDom(); editing.fields.splice(+delF.dataset.delField, 1); $('#fields-wrap').innerHTML = editing.fields.map(fieldEditor).join(''); return; }
    const addOpt = e.target.closest('[data-add-opt]'); if (addOpt) { readFieldsFromDom(); const fi = +addOpt.dataset.addOpt; editing.fields[fi].options = editing.fields[fi].options || []; editing.fields[fi].options.push({ label: '', price: undefined }); $('#fields-wrap').innerHTML = editing.fields.map(fieldEditor).join(''); return; }
    const delOpt = e.target.closest('[data-del-opt]'); if (delOpt) { readFieldsFromDom(); const [fi, oi] = delOpt.dataset.delOpt.split(':'); editing.fields[+fi].options.splice(+oi, 1); $('#fields-wrap').innerHTML = editing.fields.map(fieldEditor).join(''); return; }
    if (e.target.closest('[data-act="add-cat"]')) { const w = $('#cats-wrap'); const div = document.createElement('div'); div.innerHTML = catRow({ id: '', name: { bn: '', en: '' } }); w.appendChild(div.firstChild); return; }
    const user = e.target.closest('[data-user]'); if (user) { try { userModal(JSON.parse(user.dataset.user)); } catch (x) {} return; }
    if (e.target.closest('[data-act="add-notice"]')) { saveNotices(); notices.unshift({ id: 'n' + Date.now(), type: 'info', ts: Date.now(), title: '', body: '' }); const nl = $('#nlist'); if (nl) nl.innerHTML = renderNotices(); saveNoticesToServer(); return; }
    const delN = e.target.closest('[data-del-notice]'); if (delN) { saveNotices(); notices.splice(+delN.dataset.delNotice, 1); $('#nlist').innerHTML = renderNotices(); saveNoticesToServer(); return; }
    if (e.target.closest('[data-act="add-method"]')) { const m = $('#methods'); const div = document.createElement('div'); div.innerHTML = methodRow({ label: '', number: '', type: 'Personal', color: '#0f766e' }); m.appendChild(div.firstChild); return; }
    const delM = e.target.closest('[data-del-method]'); if (delM) { delM.closest('[data-method]').remove(); return; }
  });
  // notices auto-save on blur
  document.addEventListener('blur', (e) => { if (e.target.closest && e.target.closest('[data-nf]')) saveNoticesToServer(); }, true);
  async function saveNoticesToServer() { saveNotices(); await api('/api/admin/notices', { notices }); }

  boot();
})();
