# Week 4, Day 1: Chart of Accounts & Account Hierarchy

## Objective
Build foundational general ledger structure with account hierarchy.

## Tasks
- [ ] Verify Account, AccountType models in schema
- [ ] Create `accounts.service.ts`:
  - createAccount(code, name, type, parentAccountId)
  - getAccountBalance(accountId, asOfDate)
  - getAccountTransactions(accountId, fromDate, toDate)
  - deactivateAccount(accountId)
- [ ] Implement account hierarchy (parent-child relationships)
- [ ] Seed standard accounts:
  - 1000-1999: Assets
  - 2000-2999: Liabilities
  - 3000-3999: Equity
  - 4000-4999: Income/Revenue
  - 5000-6999: Expenses
- [ ] Create accounts controller:
  - GET /api/accounts
  - POST /api/accounts
  - GET /api/accounts/:id
  - PUT /api/accounts/:id
- [ ] Unit tests for balance calculations

## Verification
- [ ] Chart of accounts created with proper hierarchy
- [ ] Account codes unique per business
- [ ] Parent-child relationships working
- [ ] Balance calculations accurate

## Success Criteria
✅ Chart of accounts fully functional
