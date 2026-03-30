# Week 5, Day 4: Discounts, Commission & Restaurant Module (Optional)

## Objective
Implement discount management, sales commissions, and optional restaurant features.

## Tasks
- [ ] Verify Discount model
- [ ] Create `discount.service.ts`:
  - applyDiscount(type, value, items)
  - Discount types: percentage, fixed, buy-X-get-Y
  - validateDiscount() — check limits
  - Track discount reason (promotion, loyalty, negotiation)
- [ ] Create `commission.service.ts`:
  - calculateCommission(salesPersonId, fromDate, toDate)
  - Commission rate from user settings
  - getCommissionStatement()
  - processCommissionPayment()
- [ ] Create endpoints for discounts and commissions
- [ ] Optional: Restaurant module:
  - Table management
  - Order/modifier management
  - Kitchen display system
  - Booking management
- [ ] Unit tests

## Verification
- [ ] Discounts applied correctly
- [ ] Commission calculations accurate
- [ ] Restaurant features (if implemented) working

## Success Criteria
✅ Discounts and commissions operational
✅ Optional restaurant module ready
