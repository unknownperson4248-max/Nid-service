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
    up: '<path d="M18 15l-6-6-6 6"/>', down: '<path d="M6 9l6 6 6-6"/>', home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
  };
  const icon = (n, cls = 'ic') => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;
  let toastT; function toast(m) { let e = $('#toast'); if (!e) { e = document.createElement('div'); e.id = 'toast'; e.className = 'toast'; document.body.appendChild(e); } e.textContent = m; e.style.display = ''; clearTimeout(toastT); toastT = setTimeout(() => e.style.display = 'none', 2000); }
  async function api(path, body, method) { const o = { method: method || (body ? 'POST' : 'GET'), headers: {} }; if (body) { o.headers['content-type'] = 'application/json'; o.body = JSON.stringify(body); } try { const r = await fetch(path, o); return await r.json(); } catch (e) { return { ok: false, error: 'net' }; } }

  let S = { me: null, tab: 'dash', stats: {}, services: [], cats: [], menuOpen: false };

  /* ---------- boot ---------- */
  const startTab = () => { if (location.hash === '#apikeys') { S.setTab = 'api'; return 'settings'; } return 'dash'; };
  async function boot() { const me = await api('/api/me'); S.me = me.user; root.setAttribute('aria-busy', 'false'); if (!S.me) return renderLogin(); if (S.me.role !== 'admin') return renderNoAdmin(); const ov = await api('/api/admin/overview'); if (ov && ov.error === 'locked') return renderUnlock(); renderShell(); go(startTab()); }
  function renderUnlock(err) {
    root.innerHTML = `<div class="login"><form class="login-card" id="uf"><div class="mark">${icon('lock')}</div><h2>Admin panel locked</h2><p>Enter the admin panel password</p>
      ${err ? `<div class="err">${esc(err)}</div>` : ''}
      <div class="field"><label>Admin password</label><input name="pass" type="password" autocomplete="off" required autofocus></div>
      <button class="btn" style="width:100%">${icon('lock')}Unlock</button>
      <button type="button" class="btn btn-ghost btn-sm" data-act="logout" style="width:100%;margin-top:8px">Logout</button></form></div>`;
    $('#uf').addEventListener('submit', async (e) => { e.preventDefault(); const d = Object.fromEntries(new FormData(e.target)); const r = await api('/api/admin/unlock', { pass: d.pass }); if (r.ok) { renderShell(); go(startTab()); } else renderUnlock('Wrong password'); });
  }
  function renderLogin(err) {
    root.innerHTML = `<div class="login"><form class="login-card" id="lf"><div class="mark">${icon('lock')}</div><h2>Admin Login</h2><p>WizeFF TopUp</p>
      ${err ? `<div class="err">${esc(err)}</div>` : ''}
      <div class="field"><label>Email or phone</label><input name="id" type="text" autocomplete="username" maxlength="120" placeholder="you@gmail.com" required></div>
      <div class="field"><label>Password</label><input name="password" type="password" required></div>
      <button class="btn" style="width:100%">${icon('lock')}Login</button></form></div>`;
    $('#lf').addEventListener('submit', async (e) => { e.preventDefault(); const d = Object.fromEntries(new FormData(e.target)); const r = await api('/api/auth/login', d); if (r.ok && r.user.role === 'admin') { S.me = r.user; renderShell(); go(startTab()); } else if (r.ok) renderNoAdmin(); else renderLogin('Wrong number or password'); });
  }
  function renderNoAdmin() { root.innerHTML = `<div class="login"><div class="login-card" style="text-align:center"><div class="mark">${icon('lock')}</div><h2>Not an admin</h2><p>This account has no admin access.</p><a class="btn" href="/">Go to app</a></div></div>`; }

  const NAV = [
    ['Overview', [['dash', 'dash', 'Dashboard']]],
    ['Shop', [['orders', 'box', 'Orders'], ['deposits', 'wallet', 'Deposits'], ['services', 'grid', 'Products'], ['payments', 'money', 'Payment methods']]],
    ['Customers', [['users', 'users', 'Users'], ['notices', 'bell', 'Notices']]],
    ['Site & settings', [['texts', 'edit', 'Texts'], ['layout', 'grid', 'Layout'], ['settings', 'cog', 'Settings']]],
  ];
  function renderShell() {
    root.innerHTML = `<div class="wrap">
      <aside class="side ${S.menuOpen ? 'on' : ''}"><div class="brand"><span class="mark">${icon('bolt')}</span><b>WizeFF Admin</b></div>
        <nav>${NAV.map(([group, items]) => `<div class="nav-group">${esc(group)}</div>${items.map(([k, ic, l]) => `<button data-tab="${k}" class="${S.tab === k ? 'on' : ''}">${icon(ic)}<span>${l}</span><span class="count ${k}-count" style="display:none"></span></button>`).join('')}`).join('')}</nav>
        <div class="foot"><button data-act="logout">${icon('logout')}Logout</button></div></aside>
      <div class="side-scrim ${S.menuOpen ? 'on' : ''}" data-act="menu-close"></div>
      <main class="main"><div class="topbar"><button class="menu-btn" data-act="menu">${icon('menu')}</button><h1 id="title">Dashboard</h1><div class="topbar-r"><a class="btn btn-ghost btn-sm" href="/" target="_blank" rel="noopener">${icon('eye')}View site</a><button class="btn btn-ghost btn-sm refresh" data-act="refresh">${icon('refresh')}Refresh</button></div></div>
        <div id="content"><div class="spin"></div></div></main></div>`;
    loadCounts();
  }
  async function loadCounts() { const r = await api('/api/admin/overview'); if (r.ok) { S.stats = r.stats; const po = $('.orders-count'), pd = $('.deposits-count'); if (po && r.stats.pendingOrders) { po.textContent = r.stats.pendingOrders; po.style.display = ''; } if (pd && r.stats.pendingDeposits) { pd.textContent = r.stats.pendingDeposits; pd.style.display = ''; } } }

  function go(tab) { S.tab = tab; document.querySelectorAll('.side nav button').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab)); const titles = { dash: 'Dashboard', orders: 'Orders', deposits: 'Deposits', payments: 'Payment methods', services: 'Products', users: 'Users', notices: 'Notices', texts: 'Website texts', layout: 'Layout (show / hide)', settings: 'Settings' }; $('#title').textContent = titles[tab]; S.menuOpen = false; syncMenu(); const views = { dash: vDash, orders: vOrders, deposits: vDeposits, payments: vPayments, services: vServices, users: vUsers, notices: vNotices, texts: vTexts, layout: vLayout, settings: vSettings }; (views[tab] || vDash)(); }
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
    const rows = Object.entries(o.fields || {}).map(([k, v]) => { const f = svc && (svc.fields || []).find((x) => x.key === k); const isImg = /^\/img\/[a-z0-9]{10,24}$/.test(String(v)); return `<div><span class="k">${esc(f ? tl(f.label) : (k === 'variant' ? 'Type' : k === 'quantity' ? 'Quantity' : k))}:</span> ${isImg ? `<a href="${esc(v)}" target="_blank" rel="noopener"><img src="${esc(v)}" alt="" style="max-width:140px;max-height:140px;border-radius:8px;border:1px solid var(--line);vertical-align:middle"></a>` : `<b>${esc(v)}</b>`}</div>`; }).join('');
    modal(`Order ${esc(o.id)}`, `
      <div class="flex" style="margin-bottom:10px">${badge(o.status)}<span class="pill">${new Date(o.ts).toLocaleString('en-GB')}</span></div>
      <div class="kvs"><div><span class="k">Customer:</span> <b>${esc(o.uname)}</b></div><div><span class="k">Service:</span> <b>${esc(tl(o.svcName))}</b></div><div><span class="k">Amount:</span> <b>${money(o.amount)}</b></div>${rows}</div>
      ${o.payVia === 'direct' ? `<div class="field" style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:10px">
        <div class="flex" style="justify-content:space-between"><b>💳 Direct payment (bKash/Nagad)</b><span class="badge">verify</span></div>
        <div style="font-size:13px;margin-top:6px">Sent to: <b>${esc((o.pay && o.pay.method) || '-')}</b></div>
        <div style="font-size:13px;margin-top:3px">TrxID: <b class="mono">${esc((o.pay && o.pay.trxid) || '-')}</b></div>
        ${o.pay && o.pay.sender ? `<div style="font-size:12px;margin-top:3px">From: <b>${esc(o.pay.sender)}</b></div>` : ''}
        <div class="muted" style="font-size:11px;margin-top:6px">Verify this payment, then set status to <b>processing/done</b> — auto-delivery (if any) runs on approval.</div>
      </div>` : ''}
      ${o.api ? `<div class="field" style="background:#f3f6f5;border:1px solid var(--line);border-radius:10px;padding:10px">
        <div class="flex" style="justify-content:space-between"><b>Auto-delivery (API)</b><span class="badge ${o.api.state === 'ok' ? 'b-approved' : o.api.state === 'failed' ? 'b-rejected' : ''}">${esc(o.api.state || '')}</span></div>
        ${o.api.extId ? `<div class="muted" style="font-size:12px;margin-top:5px">External ID: <b class="mono">${esc(o.api.extId)}</b></div>` : ''}
        ${o.api.error ? `<div style="font-size:12px;color:#dc2626;margin-top:5px">Error: ${esc(o.api.error)}</div>` : ''}
        ${o.api.resp ? `<div class="muted" style="font-size:11px;margin-top:5px;word-break:break-word">Provider says: <b>${esc(typeof o.api.resp === 'string' ? o.api.resp : JSON.stringify(o.api.resp))}</b></div>` : ''}
        <div class="muted" style="font-size:11px;margin-top:3px">Attempts: ${o.api.attempts || 1}</div>
        <button type="button" class="btn btn-ghost btn-sm" id="o-retry" style="margin-top:8px">${icon('refresh')}Retry API now</button>
      </div>` : ''}
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
    { const rb = $('#o-retry'); if (rb) rb.addEventListener('click', async () => { rb.disabled = true; toast('Calling API...'); const r = await api('/api/admin/order-retry', { key: o.key }); rb.disabled = false; if (r.ok) { toast(r.api && r.api.state === 'ok' ? 'Success ✓' : 'Failed: ' + ((r.api && r.api.error) || '')); closeModal(); vOrders(); } else toast(r.error === 'noapi' ? 'No API set for this product' : 'Error'); }); }
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
  let catOpen = {}; // which category sections are expanded (default: all open)
  let varOpen = {}; // which products show their sub-products in the list
  async function vServices() {
    const c = $('#content'); c.innerHTML = '<div class="spin"></div>';
    const r = await api('/api/admin/services'); S.services = r.services || []; S.cats = r.cats || [];
    renderServiceTree();
  }
  function renderServiceTree() {
    const c = $('#content');
    const cats = S.cats.slice().sort((a, b) => (a.order || 0) - (b.order || 0));
    const uncat = S.services.filter((s) => !cats.some((x) => x.id === (s.cat || '')));
    c.innerHTML = `<div class="flex" style="margin-bottom:14px;flex-wrap:wrap">
        <button class="btn" data-act="new-svc">${icon('plus')}New product</button>
        <button class="btn btn-ghost" data-act="new-cat">${icon('plus')}Add category</button>
        <span class="muted">${S.services.length} products in ${cats.length} categories</span>
      </div>
      <div id="svc-tree">
        ${cats.map((cat) => catSection(cat)).join('')}
        ${uncat.length ? catSection({ id: '__none', name: 'Uncategorized' }, uncat) : ''}
      </div>`;
  }
  function catSection(cat, overrideProducts) {
    const products = (overrideProducts || S.services.filter((s) => (s.cat || '') === cat.id)).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
    const open = catOpen[cat.id] !== false;
    return `<div class="cat-sec${open ? ' open' : ''}">
      <div class="cat-head" data-cat-toggle="${esc(cat.id)}">
        <button type="button" class="ib cat-chev">${icon('down')}</button>
        <b>${esc(tl(cat.name))}</b>
        <span class="pill">${products.length}</span>
        ${cat.id !== '__none' ? `<div class="cat-actions">
          <button type="button" class="btn btn-ghost btn-sm" data-add-prod="${esc(cat.id)}">${icon('plus')}Add product</button>
          <button type="button" class="ib" data-move-cat="${esc(cat.id)}:up" title="Move up">${icon('up')}</button>
          <button type="button" class="ib" data-move-cat="${esc(cat.id)}:down" title="Move down">${icon('down')}</button>
          <button type="button" class="ib" data-edit-cat="${esc(cat.id)}" title="Edit category">${icon('edit')}</button>
          <button type="button" class="ib" data-del-cat="${esc(cat.id)}" title="Delete category" style="color:var(--bad)">${icon('trash')}</button>
        </div>` : ''}
      </div>
      <div class="cat-body" ${open ? '' : 'hidden'}>
        ${products.map((s) => prodRow(s)).join('') || `<div class="empty" style="padding:18px">No products yet</div>`}
      </div>
    </div>`;
  }
  const varRate = (v) => { const P = v.pricing || {}; return P.mode !== 'fixed' ? `৳${P.basePrice != null ? P.basePrice : '?'} / ${P.baseQty != null ? P.baseQty : '?'} · min ${P.minQty != null ? P.minQty : 1} · max ${P.maxQty ? P.maxQty : '∞'}` : `৳${v.price || 0}`; };
  const varMiniRow = (svcId, i, v, total) => `<div class="var-mini">
      <div class="var-mini-main"><b>${esc(v.name || '(no name)')}</b><small>${varRate(v)}${v.serviceId ? ' · SMM ' + esc(v.serviceId) : ''}${v.active === false ? ' · off' : ''}</small></div>
      <button type="button" class="ib" data-move-var="${svcId}:${i}:up" title="Move up" ${i === 0 ? 'disabled' : ''}>${icon('up')}</button>
      <button type="button" class="ib" data-move-var="${svcId}:${i}:down" title="Move down" ${i === total - 1 ? 'disabled' : ''}>${icon('down')}</button>
      <button type="button" class="ib" data-edit-var2="${svcId}:${i}" title="Edit">${icon('edit')}</button>
      <button type="button" class="ib" data-del-var2="${svcId}:${i}" title="Delete" style="color:var(--bad)">${icon('trash')}</button></div>`;
  function prodRow(s) {
    const priceLbl = (s.price || 0) > 0 ? money(s.price) : (s.fields || []).some((f) => f.type === 'select') ? 'from options' : 'free';
    const vars = s.variants || []; const vo = varOpen[s.id];
    return `<div class="prod-wrap${vo ? ' vopen' : ''}"><div class="prod-row">
      <button type="button" class="prod-chev" data-prod-tog="${s.id}" title="Sub-products">${icon('down')}</button>
      <span class="prod-thumb" data-prod-tog="${s.id}">${s.image ? `<img src="${esc(s.image)}" alt="">` : `<span style="background:${s.color || '#0f766e'}">${icon(iconName(s.icon))}</span>`}</span>
      <div class="prod-info" data-prod-tog="${s.id}"><b>${esc(tl(s.name))}</b><small>${esc(tl(s.sub))} • ${priceLbl}${s.featured ? ' • ★' : ''}${vars.length ? ` • ${vars.length} sub-product${vars.length > 1 ? 's' : ''}` : ''}</small></div>
      <div class="prod-actions">
        <label class="tgl" title="Active"><input type="checkbox" data-toggle-svc="${s.id}" ${s.active !== false ? 'checked' : ''}><i></i></label>
        <button type="button" class="ib" data-move-svc="${s.id}:up" title="Move up">${icon('up')}</button>
        <button type="button" class="ib" data-move-svc="${s.id}:down" title="Move down">${icon('down')}</button>
        <button type="button" class="ib" data-edit-svc="${s.id}" title="Edit">${icon('edit')}</button>
        <button type="button" class="ib" data-del-svc="${s.id}" title="Delete" style="color:var(--bad)">${icon('trash')}</button>
      </div>
    </div>
      ${vo ? `<div class="var-wrap"><div class="var-list">${vars.map((v, i) => varMiniRow(s.id, i, v, vars.length)).join('')}${vars.length ? '' : `<div class="muted" style="padding:7px 10px;font-size:12.5px">No sub-products yet — this product uses its own price.</div>`}</div>
        <button type="button" class="btn btn-ghost btn-sm" data-add-var2="${s.id}">${icon('plus')}Add sub-product</button></div>` : ''}
    </div>`;
  }
  function variantModal(svcId, vi) {
    const sp = S.services.find((x) => x.id === svcId); if (!sp) return;
    sp.variants = sp.variants || [];
    const isNew = vi == null || vi < 0;
    const v = isNew ? { id: 'v' + Date.now().toString(36), name: '', active: true, price: 0, pricing: { mode: 'qty', qtyKey: 'quantity', baseQty: 1000, minQty: 100, step: 1 } } : sp.variants[vi];
    const P = v.pricing || {}; const isQ = P.mode !== 'fixed'; const val = (y) => (y == null ? '' : esc(String(y)));
    modal(`${isNew ? 'Add' : 'Edit'} sub-product`, `
      <div style="margin:-4px 0 12px;font-weight:700;color:var(--muted)">${esc(tl(sp.name))}</div>
      <div class="field"><label>Name <span class="req">*</span></label><input id="v-name" value="${val(v.name)}" placeholder="e.g. Facebook Followers"></div>
      <div class="field"><label>Price type</label><select id="v-mode"><option value="qty" ${isQ ? 'selected' : ''}>Quantity-based</option><option value="fixed" ${isQ ? '' : 'selected'}>Fixed price</option></select></div>
      <div id="v-qty" ${isQ ? '' : 'style="display:none"'}>
        <div class="grid2">
          <div class="field"><label>Base quantity</label><input id="v-bq" type="number" min="1" value="${val(P.baseQty != null ? P.baseQty : 1000)}"></div>
          <div class="field"><label>Base price (৳)</label><input id="v-bp" type="number" min="0" step="any" value="${val(P.basePrice)}" placeholder="e.g. 70"></div>
          <div class="field"><label>Minimum order</label><input id="v-min" type="number" min="1" value="${val(P.minQty != null ? P.minQty : 100)}"></div>
          <div class="field"><label>Maximum order</label><input id="v-max" type="number" min="0" value="${val(P.maxQty)}" placeholder="0 = no limit"></div>
          <div class="field"><label>Step</label><input id="v-step" type="number" min="1" value="${val(P.step != null ? P.step : 1)}"></div>
          <div class="field"><label>Preview</label><div class="pr-preview" style="margin:0"><input id="v-ptest" type="number" value="${val(P.minQty != null ? P.minQty : 1000)}"><b id="v-pout">—</b></div></div>
        </div>
      </div>
      <div id="v-fix" ${isQ ? 'style="display:none"' : ''}><div class="field"><label>Price (৳)</label><input id="v-price" type="number" min="0" step="any" value="${val(v.price || 0)}"></div></div>
      <div class="field"><label>Provider service ID (SMM)</label><input id="v-sid" value="${val(v.serviceId)}" placeholder="e.g. 567 · just the number from your panel"></div>
      <label class="flex" style="gap:6px"><input type="checkbox" id="v-active" ${v.active !== false ? 'checked' : ''} style="width:auto"> Active (shown to customers)</label>
    `, `<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-ok" id="v-save">${icon('check')}${isNew ? 'Add' : 'Save'}</button>`);
    const num = (id) => { const el = $(id); if (!el || el.value === '') return undefined; const n = Number(el.value); return Number.isFinite(n) ? n : undefined; };
    const collect = () => {
      const mode = $('#v-mode').value === 'fixed' ? 'fixed' : 'qty';
      const out = { ...v, name: $('#v-name').value.trim(), active: $('#v-active').checked, serviceId: $('#v-sid').value.trim().replace(/^\s*id[\s:_#-]*/i, '') };
      if (mode === 'fixed') { out.price = num('#v-price') || 0; out.pricing = { ...(v.pricing || {}), mode: 'fixed', qtyKey: 'quantity' }; }
      else { const P2 = { ...(v.pricing || {}), mode: 'qty', qtyKey: 'quantity' }; const set = (k, x) => { if (x === undefined) delete P2[k]; else P2[k] = x; }; set('baseQty', num('#v-bq')); set('basePrice', num('#v-bp')); set('minQty', num('#v-min')); set('maxQty', num('#v-max')); set('step', num('#v-step')); out.pricing = P2; }
      return out;
    };
    const preview = () => { const o = collect(); const r = wzPrice({ price: o.price, pricing: o.pricing, fields: [] }, { quantity: $('#v-ptest') ? $('#v-ptest').value : '' }); $('#v-pout').textContent = r.ok ? '৳' + r.amount.toLocaleString('en-US') : (r.err || '—'); $('#v-pout').classList.toggle('bad', !r.ok); };
    $('#v-mode').addEventListener('change', () => { const q = $('#v-mode').value !== 'fixed'; $('#v-qty').style.display = q ? '' : 'none'; $('#v-fix').style.display = q ? 'none' : ''; preview(); });
    document.querySelectorAll('.modal input').forEach((el) => el.addEventListener('input', preview)); preview();
    $('#v-save').addEventListener('click', async () => {
      const o = collect();
      if (!o.name) { toast('Name required'); return; }
      if ((o.pricing.mode !== 'fixed') && !(o.pricing.basePrice >= 0 && o.pricing.baseQty > 0)) { toast('Set base quantity & price'); return; }
      if (isNew) sp.variants.push(o); else sp.variants[vi] = o;
      if (await saveServiceList(S.services)) { toast('Saved ✓'); closeModal(); varOpen[svcId] = true; vServices(); }
    });
  }
  async function saveServiceList(list) { S.services = list; const r = await api('/api/admin/services', { services: list }); if (!r.ok) toast('Error'); return r.ok; }
  const iconName = (n) => (ICONS[n] ? n : 'bolt');
  const catName = (id) => { const c = S.cats.find((x) => x.id === id); return c ? tl(c.name) : id || '-'; };

  let editing = null; // service being edited (deep copy)
  function newService(presetCat) { editing = { id: 'svc' + Date.now().toString(36), cat: presetCat || (S.cats[0] || {}).id || '', icon: 'bolt', color: '#0f766e', active: true, featured: false, price: 0, name: '', sub: '', note: '', fields: [] }; svcModal(); }
  function editService(id) { const s = S.services.find((x) => x.id === id); editing = JSON.parse(JSON.stringify(s)); if (!editing.fields) editing.fields = []; svcModal(); }

  /* ---------- hybrid pricing editor (per product; uses the shared wzPrice engine for the preview) ---------- */
  function pricingBoxHtml(s) {
    const P = s.pricing || {}; const mode = (P.mode === 'qty' || P.mode === 'formula') ? P.mode : 'fixed';
    const v = (x) => (x == null ? '' : esc(String(x)));
    const modes = [['fixed', 'Fixed price', 'One set price'], ['qty', 'Quantity-based', 'Followers, likes, views'], ['formula', 'Custom formula', 'Base + per-unit rules']];
    return `<div class="pr-box">
      <div class="pr-h">${icon('money')}<b>Pricing</b><span class="muted">This product only</span></div>
      <input type="hidden" id="f-pmode" value="${mode}">
      <div class="pr-modes">${modes.map(([k, t1, t2]) => `<button type="button" class="pr-mode ${mode === k ? 'on' : ''}" data-pmode="${k}"><b>${t1}</b><small>${t2}</small></button>`).join('')}</div>
      <div class="pr-sec" data-pm-sec="fixed">
        <div class="field"><label>Product price (৳)</label><input id="f-price" type="number" min="0" step="any" value="${s.price || 0}"><div class="muted" style="font-size:11px">Customers can't change it. Keep 0 only if a dropdown sets per-option prices.</div></div>
      </div>
      <div class="pr-sec" data-pm-sec="qty">
        <div class="grid2">
          <div class="field"><label>Base quantity</label><input id="f-bq" type="number" min="1" value="${v(P.baseQty != null ? P.baseQty : 1000)}"></div>
          <div class="field"><label>Base price (৳)</label><input id="f-bp" type="number" min="0" step="any" value="${v(P.basePrice != null ? P.basePrice : '')}" placeholder="e.g. 70"></div>
        </div>
        <div class="muted pr-note">Total = quantity ÷ base quantity × base price. e.g. 1000 = ৳70 → 5000 = ৳350</div>
      </div>
      <div class="pr-sec" data-pm-sec="formula">
        <div class="grid2">
          <div class="field"><label>Base amount (৳)</label><input id="f-fbase" type="number" min="0" step="any" value="${v(P.base)}" placeholder="0"></div>
          <div class="field"><label>Per-unit rate (৳)</label><input id="f-frate" type="number" min="0" step="any" value="${v(P.rate)}" placeholder="e.g. 0.07"></div>
          <div class="field"><label>Adjustment (%)</label><input id="f-fpct" type="number" step="any" value="${v(P.pct)}" placeholder="e.g. 10 or -5"></div>
          <div></div>
          <div class="field"><label>Minimum charge (৳)</label><input id="f-fminc" type="number" min="0" step="any" value="${v(P.minCharge)}" placeholder="0 = none"></div>
          <div class="field"><label>Maximum charge (৳)</label><input id="f-fmaxc" type="number" min="0" step="any" value="${v(P.maxCharge)}" placeholder="0 = none"></div>
        </div>
        <label class="flex" style="gap:6px;margin-bottom:8px"><input type="checkbox" id="f-fuseq" ${P.useQty ? 'checked' : ''} style="width:auto"> Customer enters a quantity (units)</label>
        <div class="muted pr-note">Total = (base + rate × units) × (100 + adjustment)% , kept between min and max charge.</div>
      </div>
      <div class="pr-sec" data-pm-sec="limits">
        <div class="pr-sub">Quantity limits</div>
        <div class="grid2">
          <div class="field"><label>Minimum quantity</label><input id="f-minq" type="number" min="0" value="${v(P.minQty != null ? P.minQty : 100)}"></div>
          <div class="field"><label>Maximum quantity</label><input id="f-maxq" type="number" min="0" value="${v(P.maxQty != null ? P.maxQty : '')}" placeholder="0 = no limit"></div>
          <div class="field"><label>Quantity step</label><input id="f-step" type="number" min="1" value="${v(P.step != null ? P.step : 1)}"></div>
          <div class="field"><label>Box label</label><input id="f-qlabel" value="${v(P.qtyLabel)}" placeholder="Quantity"></div>
        </div>
      </div>
      <details class="pr-adv" ${(P.minAmount || P.maxAmount) ? 'open' : ''}><summary>Order amount limits (optional)</summary>
        <div class="grid2" style="margin-top:8px">
          <div class="field"><label>Minimum order (৳)</label><input id="f-mina" type="number" min="0" value="${v(P.minAmount)}" placeholder="0 = off"></div>
          <div class="field"><label>Maximum order (৳)</label><input id="f-maxa" type="number" min="0" value="${v(P.maxAmount)}" placeholder="0 = off"></div>
        </div>
      </details>
      <div class="pr-preview"><span>Preview</span><input id="f-ptest" type="number" min="0" placeholder="quantity" value="${v(P.minQty != null ? P.minQty : 1000)}"><b id="f-pout">—</b></div>
    </div>`;
  }
  function readPricing() {
    const n = (id) => { const el = $(id); if (!el || el.value === '') return undefined; const x = Number(el.value); return Number.isFinite(x) ? x : undefined; };
    const prev = (editing && editing.pricing) || {};
    const mode = ($('#f-pmode') || {}).value || 'fixed';
    const P = { ...prev, mode, qtyKey: prev.qtyKey || 'quantity' };
    const set = (k, val) => { if (val === undefined) delete P[k]; else P[k] = val; };
    set('baseQty', n('#f-bq')); set('basePrice', n('#f-bp'));
    set('base', n('#f-fbase')); set('rate', n('#f-frate')); set('pct', n('#f-fpct')); set('minCharge', n('#f-fminc')); set('maxCharge', n('#f-fmaxc'));
    P.useQty = !!($('#f-fuseq') && $('#f-fuseq').checked);
    set('minQty', n('#f-minq')); set('maxQty', n('#f-maxq')); set('step', n('#f-step'));
    const ql = $('#f-qlabel'); if (ql && ql.value.trim()) P.qtyLabel = ql.value.trim(); else delete P.qtyLabel;
    set('minAmount', n('#f-mina')); set('maxAmount', n('#f-maxa'));
    return P;
  }
  function wirePricing() {
    const box = $('.pr-box'); if (!box) return;
    const show = () => {
      const mode = $('#f-pmode').value; const useQ = mode === 'qty' || (mode === 'formula' && $('#f-fuseq').checked);
      box.querySelectorAll('.pr-mode').forEach((b) => b.classList.toggle('on', b.dataset.pmode === mode));
      box.querySelectorAll('[data-pm-sec]').forEach((sec) => { const k = sec.dataset.pmSec; sec.style.display = (k === mode || (k === 'limits' && useQ)) ? '' : 'none'; });
      $('#f-ptest').style.display = useQ ? '' : 'none';
      preview();
    };
    const preview = () => {
      const P = readPricing(); const price = Number(($('#f-price') || {}).value) || 0;
      const r = wzPrice({ price, pricing: P, fields: [] }, { [P.qtyKey || 'quantity']: $('#f-ptest').value });
      const msg = { qty_required: 'enter a quantity', qty_invalid: 'whole numbers only', qty_min: 'below minimum', qty_max: 'above maximum', qty_step: 'not a valid step', config: 'set base quantity & price', amount_min: 'below minimum order', amount_max: 'above maximum order' };
      $('#f-pout').textContent = r.ok ? '৳' + r.amount.toLocaleString('en-US') : (msg[r.err] || r.err);
      $('#f-pout').classList.toggle('bad', !r.ok);
    };
    box.querySelectorAll('.pr-mode').forEach((b) => b.addEventListener('click', () => { $('#f-pmode').value = b.dataset.pmode; show(); }));
    box.addEventListener('input', preview); $('#f-fuseq').addEventListener('change', show);
    show();
  }

  /* ---------- sub-products (variants) editor ---------- */
  function varRow(x, i) {
    const P = x.pricing || {}; const isQ = P.mode !== 'fixed'; const v = (y) => (y == null ? '' : esc(String(y)));
    const sum = isQ ? `৳${v(P.basePrice) || '?'} / ${v(P.baseQty) || '?'} · min ${v(P.minQty) || 1} · max ${P.maxQty ? v(P.maxQty) : '∞'}` : `৳${v(x.price) || 0}`;
    return `<div class="vr-row${x._open ? ' open' : ''}">
      <div class="vr-head" data-tog-var="${i}"><b>${esc(x.name || '(no name)')}</b><span class="muted vr-sum">${sum}</span>${x.active === false ? '<span class="pill">off</span>' : ''}
        <span style="margin-left:auto"></span><button type="button" class="ib" data-del-var="${i}" aria-label="Delete">${icon('trash')}</button><span class="ib vr-chev">${icon('back')}</span></div>
      <div class="vr-body" ${x._open ? '' : 'hidden'}>
        <div class="grid2">
          <div class="field"><label>Name</label><input data-vf="${i}:name" value="${v(x.name)}" placeholder="e.g. Facebook Followers"></div>
          <div class="field"><label>Price type</label><select data-vf="${i}:mode"><option value="qty" ${isQ ? 'selected' : ''}>Quantity-based</option><option value="fixed" ${isQ ? '' : 'selected'}>Fixed price</option></select></div>
          <div class="field" ${isQ ? '' : 'style="display:none"'}><label>Base quantity</label><input type="number" min="1" data-vf="${i}:baseQty" value="${v(P.baseQty != null ? P.baseQty : 1000)}"></div>
          <div class="field" ${isQ ? '' : 'style="display:none"'}><label>Base price (৳)</label><input type="number" min="0" step="any" data-vf="${i}:basePrice" value="${v(P.basePrice)}" placeholder="e.g. 70"></div>
          <div class="field" ${isQ ? '' : 'style="display:none"'}><label>Minimum order</label><input type="number" min="1" data-vf="${i}:minQty" value="${v(P.minQty != null ? P.minQty : 100)}"></div>
          <div class="field" ${isQ ? '' : 'style="display:none"'}><label>Maximum order</label><input type="number" min="0" data-vf="${i}:maxQty" value="${v(P.maxQty)}" placeholder="0 = no limit"></div>
          <div class="field" ${isQ ? '' : 'style="display:none"'}><label>Step</label><input type="number" min="1" data-vf="${i}:step" value="${v(P.step != null ? P.step : 1)}"></div>
          <div class="field" ${isQ ? 'style="display:none"' : ''}><label>Price (৳)</label><input type="number" min="0" step="any" data-vf="${i}:price" value="${v(x.price)}"></div>
          <div class="field"><label>Provider service ID (SMM)</label><input data-vf="${i}:serviceId" value="${v(x.serviceId)}" placeholder="optional · used as {service}"></div>
        </div>
        <label class="flex" style="gap:6px"><input type="checkbox" data-vf="${i}:active" ${x.active !== false ? 'checked' : ''} style="width:auto"> Active (shown to customers)</label>
      </div></div>`;
  }
  function readVariants() {
    if (!editing || !Array.isArray(editing.variants)) return;
    document.querySelectorAll('[data-vf]').forEach((el) => {
      const [i, k] = el.dataset.vf.split(':'); const x = editing.variants[+i]; if (!x) return;
      x.pricing = x.pricing || { mode: 'qty', qtyKey: 'quantity' };
      const n = el.value === '' ? undefined : Number(el.value);
      if (k === 'name' || k === 'serviceId') x[k] = el.value.trim();
      else if (k === 'active') x.active = el.checked;
      else if (k === 'mode') x.pricing.mode = el.value === 'fixed' ? 'fixed' : 'qty';
      else if (k === 'price') x.price = Number.isFinite(n) ? n : 0;
      else if (n === undefined || !Number.isFinite(n)) delete x.pricing[k]; else x.pricing[k] = n;
    });
  }
  function renderVariants() {
    const list = editing.variants || [];
    $('#vr-list').innerHTML = list.map(varRow).join('');
    $('#vr-count').textContent = list.length + ' added';
    $('#pr-wrap').style.display = list.length ? 'none' : '';
    $('#pr-varnote').style.display = list.length ? '' : 'none';
    document.querySelectorAll('[data-vf$=":mode"]').forEach((sel) => sel.addEventListener('change', () => { readVariants(); renderVariants(); }));
    document.querySelectorAll('[data-vf]').forEach((el) => el.addEventListener('input', () => { readVariants(); const i = +el.dataset.vf.split(':')[0]; const row = $('#vr-list').children[i]; const x = list[i]; if (row && x) { const tmp = document.createElement('div'); tmp.innerHTML = varRow(x, i); row.querySelector('.vr-sum').textContent = tmp.querySelector('.vr-sum').textContent; row.querySelector('.vr-head b').textContent = x.name || '(no name)'; } }));
  }
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
        <input type="file" id="f-imgfile" accept="image/*" style="display:none"><div class="muted" style="font-size:11px;margin-top:4px">Shows on the product box only (not inside the order page). Max 2MB.</div></div>
      <div class="field"><label>Order guide (shown in a box under the order form)</label>
        <div class="flex"><div id="f-gimgprev" class="iconbox" style="width:54px;height:54px;background:#eef2f5;overflow:hidden">${s.guideImg ? `<img src="${esc(s.guideImg)}" style="width:100%;height:100%;object-fit:cover">` : icon('images')}</div>
          <button type="button" class="btn btn-ghost btn-sm" id="f-gimgbtn">${icon('plus')}Guide image</button>
          ${s.guideImg ? `<button type="button" class="btn btn-bad btn-sm" id="f-gimgdel">Remove</button>` : ''}</div>
        <input type="file" id="f-gimgfile" accept="image/*" style="display:none">
        <textarea id="f-gnote" rows="2" maxlength="500" placeholder="e.g. Clan ID koi pabe — chobi dekhun" style="margin-top:8px">${esc(s.guideNote || '')}</textarea>
        <div class="muted" style="font-size:11px;margin-top:4px">A help box (image + text) shown below the order form, to guide buyers. Max 2MB.</div></div>
      <div class="grid2">
        <div class="field"><label>Category</label><select id="f-cat">${S.cats.map((c) => `<option value="${esc(c.id)}" ${s.cat === c.id ? 'selected' : ''}>${esc(tl(c.name))}</option>`).join('')}</select></div>
        <div class="field"><label>Icon (if no image)</label><select id="f-icon">${['bolt', 'diamond', 'crown', 'thumb', 'phone', 'wallet', 'box', 'grid', 'money', 'eye'].map((n) => `<option value="${n}" ${s.icon === n ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
        <div class="field"><label>Color</label><input id="f-color" type="color" value="${esc(s.color || '#0f766e')}" style="height:42px;padding:3px"></div>
      </div>
      <div id="pr-wrap" ${(s.variants || []).length ? 'style="display:none"' : ''}>${pricingBoxHtml(s)}</div>
      <div class="muted pr-varnote" ${(s.variants || []).length ? '' : 'style="display:none"'}>${icon('info')} This product has ${(s.variants || []).length} sub-product(s). Set their prices from the product list — open the product's <b>Sub-products</b> row. This product's own price is not used.</div>
      <div class="flex" style="margin:4px 0 14px">
        <label class="flex" style="gap:6px"><input type="checkbox" id="f-active" ${s.active ? 'checked' : ''} style="width:auto"> Active</label>
        <label class="flex" style="gap:6px"><input type="checkbox" id="f-featured" ${s.featured ? 'checked' : ''} style="width:auto"> Featured</label>
      </div>
      <div style="margin-bottom:8px"><b style="font-family:var(--disp)">Order boxes (fields)</b><div class="muted" style="font-size:12px">Quick add a ready box, then edit it. Each box can be required or optional.</div></div>
      <div class="qa-row">${[['player', 'FF Player ID', 'bolt'], ['dropdown', 'Dropdown / package', 'grid'], ['image', 'Image upload', 'eye'], ['number', 'Number', 'money'], ['note', 'Note', 'edit'], ['blank', 'Blank box', 'plus']].map(([k, lbl, ic]) => `<button type="button" class="qa" data-qa="${k}">${icon(ic)}${lbl}</button>`).join('')}</div>
      <div id="fields-wrap">${s.fields.map(fieldEditor).join('')}</div>
      <div style="margin-top:18px;border-top:1px solid var(--line);padding-top:14px">
        <label class="flex" style="gap:6px;font-weight:700"><input type="checkbox" id="f-api-on" ${(s.api && s.api.on) ? 'checked' : ''} style="width:auto"> Auto-delivery via API <span class="muted" style="font-weight:500;font-size:12px">(off = manual)</span></label>
        <div id="f-api-detail" style="${(s.api && s.api.on) ? '' : 'display:none'};margin-top:10px">
          <div class="flex" style="margin-bottom:10px"><span class="muted" style="font-size:12px">1-click setup:</span><button type="button" class="btn btn-ghost btn-sm" data-apipreset="ffglory">ffglory (Glory)</button><button type="button" class="btn btn-ghost btn-sm" data-apipreset="smm">SMM panel</button></div>
          <label class="flex" style="gap:6px;margin:0 0 6px"><input type="checkbox" id="f-api-done" ${(s.api && s.api.doneOnOk) ? 'checked' : ''} style="width:auto"> Mark order <b>Done</b> on success (else <b>Processing</b>)</label>
          <label class="flex" style="gap:6px;margin:0 0 6px"><input type="checkbox" id="f-api-track" ${(s.api && s.api.track) ? 'checked' : ''} style="width:auto"> Track status from provider <span class="muted" style="font-size:11.5px">(SMM: Completed → Done, Partial/Canceled → auto refund)</span></label>
          <div class="grid2" style="margin-top:8px">
            <div class="field"><label>Request format</label><select id="f-api-format"><option value="json" ${(s.api && s.api.format) === 'form' ? '' : 'selected'}>JSON</option><option value="form" ${(s.api && s.api.format) === 'form' ? 'selected' : ''}>Form (SMM panels)</option></select></div>
            <div class="field"><label>Provider service ID</label><input id="f-svc-provid" value="${esc(s.serviceId || '')}" placeholder="e.g. 567 · used as {service}"><div class="muted" style="font-size:11px">Sub-products use their own ID.</div></div>
          </div>
          <div class="flex" style="margin:2px 0 8px"><button type="button" class="btn btn-ghost btn-sm" id="f-api-bal">${icon('wallet')}Check panel balance</button><span class="muted" id="f-api-balout" style="font-size:12.5px"></span></div>
          <details style="margin-top:6px"><summary class="muted" style="font-size:12px;cursor:pointer">Advanced request settings</summary>
            <div class="muted" style="font-size:11px;margin:8px 0">Use <code>{boxkey}</code> for an order box value, <code>{{SECRET}}</code> for a saved key (Settings → API keys).</div>
            <div class="grid2">
              <div class="field"><label>Method</label><select id="f-api-method">${['POST', 'GET'].map((m) => `<option ${((s.api && s.api.method) || 'POST') === m ? 'selected' : ''}>${m}</option>`).join('')}</select></div>
              <div class="field"><label>Response ID path</label><input id="f-api-idpath" value="${esc((s.api && s.api.idPath) || '')}" placeholder="group_id"></div>
            </div>
            <div class="field"><label>URL</label><input id="f-api-url" value="${esc((s.api && s.api.url) || '')}" placeholder="https://..."></div>
            <div class="field"><label>Query params (JSON)</label><input id="f-api-query" value="${esc((s.api && s.api.query) || '')}" placeholder='{"api_key":"{{FFGLORY_KEY}}"}'></div>
            <div class="field"><label>Headers (JSON)</label><input id="f-api-headers" value="${esc((s.api && s.api.headers) || '')}" placeholder='{"x-api-key":"{{FFGLORY_MKEY}}"}'></div>
            <div class="field"><label>Body (JSON)</label><textarea id="f-api-body" rows="3" placeholder='{"region":"{region}","clan_id":"{clan_id}"}'>${esc((s.api && s.api.body) || '')}</textarea></div>
            <div class="field"><label>Status request body (for tracking)</label><textarea id="f-api-sbody" rows="2" placeholder='{"key":"{{SMM_KEY}}","action":"status","order":"{extId}"}'>${esc((s.api && s.api.statusBody) || '')}</textarea></div>
          </details>
        </div>
      </div>`,
      `<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-ok" id="svc-save">${icon('check')}Save product</button>`);
    $('#svc-save').addEventListener('click', saveService);
    wirePricing();
    const balBtn = $('#f-api-bal'); if (balBtn) balBtn.addEventListener('click', async () => {
      const out = $('#f-api-balout'); out.textContent = 'Checking…';
      const r = await api('/api/admin/api-balance', { url: $('#f-api-url').value.trim(), format: $('#f-api-format').value, headers: $('#f-api-headers').value, body: $('#f-api-body').value });
      const d = r.resp || {};
      out.textContent = r.ok ? `Balance: ${d.balance} ${d.currency || ''}` : `Failed: ${(d && d.error) || r.error || ('http ' + (r.status || ''))}`;
      out.style.color = r.ok ? '#15803d' : '#dc2626';
    });
    const apiOn = $('#f-api-on'); const apiDetail = $('#f-api-detail');
    if (apiOn && apiDetail) apiOn.addEventListener('change', () => { apiDetail.style.display = apiOn.checked ? '' : 'none'; });
    document.querySelectorAll('[data-apipreset]').forEach((bb) => bb.addEventListener('click', () => {
      readFieldsFromDom(); syncSvcText();
      editing.fields = editing.fields || [];
      if (bb.dataset.apipreset === 'ffglory') {
        editing.api = { on: true, doneOnOk: true, method: 'POST', url: 'https://ffglory.pro/api/client/auto-clan-group', query: '{"api_key":"{{FFGLORY_KEY}}"}', headers: '{"x-api-key":"{{FFGLORY_MKEY}}"}', body: '{"region":"{region}","clan_id":"{clan_id}"}', idPath: 'group_id' };
        if (!editing.fields.some((f) => f.key === 'region')) editing.fields.unshift({ key: 'region', type: 'select', required: true, label: { bn: 'রিজন নির্বাচন করুন', en: 'Region' }, options: [{ label: '🇧🇩 বাংলাদেশ', value: 'bd' }] });
        if (!editing.fields.some((f) => f.key === 'duration')) { const ri = editing.fields.findIndex((f) => f.key === 'region'); editing.fields.splice(ri + 1, 0, { key: 'duration', type: 'select', required: true, label: { bn: 'সময়কাল', en: 'Duration' }, options: [{ label: '৮ ঘণ্টা', value: '8h', price: 0, note: '8 hours · 1 credit' }, { label: '১৬ ঘণ্টা', value: '16h', note: '+8 hours · 2 credits' }] }); }
        if (!editing.fields.some((f) => f.key === 'clan_id')) editing.fields.push({ key: 'clan_id', type: 'text', required: true, label: { bn: 'ক্লান আইডি (UID)', en: 'Clan ID' }, ph: '123456789' });
        toast('ffglory ready ✓ region + Clan ID boxes added');
      } else {
        editing.api = { on: true, doneOnOk: false, track: true, format: 'form', method: 'POST', url: 'https://my.smm-panel.com/api/v2', query: '', headers: '', body: '{"key":"{{SMM_KEY}}","action":"add","service":"{service}","link":"{link}","quantity":"{quantity}"}', statusBody: '{"key":"{{SMM_KEY}}","action":"status","order":"{extId}"}', idPath: 'order' };
        if (!editing.fields.some((f) => f.key === 'link')) editing.fields.push({ key: 'link', type: 'text', required: true, label: { bn: 'লিংক', en: 'Link' }, ph: 'https://...' });
        // quantity is entered through the pricing system, so an old plain quantity box is not needed
        editing.fields = editing.fields.filter((f) => !(f.key === 'quantity' && f.type === 'number'));
        if (!(editing.variants || []).length && !(editing.pricing && editing.pricing.mode === 'qty')) editing.pricing = { ...(editing.pricing || {}), mode: 'qty', qtyKey: 'quantity', baseQty: 1000, minQty: 100, step: 1 };
        toast('SMM ready ✓ add sub-products (or a service ID) + save key SMM_KEY');
      }
      svcModal();
    }));
    $('#f-imgbtn').addEventListener('click', () => $('#f-imgfile').click());
    $('#f-imgfile').addEventListener('change', uploadImage);
    const del = $('#f-imgdel'); if (del) del.addEventListener('click', () => { readFieldsFromDom(); syncSvcText(); editing.image = ''; svcModal(); });
    $('#f-gimgbtn').addEventListener('click', () => $('#f-gimgfile').click());
    $('#f-gimgfile').addEventListener('change', uploadGuideImage);
    const gdel = $('#f-gimgdel'); if (gdel) gdel.addEventListener('click', () => { readFieldsFromDom(); syncSvcText(); editing.guideImg = ''; svcModal(); });
  }
  function syncSvcText() { const g = (id) => { const el = $(id); return el ? el.value : undefined; }; const n = g('#f-name'); if (n !== undefined) editing.name = n.trim(); const sb = g('#f-sub'); if (sb !== undefined) editing.sub = sb.trim(); const no = g('#f-note'); if (no !== undefined) editing.note = no.trim(); const cat = g('#f-cat'); if (cat !== undefined) editing.cat = cat; const ic = g('#f-icon'); if (ic !== undefined) editing.icon = ic; const col = g('#f-color'); if (col !== undefined) editing.color = col; const pr = g('#f-price'); if (pr !== undefined) editing.price = Number(pr) || 0; const ac = $('#f-active'); if (ac) editing.active = ac.checked; const fe = $('#f-featured'); if (fe) editing.featured = fe.checked; const gn = $('#f-gnote'); if (gn) editing.guideNote = gn.value.trim(); if ($('#f-pmode')) editing.pricing = readPricing(); readVariants();
    const pid = $('#f-svc-provid'); if (pid) editing.serviceId = pid.value.trim();
    const ao = $('#f-api-on'); if (ao) { editing.api = editing.api || {}; editing.api.on = ao.checked; editing.api.track = !!($('#f-api-track') && $('#f-api-track').checked); editing.api.format = ($('#f-api-format') || {}).value === 'form' ? 'form' : 'json'; if ($('#f-api-sbody')) editing.api.statusBody = $('#f-api-sbody').value.trim(); editing.api.doneOnOk = $('#f-api-done') ? $('#f-api-done').checked : !!editing.api.doneOnOk; editing.api.method = (g('#f-api-method') || 'POST'); editing.api.url = (g('#f-api-url') || '').trim(); editing.api.query = (g('#f-api-query') || '').trim(); editing.api.headers = (g('#f-api-headers') || '').trim(); editing.api.body = (g('#f-api-body') || '').trim(); editing.api.idPath = (g('#f-api-idpath') || '').trim(); } }
  async function uploadImage(e) {
    const file = e.target.files[0]; if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast('Image too big (max 2MB)'); return; }
    readFieldsFromDom(); syncSvcText();
    const dataUrl = await new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(file); });
    toast('Uploading...');
    const r = await api('/api/admin/upload', { dataUrl });
    if (r.ok) { editing.image = r.path; svcModal(); } else toast('Upload failed');
  }
  async function uploadGuideImage(e) {
    const file = e.target.files[0]; if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast('Image too big (max 2MB)'); return; }
    readFieldsFromDom(); syncSvcText();
    const dataUrl = await new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(file); });
    toast('Uploading...');
    const r = await api('/api/admin/upload', { dataUrl });
    if (r.ok) { editing.guideImg = r.path; svcModal(); } else toast('Upload failed');
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
  const optRow = (fi, oi, o) => `<div class="opt-row" data-opt="${fi}:${oi}"><input data-fo="${fi}:${oi}:label" placeholder="label e.g. ১৬ ঘণ্টা" value="${esc(o.label || '')}"><input data-fo="${fi}:${oi}:value" placeholder="API value" value="${esc(o.value || '')}" style="max-width:95px"><input data-fo="${fi}:${oi}:price" type="number" placeholder="price" value="${o.price != null ? o.price : ''}" style="max-width:75px"><button class="btn btn-bad btn-sm" data-del-opt="${fi}:${oi}">${icon('x')}</button><input data-fo="${fi}:${oi}:note" placeholder="small note (e.g. +8h · 1 credit)" value="${esc(o.note || '')}" style="flex:1 1 100%"></div>`;

  function readFieldsFromDom() {
    // sync editing.fields from inputs
    document.querySelectorAll('[data-ff]').forEach((el) => {
      const [i, pathRaw] = el.dataset.ff.split(':'); const path = pathRaw; const f = editing.fields[+i]; if (!f) return;
      let val = el.type === 'checkbox' ? el.checked : el.value;
      if (path === 'min' || path === 'max') val = el.value === '' ? null : Number(el.value);
      if (path === 'price') val = el.value === '' || Number(el.value) <= 0 ? undefined : Number(el.value);
      f[path] = val;
    });
    document.querySelectorAll('[data-fo]').forEach((el) => {
      const [fi, oi, key] = el.dataset.fo.split(':'); const f = editing.fields[+fi]; if (!f || !f.options || !f.options[+oi]) return;
      if (key === 'price') f.options[+oi].price = el.value === '' ? undefined : Number(el.value); else if (key === 'value') f.options[+oi].value = el.value.trim(); else if (key === 'note') f.options[+oi].note = el.value.trim(); else f.options[+oi].label = el.value;
    });
  }
  async function saveService() {
    readFieldsFromDom(); syncSvcText();
    const s = editing;
    if (!tl(s.name)) { toast('Name required'); return; }
    if (Array.isArray(s.variants)) {
      s.variants = s.variants.filter((x) => x && x.name).map((x) => { const { _open, ...rest } = x; rest.id = rest.id || 'v' + Math.random().toString(36).slice(2, 8); rest.pricing = { qtyKey: 'quantity', ...(rest.pricing || {}) }; return rest; });
      if (s.variants.some((x) => x.active !== false && x.pricing.mode !== 'fixed' && !(x.pricing.basePrice >= 0 && x.pricing.baseQty > 0))) { toast('Set base quantity & price for every sub-product'); return; }
    }
    s.fields = (s.fields || []).map((f) => { const lbl = tl(f.label); if (!f.key) f.key = (lbl || 'f').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'f' + Math.random().toString(36).slice(2, 5); if (f.type === 'select') f.options = (f.options || []).filter((o) => o.label); return f; });
    const list = S.services.slice(); const idx = list.findIndex((x) => x.id === s.id);
    if (idx >= 0) list[idx] = s; else list.push(s);
    const r = await api('/api/admin/services', { services: list });
    if (r.ok) { S.services = list; toast('Saved'); closeModal(); vServices(); } else toast('Error');
  }

  /* ---------- categories ---------- */
  async function saveCats(cats) { const r = await api('/api/admin/cats', { cats }); if (r.ok) { S.cats = cats; return true; } toast('Error'); return false; }
  function catModal(cat) {
    const isNew = !cat; const c0 = cat || { id: '', name: '' };
    modal(isNew ? 'Add category' : 'Edit category', `
      <div class="field"><label>Category name <span class="req">*</span></label><input id="c-name" value="${esc(tl(c0.name))}" placeholder="e.g. গেম টপ-আপ"></div>
      <div class="field"><label>ID / link (english) <span class="hint">(auto if empty)</span></label><input id="c-id" value="${esc(c0.id)}" placeholder="auto" ${isNew ? '' : 'readonly'}><div class="muted" style="font-size:11px;margin-top:4px">${isNew ? 'Used internally; cannot change later.' : 'ID cannot be changed.'}</div></div>`,
      `<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-ok" id="c-save">${icon('check')}${isNew ? 'Create' : 'Save'}</button>`);
    $('#c-save').addEventListener('click', async () => {
      const nm = $('#c-name').value.trim(); if (!nm) { toast('Enter a category name'); return; }
      const cats = S.cats.map((x) => ({ ...x }));
      if (!isNew) { const ex = cats.find((x) => x.id === c0.id); if (ex) ex.name = nm; }
      else { let id = ($('#c-id').value.trim() || nm.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')) || 'c' + Math.random().toString(36).slice(2, 6); while (cats.some((x) => x.id === id)) id += Math.random().toString(36).slice(2, 3); cats.push({ id, name: nm, order: cats.length }); }
      if (await saveCats(cats)) { toast(isNew ? 'Category added ✓' : 'Saved ✓'); closeModal(); vServices(); }
    });
  }

  /* ---------- users ---------- */
  let userFilter = '', allUsers = [];
  async function vUsers() {
    const c = $('#content'); c.innerHTML = '<div class="spin"></div>';
    const r = await api('/api/admin/users'); allUsers = r.items || [];
    renderUsers();
  }
  function renderUsers() {
    const match = (x) => userFilter === 'admin' ? x.role === 'admin' : userFilter === 'blocked' ? x.blocked : userFilter === 'user' ? (x.role !== 'admin' && !x.blocked) : true;
    const cnt = (k) => allUsers.filter((x) => k === 'admin' ? x.role === 'admin' : k === 'blocked' ? x.blocked : k === 'user' ? (x.role !== 'admin' && !x.blocked) : true).length;
    const items = allUsers.filter(match);
    const tabs = [['', 'All'], ['user', 'Users'], ['admin', 'Admins'], ['blocked', 'Blocked']];
    $('#content').innerHTML = `<div class="tabs">${tabs.map(([k, l]) => `<button data-uf="${k}" class="${userFilter === k ? 'on' : ''}">${l} <span class="count-i">${cnt(k)}</span></button>`).join('')}</div>
      <div class="card"><table class="tbl"><thead><tr><th>Name</th><th>Email / Phone</th><th>Balance</th><th>Role</th><th></th></tr></thead><tbody>
      ${items.length ? items.map((x) => `<tr><td><b>${esc(x.name)}</b> ${x.blocked ? '<span class="pill">blocked</span>' : ''}<div class="muted mono">${esc(x.ref)}</div></td><td class="mono">${x.email ? esc(x.email) : ''}${x.email && x.phone ? '<br>' : ''}${x.phone ? esc(x.phone) : ''}${!x.email && !x.phone ? '—' : ''}</td><td><b>${money(x.balance)}</b></td><td>${x.role === 'admin' ? '<span class="badge b-approved">admin</span>' : 'user'}</td>
        <td><button class="btn btn-ghost btn-sm" data-user='${esc(JSON.stringify(x))}'>${icon('edit')}Manage</button></td></tr>`).join('') : '<tr><td colspan="5" class="muted" style="padding:20px;text-align:center">No users</td></tr>'}
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
      ['home', 'Dashboard sections', [['hero', 'Promo banner slider'], ['notices', 'Notice board'], ['products', 'Products (category boxes)'], ['recent', 'Recent orders (LIVE)']]],
      ['menu', '3-dot menu items', [['orders', 'Order history'], ['referrals', 'Referrals'], ['profile', 'Profile']]],
      ['nav', 'Bottom navigation bar', [['orders', 'Orders'], ['addMoney', '+ Add money'], ['transactions', 'Transactions (money history)'], ['profile', 'Profile']]],
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
    S.logo = s.logo || ''; S.heroImg = s.heroImg || '';
    S.banners = (Array.isArray(s.banners) ? s.banners : []).map((b) => ({ img: (b && b.img) || '', link: (b && b.link) || '' })).filter((b) => b.img);
    S.secNames = r.apiSecretNames || [];
    const setTabs = [['general', 'eye', 'General'], ['banner', 'image', 'Banner'], ['contact', 'home', 'Contact'], ['rules', 'edit', 'Rules'], ['login', 'lock', 'Login'], ['api', 'cog', 'API keys']];
    c.innerHTML = `<div class="set-tabs">${setTabs.map(([k, ic, l]) => `<button data-settab="${k}" class="${(S.setTab || 'general') === k ? 'on' : ''}">${icon(ic)}<span>${l}</span></button>`).join('')}</div>
    <div class="card" data-sb="general"><div class="card-h">${icon('eye')}Website, SEO & Theme</div><div class="card-b">
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
    <div class="card" data-sb="banner" style="margin-top:16px"><div class="card-h">${icon('image')}Promo banners (home top slider)</div><div class="card-b">
      <div class="muted" style="font-size:12px;margin-bottom:10px">Wide banner images shown at the very top of the home page — like the big banner on top-up sites. Best ratio ~ 16:7 (e.g. 1200×525). Add several and they auto-slide. Max 8.</div>
      <div id="s-bnlist"></div>
      <button type="button" class="btn btn-ghost btn-sm" id="s-bnadd">${icon('plus')}Add banner image</button>
      <input type="file" id="s-bnfile" accept="image/*" style="display:none">
    </div></div>
    <div class="card" data-sb="general" style="margin-top:16px"><div class="card-h">${icon('cog')}General</div><div class="card-b">
      <div class="grid2"><div class="field"><label>Brand name A</label><input id="s-a" value="${esc(s.brandA || '')}"></div><div class="field"><label>Brand name B (colored)</label><input id="s-b" value="${esc(s.brandB || '')}"></div>
      <div class="field"><label>Tagline</label><input id="s-tbn" value="${esc(tl(s.tagline))}"></div><div></div>
      <div class="field"><label>Currency</label><input id="s-cur" value="${esc(s.currency || '৳')}" maxlength="3"></div><div class="field"><label>Min deposit (৳)</label><input id="s-min" type="number" value="${s.minDeposit || 20}"></div>
      <div class="field"><label>Referral bonus (৳)</label><input id="s-ref" type="number" value="${s.referralBonus || 0}"></div><div class="field"><label>WhatsApp (support)</label><input id="s-wa" value="${esc(s.whatsapp || '')}" placeholder="8801XXXXXXXXX"></div></div>
    </div></div>
    <div class="card" data-sb="login" style="margin-top:16px"><div class="card-h">${icon('lock')}Admin panel password</div><div class="card-b">
      <div class="muted" style="font-size:12px;margin-bottom:10px">Extra password asked when opening the admin panel (after login). ${r.adminPassSet ? '<b style="color:#16a34a">Currently ON</b>' : 'Currently <b>OFF</b>'} • min 4 characters.</div>
      <div class="field"><label>${r.adminPassSet ? 'New admin password' : 'Set admin password'}</label><input id="s-admpass" type="password" autocomplete="new-password" minlength="4" maxlength="100" placeholder="••••••"></div>
      <div class="flex"><button type="button" class="btn btn-sm" id="s-admset">${icon('check')}${r.adminPassSet ? 'Change password' : 'Set password'}</button>${r.adminPassSet ? `<button type="button" class="btn btn-bad btn-sm" id="s-admdel">${icon('trash')}Remove</button>` : ''}</div>
      ${r.adminPassSet ? '' : '<div class="muted" style="font-size:11px;margin-top:8px">Note: remember this password — if forgotten you will need to reset it from the server.</div>'}
    </div></div>
    <div class="card" data-sb="login" style="margin-top:16px"><div class="card-h">${icon('lock')}Google (Gmail) login</div><div class="card-b">
      <label class="flex" style="justify-content:space-between;margin-bottom:12px"><span>Enable "Sign in with Google" ${s.googleOn ? '<b style="color:#16a34a">ON</b>' : '<b>OFF</b>'}</span><input type="checkbox" id="s-gon" ${s.googleOn ? 'checked' : ''}></label>
      <div class="field"><label>Google Client ID</label><input id="s-gcid" maxlength="200" value="${esc(s.googleCID || '')}" placeholder="xxxxx.apps.googleusercontent.com"></div>
      <div class="field"><label>Google Client Secret ${r.googleSecretSet ? '<span style="color:#16a34a">(saved — blank = keep)</span>' : ''}</label><input id="s-gsec" type="password" autocomplete="new-password" maxlength="200" placeholder="${r.googleSecretSet ? '••••••••' : 'GOCSPX-...'}"></div>
      <div class="muted" style="font-size:12px">Create a Web OAuth client in <b>Google Cloud → Credentials</b>. Set the <b>Authorized redirect URI</b> to:<br><code style="user-select:all;word-break:break-all">${esc(location.origin)}/auth/google/callback</code><br>and <b>Authorized JavaScript origin</b> to <code>${esc(location.origin)}</code>. Then paste Client ID + Secret above and Save.</div>
    </div></div>
    <div class="card" data-sb="contact" style="margin-top:16px"><div class="card-h">${icon('home')}Footer & contact</div><div class="card-b">
      <div class="grid2">
        <div class="field"><label>Telegram (username or link)</label><input id="s-tg" maxlength="120" value="${esc(s.telegram || '')}" placeholder="@username or https://t.me/.."></div>
        <div class="field"><label>Telegram channel link</label><input id="s-tgc" maxlength="120" value="${esc(s.telegramCh || '')}" placeholder="https://t.me/yourchannel"></div>
        <div class="field"><label>Powered by (your name)</label><input id="s-pw" maxlength="60" value="${esc(s.poweredBy || '')}" placeholder="Rahat Wize"></div><div></div>
      </div>
      <div class="field"><label>Footer about (short brand line)</label><textarea id="s-fa" rows="3" maxlength="600" placeholder="e.g. Instant Free Fire top-up with AI bot, 24/7 service">${esc(s.footerAbout || '')}</textarea></div>
      <div class="field"><label>Privacy Policy</label><textarea id="s-priv" rows="5" maxlength="4000" placeholder="Shown as a link in the footer (leave blank to hide)">${esc(s.privacy || '')}</textarea></div>
      <div class="muted" style="font-size:12px">WhatsApp & contact buttons use the WhatsApp number from the General card below.</div>
    </div></div>
    <div class="card" data-sb="rules" style="margin-top:16px"><div class="card-h">${icon('edit')}Rules &amp; Regulations (Terms &amp; Conditions)</div><div class="card-b">
      <div class="field"><textarea id="s-rules" rows="6" maxlength="4000" placeholder="Write your rules / terms — shown at the bottom of the home page">${esc(s.rules || '')}</textarea></div>
      <div class="muted" style="font-size:12px">Appears at the bottom of the home dashboard, next to your brand logo. Leave blank to hide.</div>
    </div></div>
    <div class="card" data-sb="api" style="margin-top:16px"><div class="card-h">${icon('lock')}API keys (for product auto-delivery)</div><div class="card-b">
      <div class="muted" style="font-size:12px;margin-bottom:12px">Save provider API keys here (ffglory, SMM, etc.), then reference them in a product's Auto-delivery as <code>{{NAME}}</code>. Stored securely, never sent to customers.</div>
      <div id="sec-list"></div>
      <div class="grid2"><div class="field"><label>Key name</label><input id="sec-name" maxlength="40" placeholder="FFGLORY_KEY"></div>
        <div class="field"><label>Value (secret)</label><input id="sec-val" type="password" autocomplete="new-password" maxlength="500" placeholder="paste the key"></div></div>
      <button type="button" class="btn btn-sm" id="sec-add">${icon('plus')}Save key</button>
    </div></div>
    <div style="margin-top:16px"><button class="btn btn-ok" id="s-save">${icon('check')}Save settings</button></div>`;
    const renderSecrets = () => { const box = $('#sec-list'); if (!box) return; box.innerHTML = (S.secNames && S.secNames.length) ? S.secNames.map((nm) => `<div class="flex" style="justify-content:space-between;background:#f3f6f5;border:1px solid var(--line);border-radius:10px;padding:9px 12px;margin-bottom:8px"><b class="mono">${esc(nm)}</b><button type="button" class="ib ib-bad" data-sec-del="${esc(nm)}" title="Remove">${icon('trash')}</button></div>`).join('') : '<div class="muted" style="font-size:12px;margin-bottom:10px">No keys saved yet.</div>';
      box.querySelectorAll('[data-sec-del]').forEach((bb) => bb.addEventListener('click', async () => { if (!confirm('Remove key ' + bb.dataset.secDel + '?')) return; const rr = await api('/api/admin/secret', { name: bb.dataset.secDel, remove: true }); if (rr.ok) { S.secNames = rr.names || []; renderSecrets(); toast('Removed'); } else toast('Error'); })); };
    renderSecrets();
    $('#sec-add').addEventListener('click', async () => { const nm = ($('#sec-name').value || '').trim().replace(/[^A-Za-z0-9_]/g, ''); const vl = $('#sec-val').value; if (!nm) { toast('Enter a key name'); return; } if (!vl) { toast('Enter the value'); return; } const rr = await api('/api/admin/secret', { name: nm, value: vl }); if (rr.ok) { S.secNames = rr.names || []; $('#sec-name').value = ''; $('#sec-val').value = ''; renderSecrets(); toast('Key saved ✓'); } else toast('Error'); });
    const applySetTab = () => { const sec = S.setTab || 'general'; document.querySelectorAll('.set-tabs [data-settab]').forEach((bb) => bb.classList.toggle('on', bb.dataset.settab === sec)); document.querySelectorAll('#content [data-sb]').forEach((cd) => { cd.style.display = cd.dataset.sb === sec ? '' : 'none'; }); };
    document.querySelectorAll('.set-tabs [data-settab]').forEach((bb) => bb.addEventListener('click', () => { S.setTab = bb.dataset.settab; applySetTab(); const m = $('#content'); if (m) m.scrollTop = 0; window.scrollTo(0, 0); }));
    applySetTab();
    $('#s-save').addEventListener('click', saveSettings);
    $('#s-admset').addEventListener('click', async () => { const p = $('#s-admpass').value; if (p.length < 4) { toast('Min 4 characters'); return; } const rr = await api('/api/admin/setpass', { pass: p }); if (rr.ok) { toast('Admin password saved ✓'); vSettings(); } else toast(rr.error === 'short' ? 'Min 4 characters' : 'Error'); });
    { const admdel = $('#s-admdel'); if (admdel) admdel.addEventListener('click', async () => { if (!confirm('Remove the admin panel password?')) return; const rr = await api('/api/admin/setpass', { pass: '' }); if (rr.ok) { toast('Password removed'); vSettings(); } else toast('Error'); }); }
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
    renderBanners();
    $('#s-bnadd').addEventListener('click', () => $('#s-bnfile').click());
    $('#s-bnfile').addEventListener('change', async (e) => {
      const file = e.target.files[0]; if (!file) return; e.target.value = '';
      if (file.size > 2 * 1024 * 1024) { toast('Image too big (max 2MB)'); return; }
      if (S.banners.length >= 8) { toast('Max 8 banners'); return; }
      const dataUrl = await new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(file); });
      toast('Uploading...'); const up = await api('/api/admin/upload', { dataUrl });
      if (up.ok) { S.banners.push({ img: up.path, link: '' }); renderBanners(); toast('Banner added — press Save'); } else toast('Upload failed');
    });
  }
  function renderBanners() {
    const box = $('#s-bnlist'); if (!box) return;
    box.innerHTML = S.banners.length ? S.banners.map((b, i) => `<div class="bn-row">
      <div class="bn-prev"><img src="${esc(b.img)}" alt=""></div>
      <input data-bn-link="${i}" value="${esc(b.link || '')}" maxlength="120" placeholder="Link on tap (optional) — e.g. service/ff-diamond or deposit">
      <button type="button" class="ib" data-bn-up="${i}" title="Up">${icon('up')}</button>
      <button type="button" class="ib" data-bn-down="${i}" title="Down">${icon('down')}</button>
      <button type="button" class="ib ib-bad" data-bn-del="${i}" title="Remove">${icon('trash')}</button>
    </div>`).join('') : `<div class="muted" style="font-size:12px;margin-bottom:10px">No banners yet — add one below.</div>`;
    box.querySelectorAll('[data-bn-link]').forEach((inp) => inp.addEventListener('input', (e) => { S.banners[+e.target.dataset.bnLink].link = e.target.value; }));
    box.querySelectorAll('[data-bn-del]').forEach((btn) => btn.addEventListener('click', () => { S.banners.splice(+btn.dataset.bnDel, 1); renderBanners(); }));
    box.querySelectorAll('[data-bn-up]').forEach((btn) => btn.addEventListener('click', () => { const i = +btn.dataset.bnUp; if (i > 0) { [S.banners[i - 1], S.banners[i]] = [S.banners[i], S.banners[i - 1]]; renderBanners(); } }));
    box.querySelectorAll('[data-bn-down]').forEach((btn) => btn.addEventListener('click', () => { const i = +btn.dataset.bnDown; if (i < S.banners.length - 1) { [S.banners[i + 1], S.banners[i]] = [S.banners[i], S.banners[i + 1]]; renderBanners(); } }));
  }
  async function saveSettings() {
    const settings = { banners: S.banners || [], seoTitle: $('#s-seot').value.trim(), seoDesc: $('#s-seod').value.trim(), logo: S.logo || '', themeColor: $('#s-theme').value, brandA: $('#s-a').value.trim(), brandB: $('#s-b').value.trim(), tagline: $('#s-tbn').value.trim(), currency: $('#s-cur').value.trim() || '৳', minDeposit: Number($('#s-min').value) || 20, referralBonus: Number($('#s-ref').value) || 0, whatsapp: $('#s-wa').value.replace(/[^0-9]/g, ''), googleOn: $('#s-gon') ? $('#s-gon').checked : false, googleCID: $('#s-gcid') ? $('#s-gcid').value.trim() : '' };
    { const gsec = $('#s-gsec') ? $('#s-gsec').value : ''; if (gsec) settings.googleSecret = gsec; }
    if ($('#s-rules')) settings.rules = $('#s-rules').value;
    if ($('#s-tg')) settings.telegram = $('#s-tg').value.trim();
    if ($('#s-tgc')) settings.telegramCh = $('#s-tgc').value.trim();
    if ($('#s-pw')) settings.poweredBy = $('#s-pw').value.trim();
    if ($('#s-fa')) settings.footerAbout = $('#s-fa').value;
    if ($('#s-priv')) settings.privacy = $('#s-priv').value;
    const r = await api('/api/admin/settings', { settings }); if (r.ok) toast('Saved ✓'); else toast('Error');
  }

  /* ---------- payment methods (multiple receiving numbers per method, matched by amount) ---------- */
  let pmMethods = [];
  async function vPayments() {
    const c = $('#content'); c.innerHTML = '<div class="spin"></div>';
    const r = await api('/api/admin/settings'); pmMethods = JSON.parse(JSON.stringify((r.settings || {}).depositMethods || []));
    renderPayments();
  }
  function renderPayments() {
    const c = $('#content');
    c.innerHTML = `<div class="flex" style="margin-bottom:14px"><button class="btn" data-act="add-pm">${icon('plus')}Add payment method</button><span class="muted">${pmMethods.length} methods</span></div>
      <div id="pm-list">${pmMethods.map(pmCard).join('') || '<div class="empty">No payment methods yet</div>'}</div>
      <div style="margin-top:16px"><button class="btn btn-ok" id="pm-save">${icon('check')}Save payment methods</button></div>`;
    $('#pm-save').addEventListener('click', savePayments);
  }
  function pmCard(m, mi) {
    const nums = m.numbers || [];
    const activeCount = nums.filter((n) => n.active !== false && !n.hidden).length;
    return `<div class="pm-card${m._open ? ' open' : ''}">
      <div class="pm-head" data-pm-toggle="${mi}">
        <span class="pm-dot" style="background:${esc(m.color || '#0f766e')}"></span>
        <b>${esc(m.label || 'Unnamed')}</b>
        <span class="pill">${nums.length} number${nums.length === 1 ? '' : 's'}</span>
        ${m.active === false ? '<span class="pill" style="background:#fee2e2;color:#b91c1c">off</span>' : activeCount === 0 ? '<span class="pill" style="background:#fef3c7;color:#b45309">no active number</span>' : ''}
        <span style="margin-left:auto"></span>
        <button type="button" class="ib" data-del-pm="${mi}">${icon('trash')}</button>
        <button type="button" class="ib pm-chev">${icon('back')}</button>
      </div>
      <div class="pm-body" ${m._open ? '' : 'hidden'}>
        <div class="grid2">
          <div class="field"><label>Method name</label><input data-pmf="${mi}:label" value="${esc(m.label || '')}" placeholder="e.g. Rocket, Binance Pay"></div>
          <div class="field"><label>Color</label><input type="color" data-pmf="${mi}:color" value="${esc(m.color || '#0f766e')}" style="height:42px;padding:3px"></div>
        </div>
        <label class="flex" style="gap:6px;margin-bottom:12px"><input type="checkbox" data-pmf="${mi}:active" ${m.active !== false ? 'checked' : ''} style="width:auto"> Method is active (shown to customers)</label>
        <div class="muted" style="font-size:12px;margin-bottom:8px">Each number can serve a different amount range. The customer gets whichever active number matches the amount they type.</div>
        <div id="pm-nums-${mi}">${nums.map((n, ni) => pmNumRow(mi, ni, n)).join('')}</div>
        <button type="button" class="btn btn-ghost btn-sm" data-add-pn="${mi}">${icon('plus')}Add number</button>
      </div>
    </div>`;
  }
  const pmNumRow = (mi, ni, n) => {
    const vis = n.active !== false && !n.hidden;
    const rng = `৳${n.min || 0}–${n.max != null ? n.max : '∞'}`;
    return `<div class="pm-num-c">
      <div class="pm-num-main">
        <div class="pm-num-top"><b>${esc(n.number || '(no number)')}</b>${vis ? '' : '<span class="pm-tag off">hidden</span>'}</div>
        <div class="pm-num-sub">${esc(n.type || 'Personal')}${n.label ? ' · ' + esc(n.label) : ''} · ${rng}</div>
      </div>
      <button type="button" class="ib" data-edit-pn="${mi}:${ni}" aria-label="Edit">${icon('edit')}</button>
      <button type="button" class="ib" data-del-pn="${mi}:${ni}" aria-label="Delete">${icon('trash')}</button>
    </div>`;
  };
  function numberModal(mi, ni) {
    const m = pmMethods[mi]; if (!m) return;
    const isNew = ni == null || ni < 0;
    const n = isNew ? { label: '', number: '', type: 'Personal', min: 0, max: null, active: true, hidden: false } : m.numbers[ni];
    const types = [['Personal', 'Personal — Send Money'], ['Agent', 'Agent — Cash Out'], ['Merchant', 'Merchant — Payment']];
    modal(`${isNew ? 'Add' : 'Edit'} number`, `
      <div style="margin:-4px 0 14px;color:${esc(m.color || '#0f766e')};font-weight:800">${esc(m.label || '')}</div>
      <label class="flex" style="justify-content:space-between;gap:8px;background:#f8fafc;border:1px solid var(--line);border-radius:12px;padding:12px 14px;margin-bottom:14px"><b>Visible to customers</b><input type="checkbox" id="nm-vis" ${(n.active !== false && !n.hidden) ? 'checked' : ''} style="width:auto"></label>
      <div class="field"><label>Account type</label><select id="nm-type">${types.map(([v, tl2]) => `<option value="${v}" ${n.type === v ? 'selected' : ''}>${tl2}</option>`).join('')}</select></div>
      <div class="field"><label>Label (optional)</label><input id="nm-label" value="${esc(n.label || '')}" placeholder="e.g. Personal" maxlength="30"></div>
      <div class="field"><label>Number</label><input id="nm-number" value="${esc(n.number || '')}" placeholder="01XXXXXXXXX" inputmode="numeric" maxlength="20"></div>
      <div class="grid2"><div class="field"><label>From (৳)</label><input id="nm-min" type="number" min="0" value="${n.min || 0}"></div><div class="field"><label>To (৳, empty = no limit)</label><input id="nm-max" type="number" min="0" value="${n.max != null ? n.max : ''}"></div></div>
      <div class="muted" style="font-size:11.5px">Below From or above To, this number is hidden for that amount — the customer uses another one.</div>
    `, `<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-ok" id="nm-save">${icon('check')}${isNew ? 'Add' : 'Save'}</button>`);
    $('#nm-save').addEventListener('click', () => {
      const vis = $('#nm-vis').checked;
      const num = { label: $('#nm-label').value.trim(), number: $('#nm-number').value.trim(), type: $('#nm-type').value, min: Number($('#nm-min').value) || 0, max: $('#nm-max').value === '' ? null : Number($('#nm-max').value), active: true, hidden: !vis };
      if (!num.number) { toast('Enter a number'); return; }
      m.numbers = m.numbers || [];
      if (isNew) m.numbers.push(num); else m.numbers[ni] = num;
      m._open = true; closeModal(); savePayments();
    });
  }
  function readPaymentsFromDom() {
    document.querySelectorAll('[data-pmf]').forEach((el) => { const [mi, k] = el.dataset.pmf.split(':'); const m = pmMethods[+mi]; if (!m) return; m[k] = el.type === 'checkbox' ? el.checked : el.value; });
    document.querySelectorAll('[data-pnf]').forEach((el) => {
      const [mi, ni, k] = el.dataset.pnf.split(':'); const n = (pmMethods[+mi] || {}).numbers && pmMethods[+mi].numbers[+ni]; if (!n) return;
      if (k === 'min') n.min = el.value === '' ? 0 : Number(el.value);
      else if (k === 'max') n.max = el.value === '' ? null : Number(el.value);
      else n[k] = el.type === 'checkbox' ? el.checked : el.value;
    });
  }
  async function savePayments() {
    readPaymentsFromDom();
    const depositMethods = pmMethods.map((m) => ({ label: m.label, color: m.color, active: m.active !== false, numbers: (m.numbers || []).map((n) => ({ label: n.label, number: n.number, type: n.type, min: n.min, max: n.max, active: n.active !== false, hidden: !!n.hidden })) }));
    const r = await api('/api/admin/settings', { settings: { depositMethods } });
    if (r.ok) { toast('Saved ✓'); renderPayments(); } else toast('Error');
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
    const uf = e.target.closest('[data-uf]'); if (uf) { userFilter = uf.dataset.uf; renderUsers(); return; }
    const ov = e.target.closest('[data-oview]'); if (ov) { try { orderModal(JSON.parse(ov.dataset.oview)); } catch (x) {} return; }
    const dok = e.target.closest('[data-dep-ok]'); if (dok) { if (confirm('Approve this deposit and add balance?')) { const r = await api('/api/admin/deposit', { key: dok.dataset.depOk, status: 'approved' }); if (r.ok) { toast('Approved'); vDeposits(); loadCounts(); } } return; }
    const dno = e.target.closest('[data-dep-no]'); if (dno) { if (confirm('Reject this deposit?')) { const r = await api('/api/admin/deposit', { key: dno.dataset.depNo, status: 'rejected' }); if (r.ok) { toast('Rejected'); vDeposits(); loadCounts(); } } return; }
    if (e.target.closest('[data-act="new-svc"]')) { newService(); return; }
    const addProd = e.target.closest('[data-add-prod]'); if (addProd) { newService(addProd.dataset.addProd === '__none' ? '' : addProd.dataset.addProd); return; }
    if (e.target.closest('[data-act="new-cat"]')) { catModal(null); return; }
    const editCat = e.target.closest('[data-edit-cat]'); if (editCat) { const cat = S.cats.find((x) => x.id === editCat.dataset.editCat); if (cat) catModal(cat); return; }
    const delCat = e.target.closest('[data-del-cat]'); if (delCat) { const id = delCat.dataset.delCat; const has = S.services.some((s) => (s.cat || '') === id); if (confirm(has ? 'Delete this category? Its products will move to Uncategorized.' : 'Delete this category?')) { const cats = S.cats.filter((x) => x.id !== id); if (await saveCats(cats)) { toast('Category deleted'); vServices(); } } return; }
    const moveCat = e.target.closest('[data-move-cat]'); if (moveCat) { const [id, dir] = moveCat.dataset.moveCat.split(':'); const cats = S.cats.slice().sort((a, b) => (a.order || 0) - (b.order || 0)); const idx = cats.findIndex((x) => x.id === id); const sw = dir === 'up' ? idx - 1 : idx + 1; if (idx < 0 || sw < 0 || sw >= cats.length) return; cats.forEach((x, i) => { x.order = i; }); const t = cats[idx].order; cats[idx].order = cats[sw].order; cats[sw].order = t; if (await saveCats(cats)) { toast('Moved'); vServices(); } return; }
    const catTog = e.target.closest('[data-cat-toggle]'); if (catTog) { const id = catTog.dataset.catToggle; catOpen[id] = catOpen[id] === false; renderServiceTree(); return; }
    const toggleSvc = e.target.closest('[data-toggle-svc]'); if (toggleSvc) { const s = S.services.find((x) => x.id === toggleSvc.dataset.toggleSvc); if (s) { s.active = toggleSvc.checked; await saveServiceList(S.services); } return; }
    const moveSvc = e.target.closest('[data-move-svc]'); if (moveSvc) {
      const [id, dir] = moveSvc.dataset.moveSvc.split(':'); const s = S.services.find((x) => x.id === id); if (!s) return;
      const siblings = S.services.filter((x) => (x.cat || '') === (s.cat || '')).sort((a, b) => (a.order || 0) - (b.order || 0));
      const idx = siblings.indexOf(s); const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= siblings.length) return;
      siblings.forEach((x, i) => { x.order = i; }); const tmp = siblings[idx].order; siblings[idx].order = siblings[swapIdx].order; siblings[swapIdx].order = tmp;
      await saveServiceList(S.services); renderServiceTree(); return;
    }
    const es = e.target.closest('[data-edit-svc]'); if (es) { editService(es.dataset.editSvc); return; }
    const ds = e.target.closest('[data-del-svc]'); if (ds) { if (confirm('Delete this product?')) { const list = S.services.filter((x) => x.id !== ds.dataset.delSvc); if (await saveServiceList(list)) { toast('Deleted'); renderServiceTree(); } } return; }
    const ptog = e.target.closest('[data-prod-tog]'); if (ptog) { varOpen[ptog.dataset.prodTog] = !varOpen[ptog.dataset.prodTog]; vServices(); return; }
    const mvar = e.target.closest('[data-move-var]'); if (mvar) { const [vs, vi, dir] = mvar.dataset.moveVar.split(':'); const sp = S.services.find((x) => x.id === vs); if (sp && sp.variants) { const a = sp.variants, j = +vi, k = dir === 'up' ? j - 1 : j + 1; if (k >= 0 && k < a.length) { [a[j], a[k]] = [a[k], a[j]]; varOpen[vs] = true; saveServiceList(S.services).then((ok) => { if (ok) vServices(); }); } } return; }
    const avar = e.target.closest('[data-add-var2]'); if (avar) { variantModal(avar.dataset.addVar2, -1); return; }
    const evar = e.target.closest('[data-edit-var2]'); if (evar) { const [vs, vi] = evar.dataset.editVar2.split(':'); variantModal(vs, +vi); return; }
    const dvar = e.target.closest('[data-del-var2]'); if (dvar) { const [vs, vi] = dvar.dataset.delVar2.split(':'); if (!confirm('Delete this sub-product?')) return; const sp = S.services.find((x) => x.id === vs); if (sp && sp.variants) { sp.variants.splice(+vi, 1); saveServiceList(S.services).then((ok) => { if (ok) { toast('Deleted'); vServices(); } }); } return; }
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
    const user = e.target.closest('[data-user]'); if (user) { try { userModal(JSON.parse(user.dataset.user)); } catch (x) {} return; }
    if (e.target.closest('[data-act="add-notice"]')) { saveNotices(); notices.unshift({ id: 'n' + Date.now(), type: 'info', ts: Date.now(), title: '', body: '' }); const nl = $('#nlist'); if (nl) nl.innerHTML = renderNotices(); saveNoticesToServer(); return; }
    const delN = e.target.closest('[data-del-notice]'); if (delN) { saveNotices(); notices.splice(+delN.dataset.delNotice, 1); $('#nlist').innerHTML = renderNotices(); saveNoticesToServer(); return; }
    const delPm = e.target.closest('[data-del-pm]'); if (delPm) { readPaymentsFromDom(); if (confirm('Delete this payment method?')) { pmMethods.splice(+delPm.dataset.delPm, 1); renderPayments(); } return; }
    const addPn = e.target.closest('[data-add-pn]'); if (addPn) { readPaymentsFromDom(); numberModal(+addPn.dataset.addPn, -1); return; }
    const editPn = e.target.closest('[data-edit-pn]'); if (editPn) { readPaymentsFromDom(); const [emi, eni] = editPn.dataset.editPn.split(':'); if (pmMethods[+emi]) pmMethods[+emi]._open = true; numberModal(+emi, +eni); return; }
    const delPn = e.target.closest('[data-del-pn]'); if (delPn) { readPaymentsFromDom(); const [mi, ni] = delPn.dataset.delPn.split(':'); if (!confirm('Delete this number?')) return; pmMethods[+mi].numbers.splice(+ni, 1); pmMethods[+mi]._open = true; savePayments(); return; }
    if (e.target.closest('[data-act="add-pm"]')) { readPaymentsFromDom(); pmMethods.push({ label: '', color: '#0f766e', active: true, numbers: [], _open: true }); renderPayments(); return; }
    const pmTog = e.target.closest('[data-pm-toggle]'); if (pmTog) { readPaymentsFromDom(); const m = pmMethods[+pmTog.dataset.pmToggle]; m._open = !m._open; renderPayments(); return; }
  });
  // notices auto-save on blur
  document.addEventListener('blur', (e) => { if (e.target.closest && e.target.closest('[data-nf]')) saveNoticesToServer(); }, true);
  async function saveNoticesToServer() { saveNotices(); await api('/api/admin/notices', { notices }); }

  boot();
})();
