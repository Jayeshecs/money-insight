## Story: Full Transactions Review Screen

**Status:** ✅ QA Verified — All E2E Tests Passing (2026-03-01)

**As a** user  
**I want** to view, filter, and review all my parsed transactions in a dedicated screen  
**So that** I can understand my spending and find any miscategorized entries quickly

### Scenarios
- User navigates to `/transactions` and sees all stored transactions paginated
- User can filter by category, date range, and transaction type (INCOME/EXPENSE/TRANSFER)
- User can search transactions by narration keyword
- Transactions are sorted by date descending by default
- Each row shows Date, Narration, Amount (color-coded by type), Category, and a confidence indicator (🟢/🟡/🔴)
- "No transactions" empty state shown when IndexedDB is empty
- Clicking "View All Transactions" on the Dashboard navigates here

### Acceptance Criteria
- Route `/transactions` is accessible from the sidebar navigation
- `[data-testid="transactions-table"]` renders all transactions from IndexedDB, paginated (20 per page)
- `[data-testid="transaction-row"]` exists for each transaction with sub-elements: `data-testid="txn-date"`, `data-testid="txn-narration"`, `data-testid="txn-amount"`, `data-testid="txn-category"`, `data-testid="txn-confidence"`
- Amount column is green for INCOME, red for EXPENSE, grey for TRANSFER/INVESTMENT
- Confidence indicator: 🟢 for HIGH, 🟡 for MEDIUM, 🔴 for LOW (or UNKNOWN)
- `[data-testid="filter-category"]` dropdown filters rows by category; selecting "All" removes the filter
- `[data-testid="filter-date-from"]` and `[data-testid="filter-date-to"]` date inputs filter by date range
- `[data-testid="search-narration"]` text input filters rows by narration substring (case-insensitive)
- `[data-testid="pagination-prev"]` and `[data-testid="pagination-next"]` navigate pages
- `[data-testid="transactions-empty-state"]` is shown when no transactions match filters
- `[data-testid="transaction-count"]` shows total count of filtered results

### Technical Notes
- Read all transactions from `IndexedDbService.getAllTransactions()`
- Filtering and pagination are client-side (no server calls)
- Component: `src/app/features/transactions/transactions-list.component.ts` (new location; migrate from `features/dashboard/transactions.component.ts` — **Story 008 owns this migration**)
- Confidence level comes from `Transaction.confidence` field (`'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN'`); already present in existing model — default to `'HIGH'` for legacy records if missing
- Mobile view: card layout instead of table (responsive breakpoint at 768px)
- Route `/transactions` must be updated to point to the new `TransactionsListComponent`

### PO Clarifications (2026-03-01)

**Q: Migration of existing `transactions.component.ts`?**  
→ **Story 008 owns the migration.** Create new `features/transactions/transactions-list.component.ts`. Remove or stub old `features/dashboard/transactions.component.ts`. Update router.

**Q: Filter combination logic?**  
→ All active filters are combined with **AND** logic.

**Q: Sort options?**  
→ MVP: date descending only. No sort toggle in Sprint 2.

**Q: Confidence level source?**  
→ `Transaction.confidenceLevel` field already exists in the data model. Tester should verify actual field name before writing tests.

**Q: Tablet layout?**  
→ Table layout (same as desktop) at 768–1023px. Card layout is mobile-only (< 768px).

**Q: "0 results" empty state?**  
→ `[data-testid="transactions-empty-state"]` must render both when IndexedDB is empty AND when active filters produce zero results.
