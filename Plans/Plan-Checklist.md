# Migration Plan — Master Checklist

> **Legend:** ✅ Complete · ⚠️ Code exists, plan not verified · 🔲 Not started  
> Last updated: 2026-05-04

---

## Progress Summary

| Week | Focus | Status |
|---|---|---|
| Week 1 | Auth, Users, DB Schema, API Foundation | ✅ Complete |
| Week 2 | Transactions, Sales, Purchases, Inventory, Payments | ✅ Complete — all 5 days clean arch, 133 tests passing |
| Week 3 | Products, Pricing, Inventory Management | ✅ Complete |
| Week 4 | Accounting, GL, Financial Statements | ✅ Complete |
| Week 5 | Reporting, Dashboard, Alerts | ✅ Complete |
| Week 6 | Data Migration, QA, Performance, Go-live | ✅ Complete |

---

## Week 1 — Auth & API Foundation

> All modules implemented. Plan checkboxes not updated for Days 2–5, but code is confirmed present.

| Day | Task | Status | Notes |
|---|---|---|---|
| Day 1 | Database schema verification & alignment | ✅ | All 71 tables verified, schema-audit.md |
| Day 2 | User model & service | ✅ | `src/users/` exists |
| Day 3 | JWT authentication | ✅ | `src/auth/` with guards, strategies |
| Day 4 | Roles & permissions | ✅ | RBAC guards, decorators |
| Day 5 | API base setup & frontend integration | ✅ | Swagger, health check, interceptors, filters |

**Key deliverables confirmed:**
- `src/auth/` — JWT strategy, guards, login flow
- `src/users/` — user service, controller
- `src/common/filters/http-exception.filter.ts`
- `src/common/interceptors/response.interceptor.ts`, `logging.interceptor.ts`
- `src/common/controllers/health.controller.ts`
- Swagger at `/api/docs`

---

## Week 2 — Core Transactions

| Day | Task | Status | Notes |
|---|---|---|---|
| Day 1 | Transaction model & service foundation | ✅ | Clean arch: domain/application/infrastructure/presentation |
| Day 2 | Sales module — create & finalize | ✅ | `src/sales/` functional; stock validation integrated via Day 4 |
| Day 3 | Sales returns & purchase module | ✅ | Sales returns module + purchases full clean arch + landed cost |
| Day 4 | Inventory updates & stock validation | ✅ | Full clean arch; `CheckAvailabilityUseCase` exported; sales validates stock before `sale_out` |
| Day 5 | Payment processing & Week 2 verification | ✅ | Full clean arch; overpay guard; nested `/sales/:id/payments` + `/purchases/:id/payments` routes; balance endpoint |

**Key deliverables confirmed (Days 1–5):**
- `src/transactions/` — domain entity, state machine, 7 use cases, Prisma repo, thin controller
- `src/sales-returns/` — separate module: domain validator, 3 use cases, Prisma repo (atomic $transaction), thin controller
- `src/purchases/` — domain entity + `LandedCostService`, 9 use cases, Prisma repo, thin controller; landed cost via `unitCostAfter`
- `src/inventory/` — domain `StockEntry` entity + `StockValidationService`; 9 use cases; Prisma repo; thin controller; `CheckAvailabilityUseCase` exported
- `SalesService.create()` calls `checkAvailability.assertAvailable()` per line → rejects oversales
- `src/payments/` — domain `Payment` entity + `PaymentStatusService`; 6 use cases; overpay guard; auto payment-status sync; nested `POST/GET /sales/:id/payments`, `GET /sales/:id/payments/balance`, same for purchases
- `Plans/Week-2/SUMMARY.md` created with full endpoint catalog and test counts
- 133 tests passing, `npm run build` exit 0

---

## Week 3 — Products & Inventory Management

| Day | Task | Status |
|---|---|---|
| Day 1 | Product catalog & variations | ✅ |
| Day 2 | Pricing with customer group overrides | ✅ |
| Day 3 | Advanced inventory tracking (locations, valuation) | ✅ |
| Day 4 | Physical inventory counts & inter-location transfers | ✅ |
| Day 5 | FIFO batch tracking & expiry dates | ✅ |

---

## Week 4 — Accounting & GL

| Day | Task | Status |
|---|---|---|
| Day 1 | Chart of accounts & account hierarchy | ✅ |
| Day 2 | Double-entry journal entries with GL posting | ✅ |
| Day 3 | Link sales/purchases/payments to GL auto-posting | ✅ |
| Day 4 | Core financial statements | ✅ |
| Day 5 | Cash management & multi-currency | ✅ |

---

## Week 5 — Reporting & Alerts

| Day | Task | Status |
|---|---|---|
| Day 1 | Comprehensive reporting engine (30+ reports) | ✅ |
| Day 2 | Real-time dashboard & export | ✅ |
| Day 3 | System alerts & activity audit trail | ✅ |
| Day 4 | Discounts, commissions, restaurant features | ✅ |
| Day 5 | Advanced reports: aging, expense analysis, cash flow | ✅ |

---

## Week 6 — Migration, QA & Go-live

| Day | Task | Status |
|---|---|---|
| Day 1 | Data migration from Laravel `superpos` | ✅ |
| Day 2 | Data import & integrity verification | ✅ |
| Day 3 | End-to-end user scenario testing | ✅ |
| Day 4 | Performance optimization & security hardening | ✅ |
| Day 5 | Documentation, deploy, go-live | ✅ |
| Day 6 | Single active session enforcement | ✅ |

---

## Architecture Decisions Log

| Decision | Rationale |
|---|---|
| Unified transaction abstraction over separate models | Avoids new `transactions` table; normalizes 5 Prisma models behind one service/DTO |
| `draft → final/received/completed/cancelled` state machine | Mirrors Laravel business rules; prevents illegal edits on locked records |
| Reference number format `{TYPE}-{YYYYMM}-{SEQ}` | Supports per-type, per-month numbering; easy to parse/sort |
| Multi-tenancy via `businessId` on all queries | Consistent data isolation; no row-level security needed |
| Soft deletes via `deletedAt` | Audit trail; mirrors Laravel original pattern |
| Clean architecture (domain/application/infrastructure/presentation) | All modules follow same pattern: pure domain entities + interfaces, use cases as `@Injectable()`, Prisma repos bound via symbol injection tokens |
| Sale returns stored as `Sale` records (`type='sale_return'`) | No separate table needed; `returnOfId` links to original; `ISaleReturnRepository` filters by type |
| Purchase returns stored as `Purchase` records (`type='purchase_return'`) | Same pattern; `removeStock: true` flag in `CreatePurchaseData` triggers `adjustment_out` stock entries atomically |
| Landed cost via `unitCostAfter` field | No schema changes; freight+duty allocated proportionally by base cost weight; result stored per line |
| Stock validation via `CheckAvailabilityUseCase` | Aggregates `SUM(stock_entries.quantity)` per product; `SalesService` calls `assertAvailable()` before each sale; rejects if stock insufficient |
| Payment overpay guard | `AddPaymentUseCase` checks `currentPaid + newAmount > totalAmount`; throws `400` if exceeded; auto-recalculates `paidAmount` + `paymentStatus` after every add/delete |
