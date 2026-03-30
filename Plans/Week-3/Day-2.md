# Week 3, Day 2: Pricing & Group Pricing

## Objective
Implement product pricing with customer group overrides.

## Tasks
- [ ] Verify VariationGroupPrice model (selling price overrides)
- [ ] Create `pricing.service.ts`:
  - getPurchasePrice(variationId)
  - getSellingPrice(variationId, customerGroupId?)
  - getProfitMargin(variationId)
- [ ] Implement profit margin calculation: `((selling - purchase) / purchase) * 100`
- [ ] Create pricing controller endpoints:
  - GET /api/products/:id/pricing
  - POST /api/products/:id/group-prices
- [ ] Handle combo products (production cost tracking)
- [ ] Create pricing DTOs

## Verification
- [ ] Pricing retrieved correctly per product
- [ ] Group pricing overrides default pricing
- [ ] Profit margins calculated accurately
- [ ] Pricing history tracked

## Success Criteria
✅ Complete pricing system with customer group overrides
