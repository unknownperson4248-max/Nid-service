import APP_HTML from './client/app.html';
import APP_CSS from './client/app.css';
import APP_JS from './client/app.client.js';
import ADMIN_HTML from './client/admin.html';
import ADMIN_CSS from './client/admin.css';
import ADMIN_JS from './client/admin.client.js';
import { DEFAULT_SETTINGS, DEFAULT_CATS, DEFAULT_SERVICES, DEFAULT_NOTICES, TEXT_DEFAULTS } from './data.js';
import { wzPrice, PRICING_JS, pricingSnapshot } from './pricing.js';
// the browser gets the exact same pricing engine the server uses
const APP_JS_OUT = PRICING_JS + APP_JS;
const ADMIN_JS_OUT = PRICING_JS + ADMIN_JS;

const enc = new TextEncoder();
const PBKDF2_ITER = 100000;
const SESSION_DAYS = 30;

/* ---------------- small helpers ---------------- */
const VERSION = (() => {
  let h = 2166136261;
  const s = APP_JS_OUT + APP_CSS + ADMIN_JS_OUT + ADMIN_CSS;
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
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
// migrate an old single-number method {number,type} into the numbers[] shape
function migrateMethod(m) {
  if (Array.isArray(m.numbers)) return m;
  const numbers = m.number ? [{ id: rid(8), label: '', number: m.number, type: m.type || 'Personal', min: 0, max: null, active: true, hidden: false }] : [];
  return { id: m.id, label: m.label, color: m.color, active: m.active !== false, numbers };
}
async function getSettings(env) {
  const s = (await env.DATA.get('settings', 'json')) || {};
  return { ...DEFAULT_SETTINGS, ...s, tagline: { ...DEFAULT_SETTINGS.tagline, ...(s.tagline || {}) },
    depositMethods: (Array.isArray(s.depositMethods) ? s.depositMethods : DEFAULT_SETTINGS.depositMethods).map(migrateMethod) };
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
// list() wrapper that never throws on a KV daily-limit / 429, so admin pages degrade gracefully
async function safeList(env, opts) { try { return await env.DATA.list(opts); } catch { return { keys: [], list_complete: true, cursor: null }; } }

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
const pubUser = (u) => ({ id: u.id, name: u.name, phone: u.phone || '', email: u.email || '', balance: u.balance || 0, topup: u.topup || 0, role: u.role || 'user', ref: u.ref, ts: u.ts });

async function handleAuth(req, env, url, path, secure) {
  const ip = req.headers.get('cf-connecting-ip') || 'x';
  if (path === '/api/auth/register' && req.method === 'POST') {
    let b; try { b = await req.json(); } catch { return json({ ok: false, error: 'bad' }, 400); }
    const name = clip(b.name, 60), email = clip(b.email, 120).toLowerCase(), pw = String(b.password || ''), phone = clip(b.phone, 14);
    if (!name || !EMAIL_RE.test(email) || pw.length < 6 || pw.length > 100) return json({ ok: false, error: 'invalid' }, 400);
    if (phone && !PHONE_RE.test(phone)) return json({ ok: false, error: 'invalid' }, 400);
    // rate limit registrations per IP
    const rk = 'rl:reg:' + (await sha(ip)); const rn = +((await env.DATA.get(rk)) || 0);
    if (rn >= 20) return json({ ok: false, error: 'too_many' }, 429);
    await env.DATA.put(rk, String(rn + 1), { expirationTtl: 3600 });
    if (await env.DATA.get('email:' + email)) return json({ ok: false, error: 'exists' }, 409);
    if (phone && await env.DATA.get('phone:' + phone)) return json({ ok: false, error: 'exists' }, 409);
    const anyUser = (await env.DATA.list({ prefix: 'u:', limit: 1 })).keys.length > 0;
    const salt = rid(16);
    const u = { id: rid(12), name, email, phone: phone || '', salt, iter: PBKDF2_ITER, hash: await pbkdf2(pw, salt, PBKDF2_ITER),
      balance: 0, role: anyUser ? 'user' : 'admin', ref: rid(6).toUpperCase(), refBy: clip(b.ref, 10).toUpperCase() || '', ts: now() };
    await env.DATA.put('u:' + u.id, JSON.stringify(u));
    await env.DATA.put('email:' + email, u.id);
    if (phone) await env.DATA.put('phone:' + phone, u.id);
    if (u.ref) await env.DATA.put('ref:' + u.ref, u.id);
    const tok = rid(28);
    await env.DATA.put('sess:' + tok, JSON.stringify({ uid: u.id, ts: now() }), { expirationTtl: SESSION_DAYS * 86400 });
    return json({ ok: true, user: pubUser(u) }, 200, { 'set-cookie': cookie('sid', tok, SESSION_DAYS, secure) });
  }
  if (path === '/api/auth/login' && req.method === 'POST') {
    let b; try { b = await req.json(); } catch { return json({ ok: false, error: 'bad' }, 400); }
    const idRaw = clip(b.id || b.email || b.phone, 120), pw = String(b.password || '');
    const rk = 'rl:login:' + (await sha(ip)); const rn = +((await env.DATA.get(rk)) || 0);
    if (rn >= 15) return json({ ok: false, error: 'too_many' }, 429);
    let uid = idRaw.includes('@')
      ? await env.DATA.get('email:' + idRaw.toLowerCase())
      : await env.DATA.get('phone:' + clip(idRaw, 14));
    if (!uid) uid = (await env.DATA.get('email:' + idRaw.toLowerCase())) || (await env.DATA.get('phone:' + clip(idRaw, 14)));
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
  const P = (svc.pricing && typeof svc.pricing === 'object') ? svc.pricing : {};
  const mode = (P.mode === 'qty' || P.mode === 'formula') ? P.mode : 'fixed';
  const qKey = String(P.qtyKey || 'quantity');
  const clean = {};
  for (const f of svc.fields || []) {
    if (mode !== 'fixed' && f.key === qKey) continue; // the pricing engine owns the quantity box
    const v = fields[f.key];
    if (v == null || v === '') { if (f.required) return { error: f.key }; clean[f.key] = ''; continue; }
    if (f.type === 'select') {
      const opt = (f.options || []).find((o) => (o.value || o.label) === v);
      if (!opt) return { error: f.key };
      clean[f.key] = opt.value || opt.label;
    } else if (f.type === 'number') {
      const n = toNum(v);
      if (!Number.isFinite(n)) return { error: f.key };
      if (f.min != null && n < f.min) return { error: f.key };
      if (f.max != null && n > f.max) return { error: f.key };
      clean[f.key] = n;
    } else if (f.type === 'phone') {
      const p = clip(v, 14); if (!PHONE_RE.test(p)) return { error: f.key };
      clean[f.key] = p;
    } else if (f.type === 'image') {
      const im = safeImg(v); if (!im) { if (f.required) return { error: f.key }; clean[f.key] = ''; continue; }
      clean[f.key] = im;
    } else {
      clean[f.key] = clip(v, 500);
    }
  }
  // the price is NEVER taken from the browser: recompute it from the saved product config
  const vals = { ...clean };
  if (mode !== 'fixed') vals[qKey] = fields[qKey];
  const pr = wzPrice(svc, vals);
  if (!pr.ok) return { error: qKey, code: pr.err };
  if (pr.qty != null) clean[qKey] = pr.qty;
  return { amount: pr.amount, clean, price: pr };
}

/* ---------------- per-product auto-delivery via external API ---------------- */
const orderMeta = (o) => ({ id: o.id, uid: o.uid, status: o.status, ts: o.ts, n: o.svcName, un: maskName(o.uname), amt: o.amount, cat: o.cat, pay: o.payVia || 'wallet' });
function apiSubst(tpl, order, secrets) {
  return String(tpl == null ? '' : tpl)
    .replace(/\{\{(\w+)\}\}/g, (_, k) => String((secrets && secrets[k]) != null ? secrets[k] : ''))
    .replace(/\{(\w+)\}/g, (_, k) => {
      if (k === 'amount' || k === 'total') return String(order.amount);
      if (k === 'orderId') return String(order.id);
      const v = order.fields && order.fields[k];
      return v == null ? '' : String(v);
    });
}
const getByPath = (obj, path) => !path ? undefined : String(path).split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
// parse a provider response body: plain JSON, or a Server-Sent-Events stream (take the last parseable "data: {...}")
function parseApiBody(text) {
  if (text == null || typeof text !== 'string') return text;
  try { return JSON.parse(text); } catch {}
  let best;
  for (const m of text.matchAll(/data:\s*(\{.*\})\s*$/gm)) { try { best = JSON.parse(m[1]); } catch {} }
  return best != null ? best : text;
}
async function runProductApi(order, svc, settings) {
  const a = svc.api || {};
  if (!a.on || !a.url) return { ok: false, error: 'noapi' };
  const secrets = settings.apiSecrets || {};
  const method = (a.method || 'POST').toUpperCase();
  let url = apiSubst(a.url, order, secrets);
  if (a.query) { try { const q = JSON.parse(apiSubst(a.query, order, secrets)); const uu = new URL(url); for (const k in q) uu.searchParams.set(k, q[k]); url = uu.toString(); } catch {} }
  const headers = { 'content-type': 'application/json' };
  if (a.headers) { try { Object.assign(headers, JSON.parse(apiSubst(a.headers, order, secrets))); } catch {} }
  const init = { method, headers };
  if (method !== 'GET' && a.body) init.body = apiSubst(a.body, order, secrets);
  try {
    const rr = await fetch(url, init);
    const text = await rr.text();
    const data = parseApiBody(text);
    const extId = a.idPath ? getByPath(data, a.idPath) : undefined;
    const okFlag = rr.ok && (a.idPath ? (extId != null && extId !== '') : true);
    return { ok: okFlag, status: rr.status, extId: extId != null ? String(extId) : '', resp: typeof data === 'string' ? data.slice(0, 600) : data, error: okFlag ? '' : ('http ' + rr.status) };
  } catch (e) { return { ok: false, error: String((e && e.message) || e).slice(0, 200) }; }
}
// retry only transient failures (network error / 5xx / 429); a 4xx (bad auth, limit, bad request) will not fix itself
const apiRetryable = (r) => !r.ok && (!r.status || r.status >= 500 || r.status === 429);
async function saveOrderStatus(env, key, order) {
  await env.DATA.put(key, JSON.stringify(order), { metadata: orderMeta(order) });
  const ul = (await env.DATA.get('uo:' + order.uid, 'json')) || [];
  const i = ul.findIndex((x) => x.id === order.id);
  if (i >= 0) { ul[i].status = order.status; await env.DATA.put('uo:' + order.uid, JSON.stringify(ul)); }
}
// retry queue tracked as a small index array (get), NOT a KV list() — saves list ops
async function apiqAdd(env, okey) {
  await env.DATA.put('apiq:' + okey, '1');
  const idx = (await env.DATA.get('apiq_index', 'json')) || [];
  if (!idx.includes(okey)) { idx.push(okey); await env.DATA.put('apiq_index', JSON.stringify(idx.slice(-500))); }
}
async function apiqDrop(env, okey) {
  await env.DATA.delete('apiq:' + okey);
  const idx = (await env.DATA.get('apiq_index', 'json')) || [];
  const n = idx.filter((k) => k !== okey);
  if (n.length !== idx.length) await env.DATA.put('apiq_index', JSON.stringify(n));
}
// recent "live" feed cached as one array (get) so /api/home never needs a list()
async function pushLive(env, order) {
  try { const live = (await env.DATA.get('live_orders', 'json')) || []; live.unshift(orderMeta(order)); await env.DATA.put('live_orders', JSON.stringify(live.slice(0, 12))); } catch {}
}
async function retryApiQueue(env) {
  const idx = (await env.DATA.get('apiq_index', 'json')) || [];
  if (!idx.length) return;
  const [settings, services] = await Promise.all([getSettings(env), getServices(env)]);
  const t = now();
  const backoff = [60, 120, 300, 600, 1800]; // seconds
  const done = [];
  for (const okey of idx.slice(0, 300)) {
    const order = await env.DATA.get(okey, 'json');
    if (!order || !order.api || order.api.state !== 'queued') { done.push(okey); continue; }
    if ((order.api.nextTs || 0) > t) continue;
    const svc = services.find((s) => s.id === order.svcId);
    if (!svc || !svc.api || !svc.api.on) { done.push(okey); continue; }
    if (order.api.extId) { order.api.state = 'ok'; if (order.status === 'pending') order.status = svc.api.doneOnOk ? 'done' : 'processing'; done.push(okey); await saveOrderStatus(env, okey, order); continue; }
    { const prevId = getByPath(parseApiBody(order.api.resp), svc.api.idPath); if (prevId != null && prevId !== '') { order.api.extId = String(prevId); order.api.state = 'ok'; if (order.status === 'pending') order.status = svc.api.doneOnOk ? 'done' : 'processing'; done.push(okey); await saveOrderStatus(env, okey, order); continue; } }
    const res = await runProductApi(order, svc, settings);
    order.api.attempts = (order.api.attempts || 1) + 1;
    order.api.resp = res.resp; order.api.error = res.error || ''; order.api.status = res.status || 0;
    if (res.ok) { order.api.state = 'ok'; order.api.extId = res.extId || ''; order.status = svc.api.doneOnOk ? 'done' : 'processing'; done.push(okey); }
    else if (!apiRetryable(res) || order.api.attempts >= 8) { order.api.state = 'failed'; done.push(okey); }
    else order.api.nextTs = t + backoff[Math.min(order.api.attempts - 1, backoff.length - 1)] * 1000;
    await saveOrderStatus(env, okey, order);
  }
  if (done.length) {
    const cur = (await env.DATA.get('apiq_index', 'json')) || [];
    await env.DATA.put('apiq_index', JSON.stringify(cur.filter((k) => !done.includes(k))));
    for (const k of done) await env.DATA.delete('apiq:' + k).catch(() => {});
  }
}

/* ---------------- customer APIs ---------------- */
async function handleApi(req, env, url, path, u, secure) {
  const settings = await getSettings(env);

  if (path === '/api/me') return json({ ok: true, user: u ? pubUser(u) : null, settings: pubSettings(settings) });

  if (path === '/api/home') {
    const [services, cats, notices] = await Promise.all([getServices(env), getCats(env), getNotices(env)]);
    // live feed from a cached array (get) to avoid a KV list() on every home load;
    // fall back to list() but never let it break the home page
    const live = (await env.DATA.get('live_orders', 'json')) || [];
    return json({ ok: true, user: u ? pubUser(u) : null, settings: pubSettings(settings),
      services: services.filter((s) => s.active).map(({ api, ...rest }) => rest), cats, notices, live });
  }

  if (!u) return json({ ok: false, error: 'auth' }, 401);

  if (path === '/api/upload' && req.method === 'POST') {
    // buyer attaches an image to an order field
    const rk = 'ul:' + u.id; const n = +((await env.DATA.get(rk)) || 0);
    if (n >= 30) return json({ ok: false, error: 'too_many' }, 429);
    let b; try { b = await req.json(); } catch { return json({ ok: false, error: 'bad' }, 400); }
    const m = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(String(b.dataUrl || ''));
    if (!m) return json({ ok: false, error: 'type' }, 400);
    const bin = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
    if (bin.byteLength > 3 * 1024 * 1024) return json({ ok: false, error: 'big' }, 400);
    await env.DATA.put(rk, String(n + 1), { expirationTtl: 3600 });
    const id = rid(16);
    await env.DATA.put('media:' + id, bin, { metadata: { type: m[1] } });
    return json({ ok: true, path: '/img/' + id });
  }

  if (path === '/api/order' && req.method === 'POST') {
    let b; try { b = await req.json(); } catch { return json({ ok: false, error: 'bad' }, 400); }
    const services = await getServices(env);
    const svc = services.find((s) => s.id === clip(b.svcId, 40) && s.active);
    if (!svc) return json({ ok: false, error: 'service' }, 404);
    const r = computeOrder(svc, b.fields || {});
    if (r.error) return json({ ok: false, error: 'field', field: r.error, code: r.code || '' }, 400);
    if (r.amount <= 0) return json({ ok: false, error: 'amount' }, 400);
    const direct = b.payVia === 'direct';
    const ts = now(), id = 'WF' + String(ts).slice(-8) + rid(3).toUpperCase();
    const order = { id, uid: u.id, uname: u.name, svcId: svc.id, svcName: svc.name, cat: svc.cat, fields: r.clean, amount: r.amount, status: 'pending', note: '', ts, payVia: direct ? 'direct' : 'wallet' };
    order.pricing = pricingSnapshot(svc, r.price); // frozen: later rate changes never touch this order
    const key = 'o:' + sortKey(ts);
    let outBalance;
    if (direct) {
      // pay the order amount directly via bKash/Nagad; admin verifies payment then approves
      const method = clip(b.method, 24), trxid = clip(b.trxid, 40), sender = clip(b.sender, 14);
      if (!method || trxid.length < 4) return json({ ok: false, error: 'pay' }, 400);
      order.pay = { method, trxid, sender };
      await env.DATA.put(key, JSON.stringify(order), { metadata: orderMeta(order) });
      const me = await env.DATA.get('u:' + u.id, 'json');
      outBalance = me ? me.balance : undefined;
    } else {
      // wallet: re-read the user fresh to avoid stale balance, then deduct
      const fresh = await env.DATA.get('u:' + u.id, 'json');
      if ((fresh.balance || 0) < r.amount) return json({ ok: false, error: 'balance', need: r.amount, have: fresh.balance || 0 }, 400);
      fresh.balance = Math.round((fresh.balance || 0) - r.amount);
      // auto-delivery: call the provider API immediately after payment
      if (svc.api && svc.api.on && svc.api.url) {
        const res = await runProductApi(order, svc, settings);
        const retry = apiRetryable(res);
        order.api = { state: res.ok ? 'ok' : (retry ? 'queued' : 'failed'), extId: res.extId || '', resp: res.resp, error: res.error || '', status: res.status || 0, attempts: 1, nextTs: (res.ok || !retry) ? 0 : ts + 60000 };
        if (res.ok) order.status = svc.api.doneOnOk ? 'done' : 'processing';
      }
      await env.DATA.put('u:' + u.id, JSON.stringify(fresh));
      await env.DATA.put(key, JSON.stringify(order), { metadata: orderMeta(order) });
      outBalance = fresh.balance;
    }
    await pushLive(env, order);
    const ul = (await env.DATA.get('uo:' + u.id, 'json')) || [];
    ul.unshift({ key, id, status: order.status, ts, svcName: svc.name, amount: r.amount });
    await env.DATA.put('uo:' + u.id, JSON.stringify(ul.slice(0, 100)));
    if (order.api && order.api.state === 'queued') await apiqAdd(env, key);
    await bumpStat(env, 'orders');
    return json({ ok: true, order: { id, amount: r.amount, status: order.status }, balance: outBalance });
  }

  if (path === '/api/orders') {
    const ul = (await env.DATA.get('uo:' + u.id, 'json')) || [];
    const items = await Promise.all(ul.slice(0, 50).map(async (o) => {
      const full = await env.DATA.get(o.key, 'json');
      return { ...(full || o), key: o.key };
    }));
    return json({ ok: true, items: items.filter(Boolean) });
  }
  if (path === '/api/order-cancel' && req.method === 'POST') {
    let b; try { b = await req.json(); } catch { return json({ ok: false, error: 'bad' }, 400); }
    const okey = clip(b.key, 60);
    const o = await env.DATA.get(okey, 'json');
    if (!o || o.uid !== u.id) return json({ ok: false, error: 'not_found' }, 404);
    if (o.status !== 'pending') return json({ ok: false, error: 'not_pending' }, 400);
    const owner = await env.DATA.get('u:' + u.id, 'json');
    if (owner) { owner.balance = Math.round((owner.balance || 0) + o.amount); await env.DATA.put('u:' + u.id, JSON.stringify(owner)); }
    o.status = 'rejected'; o.note = 'Cancelled by customer — amount refunded.'; o.cancelledByUser = true;
    await apiqDrop(env, okey);
    await saveOrderStatus(env, okey, o);
    return json({ ok: true, balance: owner ? owner.balance : undefined });
  }

  if (path === '/api/deposit' && req.method === 'POST') {
    let b; try { b = await req.json(); } catch { return json({ ok: false, error: 'bad' }, 400); }
    const method = clip(b.method, 20), toNumber = clip(b.toNumber, 20), sender = clip(b.sender, 14), trxid = clip(b.trxid, 40), amount = Math.round(toNum(b.amount));
    if (!method || trxid.length < 4 || !(amount >= (settings.minDeposit || 20) && amount <= 100000))
      return json({ ok: false, error: 'invalid' }, 400);
    const ts = now(), id = 'DP' + String(ts).slice(-8) + rid(2).toUpperCase();
    const dep = { id, uid: u.id, uname: u.name, method, toNumber, sender, trxid, amount, status: 'pending', ts };
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

  if (path === '/api/leaderboard') {
    const lb = (await env.DATA.get('lb', 'json')) || [];
    let rank = 0; if (u) { const idx = lb.findIndex((x) => x.uid === u.id); rank = idx >= 0 ? idx + 1 : 0; }
    return json({ ok: true, items: lb.slice(0, 15).map((x) => ({ name: x.name, topup: x.topup || 0 })), me: { rank, topup: (u && u.topup) || 0 } });
  }

  if (path === '/api/profile' && req.method === 'POST') {
    let b; try { b = await req.json(); } catch { return json({ ok: false, error: 'bad' }, 400); }
    const fresh = await env.DATA.get('u:' + u.id, 'json');
    if (b.name) fresh.name = clip(b.name, 60);
    if (typeof b.email === 'string') {
      const email = clip(b.email, 120).toLowerCase();
      if (email && !EMAIL_RE.test(email)) return json({ ok: false, error: 'invalid' }, 400);
      if (email !== (fresh.email || '')) {
        if (email) { const taken = await env.DATA.get('email:' + email); if (taken && taken !== u.id) return json({ ok: false, error: 'exists' }, 409); }
        if (fresh.email) await env.DATA.delete('email:' + fresh.email);
        if (email) await env.DATA.put('email:' + email, u.id);
        fresh.email = email;
      }
    }
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
// customers only see active methods, and only active + not-hidden numbers inside them
function pubMethods(list) {
  return (list || []).filter((m) => m.active !== false).map((m) => ({ id: m.id, label: m.label, color: m.color,
    numbers: (m.numbers || []).filter((n) => n.active !== false && !n.hidden).map((n) => ({ id: n.id, label: n.label, number: n.number, type: n.type, min: n.min, max: n.max })) }));
}
const pubBanners = (list) => (Array.isArray(list) ? list : []).map((b) => ({ img: safeImg(b && b.img), link: clip((b && b.link) || '', 120) })).filter((b) => b.img).slice(0, 8);
const pubSettings = (s) => ({ heroTitle: s.heroTitle, heroSub: s.heroSub, heroImg: safeImg(s.heroImg), banners: pubBanners(s.banners), texts: cleanTexts(s.texts), layout: cleanLayout(s.layout), brandA: s.brandA, brandB: s.brandB, logo: safeImg(s.logo), themeColor: safeHex(s.themeColor), tagline: s.tagline, currency: s.currency, minDeposit: s.minDeposit,
  depositMethods: pubMethods(s.depositMethods), referralBonus: s.referralBonus, whatsapp: s.whatsapp,
  googleOn: !!(s.googleOn && s.googleCID && s.googleSecret), rules: s.rules || '',
  telegram: s.telegram || '', telegramCh: s.telegramCh || '', footerAbout: s.footerAbout || '', privacy: s.privacy || '', poweredBy: s.poweredBy || '' });
async function bumpStat(env, k) { const key = 'stat:' + k; const n = +((await env.DATA.get(key)) || 0); await env.DATA.put(key, String(n + 1)); }

/* ---------------- admin APIs ---------------- */
async function handleGoogle(req, env, url, path, secure) {
  const s = await getSettings(env);
  const redirectUri = url.origin + '/auth/google/callback';
  if (!s.googleOn || !s.googleCID || !s.googleSecret) return Response.redirect(url.origin + '/?e=google_off', 302);
  if (path === '/auth/google/start') {
    const state = rid(24);
    await env.DATA.put('gstate:' + state, '1', { expirationTtl: 600 });
    const auth = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
      client_id: s.googleCID, redirect_uri: redirectUri, response_type: 'code', scope: 'openid email profile', state, access_type: 'online', prompt: 'select_account' });
    return Response.redirect(auth, 302);
  }
  if (path === '/auth/google/callback') {
    const code = url.searchParams.get('code'), state = url.searchParams.get('state');
    if (!code || !state) return Response.redirect(url.origin + '/?e=google_cancel', 302);
    if (!(await env.DATA.get('gstate:' + state))) return Response.redirect(url.origin + '/?e=google_state', 302);
    await env.DATA.delete('gstate:' + state);
    const tr = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ code, client_id: s.googleCID, client_secret: s.googleSecret, redirect_uri: redirectUri, grant_type: 'authorization_code' }) });
    const tok = await tr.json().catch(() => null);
    if (!tok || !tok.access_token) return Response.redirect(url.origin + '/?e=google_token', 302);
    const info = await (await fetch('https://www.googleapis.com/oauth2/v2/userinfo', { headers: { authorization: 'Bearer ' + tok.access_token } })).json().catch(() => null);
    const email = info && info.email ? String(info.email).toLowerCase() : '';
    if (!email || !EMAIL_RE.test(email)) return Response.redirect(url.origin + '/?e=google_email', 302);
    let uid = await env.DATA.get('email:' + email);
    let u = uid ? await env.DATA.get('u:' + uid, 'json') : null;
    if (!u) {
      const anyUser = (await env.DATA.list({ prefix: 'u:', limit: 1 })).keys.length > 0;
      const salt = rid(16);
      u = { id: rid(12), name: clip((info && info.name) || email.split('@')[0], 60), email, phone: '', salt, iter: PBKDF2_ITER, hash: await pbkdf2(rid(24), salt, PBKDF2_ITER), balance: 0, role: anyUser ? 'user' : 'admin', ref: rid(6).toUpperCase(), refBy: '', ts: now(), google: true };
      await env.DATA.put('u:' + u.id, JSON.stringify(u));
      await env.DATA.put('email:' + email, u.id);
      if (u.ref) await env.DATA.put('ref:' + u.ref, u.id);
    }
    if (u.blocked) return Response.redirect(url.origin + '/?e=blocked', 302);
    const token = rid(28);
    await env.DATA.put('sess:' + token, JSON.stringify({ uid: u.id, ts: now() }), { expirationTtl: SESSION_DAYS * 86400 });
    return new Response(null, { status: 302, headers: { location: url.origin + '/#home', 'set-cookie': cookie('sid', token, SESSION_DAYS, secure) } });
  }
  return new Response('Not found', { status: 404 });
}

async function handleAdmin(req, env, url, path, u) {
  if (!u || u.role !== 'admin') return json({ ok: false, error: 'forbidden' }, 403);

  if (path === '/api/admin/backfill-topup' && req.method === 'POST') {
    const totals = {}; let cursor;
    do {
      const res = await env.DATA.list({ prefix: 'dep:', cursor, limit: 1000 });
      cursor = res.list_complete ? null : res.cursor;
      for (const k of res.keys) { const m = k.metadata || {}; if (m.status === 'approved' && m.uid) totals[m.uid] = (totals[m.uid] || 0) + (m.amt || 0); }
    } while (cursor);
    let updated = 0; const lb = [];
    for (const uid of Object.keys(totals)) {
      const user = await env.DATA.get('u:' + uid, 'json'); if (!user) continue;
      user.topup = totals[uid]; await env.DATA.put('u:' + uid, JSON.stringify(user)); updated++;
      if (totals[uid] > 0) lb.push({ uid, name: maskName(user.name || ''), topup: totals[uid] });
    }
    lb.sort((a, b) => b.topup - a.topup);
    await env.DATA.put('lb', JSON.stringify(lb.slice(0, 100)));
    return json({ ok: true, users: Object.keys(totals).length, updated, leaderboard: lb.length });
  }

  // optional extra "admin panel password" gate
  const aset = await getSettings(env);
  if (path === '/api/admin/unlock') {
    if (req.method !== 'POST') return json({ ok: false }, 405);
    let b; try { b = await req.json(); } catch { return json({ ok: false, error: 'bad' }, 400); }
    if (!aset.adminPass) return json({ ok: true });
    const ok = (await pbkdf2(String(b.pass || ''), aset.adminPass.salt, aset.adminPass.iter || PBKDF2_ITER)) === aset.adminPass.hash;
    if (!ok) return json({ ok: false, error: 'wrongpass' }, 401);
    const sess = (await env.DATA.get('sess:' + u._token, 'json')) || { uid: u.id, ts: now() };
    sess.adm = true;
    await env.DATA.put('sess:' + u._token, JSON.stringify(sess), { expirationTtl: SESSION_DAYS * 86400 });
    return json({ ok: true });
  }
  if (path === '/api/admin/setpass') {
    if (req.method !== 'POST') return json({ ok: false }, 405);
    let b; try { b = await req.json(); } catch { return json({ ok: false, error: 'bad' }, 400); }
    const p = String(b.pass || '');
    if (p !== '' && p.length < 4) return json({ ok: false, error: 'short' }, 400);
    if (p === '') aset.adminPass = null;
    else { const salt = rid(16); aset.adminPass = { salt, iter: PBKDF2_ITER, hash: await pbkdf2(p, salt, PBKDF2_ITER) }; }
    await env.DATA.put('settings', JSON.stringify(aset));
    const sess = (await env.DATA.get('sess:' + u._token, 'json')) || { uid: u.id, ts: now() };
    sess.adm = true; // keep the setter unlocked so they are not locked out immediately
    await env.DATA.put('sess:' + u._token, JSON.stringify(sess), { expirationTtl: SESSION_DAYS * 86400 });
    return json({ ok: true, passSet: !!aset.adminPass });
  }
  if (aset.adminPass) {
    const sess = await env.DATA.get('sess:' + u._token, 'json');
    if (!sess || !sess.adm) return json({ ok: false, error: 'locked' }, 401);
  }
  if (path === '/api/admin/secret') {
    if (req.method !== 'POST') return json({ ok: false }, 405);
    let b; try { b = await req.json(); } catch { return json({ ok: false, error: 'bad' }, 400); }
    const name = clip(b.name, 40).replace(/[^A-Za-z0-9_]/g, '');
    if (!name) return json({ ok: false, error: 'name' }, 400);
    const st = await getSettings(env); st.apiSecrets = (st.apiSecrets && typeof st.apiSecrets === 'object') ? st.apiSecrets : {};
    if (b.remove) delete st.apiSecrets[name]; else st.apiSecrets[name] = clip(b.value, 500);
    await env.DATA.put('settings', JSON.stringify(st));
    return json({ ok: true, names: Object.keys(st.apiSecrets) });
  }
  if (path === '/api/admin/order-retry' && req.method === 'POST') {
    let b; try { b = await req.json(); } catch { return json({ ok: false, error: 'bad' }, 400); }
    const okey = clip(b.key, 40);
    const order = await env.DATA.get(okey, 'json');
    if (!order) return json({ ok: false, error: 'nf' }, 404);
    const services = await getServices(env); const svc = services.find((s) => s.id === order.svcId);
    if (!svc || !svc.api || !svc.api.on) return json({ ok: false, error: 'noapi' }, 400);
    // safety: if this order already got an external id, it already succeeded — don't call again (avoid double delivery)
    if (order.api && order.api.extId) { order.api.state = 'ok'; if (order.status === 'pending') order.status = svc.api.doneOnOk ? 'done' : 'processing'; await apiqDrop(env, okey); await saveOrderStatus(env, okey, order); return json({ ok: true, api: order.api, status: order.status, already: true }); }
    // recover: the stored response may already hold a success id (e.g. an SSE launch mis-parsed earlier) — never re-call then
    { const prevId = order.api ? getByPath(parseApiBody(order.api.resp), svc.api.idPath) : undefined; if (prevId != null && prevId !== '') { order.api.extId = String(prevId); order.api.state = 'ok'; order.api.error = ''; if (order.status === 'pending') order.status = svc.api.doneOnOk ? 'done' : 'processing'; await apiqDrop(env, okey); await saveOrderStatus(env, okey, order); return json({ ok: true, api: order.api, status: order.status, recovered: true }); } }
    const res = await runProductApi(order, svc, await getSettings(env));
    order.api = order.api || {}; order.api.attempts = (order.api.attempts || 1) + 1; order.api.resp = res.resp; order.api.error = res.error || ''; order.api.status = res.status || 0;
    if (res.ok) { order.api.state = 'ok'; order.api.extId = res.extId || ''; order.status = svc.api.doneOnOk ? 'done' : 'processing'; await apiqDrop(env, okey); }
    else if (apiRetryable(res)) { order.api.state = 'queued'; order.api.nextTs = now() + 60000; await apiqAdd(env, okey); }
    else { order.api.state = 'failed'; await apiqDrop(env, okey); }
    await saveOrderStatus(env, okey, order);
    return json({ ok: true, api: order.api, status: order.status });
  }

  if (path === '/api/admin/overview') {
    const [orders, deps, users] = await Promise.all([
      safeList(env, { prefix: 'o:', limit: 1000 }), safeList(env, { prefix: 'dep:', limit: 1000 }), safeList(env, { prefix: 'u:', limit: 1000 }),
    ]);
    const pend = orders.keys.filter((k) => k.metadata && k.metadata.status === 'pending').length;
    const pdep = deps.keys.filter((k) => k.metadata && k.metadata.status === 'pending').length;
    const revenue = orders.keys.reduce((s, k) => s + ((k.metadata && k.metadata.status === 'done' && k.metadata.amt) || 0), 0);
    return json({ ok: true, stats: { orders: orders.keys.length, pendingOrders: pend, deposits: deps.keys.length, pendingDeposits: pdep, users: users.keys.length, revenue } });
  }

  if (path === '/api/admin/orders') {
    const status = url.searchParams.get('status') || '';
    const list = (await safeList(env, { prefix: 'o:', limit: 200 })).keys;
    const items = await Promise.all(list.filter((k) => !status || (k.metadata && k.metadata.status === status)).slice(0, 100)
      .map(async (k) => ({ key: k.name, ...(await env.DATA.get(k.name, 'json')) })));
    return json({ ok: true, items: items.filter((x) => x.id) });
  }
  if (path === '/api/admin/order' && req.method === 'POST') {
    let b; try { b = await req.json(); } catch { return json({ ok: false, error: 'bad' }, 400); }
    const o = await env.DATA.get(clip(b.key, 60), 'json');
    if (!o) return json({ ok: false, error: 'not_found' }, 404);
    const st = ['pending', 'processing', 'done', 'rejected'].includes(b.status) ? b.status : o.status;
    // refund on reject (once) — ONLY wallet orders; direct bKash/Nagad orders were not paid from wallet
    if (st === 'rejected' && o.status !== 'rejected' && o.payVia !== 'direct') {
      const owner = await env.DATA.get('u:' + o.uid, 'json');
      if (owner) { owner.balance = Math.round((owner.balance || 0) + o.amount); await env.DATA.put('u:' + o.uid, JSON.stringify(owner)); }
    }
    o.status = st; o.note = clip(b.note, 1000); o.respImg = safeImg(b.respImg);
    // direct-payment order being approved: run auto-delivery now (payment verified by admin)
    if (o.payVia === 'direct' && (st === 'processing' || st === 'done') && !(o.api && o.api.extId)) {
      const svc = (await getServices(env)).find((s) => s.id === o.svcId);
      if (svc && svc.api && svc.api.on && svc.api.url) {
        const res = await runProductApi(o, svc, await getSettings(env));
        const retry = apiRetryable(res);
        o.api = { state: res.ok ? 'ok' : (retry ? 'queued' : 'failed'), extId: res.extId || '', resp: res.resp, error: res.error || '', status: res.status || 0, attempts: 1, nextTs: (res.ok || !retry) ? 0 : now() + 60000 };
        if (res.ok) o.status = svc.api.doneOnOk ? 'done' : 'processing';
        if (o.api.state === 'queued') await apiqAdd(env, b.key);
      }
    }
    await env.DATA.put(b.key, JSON.stringify(o), { metadata: orderMeta(o) });
    await syncUserOrder(env, o);
    return json({ ok: true, status: o.status });
  }

  if (path === '/api/admin/deposits') {
    const status = url.searchParams.get('status') || '';
    const list = (await safeList(env, { prefix: 'dep:', limit: 200 })).keys;
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
        owner.topup = Math.round((owner.topup || 0) + d.amount);
        await env.DATA.put('u:' + owner.id, JSON.stringify(owner));
        await bumpLeaderboard(env, owner);
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

  if (path === '/api/admin/upload' && req.method === 'POST') {
    let b; try { b = await req.json(); } catch { return json({ ok: false, error: 'bad' }, 400); }
    const m = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(String(b.dataUrl || ''));
    if (!m) return json({ ok: false, error: 'type' }, 400);
    const bin = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
    if (bin.byteLength > 2 * 1024 * 1024) return json({ ok: false, error: 'big' }, 400);
    const id = rid(16);
    await env.DATA.put('media:' + id, bin, { metadata: { type: m[1] } });
    return json({ ok: true, path: '/img/' + id });
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
    const list = (await safeList(env, { prefix: 'u:', limit: 500 })).keys;
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
    if (b.role && ['user', 'admin'].includes(b.role)) {
      // never leave the site without an admin
      if (t.role === 'admin' && b.role === 'user' && t.id === u.id) return json({ ok: false, error: 'self' }, 400);
      t.role = b.role;
    }
    if (b.name) t.name = clip(b.name, 60);
    if (b.phone && b.phone !== t.phone) {
      const ph = clip(b.phone, 14);
      if (!PHONE_RE.test(ph)) return json({ ok: false, error: 'phone' }, 400);
      if (await env.DATA.get('phone:' + ph)) return json({ ok: false, error: 'exists' }, 409);
      await env.DATA.delete('phone:' + t.phone); await env.DATA.put('phone:' + ph, t.id); t.phone = ph;
    }
    if (b.password) {
      if (String(b.password).length < 6) return json({ ok: false, error: 'short' }, 400);
      t.salt = rid(16); t.iter = PBKDF2_ITER; t.hash = await pbkdf2(String(b.password), t.salt, PBKDF2_ITER);
    }
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
      next.themeColor = safeHex(next.themeColor); next.logo = safeImg(next.logo);
      next.texts = cleanTexts(next.texts); next.layout = cleanLayout(next.layout);
      next.seoTitle = clip(next.seoTitle, 90); next.seoDesc = clip(next.seoDesc, 300);
      next.rules = String(next.rules || '').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '').slice(0, 4000);
      next.privacy = String(next.privacy || '').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '').slice(0, 4000);
      next.footerAbout = String(next.footerAbout || '').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '').slice(0, 600);
      next.telegram = clip(next.telegram, 120); next.telegramCh = clip(next.telegramCh, 120); next.poweredBy = clip(next.poweredBy, 60);
      next.apiSecrets = (cur.apiSecrets && typeof cur.apiSecrets === 'object') ? cur.apiSecrets : {}; // changed only via /api/admin/secret
      next.heroTitle = clip(next.heroTitle, 80); next.heroSub = clip(next.heroSub, 160); next.heroImg = safeImg(next.heroImg);
      if (Array.isArray(next.banners)) next.banners = next.banners.slice(0, 8).map((b) => ({ img: safeImg(b && b.img), link: clip((b && b.link) || '', 120) })).filter((b) => b.img);
      next.adminPass = cur.adminPass || null; // only changed via /api/admin/setpass, never the generic save
      next.googleOn = !!next.googleOn; next.googleCID = clip(next.googleCID, 200);
      next.googleSecret = (typeof b.settings.googleSecret === 'string' && b.settings.googleSecret.trim()) ? clip(b.settings.googleSecret, 200) : (cur.googleSecret || '');
      const hexish = (v, fallback) => (/^#[0-9a-f]{3,8}$/i.test(String(v || '')) ? String(v) : fallback);
      if (Array.isArray(next.depositMethods)) next.depositMethods = next.depositMethods.slice(0, 12).map((m) => ({
        id: clip(m.id, 20) || rid(8), label: clip(m.label, 30), color: hexish(m.color, '#0f766e'), active: m.active !== false,
        numbers: Array.isArray(m.numbers) ? m.numbers.slice(0, 20).map((n) => ({
          id: clip(n.id, 20) || rid(8), label: clip(n.label, 30), number: clip(n.number, 20), type: clip(n.type, 20) || 'Personal',
          min: n.min != null && n.min !== '' ? Math.max(0, Math.round(toNum(n.min)) || 0) : 0,
          max: n.max != null && n.max !== '' && Number.isFinite(toNum(n.max)) ? Math.max(0, Math.round(toNum(n.max))) : null,
          active: n.active !== false, hidden: !!n.hidden,
        })) : [],
      }));
      await env.DATA.put('settings', JSON.stringify(next));
      return json({ ok: true });
    }
    const st = await getSettings(env);
    return json({ ok: true, settings: { ...st, adminPass: undefined, googleSecret: undefined, apiSecrets: undefined, texts: cleanTexts(st.texts), layout: cleanLayout(st.layout) }, adminPassSet: !!st.adminPass, googleSecretSet: !!st.googleSecret, apiSecretNames: Object.keys(st.apiSecrets || {}), textDefaults: TEXT_DEFAULTS });
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

async function bumpLeaderboard(env, owner) {
  const lb = (await env.DATA.get('lb', 'json')) || [];
  const entry = { uid: owner.id, name: maskName(owner.name || ''), topup: owner.topup || 0 };
  const i = lb.findIndex((x) => x.uid === owner.id);
  if (i >= 0) lb[i] = entry; else lb.push(entry);
  lb.sort((a, b) => (b.topup || 0) - (a.topup || 0));
  await env.DATA.put('lb', JSON.stringify(lb.slice(0, 100)));
}


/* ---------- layout + texts ---------- */
const LAYOUT_DEFAULTS = {
  home: { hero: true, notices: true, products: true, recent: true },
  menu: { recharge: true, orders: true, referrals: true, profile: true },
  nav: { orders: true, addMoney: true, transactions: true, profile: true },
};
function cleanLayout(l) {
  const out = {};
  for (const g of Object.keys(LAYOUT_DEFAULTS)) { out[g] = {}; for (const k of Object.keys(LAYOUT_DEFAULTS[g])) out[g][k] = l && l[g] && typeof l[g][k] === 'boolean' ? l[g][k] : LAYOUT_DEFAULTS[g][k]; }
  return out;
}
function cleanTexts(t) {
  const out = {};
  if (t && typeof t === 'object') for (const k of Object.keys(TEXT_DEFAULTS)) { const v = clip(t[k], 200); if (v) out[k] = v; }
  return out;
}

/* ---------- theme + SEO ---------- */
const safeHex = (h) => (/^#[0-9a-f]{6}$/i.test(String(h || '')) ? String(h).toLowerCase() : '#0f766e');
const safeImg = (p) => (/^\/img\/[a-z0-9]{10,24}$/.test(String(p || '')) ? String(p) : '');
function shade(hex, p) { // p: -1 (black) .. 1 (white)
  const n = parseInt(hex.slice(1), 16), t = p < 0 ? 0 : 255, a = Math.abs(p);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round((t - v) * a + v));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
}
const escHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
async function renderShellHtml(env, url) {
  const s = await getSettings(env);
  const theme = safeHex(s.themeColor), logo = safeImg(s.logo);
  const title = escHtml(String(s.seoTitle || `${s.brandA} ${s.brandB}`).slice(0, 90));
  const desc = escHtml(String(s.seoDesc || '').slice(0, 300));
  const siteName = escHtml(`${s.brandA || ''} ${s.brandB || ''}`.trim());
  const img = logo ? escHtml(url.origin + logo) : '';
  const head = [
    `<title>${title}</title>`,
    `<meta name="description" content="${desc}">`,
    `<meta name="theme-color" content="${theme}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${siteName}">`,
    `<meta property="og:title" content="${title}">`,
    `<meta property="og:description" content="${desc}">`,
    `<meta property="og:url" content="${escHtml(url.origin + '/')}">`,
    img ? `<meta property="og:image" content="${img}">` : '',
    `<meta name="twitter:card" content="${img ? 'summary_large_image' : 'summary'}">`,
    `<meta name="twitter:title" content="${title}">`,
    `<meta name="twitter:description" content="${desc}">`,
    img ? `<meta name="twitter:image" content="${img}">` : '',
    logo ? `<link rel="icon" href="${logo}">` : '',
    logo ? `<link rel="apple-touch-icon" href="${logo}">` : '',
    `<link rel="canonical" href="${escHtml(url.origin + '/')}">`,
    `<style>:root{--brand:${theme};--brand2:${shade(theme, 0.28)};--brand-d:${shade(theme, -0.25)}}</style>`,
  ].filter(Boolean).join('\n');
  return APP_HTML.replace(/\{\{V\}\}/g, VERSION).replace('<!--HEAD-->', head);
}

/* ---------------- router ---------------- */
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const path = url.pathname;
    const secure = url.protocol === 'https:';
    try {
      if (path.startsWith('/api/auth/')) return await handleAuth(req, env, url, path, secure);
      if (path.startsWith('/auth/google/')) return await handleGoogle(req, env, url, path, secure);
      const u = await userFromReq(req, env);
      if (path.startsWith('/api/admin/')) return await handleAdmin(req, env, url, path, u);
      if (path.startsWith('/api/')) return await handleApi(req, env, url, path, u, secure);

      if (path === '/app.css') return text(APP_CSS, 'text/css; charset=utf-8', 'public, max-age=31536000, immutable');
      if (path === '/app.js') return text(APP_JS_OUT, 'text/javascript; charset=utf-8', 'public, max-age=31536000, immutable');
      if (path === '/admin.css') return text(ADMIN_CSS, 'text/css; charset=utf-8', 'public, max-age=31536000, immutable');
      if (path === '/admin.js') return text(ADMIN_JS_OUT, 'text/javascript; charset=utf-8', 'public, max-age=31536000, immutable');
      if (path === '/admin' || path === '/admin/')
        return text(ADMIN_HTML.replace(/\{\{V\}\}/g, VERSION), 'text/html; charset=utf-8', 'no-store', 200, { 'x-robots-tag': 'noindex' });
      if (path === '/robots.txt') return text('User-agent: *\nDisallow: /admin\n', 'text/plain', 'public, max-age=86400');
      if (path.startsWith('/img/')) {
        const id = path.slice(5);
        if (/^[a-z0-9]{10,24}$/.test(id)) {
          const { value, metadata } = await env.DATA.getWithMetadata('media:' + id, { type: 'arrayBuffer' });
          if (value) return new Response(value, { headers: { 'content-type': (metadata && metadata.type) || 'image/jpeg', 'cache-control': 'public, max-age=31536000, immutable', ...BASE_HEADERS } });
        }
        return new Response('Not found', { status: 404 });
      }
      // SPA: everything else serves the app shell
      return text(await renderShellHtml(env, url), 'text/html; charset=utf-8', 'no-store');
    } catch (e) {
      return json({ ok: false, error: 'server', message: String(e && e.message || e) }, 500);
    }
  },
  async scheduled(event, env, ctx) {
    ctx.waitUntil(retryApiQueue(env).catch(() => {}));
  },
};
