# Week 4, Day 2: Journal Entries & Double-Entry Bookkeeping

## Objective
Implement double-entry journal entries with GL posting.

## Tasks
- [ ] Verify AccountTransaction model
- [ ] Create `journal.service.ts`:
  - createJournalEntry(description, entries[])
  - postToLedger(journalEntryId) — finalize entry
  - reverseEntry(journalEntryId) — reverse posted entry
- [ ] Implement debit/credit validation: sum(debits) === sum(credits)
- [ ] Entry status: draft, posted, reversed
- [ ] Create journal.controller.ts:
  - POST /api/journal-entries
  - GET /api/journal-entries/:id
  - POST /api/journal-entries/:id/post
  - POST /api/journal-entries/:id/reverse
- [ ] Create journal entry DTOs
- [ ] Unit tests for entry validation

## Verification
- [ ] Journal entries balance (Dr = Cr)
- [ ] Posted entries locked (can't edit)
- [ ] Reversal working correctly
- [ ] All posting errors caught

## Success Criteria
✅ Double-entry bookkeeping foundation operational
