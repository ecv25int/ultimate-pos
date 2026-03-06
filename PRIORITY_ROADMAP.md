# Ultimate POS — Priority Roadmap

> Last updated: 6 March 2026
> **Status: All P0–P5 modules implemented and verified. NestJS + Angular 21 fully operational.**

---

## Module Implementation Status

All sprints (1–38) complete. Full NestJS + Angular migration done.

| Priority | Module | Status |
|----------|--------|--------|
| P0 | Authentication & Authorization | Done |
| P0 | User Management | Done |
| P0 | Business & Location Setup | Done |
| P0 | Database Schema (Prisma, 70+ models) | Done |
| P1 | Product Catalog + Variations | Done |
| P1 | Inventory Management | Done |
| P1 | Contact Management | Done |
| P1 | Purchase Orders (+ returns) | Done |
| P1 | Sales Module (+ returns, invoice) | Done |
| P1 | POS Interface | Done |
| P2 | Payment Processing | Done |
| P2 | Cash Register | Done |
| P2 | Reports & Analytics | Done |
| P2 | Invoice/PDF Generation | Done |
| P2 | Stock Adjustments | Done |
| P2 | Stock Transfers | Done |
| P3 | Notifications (Email/SMS/Push) | Done |
| P3 | Import/Export | Done |
| P3 | Barcode Generation | Done |
| P3 | Tax Management | Done |
| P4 | Restaurant Module | Done |
| P4 | Accounting Module | Done |
| P4 | CRM Module | Done |
| P4 | Manufacturing Module | Done |
| P4 | Repair Module | Done |
| P4 | Asset Management | Done |
| P5 | HMS (Hospital Mgmt) | Done |
| P5 | Project Management | Done |
| P5 | Essentials (HRM/Docs/Payroll) | Done |
| P5 | Superadmin Multi-tenant | Done |
| P5 | WooCommerce Sync (stub) | Done — real sync in Optional section below |

---

## Infrastructure & Quality — Completed

- [x] GitHub repo + CI pipeline (`.github/workflows/ci.yml` — 3 jobs: api, web, e2e)
- [x] ESLint + Prettier + TypeScript strict mode — API: `eslint.config.mjs` + `.prettierrc`; Angular: `eslint.config.js` + `.prettierrc` + `ng lint` (0 errors, 707 style warnings) + `format`/`format:check` scripts
- [x] Security hardening (8 Mar 2026) — JWT secrets throw on missing (no more `|| 'default-secret'`); BigInt.prototype.toJSON patch; req.user.id fixed in push + report-scheduler controllers; sendToBusiness() role filter fixed
- [x] Docker Compose — MySQL + Redis services
- [x] Nginx reverse proxy — HTTP :8080 redirects to HTTPS :8443 (mkcert local cert)
- [x] Redis running via Homebrew service (`brew services start redis`)
- [x] Prisma schema — 70+ models, 25+ performance indexes + `@@unique([businessId, invoiceNo])` on Sale + `@@unique([businessId, refNo])` on Purchase
- [x] DB seed — admin/manager/posuser, default business, tax rates, units, invoice layout
- [x] Swagger/OpenAPI — `/api/docs` live + `/api/docs-json` for Postman
- [x] Helmet, ThrottlerModule (per-route rate limits), CORS, input sanitization middleware
- [x] JWT auth + refresh tokens, login lockout (5 attempts/15 min), email verification
- [x] Session timeout dialog (25 min idle), remember-me (30/90d TTL), password strength meter
- [x] 67/67 NestJS unit tests passing (Auth, Sales, Purchases, Reports, Inventory)
- [x] 41/41 Angular unit tests passing
- [x] Playwright E2E — 3 spec files: auth.spec, products.spec, sales.spec
- [x] Redis caching — dashboard 5 min, products/POS 1 min, cache invalidation on writes
- [x] DB query optimisations (6 Mar 2026) — N+1 fix in `InventoryService.getSummary()` (3 parallel queries); app-code SUM replaced with DB-side `groupBy._sum` in `getStockOverview()`; invoice/ref number race condition fixed (`MAX(id)+1` via `$queryRaw` instead of `count()+1`)
- [x] VAPID push notification keys configured
- [x] Nginx config: `/opt/homebrew/etc/nginx/servers/ultimatepos.conf`
- [x] i18n — English + Arabic, RTL support, language switcher in header
- [x] Audit logging — `AuditLog` model, viewer in Settings > Audit Log
- [x] Backup & restore — daily cron at 2AM, 14-day retention, Settings > Backup page
- [x] Report scheduling — daily/weekly/monthly email dispatch, Settings > Scheduled Reports
- [x] Laravel fully deleted and replaced (6 Mar 2026) — tagged `v2.0.0-nestjs`

---

## Optional — Post-Stable Features

- [x] NestJS response compression — `compression` middleware active in `main.ts` (~60-80% smaller JSON payloads)
- [x] Prisma connection pool — `?connection_limit=10&pool_timeout=20` added to `DATABASE_URL` in `.env.example`
- [x] Nginx HTTP/2 — `http2` directive added to `listen 8443 ssl;` (enables multiplexing, zero-cost)
- [x] Angular `@for` migration — all `*ngFor` fully migrated; `barcode-print.component.ts` last 2 instances converted in previous session

### Payment Gateways
- [ ] Stripe — `stripe` npm; `POST /payments/stripe/charge` + webhook with signature verification
- [ ] PayPal — `@paypal/checkout-server-sdk`; order create + capture flow
- [ ] Razorpay (India market) — `razorpay` npm
- [ ] Payment webhook validation (verify `stripe-signature` / PayPal webhook ID headers)
- [ ] Angular payment method selector on checkout (Stripe Elements or redirect)

### WooCommerce Real Sync
- [ ] Store WooCommerce API credentials in `Business` settings (`wcUrl`, `wcKey`, `wcSecret`)
- [ ] `POST /woocommerce/sync/products` — push products to WooCommerce store
- [ ] `POST /woocommerce/sync/orders` — pull WC orders and create NestJS Sales
- [ ] `POST /woocommerce/webhook` — real-time order sync receiver
- [ ] Angular settings page for WooCommerce credentials

### PWA / Mobile
- [ ] Service Worker advanced caching (static assets + full product catalog offline)
- [ ] App manifest icon set (192px, 512px)
- [ ] "Add to Home Screen" prompt — `beforeinstallprompt` event

### Multi-tenant Billing
- [ ] Package plans (Free/Pro/Enterprise) — expose via `GET /superadmin/packages`
- [ ] Public business registration (`POST /auth/register-business`)
- [ ] Superadmin impersonation (`POST /superadmin/impersonate/:businessId`)
- [ ] Stripe subscription webhooks to update `Business.planId`

---

## Go-Live Checklist (Production deployment)

### Pre-Launch
- [ ] Run `npx prisma migrate deploy` on production MySQL server
- [ ] Configure production `.env` (real JWT secrets, SMTP creds, domain URL)
- [ ] Security audit (OWASP Top 10 scan)
- [ ] Load testing — 1000+ concurrent users
- [ ] Performance benchmarks — API < 200ms, page load < 2s
- [ ] Backup/rollback plan documented
- [ ] UAT with real users completed
- [ ] Training sessions conducted

### Launch Day
- [ ] Blue-Green deployment to VPS
- [ ] Configure Let's Encrypt SSL (Nginx production block in `ultimatepos.conf` — already written)
- [ ] Point domain DNS to server
- [ ] Smoke tests passed
- [ ] Monitor error rates (< 0.1%)

### Post-Launch (2 weeks)
- [ ] Daily error log review
- [ ] User satisfaction survey
- [x] Remove PHP from server — N/A (macOS dev machine; handled during server cleanup)

---

## Open Decisions

| Decision | Status |
|---|---|
| Deploy to AWS or DigitalOcean? | Pending |
| Public launch date? | Pending |
| Mobile app — native vs PWA? | Pending (PWA groundwork already done) |
| Microservices migration? | Post-launch only — monolith stable first |
| Laravel shutdown? | Done — deleted 6 Mar 2026 |
| Prisma or TypeORM? | Decided — Prisma in production |
| Angular Material or PrimeNG? | Decided — Angular Material in production |

---

*Last Updated: 8 March 2026*
