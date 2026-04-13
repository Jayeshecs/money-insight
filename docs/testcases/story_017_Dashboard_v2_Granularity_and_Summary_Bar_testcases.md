# Test Cases — Story 017: Dashboard v2.0 Granularity Bar & Overall Summary Bar

**Story Reference:** `docs/stories/story_017_Dashboard_v2_Granularity_and_Summary_Bar.md`  
**Sprint:** Sprint 4  
**Status:** To Do  
**Author:** QA Tester Agent  
**Date:** 2026-04-13

---

## Scope

Covers all acceptance criteria for:
- **Section 1 — Granularity Bar** (`GranularityBarComponent`)
- **Section 2 — Overall Summary Bar** (`OverallSummaryBarComponent`)
- **Responsive layout** at mobile viewport (< 768 px)

Automation layer: Playwright E2E → `tests/e2e/tests/story_017_granularity_summary_bar.spec.ts`

---

## Shared Test Data

All tests that need seeded data use the following transactions (seeded into IndexedDB via `page.evaluate()`):

| ID     | Date       | Description    | Amount  | Type       | Account  |
|--------|------------|----------------|---------|------------|----------|
| tx001  | 2025-03-05 | Salary March   | 75,000  | INCOME     | HDFC-001 |
| tx002  | 2025-03-10 | Grocery        | 4,500   | EXPENSE    | HDFC-001 |
| tx003  | 2025-03-15 | Mutual Fund    | 10,000  | INVESTMENT | HDFC-001 |
| tx004  | 2025-03-20 | Transfer Out   | 5,000   | TRANSFER   | HDFC-001 |
| tx005  | 2025-03-07 | Freelance      | 20,000  | INCOME     | SBI-002  |
| tx006  | 2025-03-25 | Electricity    | 1,800   | EXPENSE    | SBI-002  |
| tx007  | 2025-04-02 | Salary April   | 75,000  | INCOME     | HDFC-001 |
| tx008  | 2025-04-10 | Rent April     | 15,000  | EXPENSE    | HDFC-001 |

Expected totals (all transactions, full period):
- **Income:** ₹1,70,000 (75,000 + 20,000 + 75,000)
- **Expense:** ₹21,300 (4,500 + 1,800 + 15,000)
- **Investment:** ₹10,000
- **Transfer:** ₹5,000

---

## Positive Test Cases

---

## Test Case: TC-017-E01 — Granularity Select Exists with Correct Options and Default

**Objective:** Verify `granularity-select` is a dropdown with exactly three options (`monthly`, `quarterly`, `yearly`) and defaults to `monthly`.

### Steps
1. Seed IndexedDB with shared test data.
2. Navigate to `/dashboard`.
3. Wait for `networkidle`.
4. Locate `[data-testid="granularity-select"]`.
5. Count the `<option>` elements.
6. Read the current selected value.

### Test Data
- Shared test data seeded via `page.evaluate()`.

### Expected Result
- `granularity-select` is visible.
- Exactly 3 options are present with values: `monthly`, `quarterly`, `yearly` (in any order).
- Currently selected value is `monthly`.

---

## Test Case: TC-017-E02 — Period Start and End Inputs Display YYYY-MM Strings

**Objective:** Verify `period-start` and `period-end` are editable inputs displaying valid `YYYY-MM` strings when granularity is `monthly`.

### Steps
1. Seed IndexedDB with shared test data.
2. Navigate to `/dashboard`.
3. Wait for `networkidle`.
4. Read `inputValue()` from `[data-testid="period-start"]`.
5. Read `inputValue()` from `[data-testid="period-end"]`.

### Test Data
- Shared test data (date range: 2025-03-05 to 2025-04-10).

### Expected Result
- Both inputs are visible and editable.
- Both values match regex `/^\d{4}-\d{2}$/`.
- `period-start` value is ≤ `period-end` value.
- `period-start` value reflects the earliest available transaction month (`2025-03`).
- `period-end` value reflects the latest available transaction month (`2025-04`).

---

## Test Case: TC-017-E03 — Dual-Handle Range Slider is Present

**Objective:** Verify `period-range-slider` element is rendered on the dashboard.

### Steps
1. Seed IndexedDB with shared test data.
2. Navigate to `/dashboard`.
3. Wait for `networkidle`.
4. Locate `[data-testid="period-range-slider"]`.

### Test Data
- Shared test data.

### Expected Result
- `period-range-slider` element is visible.

---

## Test Case: TC-017-E04 — Changing Granularity Resets Period Range

**Objective:** Verify that switching `granularity-select` to `quarterly` resets the period handles to the full data range snapped to quarter boundaries.

### Steps
1. Seed IndexedDB with shared test data.
2. Navigate to `/dashboard`.
3. Record current `period-start` and `period-end` values (monthly format).
4. Select `quarterly` from `granularity-select`.
5. Wait 500 ms for Angular change detection.
6. Read new `period-start` and `period-end` values.

### Test Data
- Shared test data (date range: 2025-03 to 2025-04 → quarterly: Q1-2025 to Q2-2025).

### Expected Result
- `period-start` value snaps to a quarter start boundary: month is one of `01`, `04`, `07`, `10` **or** the value is in `YYYY-Q#` format (per PO clarification).
- `period-end` value snaps to a quarter end boundary: month is one of `03`, `06`, `09`, `12` **or** the value is in `YYYY-Q#` format.
- The period still covers the full available data range (earliest → latest transaction).

---

## Test Case: TC-017-E05 — Apply Button is Visible and Enabled

**Objective:** Verify `apply-period-btn` is present and clickable at all times.

### Steps
1. Seed IndexedDB with shared test data.
2. Navigate to `/dashboard`.
3. Wait for `networkidle`.
4. Locate `[data-testid="apply-period-btn"]`.

### Test Data
- Shared test data.

### Expected Result
- `apply-period-btn` is visible.
- `apply-period-btn` is enabled (not disabled).

---

## Test Case: TC-017-E06 — Overall Summary Tiles Show Formatted INR Amounts

**Objective:** Verify all four summary tiles (`overall-income`, `overall-expense`, `overall-investment`, `overall-transfer`) display amounts in INR with `₹` symbol.

### Steps
1. Seed IndexedDB with shared test data.
2. Navigate to `/dashboard`.
3. Click `apply-period-btn`.
4. Wait 800 ms for re-aggregation.
5. Read `textContent()` of each summary tile.

### Test Data
- Shared test data.

### Expected Result
- All four tiles are visible.
- Each tile's text contains the `₹` symbol.
- `overall-income` displays ₹1,70,000.00 (or equivalent with Indian commas).
- `overall-expense` displays ₹21,300.00.
- `overall-investment` displays ₹10,000.00.
- `overall-transfer` displays ₹5,000.00.

---

## Test Case: TC-017-E07 — Account Source Filter Multiselect Badge Shows Count

**Objective:** Verify `account-source-filter` multiselect exists and its badge shows the numeric count of selected accounts.

### Steps
1. Seed IndexedDB with shared test data (2 distinct accounts).
2. Navigate to `/dashboard`.
3. Locate `[data-testid="account-source-filter"]`.
4. Read `textContent()` of `[data-testid="account-source-filter-badge"]`.

### Test Data
- Shared test data (accounts: `HDFC-001`, `SBI-002`).

### Expected Result
- `account-source-filter` is visible.
- Badge is visible and displays a numeric string (e.g., `"2"`).
- All accounts are selected by default (badge count = total available accounts).

---

## Test Case: TC-017-E08 — Deselecting Account Immediately Updates Totals

**Objective:** Verify that deselecting an account in `account-source-filter` immediately re-aggregates summary totals without requiring Apply.

### Steps
1. Seed IndexedDB with shared test data.
2. Navigate to `/dashboard`.
3. Click `apply-period-btn` to establish baseline totals.
4. Record `textContent()` of `overall-income`.
5. Click `account-source-filter` to open the dropdown.
6. Click the first account option (e.g., `HDFC-001`).
7. Wait 500 ms.
8. Read `textContent()` of `overall-income` again.

### Test Data
- Shared test data. After deselecting HDFC-001, income should drop from ₹1,70,000 to ₹20,000 (SBI-002 only).

### Expected Result
- `overall-income` changes immediately after deselecting the account.
- No Apply click was performed between step 4 and step 8.
- The new income value excludes transactions from the deselected account.

---

## Test Case: TC-017-E09 — Empty State Shown for Zero-Transaction Period

**Objective:** Verify `dashboard-empty-state` is displayed when the active period contains no transactions.

### Steps
1. Seed IndexedDB with shared test data (all data in 2025-03 and 2025-04).
2. Navigate to `/dashboard`.
3. Fill `period-start` with `2020-01`.
4. Fill `period-end` with `2020-12`.
5. Click `apply-period-btn`.
6. Wait 800 ms.

### Test Data
- Shared test data. Range `2020-01` to `2020-12` contains zero transactions.

### Expected Result
- `[data-testid="dashboard-empty-state"]` is visible.
- Summary tiles show ₹0 or are hidden.

---

## Test Case: TC-017-E10 — INR Amounts Use Indian Thousands Separator

**Objective:** Verify amounts larger than 99,999 are formatted with the Indian grouping system (₹X,XX,XXX.XX).

### Steps
1. Seed IndexedDB with a single INCOME transaction of ₹1,23,456.
2. Navigate to `/dashboard`.
3. Click `apply-period-btn`.
4. Read `textContent()` of `overall-income`.

### Test Data
```
id: tx-big-1, date: 2025-03-05, amount: 123456, type: INCOME, account: HDFC-001
```

### Expected Result
- `overall-income` displays `₹1,23,456.00` (Indian grouping: one group of 3 digits, then groups of 2).
- Does NOT display `₹123,456.00` (US grouping).

---

## Test Case: TC-017-E11 — Editing Period Input Does Not Update Totals Before Apply

**Objective:** Verify that changing `period-start` via manual input does NOT trigger a data refresh until Apply is clicked.

### Steps
1. Seed IndexedDB with shared test data.
2. Navigate to `/dashboard`.
3. Click `apply-period-btn` and record baseline `overall-income` text.
4. Change `period-start` to equal `period-end` (narrow the range).
5. Dispatch `change` event on `period-start`.
6. Wait 500 ms.
7. Read `overall-income` text again (without clicking Apply).

### Test Data
- Shared test data.

### Expected Result
- `overall-income` value is **unchanged** from the baseline recorded in step 3.
- The pending period change has NOT triggered re-aggregation.

---

## Test Case: TC-017-E12 — Reselecting All Accounts Restores Full Totals

**Objective:** Verify that reselecting a previously deselected account immediately restores totals to their pre-deselection values.

### Steps
1. Seed IndexedDB with shared test data.
2. Navigate to `/dashboard` → click Apply → record baseline income.
3. Open `account-source-filter` → deselect first account → wait 400 ms.
4. Reselect the same account → wait 400 ms.
5. Read `overall-income` text.

### Test Data
- Shared test data.

### Expected Result
- `overall-income` after step 5 equals the baseline from step 2.

---

## Test Case: TC-017-E13 — Empty IndexedDB Defaults Period to Today; Totals Show ₹0

**Objective:** Verify that when IndexedDB is empty, `period-start` and `period-end` both default to the current `YYYY-MM`, and all totals are ₹0 (or empty-state shown).

### Steps
1. Clear IndexedDB completely.
2. Navigate to `/dashboard`.
3. Wait for `networkidle` and granularity bar to render.
4. Read `period-start` and `period-end` values.
5. Click `apply-period-btn`.
6. Wait 800 ms.

### Test Data
- No transactions in IndexedDB.

### Expected Result
- `period-start` = `period-end` = current month in `YYYY-MM` format (e.g., `2026-04`).
- Either `dashboard-empty-state` is visible OR all summary tiles display `₹0.00`.

---

## Test Case: TC-017-E16 — Summary Tiles Have Correct Colour Classes

**Objective:** Verify colour coding: income = green, expense = red, investment = blue, transfer = grey.

### Steps
1. Seed IndexedDB with shared test data.
2. Navigate to `/dashboard` → click Apply.
3. Inspect computed styles or CSS classes of each summary tile.

### Test Data
- Shared test data (all types present).

### Expected Result
- `overall-income`: computed `color` style resolves to a green hue (or has CSS class containing `green`).
- `overall-expense`: resolves to red.
- `overall-investment`: resolves to blue.
- `overall-transfer`: resolves to grey.
- Icon indicators: ↑ for income, ↓ for expense, 💼 for investment, ⇄ for transfer.

---

## Test Case: TC-017-E17 — Yearly Granularity Changes Period Input Format to YYYY

**Objective:** Verify selecting `yearly` changes `period-start` and `period-end` formats to `YYYY`.

### Steps
1. Seed IndexedDB with shared test data.
2. Navigate to `/dashboard`.
3. Select `yearly` from `granularity-select`.
4. Wait 500 ms.
5. Read `period-start` input value.

### Test Data
- Shared test data.

### Expected Result
- `period-start` value matches regex `/^\d{4}$/` (4-digit year only).
- `period-end` value matches regex `/^\d{4}$/`.

---

## Responsive / Mobile Test Cases

---

## Test Case: TC-017-M01 — Mobile Viewport: Granularity Bar Stacks Vertically

**Objective:** Verify that at viewport width 375 px, the Granularity Bar stacks into two rows.

### Steps
1. Set viewport to 375 × 812 (iPhone SE).
2. Seed IndexedDB with shared test data.
3. Navigate to `/dashboard`.
4. Measure bounding boxes of `granularity-select` and `period-start`.

### Test Data
- Shared test data.

### Expected Result
- All elements (`granularity-select`, `period-start`, `period-end`, `apply-period-btn`) are visible.
- `granularity-select` Y position is less than `period-start` Y position (select is above the slider row).
- No horizontal overflow.

---

## Test Case: TC-017-M02 — Mobile Viewport: Summary Bar Shows 2×2 Grid

**Objective:** Verify Overall Summary Bar tiles render in two rows of two on mobile.

### Steps
1. Set viewport to 375 × 812.
2. Seed IndexedDB with shared test data.
3. Navigate to `/dashboard` → click Apply.
4. Measure bounding boxes of `overall-income`, `overall-expense`, `overall-investment`.

### Test Data
- Shared test data.

### Expected Result
- `overall-income` and `overall-expense` share approximately the same Y coordinate (row 1).
- `overall-investment` Y position is greater than `overall-income` Y + height (row 2).
- `account-source-filter` appears below the 2×2 grid.

---

## Edge / Negative Test Cases

---

## Test Case: TC-017-N01 — Slider Left Handle Cannot Exceed Right Handle

**Objective:** Verify the slider range constraint prevents left handle from being dragged past right handle.

### Steps
1. Seed IndexedDB with shared test data.
2. Navigate to `/dashboard`.
3. Attempt to set `period-start` to a date string *after* the current `period-end` value.
4. Dispatch `change` event.
5. Read the resulting `period-start` value.

### Test Data
- `period-start` = `2025-06` (beyond `period-end` = `2025-04`).

### Expected Result
- `period-start` is clamped to ≤ `period-end` (either corrected to the end value or rejected back to previous start).
- No UI error or crash.

---

## Test Case: TC-017-N02 — All Accounts Deselected Shows Empty State or Zero Totals

**Objective:** Verify that deselecting ALL accounts leads to an empty-state or ₹0 totals.

### Steps
1. Seed IndexedDB with shared test data.
2. Navigate to `/dashboard` → click Apply.
3. Open `account-source-filter`.
4. Deselect all listed accounts one by one.
5. Observe summary tiles.

### Test Data
- Shared test data (2 accounts).

### Expected Result
- Either `dashboard-empty-state` appears, or all summary tiles display `₹0.00`.
- No uncaught JS error in console.

---

## Test Case: TC-017-N03 — Navigating Away and Back Resets Pending Period

**Objective:** Verify that pending (un-applied) period changes are discarded when the user navigates away and returns.

### Steps
1. Seed IndexedDB with shared test data.
2. Navigate to `/dashboard` → click Apply → record `overall-income`.
3. Change `period-start` to a narrower value (do NOT click Apply).
4. Navigate to `/transactions`.
5. Navigate back to `/dashboard`.
6. Read `overall-income`.

### Test Data
- Shared test data.

### Expected Result
- `period-start` is reset to the last applied value (not the pending value from step 3).
- `overall-income` reflects the same value as recorded in step 2.

---

## Test Case: TC-017-N04 — Granularity Change Does Not Trigger Dashboard Refresh

**Objective:** Verify that changing the granularity alone (without clicking Apply) does NOT re-aggregate dashboard sections.

### Steps
1. Seed IndexedDB with shared test data.
2. Navigate to `/dashboard` → click Apply → record `overall-income`.
3. Change `granularity-select` to `quarterly`.
4. Wait 1000 ms.
5. Read `overall-income`.

### Test Data
- Shared test data.

### Expected Result
- `overall-income` value is unchanged from step 2 baseline (section 2 did NOT re-aggregate).

---

## Coverage Matrix

| Acceptance Criterion | Test Case(s) | Automated? |
|---|---|---|
| `granularity-select` has 3 options; default `monthly` | TC-017-E01 | ✅ Playwright |
| `period-start` / `period-end` show `YYYY-MM` | TC-017-E02 | ✅ Playwright |
| `period-range-slider` exists | TC-017-E03 | ✅ Playwright |
| Granularity change resets period to full range | TC-017-E04 | ✅ Playwright |
| `apply-period-btn` present and enabled | TC-017-E05 | ✅ Playwright |
| Summary tiles display INR amounts with ₹ | TC-017-E06 | ✅ Playwright |
| INR uses Indian thousands separator | TC-017-E10 | ✅ Playwright |
| `account-source-filter` multiselect; badge shows count | TC-017-E07 | ✅ Playwright |
| Deselecting account immediately updates totals | TC-017-E08 | ✅ Playwright |
| `dashboard-empty-state` on zero-transaction period | TC-017-E09 | ✅ Playwright |
| Totals unchanged before Apply click | TC-017-E11 | ✅ Playwright |
| Reselecting all accounts restores totals | TC-017-E12 | ✅ Playwright |
| Empty DB → today's YYYY-MM; ₹0 | TC-017-E13 | ✅ Playwright |
| Income=green, Expense=red, Invest=blue, Transfer=grey | TC-017-E16 | ✅ Playwright |
| Yearly granularity changes format to `YYYY` | TC-017-E17 | ✅ Playwright |
| Mobile: granularity bar rows stack | TC-017-M01 | ✅ Playwright |
| Mobile: summary bar 2×2 grid | TC-017-M02 | ✅ Playwright |
| Left handle ≤ right handle enforced | TC-017-N01 | ✅ Playwright |
| All accounts deselected → empty/₹0 | TC-017-N02 | ✅ Playwright |
| Pending period reset on navigation | TC-017-N03 | ✅ Playwright |
| Granularity change alone ≠ dashboard refresh | TC-017-N04 | ✅ Playwright |
| Account filter independent of Apply button | TC-017-E08, TC-017-E12 | ✅ Playwright |
| Slider/input bidirectional sync | Manual (requires drag simulation) | ⬜ Manual |
| Tooltip on Apply shows "Applying…" state | Manual | ⬜ Manual |

---

## Gaps / Ambiguities Found in Story Acceptance Criteria

1. **Slider drag simulation** — Playwright can simulate drag gestures on `range` inputs, but dual-handle custom sliders implemented via CDK drag-drop require bounding-box–based drag. The story does not specify the exact DOM structure (two `<input type="range">` elements, or a CDK drag container). Tests that require dragging are delegated to manual execution until the component is implemented.

2. **`account-source-filter-badge` testid** — The acceptance criteria state a badge shows the selected count, but the testid for the badge itself is not specified. The test file uses `[data-testid="account-source-filter-badge"]` as a reasonable assumption; this must be confirmed against the implemented component.

3. **Individual account option testids** — The story does not specify the testid pattern for individual options in the account multiselect. The tests assume `[data-testid^="account-option-"]` (prefix match). Confirm with the dev implementation.

4. **Quarterly period-start format** — PO clarification says `YYYY-Q#` for quarterly, but the test also accepts `YYYY-MM` clamped to quarter months (e.g., `2025-04`) since some implementations encode quarters as their first month. The spec should be made explicit.

5. **Badge shows count vs. "All" text** — The story states the badge must show the numeric count of selected accounts (not "All"). TC-017-E07 enforces this, but the story does not define what happens when zero accounts are selected (badge should presumably show `"0"`). TC-017-N02 covers this implicitly.

6. **Slider left handle step — programmatic test** — True step-size enforcement (one granularity unit per step) cannot reliably be asserted via keyboard/drag in Playwright without knowing the pixel-to-value mapping. This is best covered by a Jasmine unit test on `GranularityBarComponent`.

7. **↑ / ↓ / 💼 / ⇄ icon presence** — TC-017-E16 checks colour but the full icon assertion (text node contains `↑`) is left for a component unit test, since the icon may be an SVG or pseudo-element invisible to `textContent()`.
