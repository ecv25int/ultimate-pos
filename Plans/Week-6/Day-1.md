# Week 6, Day 1: Data Migration from Laravel to NestJS

## Objective
Migrate all data from Laravel `superpos` to NestJS database.

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
