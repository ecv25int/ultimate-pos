# Week 5, Day 2: Dashboard, KPIs & Export Functionality

## Objective
Build real-time dashboard and report export capabilities.

## Tasks
- [ ] Create `dashboard.service.ts`:
  - Today's sales revenue
  - Today's profit
  - Pending payments (AR/AP)
  - Inventory value
  - Cash position
  - Metrics by location, user role
- [ ] Dashboard endpoint:
  - GET /api/dashboard
  - Returns KPI data + trend data
- [ ] Create `export.service.ts`:
  - exportToExcel(reportData)
  - exportToPDF(reportData)
  - exportToCSV(reportData)
- [ ] Add charts/visualizations:
  - Sales trend graph
  - Product mix pie chart
  - Inventory heatmap
- [ ] Implement scheduled reports (email)
- [ ] Unit and integration tests

## Verification
- [ ] Dashboard loads with real-time KPIs
- [ ] Export functions working (Excel/PDF/CSV)
- [ ] Charts rendering correctly
- [ ] Scheduled reports emailing

## Success Criteria
✅ Dashboard and reporting complete
