# Test Cases: Full Transactions Review Screen

**Story Reference:** [story_008_Full_Transactions_Review_Screen.md](../stories/story_008_Full_Transactions_Review_Screen.md)  
**Date:** 2026-03-01  
**Author:** QA Tester  
**Total Test Cases:** 15

> **Assumption:** `Transaction.confidenceLevel` (`'HIGH' | 'MEDIUM' | 'LOW'`) is the field used for the confidence indicator per the data model. Story 008 mentions `'UNKNOWN'` as a possible value — this should be treated as equivalent to `'LOW'` (display 🔴) and handled defensively at the component level. Verify field name `confidenceLevel` (not `confidence`) before test execution.

---

## Unit Tests

---

### TC-008-05: Narration search (case-insensitive) filters rows

**Type:** Unit  
**Priority:** High  
**Preconditions:** `TransactionsListComponent` is instantiated in `TestBed` with a stub `IndexedDbService` returning 5 transactions with narrations: `"HDFC ATM"`, `"Amazon Pay"`, `"Swiggy Order"`, `"hdfc neft"`, `"UBER EATS"`.

**Steps:**
1. Instantiate `TransactionsListComponent` in `TestBed`.
2. Set the value of `[data-testid="search-narration"]` to `"hdfc"` and dispatch an `input` event.
3. Call `fixture.detectChanges()`.
4. Count visible `[data-testid="transaction-row"]` elements.

**Expected Result:** Exactly 2 rows are visible: `"HDFC ATM"` and `"hdfc neft"`. Search is case-insensitive. Rows for `"Amazon Pay"`, `"Swiggy Order"`, and `"UBER EATS"` are not rendered.

**data-testid(s):** `search-narration`, `transaction-row`

---

### TC-008-07: Pagination — 20 rows per page; next/prev buttons work

**Type:** Unit  
**Priority:** High  
**Preconditions:** `IndexedDbService` stub returns 45 transactions sorted by `date` descending.

**Steps:**
1. Instantiate `TransactionsListComponent` in `TestBed` with 45 transactions.
2. Call `fixture.detectChanges()`.
3. Count `[data-testid="transaction-row"]` elements — expect 20 on page 1.
4. Click `[data-testid="pagination-next"]`.
5. Call `fixture.detectChanges()`.
6. Count `[data-testid="transaction-row"]` — expect 20 on page 2.
7. Click `[data-testid="pagination-next"]` again.
8. Call `fixture.detectChanges()`.
9. Count `[data-testid="transaction-row"]` — expect 5 on page 3.
10. Click `[data-testid="pagination-prev"]`.
11. Call `fixture.detectChanges()`.
12. Count rows — expect 20 on page 2.

**Expected Result:** Page 1 shows 20 rows; page 2 shows 20 rows; page 3 shows 5 rows. `pagination-prev` returns to the previous page with 20 rows.

**data-testid(s):** `transaction-row`, `pagination-next`, `pagination-prev`

---

### TC-008-08: Transactions sorted by date descending by default

**Type:** Unit  
**Priority:** High  
**Preconditions:** `IndexedDbService` stub returns 5 transactions with dates `2025-11-01`, `2025-09-15`, `2025-12-20`, `2025-10-05`, `2025-08-30` (unsorted).

**Steps:**
1. Instantiate `TransactionsListComponent` in `TestBed`.
2. Call `fixture.detectChanges()`.
3. Read `[data-testid="txn-date"]` text content for all rendered rows in order.

**Expected Result:** Rows appear in descending date order: `2025-12-20`, `2025-11-01`, `2025-10-05`, `2025-09-15`, `2025-08-30`.

**data-testid(s):** `transaction-row`, `txn-date`

---

### TC-008-09: Amount column — green for INCOME, red for EXPENSE, grey for TRANSFER

**Type:** Unit  
**Priority:** High  
**Preconditions:** `IndexedDbService` stub returns 3 transactions: one `INCOME`, one `EXPENSE`, one `TRANSFER`.

**Steps:**
1. Instantiate `TransactionsListComponent` in `TestBed`.
2. Call `fixture.detectChanges()`.
3. For each `[data-testid="txn-amount"]`, read the applied CSS class.

**Expected Result:**  
- INCOME row `txn-amount` has class `amount-income` (or equivalent green color class).  
- EXPENSE row `txn-amount` has class `amount-expense` (or equivalent red color class).  
- TRANSFER row `txn-amount` has class `amount-transfer` (or equivalent grey color class).

**data-testid(s):** `txn-amount`

---

### TC-008-10: Confidence indicator — 🟢 HIGH, 🟡 MEDIUM, 🔴 LOW/UNKNOWN

**Type:** Unit  
**Priority:** Medium  
**Preconditions:** `IndexedDbService` stub returns 3 transactions with `confidenceLevel`: `'HIGH'`, `'MEDIUM'`, `'LOW'` respectively.

**Steps:**
1. Instantiate `TransactionsListComponent` in `TestBed`.
2. Call `fixture.detectChanges()`.
3. Read `[data-testid="txn-confidence"]` text content (or `aria-label`) for each row.

**Expected Result:**  
- `HIGH` → 🟢 (or equivalent green indicator).  
- `MEDIUM` → 🟡 (or equivalent yellow indicator).  
- `LOW` → 🔴 (or equivalent red indicator).  
- Any record missing `confidenceLevel` defaults to `'HIGH'` and shows 🟢.

**data-testid(s):** `txn-confidence`

---

### TC-008-11: Empty state when IndexedDB is empty

**Type:** Unit  
**Priority:** High  
**Preconditions:** `IndexedDbService` stub returns an empty array.

**Steps:**
1. Instantiate `TransactionsListComponent` in `TestBed` with an empty data stub.
2. Call `fixture.detectChanges()`.
3. Query `[data-testid="transactions-empty-state"]`.
4. Query `[data-testid="transactions-table"]`.

**Expected Result:** `[data-testid="transactions-empty-state"]` is present and visible. `[data-testid="transactions-table"]` is either absent or contains zero `transaction-row` elements.

**data-testid(s):** `transactions-empty-state`, `transactions-table`

---

### TC-008-12: Empty state when active filters produce zero results

**Type:** Unit  
**Priority:** High  
**Preconditions:** `IndexedDbService` stub returns 5 transactions; none have the category `"Rent"`.

**Steps:**
1. Instantiate `TransactionsListComponent` in `TestBed`.
2. Set `[data-testid="filter-category"]` to `"Rent"`.
3. Call `fixture.detectChanges()`.
4. Query `[data-testid="transactions-empty-state"]`.

**Expected Result:** `[data-testid="transactions-empty-state"]` is visible. `[data-testid="transaction-count"]` shows `0`.

**data-testid(s):** `filter-category`, `transactions-empty-state`, `transaction-count`

---

### TC-008-13: transaction-count shows correct filtered count

**Type:** Unit  
**Priority:** Medium  
**Preconditions:** `IndexedDbService` stub returns 10 transactions; 3 belong to category `"Food"`.

**Steps:**
1. Instantiate `TransactionsListComponent` in `TestBed`.
2. Call `fixture.detectChanges()`.
3. Read `[data-testid="transaction-count"]` — expect `10`.
4. Set `[data-testid="filter-category"]` to `"Food"` and dispatch a change event.
5. Call `fixture.detectChanges()`.
6. Read `[data-testid="transaction-count"]` again.

**Expected Result:** Before filter: `transaction-count` shows `10`. After category filter applied: `transaction-count` shows `3`.

**data-testid(s):** `transaction-count`, `filter-category`

---

## Component Tests

---

### TC-008-02: All transactions from IndexedDB rendered with correct data-testids

**Type:** Component  
**Priority:** High  
**Preconditions:** `IndexedDbService` stub returns exactly 3 transactions with known `date`, `narration`, `amount`, `category`, `confidenceLevel` values.

**Steps:**
1. Render `TransactionsListComponent` in `TestBed`.
2. Call `fixture.detectChanges()`.
3. Query all `[data-testid="transaction-row"]` elements.
4. For each row, assert presence of `txn-date`, `txn-narration`, `txn-amount`, `txn-category`, `txn-confidence` sub-elements.
5. Verify that the date, narration, and amount text content matches the stub data.

**Expected Result:** 3 rows rendered inside `[data-testid="transactions-table"]`. Each row contains all 5 sub-`data-testid` elements with correct content.

**data-testid(s):** `transactions-table`, `transaction-row`, `txn-date`, `txn-narration`, `txn-amount`, `txn-category`, `txn-confidence`

---

### TC-008-03: Category filter dropdown filters rows correctly (AND logic with other filters)

**Type:** Component  
**Priority:** High  
**Preconditions:** `IndexedDbService` stub returns 6 transactions: 3 `Food`, 2 `Travel`, 1 `Rent`.

**Steps:**
1. Render `TransactionsListComponent` in `TestBed`.
2. Set `[data-testid="filter-category"]` to `"Food"` and dispatch change.
3. Call `fixture.detectChanges()`.
4. Count visible `[data-testid="transaction-row"]` elements.
5. Also set `[data-testid="search-narration"]` to a narration keyword that matches only 2 of the 3 Food rows.
6. Call `fixture.detectChanges()`.
7. Count visible rows.

**Expected Result:** Step 4 yields 3 rows (Food only). Step 7 yields 2 rows (AND logic applied — category = Food AND narration matches). Setting category back to `"All"` removes the category filter.

**data-testid(s):** `filter-category`, `search-narration`, `transaction-row`

---

### TC-008-04: Date range filter (from/to) filters rows correctly

**Type:** Component  
**Priority:** High  
**Preconditions:** `IndexedDbService` stub returns 5 transactions with dates: `2025-10-01`, `2025-10-15`, `2025-11-01`, `2025-11-20`, `2025-12-05`.

**Steps:**
1. Render `TransactionsListComponent` in `TestBed`.
2. Set `[data-testid="filter-date-from"]` to `2025-10-15` and dispatch change.
3. Set `[data-testid="filter-date-to"]` to `2025-11-20` and dispatch change.
4. Call `fixture.detectChanges()`.
5. Count visible `[data-testid="transaction-row"]` elements.

**Expected Result:** Exactly 3 rows are shown: `2025-10-15`, `2025-11-01`, `2025-11-20`. Rows for `2025-10-01` and `2025-12-05` are filtered out.

**data-testid(s):** `filter-date-from`, `filter-date-to`, `transaction-row`

---

### TC-008-06: Multiple filters combined with AND logic

**Type:** Component  
**Priority:** High  
**Preconditions:** `IndexedDbService` stub returns 8 transactions covering multiple categories, dates, and narrations.

**Steps:**
1. Render `TransactionsListComponent` in `TestBed`.
2. Set `[data-testid="filter-category"]` to `"Food"`.
3. Set `[data-testid="filter-date-from"]` to `2025-11-01`.
4. Set `[data-testid="filter-date-to"]` to `2025-11-30`.
5. Set `[data-testid="search-narration"]` to `"swiggy"`.
6. Call `fixture.detectChanges()`.
7. Count visible rows — only transactions matching ALL 3 conditions should appear.

**Expected Result:** Only rows satisfying category = Food AND date in November 2025 AND narration containing "swiggy" (case-insensitive) are rendered.

**data-testid(s):** `filter-category`, `filter-date-from`, `filter-date-to`, `search-narration`, `transaction-row`

---

## E2E Tests

---

### TC-008-01: /transactions route loads TransactionsListComponent

**Type:** E2E  
**Priority:** High  
**Preconditions:** App is running; Angular router is configured with `/transactions` pointing to `TransactionsListComponent`.

**Steps:**
1. Navigate browser directly to `/transactions`.
2. Wait for page to load fully.
3. Assert `[data-testid="transactions-table"]` is present in the DOM.

**Expected Result:** `/transactions` route renders `TransactionsListComponent`. The `[data-testid="transactions-table"]` element is visible. No 404 or router error occurs.

**data-testid(s):** `transactions-table`

---

### TC-008-14: Sidebar nav link for /transactions is present and works

**Type:** E2E  
**Priority:** High  
**Preconditions:** App is running at desktop viewport (≥ 1024px); at least 1 transaction in IndexedDB.

**Steps:**
1. Navigate browser to `/dashboard`.
2. Locate the sidebar navigation link for "Transactions" (`[data-testid="sidebar-nav"] a[href="/transactions"]`).
3. Click the link.
4. Wait for navigation.
5. Assert URL is `/transactions` and `[data-testid="transactions-table"]` is visible.

**Expected Result:** Clicking the Transactions sidebar nav item navigates to `/transactions` and renders the transactions table.

**data-testid(s):** `sidebar-nav`, `transactions-table`

---

### TC-008-15: Mobile (<768px) shows transaction-card instead of transaction-row

**Type:** E2E  
**Priority:** High  
**Preconditions:** Browser viewport set to 375px wide; at least 3 transactions in IndexedDB.

**Steps:**
1. Set Playwright viewport to `{ width: 375, height: 812 }`.
2. Navigate to `/transactions`.
3. Wait for page to load.
4. Assert `[data-testid="transaction-card"]` elements are present.
5. Assert `[data-testid="transaction-row"]` elements are NOT present.
6. Check that each card shows Narration, Amount, Date, and Category.

**Expected Result:** At mobile viewport, `[data-testid="transaction-card"]` is rendered for each transaction. `[data-testid="transaction-row"]` is absent. Card content includes narration, amount, date, and category.

**data-testid(s):** `transaction-card`, `transaction-row`

---

## Summary Table

| TC | Description | Type | Priority |
|----|-------------|------|----------|
| TC-008-01 | /transactions route loads TransactionsListComponent | E2E | High |
| TC-008-02 | All transactions from IndexedDB rendered with correct data-testids | Component | High |
| TC-008-03 | Category filter dropdown filters rows correctly (AND logic with other filters) | Component | High |
| TC-008-04 | Date range filter (from/to) filters rows correctly | Component | High |
| TC-008-05 | Narration search (case-insensitive) filters rows | Unit | High |
| TC-008-06 | Multiple filters combined with AND logic | Component | High |
| TC-008-07 | Pagination: 20 rows per page; next/prev buttons work | Unit | High |
| TC-008-08 | Transactions sorted by date descending by default | Unit | High |
| TC-008-09 | Amount column: green for INCOME, red for EXPENSE, grey for TRANSFER | Unit | High |
| TC-008-10 | Confidence indicator: 🟢 HIGH, 🟡 MEDIUM, 🔴 LOW/UNKNOWN | Unit | Medium |
| TC-008-11 | Empty state when IndexedDB empty | Unit | High |
| TC-008-12 | Empty state when active filters produce zero results | Unit | High |
| TC-008-13 | transaction-count shows correct filtered count | Unit | Medium |
| TC-008-14 | Sidebar nav link for /transactions is present and works | E2E | High |
| TC-008-15 | Mobile (<768px) shows transaction-card instead of transaction-row | E2E | High |
