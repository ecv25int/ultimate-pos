# Week 2, Day 3: Sales Returns & Purchase Module Foundation

## Objective
Implement sales returns/credit notes and establish purchase transaction module.

---

## Tasks

### 1. Create Sales Return/Credit Note Service
- [ ] Create `ultimate-pos-api/src/sales-returns/sales-returns.service.ts`:
  ```typescript
  @Injectable()
  export class SalesReturnsService {
    constructor(
      private salesService: SalesService,
      private transactionsService: TransactionsService,
      private prisma: PrismaService,
    ) {}

    async createReturn(business_id: number, returnData: CreateSalesReturnDto) { ... }
    async validateReturn(saleId: number, returnItems: any[]) { ... }
  }
  ```

### 2. Implement Return Validation
- [ ] Link to original sale: `return_parent_id = original_sale_id`
- [ ] Validate:
  - Original sale exists and is `final`
  - Cannot return more than sold
  - Each item: `returned_qty <= original_qty`
- [ ] Create return lines matching original sale lines

### 3. Calculate Return Totals
- [ ] For each returned item:
  - Revert discount proportionally
  - Recalculate item total
  - Recalculate tax on reduced amount
- [ ] Create credit memo (negative transaction)

### 4. Create Sales Return Controller
- [ ] Create `src/sales-returns/sales-returns.controller.ts`:
  - `POST /api/sales/:id/returns` — Create return from sale
  - `GET /api/sales/:id/returns` — List returns for sale
  - `GET /api/returns/:id` — Get return details

### 5. Create Purchase Service
- [ ] Create `ultimate-pos-api/src/purchases/purchases.service.ts`:
  ```typescript
  @Injectable()
  export class PurchasesService {
    constructor(
      private transactionsService: TransactionsService,
      private prisma: PrismaService,
    ) {}

    async createPurchase(business_id: number, purchaseData: CreatePurchaseDto) { ... }
    async updatePurchase(id: number, business_id: number, updateData) { ... }
    async finalizePurchase(id: number, business_id: number) { ... }
  }
  ```

### 6. Implement Purchase Line Items
- [ ] Verify `PurchaseLine` model:
  - Fields: `transaction_id, product_id, quantity, cost_price, discount, subtotal, batch_number, expiry_date`
- [ ] Track batch/lot numbers for inventory costing
- [ ] Add supplier credit terms to purchase:
  - `payment_terms: 'net_30', 'net_60', 'net_90', 'cod'`
  - Calculate due date: `purchase_date + days`

### 7. Create Purchase Cost Calculation
- [ ] Cost per unit may include:
  - Base cost
  - Freight/shipping (allocated per item)
  - Duty/tax (if applicable)
- [ ] Landed cost: `cost_per_unit = (total_cost + freight + duty) / quantity`
- [ ] Store in `cost_price` field

### 8. Create Purchase Controller
- [ ] Create `src/purchases/purchases.controller.ts`:
  - `POST /api/purchases` — Create purchase
  - `GET /api/purchases/:id` — Get details
  - `PUT /api/purchases/:id` — Update draft
  - `POST /api/purchases/:id/finalize` — Lock purchase

### 9. Create Purchase DTOs
- [ ] `create-purchase.dto.ts`: contact_id (supplier), line_items, payment_terms
- [ ] `purchase.dto.ts`: response schema

### 10. Unit Tests
- [ ] Create `src/sales-returns/sales-returns.service.spec.ts`:
  - Test return validation (can't return more than sold)
  - Test credit memo calculation
- [ ] Create `src/purchases/purchases.service.spec.ts`:
  - Test purchase creation
  - Test cost calculation

---

## Verification Checklist
- [ ] Sales returns can be created from original sale
- [ ] Cannot return more than originally sold
- [ ] Credit memo totals correctly calculated
- [ ] Purchase transactions can be created
- [ ] Supplier credit terms tracked
- [ ] Cost calculation (landed cost) working

---

## Success Criteria
✅ Sales return workflow complete  
✅ Purchase module foundation established  
✅ Cost tracking for inventory  
✅ Ready for inventory integration (Day 4)

---

## Code Changes Summary
- New file: `src/sales-returns/sales-returns.service.ts`
- New file: `src/sales-returns/sales-returns.controller.ts`
- New file: `src/sales-returns/dto/create-sales-return.dto.ts`
- New file: `src/purchases/purchases.service.ts`
- New file: `src/purchases/purchases.controller.ts`
- New file: `src/purchases/dto/create-purchase.dto.ts`
- New file: `src/sales-returns/sales-returns.service.spec.ts`
- New file: `src/purchases/purchases.service.spec.ts`
- Update: `src/app.module.ts` (import modules)
