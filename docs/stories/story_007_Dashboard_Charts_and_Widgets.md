## Story: Dashboard Charts and Widgets

**Status:** ✅ QA Verified — All E2E Tests Passing (2026-03-01)

**As a** user  
**I want** to see interactive charts and summary widgets on the Dashboard  
**So that** I can quickly understand my financial health at a glance

### Background
Sprint 1 delivered `DashboardStateService` (Angular signals with `DashboardSummary` JSON from WASM) and a skeletal `DashboardComponent` with `data-testid` stubs. Sprint 2 wires real chart libraries to those signals.

### Scenarios
- User navigates to `/dashboard` after importing transactions
- Dashboard displays Total Flow widget with net amount and trend indicator
- Dashboard displays Income vs Expense grouped bar chart (last 6 months)
- Dashboard displays Category Breakdown pie chart with labels and percentages
- Dashboard displays Recent Transactions table (last 10, descending by date)
- All widgets show "No data" empty-state when IndexedDB has no transactions
- Dashboard updates automatically when new transactions are imported

### Acceptance Criteria
- `[data-testid="total-flow-widget"]` shows net flow amount (income − expense), colored green/red, with up/down arrow
- `[data-testid="income-expense-chart"]` renders a grouped bar chart (Chart.js or equivalent); x-axis = months, bars = income vs expense
- `[data-testid="category-breakdown-chart"]` renders a pie/doughnut chart with category labels and % values
- `[data-testid="recent-transactions-table"]` shows up to 10 most recent transactions with columns: Date, Narration, Amount, Type
- `[data-testid="dashboard-empty-state"]` is shown when there are zero transactions
- All widgets reactively update when `DashboardStateService` signals change (no page reload required)
- Period filter (`[data-testid="period-filter"]`) allows selection of Last Month / Last 3 Months / All Time, and all widgets recompute accordingly
- Widgets are accessible: charts have `aria-label` descriptions

### Technical Notes
- Use `Chart.js` via `ng2-charts` v6+ (confirmed for Angular 21) — install `ng2-charts` and `chart.js` as first Sprint 2 action
- Also install `@angular/cdk` (needed by Stories 009, 011 as well)
- Data flows: `DashboardStateService.filteredSummary` computed signal → widget components
- All chart components are standalone Angular components under `src/app/features/dashboard/widgets/`
- `filterByPeriod(range)` filters the raw `Transaction[]` array on the JS/Angular side **before** passing to WASM — no WASM changes required for Sprint 2

### PO Clarifications (2026-03-01)

**Q: Chart library confirmed?**  
→ ✅ `ng2-charts` v6 + `chart.js` v4. Install both before Sprint 2.

**Q: Monthly breakdown data source?**  
→ Angular service (`DashboardStateService`) computes monthly aggregates from raw `Transaction[]` grouped by `YYYY-MM`. WASM `get_dashboard_summary()` is **not** expected to change for Sprint 2. Add `monthlySeries: Record<string, { income: number; expense: number }>` to `DashboardSummary` interface in Angular only.

**Q: Trend arrow comparison basis?**  
→ Compare current period net flow vs. **previous equivalent period** (e.g., if "Last Month" → compare vs. the month before that). Add `previousNetFlow?: number` to `DashboardSummary` computed by Angular before charting.

**Q: Default period filter?**  
→ Default is **"All Time"**.

**Q: Period filter options?**  
→ Last Month / Last 3 Months / All Time. The bar chart renders up to 6 bars maximum — if All Time has more than 6 months, show the most recent 6.

**Q: data-testid renames from Sprint 1?**  
→ Keep existing Sprint 1 test IDs intact to avoid breaking existing tests. Add the new ids as **additional** attributes: `data-testid` may have multiple — use `data-testid="total-flow-widget net-flow"` OR simply rename without breaking: check what Sprint 1 E2E tests assert on and update them if needed (tester to handle).

**Q: Chart interactions (tooltips, drill-down)?**  
→ Hover tooltips: ✅ in scope (handled by Chart.js defaults). Click-to-drill-down: ❌ deferred to Sprint 3.

**Q: "View All Transactions" link?**  
→ ✅ Add `[data-testid="view-all-transactions"]` link at bottom of Recent Transactions widget, navigating to `/transactions`. Owned by Story 007.
