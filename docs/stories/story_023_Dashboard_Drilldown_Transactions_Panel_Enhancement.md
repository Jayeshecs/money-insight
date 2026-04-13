## Story: Dashboard Drilldown Transactions Panel Enhancement

**Status:** ✅ Done — Implementation complete, E2E tests written (2026-04-14)

**As a** dashboard user  
**I want** to click on a category or sub-category row in any analytical widget and see the matching transactions in a panel below the widgets — with search, sortable columns on desktop, card layout on mobile, and an auto-refresh toggle  
**So that** I can quickly drill down from a high-level spending category into the individual transactions without leaving the dashboard

---

### Background

Story 019 introduced a basic `TransactionsPanelComponent` below the four widgets. However, it does not yet fully implement the reference dashboard drilldown UX described in `fsd_2.0.md` §4.7 and `ux_design_2.0.md` — *Section 4: Transactions Panel*. Specifically missing:

1. **Dynamic panel title** showing the type, category, and sub-category of the current selection
2. **Inline search** triggered by clicking a search icon button (no persistent search box cluttering the header)
3. **Sortable table columns** on desktop (click header to toggle asc/desc)
4. **Mobile card layout** with an "Order by" `<select>` dropdown replacing column headers
5. **Auto toggle drilldown behaviour** — when a widget's Auto toggle is OFF, clicking a row selects it visually but the panel does NOT refresh until an explicit "Show Drilldown" action; when ON, the panel refreshes immediately on click
6. **Record count** displaying `X filtered / Y total` with X updating live as search text changes

This story enhances the existing `TransactionsPanelComponent` and its interaction with `DashboardStateService` and `AnalyticalWidgetComponent` to deliver the complete drilldown experience.

---

### Scenarios

- **Default state (no widget row selected):** The panel title shows "All Transactions" and record count shows the total number of transactions for the current period/account filter (e.g. "Records: 1,647 / 1,647").
- **Category row clicked, Auto ON:** User has enabled the Auto toggle on the Expenses widget. User clicks "Lifestyle" (a Level 1 category row). The panel immediately updates: title becomes "Expense Transactions — Lifestyle", record count updates to the filtered total, and the table/cards show only Lifestyle expense transactions.
- **Sub-category row clicked, Auto ON:** User expands "Lifestyle" and clicks "Dining" (Level 2). Title becomes "Expense Transactions — Lifestyle / Dining"; table shows only Dining transactions.
- **Row clicked, Auto OFF:** User has Auto toggle OFF on the Income widget. User clicks "Salary". The panel title does NOT change and the table does NOT refresh. A "Show Drilldown" button or indicator appears (or a message within the panel) prompting the user to explicitly open the drilldown for the selected row.
- **Search — open and type:** User clicks the search icon in the panel header. An inline text input appears, focused. User types "NEFT". The table filters in real time to rows where Narration, Category, Sub-category, Account/Source, Date, or Amount contains "NEFT" (case-insensitive). The X value in "Records: X / Y" updates instantly.
- **Search — clear:** User presses Escape (or clicks the search icon again). The input collapses and the filter is cleared; all rows for the current widget selection are shown.
- **Desktop column sort:** User clicks the "Amount" column header. Rows reorder by amount ascending. Clicking again sorts descending. A sort direction arrow (`arrow_upward` / `arrow_downward` Material Icon) appears next to the active sort column header.
- **Mobile card layout:** On a 375 px screen, the table is hidden and transaction cards are shown. Each card shows date (bold, left), amount (bold, colour-coded, right), category/sub-category, account/source, and narration excerpt (≤ 2 lines). An "Order by" dropdown at the top of the panel allows selecting the sort column.
- **Pagination reset on selection change:** User clicks a different widget row. The panel updates and pagination resets to page 1.
- **Empty drilldown state:** User selects a sub-category with no transactions in the current period. The panel shows `data-testid="transactions-panel-empty-state"` with the message "No transactions found for the selected filter."

---

### Acceptance Criteria

#### Panel Header

1. **Default title:** When no widget row is selected, `[data-testid="transactions-panel-title"]` displays the text "All Transactions".

2. **Category selection title:** When a Level 1 category row is selected in a widget, `[data-testid="transactions-panel-title"]` displays `"<Type> Transactions — <Category>"` (e.g. "Expense Transactions — Lifestyle"). `<Type>` matches the widget type: Income, Expense, Investment, or Transfer.

3. **Sub-category selection title:** When a Level 2 sub-category row is selected, `[data-testid="transactions-panel-title"]` displays `"<Type> Transactions — <Category> / <Sub-category>"` (e.g. "Expense Transactions — Lifestyle / Dining").

4. **Record count — default:** `[data-testid="transactions-record-count"]` displays `"Records: Y / Y"` where Y is the total transaction count for the current period + account filter when no search text is active.

5. **Record count — filtered:** When search text is active, `[data-testid="transactions-record-count"]` displays `"Records: X / Y"` where X ≤ Y and X updates within 300 ms of the last keystroke (debounced or immediate).

6. **Record count — widget selection:** When a widget row is selected, `[data-testid="transactions-record-count"]` displays `"Records: X / Y"` where X is the count of transactions matching the widget selection (before search), Y is the total for the period.

#### Inline Search

7. **Search button present:** `[data-testid="transactions-search-btn"]` is always visible in the panel header. It renders the `search` Material Icon.

8. **Search button opens input:** Clicking `[data-testid="transactions-search-btn"]` makes `[data-testid="transactions-search-input"]` appear inline (replacing or appending to the header row), focused, with `placeholder="Search transactions…"`.

9. **Real-time filter:** As the user types in `[data-testid="transactions-search-input"]`, the displayed transactions filter in real time by case-insensitive substring match across: Narration, Category, Sub-category, Account/Source, Date (as displayed `YYYY-MM-DD`), and Amount (as displayed `₹X,XX,XXX.XX` string). Filter applies to the currently selected widget scope (i.e. search is applied ON TOP OF the widget row filter, not independently).

10. **Escape / close search:** Pressing `Escape` while `[data-testid="transactions-search-input"]` is focused collapses the input and resets the search filter. Clicking `[data-testid="transactions-search-btn"]` a second time also collapses the input and resets the filter.

11. **Clear button in input:** A clear button `[data-testid="transactions-search-clear"]` (Material Icon `close`) appears inside the input once the user has typed at least one character. Clicking it clears the input text and resets the filter (without collapsing the input field).

#### Desktop Table (≥ 768 px)

12. **Table rendered at ≥ 768 px:** `[data-testid="transactions-table"]` is present in the DOM and visible. `[data-testid="transaction-card"]` elements are NOT visible (hidden via CSS or `@if`).

13. **Table columns:** The table has exactly the following column headers (in order): Account/Source, Category, Sub-category, Date, Amount, Narration. Column headers rendered as `<th>` elements.

14. **Default sort:** On load or after widget selection change, rows are sorted by Date descending (newest first). The "Date" column header has `data-testid="sort-col-date"` with `aria-sort="descending"` and a `arrow_downward` Material Icon visible.

15. **Sortable columns:** Clicking a `<th>` element with `data-testid` of `sort-col-account`, `sort-col-category`, `sort-col-subcategory`, `sort-col-date`, `sort-col-amount`, or `sort-col-narration` toggles sort on that column (first click: ascending; second click: descending; third click: returns to default date-descending). The active sort column header shows `aria-sort="ascending"` or `aria-sort="descending"` and the corresponding Material Icon (`arrow_upward` / `arrow_downward`). Inactive column headers have `aria-sort="none"` and no sort icon.

16. **Amount colour-coding in table:** Each `[data-testid="txn-row-amount"]` cell renders the amount in the correct colour: green (`#2E7D32`) for INCOME, red (`#C62828`) for EXPENSE, blue (`#1565C0`) for INVESTMENT, grey (`#616161`) for TRANSFER.

17. **Narration truncation:** Narration cell text is truncated with CSS `text-overflow: ellipsis; white-space: nowrap; overflow: hidden`. The full narration text is present in the `title` attribute of the cell for tooltip display.

#### Mobile Card Layout (< 768 px)

18. **Cards rendered at < 768 px:** At viewport < 768 px, `[data-testid="transaction-card"]` elements are visible and `[data-testid="transactions-table"]` is hidden (via CSS or `@if`).

19. **Card anatomy:** Each `[data-testid="transaction-card"]` element contains:
    - `[data-testid="card-date"]` — date in `YYYY-MM-DD` format, bold, left-aligned
    - `[data-testid="card-amount"]` — amount in `₹X,XX,XXX.XX` format, bold, right-aligned, colour-coded per type
    - `[data-testid="card-category"]` — `"Category / Sub-category"` text (secondary line)
    - `[data-testid="card-account"]` — account/source text (secondary line)
    - `[data-testid="card-narration"]` — narration excerpt, max 2 lines (CSS `line-clamp: 2`)

20. **Mobile Order-by dropdown:** At < 768 px, `[data-testid="transactions-mobile-sort-select"]` `<select>` element is visible above the card list. Options: Date, Amount, Category, Account/Source (display labels). Changing the selection re-sorts the cards immediately (no Apply button required).

#### Auto Toggle Drilldown Behaviour

21. **Auto ON — immediate refresh:** When any widget's `[data-testid="widget-auto-toggle"]` is checked (`aria-checked="true"`), clicking any Level 1 or Level 2 row in that widget immediately updates the Transactions Panel (title, record count, table/cards) without any additional user action.

22. **Auto OFF — deferred refresh:** When a widget's `[data-testid="widget-auto-toggle"]` is NOT checked, clicking a row marks it as selected (`aria-selected="true"` on the row) but does NOT update the Transactions Panel content. A `[data-testid="drilldown-prompt"]` banner (e.g. "Row selected. Click 'Show Drilldown' to refresh the panel.") appears within or below the panel header area. Clicking `[data-testid="drilldown-show-btn"]` (labelled "Show Drilldown") within the prompt triggers a manual panel refresh.

23. **Switching Auto from OFF to ON:** If a row is already selected in a widget when the user turns that widget's Auto toggle ON, the Transactions Panel refreshes immediately to reflect the currently selected row (no extra click required).

24. **Mutual exclusivity of Auto toggles:** Enabling Auto on one widget automatically disables Auto on all other widgets (only one widget can have Auto ON at a time). This rule is enforced by `DashboardStateService`.

#### Pagination

25. **Pagination controls:** `[data-testid="transactions-pagination-prev"]` and `[data-testid="transactions-pagination-next"]` buttons are present. Page indicator `[data-testid="transactions-page-indicator"]` shows `"Page X / N"`.

26. **Pagination — disabled state:** `[data-testid="transactions-pagination-prev"]` has `disabled` attribute on page 1. `[data-testid="transactions-pagination-next"]` has `disabled` attribute on the last page.

27. **Page size:** 20 rows or cards per page.

28. **Pagination reset on selection change:** Changing the widget row selection or pressing Apply in the Granularity Bar resets the panel to page 1.

29. **Pagination reset on search:** Opening inline search and typing any character resets pagination to page 1.

#### Empty State

30. **Empty state element:** When the current widget selection + search filter combination results in zero matching transactions, `[data-testid="transactions-panel-empty-state"]` is visible with the text "No transactions found for the selected filter." The `[data-testid="transactions-table"]` body has zero `<tr>` rows; on mobile, zero `[data-testid="transaction-card"]` elements are present.

#### Regression

31. **Stories 017–022 must not regress:** All `data-testid` attributes from Stories 017, 018, 019, 020, 021, and 022 continue to exist in the DOM under their respective conditions after this story is implemented.

---

### Technical Notes

- **`DashboardStateService` changes:**
  - Add `activeWidgetSelection = signal<{ type: string; category: string; subcategory: string | null } | null>(null)`.
  - Add `autoRefreshWidget = signal<string | null>(null)` (the widget type whose Auto toggle is ON, or `null`).
  - Add computed `drilldownTransactions = computed(() => { /* filter from all transactions using activeWidgetSelection */ })`.
  - The `TransactionsPanelComponent` subscribes to `drilldownTransactions` and the `activeWidgetSelection` signal.
- **`AnalyticalWidgetComponent` changes:**
  - On row click: call `DashboardStateService.setWidgetSelection(type, category, subcategory)`.
  - If `autoRefreshWidget() === this.type`, the selection immediately propagates. If not, mark row `aria-selected="true"` locally and wait for explicit `drilldown-show-btn` click.
- **`TransactionsPanelComponent` changes:**
  - Add `sortColumn = signal<string>('date')` and `sortDirection = signal<'asc'|'desc'>('desc')`.
  - Add `searchText = signal<string>('')`.
  - Desktop `transactions-table` and mobile cards are controlled by a `isDesktop = signal<boolean>` that tracks `window.innerWidth >= 768`, updated on `resize` event (debounced).
  - Use Angular `@for` to render rows; use `@if` to switch between table and card layout.
- **Search debounce:** Apply `debounceTime(150)` from RxJS on the search input `valueChanges` to avoid over-filtering on fast typing.
- **Amount formatting:** Use the Angular `CurrencyPipe` with `locale='en-IN'` and `currencyCode='INR'` for consistent `₹X,XX,XXX.XX` formatting.
- **Accessibility:** Sort column headers must have `tabindex="0"` and respond to `Enter`/`Space` key events for keyboard sorting. Search input must have `aria-label="Search transactions"`.

---

### PO Clarifications

- **Q: Does the "Show Drilldown" button need to be a floating button or can it be inline?**  
  A: Inline in the panel area is fine. A subtle banner or prompt row below the panel header is the preferred pattern — no floating button needed.

- **Q: Should search also filter by amount range (e.g. "> 10000")?**  
  A: Not in this story. Basic substring search across displayed strings only. Amount range filtering is a future story.

- **Q: If the user changes the granularity period while a search is active, should the search persist?**  
  A: Yes. The search text persists across period changes but the filtered count updates to match the new transaction set.

- **Q: Should column sort state persist across widget row selections?**  
  A: No. When the widget row selection changes, sort resets to default (Date descending). This avoids confusion when switching between incomparable categories.

- **Q: How many transactions per page on mobile cards?**  
  A: Same as desktop — 20 per page.
