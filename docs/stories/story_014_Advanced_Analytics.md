## Story: Advanced Analytics — Custom Period, Trends, and Category Drill-Down

**Status:** On Hold

**As a** user reviewing my financial history  
**I want** a custom date range picker, month-over-month trend charts, and category drill-down  
**So that** I can analyse spending patterns over any arbitrary time window and understand exactly where money goes

### Background
Sprint 2 delivered a fixed period filter (All Time / Last Month / Last 3 Months). Sprint 3 unlocks full analytical flexibility: a custom date-range picker, a line chart showing net-flow trends over time, and clicking a doughnut slice drills down to show only that category's transactions.

### Scenarios
- User selects a custom date range (e.g., 1 Jan–31 Mar 2025) and all widgets recompute
- User hovers over a bar in the Income/Expense chart and sees exact values in a tooltip
- User clicks a doughnut slice (e.g., "Food") and the Transactions table below filters to that category
- Trend line chart shows net-flow per month for the selected period
- User resets filters; all widgets return to "All Time" view

### Acceptance Criteria
1. Period filter gains a **Custom** option; selecting it reveals a date-range picker with:
   - `[data-testid="date-from-picker"]` (HTML `<input type="date">`) and  
   - `[data-testid="date-to-picker"]`;  
   invalid ranges (from > to) show `[data-testid="date-range-error"]`.
2. When a custom range is active, `DashboardStateService.filterByPeriod('custom', from, to)` is called; all existing widgets (`income-widget`, `expense-widget`, `total-flow-widget`, charts) recompute.
3. A new **Net Flow Trend** line chart is rendered at `[data-testid="net-flow-trend-chart"]` showing monthly net flow as a line (Chart.js `line` type); x-axis months, y-axis INR amount.
4. Clicking a doughnut slice on `[data-testid="category-breakdown-chart"]` sets the category filter on the Recent Transactions widget **and** on the Transactions Review screen (via `DashboardStateService`), showing only matching transactions; `[data-testid="chart-category-filter-active"]` indicates the active filter.
5. A `[data-testid="clear-chart-filter"]` button clears the category drill-down filter.
6. The Income/Expense bar chart tooltips display exact currency values (formatted as ₹xx,xxx) on hover — handled by Chart.js defaults, no extra code needed.
7. The number of bars in the Income/Expense chart is limited to 12 (most recent 12 months) when the custom range spans more than 12 months.
8. Custom date range state survives Angular route navigation within the same session (stored in `DashboardStateService`).
9. `[data-testid="period-filter"]` existing values (`"all"`, `"last-month"`, `"last-3-months"`) continue to work as before — no regression.

### Technical Notes
- Extend `PeriodFilter` type in `dashboard-state.service.ts`: add `'custom'` variant; `filterByPeriod` gains optional `from?: string, to?: string` params.
- `filteredTransactions` computed signal gains three filter branches: predefined presets + custom range.
- Net Flow Trend chart: new `NetFlowTrendChartComponent` at `features/dashboard/widgets/net-flow-trend-chart.component.ts`.
- Category drill-down: add `activeCategoryFilter = signal<string | null>(null)` to `DashboardStateService`; subscribe in `TransactionsListComponent` to pre-fill the category dropdown.
- Chart.js click event: `(chartClick)` output from `BaseChartDirective`; extract label from event payload.
- Date-range picker: use native HTML `<input type="date">` for Sprint 3 (no external datepicker library required).
- Angular CDK `BreakpointObserver` already installed — use to hide/collapse trend chart on mobile (stack below existing charts).

### PO Clarifications (2025-06-XX — post agent pre-analysis)

**C1 — AC6 CORRECTION (tooltip formatting requires custom code):**
**Discard** the phrase "handled by Chart.js defaults, no extra code needed" in AC6. Chart.js tooltips display raw floats by default (e.g., `5000`). A custom `plugins.tooltip.callbacks.label` function is **required** in the chart options to format values as `₹xx,xxx`:

```typescript
callbacks: {
  label: (ctx) => `₹${ctx.parsed.y.toLocaleString('en-IN')}`
}
```

This applies to both the Income/Expense bar chart and the Net Flow Trend line chart. AC6 is rewritten as: "Income/Expense bar chart and Net Flow Trend line chart tooltips display formatted INR values (e.g., ₹5,000) using a custom `callbacks.label` function."

**C2 — Chart.js line chart registration (BLOCKER):**
`DashboardComponent` currently only registers `BarController`, `DoughnutController`, `CategoryScale`, `LinearScale`, `BarElement`, `ArcElement`, `Legend`, `Tooltip` in `Chart.register()`. Before adding the Net Flow Trend chart, the following registrables **must** be added: `LineController`, `LineElement`, `PointElement`, `Filler`. Failure to add these causes a runtime error. This is an implementation prerequisite, not optional.

**C3 — "12 months max" direction:**
"12 months maximum" means the **most recent 12 calendar months** in the `monthlySeries` data (i.e., cap from the end of the series, not the beginning). If the custom range spans > 12 months, display only the most recent 12 months of bars/points. Older months are silently truncated. A `[data-testid="period-truncated-notice"]` is NOT required for Sprint 3.

**C4 — Category drill-down scope:**
Category drill-down via click applies to the **doughnut chart only** (`[data-testid="category-breakdown-chart"]`). Clicking a bar in the Income/Expense bar chart does **not** set a category filter.

**C5 — Playwright testability for doughnut click:**
Canvas-clicked chart slices are not directly testable by Playwright's DOM selectors. To enable E2E testing, add hidden DOM elements as click hooks:
- After rendering the doughnut, for each category label in the data, render a hidden `<button data-testid="category-filter-{name}" style="display:none">` (where `{name}` is the category, lowercased, spaces replaced with `-`).
- Playwright tests will click these hidden buttons instead of the canvas.
- These buttons must call the same `setActiveCategoryFilter(name)` method as the canvas click handler.
- Example: `[data-testid="category-filter-food"]`, `[data-testid="category-filter-transport"]`.

**C6 — Category filter interaction with period filter:**
When the user changes the period filter (or custom date range), the `activeCategoryFilter` is **cleared** (reset to `null`). This ensures the filtered transactions view is not stale after a period change.

**C7 — Category filter persistence:**
The category filter (`activeCategoryFilter`) is session-only — it is NOT persisted to localStorage or URL params. The period/custom-date-range IS session-persisted in `DashboardStateService`.

**C8 — Empty custom range (no transactions in range):**
If the selected custom date range contains no transactions, show `[data-testid="empty-state"]` in the chart areas (same "No data" placeholder as existing components). This is NOT an error state — no `[data-testid="date-range-error"]` is shown for an empty but valid range.

**C9 — `clear-chart-filter` visibility:**
`[data-testid="clear-chart-filter"]` must only be visible when `activeCategoryFilter() !== null`. When the filter is null, this button must be hidden (use `@if(activeCategoryFilter())`).

**C10 — Zero-value months:**
Calendar months within the selected period that have zero transactions must be shown as **zero-height bars / zero-value points** on the charts (not omitted). This prevents visual discontinuities in the trend line.

**C11 — `activeCategoryFilter` sharing:**
`activeCategoryFilter = signal<string | null>(null)` lives in `DashboardStateService` (shared state). Both `DashboardComponent` (chart click) and `TransactionsListComponent` (pre-fill category dropdown) read and write via this signal. Do NOT create a second copy in a component.

**C12 — CDK BreakpointObserver for Net Flow Trend chart:**
On mobile (< 768 px), the Net Flow Trend chart is collapsed below existing charts, full-width, with height capped at 200 px. Use `BreakpointObserver` (already installed) to conditionally reduce chart height on mobile.
