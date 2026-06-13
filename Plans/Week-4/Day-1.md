# Week 4, Day 1: Chart of Accounts & Account Hierarchy

## Objective
Build foundational general ledger structure with account hierarchy.

## Tasks
- [x] Verify Account, AccountType models in schema
- [x] Create `accounts.service.ts`:
  - [x] createAccount(code, name, type, parentAccountId)
  - [x] getAccountBalance(accountId, asOfDate)
  - [x] getAccountTransactions(accountId, fromDate, toDate)
  - [x] deactivateAccount(accountId)
- [x] Implement account hierarchy (parent-child relationships)
- [x] Seed standard accounts:
  - [x] 1000-1999: Assets
  - [x] 2000-2999: Liabilities
  - [x] 3000-3999: Equity
  - [x] 4000-4999: Income/Revenue
  - [x] 5000-6999: Expenses
- [x] Create accounts controller:
  - [x] GET /api/accounts
  - [x] POST /api/accounts
  - [x] GET /api/accounts/:id
  - [x] PUT /api/accounts/:id
- [x] Unit tests for balance calculations

## Verification
- [x] Chart of accounts created with proper hierarchy
- [x] Account codes unique per business
- [x] Parent-child relationships working
- [x] Balance calculations accurate

## Success Criteria
✅ Chart of accounts fully functional
