# Week 3, Day 4: Stock Adjustments & Transfers

## Objective
Implement physical inventory counts and inter-location transfers.

## Tasks
- [ ] Create `stock-adjustments.service.ts`:
  - createAdjustment(locationId, items, reason)
  - Reason types: damage, expiry, missing, found, inventory_count
  - Calculate variance (system vs actual)
  - Create adjustment transaction
  - Update stock levels
- [ ] Create adjustment endpoints:
  - POST /api/stock-adjustments
  - GET /api/stock-adjustments/:id
  - POST /api/stock-adjustments/:id/confirm
- [ ] Create `stock-transfers.service.ts`:
  - createTransfer(fromLocationId, toLocationId, items)
  - receiveTransfer(transferId)
  - Status: pending, received, cancelled
- [ ] Create transfer endpoints:
  - POST /api/stock-transfers
  - GET /api/stock-transfers/:id
  - POST /api/stock-transfers/:id/receive
- [ ] Create DTOs for adjustments and transfers
- [ ] Unit and integration tests

## Verification
- [ ] Adjustments correctly update stock levels
- [ ] Transfers move stock between locations
- [ ] Cannot receive more than transferred
- [ ] Adjustments reconcile variances

## Success Criteria
✅ Stock reconciliation fully working
