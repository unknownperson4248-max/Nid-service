/*
 * WIZE NEX hybrid pricing engine.
 *
 * One pure function is the single source of truth for prices:
 *   - the worker calls it to compute the authoritative order amount
 *   - the browser gets the exact same source (via Function#toString) for the live preview
 * So it must stay self-contained: no imports, no outer variables, no eval.
 *
 * Money is handled in integer paisa and rounded once to whole taka (half up),
 * because wallet balances are whole taka.
 *
 * svc.pricing (optional; missing = fixed price, exactly the old behaviour):
 *   mode: 'fixed' | 'qty' | 'formula'
 *   qtyKey: field name that carries the quantity (default 'quantity')
 *   qtyLabel: label shown to the customer
 *   minQty, maxQty (0 = no limit), step
 *   qty mode:     baseQty, basePrice            total = qty / baseQty * basePrice
 *   formula mode: base, rate, pct, minCharge, maxCharge, useQty
 *                 total = clamp((base + rate*units) * (100+pct)/100, minCharge, maxCharge)
 *   optional, off unless set: tiers [{minQty, pct}], promo {pct, until}, minAmount, maxAmount
 */
export function wzPrice(svc, vals, nowMs) {
  vals = vals || {};
  var num = function (v, d) {
    var n = typeof v === 'number' ? v : parseFloat(String(v == null ? '' : v).replace(/,/g, '').trim());
    return isFinite(n) ? n : d;
  };
  var toPaisa = function (bdt) { return Math.round(num(bdt, 0) * 100); };
  var pctOff = function (p, pct) { pct = Math.min(100, Math.max(0, num(pct, 0))); return Math.round(p * (100 - pct) / 100); };
  var fail = function (mode, err, qty) { return { ok: false, mode: mode, err: err, qty: qty == null ? null : qty, amount: 0 }; };

  // sub-products: a product may hold variants (e.g. Facebook -> Followers / Likes / Views),
  // each with its own price config; the customer's choice arrives as vals.variant (the variant id)
  var variant = null;
  var vlist = (svc && Array.isArray(svc.variants)) ? svc.variants : [];
  var hasV = false;
  for (var vi = 0; vi < vlist.length; vi++) {
    if (!vlist[vi] || vlist[vi].active === false) continue;
    hasV = true;
    if (String(vlist[vi].id) === String(vals.variant == null ? '' : vals.variant)) variant = vlist[vi];
  }
  if (hasV && !variant) return { ok: false, mode: 'fixed', err: 'variant_required', qty: null, amount: 0 };
  if (variant) svc = { price: variant.price, pricing: variant.pricing, fields: svc.fields };

  var P = (svc && svc.pricing && typeof svc.pricing === 'object') ? svc.pricing : {};
  var mode = (P.mode === 'qty' || P.mode === 'formula') ? P.mode : 'fixed';
  var qKey = String(P.qtyKey || 'quantity');

  // add-ons from the product's own boxes (same rules as the original fixed pricing)
  var add = 0;
  var fields = (svc && Array.isArray(svc.fields)) ? svc.fields : [];
  for (var i = 0; i < fields.length; i++) {
    var f = fields[i];
    if (!f || (mode !== 'fixed' && f.key === qKey)) continue;
    var v = vals[f.key];
    if (v == null || v === '') continue;
    if (f.type === 'select') {
      var opts = f.options || [];
      for (var j = 0; j < opts.length; j++) {
        if ((opts[j].value || opts[j].label) === v) { if (typeof opts[j].price === 'number') add += toPaisa(opts[j].price); break; }
      }
    } else if (f.type === 'number' && f.priceFromValue) {
      var nv = num(v, NaN); if (isFinite(nv)) add += toPaisa(nv);
    }
    if (typeof f.price === 'number' && f.price > 0) add += toPaisa(f.price);
  }

  var core = 0, qty = null;
  if (mode === 'fixed') {
    core = toPaisa(svc && svc.price);
  } else {
    var needQty = mode === 'qty' || !!P.useQty;
    var units = 1;
    if (needQty) {
      var stepBase = Math.max(0, Math.floor(num(P.minQty, 0)));
      var minQ = Math.max(1, stepBase);
      var maxQ = Math.floor(num(P.maxQty, 0));
      var step = Math.max(1, Math.floor(num(P.step, 1)));
      var raw = vals[qKey];
      if (raw == null || String(raw).trim() === '') return fail(mode, 'qty_required');
      var q = num(raw, NaN);
      if (!isFinite(q) || q <= 0 || Math.floor(q) !== q) return fail(mode, 'qty_invalid');
      if (q < minQ) return fail(mode, 'qty_min', q);
      if (maxQ > 0 && q > maxQ) return fail(mode, 'qty_max', q);
      if ((q - stepBase) % step !== 0) return fail(mode, 'qty_step', q);
      units = q; qty = q;
    }
    if (mode === 'qty') {
      var bq = num(P.baseQty, 0), bp = num(P.basePrice, NaN);
      if (!(bq > 0) || !isFinite(bp) || bp < 0) return fail(mode, 'config', qty);
      core = Math.round(units * toPaisa(bp) / bq);
    } else {
      var c = toPaisa(P.base) + Math.round(num(P.rate, 0) * 100 * units);
      c = Math.round(c * (100 + num(P.pct, 0)) / 100);
      var minC = num(P.minCharge, 0), maxC = num(P.maxCharge, 0);
      if (minC > 0) c = Math.max(c, toPaisa(minC));
      if (maxC > 0) c = Math.min(c, toPaisa(maxC));
      core = Math.max(0, c);
    }
    // optional quantity discount tiers: the highest tier reached applies
    if (qty != null && Array.isArray(P.tiers) && P.tiers.length) {
      var best = null;
      for (var t = 0; t < P.tiers.length; t++) {
        var tr = P.tiers[t]; if (!tr) continue;
        if (qty >= num(tr.minQty, Infinity) && (!best || num(tr.minQty, 0) > num(best.minQty, 0))) best = tr;
      }
      if (best) core = pctOff(core, best.pct);
    }
  }
  // optional promotion (only while active)
  if (P.promo && num(P.promo.pct, 0) > 0 && (!P.promo.until || num(P.promo.until, 0) > (nowMs || Date.now()))) core = pctOff(core, P.promo.pct);

  var amount = Math.round((core + add) / 100);
  var minA = num(P.minAmount, 0), maxA = num(P.maxAmount, 0);
  if (minA > 0 && amount < minA) return fail(mode, 'amount_min', qty);
  if (maxA > 0 && amount > maxA) return fail(mode, 'amount_max', qty);
  return { ok: true, mode: mode, qty: qty, amount: amount, core: core / 100, addons: add / 100, variant: variant ? String(variant.id) : null };
}

// the browser copy: identical source, defined as a global before the app script runs.
// Wrangler's bundler (esbuild keepNames) wraps inner functions in __name(...), so the browser
// needs that tiny helper too, otherwise the served copy would throw a ReferenceError.
export const PRICING_JS = 'var __name = __name || function (f, n) { try { Object.defineProperty(f, "name", { value: n, configurable: true }); } catch (e) {} return f; };\n'
  + 'var wzPrice = ' + wzPrice.toString() + ';\n';

// the parts of the pricing config worth freezing on an order (a permanent snapshot)
export function pricingSnapshot(svc, r) {
  var P = (svc && svc.pricing) || {};
  var keep = ['qtyKey', 'minQty', 'maxQty', 'step', 'baseQty', 'basePrice', 'base', 'rate', 'pct', 'minCharge', 'maxCharge', 'useQty', 'tiers', 'promo', 'minAmount', 'maxAmount'];
  var cfg = {};
  for (var i = 0; i < keep.length; i++) if (P[keep[i]] != null) cfg[keep[i]] = P[keep[i]];
  if (r.mode === 'fixed') cfg.price = +(svc && svc.price) || 0;
  return { mode: r.mode, qty: r.qty, core: r.core, addons: r.addons, total: r.amount, cfg: cfg, at: Date.now() };
}

// server helper: the active sub-product a customer picked (same rule as the engine), or null
export function variantOf(svc, id) {
  var list = (svc && Array.isArray(svc.variants)) ? svc.variants : [];
  for (var i = 0; i < list.length; i++) if (list[i] && list[i].active !== false && String(list[i].id) === String(id == null ? '' : id)) return list[i];
  return null;
}
export function hasVariants(svc) {
  return !!(svc && Array.isArray(svc.variants) && svc.variants.some(function (v) { return v && v.active !== false; }));
}
