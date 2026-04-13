## Test Cases for Story 023: Dashboard Drilldown Transactions Panel Enhancement

**Story Reference:** [story_023_Dashboard_Drilldown_Transactions_Panel_Enhancement.md](../stories/story_023_Dashboard_Drilldown_Transactions_Panel_Enhancement.md)  
**Date:** 2026-04-13  
**Author:** QA Automation Engineer

---

### TC-023-01: Panel title shows "All Transactions" by default

**Objective:** Verify the panel title defaults to "All Transactions" when no widget row is selected.

#### Steps
1. Navigate to `/dashboard`.
2. Ensure no widget row is selected (fresh load or clear selection).
3. Inspect `[data-testid="transactions-panel-title"]`.

#### Expected Result
- `[data-testid="transactions-panel-title"]` text content equals "All Transactions" (case-sensitive).
- `[data-testid="transactions-record-count"]` displays `"Records: Y / Y"` where both numbers are equal and match the total transaction count for the current period.

---

### TC-023-02: Panel title updates on Level 1 (category) row click with Auto ON

**Objective:** Verify the panel title and record count update immediately when a category row is clicked and the widget's Auto toggle is ON.

#### Steps
1. Navigate to `/dashboard`. Ensure transactions exist for the period.
2. Locate the Expenses widget. Click its `[data-testid="widget-auto-toggle"]` to enable Auto.
3. Click a Level 1 category row (`[data-testid="widget-row-category"]`) labelled "Lifestyle" in the Expenses widget.
4. Inspect `[data-testid="transactions-panel-title"]` and `[data-testid="transactions-record-count"]`.

#### Expected Result
- `[data-testid="transactions-panel-title"]` text equals "Expense Transactions — Lifestyle".
- `[data-testid="transactions-record-count"]` displays `"Records: X / Y"` where X is the count of Expense → Lifestyle transactions and Y is the total transaction count.
- The panel update happens within 500 ms of the row click (no manual action required).

---

### TC-023-03: Panel title updates on Level 2 (sub-category) row click with Auto ON

**Objective:** Verify the panel title shows Category / Sub-category when a Level 2 row is clicked.

#### Steps
1. Navigate to `/dashboard`. Enable Auto on the Expenses widget.
2. Click the "Lifestyle" Level 1 row to expand sub-categories.
3. Click the "Dining" sub-category row (`[data-testid="widget-row-subcategory"]`).
4. Inspect `[data-testid="transactions-panel-title"]`.

#### Expected Result
- `[data-testid="transactions-panel-title"]` text equals "Expense Transactions — Lifestyle / Dining".

---

### TC-023-04: Panel does NOT update on row click with Auto OFF

**Objective:** Verify that clicking a widget row when Auto is OFF does not refresh the Transactions Panel.

#### Steps
1. Navigate to `/dashboard`. Ensure all widgets have Auto toggle OFF.
2. Note current `[data-testid="transactions-panel-title"]` text (e.g. "All Transactions").
3. Click a Level 1 category row in the Income widget ("Salary").
4. Inspect `[data-testid="transactions-panel-title"]`.
5. Inspect `[data-testid="drilldown-prompt"]`.

#### Steps
#### Expected Result
- `[data-testid="transactions-panel-title"]` still shows "All Transactions" (unchanged).
- `[data-testid="drilldown-prompt"]` is visible with prompt text indicating a row is selected but drilldown is deferred.
- `[data-testid="drilldown-show-btn"]` is present and clickable.

---

### TC-023-05: "Show Drilldown" button manually triggers panel refresh (Auto OFF)

**Objective:** Verify clicking "Show Drilldown" refreshes the panel when Auto is OFF and a row is selected.

#### Steps
1. Navigate to `/dashboard`. Ensure Auto is OFF on all widgets.
2. Click the "Salary" Level 1 row in the Income widget. Confirm `drilldown-prompt` appears.
3. Click `[data-testid="drilldown-show-btn"]`.
4. Inspect `[data-testid="transactions-panel-title"]`.

#### Expected Result
- `[data-testid="transactions-panel-title"]` updates to "Income Transactions — Salary".
- `[data-testid="drilldown-prompt"]` is no longer visible after the refresh.
- Transactions in the table/cards are filtered to Income → Salary transactions only.

---

### TC-023-06: Turning Auto ON with existing selection immediately refreshes panel

**Objective:** Verify that enabling Auto on a widget with an already-selected row triggers an immediate panel refresh.

#### Steps
1. Navigate to `/dashboard`. Ensure Auto is OFF on all widgets.
2. Click "Salary" row in the Income widget (panel should NOT refresh).
3. Click the Income widget's `[data-testid="widget-auto-toggle"]` to enable Auto.
4. Inspect `[data-testid="transactions-panel-title"]`.

#### Expected Result
- `[data-testid="transactions-panel-title"]` immediately updates to "Income Transactions — Salary" (without an additional row click).

---

### TC-023-07: Only one widget can have Auto ON at a time

**Objective:** Verify enabling Auto on a second widget disables Auto on the first widget.

#### Steps
1. Navigate to `/dashboard`.
2. Enable Auto on the Expenses widget (`widget-auto-toggle` checked).
3. Enable Auto on the Income widget.
4. Inspect both `widget-auto-toggle` elements (Expenses and Income).

#### Expected Result
- Income widget's `[data-testid="widget-auto-toggle"]` has `aria-checked="true"`.
- Expenses widget's `[data-testid="widget-auto-toggle"]` has `aria-checked="false"` (automatically unchecked).

---

### TC-023-08: Search button opens inline search input

**Objective:** Verify clicking the search button reveals the search input, focused and ready for input.

#### Steps
1. Navigate to `/dashboard`.
2. Verify `[data-testid="transactions-search-input"]` is NOT visible initially.
3. Click `[data-testid="transactions-search-btn"]`.
4. Inspect `[data-testid="transactions-search-input"]`.

#### Expected Result
- `[data-testid="transactions-search-input"]` is visible after click.
- The element has focus (is the `document.activeElement`).
- Placeholder text is "Search transactions…".

---

### TC-023-09: Search filters transactions in real time

**Objective:** Verify typing in the search input filters the transaction list in real time.

#### Steps
1. Navigate to `/dashboard`. Click `[data-testid="transactions-search-btn"]`.
2. Note the initial `[data-testid="transactions-record-count"]` value (e.g. "Records: 500 / 500").
3. Type "NEFT" into `[data-testid="transactions-search-input"]`.
4. Wait ≤ 300 ms. Inspect:
   - `[data-testid="transactions-record-count"]`
   - The rows in `[data-testid="transactions-table"]`

#### Expected Result
- `[data-testid="transactions-record-count"]` X value decreases to the count of transactions containing "NEFT" in any text field.
- Only rows containing "NEFT" (case-insensitive) in Narration, Category, Sub-category, Account/Source, Date, or Amount are visible in the table.

---

### TC-023-10: Search is case-insensitive

**Objective:** Verify search matches regardless of letter case.

#### Steps
1. Navigate to `/dashboard`. Open search. Type "neft" (lowercase).
2. Note matching rows.
3. Clear input (click `transactions-search-clear`). Type "NEFT" (uppercase).
4. Note matching rows.

#### Expected Result
- Both "neft" and "NEFT" return the same set of matching rows.

---

### TC-023-11: Clear button resets search without collapsing input

**Objective:** Verify the clear button clears search text but keeps the input open.

#### Steps
1. Navigate to `/dashboard`. Open search. Type "NEFT".
2. Click `[data-testid="transactions-search-clear"]`.
3. Inspect `[data-testid="transactions-search-input"]` value and visibility.
4. Inspect `[data-testid="transactions-record-count"]`.

#### Expected Result
- `[data-testid="transactions-search-input"]` value is empty string `""`.
- `[data-testid="transactions-search-input"]` is still visible (not collapsed).
- `[data-testid="transactions-record-count"]` X value equals Y (all transactions for current selection shown; no filter active).

---

### TC-023-12: Escape key collapses search input and resets filter

**Objective:** Verify pressing Escape clears and collapses the search input.

#### Steps
1. Navigate to `/dashboard`. Open search. Type "NEFT".
2. Press `Escape` key while focus is in `[data-testid="transactions-search-input"]`.
3. Inspect `[data-testid="transactions-search-input"]` visibility.
4. Inspect `[data-testid="transactions-record-count"]`.

#### Expected Result
- `[data-testid="transactions-search-input"]` is hidden (collapsed).
- `[data-testid="transactions-record-count"]` X value equals Y (no active search filter).

---

### TC-023-13: Second click on search button collapses input

**Objective:** Verify clicking `transactions-search-btn` a second time collapses the search input.

#### Steps
1. Navigate to `/dashboard`. Click `[data-testid="transactions-search-btn"]` to open search.
2. Type "ABC".
3. Click `[data-testid="transactions-search-btn"]` again.
4. Inspect `[data-testid="transactions-search-input"]` visibility.

#### Expected Result
- `[data-testid="transactions-search-input"]` is hidden.
- Search filter is cleared (record count X = Y).

---

### TC-023-14: Desktop table has correct columns and default sort (≥ 768 px)

**Objective:** Verify the desktop table renders with correct column headers and sorts by date descending by default.

#### Steps
1. Set viewport to 1280 × 800 px. Navigate to `/dashboard`.
2. Inspect `[data-testid="transactions-table"]`.
3. Read all `<th>` text content values.
4. Inspect `[data-testid="sort-col-date"]` for `aria-sort` attribute.
5. Read the first 3 rows' Date cell values.

#### Expected Result
- `[data-testid="transactions-table"]` is visible.
- `<th>` headers (in order): "Account/Source", "Category", "Sub-category", "Date", "Amount", "Narration".
- `[data-testid="sort-col-date"]` has `aria-sort="descending"` and a `arrow_downward` Material Icon.
- The first row's date is the most recent; each subsequent row's date is ≤ the previous.

---

### TC-023-15: Clicking Amount column header sorts ascending then descending

**Objective:** Verify clicking a sortable column header toggles sort direction.

#### Steps
1. Set viewport to 1280 × 800 px. Navigate to `/dashboard`.
2. Click `[data-testid="sort-col-amount"]`.
3. Inspect `[data-testid="sort-col-amount"]` `aria-sort` and visible icon.
4. Read first 3 row amounts.
5. Click `[data-testid="sort-col-amount"]` again.
6. Inspect `aria-sort` and re-read first 3 row amounts.

#### Expected Result
- After first click: `aria-sort="ascending"`, `arrow_upward` icon visible. First row has the smallest amount; amounts increase progressing down.
- After second click: `aria-sort="descending"`, `arrow_downward` icon visible. First row has the largest amount; amounts decrease progressing down.
- `[data-testid="sort-col-date"]` shows `aria-sort="none"` and no sort icon after clicking Amount.

---

### TC-023-16: Amount cells are colour-coded by transaction type

**Objective:** Verify INCOME amounts are green, EXPENSE amounts are red, INVESTMENT amounts are blue, TRANSFER amounts are grey.

#### Steps
1. Navigate to `/dashboard` with mixed transaction types visible in the panel.
2. For each transaction type, inspect the computed `color` CSS value of `[data-testid="txn-row-amount"]` cells.

#### Test Data
- At least one transaction of each type (INCOME, EXPENSE, INVESTMENT, TRANSFER) must be present.

#### Expected Result

| Type | Expected colour |
|------|----------------|
| INCOME | `rgb(46, 125, 50)` (`#2E7D32`) |
| EXPENSE | `rgb(198, 40, 40)` (`#C62828`) |
| INVESTMENT | `rgb(21, 101, 192)` (`#1565C0`) |
| TRANSFER | `rgb(97, 97, 97)` (`#616161`) |

---

### TC-023-17: Narration cell truncated with ellipsis and full text in title attribute

**Objective:** Verify narration text is truncated visually and the full text is accessible via the `title` tooltip.

#### Steps
1. Navigate to `/dashboard` at 1280 × 800 px.
2. Find a row in `[data-testid="transactions-table"]` with a narration exceeding the column width.
3. Inspect the `<td>` narration cell for computed `text-overflow`, `overflow`, and `white-space` CSS values.
4. Read the `title` attribute from the narration cell.

#### Expected Result
- `text-overflow: ellipsis`, `overflow: hidden`, `white-space: nowrap` are applied to the narration cell.
- The `title` attribute contains the full (untruncated) narration string.

---

### TC-023-18: Mobile card layout visible at < 768 px; table hidden

**Objective:** Verify card layout replaces the table at mobile widths.

#### Steps
1. Set viewport to 375 × 812 px. Navigate to `/dashboard`.
2. Verify `[data-testid="transactions-table"]` visibility.
3. Verify `[data-testid="transaction-card"]` elements visibility and count.

#### Expected Result
- `[data-testid="transactions-table"]` is hidden (computed `display: none` or not in DOM).
- At least one `[data-testid="transaction-card"]` element is visible.
- Number of visible cards is ≤ 20 (one page).

---

### TC-023-19: Mobile card anatomy correct

**Objective:** Verify each transaction card contains all required data elements.

#### Steps
1. Set viewport to 375 × 812 px. Navigate to `/dashboard`.
2. Inspect the first `[data-testid="transaction-card"]`.
3. Read child elements by their `data-testid` attributes.

#### Expected Result
- `[data-testid="card-date"]` is present with a `YYYY-MM-DD` formatted date, bold text, left-aligned.
- `[data-testid="card-amount"]` is present with amount in `₹X,XX,XXX.XX` format, bold, right-aligned, colour matches transaction type.
- `[data-testid="card-category"]` is present with `"Category / Sub-category"` format.
- `[data-testid="card-account"]` is present with the account/source identifier.
- `[data-testid="card-narration"]` is present with narration text, clamped to at most 2 visible lines (computed `-webkit-line-clamp: 2` or `line-clamp: 2`).

---

### TC-023-20: Mobile Order-by dropdown changes card sort order

**Objective:** Verify the "Order by" dropdown re-sorts mobile cards.

#### Steps
1. Set viewport to 375 × 812 px. Navigate to `/dashboard`.
2. Inspect `[data-testid="transactions-mobile-sort-select"]` and note default selection (Date).
3. Note the `card-date` value of the first card.
4. Change `[data-testid="transactions-mobile-sort-select"]` to "Amount".
5. Note the `card-amount` value of the first card.

#### Expected Result
- `[data-testid="transactions-mobile-sort-select"]` is visible and has options including at least: Date, Amount, Category, Account/Source.
- After changing to Amount: the first card has the largest amount (descending) or smallest amount (ascending) — must be a different card than before if amounts differ.
- Change takes effect without clicking any Apply button.

---

### TC-023-21: Pagination controls — first page state

**Objective:** Verify pagination controls show correct state on page 1.

#### Steps
1. Navigate to `/dashboard` with > 20 transactions available in the panel.
2. Inspect `[data-testid="transactions-pagination-prev"]`.
3. Inspect `[data-testid="transactions-pagination-next"]`.
4. Inspect `[data-testid="transactions-page-indicator"]`.

#### Expected Result
- `[data-testid="transactions-pagination-prev"]` has `disabled` attribute; is not clickable / appears greyed.
- `[data-testid="transactions-pagination-next"]` does NOT have `disabled` attribute.
- `[data-testid="transactions-page-indicator"]` text reads "Page 1 / N" where N > 1.

---

### TC-023-22: Pagination — navigate to next page and back

**Objective:** Verify page navigation works correctly and shows the correct records.

#### Steps
1. Navigate to `/dashboard` with > 20 transactions. Verify on page 1 (20 rows/cards visible).
2. Click `[data-testid="transactions-pagination-next"]`.
3. Inspect `[data-testid="transactions-page-indicator"]` and the displayed rows.
4. Click `[data-testid="transactions-pagination-prev"]`.
5. Inspect `[data-testid="transactions-page-indicator"]`.

#### Expected Result
- After step 2: page indicator shows "Page 2 / N"; prev button is enabled; rows shown are the next 20 records (not the same as page 1).
- After step 4: page indicator shows "Page 1 / N"; prev button is disabled again; first row matches the first row from the initial state.

---

### TC-023-23: Pagination resets to page 1 on widget row selection change

**Objective:** Verify selecting a different widget row resets pagination to page 1.

#### Steps
1. Navigate to `/dashboard`. Enable Auto on Income widget. Navigate to page 2 of All Transactions.
2. Click "Salary" category row in the Income widget.
3. Inspect `[data-testid="transactions-page-indicator"]`.

#### Expected Result
- `[data-testid="transactions-page-indicator"]` text reads "Page 1 / N" after the selection change.

---

### TC-023-24: Pagination resets to page 1 on search

**Objective:** Verify opening search and typing resets pagination to page 1.

#### Steps
1. Navigate to `/dashboard`. Navigate to page 3 of the transactions panel.
2. Click `[data-testid="transactions-search-btn"]`. Type any character.
3. Inspect `[data-testid="transactions-page-indicator"]`.

#### Expected Result
- `[data-testid="transactions-page-indicator"]` text reads "Page 1 / N" (reset to page 1).

---

### TC-023-25: Empty state shown when no transactions match the current filter

**Objective:** Verify the empty state element appears when the drilldown returns zero transactions.

#### Steps
1. Navigate to `/dashboard`. Enable Auto on any widget.
2. Select a category/sub-category row that has zero transactions in the current period (or apply a search string that matches nothing, e.g. "ZZZZNOTFOUND").
3. Inspect `[data-testid="transactions-panel-empty-state"]`.
4. Inspect `[data-testid="transactions-table"]` row count (desktop).

#### Expected Result
- `[data-testid="transactions-panel-empty-state"]` is visible with text "No transactions found for the selected filter."
- `[data-testid="transactions-table"]` has zero `<tbody> <tr>` elements; OR at ≥ 768 px, the table body is empty.
- At < 768 px: zero `[data-testid="transaction-card"]` elements are visible.
- `[data-testid="transactions-record-count"]` shows "Records: 0 / Y".

---

### TC-023-26: Record count X updates live as search text changes

**Objective:** Verify the X value in "Records: X / Y" updates within 300 ms of each keystroke.

#### Steps
1. Navigate to `/dashboard`. Open search.
2. Type "N" and wait 300 ms. Note X value.
3. Type "NE" and wait 300 ms. Note X value.
4. Type "NEF" and wait 300 ms. Note X value.

#### Expected Result
- X decreases (or stays) as more characters are typed and the filter narrows.
- Each update occurs within 300 ms of the keystroke.
- Y value does not change (total is constant).

---

### TC-023-27: Regression — Stories 017–022 assertions still pass after Story 023

**Objective:** Verify that implementing Story 023 does not break any existing UI elements from previous stories.

#### Steps
1. Navigate to `/dashboard`.
2. Verify all Story 017 elements: `granularity-select`, `period-start`, `period-end`, `apply-period-btn`.
3. Verify all Story 018 elements: `overall-income`, `overall-expense`, `overall-investment`, `overall-transfer`, `account-source-filter`.
4. Verify all Story 019 elements: `widget-auto-toggle` (4 instances), `widget-row-category`, `widget-row-subcategory`.
5. Verify all Story 022 elements: `app-header`, `header-app-title`, `header-nav-dashboard`, `header-hamburger-btn` (visible at < 992 px).

#### Expected Result
- All queried `data-testid` selectors return at least one DOM element in the expected state.
- No JavaScript console errors appear during navigation or interaction.
