# WizeFF TopUp

A game top-up, social-media (SMM) and mobile-recharge reseller panel built on a single Cloudflare Worker + KV.

- Customer app: wallet, services with admin-configurable order forms, orders, deposits (manual approval), referrals, profile. Bangla + English.
- Admin panel (`/admin`): services & dynamic form builder, orders, deposit approval, users & balance, notices, settings (brand, payment numbers, referral bonus).

## Develop
```
npm install
npx wrangler dev
npx wrangler deploy
```
The first account to register becomes the admin. Set payment numbers from Admin → Settings before taking deposits.
