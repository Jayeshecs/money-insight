# Test Cases: Dashboard Charts and Widgets

**Story Reference:** [story_007_Dashboard_Charts_and_Widgets.md](../stories/story_007_Dashboard_Charts_and_Widgets.md)  
**Date:** 2026-03-01  
**Author:** QA Tester  
**Total Test Cases:** 15

---

## Unit Tests

---

### TC-007-01: Period filter defaults to "All Time" on first load

**Type:** Unit  
**Priority:** High  
**Preconditions:** `DashboardComponent` is instantiated with no prior state; `DashboardStateService` returns a non-empty `DashboardSummary`.

**Steps:**
1. Create `DashboardComponent` via `TestBed` with `DashboardStateService` stub.
2. Call `fixture.detectChanges()`.
3. Query `[data-testid="period-filter"]` in the DOM.
4. Read its current value.

**Expected Result:** The `[data-testid="period-filter"]` select element has its value set to `"all"` (All Time) with no prior user selection.

**data-testid(s):** `period-filter`

---

### TC-007-06: Income widget shows correct total for selected period

**Type:** Unit  
**Priority:** High  
**Preconditions:** `DashboardStateService` stub emits a `DashboardSummary` with `totalCredit = 50000` for the active period.

**Steps:**
1. Instantiate `DashboardComponent` in `TestBed` with the stub service.
2. Trigger a period change to `"last-month"` via the `period-filter` select.
3. Call `fixture.detectChanges()`.
4. Query `[data-testid="income-widget"]` text content.

**Expected Result:** The income widget renders `50000` (or formatted equivalent, e.g. `₹50,000`) matching `DashboardSummary.totalCredit` for the selected period.

**data-testid(s):** `income-widget`, `period-filter`

---

### TC-007-07: Expense widget shows correct total for selected period

**Type:** Unit  
**Priority:** High  
**Preconditions:** `DashboardStateService` stub emits a `DashboardSummary` with `totalDebit = 32000` for the active period.

**Steps:**
1. Instantiate `DashboardComponent` in `TestBed` with the stub service.
2. Trigger a period change to `"last-month"` via the `period-filter` select.
3. Call `fixture.detectChanges()`.
4. Query `[data-testid="expense-widget"]` text content.

**Expected Result:** The expense widget renders `32000` (or formatted equivalent) matching `DashboardSummary.totalDebit`.

**data-testid(s):** `expense-widget`, `period-filter`

---

### TC-007-08: Net flow widget shows correct value and trend arrow direction

**Type:** Unit  
**Priority:** High  
**Preconditions:** `DashboardStateService` stub emits `netFlow = 18000`; `previousNetFlow = 10000`.

**Steps:**
1. Instantiate `DashboardComponent` in `TestBed`.
2. Call `fixture.detectChanges()`.
3. Query `[data-testid="total-flow-widget"]` text content and `[data-testid="trend-arrow"]` CSS class or `aria-label`.

**Expected Result:** The net flow widget displays `18000` (green-colored). The `[data-testid="trend-arrow"]` element has an "up" indicator class or `aria-label="trend up"`.

**data-testid(s):** `total-flow-widget`, `trend-arrow`

---

### TC-007-09: Trend arrow points up when current > previous period net flow

**Type:** Unit  
**Priority:** Medium  
**Preconditions:** `DashboardStateService` stub emits `netFlow = 20000`, `previousNetFlow = 15000`.

**Steps:**
1. Instantiate `DashboardComponent` in `TestBed`.
2. Call `fixture.detectChanges()`.
3. Read `[data-testid="trend-arrow"]` attribute or class to determine direction.

**Expected Result:** `trend-arrow` element has class `trend-up` (or equivalent) or `aria-label` containing `"up"`.

**data-testid(s):** `trend-arrow`

---

### TC-007-10: Trend arrow points down when current < previous period net flow

**Type:** Unit  
**Priority:** Medium  
**Preconditions:** `DashboardStateService` stub emits `netFlow = 8000`, `previousNetFlow = 15000`.

**Steps:**
1. Instantiate `DashboardComponent` in `TestBed`.
2. Call `fixture.detectChanges()`.
3. Read `[data-testid="trend-arrow"]` attribute or class to determine direction.

**Expected Result:** `trend-arrow` element has class `trend-down` (or equivalent) or `aria-label` containing `"down"`.

**data-testid(s):** `trend-arrow`

---

### TC-007-11: Recent Transactions widget shows up to 10 latest transactions

**Type:** Unit  
**Priority:** High  
**Preconditions:** IndexedDB stub returns 15 transactions sorted by `date` descending.

**Steps:**
1. Instantiate `DashboardComponent` in `TestBed` with a stub `IndexedDbService` returning 15 transactions.
2. Call `fixture.detectChanges()`.
3. Query all `[data-testid="recent-transactions-table"] [data-testid="transaction-row"]` elements.
4. Count the results.

**Expected Result:** Exactly 10 transaction rows are rendered (the most recent 10, per story AC line 25). Transactions 11–15 are not rendered in the widget.

**data-testid(s):** `recent-transactions-table`, `transaction-row`

---

### TC-007-13: Loading/skeleton state shown while data loads

**Type:** Unit  
**Priority:** Medium  
**Preconditions:** `DashboardStateService` stub returns a pending/unresolved observable so data has not arrived.

**Steps:**
1. Instantiate `DashboardComponent` in `TestBed` with a service stub whose signal has not emitted yet.
2. Call `fixture.detectChanges()` before data arrives.
3. Check DOM for `[data-testid="dashboard-loading"]` or skeleton elements.

**Expected Result:** A loading skeleton/spinner (`[data-testid="dashboard-loading"]`) is visible while `DashboardStateService.filteredSummary` has not yet resolved.

**data-testid(s):** `dashboard-loading`

---

### TC-007-14: All widgets show "No data" when IndexedDB is empty

**Type:** Unit  
**Priority:** High  
**Preconditions:** `IndexedDbService` stub returns an empty array; `DashboardStateService` emits a zeroed `DashboardSummary`.

**Steps:**
1. Instantiate `DashboardComponent` in `TestBed` with empty data stubs.
2. Call `fixture.detectChanges()`.
3. Query `[data-testid="dashboard-empty-state"]`.

**Expected Result:** `[data-testid="dashboard-empty-state"]` is present and visible. Individual widgets (`income-widget`, `expense-widget`, `total-flow-widget`, `recent-transactions-table`) are either hidden or display "No data" text.

**data-testid(s):** `dashboard-empty-state`, `income-widget`, `expense-widget`, `total-flow-widget`

---

### TC-007-15: Bar chart limits to 6 months max (shows most recent 6)

**Type:** Unit  
**Priority:** Medium  
**Preconditions:** `DashboardStateService` stub provides `monthlySeries` data spanning 10 months.

**Steps:**
1. Instantiate `DashboardComponent` in `TestBed` with a `DashboardSummary` containing 10 month keys in `monthlySeries`.
2. Call `fixture.detectChanges()`.
3. Read the labels passed to the `[data-testid="income-expense-chart"]` `ng2-charts` `BaseChartDirective` input binding.

**Expected Result:** The chart receives exactly 6 labels corresponding to the 6 most recent months. Older months are not included in the chart data.

**data-testid(s):** `income-expense-chart`

---

## Component Tests

---

### TC-007-02: Changing period to "Last Month" updates all widgets

**Type:** Component  
**Priority:** High  
**Preconditions:** `DashboardComponent` is rendered with transactions spanning multiple months.

**Steps:**
1. Render `DashboardComponent` using `TestBed` with a realistic `DashboardStateService` stub.
2. Select `"last-month"` in `[data-testid="period-filter"]` via `dispatchEvent(new Event('change'))`.
3. Call `fixture.detectChanges()`.
4. Read `[data-testid="income-widget"]`, `[data-testid="expense-widget"]`, and `[data-testid="total-flow-widget"]` text content.

**Expected Result:** All three widgets display values recalculated for the previous calendar month only. `DashboardStateService.filterByPeriod('last-month')` is called once.

**data-testid(s):** `period-filter`, `income-widget`, `expense-widget`, `total-flow-widget`

---

### TC-007-03: Changing period to "Last 3 Months" updates all widgets

**Type:** Component  
**Priority:** High  
**Preconditions:** `DashboardComponent` is rendered with transactions spanning at least 4 calendar months.

**Steps:**
1. Render `DashboardComponent` using `TestBed`.
2. Select `"last-3-months"` in `[data-testid="period-filter"]`.
3. Call `fixture.detectChanges()`.
4. Read income, expense, and net flow widget text content.

**Expected Result:** All widgets display totals covering only the last 3 complete months. Values differ from those shown under "All Time".

**data-testid(s):** `period-filter`, `income-widget`, `expense-widget`, `total-flow-widget`

---

### TC-007-04: Monthly bar chart renders with correct data (ng2-charts canvas)

**Type:** Component  
**Priority:** High  
**Preconditions:** `DashboardComponent` is rendered; `ng2-charts` and `chart.js` are installed and available.

**Steps:**
1. Render `DashboardComponent` in `TestBed`.
2. Call `fixture.detectChanges()`.
3. Query `[data-testid="income-expense-chart"]` canvas element.
4. Assert it is present in the DOM and has `width` > 0 and `height` > 0.

**Expected Result:** A `<canvas>` element under `[data-testid="income-expense-chart"]` is rendered with non-zero dimensions. The chart's dataset labels contain `"Income"` and `"Expense"` datasets.

**data-testid(s):** `income-expense-chart`

---

### TC-007-05: Category breakdown doughnut chart renders

**Type:** Component  
**Priority:** High  
**Preconditions:** `DashboardStateService` stub provides `categoryBreakdown` with at least 3 categories.

**Steps:**
1. Render `DashboardComponent` in `TestBed`.
2. Call `fixture.detectChanges()`.
3. Query `[data-testid="category-breakdown-chart"]` canvas element.

**Expected Result:** A `<canvas>` element under `[data-testid="category-breakdown-chart"]` is present with non-zero dimensions. Chart type is `"doughnut"` (verified via `BaseChartDirective` input binding).

**data-testid(s):** `category-breakdown-chart`

---

## E2E Tests

---

### TC-007-12: "View All Transactions" link navigates to /transactions

**Type:** E2E  
**Priority:** High  
**Preconditions:** App is running; at least 1 transaction exists in IndexedDB (seeded via test setup).

**Steps:**
1. Navigate browser to `/dashboard`.
2. Scroll to `[data-testid="recent-transactions-table"]`.
3. Click `[data-testid="view-all-transactions"]`.
4. Wait for navigation to settle.
5. Assert current URL ends with `/transactions`.

**Expected Result:** Browser URL changes to `/transactions`; `TransactionsListComponent` is rendered with `[data-testid="transactions-table"]` present.

**data-testid(s):** `view-all-transactions`, `transactions-table`

---

## Summary Table

| TC | Description | Type | Priority |
|----|-------------|------|----------|
| TC-007-01 | Period filter defaults to "All Time" on first load | Unit | High |
| TC-007-02 | Changing period to "Last Month" updates all widgets | Component | High |
| TC-007-03 | Changing period to "Last 3 Months" updates all widgets | Component | High |
| TC-007-04 | Monthly bar chart renders with correct data (ng2-charts canvas) | Component | High |
| TC-007-05 | Category breakdown doughnut chart renders | Component | High |
| TC-007-06 | Income widget shows correct total for selected period | Unit | High |
| TC-007-07 | Expense widget shows correct total for selected period | Unit | High |
| TC-007-08 | Net flow widget shows correct value and trend arrow direction | Unit | High |
| TC-007-09 | Trend arrow points up when current > previous period net flow | Unit | Medium |
| TC-007-10 | Trend arrow points down when current < previous period net flow | Unit | Medium |
| TC-007-11 | Recent Transactions widget shows up to 10 latest transactions | Unit | High |
| TC-007-12 | "View All Transactions" link navigates to /transactions | E2E | High |
| TC-007-13 | Loading/skeleton state shown while data loads | Unit | Medium |
| TC-007-14 | All widgets show "No data" when IndexedDB is empty | Unit | High |
| TC-007-15 | Bar chart limits to 6 months max (shows most recent 6) | Unit | Medium |
