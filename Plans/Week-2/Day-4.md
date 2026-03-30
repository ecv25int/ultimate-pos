# Week 2, Day 4: Inventory Updates & Stock Validation

## Objective
Integrate inventory tracking with sales/purchases, including stock deduction and validation.

---

## Tasks

### 1. Create Inventory Service
- [ ] Create `ultimate-pos-api/src/inventory/inventory.service.ts`:
  ```typescript
  @Injectable()
  export class InventoryService {
    constructor(
      private prisma: PrismaService,
      private businessService: BusinessService,
    ) {}

    async getStockLevel(variation_id: number, location_id: number) { ... }
    async checkAvailability(variation_id: number, location_id: number, qty: number) { ... }
    async updateStock(variation_id: number, location_id: number, qtyDelta: number, reason: string) { ... }
    async getStockHistory(variation_id: number, location_id: number) { ... }
  }
  ```

### 2. Implement Stock Level Queries
- [ ] Query `VariationLocationDetails` table:
  ```sql
  SELECT quantity_on_hand 
  FROM variation_location_details
  WHERE variation_id = ? AND location_id = ?
  ```
- [ ] Handle: variation/location combination may not exist yet

### 3. Implement Stock Validation
- [ ] Before finalizing sale:
  - Check stock availability for each item
  - `quantity_on_hand >= qty_sold`
  - Return error if insufficient stock
- [ ] Allow partial sales (optional business rule)

### 4. Create Stock Movement Logging
- [ ] Track all stock changes in `StockMovement` entity (if exists, or create):
  - `variation_id, location_id, transaction_id, movement_type, quantity, reason, timestamp`
  - Movement types: `sale, purchase, adjustment, transfer, return`
- [ ] Create `stock-movement.service.ts`

### 5. Integrate with Sales Module
- [ ] Update `sales.service.ts`:
  - On sale finalization:
    ```typescript
    for each line_item:
      - Check stock available
      - Deduct from variation_location_details
      - Log movement (type: 'sale')
    ```
  - On sale void:
    - Restore stock for each item
    - Log movement (type: 'sale_return')

### 6. Integrate with Purchase Module
- [ ] Update `purchases.service.ts`:
  - On purchase finalization:
    ```typescript
    for each line_item:
      - Add to variation_location_details
      - Store batch number & expiry date
      - Log movement (type: 'purchase')
    ```

### 7. Integrate with Sales Returns
- [ ] Update `sales-returns.service.ts`:
  - On return finalization:
    - Restore stock for returned items
    - Log movement (type: 'return')

### 8. Implement Stock Alerts
- [ ] Query minimum stock level from product settings
- [ ] Alert if stock falls below minimum:
  - Return warning in response
  - Log to notifications (if module exists)
  - Example: `stock_level: 5, minimum: 10` → ⚠️ Low stock

### 9. Create Stock Endpoints
- [ ] Create `src/inventory/inventory.controller.ts`:
  - `GET /api/products/:id/stock` — Get stock levels all locations
  - `GET /api/products/:id/stock/history` — Movement history
  - `GET /api/inventory/low-stock` — Alert on low stock items

### 10. Create Inventory DTOs
- [ ] `stock-level.dto.ts`: variation_id, location_id, quantity, minimum, alerts
- [ ] `stock-movement.dto.ts`: type, quantity, reason, timestamp

### 11. Unit Tests
- [ ] Create `src/inventory/inventory.service.spec.ts`:
  - Test stock availability check
  - Test stock deduction on sale
  - Test stock addition on purchase
  - Test stock history logging

---

## Verification Checklist
- [ ] Stock levels queried correctly per location
- [ ] Sale cannot finalize if insufficient stock
- [ ] Stock automatically deducted on sale finalize
- [ ] Stock automatically added on purchase finalize
- [ ] Stock movements logged with reason
- [ ] Stock history retrievable
- [ ] Low stock alerts triggered

---

## Success Criteria
✅ Inventory tracking integrated with sales/purchases  
✅ Stock validation preventing oversales  
✅ Stock movements fully logged  
✅ Ready for payments (Day 5)

---

## Code Changes Summary
- New file: `src/inventory/inventory.service.ts`
- New file: `src/inventory/inventory.controller.ts`
- New file: `src/inventory/services/stock-movement.service.ts`
- New file: `src/inventory/dto/stock-level.dto.ts`
- New file: `src/inventory/inventory.service.spec.ts`
- Update: `src/sales/sales.service.ts` (add stock deduction on finalize)
- Update: `src/purchases/purchases.service.ts` (add stock addition on finalize)
- Update: `src/sales-returns/sales-returns.service.ts` (add stock restoration)
- Update: `src/app.module.ts` (import InventoryModule)
