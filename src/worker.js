import APP_HTML from './client/app.html';
import APP_CSS from './client/app.css';
import APP_JS from './client/app.client.js';
import ADMIN_HTML from './client/admin.html';
import ADMIN_CSS from './client/admin.css';
import ADMIN_JS from './client/admin.client.js';
import { DEFAULT_SETTINGS, DEFAULT_CATS, DEFAULT_SERVICES, DEFAULT_NOTICES } from './data.js';

const enc = new TextEncoder();
const PBKDF2_ITER = 100000;
const SESSION_DAYS = 30;

/* ---------------- small helpers ---------------- */
const VERSION = (() => {
  let h = 2166136261;
  const s = APP_JS + APP_CSS + ADMIN_JS + ADMIN_CSS;
  for (let i = 0; i < s.length; i += 5) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36);
})();

const BASE_HEADERS = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'strict-transport-security': 'max-age=31536000; includeSubDomains',
};

const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...BASE_HEADERS, ...headers } });
const text = (body, type, cache, status = 200, extra = {}) =>
  new Response(body, { status, headers: { 'content-type': type, 'cache-control': cache, ...BASE_HEADERS, ...extra } });

const clip = (v, n) => String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, n);
const toNum = (v) => { const n = Number(v); return Number.isFinite(n) ? n : NaN; };
const rid = (n = 10) => { const a = new Uint8Array(n); crypto.getRandomValues(a); return [...a].map((x) => 'abcdefghijklmnopqrstuvwxyz0123456789'[x % 36]).join(''); };
const now = () => Date.now();
const sortKey = (ts) => String(9e15 - ts).padStart(16, '0') + ':' + rid(4);
const PHONE_RE = /^01[0-9]{9}$/;

async function pbkdf2(pw, salt, iter) {
  const key = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salt), iterations: iter }, key, 256);
  return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
async function sha(v) {
  const b = await crypto.subtle.digest('SHA-256', enc.encode(v));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
}

/* ---------------- data access ---------------- */
async function getSettings(env) {
  const s = (await env.DATA.get('settings', 'json')) || {};
  return { ...DEFAULT_SETTINGS, ...s, tagline: { ...DEFAULT_SETTINGS.tagline, ...(s.tagline || {}) },
    depositMethods: Array.isArray(s.depositMethods) ? s.depositMethods : DEFAULT_SETTINGS.depositMethods };
}
async function getServices(env) {
  const s = await env.DATA.get('services', 'json');
  return Array.isArray(s) ? s : DEFAULT_SERVICES;
}
async function getCats(env) {
  const c = await env.DATA.get('cats', 'json');
  return Array.isArray(c) ? c : DEFAULT_CATS;
}
async function getNotices(env) {
  const n = await env.DATA.get('notices', 'json');
  return Array.isArray(n) ? n : DEFAULT_NOTICES;
}

/* ---------------- auth ---------------- */
function cookie(name, val, days, secure) {
  const p = [`${name}=${val}`, 'Path=/', 'HttpOnly', 'SameSite=Lax'];
  if (secure) p.push('Secure');
  p.push(days ? `Max-Age=${days * 86400}` : 'Max-Age=0');
  return p.join('; ');
}
async function userFromReq(req, env) {
  const m = (req.headers.get('cookie') || '').match(/(?:^|;\s*)sid=([a-z0-9]+)/);
  if (!m) return null;
  const sess = await env.DATA.get('sess:' + m[1], 'json');
  if (!sess) return null;
  const u = await env.DATA.get('u:' + sess.uid, 'json');
  if (!u || u.blocked) return null;
  u._token = m[1];
  return u;
}
const pubUser = (u) => ({ id: u.id, name: u.name, phone: u.phone, balance: u.balance || 0, role: u.role || 'user', ref: u.ref, ts: u.ts });

async function handleAuth(req, env, url, path, secure) {
  const ip = req.headers.get('cf-connecting-ip') || 'x';
  if (path === '/api/auth/register' && req.method === 'POST') {
    let b; try { b = await req.json(); } catch { return json({ ok: false, error: 'bad' }, 400); }
    const name = clip(b.name, 60), phone = clip(b.phone, 14), pw = String(b.password || '');
    if (!name || !PHONE_RE.test(phone) || pw.length < 6 || pw.length > 100) return json({ ok: false, error: 'invalid' }, 400);
    // rate limit registrations per IP
    const rk = 'rl:reg:' + (await sha(ip)); const rn = +((await env.DATA.get(rk)) || 0);
    if (rn >= 20) return json({ ok: false, error: 'too_many' }, 429);
    await env.DATA.put(rk, String(rn + 1), { expirationTtl: 3600 });
    if (await env.DATA.get('phone:' + phone)) return json({ ok: false, error: 'exists' }, 409);
    const anyUser = (await env.DATA.list({ prefix: 'u:', limit: 1 })).keys.length > 0;
    const salt = rid(16);
    const u = { id: rid(12), name, phone, salt, iter: PBKDF2_ITER, hash: await pbkdf2(pw, salt, PBKDF2_ITER),
      balance: 0, role: anyUser ? 'user' : 'admin', ref: rid(6).toUpperCase(), refBy: clip(b.ref, 10).toUpperCase() || '', ts: now() };
    await env.DATA.put('u:' + u.id, JSON.stringify(u));
    await env.DATA.put('phone:' + phone, u.id);
    if (u.ref) await env.DATA.put('ref:' + u.ref, u.id);
    const tok = rid(28);
    await env.DATA.put('sess:' + tok, JSON.stringify({ uid: u.id, ts: now() }), { expirationTtl: SESSION_DAYS * 86400 });
    return json({ ok: true, user: pubUser(u) }, 200, { 'set-cookie': cookie('sid', tok, SESSION_DAYS, secure) });
  }
  if (path === '/api/auth/login' && req.method === 'POST') {
    let b; try { b = await req.json(); } catch { return json({ ok: false, error: 'bad' }, 400); }
    const phone = clip(b.phone, 14), pw = String(b.password || '');
    const rk = 'rl:login:' + (await sha(ip)); const rn = +((await env.DATA.get(rk)) || 0);
    if (rn >= 15) return json({ ok: false, error: 'too_many' }, 429);
    const uid = await env.DATA.get('phone:' + phone);
    const u = uid ? await env.DATA.get('u:' + uid, 'json') : null;
    const ok = u && !u.blocked && (await pbkdf2(pw, u.salt, u.iter || PBKDF2_ITER)) === u.hash;
    if (!ok) { await env.DATA.put(rk, String(rn + 1), { expirationTtl: 900 }); await new Promise((r) => setTimeout(r, 400)); return json({ ok: false, error: 'wrong' }, 401); }
    const tok = rid(28);
    await env.DATA.put('sess:' + tok, JSON.stringify({ uid: u.id, ts: now() }), { expirationTtl: SESSION_DAYS * 86400 });
    return json({ ok: true, user: pubUser(u) }, 200, { 'set-cookie': cookie('sid', tok, SESSION_DAYS, secure) });
  }
  if (path === '/api/auth/logout' && req.method === 'POST') {
    const m = (req.headers.get('cookie') || '').match(/(?:^|;\s*)sid=([a-z0-9]+)/);
    if (m) await env.DATA.delete('sess:' + m[1]);
    return json({ ok: true }, 200, { 'set-cookie': cookie('sid', '', 0, secure) });
  }
  return json({ ok: false, error: 'not_found' }, 404);
}

/* ---------------- order amount ---------------- */
function computeOrder(svc, fields) {
  let amount = +svc.price || 0;
  const clean = {};
  for (const f of svc.fields || []) {
    const v = fields[f.key];
    if (v == null || v === '') { if (f.required) return { error: f.key }; clean[f.key] = ''; continue; }
    if (f.type === 'select') {
      const opt = (f.options || []).find((o) => o.label === v);
      if (!opt) return { error: f.key };
      clean[f.key] = opt.label;
      if (typeof opt.price === 'number') amount += opt.price;
    } else if (f.type === 'number') {
      const n = toNum(v);
      if (!Number.isFinite(n)) return { error: f.key };
      if (f.min != null && n < f.min) return { error: f.key };
      if (f.max != null && n > f.max) return { error: f.key };
      clean[f.key] = n;
      if (f.priceFromValue) amount += n;
    } else if (f.type === 'phone') {
      const p = clip(v, 14); if (!PHONE_RE.test(p)) return { error: f.key };
      clean[f.key] = p;
    } else {
      clean[f.key] = clip(v, 500);
    }
  }
  return { amount: Math.round(amount), clean };
}

/* ---------------- customer APIs ---------------- */
async function handleApi(req, env, url, path, u, secure) {
  const settings = await getSettings(env);

  if (path === '/api/me') return json({ ok: true, user: u ? pubUser(u) : null, settings: pubSettings(settings) });

  if (path === '/api/home') {
    const [services, cats, notices] = await Promise.all([getServices(env), getCats(env), getNotices(env)]);
    const live = (await env.DATA.list({ prefix: 'o:', limit: 12 })).keys.map((k) => k.metadata).filter(Boolean);
    return json({ ok: true, user: u ? pubUser(u) : null, settings: pubSettings(settings),
      services: services.filter((s) => s.active), cats, notices, live });
  }

  if (!u) return json({ ok: false, error: 'auth' }, 401);

  if (path === '/api/order' && req.method === 'POST') {
    let b; try { b = await req.json(); } catch { return json({ ok: false, error: 'bad' }, 400); }
    const services = await getServices(env);
    const svc = services.find((s) => s.id === clip(b.svcId, 40) && s.active);
    if (!svc) return json({ ok: false, error: 'service' }, 404);
    const r = computeOrder(svc, b.fields || {});
    if (r.error) return json({ ok: false, error: 'field', field: r.error }, 400);
    if (r.amount <= 0) return json({ ok: false, error: 'amount' }, 400);
    // re-read the user fresh to avoid stale balance
    const fresh = await env.DATA.get('u:' + u.id, 'json');
    if ((fresh.balance || 0) < r.amount) return json({ ok: false, error: 'balance', need: r.amount, have: fresh.balance || 0 }, 400);
    fresh.balance = Math.round((fresh.balance || 0) - r.amount);
    const ts = now(), id = 'WF' + String(ts).slice(-8) + rid(3).toUpperCase();
    const order = { id, uid: u.id, uname: u.name, svcId: svc.id, svcName: svc.name, cat: svc.cat, fields: r.clean, amount: r.amount, status: 'pending', note: '', ts };
    const key = 'o:' + sortKey(ts);
    await env.DATA.put('u:' + u.id, JSON.stringify(fresh));
    await env.DATA.put(key, JSON.stringify(order), { metadata: { id, uid: u.id, status: 'pending', ts, n: svc.name, un: maskName(u.name), amt: r.amount, cat: svc.cat } });
    const ul = (await env.DATA.get('uo:' + u.id, 'json')) || [];
    ul.unshift({ key, id, status: 'pending', ts, svcName: svc.name, amount: r.amount });
    await env.DATA.put('uo:' + u.id, JSON.stringify(ul.slice(0, 100)));
    await bumpStat(env, 'orders');
    return json({ ok: true, order: { id, amount: r.amount, status: 'pending' }, balance: fresh.balance });
  }

  if (path === '/api/orders') {
    const ul = (await env.DATA.get('uo:' + u.id, 'json')) || [];
    const items = await Promise.all(ul.slice(0, 50).map(async (o) => {
      const full = await env.DATA.get(o.key, 'json');
      return full || o;
    }));
    return json({ ok: true, items: items.filter(Boolean) });
  }

  if (path === '/api/deposit' && req.method === 'POST') {
    let b; try { b = await req.json(); } catch { return json({ ok: false, error: 'bad' }, 400); }
    const method = clip(b.method, 20), sender = clip(b.sender, 14), trxid = clip(b.trxid, 40), amount = Math.round(toNum(b.amount));
    if (!method || !PHONE_RE.test(sender) || trxid.length < 4 || !(amount >= (settings.minDeposit || 20) && amount <= 100000))
      return json({ ok: false, error: 'invalid' }, 400);
    const ts = now(), id = 'DP' + String(ts).slice(-8) + rid(2).toUpperCase();
    const dep = { id, uid: u.id, uname: u.name, method, sender, trxid, amount, status: 'pending', ts };
    const key = 'dep:' + sortKey(ts);
    await env.DATA.put(key, JSON.stringify(dep), { metadata: { id, uid: u.id, status: 'pending', ts, amt: amount, un: maskName(u.name), method } });
    const dl = (await env.DATA.get('udep:' + u.id, 'json')) || [];
    dl.unshift({ key, id, status: 'pending', ts, amount, method });
    await env.DATA.put('udep:' + u.id, JSON.stringify(dl.slice(0, 50)));
    return json({ ok: true, deposit: { id, status: 'pending', amount } });
  }

  if (path === '/api/deposits') {
    const dl = (await env.DATA.get('udep:' + u.id, 'json')) || [];
    return json({ ok: true, items: dl.slice(0, 50) });
  }

  if (path === '/api/referrals') {
    const refd = (await env.DATA.get('refcount:' + u.ref, 'json')) || { count: 0, earned: 0 };
    return json({ ok: true, ref: u.ref, count: refd.count, earned: refd.earned, bonus: settings.referralBonus });
  }

  if (path === '/api/profile' && req.method === 'POST') {
    let b; try { b = await req.json(); } catch { return json({ ok: false, error: 'bad' }, 400); }
    const fresh = await env.DATA.get('u:' + u.id, 'json');
    if (b.name) fresh.name = clip(b.name, 60);
    if (b.password) {
      if (String(b.password).length < 6) return json({ ok: false, error: 'short' }, 400);
      fresh.salt = rid(16); fresh.hash = await pbkdf2(String(b.password), fresh.salt, PBKDF2_ITER); fresh.iter = PBKDF2_ITER;
    }
    await env.DATA.put('u:' + u.id, JSON.stringify(fresh));
    return json({ ok: true, user: pubUser(fresh) });
  }

  return json({ ok: false, error: 'not_found' }, 404);
}

const maskName = (n) => { const s = String(n || '').trim(); return s.length <= 2 ? s : s.slice(0, Math.max(2, s.length - 3)) + '***'; };
const pubSettings = (s) => ({ brandA: s.brandA, brandB: s.brandB, tagline: s.tagline, currency: s.currency, minDeposit: s.minDeposit,
  depositMethods: s.depositMethods, referralBonus: s.referralBonus, whatsapp: s.whatsapp });
async function bumpStat(env, k) { const key = 'stat:' + k; const n = +((await env.DATA.get(key)) || 0); await env.DATA.put(key, String(n + 1)); }

/* ---------------- admin APIs ---------------- */
async function handleAdmin(req, env, url, path, u) {
  if (!u || u.role !== 'admin') return json({ ok: false, error: 'forbidden' }, 403);

  if (path === '/api/admin/overview') {
    const [orders, deps, users] = await Promise.all([
      env.DATA.list({ prefix: 'o:', limit: 1000 }), env.DATA.list({ prefix: 'dep:', limit: 1000 }), env.DATA.list({ prefix: 'u:', limit: 1000 }),
    ]);
    const pend = orders.keys.filter((k) => k.metadata && k.metadata.status === 'pending').length;
    const pdep = deps.keys.filter((k) => k.metadata && k.metadata.status === 'pending').length;
    const revenue = orders.keys.reduce((s, k) => s + ((k.metadata && k.metadata.status === 'done' && k.metadata.amt) || 0), 0);
    return json({ ok: true, stats: { orders: orders.keys.length, pendingOrders: pend, deposits: deps.keys.length, pendingDeposits: pdep, users: users.keys.length, revenue } });
  }

  if (path === '/api/admin/orders') {
    const status = url.searchParams.get('status') || '';
    const list = (await env.DATA.list({ prefix: 'o:', limit: 200 })).keys;
    const items = await Promise.all(list.filter((k) => !status || (k.metadata && k.metadata.status === status)).slice(0, 100)
      .map(async (k) => ({ key: k.name, ...(await env.DATA.get(k.name, 'json')) })));
    return json({ ok: true, items: items.filter((x) => x.id) });
  }
  if (path === '/api/admin/order' && req.method === 'POST') {
    let b; try { b = await req.json(); } catch { return json({ ok: false, error: 'bad' }, 400); }
    const o = await env.DATA.get(clip(b.key, 60), 'json');
    if (!o) return json({ ok: false, error: 'not_found' }, 404);
    const st = ['pending', 'processing', 'done', 'rejected'].includes(b.status) ? b.status : o.status;
    // refund on reject (once)
    if (st === 'rejected' && o.status !== 'rejected') {
      const owner = await env.DATA.get('u:' + o.uid, 'json');
      if (owner) { owner.balance = Math.round((owner.balance || 0) + o.amount); await env.DATA.put('u:' + o.uid, JSON.stringify(owner)); }
    }
    o.status = st; o.note = clip(b.note, 300);
    await env.DATA.put(b.key, JSON.stringify(o), { metadata: { id: o.id, uid: o.uid, status: st, ts: o.ts, n: o.svcName, un: maskName(o.uname), amt: o.amount, cat: o.cat } });
    await syncUserOrder(env, o);
    return json({ ok: true });
  }

  if (path === '/api/admin/deposits') {
    const status = url.searchParams.get('status') || '';
    const list = (await env.DATA.list({ prefix: 'dep:', limit: 200 })).keys;
    const items = await Promise.all(list.filter((k) => !status || (k.metadata && k.metadata.status === status)).slice(0, 100)
      .map(async (k) => ({ key: k.name, ...(await env.DATA.get(k.name, 'json')) })));
    return json({ ok: true, items: items.filter((x) => x.id) });
  }
  if (path === '/api/admin/deposit' && req.method === 'POST') {
    let b; try { b = await req.json(); } catch { return json({ ok: false, error: 'bad' }, 400); }
    const d = await env.DATA.get(clip(b.key, 60), 'json');
    if (!d) return json({ ok: false, error: 'not_found' }, 404);
    if (b.status === 'approved' && d.status !== 'approved') {
      const owner = await env.DATA.get('u:' + d.uid, 'json');
      if (owner) {
        owner.balance = Math.round((owner.balance || 0) + d.amount);
        await env.DATA.put('u:' + owner.id, JSON.stringify(owner));
        // referral bonus on first approved deposit
        if (owner.refBy && !owner.firstDepositDone) {
          owner.firstDepositDone = true; await env.DATA.put('u:' + owner.id, JSON.stringify(owner));
          const refUid = await env.DATA.get('ref:' + owner.refBy);
          const settings = await getSettings(env);
          if (refUid && refUid !== owner.id && settings.referralBonus > 0) {
            const refU = await env.DATA.get('u:' + refUid, 'json');
            if (refU) { refU.balance = Math.round((refU.balance || 0) + settings.referralBonus); await env.DATA.put('u:' + refUid, JSON.stringify(refU));
              const rc = (await env.DATA.get('refcount:' + refU.ref, 'json')) || { count: 0, earned: 0 };
              rc.count++; rc.earned += settings.referralBonus; await env.DATA.put('refcount:' + refU.ref, JSON.stringify(rc)); }
          }
        }
      }
    }
    d.status = ['pending', 'approved', 'rejected'].includes(b.status) ? b.status : d.status;
    await env.DATA.put(b.key, JSON.stringify(d), { metadata: { id: d.id, uid: d.uid, status: d.status, ts: d.ts, amt: d.amount, un: maskName(d.uname), method: d.method } });
    await syncUserDeposit(env, d);
    return json({ ok: true });
  }

  if (path === '/api/admin/services') {
    if (req.method === 'POST') {
      let b; try { b = await req.json(); } catch { return json({ ok: false, error: 'bad' }, 400); }
      if (!Array.isArray(b.services)) return json({ ok: false, error: 'bad' }, 400);
      await env.DATA.put('services', JSON.stringify(b.services.slice(0, 200)));
      return json({ ok: true });
    }
    return json({ ok: true, services: await getServices(env), cats: await getCats(env) });
  }
  if (path === '/api/admin/cats' && req.method === 'POST') {
    let b; try { b = await req.json(); } catch { return json({ ok: false, error: 'bad' }, 400); }
    if (!Array.isArray(b.cats)) return json({ ok: false, error: 'bad' }, 400);
    await env.DATA.put('cats', JSON.stringify(b.cats.slice(0, 50)));
    return json({ ok: true });
  }

  if (path === '/api/admin/users') {
    const list = (await env.DATA.list({ prefix: 'u:', limit: 500 })).keys;
    const items = await Promise.all(list.map(async (k) => { const x = await env.DATA.get(k.name, 'json'); return x ? pubUser(x) : null; }));
    return json({ ok: true, items: items.filter(Boolean).sort((a, b) => b.ts - a.ts) });
  }
  if (path === '/api/admin/user' && req.method === 'POST') {
    let b; try { b = await req.json(); } catch { return json({ ok: false, error: 'bad' }, 400); }
    const t = await env.DATA.get('u:' + clip(b.id, 20), 'json');
    if (!t) return json({ ok: false, error: 'not_found' }, 404);
    if (b.addBalance != null) { const n = Math.round(toNum(b.addBalance)); if (Number.isFinite(n)) t.balance = Math.max(0, Math.round((t.balance || 0) + n)); }
    if (b.setBalance != null) { const n = Math.round(toNum(b.setBalance)); if (Number.isFinite(n) && n >= 0) t.balance = n; }
    if (typeof b.blocked === 'boolean') t.blocked = b.blocked;
    if (b.role && ['user', 'admin'].includes(b.role)) t.role = b.role;
    await env.DATA.put('u:' + t.id, JSON.stringify(t));
    return json({ ok: true, user: pubUser(t) });
  }

  if (path === '/api/admin/notices') {
    if (req.method === 'POST') {
      let b; try { b = await req.json(); } catch { return json({ ok: false, error: 'bad' }, 400); }
      if (!Array.isArray(b.notices)) return json({ ok: false, error: 'bad' }, 400);
      await env.DATA.put('notices', JSON.stringify(b.notices.slice(0, 30)));
      return json({ ok: true });
    }
    return json({ ok: true, notices: await getNotices(env) });
  }

  if (path === '/api/admin/settings') {
    if (req.method === 'POST') {
      let b; try { b = await req.json(); } catch { return json({ ok: false, error: 'bad' }, 400); }
      const cur = await getSettings(env);
      const next = { ...cur, ...b.settings };
      await env.DATA.put('settings', JSON.stringify(next));
      return json({ ok: true });
    }
    return json({ ok: true, settings: await getSettings(env) });
  }

  return json({ ok: false, error: 'not_found' }, 404);
}

async function syncUserOrder(env, o) {
  const ul = (await env.DATA.get('uo:' + o.uid, 'json')) || [];
  const i = ul.findIndex((x) => x.id === o.id);
  if (i >= 0) { ul[i].status = o.status; await env.DATA.put('uo:' + o.uid, JSON.stringify(ul)); }
}
async function syncUserDeposit(env, d) {
  const dl = (await env.DATA.get('udep:' + d.uid, 'json')) || [];
  const i = dl.findIndex((x) => x.id === d.id);
  if (i >= 0) { dl[i].status = d.status; await env.DATA.put('udep:' + d.uid, JSON.stringify(dl)); }
}

/* ---------------- router ---------------- */
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const path = url.pathname;
    const secure = url.protocol === 'https:';
    try {
      if (path.startsWith('/api/auth/')) return await handleAuth(req, env, url, path, secure);
      const u = await userFromReq(req, env);
      if (path.startsWith('/api/admin/')) return await handleAdmin(req, env, url, path, u);
      if (path.startsWith('/api/')) return await handleApi(req, env, url, path, u, secure);

      if (path === '/app.css') return text(APP_CSS, 'text/css; charset=utf-8', 'public, max-age=31536000, immutable');
      if (path === '/app.js') return text(APP_JS, 'text/javascript; charset=utf-8', 'public, max-age=31536000, immutable');
      if (path === '/admin.css') return text(ADMIN_CSS, 'text/css; charset=utf-8', 'public, max-age=31536000, immutable');
      if (path === '/admin.js') return text(ADMIN_JS, 'text/javascript; charset=utf-8', 'public, max-age=31536000, immutable');
      if (path === '/admin' || path === '/admin/')
        return text(ADMIN_HTML.replace(/\{\{V\}\}/g, VERSION), 'text/html; charset=utf-8', 'no-store', 200, { 'x-robots-tag': 'noindex' });
      if (path === '/robots.txt') return text('User-agent: *\nDisallow: /admin\n', 'text/plain', 'public, max-age=86400');
      // SPA: everything else serves the app shell
      return text(APP_HTML.replace(/\{\{V\}\}/g, VERSION), 'text/html; charset=utf-8', 'no-store');
    } catch (e) {
      return json({ ok: false, error: 'server', message: String(e && e.message || e) }, 500);
    }
  },
};
