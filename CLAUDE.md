# CLAUDE.md — Ultimate POS Migration Project

## Project Overview

Migration from a Laravel/PHP POS application (`superpos`) to a modern TypeScript stack.

| Layer | Technology | Location |
|---|---|---|
| API | NestJS + Prisma + MySQL | `ultimate-pos-api/` |
| Frontend | Angular 21 SPA | `ultimate-pos-web/` |
| Laravel source | PHP (read-only reference) | `/opt/homebrew/var/www/superpos/` |

## Running the Project

```bash
# API (NestJS)
cd ultimate-pos-api
npm run start:dev        # dev server on :3000
npm run build            # production build
npm run test             # unit tests
npm run test:e2e         # integration tests

# Frontend (Angular)
cd ultimate-pos-web
ng serve                 # dev server on :4200
```

```bash
# runapp.sh at root starts both
./runapp.sh
```

## Key Files

| File | Purpose |
|---|---|
| `ultimate-pos-api/prisma/schema.prisma` | Database schema (source of truth) |
| `ultimate-pos-api/src/app.module.ts` | NestJS root module |
| `ultimate-pos-api/src/main.ts` | Bootstrap + Swagger + global pipes |
| `schema-current.sql` | MySQL dump snapshot |
| `Plans/Plan-Checklist.md` | Migration progress tracker |

## Architecture

### API Layer Structure (Clean Architecture)

```
src/
  <module>/
    dto/              ← request/response contracts (validation via class-validator)
    services/         ← sub-services (state machine, ref numbers, etc.)
    <module>.service.ts      ← application logic
    <module>.controller.ts   ← HTTP layer (guards, decorators)
    <module>.module.ts       ← DI wiring
    <module>.service.spec.ts ← unit tests
  common/
    filters/          ← global exception filter
    interceptors/     ← response normalizer, request logger
    dto/              ← shared response shapes
  prisma/             ← PrismaService wrapper
  auth/               ← JWT + guards + strategies
```

### Transaction Abstraction

The codebase uses a **unified transaction layer** (`src/transactions/`) that normalizes five
underlying Prisma models (`Sale`, `Purchase`, `Expense`, `StockTransfer`, `StockAdjustment`)
into a single `TransactionDto`. The dedicated modules (`sales/`, `purchases/`, `payments/`,
`inventory/`) sit above this layer and add domain-specific logic.

### State Machine

All transactions follow this state graph (enforced by `TransactionStateService`):

```
draft ──→ final | received | completed | cancelled
pending/ordered ──→ received | completed | cancelled
final | received | completed ──→ cancelled
```

Locked statuses (`final`, `received`, `completed`, `cancelled`) **cannot be edited**.

### Reference Numbers

Format: `{TYPE}-{YYYYMM}-{SEQUENCE}` (e.g. `SALE-202603-0001`)  
Managed by `RefNumberService` in `src/transactions/services/`.

### Auth

JWT Bearer tokens. Guards: `JwtAuthGuard` (default), `RolesGuard` for permission checks.  
Token decoded to `req.user` with `id`, `businessId`, `roles`.

## Database

- Engine: MySQL 8
- ORM: Prisma (schema at `ultimate-pos-api/prisma/schema.prisma`)
- Multi-tenancy: all business data filtered by `businessId`
- Soft deletes: `deletedAt` field pattern (not hard delete)

## API Standards

- Base URL: `/api`
- Auth header: `Authorization: Bearer <token>`
- Response envelope: `{ success, message, data, timestamp, statusCode }`
- Error envelope: `{ success: false, message, error, timestamp, statusCode }`
- Swagger: `http://localhost:3000/api/docs`

## Plans Folder

Weekly day-by-day implementation plans for the full migration.  
Master tracker: `Plans/Plan-Checklist.md`

## Laravel Source Reference

Read-only. Use to understand original business rules when implementing a new module.

```bash
ls /opt/homebrew/var/www/superpos/app/Http/Controllers/
ls /opt/homebrew/var/www/superpos/app/Models/
```
