# Week 4, Day 3: Automatic GL Posting for Transactions

## Objective
Link sales, purchases, and payments to automatic GL posting.

## Tasks
- [ ] Create `accounting.service.ts` (orchestrator):
  - postSaleToGL(saleId)
  - postPurchaseToGL(purchaseId)
  - postPaymentToGL(paymentId)
- [ ] Implement posting rules:
  - Sale: Dr AR (receivable), Cr Revenue
  - Sale Payment: Dr Bank, Cr AR
  - Purchase: Dr Expense/Asset, Cr AP (payable)
  - Purchase Payment: Dr AP, Cr Bank
  - Stock Adjustment: Dr Inventory, Cr Expense/Gain
- [ ] Link to existing services:
  - sales.service → post on finalize
  - purchases.service → post on finalize
  - payments.service → post on payment
- [ ] Handle multi-currency GL posting
- [ ] Error handling if account mapping missing

## Verification
- [ ] All transactions auto-post to GL
- [ ] GL balances match transaction totals
- [ ] No orphaned journal entries
- [ ] Account mappings properly configured

## Success Criteria
✅ Automatic GL posting fully operational
