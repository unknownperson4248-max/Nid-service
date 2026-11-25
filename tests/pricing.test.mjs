// Unit tests for the shared pricing engine. Loads the real src/pricing.js source.
import { readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const src = readFileSync(new URL('../src/pricing.js', import.meta.url), 'utf8');
const tmp = join(tmpdir(), 'wz_pricing_' + process.pid + '.mjs');
writeFileSync(tmp, src);
const { wzPrice, PRICING_JS, pricingSnapshot } = await import(tmp);

let pass = 0, fail = 0;
const eq = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); ok ? pass++ : fail++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : `  got=${JSON.stringify(got)} want=${JSON.stringify(want)}`)); };
const amt = (svc, vals) => { const r = wzPrice(svc, vals); return r.ok ? r.amount : r.err; };

// --- MODE A: fixed (must equal the old behaviour)
const gp = { price: 80, fields: [] };
eq('fixed GP SIM ৳80', amt(gp, {}), 80);
eq('fixed NID ৳330', amt({ price: 330 }, {}), 330);
eq('fixed ignores a sent quantity', amt(gp, { quantity: 99999 }), 80);
const glory = { price: 0, fields: [{ key: 'region', type: 'select', options: [{ label: 'BD', value: 'bd', price: 0 }] }, { key: 'duration', type: 'select', options: [{ label: '8h', value: '8h', price: 120 }, { label: '16h', value: '16h', price: 240 }] }] };
eq('fixed + dropdown 8h = 120', amt(glory, { region: 'bd', duration: '8h' }), 120);
eq('fixed + dropdown 16h = 240', amt(glory, { region: 'bd', duration: '16h' }), 240);
eq('fixed + unknown option = 0 add-on', amt(glory, { duration: 'hack' }), 0);
eq('fixed + priceFromValue', amt({ price: 10, fields: [{ key: 'n', type: 'number', priceFromValue: true }] }, { n: '25' }), 35);

// --- MODE B: quantity based (spec examples)
const fb = { pricing: { mode: 'qty', baseQty: 1000, basePrice: 70, minQty: 100, maxQty: 50000, step: 100 } };
for (const [q, want] of [[1000, 70], [2000, 140], [5000, 350], [10000, 700], [50000, 3500]]) eq(`qty ${q} = ৳${want}`, amt(fb, { quantity: q }), want);
eq('qty string input "2,000"', amt(fb, { quantity: '2,000' }), 140);
eq('qty below min', amt(fb, { quantity: 50 }), 'qty_min');
eq('qty above max', amt(fb, { quantity: 50100 }), 'qty_max');
eq('qty bad step 1050', amt(fb, { quantity: 1050 }), 'qty_step');
eq('qty decimal rejected', amt(fb, { quantity: 1000.5 }), 'qty_invalid');
eq('qty negative rejected', amt(fb, { quantity: -1000 }), 'qty_invalid');
eq('qty text rejected', amt(fb, { quantity: 'abc' }), 'qty_invalid');
eq('qty missing', amt(fb, {}), 'qty_required');
eq('qty rounding 1234@70/1000 = 86.38 -> 86', amt({ pricing: { mode: 'qty', baseQty: 1000, basePrice: 70 } }, { quantity: 1234 }), 86);
eq('qty rounding half up 1250@70/1000 = 87.5 -> 88', amt({ pricing: { mode: 'qty', baseQty: 1000, basePrice: 70 } }, { quantity: 1250 }), 88);
eq('qty decimal base price 0.35/1 x 300 = 105', amt({ pricing: { mode: 'qty', baseQty: 1, basePrice: 0.35 } }, { quantity: 300 }), 105);
eq('qty float-safe 0.1+0.2 style: 0.07/1 x 1000 = 70', amt({ pricing: { mode: 'qty', baseQty: 1, basePrice: 0.07 } }, { quantity: 1000 }), 70);
eq('qty ignores product.price', amt({ price: 999, pricing: { mode: 'qty', baseQty: 1000, basePrice: 70 } }, { quantity: 1000 }), 70);
eq('qty missing base config', amt({ pricing: { mode: 'qty', baseQty: 0, basePrice: 70 } }, { quantity: 1000 }), 'config');
eq('qty independent per product', amt({ pricing: { mode: 'qty', baseQty: 500, basePrice: 40 } }, { quantity: 1000 }), 80);

// --- MODE C: custom formula
const f1 = { pricing: { mode: 'formula', base: 20, rate: 0.05, pct: 10, minCharge: 50, maxCharge: 500, useQty: true, minQty: 1 } };
eq('formula (20 + .05*1000)*1.10 = 77', amt(f1, { quantity: 1000 }), 77);
eq('formula min charge 50', amt(f1, { quantity: 10 }), 50);
eq('formula max charge 500', amt(f1, { quantity: 100000 }), 500);
eq('formula negative adjustment -10%', amt({ pricing: { mode: 'formula', base: 100, pct: -10 } }, {}), 90);
eq('formula without quantity = base only', amt({ pricing: { mode: 'formula', base: 150 } }, { quantity: 5 }), 150);

// --- optional features stay OFF unless configured, and work when set
eq('min order amount blocks', amt({ pricing: { mode: 'qty', baseQty: 1000, basePrice: 70, minAmount: 100 } }, { quantity: 1000 }), 'amount_min');
eq('max order amount blocks', amt({ pricing: { mode: 'qty', baseQty: 1000, basePrice: 70, maxAmount: 100 } }, { quantity: 2000 }), 'amount_max');
eq('discount tier 10% at >=5000', amt({ pricing: { mode: 'qty', baseQty: 1000, basePrice: 70, tiers: [{ minQty: 5000, pct: 10 }] } }, { quantity: 5000 }), 315);
eq('discount tier not reached', amt({ pricing: { mode: 'qty', baseQty: 1000, basePrice: 70, tiers: [{ minQty: 5000, pct: 10 }] } }, { quantity: 4000 }), 280);
eq('expired promo ignored', wzPrice({ price: 100, pricing: { promo: { pct: 50, until: 1000 } } }, {}, 5000).amount, 100);
eq('active promo applies', wzPrice({ price: 100, pricing: { promo: { pct: 50, until: 9000 } } }, {}, 5000).amount, 50);

// --- browser copy is the same source and computes the same numbers
const browserWz = new Function(PRICING_JS + 'return wzPrice;')();
for (const [svc, v] of [[fb, { quantity: 5000 }], [f1, { quantity: 1000 }], [glory, { duration: '16h' }], [gp, {}]]) eq('browser == server ' + JSON.stringify(v), browserWz(svc, v).amount, wzPrice(svc, v).amount);

// --- snapshot keeps the rate that was used
const r = wzPrice(fb, { quantity: 2000 });
const snap = pricingSnapshot(fb, r);
eq('snapshot freezes mode/qty/total/rate', [snap.mode, snap.qty, snap.total, snap.cfg.baseQty, snap.cfg.basePrice], ['qty', 2000, 140, 1000, 70]);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
