# Week 2, Day 1: Transaction Model & Service Foundation

## Objective
Build the foundation for all transaction types (sales, purchases, expenses, transfers, adjustments)
with a unified abstraction layer, reference number generation, and a strict state machine.

---

## Architecture

This day establishes the **transaction kernel** — a normalized layer over five underlying Prisma
models. Higher-level modules (sales, purchases, payments, inventory) depend on this kernel.

```
HTTP ──→ TransactionsController
            └─→ TransactionsService          ← application logic
                  ├─→ RefNumberService       ← reference number generation
                  ├─→ TransactionStateService ← state machine
                  └─→ PrismaService          ← DB (Sale, Purchase, Expense,
                                               StockTransfer, StockAdjustment)
```

### Why an abstraction layer?

The original schema has five separate tables, not a single `transactions` table.
Rather than adding a new table and migrating data, this layer normalizes the five models
into a single `TransactionDto` at the application boundary — zero schema migration required
for Day 1, and higher-level modules get a consistent interface to build on.

---

## Use Cases

| Use Case | Method | Actor |
|---|---|---|
| Create any transaction (sale/purchase/expense/transfer/adjustment) | `create(businessId, userId, dto)` | POS operator |
| Retrieve transaction by id | `findById(id, businessId)` | Any authenticated user |
| List transactions with filters + pagination | `findAll(businessId, filters)` | Manager/report user |
| Update a draft transaction | `update(id, businessId, dto)` | POS operator |
| Advance transaction status | `updateStatus(id, businessId, newStatus)` | POS operator |
| Finalize transaction (lock) | `finalize(id, businessId)` | POS operator |
| Cancel transaction | `cancel(id, businessId)` | Manager |
| Get transaction total | `getTotal(id, businessId)` | Any authenticated user |
| Generate reference number | `generateReferenceNumber(type, businessId)` | Internal (auto) |

---

## Tasks

### 1. Review Transaction Model in Prisma
- [x] Review `ultimate-pos-api/prisma/schema.prisma`
- [x] Verify the repo uses a transaction abstraction over existing models:
  - Types covered: `sale, purchase, expense, stock_transfer, stock_adjustment`
  - Statuses supported through the state machine: `draft, final, received, completed, cancelled`
  - Common fields normalized by the transaction layer: `businessId, locationId, contactId, userId, refNo, date, note`
  - Financial fields normalized by the transaction layer: `totalBeforeTax, taxAmount, totalAmount, discountAmount`

### 2. Create Transaction Service
- [x] Create `ultimate-pos-api/src/transactions/transactions.service.ts`:
  ```typescript
  @Injectable()
  export class TransactionsService {
    constructor(
      private readonly prisma: PrismaService,
      private readonly refNumberService: RefNumberService,
      private readonly transactionStateService: TransactionStateService,
    ) {}

    async create(businessId: number, userId: number, dto: CreateTransactionDto): Promise<TransactionDto>
    async findById(id: number, businessId: number, type?: TransactionType): Promise<TransactionDto>
    async findAll(businessId: number, filters: TransactionListFilters): Promise<PaginatedResult<TransactionDto>>
    async update(id: number, businessId: number, dto: UpdateTransactionDto): Promise<TransactionDto>
    async updateStatus(id: number, businessId: number, newStatus: string, type?: TransactionType): Promise<TransactionDto>
    async finalize(id: number, businessId: number, type?: TransactionType): Promise<TransactionDto>
    async cancel(id: number, businessId: number, type?: TransactionType): Promise<TransactionDto>
    async getTotal(id: number, businessId: number, type?: TransactionType): Promise<{ totalAmount: number }>
    async generateReferenceNumber(type: TransactionType, businessId: number): Promise<string>
  }
  ```
- [x] `type` parameter is optional — service infers it when omitted (parallel DB check across all 5 models)

### 3. Implement Reference Number Generation
- [x] Create `src/transactions/services/ref-number.service.ts`
- [x] Format: `{TYPE}-{YYYYMM}-{SEQUENCE}` (e.g. `SALE-202603-0001`)
- [x] Sequence resets per type per month, persisted via existing transaction fields

### 4. Implement Transaction State Machine
- [x] Create `src/transactions/services/transaction-state.service.ts`
- [x] Allowed transitions:
  ```
  draft           → final | received | completed | cancelled
  pending/ordered → received | completed | cancelled
  final           → cancelled
  received        → cancelled
  completed       → cancelled
  cancelled       → (terminal — no transitions allowed)
  ```
- [x] `isLockedStatus()` — `final | received | completed | cancelled` cannot be edited
- [x] `getDraftStatusForType()` — `stock_transfer` starts as `pending`, others as `draft`
- [x] `getFinalStatusForType()` — purchase/adjustment = `received`; transfer = `completed`; default = `final`
- [x] `assertCanUpdate(status)` — throws `BadRequestException` if locked
- [x] `assertCanTransition(current, next)` — throws `BadRequestException` on illegal transition

### 5. Create Transaction DTOs
- [x] `src/transactions/dto/create-transaction.dto.ts`
  - `type`: union of `TransactionType`
  - Financial fields: `totalBeforeTax`, `taxAmount`, `discountAmount`, `totalAmount`
  - Optional: `contactId`, `locationId`, `note`, `transactionDate`, `paymentStatus`
  - Type-specific: `productId`, `quantity`, `fromLocation`, `toLocation`, `adjustmentType`, `expenseCategoryId`
- [x] `src/transactions/dto/update-transaction.dto.ts` — all fields partial
- [x] `src/transactions/dto/transaction.dto.ts` — normalized response shape:
  ```typescript
  {
    id, type, status, refNo, businessId, contactId, userId, locationId,
    paymentStatus, date, note,
    totalBeforeTax, taxAmount, discountAmount, totalAmount,
    metadata: Record<string, unknown>  // type-specific extras
  }
  ```

### 6. Create Transaction Controller
- [x] Create `src/transactions/transactions.controller.ts`:
  - `POST /api/transactions` — Create transaction
  - `GET /api/transactions` — List (pagination + filters: type, status, search, from, to)
  - `GET /api/transactions/:id` — Get by id
  - `PUT /api/transactions/:id` — Update (draft only)
  - `POST /api/transactions/:id/finalize` — Lock transaction
  - `POST /api/transactions/:id/cancel` — Cancel
  - `GET /api/transactions/:id/total` — Get total amount

### 7. Database Migration
- [x] No Prisma migration required — implementation runs over the existing `Sale`, `Purchase`,
  `Expense`, `StockTransfer`, `StockAdjustment` models without schema changes.

### 8. Unit Tests
- [x] Create `src/transactions/transactions.service.spec.ts`:
  - Reference number generation
  - State transitions (valid and invalid)
  - Locked transaction cannot be edited

---

## Contracts Exposed to Day 2+

The following are the integration points that `sales/`, `purchases/`, `payments/`, and
`inventory/` modules depend on:

| Export | Consumer |
|---|---|
| `TransactionsService.finalize()` | `SalesService`, `PurchasesService` |
| `TransactionsService.cancel()` | `SalesService`, `PurchasesService` |
| `TransactionStateService.assertCanUpdate()` | `SalesService` (prevent editing locked sales) |
| `TransactionStateService.isLockedStatus()` | `PaymentsService` (prevent paying cancelled tx) |
| `TransactionDto` | All modules (normalized response shape) |
| `TransactionType` enum | All modules (type-safe type discrimination) |

---

## Verification Checklist
- [x] Transaction service created with all core methods
- [x] Reference number generation working (`SALE-202603-0001` format)
- [x] State machine enforcing allowed transitions
- [x] Illegal transitions throw `BadRequestException`
- [x] Locked transactions throw on edit attempt
- [x] DTOs validate input correctly (class-validator decorators)
- [x] Unit tests passing

---

## Implementation Notes

- Implemented as a unified transaction abstraction over the existing schema — no new `transactions`
  table needed.
- `inferType()` runs 5 parallel `findFirst` queries when `type` is omitted; callers should pass
  `type` explicitly when known to avoid the overhead.
- `mapSale/mapPurchase/mapExpense/...` private methods normalize Prisma `Decimal` fields via
  `toNumber()` helper to avoid serialization issues.
- `TransactionsModule` registered in `AppModule`. Exported for consumption by `SalesModule`,
  `PurchasesModule`, etc.

---

## Success Criteria
✅ Transaction foundation established  
✅ Reference number generation automated  
✅ State management preventing invalid operations  
✅ Ready for sales workflow (Day 2)

---

## Code Changes Summary
- New: `src/transactions/transactions.service.ts`
- New: `src/transactions/transactions.controller.ts`
- New: `src/transactions/transactions.module.ts`
- New: `src/transactions/services/ref-number.service.ts`
- New: `src/transactions/services/transaction-state.service.ts`
- New: `src/transactions/dto/create-transaction.dto.ts`
- New: `src/transactions/dto/update-transaction.dto.ts`
- New: `src/transactions/dto/transaction.dto.ts`
- New: `src/transactions/transactions.service.spec.ts`
- Updated: `src/app.module.ts` (import `TransactionsModule`)
