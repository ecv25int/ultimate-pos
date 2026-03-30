# Week 2, Day 2: Sales Module - Create & Finalize

## Objective
Implement sales transaction creation with line items, discount logic, and tax calculations.

---

## Tasks

### 1. Create Sales Service
- [ ] Create `ultimate-pos-api/src/sales/sales.service.ts`:
  ```typescript
  @Injectable()
  export class SalesService {
    constructor(
      private transactionsService: TransactionsService,
      private productsService: ProductsService,
      private prisma: PrismaService,
    ) {}

    async createSale(business_id: number, saleData: CreateSaleDto) { ... }
    async updateSale(id: number, business_id: number, updateData: UpdateSaleDto) { ... }
    async finalizeSale(id: number, business_id: number) { ... }
    async voidSale(id: number, business_id: number) { ... }
    async calculateTotals(saleData: any) { ... }
  }
  ```

### 2. Create Sale Line Items
- [ ] Verify `TransactionSellLine` model in schema:
  - Fields: `transaction_id, product_id, quantity, unit_price, discount_amount, subtotal`
- [ ] Create `sales.service.ts` with:
  - `addLineItem(saleId, productId, quantity, unitPrice, discount)` 
  - Line total: `(quantity * unit_price) - discount`
  - Validate: product exists, quantity > 0, price valid

### 3. Implement Discount Logic
- [ ] Support discount types:
  - **Item-level**: discount on specific line
  - **Transaction-level**: discount on entire sale
  - **Type**: Fixed amount or percentage
- [ ] Add to `CreateSaleDto`:
  ```typescript
  lineItems: [{
    product_id: number,
    quantity: number,
    unit_price: decimal,
    discount_amount?: decimal,
    discount_percentage?: number,
  }],
  transaction_discount_amount?: decimal,
  transaction_discount_percentage?: number,
  ```
- [ ] Calculate:
  - After item discounts: sum of all `(qty * price - discount)`
  - After transaction discount: apply if provided
  - Before tax: final subtotal

### 4. Implement Tax Calculation
- [ ] Single tax per transaction (tax_id field)
- [ ] Retrieve tax rate from `TaxRate` table
- [ ] Calculate: `tax_amount = total_before_tax * (tax_rate / 100)`
- [ ] Final total: `total_after_tax = total_before_tax + tax_amount`

### 5. Create & Test Sale Flow
- [ ] Test workflow:
  1. Create sale (POST /api/sales):
     ```json
     {
       "contact_id": 5,
       "location_id": 1,
       "line_items": [
         { "product_id": 10, "quantity": 2, "unit_price": 50 }
       ],
       "tax_id": 1
     }
     ```
  2. Response includes: `id, ref_no, status, totals`
  3. Sale in `draft` status
  4. Can update draft sale
  5. Finalize sale: PUT /api/sales/{id}/finalize
  6. Sale becomes `final` (locked)

### 6. Implement Draft Editing
- [ ] Only `draft` sales can be edited
- [ ] PUT /api/sales/:id with updated line items
- [ ] Recalculate totals on update
- [ ] Prevent editing after finalization

### 7. Create Sales Controller
- [ ] Create `src/sales/sales.controller.ts`:
  - `POST /api/sales` — Create sale
  - `GET /api/sales/:id` — Get sale details
  - `PUT /api/sales/:id` — Update draft sale
  - `POST /api/sales/:id/finalize` — Lock/finalize
  - `POST /api/sales/:id/void` — Cancel sale

### 8. Create Sales DTOs
- [ ] `create-sale.dto.ts`: contact_id, location_id, line_items, tax_id, discount
- [ ] `update-sale.dto.ts`: partial fields
- [ ] `sale.dto.ts`: response schema

### 9. Unit Tests
- [ ] Create `src/sales/sales.service.spec.ts`:
  - Test create sale with line items
  - Test discount calculation (fixed, percentage)
  - Test tax calculation
  - Test finalization locks sale
  - Test cannot edit finalized sale

---

## Verification Checklist
- [ ] Sales can be created with multiple line items
- [ ] Discounts calculated correctly (item-level, transaction-level)
- [ ] Tax calculation accurate
- [ ] Draft sales can be edited
- [ ] Finalized sales cannot be edited
- [ ] Reference numbers auto-generated
- [ ] All totals calculated correctly (before tax, tax, after tax)

---

## Success Criteria
✅ Complete sale creation workflow  
✅ Discount & tax logic working  
✅ Sale state management enforced  
✅ Ready for purchases (Day 3)

---

## Code Changes Summary
- New file: `src/sales/sales.service.ts`
- New file: `src/sales/sales.controller.ts`
- New file: `src/sales/dto/create-sale.dto.ts`
- New file: `src/sales/dto/sale.dto.ts`
- New file: `src/sales/sales.service.spec.ts`
- Update: `src/app.module.ts` (import SalesModule)
