# Week 3, Day 5: Batch/Lot Tracking & Expiry Management

## Objective
Implement FIFO batch tracking and expiry date management.

## Tasks
- [ ] Verify batch tracking in PurchaseLine (batch_number, expiry_date)
- [ ] Create `batch.service.ts`:
  - trackBatch(variationId, batchNumber, expiryDate, quantity)
  - getPurchaseLineForBatch(variationId, batchNumber) — FIFO linking
  - checkExpiryItems(locationId) — alert expiring stock
- [ ] Link sales to purchases via TransactionSellLinesPurchaseLines (FIFO):
  - On sale: automatically match batch from oldest purchase
  - Calculate cost of goods sold using batch cost
- [ ] Create expiry management endpoints:
  - GET /api/inventory/expiry-items
  - POST /api/inventory/items/:id/mark-expired
- [ ] Create expiry alerts (7 days before, at expiry, expired)
- [ ] Integration with stock adjustments (mark as expired/damage)

## Verification
- [ ] Batches tracked with expiry dates
- [ ] FIFO matching working for sales
- [ ] Expiry alerts triggered appropriately
- [ ] Cost of goods sold calculated correctly

## Success Criteria
✅ FIFO batch costing operational
✅ **Week 3 Complete!**

## Summary
**Endpoints Created:**
- /api/products/* (CRUD)
- /api/inventory/stock-levels
- /api/stock-adjustments/*
- /api/stock-transfers/*
- /api/inventory/expiry-items

**Ready for Week 4: Accounting & Financial Management!**
