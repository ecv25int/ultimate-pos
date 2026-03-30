# Week 3, Day 3: Multi-Location Stock & Stock Levels

## Objective
Implement advanced inventory tracking across locations with stock valuation.

## Tasks
- [ ] Verify VariationLocationDetails model (stock per location)
- [ ] Create advanced `stock.service.ts`:
  - getStockLevel(variationId, locationId)
  - getStockHistory(variationId, locationId)
  - updateStockLevel(variationId, locationId, delta, reason)
  - checkStockAvailability(variationId, locationId, qty)
  - getStockValuation(locationId) — total $ value
- [ ] Implement stock alerts (minimum/maximum levels)
- [ ] Create stock location endpoints:
  - GET /api/inventory/stock-levels (all locations)
  - GET /api/inventory/location/:id/stock
  - GET /api/inventory/valuation
  - GET /api/inventory/low-stock
- [ ] Track stock movement types: sale, purchase, adjustment, transfer, return
- [ ] Create stock movement history

## Verification
- [ ] Stock levels accurate at each location
- [ ] Stock valuation calculated correctly
- [ ] Movement history complete and accurate
- [ ] Alerts triggered at appropriate thresholds

## Success Criteria
✅ Multi-location inventory fully operational
