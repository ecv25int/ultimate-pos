# Week 2, Day 5: Payment Processing & Week 2 Verification

## Objective
Implement basic payment recording and complete Week 2 sales/purchase workflows.

---

## Tasks

### 1. Create Payment Service
- [ ] Create `ultimate-pos-api/src/payments/payments.service.ts`:
  ```typescript
  @Injectable()
  export class PaymentsService {
    constructor(
      private transactionsService: TransactionsService,
      private prisma: PrismaService,
    ) {}

    async addPayment(transaction_id: number, paymentData: CreatePaymentDto) { ... }
    async listPayments(transaction_id: number) { ... }
    async getBalance(transaction_id: number) { ... }
  }
  ```

### 2. Verify Payment Model
- [ ] Check `TransactionPayment` table:
  - Fields: `transaction_id, amount, payment_method, payment_date, reference_no`
  - Payment methods: `cash, card, cheque, bank_transfer, digital_wallet`

### 3. Implement Payment Recording
- [ ] Create payment line item:
  ```typescript
  async addPayment(
    transactionId: number,
    amount: number,
    method: string,
    reference?: string
  ) {
    const payment = await this.prisma.transactionPayment.create({
      data: {
        transaction_id: transactionId,
        amount,
        payment_method: method,
        payment_date: new Date(),
        reference_no: reference,
      },
    });
    
    // Update transaction payment status
    await this.updatePaymentStatus(transactionId);
  }
  ```

### 4. Update Payment Status
- [ ] Query all payments for transaction
- [ ] Calculate: `total_paid = sum(all payments)`
- [ ] Compare to `total_after_tax`:
  - If `total_paid == 0`: status = `not_paid`
  - If `0 < total_paid < total`: status = `partially_paid`
  - If `total_paid >= total`: status = `paid`
- [ ] Update transaction.payment_status

### 5. Create Payment Endpoints
- [ ] Create `src/payments/payments.controller.ts`:
  - `POST /api/sales/:id/payments` — Add payment to sale
  - `GET /api/sales/:id/payments` — List payments
  - `GET /api/sales/:id/balance` — Remaining balance
  - (Same for purchases)

### 6. Create Payment DTOs
- [ ] `create-payment.dto.ts`: amount, method, reference
- [ ] `payment.dto.ts`: response schema

### 7. Implement Multiple Payments
- [ ] Allow multiple payment lines per transaction
- [ ] Validate: `single_payment_amount <= remaining_balance`
- [ ] Example workflow:
  1. Sale total: $100
  2. Payment 1: $50 (cash) → status: partially_paid, balance: $50
  3. Payment 2: $50 (card) → status: paid, balance: $0

### 8. End-to-End Test Sales Flow
- [ ] Test complete workflow:
  1. Create sale with 2 items
  2. Verify stock deducted
  3. Add payment (partial)
  4. Verify payment status updated
  5. Add final payment
  6. Verify sale marked paid
  7. Cannot edit finalized sale

### 9. End-to-End Test Purchase Flow
- [ ] Test complete workflow:
  1. Create purchase from supplier
  2. Verify stock added
  3. Add payment to supplier
  4. Verify payment status

### 10. Integration Tests
- [ ] Create `src/sales/sales.e2e.spec.ts`:
  ```typescript
  // Test full sale creation → finalize → payment → inventory
  it('should create sale, update inventory, and record payment', async () => {
    // Create sale
    const sale = await saveSale(...);
    expect(sale.status).toBe('draft');
    
    // Finalize and check stock
    await finalizeSale(sale.id);
    const stock = await getStock(productId, locationId);
    expect(stock).toBe(initialStock - soldQty);
    
    // Add payment
    await addPayment(sale.id, amount);
    const updated = await getSale(sale.id);
    expect(updated.payment_status).toBe('partially_paid');
  });
  ```

### 11. Verification Checklist
- [ ] Payments can be recorded (single and multiple)
- [ ] Payment status updates correctly (not_paid, partially_paid, paid)
- [ ] Cannot overpay transaction
- [ ] Sales workflow complete (create → finalize → payment → paid)
- [ ] Purchase workflow complete
- [ ] Inventory updates verified
- [ ] All tests passing

### 12. Documentation
- [ ] Create `Plans/Week-2/SUMMARY.md`:
  - All completed tasks
  - Current API endpoints
  - Known issues/TODOs
  - Readiness for Week 3

---

## Success Criteria
✅ Payment recording working  
✅ Payment status automatic updates  
✅ Multiple payments per transaction  
✅ Complete sales workflow (create → pay → inventory)  
✅ Complete purchase workflow  
✅ **Week 2 Complete!** ✅

---

## Code Changes Summary
- New file: `src/payments/payments.service.ts`
- New file: `src/payments/payments.controller.ts`
- New file: `src/payments/dto/create-payment.dto.ts`
- New file: `src/sales/sales.e2e.spec.ts`
- New file: `Plans/Week-2/SUMMARY.md`
- Update: `src/app.module.ts` (import PaymentsModule)
- Update transaction services to call PaymentsService

---

## Week 2 Summary

| Day | Completed | Status |
|-----|-----------|--------|
| 1 | Transaction foundation | ✅ |
| 2 | Sales create & finalize | ✅ |
| 3 | Sales returns & purchases | ✅ |
| 4 | Inventory integration | ✅ |
| 5 | Payments & verification | ✅ |

**API Endpoints Created (Week 2):**
- POST /api/sales
- GET /api/sales/:id
- PUT /api/sales/:id
- POST /api/sales/:id/finalize
- POST /api/sales/:id/returns
- POST /api/purchases
- GET /api/purchases/:id
- POST /api/sales/:id/payments
- GET /api/products/:id/stock

**Ready for Week 3: Inventory & Products Management!**
