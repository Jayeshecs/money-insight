# Test Cases: Story 018 — Dashboard v2.0 Analytical Tree-Table Widgets

**Story Reference:** `docs/stories/story_018_Dashboard_v2_Analytical_Tree_Widgets.md`  
**Sprint:** 4  
**Status:** Ready for Execution  
**Created:** 2026-04-13

---

## Overview

Story 018 introduces four **Analytical Tree-Table Widgets** on the Dashboard v2.0:
- **Expenses** (`widget-expenses`)
- **Investment** (`widget-investment`)
- **Income** (`widget-income`)
- **Transfer** (`widget-transfer`)

Each widget renders a two-level collapsible tree (Category → Sub-category), sorted descending by amount, with an Auto toggle for live Transactions Panel reactivity (Story 019).

---

## Test Data Summary

All E2E tests seed IndexedDB with deterministic transactions (YYYY-03 period, two accounts):

| Widget | Category | Sub-category | Amount |
|---|---|---|---|
| Expenses | Housing | Rent | ₹15,000 |
| Expenses | Food | Groceries | ₹4,500 |
| Expenses | Food | Restaurants | ₹2,000 |
| Expenses | Utilities | Electricity | ₹1,800 |
| Expenses | Utilities | Water | ₹500 |
| Income | Salary | Basic | ₹75,000 |
| Income | Salary | Bonus | ₹10,000 |
| Income | Freelance | Project-A | ₹20,000 |
| Income | Freelance | Project-B | ₹5,000 |
| Investment | Mutual Fund | Lumpsum | ₹25,000 |
| Investment | Mutual Fund | SIP | ₹10,000 |
| Investment | Stocks | NIFTY50 | ₹8,000 |
| Transfer | Fixed Deposit | FD | ₹20,000 |
| Transfer | Savings Account | Transfer | ₹5,000 |

Expected sorted order per widget:
- **Expenses:** Housing (₹15,000) → Food (₹6,500) → Utilities (₹2,300)
- **Income:** Salary (₹85,000) → Freelance (₹25,000)
- **Investment:** Mutual Fund (₹35,000) → Stocks (₹8,000)
- **Transfer:** Fixed Deposit (₹20,000) → Savings Account (₹5,000)

---

## Test Cases

---

### TC-018-E01: All Four Widgets Are Present

**Objective:** Verify that all four widget containers are rendered on the dashboard.

#### Steps
1. Navigate to `/dashboard` with seeded transactions.
2. Wait for network idle.

#### Expected Result
- `[data-testid="widget-expenses"]` is visible.
- `[data-testid="widget-investment"]` is visible.
- `[data-testid="widget-income"]` is visible.
- `[data-testid="widget-transfer"]` is visible.

**Automatable:** Yes — `TC-018-E01` in spec file.

---

### TC-018-E02: Desktop 2×2 Grid Layout

**Objective:** Verify that on desktop viewports (≥768 px), widgets are arranged in a 2-column CSS grid.

#### Steps
1. Set viewport to 1280×800.
2. Navigate to `/dashboard`.
3. Inspect bounding boxes of all four widgets.

#### Expected Result
- Expenses and Investment share the same top Y-coordinate (top row).
- Income and Transfer share the same top Y-coordinate (bottom row).
- Expenses X < Investment X (Expenses is left column).
- Income Y > Expenses Y + height (Income is below Expenses).

**Automatable:** Yes — `TC-018-E02` in spec file.

---

### TC-018-E03: Mobile Single-Column Layout

**Objective:** Verify that on mobile viewports (<768 px), widgets stack in a single column.

#### Steps
1. Set viewport to 375×812.
2. Navigate to `/dashboard`.
3. Inspect bounding boxes.

#### Expected Result
- Each widget fills ≥80% of viewport width.
- Investment appears below Expenses; Income below Investment; Transfer below Income.

**Automatable:** Yes — `TC-018-E03` in spec file.

---

### TC-018-E04: Auto Toggle Default State

**Objective:** Verify that all four Auto toggles have `aria-checked="false"` on initial load (no Auto mode active by default).

#### Steps
1. Navigate to `/dashboard`.
2. Inspect `[data-testid="widget-auto-toggle"]` inside each widget.

#### Expected Result
- All four toggles have `aria-checked="false"`.

**Automatable:** Yes — `TC-018-E04` in spec file.

---

### TC-018-E05: Auto Toggle Mutual Exclusivity

**Objective:** Verify that enabling one widget's Auto toggle disables all others (only one can be active at a time).

#### Steps
1. Navigate to `/dashboard`.
2. Click the Auto toggle inside `widget-expenses`.
3. Verify `widget-expenses` toggle has `aria-checked="true"`; others have `"false"`.
4. Click the Auto toggle inside `widget-income`.
5. Verify `widget-income` is now `"true"`; `widget-expenses` reverts to `"false"`.

#### Expected Result
- Exactly one toggle is `"true"` at any moment.
- All others are `"false"`.

**Automatable:** Yes — `TC-018-E05` in spec file.

---

### TC-018-E06: Expenses Widget — Category Rows, Descending Sort

**Objective:** Verify that `widget-expenses` shows category rows sorted by total amount descending.

#### Steps
1. Navigate to `/dashboard` with seeded data.
2. Click **Apply** (Story 017 period button) to populate widgets.
3. Inspect `[data-testid="widget-row-category"]` rows inside `widget-expenses`.

#### Test Data
- Housing: ₹15,000 (should be first)
- Food: ₹6,500 (should be second)
- Utilities: ₹2,300 (should be third)

#### Expected Result
- At least one category row is visible.
- Row amounts appear in descending order (each row ≤ previous row's amount).

**Automatable:** Yes — `TC-018-E06` in spec file.

---

### TC-018-E07: Income Widget — Category Rows, Descending Sort

**Objective:** Verify that `widget-income` shows category rows sorted by total amount descending.

#### Steps
1. Navigate to `/dashboard` with seeded data.
2. Apply period.
3. Inspect category rows inside `widget-income`.

#### Test Data
- Salary: ₹85,000 (first)
- Freelance: ₹25,000 (second)

#### Expected Result
- Rows appear in descending order by amount.

**Automatable:** Yes — `TC-018-E07` in spec file.

---

### TC-018-E08: Investment Widget — Category Rows, Descending Sort

**Objective:** Verify that `widget-investment` shows category rows sorted by total amount descending.

#### Test Data
- Mutual Fund: ₹35,000 (first)
- Stocks: ₹8,000 (second)

#### Expected Result
- Rows appear in descending order by amount.

**Automatable:** Yes — `TC-018-E08` in spec file.

---

### TC-018-E09: Transfer Widget — Category Rows Present

**Objective:** Verify that `widget-transfer` renders at least one category row.

#### Test Data
- Fixed Deposit: ₹20,000
- Savings Account: ₹5,000

#### Expected Result
- At least one `[data-testid="widget-row-category"]` is visible inside `widget-transfer`.

**Automatable:** Yes — `TC-018-E09` in spec file.

---

### TC-018-E10: Sub-category Rows Hidden by Default

**Objective:** Verify that sub-category rows (`widget-row-subcategory`) are collapsed (not visible) on page load, before any category row is clicked.

#### Steps
1. Navigate to `/dashboard` and apply period.
2. Do NOT click any category row.
3. Inspect all `[data-testid="widget-row-subcategory"]` elements.

#### Expected Result
- Zero visible sub-category rows across all four widgets.
- Any sub-category rows in the DOM must be `hidden` or `display: none`.

**Automatable:** Yes — `TC-018-E10` in spec file.

---

### TC-018-E11: Clicking Category Row Expands Sub-categories

**Objective:** Verify that clicking a category row reveals its child sub-category rows.

#### Steps
1. Navigate to `/dashboard` and apply period.
2. Click the first category row inside `widget-expenses`.
3. Wait for animation.

#### Expected Result
- One or more `[data-testid="widget-row-subcategory"]` rows become visible inside `widget-expenses`.

**Automatable:** Yes — `TC-018-E11` in spec file.

---

### TC-018-E12: Clicking Category Row Again Collapses Sub-categories

**Objective:** Verify toggle behaviour — a second click on an expanded category row collapses it.

#### Steps
1. Navigate to `/dashboard` and apply period.
2. Click the first category row in `widget-expenses` (expand).
3. Click the same row again (collapse).

#### Expected Result
- Sub-category rows are hidden again after the second click.

**Automatable:** Yes — `TC-018-E12` in spec file.

---

### TC-018-E13: Sub-categories Sorted Descending Within Category

**Objective:** Verify that sub-category rows within an expanded category are ordered by amount descending.

#### Steps
1. Navigate to `/dashboard` and apply period.
2. Click the first category row in `widget-income` (Salary: Basic ₹75,000 > Bonus ₹10,000).

#### Expected Result
- Basic sub-category row appears before Bonus.
- Amounts in sub-category rows are in descending order.

**Automatable:** Yes — `TC-018-E13` in spec file.

---

### TC-018-E14: Category Row Selection — aria-selected="true"

**Objective:** Verify that clicking a category row sets `aria-selected="true"` on that row.

#### Steps
1. Navigate to `/dashboard` and apply period.
2. Click the first category row in `widget-expenses`.

#### Expected Result
- `aria-selected="true"` appears on the clicked row.

**Automatable:** Yes — `TC-018-E14` in spec file.

---

### TC-018-E15: Sub-category Row Selection — aria-selected="true"

**Objective:** Verify that clicking a sub-category row sets `aria-selected="true"` on that row (and removes it from the parent category row).

#### Steps
1. Navigate to `/dashboard` and apply period.
2. Click first category row in `widget-income` to expand.
3. Click the first sub-category row.

#### Expected Result
- `aria-selected="true"` on the sub-category row.
- `aria-selected="true"` NOT present on the category row.

**Automatable:** Yes — `TC-018-E15` in spec file.

---

### TC-018-E16: Cross-Widget Selection Mutual Exclusivity

**Objective:** Verify that selecting a row in one widget clears the selection in all other widgets.

#### Steps
1. Navigate to `/dashboard` and apply period.
2. Click first category row in `widget-expenses` → it gets `aria-selected="true"`.
3. Click first category row in `widget-income`.

#### Expected Result
- `widget-income` row has `aria-selected="true"`.
- `widget-expenses` row no longer has `aria-selected="true"`.

**Automatable:** Yes — `TC-018-E16` in spec file.

---

### TC-018-E17: Empty State When No Transactions in Period

**Objective:** Verify that each widget displays `[data-testid="widget-empty-state"]` with message "No data for selected period" when the selected period contains no transactions.

#### Steps
1. Clear IndexedDB (no transactions).
2. Navigate to `/dashboard`.
3. Set period to a far-future date (e.g. 2099-01) and click Apply.

#### Expected Result
- All four widgets show `[data-testid="widget-empty-state"]` with text containing "No data".
- No `[data-testid="widget-row-category"]` rows are visible.

**Automatable:** Yes — `TC-018-E17` in spec file.

---

### TC-018-E18: Period Apply Resets Widgets (Collapse + No Selection)

**Objective:** Verify that clicking Apply (period change) collapses all expanded categories and clears all row selections across all widgets.

#### Steps
1. Navigate to `/dashboard` and apply period.
2. Click a category row to expand it and select it.
3. Verify selection is active.
4. Click Apply again.

#### Expected Result
- All sub-category rows are hidden.
- No `aria-selected="true"` on any widget row.

**Automatable:** Yes — `TC-018-E18` in spec file.

---

### TC-018-E19: Category Amounts Formatted in INR (₹)

**Objective:** Verify that all category row amounts use INR formatting with the ₹ symbol and Indian thousands separator.

#### Steps
1. Navigate to `/dashboard` and apply period.
2. Inspect `[data-testid="widget-row-amount"]` in each widget's first category row.

#### Expected Result
- Amount text contains `₹`.
- Large amounts use Indian notation (e.g., ₹85,000 or ₹85,000.00).

**Automatable:** Yes — `TC-018-E19` in spec file.

---

### TC-018-E20: Auto Toggle Label Text

**Objective:** Verify that the label associated with each Auto toggle reads "Auto" regardless of toggle state.

#### Steps
1. Navigate to `/dashboard`.
2. Inspect `[data-testid="widget-auto-toggle-label"]` (or `aria-label`) for each widget.
3. Enable one toggle and re-check label.

#### Expected Result
- Label text is "Auto" in OFF state.
- Label text remains "Auto" in ON state.

**Automatable:** Yes — `TC-018-E20` in spec file.

---

## Non-Automatable / Manual Test Cases

### TC-018-M01: Chevron Rotation on Expand/Collapse

**Objective:** Verify that the chevron icon inside a category row rotates 90° when expanded and returns to 0° when collapsed.

#### Steps
1. Navigate to `/dashboard` and apply period.
2. Observe chevron direction in a collapsed category row.
3. Click the row to expand — observe rotation.
4. Click again to collapse — observe reversal.

#### Expected Result
- Chevron visually rotates 90° on expand, returns to 0° on collapse.

**Automatable:** Partial — CSS transform assertions are unreliable cross-browser; recommend visual regression snapshot.

---

### TC-018-M02: Transactions Panel Reacts When Auto ON (Story 019 Integration)

**Objective:** Verify that with Auto ON, clicking a row in a widget triggers the Transactions Panel to refresh its filtered view.

> This test requires Story 019 to be deployed.

#### Steps
1. Navigate to `/dashboard`.
2. Enable Auto toggle on `widget-income`.
3. Click the "Salary" category row.
4. Observe the Transactions Panel.

#### Expected Result
- Transactions Panel refreshes to show only Income / Salary transactions.
- Panel title or filter indicator updates accordingly.

**Automatable:** Yes, once Story 019 is deployed. Add as TC-018-E21 in a future sprint.

---

### TC-018-M03: Transferring Auto Between Widgets Updates Panel

**Objective:** Verify that switching Auto from one widget to another transfers panel reactivity, not duplicates it.

#### Steps
1. Enable Auto on `widget-expenses`.
2. Click a row — panel shows Expense transactions.
3. Enable Auto on `widget-income` (Expenses Auto goes OFF).
4. Click an Income row — panel switches to Income transactions.

#### Expected Result
- Panel responds to the newly active widget only.

**Automatable:** Yes, once Story 019 deployed.

---

### TC-018-M04: Account Filter Change Resets Widgets Immediately

**Objective:** Verify that deselecting an account in the account-source-filter immediately re-renders all widgets (no Apply needed).

#### Steps
1. Apply period to load all data.
2. Expand a category row and select it.
3. Deselect one account from the filter.

#### Expected Result
- All widgets recompute immediately.
- Expanded rows collapse; selection clears.
- Category totals decrease to reflect single-account data.

**Automatable:** Partial — depends on Story 017 account-source-filter being deployed.

---

## Acceptance Criteria Coverage Map

| Acceptance Criterion | Test Case(s) |
|---|---|
| All four widgets rendered | TC-018-E01 |
| Desktop 2×2 grid | TC-018-E02 |
| Mobile single-column | TC-018-E03 |
| Auto toggle default `aria-checked="false"` | TC-018-E04 |
| Auto toggle mutual exclusivity | TC-018-E05 |
| Category rows sorted descending | TC-018-E06, E07, E08, E09 |
| Sub-categories hidden by default | TC-018-E10 |
| Click expands sub-categories | TC-018-E11 |
| Click again collapses | TC-018-E12 |
| Sub-categories sorted descending | TC-018-E13 |
| Category row `aria-selected="true"` | TC-018-E14 |
| Sub-category row `aria-selected="true"` | TC-018-E15 |
| Cross-widget selection clears others | TC-018-E16 |
| Empty state shown when no transactions | TC-018-E17 |
| Apply resets all widgets | TC-018-E18 |
| INR amount formatting | TC-018-E19 |
| Auto toggle label text = "Auto" | TC-018-E20 |
| Chevron rotation | TC-018-M01 (manual) |
| Panel reacts to Auto ON | TC-018-M02 (pending Story 019) |
| Auto transfer between widgets | TC-018-M03 (pending Story 019) |
| Account filter immediate re-render | TC-018-M04 (manual) |

---

## Known Gaps / Ambiguities in Story 018 Acceptance Criteria

1. **`data-testid` naming for amount column:** The story defines `widget-row-category` and `widget-row-subcategory` but does not specify a `data-testid` for the amount cell within a row. Tests assume `widget-row-amount` — this must be added to the component template.

2. **`data-testid` for auto-toggle label:** The story specifies `widget-auto-toggle` but not a separate `widget-auto-toggle-label`. Tests use a fallback (`aria-label`) but a dedicated testid is preferable.

3. **Period format for empty-state test:** The story does not specify whether manually setting `period-start`/`period-end` via input fields is the correct way to navigate to an empty period, or whether only the slider/granularity flow is supported. TC-018-E17 uses direct input fill as a fallback.

4. **Apply button visibility:** TC-018-E18 depends on `apply-period-btn` from Story 017. If Story 017 is not deployed, TC-018-E18 is skipped automatically.

5. **Cross-widget selection clearing:** The story says selecting a row removes `aria-selected` from "any previously selected row in any widget." The service-level `activeWidgetSelection` signal handles this, but each widget must also reset local `selectedRowKey` when a selection from another widget is received. This inter-component communication path should be explicitly tested in a unit test as well.

6. **`widget-row-subcategory` DOM presence vs visibility:** The story says sub-categories use `class="subcategory-row hidden"` (CSS class toggling) OR Angular `@if`. If `@if` is used, subcategory elements are absent from the DOM rather than just hidden — TC-018-E10 handles both cases.
