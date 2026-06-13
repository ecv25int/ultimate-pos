# Week 6, Day 1: Data Migration from Laravel to NestJS

## Objective
Migrate all data from Laravel `superpos` to NestJS database.

## PHP project at: 
This is a migration project. PHP Source code at /opt/homebrew/var/www/superpos/ 
Update Plans/Plan-Checklist.md  file when finish, with all the plans implemented so far, including this one. 
For the current week, update also the progress in Plans/Week-X/Day-X.md for the days already done. 

## Tasks
- [ ] Create Laravel export scripts (artisan commands):
  - Export users with password hashes
  - Export businesses & locations
  - Export products & variations (with pricing)
  - Export contacts (customers & suppliers)
  - Export transactions (sales, purchases, returns)
  - Export accounts & journal entries
- [ ] Validate data consistency in exports
- [ ] Update Laravel DB export to match NestJS schema
- [ ] Create NestJS import service:
  - Read exported JSON/CSV
  - Transform for Prisma schema
  - Batch insert (10k+ records per batch)
  - Handle relationships (foreign keys)
- [ ] Create seed scripts for each entity
- [ ] Test with sample data first (100 records)
- [ ] Verify data integrity post-import (checksums)

## Verification
- [ ] All data exported successfully
- [ ] No errors on transformation
- [ ] Import completes without errors
- [ ] Record counts match source

## Success Criteria
✅ Data export/transformation complete
