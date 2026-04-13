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

**Status:** Revised — Supersedes v1.0 (chart-based design)

**Design Revision:** v2.0 — 2026-04-13. Replaces bar chart, pie chart, and Total Flow widget with a four-section analytical layout aligned to the reference screenshot.

**As a** user  
**I want** to see aggregated financial data organised by type, category, and sub-category on the Dashboard  
**So that** I can quickly understand where my money is going and drill down into specific transaction groups without leaving the screen

### Background
The v1.0 dashboard (Story 007 original) shipped chart-based widgets (bar chart, pie chart, Total Flow card). Product review identified that a tree-table analytical view — showing category/sub-category breakdowns per transaction type — is significantly more useful for power users. The v2.0 redesign replaces all charts with four tree-table widgets, adds a granularity bar (period selector), an overall summary bar (totals + account filter), and integrates a transactions panel that responds to widget selections.

The `DashboardStateService` (Angular signals) and `IndexedDbService` remain as the data layer. `DashboardSummary` interface must be extended. No WASM changes required.

### Sections

#### Section 1 — Granularity Bar
- User can select granularity unit: **Yearly**, **Quarterly**, or **Monthly** (default: Monthly)
- A dual-handle range slider lets the user set the start and end period within the available data range
- Editable date text inputs show selected start/end values (ISO date format)
- **Apply** button triggers data refresh for all sections

#### Section 2 — Overall Summary Bar
- Displays four totals for the selected period: **Total Income**, **Total Expense**, **Total Investment**, **Total Transfer**
- Each total is displayed as a stat chip with a directional/type icon and colour coding
- A **multiselect dropdown** for Account/Source allows filtering across all sections simultaneously; badge on the dropdown shows the count of selected accounts

#### Section 3 — Widgets Grid
Four transaction-type widgets displayed in a 2×2 grid (desktop ≥ 768 px) or stacked (mobile):
- **Expenses** (top-left), **Investment** (top-right), **Income** (bottom-left), **Transfer** (bottom-right)
- Each widget has an **Auto toggle** (OFF by default)
- Each widget shows a **two-level tree table**: Level 1 = Category (bold, with total), Level 2 = Sub-category (indented); collapsed by default
- Amounts sorted **descending** at both levels
- Selecting a row highlights it; when Auto is ON the Transactions panel refreshes automatically

#### Section 4 — Transactions Panel
- Displays transactions matching the selection in Section 3
- **Title format:** `<Type> Transactions — <Category> / <Sub-category>` (e.g., "Income Transactions — Salary / Finastra")
- **Record count:** `Records: <filtered> / <total>`
- **Search icon:** expands an inline text input for free-form filtering
- Desktop/tablet (≥ 768 px): data table; Mobile (< 768 px): card list
- Paginated at 20 rows per page

### Scenarios
- User opens Dashboard; Granularity defaults to Monthly with full available date range; Overall section shows period totals
- User changes granularity to Quarterly and clicks Apply; all sections recalculate
- User selects a subset of accounts from Account/Source multiselect; all totals and widgets filter accordingly
- User expands a category row in the Expenses widget; sub-categories appear below it sorted by amount descending
- User clicks a sub-category row with Auto ON; Transactions panel title and rows update immediately
- User clicks a category row with Auto OFF; row is highlighted but Transactions panel does not change
- User opens the search box in the Transactions panel and types a keyword; displayed rows filter in real time
- All widgets show "No data for selected period" empty state when there are zero matching transactions
- Dashboard is fully responsive: 2-column widget grid on desktop, stacked on mobile

### Acceptance Criteria

**Section 1 — Granularity Bar**
- `[data-testid="granularity-select"]` dropdown contains options: `yearly`, `quarterly`, `monthly`; default value is `monthly`
- `[data-testid="period-start"]` and `[data-testid="period-end"]` display the current range boundaries as ISO date strings
- `[data-testid="period-range-slider"]` renders a dual-handle slider; handle positions correspond to start/end values
- `[data-testid="apply-period-btn"]` triggers re-aggregation; no data refresh occurs without clicking Apply

**Section 2 — Overall Summary Bar**
- `[data-testid="overall-income"]` shows sum of all INCOME transactions in period; icon ↑, colour green
- `[data-testid="overall-expense"]` shows sum of all EXPENSE transactions in period; icon ↓, colour red
- `[data-testid="overall-investment"]` shows sum of all INVESTMENT transactions in period; icon 💼, colour blue
- `[data-testid="overall-transfer"]` shows sum of all TRANSFER transactions in period; icon ⇄, colour grey
- `[data-testid="account-source-filter"]` is a multiselect; selecting/deselecting accounts updates all aggregations without requiring Apply
- All amounts are displayed in INR format (₹X,XX,XXX.XX)

**Section 3 — Widgets Grid**
- `[data-testid="widget-expenses"]`, `[data-testid="widget-investment"]`, `[data-testid="widget-income"]`, `[data-testid="widget-transfer"]` are all present
- Each widget has `[data-testid="widget-auto-toggle"]`; initial state is OFF (aria-checked="false")
- Each widget's tree table has `[data-testid="widget-row-category"]` rows (Level 1) sorted by amount descending
- Each Level 1 row has an expand chevron; clicking it shows/hides `[data-testid="widget-row-subcategory"]` rows
- Sub-category rows are sorted by amount descending within their parent category
- Clicking a row sets `aria-selected="true"` on that row and removes it from previously selected rows
- When Auto toggle is ON and a row is clicked, `[data-testid="transactions-panel-title"]` updates within 300 ms
- When Auto toggle is OFF and a row is clicked, `[data-testid="transactions-panel-title"]` does NOT update
- When no transactions exist for a widget's type in the selected period, the widget shows `[data-testid="widget-empty-state"]`

**Section 4 — Transactions Panel**
- `[data-testid="transactions-panel-title"]` renders the correct dynamic title string
- `[data-testid="transactions-record-count"]` shows `Records: X / Y` where X = filtered count, Y = total for selected type/period
- `[data-testid="transactions-search-btn"]` is visible as an icon; clicking it shows `[data-testid="transactions-search-input"]`
- Typing in `[data-testid="transactions-search-input"]` filters all visible rows/cards in real time (case-insensitive substring)
- Pressing Escape collapses the search input and clears the filter
- `[data-testid="transactions-table"]` is visible at viewport ≥ 768 px; `[data-testid="transaction-card"]` list is visible at < 768 px
- Transactions table columns: Account/Source, Category, Sub-category, Date, Amount, Narration
- Amount column is green (INCOME), red (EXPENSE), blue (INVESTMENT), grey (TRANSFER)
- `[data-testid="transactions-pagination-prev"]` and `[data-testid="transactions-pagination-next"]` navigate pages (20 rows per page)

### Technical Notes
- Remove `ng2-charts` / `chart.js` dependencies introduced in v1.0 (bar chart, pie chart, Total Flow widget are retired)
- `DashboardSummary` interface gains: `periodStart: string`, `periodEnd: string`, `granularity: 'yearly'|'quarterly'|'monthly'`, `accounts: string[]`, `income: number`, `expense: number`, `investment: number`, `transfer: number`, `expenseByCategory: CategoryTree[]`, `incomeByCategory: CategoryTree[]`, `investmentByCategory: CategoryTree[]`, `transferByCategory: CategoryTree[]`
- New type: `CategoryTree = { category: string; total: number; subCategories: { name: string; total: number }[] }`
- Aggregation computed in Angular service from `Transaction[]` (no WASM changes needed)
- `DashboardStateService` exposes computed signals: `overallTotals`, `filteredByAccount`, `expenseTree`, `incomeTree`, `investmentTree`, `transferTree`
- Widget components are standalone Angular components under `src/app/features/dashboard/widgets/`
  - `GranularityBarComponent` — handles period selection
  - `OverallSummaryBarComponent` — displays stat chips + account multiselect
  - `AnalyticalWidgetComponent` — reusable tree-table widget (receives `type`, `data: CategoryTree[]`, `autoMode: boolean`)
  - `TransactionsPanelComponent` — handles filtered table/card list
- Dual-handle range slider: use `@angular/cdk` `CdkDrag` or a lightweight third-party slider; no `Chart.js` dependency
- Auto toggle state is local to each widget component; no shared state required
- Transaction panel initial state (`title="All Transactions"`, no widget filter) loads on Dashboard route entry

### PO Clarifications (2026-04-13)

**Q: What replaces the "View All Transactions" link from v1.0?**
→ The integrated Transactions Panel (Section 4) replaces it. The `/transactions` route (Story 008) remains available via the navigation menu but is no longer linked from the dashboard.

**Q: When Auto is OFF, how does the user load transactions for a selected widget row?**
→ Double-clicking the row when Auto is OFF loads the transactions for that selection. This is a future enhancement — for the initial implementation, double-click is the trigger. The Auto toggle OFF state is primarily useful for browsing/comparing widget data without losing the current transaction view.

**Q: Does the Transactions Panel replace Story 008's `/transactions` route?**
→ No. Story 008's full `/transactions` screen remains for deeper review (pagination, all filters, category correction). Section 4 is a lightweight preview panel on the dashboard.

**Q: Default state of Transactions Panel on first load?**
→ Shows all transactions in the selected period across all types. Title: "All Transactions". No widget row is pre-selected.

**Q: Account/Source filter — does it apply to Section 1 date range calculation?**
→ No. Date range in Section 1 is based on the full transaction dataset. Account/Source filter only affects aggregated totals (Sections 2, 3, 4).

**Q: Widget row amounts — are they inclusive of sub-categories?**
→ Yes. Level 1 (Category) amount = sum of all sub-category amounts for that category. Level 2 (Sub-category) amounts are the individual subtotals.
