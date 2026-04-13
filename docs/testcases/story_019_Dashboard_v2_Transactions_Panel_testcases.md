# Test Cases — Story 019: Dashboard v2.0 Integrated Transactions Panel

**Story Reference:** `docs/stories/story_019_Dashboard_v2_Transactions_Panel.md`  
**Sprint:** Sprint 4  
**Status:** To Do  
**Author:** QA Tester Agent  
**Date:** 2026-04-13

---

## Scope

Covers all acceptance criteria for the **Transactions Panel** embedded in the Dashboard v2.0:
- Panel Title (default and widget-driven updates)
- Record Count format
- Search (expand, type, escape, toggle)
- Transaction Table (desktop/tablet ≥ 768 px)
- Transaction Cards (mobile < 768 px)
- Pagination (prev/next disabled states, navigation)
- Empty State
- Reactivity to period apply and account filter changes

Automation layer: Playwright E2E → `tests/e2e/tests/story_019_transactions_panel.spec.ts`

---

## Shared Test Data

All tests that need seeded data use the following core transactions (seeded into IndexedDB via `page.evaluate()`).  
Additional filler rows (10 EXPENSE/Miscellaneous) are added for pagination tests to push total beyond 20.

| ID       | Date       | Description              | Amount | Type       | Category      | Sub-category | Account  |
|----------|------------|--------------------------|--------|------------|---------------|--------------|----------|
| tx-i01   | 2025-03-01 | Salary Feb Finastra      | 75,000 | INCOME     | Salary        | Finastra     | HDFC-001 |
| tx-i02   | 2025-03-15 | Bonus Finastra           | 10,000 | INCOME     | Salary        | Finastra     | HDFC-001 |
| tx-i03   | 2025-03-07 | Freelance NEFT A         | 20,000 | INCOME     | Freelance     | Project-A    | SBI-002  |
| tx-i04   | 2025-03-22 | Freelance NEFT B         | 5,000  | INCOME     | Freelance     | Project-B    | SBI-002  |
| tx-e01   | 2025-03-01 | Rent March               | 15,000 | EXPENSE    | Housing       | Rent         | HDFC-001 |
| tx-e02   | 2025-03-05 | Grocery Big Basket       | 4,500  | EXPENSE    | Food          | Groceries    | HDFC-001 |
| tx-e03   | 2025-03-12 | Dinner Zomato            | 2,000  | EXPENSE    | Food          | Restaurants  | SBI-002  |
| tx-e04   | 2025-03-15 | Electricity BESCOM       | 1,800  | EXPENSE    | Utilities     | Electricity  | SBI-002  |
| tx-e05   | 2025-03-20 | Water board bill         | 500    | EXPENSE    | Utilities     | Water        | HDFC-001 |
| tx-e06   | 2025-03-28 | Amazon shopping          | 3,200  | EXPENSE    | Lifestyle     | Shopping     | HDFC-001 |
| tx-v01   | 2025-03-10 | MF Lumpsum axis          | 25,000 | INVESTMENT | Mutual Fund   | Lumpsum      | HDFC-001 |
| tx-v02   | 2025-03-01 | SIP Mirae                | 10,000 | INVESTMENT | Mutual Fund   | SIP          | HDFC-001 |
| tx-v03   | 2025-03-18 | NIFTY50 buy              | 8,000  | INVESTMENT | Stocks        | NIFTY50      | SBI-002  |
| tx-t01   | 2025-03-25 | FD Opening HDFC          | 20,000 | TRANSFER   | Fixed Deposit | FD           | HDFC-001 |
| tx-t02   | 2025-03-05 | Savings sweep            | 5,000  | TRANSFER   | Savings Acct  | Transfer     | HDFC-001 |
| tx-fill-1..10 | 2025-03-01..10 | Filler expense 1-10 | 100–1000 | EXPENSE | Miscellaneous | Other | HDFC-001 |

---

## Positive Test Cases

---

## Test Case: TC-019-E01 — Default Panel Title is "All Transactions"

**Objective:** Verify `transactions-panel-title` is visible on page load and defaults to the text "All Transactions".

### Steps
1. Seed IndexedDB with core test data.
2. Navigate to `/dashboard`.
3. Wait for `networkidle`.
4. Locate `[data-testid="transactions-panel-title"]`.

### Test Data
- Core seed transactions.

### Expected Result
- `transactions-panel-title` is visible at all times.
- Its text content is exactly `"All Transactions"`.

---

## Test Case: TC-019-E02 — Title Updates on Sub-Category Row Selection (Auto ON)

**Objective:** Verify that when the Income widget's Auto toggle is ON and a sub-category row ("Finastra" under "Salary") is selected, the panel title changes to `"Income Transactions — Salary / Finastra"` within 300 ms.

### Steps
1. Seed IndexedDB with core test data.
2. Navigate to `/dashboard`.
3. Locate `[data-testid="widget-income"] [data-testid="widget-auto-toggle"]`.
4. Click the Auto toggle; verify `aria-checked="true"`.
5. Click the "Salary" category row in the Income widget to expand it.
6. Click the "Finastra" sub-category row.
7. Wait up to 400 ms.
8. Read `textContent()` of `transactions-panel-title`.

### Test Data
- Core seed with `tx-i01` and `tx-i02` (Salary / Finastra).

### Expected Result
- `transactions-panel-title` text is `"Income Transactions — Salary / Finastra"`.
- Title updates within 300 ms of the sub-category row click.

---

## Test Case: TC-019-E03 — Record Count Shows "Records: X / Y" Format

**Objective:** Verify `transactions-record-count` always shows a count label in the format `Records: X / Y`.

### Steps
1. Seed IndexedDB with core test data.
2. Navigate to `/dashboard`.
3. Wait for `networkidle`.
4. Read `textContent()` of `[data-testid="transactions-record-count"]`.

### Test Data
- Core seed transactions.

### Expected Result
- `transactions-record-count` is visible.
- Its text matches the regex `^Records:\s*\d+\s*\/\s*\d+$`.
- X ≤ Y (filtered count cannot exceed total).

---

## Test Case: TC-019-E04 — Search Button Reveals Focused Search Input

**Objective:** Verify `transactions-search-btn` is visible and that clicking it reveals `transactions-search-input` with keyboard focus.

### Steps
1. Seed IndexedDB with core test data.
2. Navigate to `/dashboard`.
3. Confirm `transactions-search-input` is NOT visible before clicking.
4. Click `[data-testid="transactions-search-btn"]`.
5. Wait 300 ms.
6. Check visibility and focus of `[data-testid="transactions-search-input"]`.

### Test Data
- Core seed transactions.

### Expected Result
- `transactions-search-btn` is visible (magnifier icon 🔍) to the right of `transactions-record-count`.
- Before click: `transactions-search-input` is not visible.
- After click: `transactions-search-input` is visible and has keyboard focus.

---

## Test Case: TC-019-E05 — Search Filters Rows Case-Insensitively; Count Updates in Real Time

**Objective:** Verify that typing in `transactions-search-input` filters visible rows (case-insensitive) and updates `transactions-record-count` (X value).

### Steps
1. Seed IndexedDB with core test data.
2. Navigate to `/dashboard`; record initial X from `transactions-record-count`.
3. Click `transactions-search-btn` to reveal input.
4. Type `"finastra"` (lowercase) in `transactions-search-input`.
5. Wait 400 ms for Angular change detection.
6. Read updated `transactions-record-count`.

### Test Data
- Core seed: `tx-i01` and `tx-i02` have narration containing "Finastra".

### Expected Result
- X value decreases or stays equal after filtering (never increases).
- Rows with narration containing "Finastra" (case-insensitive) remain visible.
- `transactions-record-count` still matches regex `Records: X / Y`.
- Y (denominator) remains unchanged.

---

## Test Case: TC-019-E06 — Escape Collapses Search Input and Clears Filter

**Objective:** Verify pressing Escape collapses `transactions-search-input` and reverts `transactions-record-count` to pre-search X value.

### Steps
1. Seed IndexedDB with core test data.
2. Navigate to `/dashboard`; record initial count text.
3. Open search; type `"finastra"`; wait 400 ms; record filtered count text.
4. Press `Escape` on the input.
5. Wait 400 ms.
6. Check input visibility and count text.

### Test Data
- Core seed transactions.

### Expected Result
- `transactions-search-input` is no longer visible after Escape.
- `transactions-record-count` reverts to the value before typing.
- If filtered and unfiltered counts were different, the reverted value must equal the pre-filter value.

---

## Test Case: TC-019-E07 — Table Visible at ≥768px; Cards Visible at <768px

**Objective:** Verify responsive display: `transactions-table` shown on desktop/tablet, `transaction-card` list shown on mobile.

### Steps (desktop)
1. Set viewport to 1280×800.
2. Navigate to `/dashboard`.
3. Confirm `[data-testid="transactions-table"]` is visible.

### Steps (mobile)
1. Set viewport to 375×812.
2. Navigate to `/dashboard`.
3. Confirm `[data-testid="transactions-table"]` is NOT visible.
4. Confirm `[data-testid="transaction-card"]` (first) is visible.

### Test Data
- Core seed transactions.

### Expected Result (desktop)
- `transactions-table` is visible.

### Expected Result (mobile)
- `transactions-table` is hidden (CSS `display: none`).
- At least one `transaction-card` is visible.

---

## Test Case: TC-019-E08 — Table Has All Required Column Headers

**Objective:** Verify `transactions-table` contains the six required columns in the correct order.

### Steps
1. Set viewport to 1280×800.
2. Navigate to `/dashboard`.
3. Locate all `<th>` elements within `[data-testid="transactions-table"]`.
4. Collect and normalise header text.

### Test Data
- Core seed transactions.

### Expected Result
- Six column headers are present (order: Account/Source, Category, Sub-category, Date, Amount, Narration).
- Each of the following strings appears in at least one header (case-insensitive): `account`, `category`, `sub-category`, `date`, `amount`, `narration`.

---

## Test Case: TC-019-E09 — Amount Colour-Coded by Transaction Type

**Objective:** Verify that the Amount column/card field uses green for INCOME, red for EXPENSE, blue for INVESTMENT, and grey for TRANSFER.

### Steps
1. Set viewport to 1280×800.
2. Navigate to `/dashboard`.
3. For rows of each type, inspect `[data-testid="transaction-amount"]` CSS class or style.

### Test Data
- Core seed with representatives of all four types.

### Expected Result
- INCOME amount element has a class or style indicating green (e.g., class `income`, `text-green`, or `color: green`).
- EXPENSE amount element indicates red.
- INVESTMENT amount element indicates blue.
- TRANSFER amount element indicates grey.

---

## Test Case: TC-019-E10 — Pagination Previous Disabled on Page 1

**Objective:** Verify that `transactions-pagination-prev` is disabled on page 1 and enabled after navigating to page 2.

### Steps
1. Seed IndexedDB with 25+ transactions (core + 10 filler rows).
2. Navigate to `/dashboard`.
3. Check `[data-testid="transactions-pagination-prev"]` is disabled.
4. Click `[data-testid="transactions-pagination-next"]`.
5. Wait 400 ms.
6. Check `transactions-pagination-prev` is now enabled.

### Test Data
- Core seed + 10 filler rows (25 total).

### Expected Result
- On page 1: `transactions-pagination-prev` is disabled.
- On page 2: `transactions-pagination-prev` is enabled.

---

## Test Case: TC-019-E10b — Pagination Next Disabled on Last Page

**Objective:** Verify `transactions-pagination-next` is disabled when all rows fit on one page.

### Steps
1. Seed IndexedDB with ≤20 transactions (first 5 of core seed).
2. Navigate to `/dashboard`.
3. Check `[data-testid="transactions-pagination-next"]` is disabled.

### Test Data
- 5 transactions (fewer than 1 page of 20).

### Expected Result
- `transactions-pagination-next` is disabled.

---

## Test Case: TC-019-E11 — Empty State Shown When No Results

**Objective:** Verify `transactions-panel-empty-state` is shown and contains "No transactions found" when the search filter yields zero results.

### Steps
1. Seed IndexedDB with core test data.
2. Navigate to `/dashboard`.
3. Open search; type `"zzz_no_match_xyz_99999"`.
4. Wait 500 ms.
5. Check `[data-testid="transactions-panel-empty-state"]` visibility and text.

### Test Data
- Core seed transactions (none matching the nonsense query).

### Expected Result
- `transactions-panel-empty-state` is visible.
- Its text content contains `"No transactions found"`.
- No `transaction-row` or `transaction-card` is visible.

---

## Test Case: TC-019-E12 — Search Button Toggles (Collapses) When Clicked Again

**Objective:** Verify clicking `transactions-search-btn` while the input is open collapses it (toggle behaviour).

### Steps
1. Navigate to `/dashboard`.
2. Click `transactions-search-btn` → input opens (Step A).
3. Click `transactions-search-btn` again → input collapses (Step B).

### Test Data
- No specific seed required.

### Expected Result
- After Step A: `transactions-search-input` is visible.
- After Step B: `transactions-search-input` is not visible.

---

## Test Case: TC-019-E13 — Auto Toggle OFF — Row Clicks Do Not Change Panel Title

**Objective:** Verify that clicking a category or sub-category row in a widget when its Auto toggle is OFF does not change the panel title.

### Steps
1. Seed IndexedDB with core test data.
2. Navigate to `/dashboard`.
3. Confirm Income widget Auto toggle is `aria-checked="false"` (default; if ON click to turn off).
4. Record current `transactions-panel-title` text.
5. Click a category row in the Income widget.
6. Wait 400 ms.
7. Read `transactions-panel-title` text again.

### Test Data
- Core seed transactions.

### Expected Result
- Panel title does not change after the row click.
- Title remains `"All Transactions"` (or whatever the pre-click value was).

---

## Test Case: TC-019-E14 — Apply Period Resets Panel to "All Transactions"

**Objective:** Verify that clicking `apply-period-btn` (Story 017) resets the panel title to "All Transactions", collapses any open search input, and returns to page 1.

### Steps
1. Seed IndexedDB with core test data.
2. Navigate to `/dashboard`.
3. Open search input; type `"salary"`.
4. Click `[data-testid="apply-period-btn"]`.
5. Wait 800 ms.
6. Check `transactions-panel-title`, search input visibility, and `transactions-pagination-prev` disabled state.

### Test Data
- Core seed transactions.

### Expected Result
- `transactions-panel-title` text is `"All Transactions"`.
- `transactions-search-input` is not visible (collapsed).
- `transactions-pagination-prev` is disabled (page 1).

---

## Negative / Edge-Case Test Cases

---

## Test Case: TC-019-N01 — Empty IndexedDB — Panel Shows Empty State

**Objective:** Verify that when IndexedDB has no transactions, the empty state is shown immediately.

### Steps
1. Clear all IndexedDB transactions (do not seed).
2. Navigate to `/dashboard`.
3. Wait for panel to load.
4. Check `transactions-panel-empty-state`.

### Test Data
- Empty database.

### Expected Result
- `transactions-panel-empty-state` is visible.
- `transactions-record-count` shows `Records: 0 / 0`.

---

## Test Case: TC-019-N02 — Period Change Resets to Page 1

**Objective:** Verify that changing `activePeriodStart`/`activePeriodEnd` and clicking Apply resets the panel to page 1 even if the user was on page 2.

### Steps
1. Seed IndexedDB with 25+ transactions.
2. Navigate to `/dashboard`; wait for transactions to load.
3. Navigate to page 2 (click `transactions-pagination-next`).
4. Click `apply-period-btn`.
5. Wait 800 ms.
6. Check `transactions-pagination-prev` disabled state.

### Test Data
- Core seed + 10 filler rows.

### Expected Result
- `transactions-pagination-prev` is disabled (page 1).

---

## Out-of-Scope (Manual / Non-E2E Tests)

| Test | Reason |
|------|--------|
| Narration truncation with `title` tooltip | Requires precise pixel-level content overflow measurement — manual visual check |
| Default sort order (Date descending) | Depends on live seeded data order in IndexedDB — verify manually in dev |
| Search text persists across pagination pages | Complex interaction requiring stable component state — verify manually |
| Transaction count X/Y computed correctly | Arithmetic correctness — verified via unit tests on `DashboardStateService` |
