# Test Cases for Story 014: Advanced Analytics — Custom Period, Trends, and Category Drill-Down

**Story Reference:** [story_014_Advanced_Analytics.md](../stories/story_014_Advanced_Analytics.md)  
**Date:** 2026-03-09  
**Author:** QA Automation Engineer  
**Sprint:** 3

---

## Unit Tests (Angular / TypeScript)

---

### TC-014-001

| Field | Value |
|---|---|
| **TC ID** | TC-014-001 |
| **Type** | Unit |
| **Title** | `filterByPeriod('custom', from, to)` filters transactions to the specified date range |

**Preconditions:**
- `DashboardStateService` is instantiated in a TestBed.
- A set of 10 mock transactions spanning multiple months (e.g., Jan–Jun 2025) is loaded into the service.

**Steps:**
1. Call `dashboardStateService.filterByPeriod('custom', '2025-02-01', '2025-03-31')`.
2. Read the computed `filteredTransactions()` signal value.

**Expected Result:**
- Only transactions with `date >= '2025-02-01'` AND `date <= '2025-03-31'` are returned.
- Transactions outside this range are excluded.

**AC Reference:** AC2

---

### TC-014-002

| Field | Value |
|---|---|
| **TC ID** | TC-014-002 |
| **Type** | Unit |
| **Title** | `filterByPeriod('custom', from, to)` returns error / empty when `from > to` |

**Preconditions:**
- `DashboardStateService` is instantiated in TestBed with mock transactions.

**Steps:**
1. Call `dashboardStateService.filterByPeriod('custom', '2025-04-01', '2025-01-01')` (from > to).
2. Observe the return value or error state.

**Expected Result:**
- Service returns an error or sets a validation error state.
- `[data-testid="date-range-error"]` state is signalled.
- `filteredTransactions()` is NOT updated with an invalid range.

**AC Reference:** AC1, C8

---

### TC-014-003

| Field | Value |
|---|---|
| **TC ID** | TC-014-003 |
| **Type** | Unit |
| **Title** | Monthly series is capped to the 12 most recent months when range spans > 12 months |

**Preconditions:**
- `DashboardStateService` or `NetFlowTrendChartComponent` contains a `monthlySeries` computation.
- 18 months of transaction data are loaded.

**Steps:**
1. Call `filterByPeriod('custom', '2024-01-01', '2025-06-30')` — a 18-month range.
2. Access the computed `monthlySeries` (or equivalent) result.

**Expected Result:**
- The returned series contains exactly 12 entries.
- The 12 entries correspond to the MOST RECENT 12 months (Jul 2024 – Jun 2025), not the earliest.
- Older months (Jan–Jun 2024) are silently excluded.

**AC Reference:** AC7, C3

---

### TC-014-004

| Field | Value |
|---|---|
| **TC ID** | TC-014-004 |
| **Type** | Unit |
| **Title** | Zero-transaction months in range appear as zero-value entries (not omitted) in monthly series |

**Preconditions:**
- `DashboardStateService` with 3 months of data but with Feb having 0 transactions.

**Steps:**
1. Call `filterByPeriod('custom', '2025-01-01', '2025-03-31')`.
2. Inspect the `monthlySeries` array.

**Expected Result:**
- Array contains 3 entries (Jan, Feb, Mar).
- Feb entry has `amount = 0` (not missing from the array).

**AC Reference:** C10

---

### TC-014-005

| Field | Value |
|---|---|
| **TC ID** | TC-014-005 |
| **Type** | Unit |
| **Title** | Changing period filter clears `activeCategoryFilter` |

**Preconditions:**
- `DashboardStateService` has `activeCategoryFilter` set to `"Food"`.

**Steps:**
1. Call `dashboardStateService.filterByPeriod('last-month')`.
2. Read `activeCategoryFilter()` signal value.

**Expected Result:**
- `activeCategoryFilter()` returns `null` (cleared by period change).

**AC Reference:** C6

---

### TC-014-006

| Field | Value |
|---|---|
| **TC ID** | TC-014-006 |
| **Type** | Unit |
| **Title** | Tooltip `callbacks.label` formats values as `₹xx,xxx` |

**Preconditions:**
- The chart options object for Income/Expense bar chart and Net Flow Trend chart is accessible.

**Steps:**
1. Retrieve the `plugins.tooltip.callbacks.label` function from the chart options.
2. Call it with a mock context `{ parsed: { y: 5000 } }`.

**Expected Result:**
- Returns `"₹5,000"`.

**Steps for 50000:**
- Call with `{ parsed: { y: 50000 } }`.
- Returns `"₹50,000"`.

**AC Reference:** AC6, C1

---

## Component Tests (Angular TestBed)

---

### TC-014-007

| Field | Value |
|---|---|
| **TC ID** | TC-014-007 |
| **Type** | Component |
| **Title** | Date pickers appear only when "Custom" period option is selected |

**Preconditions:**
- `DashboardComponent` created in TestBed.
- Initial period is `"all"`.

**Steps:**
1. Render the component.
2. Assert `[data-testid="date-from-picker"]` is NOT visible.
3. Change `[data-testid="period-filter"]` value to `"custom"`.
4. Trigger change detection.
5. Assert `[data-testid="date-from-picker"]` and `[data-testid="date-to-picker"]` are visible.

**Expected Result:**
- Both date pickers are hidden for non-custom periods.
- Both date pickers become visible when the "custom" option is selected.

**AC Reference:** AC1

---

### TC-014-008

| Field | Value |
|---|---|
| **TC ID** | TC-014-008 |
| **Type** | Component |
| **Title** | `date-range-error` is shown when `from > to` is entered in date pickers |

**Preconditions:**
- `DashboardComponent` created in TestBed with custom period selected.

**Steps:**
1. Set `[data-testid="date-from-picker"]` value to `"2025-04-01"`.
2. Set `[data-testid="date-to-picker"]` value to `"2025-01-01"` (from > to).
3. Trigger change detection / form submit.

**Expected Result:**
- `[data-testid="date-range-error"]` is visible.
- An error message describing the invalid range is shown (e.g., "Start date must be before end date").

**AC Reference:** AC1

---

### TC-014-009

| Field | Value |
|---|---|
| **TC ID** | TC-014-009 |
| **Type** | Component |
| **Title** | `clear-chart-filter` button is hidden when `activeCategoryFilter` is null |

**Preconditions:**
- `DashboardComponent` created in TestBed.
- `DashboardStateService.activeCategoryFilter()` returns `null`.

**Steps:**
1. Render the component.
2. Trigger change detection.
3. Query `[data-testid="clear-chart-filter"]`.

**Expected Result:**
- `[data-testid="clear-chart-filter"]` is NOT present in the DOM (or has `display: none`).

**AC Reference:** AC5, C9

---

### TC-014-010

| Field | Value |
|---|---|
| **TC ID** | TC-014-010 |
| **Type** | Component |
| **Title** | `clear-chart-filter` button is visible when a category filter is active |

**Preconditions:**
- `DashboardComponent` created in TestBed.
- `DashboardStateService.activeCategoryFilter` set to `"Food"`.

**Steps:**
1. Render the component.
2. Trigger change detection.
3. Query `[data-testid="clear-chart-filter"]`.

**Expected Result:**
- `[data-testid="clear-chart-filter"]` is visible in the DOM.

**AC Reference:** AC5, C9

---

### TC-014-011

| Field | Value |
|---|---|
| **TC ID** | TC-014-011 |
| **Type** | Component |
| **Title** | `chart-category-filter-active` indicator is shown when category filter is active |

**Preconditions:**
- `DashboardComponent` created in TestBed with `activeCategoryFilter = "Transport"`.

**Steps:**
1. Render the component and trigger change detection.
2. Query `[data-testid="chart-category-filter-active"]`.

**Expected Result:**
- `[data-testid="chart-category-filter-active"]` is visible.

**AC Reference:** AC4

---

### TC-014-012

| Field | Value |
|---|---|
| **TC ID** | TC-014-012 |
| **Type** | Component |
| **Title** | `LineController`, `LineElement`, `PointElement`, and `Filler` are registered before Net Flow Trend chart renders |

**Preconditions:**
- `DashboardComponent` or `NetFlowTrendChartComponent` is created in TestBed.
- Chart.js spy on `Chart.register()` is active.

**Steps:**
1. Import and spy on `Chart.register`.
2. Create the component.
3. Inspect the registered Chart.js controllers/elements.

**Expected Result:**
- `Chart.register()` call includes `LineController`, `LineElement`, `PointElement`, and `Filler`.
- No runtime error is thrown when the net-flow-trend-chart canvas is rendered.

**AC Reference:** C2

---

## E2E Tests (Playwright)

**Base URL:** `http://localhost:4200`

---

### TC-014-013

| Field | Value |
|---|---|
| **TC ID** | TC-014-013 |
| **Type** | E2E |
| **Title** | Selecting a valid custom date range updates the period filter and recomputes widgets |

**Preconditions:**
- App is running with at least 3 months of transaction data in IndexedDB.
- User is on the Dashboard page.

**Steps:**
1. `await page.goto('/dashboard')`.
2. Select `"custom"` from `[data-testid="period-filter"]`.
3. Set `[data-testid="date-from-picker"]` to `"2025-01-01"`.
4. Set `[data-testid="date-to-picker"]` to `"2025-03-31"`.
5. Trigger change (blur or equivalent).
6. Wait for widgets to recompute.

**Expected Result:**
- `[data-testid="date-range-error"]` is NOT visible.
- `[data-testid="income-widget"]`, `[data-testid="expense-widget"]`, `[data-testid="total-flow-widget"]` display updated values reflecting only the selected range.
- `[data-testid="net-flow-trend-chart"]` canvas is present.

**AC Reference:** AC1, AC2, AC3

---

### TC-014-014

| Field | Value |
|---|---|
| **TC ID** | TC-014-014 |
| **Type** | E2E |
| **Title** | Clicking hidden category filter button sets category filter and shows `clear-chart-filter` |

**Preconditions:**
- App running with transactions in multiple categories (e.g., "Food", "Transport").
- Doughnut chart is rendered with at least 2 categories.

**Steps:**
1. `await page.goto('/dashboard')`.
2. Click `[data-testid="category-filter-food"]` (hidden button hook).
3. Wait for change detection.

**Expected Result:**
- `[data-testid="chart-category-filter-active"]` is visible.
- `[data-testid="clear-chart-filter"]` button is visible.
- Transaction list (if visible) shows only "Food" category transactions.

**AC Reference:** AC4, AC5, C5

---

### TC-014-015

| Field | Value |
|---|---|
| **TC ID** | TC-014-015 |
| **Type** | E2E |
| **Title** | Clicking `clear-chart-filter` removes the active category filter |

**Preconditions:**
- App running with category filter active (from TC-014-014 setup).

**Steps:**
1. Navigate to Dashboard with an active category filter set (e.g., "Food").
2. Click `[data-testid="clear-chart-filter"]`.
3. Wait for change detection.

**Expected Result:**
- `[data-testid="clear-chart-filter"]` is no longer visible.
- `[data-testid="chart-category-filter-active"]` is no longer visible.
- All transactions are shown (filter removed).

**AC Reference:** AC5, C9

---

### TC-014-016 — MANUAL

| Field | Value |
|---|---|
| **TC ID** | TC-014-016 |
| **Type** | E2E — **MANUAL** |
| **Title** | Income/Expense bar chart tooltip shows `₹xx,xxx` formatted values on hover |

> **Note:** This test requires human interaction (mouse hover on canvas) and is not automatable via Playwright's DOM selectors. Perform manually against a production build.

**Preconditions:**
- Production build running (`ng build --configuration production`).
- Transactions loaded in multiple months.

**Steps:**
1. Open the Dashboard in Chrome.
2. Hover over a bar in the Income/Expense chart.
3. Observe the tooltip content.

**Expected Result:**
- Tooltip shows values formatted as `₹x,xxx` or `₹xx,xxx` (e.g., `₹5,000`, not `5000` or `5000.00`).

**AC Reference:** AC6, C1

---
