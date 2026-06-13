# Week 6, Day 3: End-to-End Business Process Testing

## Objective
Execute comprehensive user scenarios to verify all functionality.

## PHP project at: 
This is a migration project. PHP Source code at /opt/homebrew/var/www/superpos/ 
Update Plans/Plan-Checklist.md  file when finish, with all the plans implemented so far, including this one. 
For the current week, update also the progress in Plans/Week-X/Day-X.md for the days already done. 

## Tasks
- [ ] Test Sales Process:
  - Login as sales staff
  - Create sale with multiple items
  - Apply item-level discount
  - Apply transaction-level discount
  - Generate invoice
  - Record partial payment
  - Record final payment
  - Verify inventory updated
  - Check AR in GL
- [ ] Test Purchase Process:
  - Create PO from supplier
  - Receive goods (update stock)
  - Record supplier payment
  - Verify GL posting
- [ ] Test Inventory:
  - Stock adjustment (physical count)
  - Stock transfer (between locations)
  - Verify expiry alerts
  - Check low stock alerts
- [ ] Test Reporting:
  - Run sales report, match amounts
  - Generate balance sheet, verify formula
  - Export to PDF/Excel
  - Dashboard KPIs update in real-time
- [ ] Test Role-Based Access:
  - Admin: Full access
  - Cashier: Sales only
  - Manager: View reports only
  - Verify location-scoped access

## Verification
- [ ] All business processes working correctly
- [ ] User roles enforcing permissions
- [ ] Data integrity throughout flows
- [ ] Performance acceptable

## Success Criteria
✅ E2E testing passed
