# Week 2, Day 1: Transaction Model & Service Foundation

## Objective
Build the foundation for all transaction types (sales, purchases, expenses, transfers, adjustments) with proper state management.

---

## Tasks

### 1. Review Transaction Model in Prisma
- [ ] Review `ultimate-pos-api/prisma/schema.prisma`
- [ ] Verify Transaction model has:
  - Type: `sale, purchase, expense, stock_transfer, stock_adjustment`
  - Status: `draft, final, received, cancelled`
  - Fields: `business_id, location_id, contact_id, user_id, ref_no, date, note`
  - Financial: `total_before_tax, tax_amount, total_after_tax, discount_amount`

### 2. Create Transaction Service
- [ ] Create `ultimate-pos-api/src/transactions/transactions.service.ts`:
  ```typescript
  @Injectable()
  export class TransactionsService {
    constructor(
      private prisma: PrismaService,
      private businessService: BusinessService,
    ) {}

    async create(business_id: number, type: string, data: any) { ... }
    async findById(id: number, business_id: number) { ... }
    async findAll(business_id: number, filters: any) { ... }
    async updateStatus(id: number, status: string) { ... }
    async getTotal(id: number) { ... }
    async generateReferenceNumber(type: string, business_id: number) { ... }
  }
  ```

### 3. Implement Reference Number Generation
- [ ] Create auto-increment reference numbers:
  - Format: `{TYPE}-{YYYYMM}-{SEQUENCE}`
  - Example: `SALE-202603-0001`, `SALE-202603-0002`
  - Save sequence to database per type per month
- [ ] Create `ref-number.service.ts`:
  ```typescript
  async getNextRefNo(type: string, business_id: number): Promise<string> { ... }
  ```

### 4. Implement Transaction State Machine
- [ ] Define allowed transitions:
  - `draft` → `final` (user clicks finalize/lock)
  - `draft` → `cancelled` (user cancels)
  - `final` → `cancelled` (user voids)
  - Cannot edit after `final`
- [ ] Create `transaction-state.service.ts`:
  ```typescript
  async canTransition(currentStatus: string, newStatus: string): boolean { ... }
  async updateStatus(id: number, newStatus: string) { ... }
  ```

### 5. Create Transaction DTOs
- [ ] Create `src/transactions/dto/create-transaction.dto.ts`
- [ ] Create `src/transactions/dto/update-transaction.dto.ts`
- [ ] Create `src/transactions/dto/transaction.dto.ts` (response)

### 6. Create Transaction Controller (Partial)
- [ ] Create `src/transactions/transactions.controller.ts`:
  - `POST /api/transactions` — Create transaction
  - `GET /api/transactions/:id` — Get details
  - `GET /api/transactions` — List (with pagination, filters)
  - `PUT /api/transactions/:id` — Update draft only
  - `POST /api/transactions/:id/finalize` — Lock transaction
  - `POST /api/transactions/:id/cancel` — Cancel

### 7. Database Migration (if schema mismatches)
- [ ] If Prisma schema differs from HOMESTEAD:
  ```bash
  cd ultimate-pos-api
  npm run db:migrate
  ```
- [ ] Review migration file in `prisma/migrations/`
- [ ] Test migration doesn't lose data

### 8. Unit Tests
- [ ] Create `src/transactions/transactions.service.spec.ts`:
  - Test reference number generation
  - Test state transitions
  - Test cannot edit finalized transaction

---

## Verification Checklist
- [ ] Transaction service created with all core methods
- [ ] Reference number generation working
- [ ] State machine enforcing allowed transitions
- [ ] DTOs validate input correctly
- [ ] Unit tests passing

---

## Success Criteria
✅ Transaction foundation established  
✅ Reference number generation automated  
✅ State management preventing invalid operations  
✅ Ready for sales workflow (Day 2)

---

## Code Changes Summary
- New file: `src/transactions/transactions.service.ts`
- New file: `src/transactions/transactions.controller.ts`
- New file: `src/transactions/services/ref-number.service.ts`
- New file: `src/transactions/services/transaction-state.service.ts`
- New file: `src/transactions/dto/create-transaction.dto.ts`
- New file: `src/transactions/transactions.service.spec.ts`
- Update: `src/app.module.ts` (import TransactionsModule)
