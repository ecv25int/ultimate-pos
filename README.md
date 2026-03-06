# Ultimate POS

A full-featured Point of Sale system built with **NestJS** (API) and **Angular** (frontend).

---

## Stack

| Layer | Technology |
|---|---|
| Backend API | NestJS 10 + Prisma ORM + MySQL |
| Frontend | Angular 21 + Angular Material |
| Cache | Redis |
| Auth | JWT (access + refresh tokens) |
| Docs | Swagger `/api/docs` |

---

## Project Structure

```
well-known/
├── ultimate-pos-api/     ← NestJS REST API (port 3000)
├── ultimate-pos-web/     ← Angular SPA (port 4200)
├── database-exports/     ← Legacy DB SQL snapshots
├── scripts/              ← Data migration script
└── .github/workflows/    ← CI/CD (GitHub Actions)
```

---

## Quick Start (Local Development)

### Prerequisites
- Node.js 22+
- MySQL 8.0
- Redis 7

### 1. API
```bash
cd ultimate-pos-api
cp .env.example .env        # fill in DATABASE_URL, JWT_SECRET, etc.
npm install
npx prisma migrate deploy
npm run db:seed             # creates admin user + default data
npm run start:dev           # → http://localhost:3000
```

### 2. Frontend
```bash
cd ultimate-pos-web
npm install
npx ng serve --port 4200    # → http://localhost:4200
```

### Default credentials
| Username | Password | Role |
|---|---|---|
| `admin` | `admin123` | superadmin |

---

## API Documentation

Swagger UI available at **http://localhost:3000/api/docs** (development only).

OpenAPI JSON: `GET http://localhost:3000/api/docs-json`

---

## Running Tests

```bash
# NestJS unit tests (67 tests)
cd ultimate-pos-api && npm test

# Angular unit tests
cd ultimate-pos-web && npx ng test

# E2E tests (Playwright)
cd ultimate-pos-web && npm run e2e
```

---

## Data Migration (from Legacy Laravel DB)

```bash
# Set env vars for both DBs
export LEGACY_DB_URL=mysql://root:@localhost/ultimate_pos
export NEW_DB_URL=mysql://root:@localhost/ultimate_pos_new

# Run 11-step migration
cd scripts
npx ts-node migrate-legacy-data.ts
```

Steps: businesses → users → contacts → products → sales → purchases → payments → stock adjustments → sale lines → purchase lines → inventory.

---

## Environment Variables

See `ultimate-pos-api/.env.example` for all required variables.

Key variables:
- `DATABASE_URL` — MySQL connection string
- `JWT_SECRET` / `JWT_REFRESH_SECRET` — strong random secrets
- `FRONTEND_URL` — Angular origin for CORS (default: `http://localhost:4200`)
- `MAIL_HOST` / `MAIL_USER` / `MAIL_PASS` — SMTP config

---

## CI/CD

GitHub Actions workflow at `.github/workflows/ci.yml`:
- **api** job: TypeScript check + Jest (67 tests) + Prisma migrate
- **web** job: TypeScript check + Angular production build
- **e2e** job: Playwright end-to-end tests
