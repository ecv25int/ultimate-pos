# Ultimate POS — Production Deployment & Go-Live Guide

This document is the official operational runbook and deployment manual for migrating the **Ultimate POS** application (NestJS backend API and Angular frontend) to a production environment.

---

## 1. System Architecture Overview

Ultimate POS is built with a decoupled architecture designed for high scalability, security, and performance.

- **Frontend Application**: Angular 21 Single Page Application (SPA), compiled to static HTML/CSS/JS, served via Nginx or a Content Delivery Network (CDN) like Cloudflare or AWS CloudFront.
- **Backend API**: NestJS 10 REST API running on Node.js 22+, built on top of Express. Capped with `ValidationPipe` for request sanitation.
- **Database Layer**: MySQL 8.0, managed with Prisma ORM. Indexes are optimized for barcode searches (`sku`, `subSku`), soft delete columns (`deletedAt`), and location-based reporting.
- **Cache Layer**: Redis, managed via `@nestjs/cache-manager`.
  - **Dashboard KPIs**: Cached for 1 minute (`60_000` ms) to reduce database load on home page reloads.
  - **Product Catalog**: Cached for 5 minutes (`300_000` ms).
  - **Exchange Rates**: Cached for 24 hours (`86_400_000` ms).

---

## 2. Production Environment Configuration

Create a production `.env` file in the `ultimate-pos-api/` directory. **Do not commit this file to version control.**

```env
# ── Node Settings ─────────────────────────────────────────────────────────────
NODE_ENV=production
PORT=3000

# ── Database Connection ───────────────────────────────────────────────────────
# In production, use a secure connection string with SSL enabled
DATABASE_URL="mysql://pos_prod_user:SECURE_PASSWORD@prod-db-host.rds.amazonaws.com:3306/ultimate_pos_prod?sslaccept=strict"

# ── JWT Authentication ────────────────────────────────────────────────────────
# Generate strong, random 256-bit strings for secrets
JWT_SECRET="YOUR_SUPER_SECRET_PRODUCTION_ACCESS_TOKEN_KEY"
JWT_REFRESH_SECRET="YOUR_SUPER_SECRET_PRODUCTION_REFRESH_TOKEN_KEY"

# ── CORS Policy ───────────────────────────────────────────────────────────────
# Whitelist only the domain hosting the Angular web application
FRONTEND_URL="https://ultimatepos.com"

# ── Mail Configuration (Nodemailer) ───────────────────────────────────────────
MAIL_HOST="smtp.mailgun.org"
MAIL_PORT=587
MAIL_USER="postmaster@ultimatepos.com"
MAIL_PASS="SMTP_PASSWORD"
```

---

## 3. Database Maintenance & Backups

Daily database backups are handled natively in the NestJS application via the `BackupService` scheduler.

### Daily Backup Schedule
- **Frequency**: Every day at 2:00 AM server time (via `@Cron(CronExpression.EVERY_DAY_AT_2AM)`).
- **Execution**: The scheduler spawns a `mysqldump` subprocess using `--single-transaction`, `--triggers`, and `--routines` flags to generate a crash-consistent SQL file. The file is piped through a Gzip stream and saved to `ultimate-pos-api/backups/backup-YYYY-MM-DD-HH-MM-SS.sql.gz`.
- **Retention Policy**: Backups older than 14 days are automatically pruned from the disk to manage storage usage.

### Manual Backup Generation
An administrator can trigger an on-demand backup by calling the backup endpoint:
```bash
curl -X POST https://api.ultimatepos.com/api/backup \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### Staging Recovery & Verification
To test a backup or restore a database in a staging environment:
```bash
curl -X POST https://api.staging.ultimatepos.com/api/backup/restore \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -F "file=@backup-2026-06-21-02-00-00.sql.gz"
```
> [!WARNING]  
> Database restores via API are strictly disabled in production (`NODE_ENV=production`) for security. In production, restore backups manually via raw MySQL client tools:
> `gunzip -c backup-xxx.sql.gz | mysql -u root -p ultimate_pos_prod`

---

## 4. Security Hardening

### HTTP Headers (Helmet)
We use `helmet()` middleware globally to set secure headers:
- Disables `X-Powered-By` (hides NestJS/Express fingerprints).
- Enforces HTTP Strict Transport Security (HSTS).
- Configures Content Security Policy (CSP).

### Rate Limiting (Throttler)
Rate limits protect the application from Denial of Service (DoS) and brute force attacks:
- **Global limit**: 120 requests per minute per IP.
- **Login limit**: Capped at 100 requests per minute per IP.

### CORS Rules
Only the origin defined in `FRONTEND_URL` is allowed to submit requests. Requests with credentials (cookies, auth headers) are permitted only for the whitelisted origin.

### SSL/TLS Configuration
Nginx should act as a reverse proxy, termination endpoint, and SSL handler.
Example Nginx Block:
```nginx
server {
    listen 443 ssl http2;
    server_name api.ultimatepos.com;

    ssl_certificate /etc/letsencrypt/live/ultimatepos.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ultimatepos.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 5. Go-Live Cutover Protocol

Follow these steps exactly on the cutover date to transition from the legacy Laravel system (`superpos`) to NestJS (`ultimate-pos`):

### Phase 1: Preparation (T-minus 2 hours)
1. Notify all users of planned maintenance and system downtime.
2. Put the legacy Laravel application into maintenance mode:
   ```bash
   php artisan down
   ```

### Phase 2: Data Extraction & Export (T-minus 1 hour)
1. Perform a full backup of the legacy MySQL database.
2. Run the legacy Laravel pos-export command:
   ```bash
   php artisan pos:exportLegacy
   ```
3. Copy all JSON output files from `/opt/homebrew/var/www/superpos/migration-data/` to the NestJS server under `ultimate-pos-api/migration-data/`.

### Phase 3: Import & Validation (T-minus 30 minutes)
1. Run the NestJS import/migration script:
   ```bash
   cd ultimate-pos-api
   npx ts-node scripts/import-legacy-data.ts
   ```
2. Verify import count matches: Check script output log to ensure row counts on users, products, sales, purchases, and GL accounts align with Laravel counts.
3. Seed standard GL accounts:
   ```bash
   curl -X POST https://api.ultimatepos.com/api/accounts/seed \
     -H "Authorization: Bearer ADMIN_JWT_TOKEN"
   ```

### Phase 4: DNS Switchover & Verification
1. Update DNS records (or load balancer targets) to point `ultimatepos.com` to the new Angular web build and `api.ultimatepos.com` to the new NestJS service.
2. Test critical paths:
   - Login as admin and cashier.
   - Scan products in the POS cart and verify successful stock decrement upon checkouts.
   - Verify double-entry GL ledger balances.

---

## 6. Rollback Plan

If critical, unresolvable issues occur during the go-live window, follow this rollback procedure:

1. Revert DNS changes back to point `ultimatepos.com` to the legacy Laravel server.
2. In the Laravel codebase, disable maintenance mode:
   ```bash
   php artisan up
   ```
3. Notify users that the migration has been postponed and the system is back online.
