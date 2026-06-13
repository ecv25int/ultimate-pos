# Week 5, Day 4: Discounts, Commission & Restaurant Module (Optional)

## Objective
Implement discount management, sales commissions, and optional restaurant features.

## PHP project at: 
This is a migration project. PHP Source code at /opt/homebrew/var/www/superpos/ 
Update Plans/Plan-Checklist.md  file when finish, with all the plans implemented so far, including this one. 
For the current week, update also the progress in Plans/Week-X/Day-X.md for the days already done. 

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
