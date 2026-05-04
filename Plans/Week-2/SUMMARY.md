# Week 2 Summary — Core Transactions

## Status: ✅ Complete

All five days implemented in **clean architecture** (domain / application / infrastructure / presentation).

---

## Architecture Applied Consistently

Every module follows this structure:
```
src/<module>/
  domain/
    <entity>.entity.ts         ← pure TypeScript class, no NestJS deps
    <module>.repository.ts     ← IXxxRepository interface + data shapes
    <domain-service>.service.ts ← pure logic (state, validation, calculation)
  application/
    use-cases/
      <verb>-<noun>.use-case.ts  ← @Injectable(), single execute() method
  infrastructure/
    <entity>.mapper.ts           ← maps Prisma rows → domain entities
    prisma-<module>.repository.ts ← implements IXxxRepository
  dto/
    create-<module>.dto.ts       ← class-validator input contracts
    <module>.dto.ts              ← response shape with fromEntity()
  <module>.controller.ts         ← thin: extracts req context, calls use case, maps to DTO
  <module>.module.ts             ← wires provide/useClass + exports
```

---

## Modules Completed

### Day 1 — Transactions (`src/transactions/`)

| Item | Detail |
|---|---|
| Domain entity | `Transaction` with `isLocked()`, `canBeUpdated()` |
| State machine | `TransactionStateService` — `draft→final/received/completed/cancelled` |
| Ref numbers | `RefNumberService` — `{TYPE}-{YYYYMM}-{SEQ}` format |
| Use cases | `Create`, `Find`, `List`, `Update`, `Finalize`, `Cancel`, `GetTotal` (7) |
| Repository | `PrismaTransactionRepository` — infers type across 5 Prisma models |

### Day 2 — Sales (`src/sales/`)

Existing `SalesService` preserved; stock validation integrated via Day 4.

| Endpoint | Description |
|---|---|
| `POST /sales` | Create sale with lines + automatic stock deduction |
| `GET /sales` | Paginated list with filters |
| `GET /sales/:id` | Full sale with lines |
| `PATCH /sales/:id` | Update header fields |
| `POST /sales/:id/convert-to-invoice` | Draft/quotation → final |
| `DELETE /sales/:id` | Soft delete |

### Day 3 — Sales Returns + Purchases

**Sales Returns (`src/sales-returns/`)** — separate module (not in SalesService):

| Item | Detail |
|---|---|
| Domain validator | `SaleReturnValidatorService` — validates against original, calculates proportional discount/tax reversal |
| Use cases | `Create`, `Find`, `List` (3) |
| Atomic creation | `prisma.$transaction()` — return record + `sale_return` stock entries created atomically |
| Endpoints | `POST /sales/:saleId/returns`, `GET /sales/:saleId/returns`, `GET /returns/:id` |

**Purchases (`src/purchases/`)** — full clean arch refactor:

| Item | Detail |
|---|---|
| Landed cost | `LandedCostService` — freight+duty allocated proportionally by base cost weight → `unitCostAfter` |
| Use cases | 9 total: Create, Find, List, Update, Finalize, Delete, Return, Summary, ConvertRequisition |
| Stock entries | `addStock:true` → `purchase_in`; `removeStock:true` → `adjustment_out` |
| New DTO fields | `freightAmount`, `dutyAmount` on `CreatePurchaseDto` |

### Day 4 — Inventory (`src/inventory/`)

| Item | Detail |
|---|---|
| Domain | `StockEntry` entity, `StockValidationService` (pure) |
| Use cases | 9 total including `CheckAvailabilityUseCase` (exported) |
| New endpoints | `GET /inventory/stock/low` (low-stock alerts), `GET /inventory/stock/:productId` (per-product level) |
| Sales integration | `SalesService` injects `CheckAvailabilityUseCase`; `assertAvailable()` called per line before sale commits — rejects with `400` if stock insufficient |

### Day 5 — Payments (`src/payments/`)

| Item | Detail |
|---|---|
| Domain | `Payment` entity, `PaymentStatusService` — `calculate()`, `getBalance()`, `wouldOverpay()` |
| Use cases | 6 total: AddPayment, AddBulkPayments, ListPayments, FindPayment, DeletePayment, GetBalance |
| Overpay guard | `AddPaymentUseCase` rejects with `400` if `currentPaid + newAmount > totalAmount` |
| Auto-status | After every add/delete, recalculates and persists `paidAmount` + `paymentStatus` on parent sale/purchase |
| Nested routes | `POST /sales/:id/payments`, `GET /sales/:id/payments`, `GET /sales/:id/payments/balance` |
| | `POST /purchases/:id/payments`, `GET /purchases/:id/payments`, `GET /purchases/:id/payments/balance` |
| Flat routes | `POST /payments`, `GET /payments`, `GET /payments/balance`, `DELETE /payments/:id` |

---

## All API Endpoints (Week 2)

### Transactions
- `POST /transactions`
- `GET /transactions`
- `GET /transactions/:id`
- `PATCH /transactions/:id`
- `POST /transactions/:id/finalize`
- `POST /transactions/:id/cancel`
- `GET /transactions/totals`

### Sales
- `POST /sales`
- `GET /sales`
- `GET /sales/:id`
- `PATCH /sales/:id`
- `POST /sales/:id/convert-to-invoice`
- `DELETE /sales/:id`
- `POST /sales/:id/returns`
- `GET /sales/:id/returns`
- `GET /returns/:id`
- `POST /sales/:id/payments`
- `GET /sales/:id/payments`
- `GET /sales/:id/payments/balance`

### Purchases
- `POST /purchases`
- `GET /purchases`
- `GET /purchases/:id`
- `PATCH /purchases/:id`
- `POST /purchases/:id/finalize`
- `POST /purchases/:id/convert-to-order`
- `POST /purchases/:id/return`
- `DELETE /purchases/:id`
- `GET /purchases/summary`
- `POST /purchases/:id/payments`
- `GET /purchases/:id/payments`
- `GET /purchases/:id/payments/balance`

### Inventory
- `GET /inventory/summary`
- `GET /inventory/stock`
- `GET /inventory/stock/low`
- `GET /inventory/stock/:productId`
- `GET /inventory/stock/:productId/history`
- `GET /inventory/adjustments`
- `POST /inventory/entries`
- `DELETE /inventory/entries/:id`

### Payments (flat)
- `POST /payments`
- `POST /payments/bulk`
- `GET /payments`
- `GET /payments/balance`
- `GET /payments/:id`
- `DELETE /payments/:id`

---

## Test Coverage

| Suite | Tests |
|---|---|
| `transactions.service.spec.ts` | 14 |
| `sales.service.spec.ts` | 12 |
| `sales-returns.service.spec.ts` | 8 |
| `purchases.service.spec.ts` | 22 |
| `inventory.service.spec.ts` | 20 |
| `payments.service.spec.ts` | 23 |
| Auth, Users, App | 34 |
| **Total** | **133** |

All passing. `npm run build` → exit 0.

---

## Ready for Week 3 — Products & Inventory Management
