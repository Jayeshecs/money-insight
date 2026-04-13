## Story: Dashboard v2.0 — Integrated Transactions Panel

**Status:** ✅ QA Verified — All E2E Tests Passing (2026-04-13)

**As a** user  
**I want** to see the individual transactions that make up any category or sub-category I select in a widget, directly on the Dashboard  
**So that** I can inspect transaction details without navigating away from my financial overview

### Background
This story introduces **Section 4** of the Dashboard v2.0 redesign (see `docs/design/04_UI_UX.md` § 1.1 v2.0).

The existing Dashboard (Story 007) shows a "Recent Transactions" preview table (last 10 rows) with a "View All" link to `/transactions`. The v2.0 design replaces this with a full **Transactions Panel** embedded in the Dashboard that:
- Shows all transactions for the selected period / account filter by default
- Reacts to widget row selections (Story 018) when the relevant widget's Auto toggle is ON
- Supports inline free-text search
- Shows a dynamic title describing what is currently displayed
- Uses a table on desktop/tablet and cards on mobile

This story depends on:
- Story 017 for `activePeriodStart`, `activePeriodEnd`, `selectedAccounts`
- Story 018 for `activeWidgetSelection` and `activeAutoWidget` signals

### Scenarios
- Dashboard loads; Transactions Panel shows all transactions in the selected period with title "All Transactions"
- User selects a category row in the Income widget (Auto ON); panel title changes to "Income Transactions — Salary" and rows filter to that category
- User selects a sub-category row in the Income widget (Auto ON); title changes to "Income Transactions — Salary / Finastra" and rows filter to that sub-category
- User switches the Income widget's Auto toggle OFF; panel stays on the last filtered view; further row clicks do not change the panel
- User activates the search icon; a text input expands; typing "NEFT" filters visible rows in real time (case-insensitive)
- User presses Escape; search input collapses and the text filter clears
- Record count reads "Records: 12 / 1647" where 12 = rows matching current filters, 1647 = total transactions for the selected period
- User navigates to page 2; transactions 21–40 appear; search text persists across pages
- On mobile (< 768 px), each transaction shows as a card with Date, Amount (coloured), Category/Sub-category, Account/Source, and a narration excerpt

### Acceptance Criteria

**Panel Title**
- `[data-testid="transactions-panel-title"]` is visible at all times
- Default (no widget selection): title text is "All Transactions"
- Category selected: `"<Type> Transactions — <Category>"` (e.g., "Expense Transactions — Lifestyle")
- Sub-category selected: `"<Type> Transactions — <Category> / <Sub-category>"` (e.g., "Income Transactions — Salary / Finastra")
- Type names are capitalised: `income → Income`, `expense → Expense`, `investment → Investment`, `transfer → Transfer`
- Title updates within 300 ms of a widget row click when the relevant widget's Auto toggle is ON

**Record Count**
- `[data-testid="transactions-record-count"]` always shows `Records: X / Y`
- X = current filtered row count (after widget selection + search filter)
- Y = total transaction count for the selected period and account filter (no widget or search filter applied)
- X and Y update in real time as search text changes

**Search**
- `[data-testid="transactions-search-btn"]` is visible as a magnifier icon (🔍) to the right of `transactions-record-count`
- Clicking `transactions-search-btn` shows `[data-testid="transactions-search-input"]` inline; focus is placed on the input automatically
- Typing in `transactions-search-input` filters all visible rows by case-insensitive substring match across: Narration, Category, Sub-category, Account/Source, Date (formatted as displayed), and Amount (as displayed string)
- Typing updates `transactions-record-count` (X value) in real time
- Pressing Escape collapses `transactions-search-input` and resets the search filter; `transactions-record-count` reverts to pre-search X
- Clicking the search button again while the input is open collapses it (toggle behaviour)

**Transaction Table (Desktop/Tablet ≥ 768 px)**
- `[data-testid="transactions-table"]` is visible at viewport ≥ 768 px
- Columns (in order): Account/Source, Category, Sub-category, Date, Amount, Narration
- `[data-testid="transaction-row"]` exists for each displayed transaction
- Date column: formatted as `YYYY-MM-DD`
- Amount column: colour-coded — green for INCOME, red for EXPENSE, blue for INVESTMENT, grey for TRANSFER
- Default sort: Date descending
- Narration column: truncated with ellipsis if it exceeds column width; full text visible in a `title` tooltip

**Transaction Cards (Mobile < 768 px)**
- `[data-testid="transactions-table"]` is hidden at viewport < 768 px
- `[data-testid="transaction-card"]` list is visible at < 768 px
- Each card shows: Date (bold), Amount (colour-coded, bold), Category / Sub-category, Account/Source, Narration excerpt (max 2 lines, truncated)

**Pagination**
- Panel displays 20 rows (or cards) per page
- `[data-testid="transactions-pagination-prev"]` is disabled on page 1; enabled otherwise
- `[data-testid="transactions-pagination-next"]` is disabled on the last page; enabled otherwise
- Navigating pages preserves the active widget selection and search filter
- If a new widget selection or period change reduces the total page count below the current page, resets to page 1

**Empty State**
- `[data-testid="transactions-panel-empty-state"]` is shown when the current filter combination produces zero results
- Empty state message: "No transactions found for the selected filters."

**Reactivity**
- When Story 017's Apply is clicked, the panel resets to "All Transactions" (clears widget selection, search, returns to page 1) and reloads data for the new period
- When Story 017's Account/Source filter changes, the panel recomputes immediately (no Apply required); page resets to 1

### Technical Notes
- New standalone Angular component: `TransactionsPanelComponent`  
  - Path: `src/app/features/dashboard/transactions-panel/transactions-panel.component.ts`
  - This is a **different component** from `TransactionsListComponent` (Story 008 at `/transactions`); do not merge
- Data source: `DashboardStateService.filteredTransactions: Signal<Transaction[]>` — derived from `activePeriodStart`, `activePeriodEnd`, `selectedAccounts`, and `activeWidgetSelection`
- Search filter is applied **on top of** `filteredTransactions`; it is component-local (not stored in `DashboardStateService`)
- Panel listens to `DashboardStateService.activeAutoWidget` and `activeWidgetSelection`:
  - When `activeAutoWidget` is non-null and `activeWidgetSelection` changes → update panel filter and title
  - When `activeAutoWidget` is null → ignore `activeWidgetSelection` changes
- Pagination: component-local `currentPage: number` signal; reset to 1 on any filter change
- `pagedTransactions` is a computed slice of the search-filtered array: `slice((page-1)*20, page*20)`
- Mobile card layout: CSS media query `@media (max-width: 767px)` hides table and shows card list
- Search input expansion animation: CSS `max-width` transition from `0` to `300px` (or similar)

### PO Clarifications (2026-04-13)

**Q: Does the Transactions Panel replace the "View All Transactions" link (Story 007)?**  
→ Yes. The "Recent Transactions" widget and "View All" link from Story 007 are removed from the Dashboard. The panel in Section 4 serves as the inline transaction browser. The full `/transactions` route (Story 008) still exists and is accessible via the navigation menu.

**Q: What is the default state when no widget row is selected?**  
→ "All Transactions" — all transactions in the active period and account filter, no type/category/sub-category restriction. This is the state on Dashboard load and after any period refresh.

**Q: When Auto is OFF on all widgets and the user clicks a row in a widget, does the panel change?**  
→ No. The panel only updates when at least one widget has Auto ON **and** a row is clicked in that widget.

**Q: Does double-clicking a row when Auto is OFF trigger a panel update?**  
→ Not in this story. Double-click behaviour (as noted in Story 018 PO clarifications) is deferred to a future story.

**Q: Is the search applied before or after widget selection filtering?**  
→ After. The sequence is: period filter → account filter → widget selection filter → search text filter.

**Q: Does the search filter reset when the user selects a different widget row (with Auto ON)?**  
→ Yes. Any new widget row selection clears the search text and resets to page 1 to avoid confusing state combinations.

**Q: Narration column — is it sortable?**  
→ No sort options in this story. Date descending is the only sort available. Column sorting is deferred to a future story.

---

## Architect Low-Level Design

### Component Tree / File Structure

```
src/app/features/dashboard/
└── transactions-panel/
    ├── transactions-panel.component.ts      (new — standalone)
    └── transactions-panel.component.scss    (new)

src/app/core/services/
└── dashboard-state.service.ts    (modified — add/replace filteredTransactions v2 computed signal)
```

> `TransactionsPanelComponent` is a **different component** from `TransactionsListComponent` (Story 008, `/transactions` route). Do not merge or extend `TransactionsListComponent`; their filtering logic, state sources, and lifecycle differ fundamentally.

### Angular Signal / State Flow

```
DashboardStateService
  ├── periodAccountFiltered: Signal<Transaction[]>       ← shared base (Story 018)
  ├── activeAutoWidget:      Signal<TransactionType|null>  ← from Story 018
  └── activeWidgetSelection: Signal<WidgetSelection|null>  ← from Story 018

  └── filteredTransactions (v2): Signal<Transaction[]>
        = periodAccountFiltered, further filtered by activeWidgetSelection
          (filter applied only when activeAutoWidget is non-null)

TransactionsPanelComponent (all state below is component-local — NOT in service):
  ├── searchText:     WritableSignal<string>         default: ''
  ├── searchVisible:  WritableSignal<boolean>        default: false
  ├── currentPage:    WritableSignal<number>         default: 1

  ├── searchFiltered: Signal<Transaction[]>          computed from filteredTransactions + searchText
  ├── pagedTransactions: Signal<Transaction[]>       computed: searchFiltered.slice((page-1)*20, page*20)
  ├── totalFiltered:  Signal<number>                 = searchFiltered().length  (X in Records: X/Y)
  ├── totalBase:      Signal<number>                 = periodAccountFiltered().length  (Y in Records X/Y)
  ├── totalPages:     Signal<number>                 = ceil(totalFiltered / 20)
  └── panelTitle:     Signal<string>                 computed from activeAutoWidget + activeWidgetSelection
```

### Interface and Type Definitions

No new interfaces for this story. The component uses:
- `Transaction` (existing — `data-models.ts`)
- `WidgetSelection` (from Story 018 — `data-models.ts`)
- `TransactionType` (existing — `data-models.ts`)

**DashboardStateService addition — replace v1 `filteredTransactions`:**

```typescript
// Supersedes the v1 filteredTransactions signal (which used PeriodFilter enum).
// Rename or remove the v1 signal after Story 017 signals are in place.
readonly filteredTransactions = computed<Transaction[]>(() => {
  const base      = this.periodAccountFiltered();        // period + account filter
  const auto      = this.activeAutoWidget();             // null = no widget filter
  const selection = this.activeWidgetSelection();        // null = no row selected

  if (!auto || !selection) return base;                  // "All Transactions" mode

  return base.filter(t => {
    if (t.transactionType !== selection.type) return false;
    if (t.category !== selection.category)   return false;
    if (selection.subCategory && t.subCategory !== selection.subCategory) return false;
    return true;
  });
});
```

> **Migration note:** The v1 `filteredTransactions` uses `periodFilter` enum (`'all'|'last-month'|...`). Before implementing this story, verify no other component (e.g., `TransactionsListComponent`) imports `DashboardStateService.filteredTransactions`. If they do, those components must be updated to use their own local filter instead.

**TransactionsPanelComponent skeleton:**

```typescript
@Component({
  selector: 'app-transactions-panel',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe],
  templateUrl: './transactions-panel.component.html',
  styleUrls: ['./transactions-panel.component.scss'],
})
export class TransactionsPanelComponent {
  private state = inject(DashboardStateService);

  // Component-local state
  searchText    = signal('');
  searchVisible = signal(false);
  currentPage   = signal(1);

  // Derived (local computed)
  private searchFiltered = computed<Transaction[]>(() => {
    const text = this.searchText().toLowerCase().trim();
    const txns = this.state.filteredTransactions();
    if (!text) return txns;
    return txns.filter(t =>
      [t.narration, t.category, t.subCategory ?? '', t.account, t.date, String(t.amount)]
        .some(v => v.toLowerCase().includes(text))
    );
  });

  readonly pagedTransactions = computed<Transaction[]>(() => {
    const page = this.currentPage();
    return this.searchFiltered().slice((page - 1) * 20, page * 20);
  });

  readonly totalFiltered = computed(() => this.searchFiltered().length);
  readonly totalBase     = computed(() => this.state.periodAccountFiltered().length);
  readonly totalPages    = computed(() => Math.max(1, Math.ceil(this.searchFiltered().length / 20)));

  readonly panelTitle = computed<string>(() => {
    const auto = this.state.activeAutoWidget();
    const sel  = this.state.activeWidgetSelection();
    if (!auto || !sel) return 'All Transactions';
    const typeName = sel.type.charAt(0) + sel.type.slice(1).toLowerCase(); // 'INCOME' → 'Income'
    return sel.subCategory
      ? `${typeName} Transactions — ${sel.category} / ${sel.subCategory}`
      : `${typeName} Transactions — ${sel.category}`;
  });

  constructor() {
    // Reset page to 1 on any filter change
    effect(() => {
      this.state.filteredTransactions();
      untracked(() => this.currentPage.set(1));
    });

    // Reset search + page when widget selection changes
    effect(() => {
      this.state.activeWidgetSelection();
      untracked(() => { this.searchText.set(''); this.currentPage.set(1); });
    });
  }

  amountClass(txn: Transaction): string {
    return {
      INCOME: 'amount-income', EXPENSE: 'amount-expense',
      INVESTMENT: 'amount-investment', TRANSFER: 'amount-transfer',
    }[txn.transactionType] ?? '';
  }

  onSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.searchText.set('');
      this.searchVisible.set(false);
    }
  }
}
```

### CSS / Layout Notes

**Panel header:**
```scss
.panel-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  flex-wrap: wrap;
}
.panel-title { flex: 1; font-weight: 600; font-size: 1rem; }
.record-count { font-size: 0.875rem; color: var(--text-secondary); }
.search-input-wrapper {
  max-width: 0;
  overflow: hidden;
  transition: max-width 0.25s ease;
  &.visible { max-width: 300px; }
}
```

**Desktop table (≥ 768 px):**
```scss
.transactions-table {
  width: 100%;
  border-collapse: collapse;
  th, td { padding: 8px 10px; text-align: left; font-size: 0.875rem; }
  td.narration-cell {
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
.amount-income     { color: var(--income-color);     }
.amount-expense    { color: var(--expense-color);    }
.amount-investment { color: var(--investment-color); }
.amount-transfer   { color: var(--transfer-color);   }

@media (max-width: 767px) { .transactions-table { display: none; } }
```

**Mobile cards (< 768 px):**
```scss
.transaction-cards { display: none; }

@media (max-width: 767px) {
  .transaction-cards { display: block; }
  .transaction-card {
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-color);
  }
  .card-narration {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    font-size: 0.85rem;
    color: var(--text-secondary);
  }
}
```

### Architectural Risks

1. **`filteredTransactions` v1 → v2 signal migration:** The existing service's `filteredTransactions` uses `periodFilter` enum. The v2 version uses `activePeriodStart/End` and `activeWidgetSelection`. These are **incompatible**. The v2 signal replaces the v1 signal. Any component currently reading the v1 signal will receive a different data shape unless updated. Audit all usages before merging.
2. **`effect()` in constructor — `injectionContext` requirement:** Angular `effect()` is only valid inside an injection context. The constructor is a valid injection context for standalone components with `inject()`. If the signal deps cause circular updates (e.g., `filteredTransactions` → page reset → re-render), use `untracked()` as shown to break the cycle.
3. **`totalBase` must use `periodAccountFiltered()`, not `filteredTransactions()`:** Using `filteredTransactions()` for "Y" in `Records: X / Y` would make Y equal X when a widget selection is active, rendering the ratio `X / X` and losing the total-period context. This is specifically called out in the acceptance criteria.
4. **Search filter timing:** The search is applied on top of `filteredTransactions()` in a local computed signal. This is intentional — search state lives in the component, not the service. Do not push `searchText` into `DashboardStateService`; it would couple search state to the global store unnecessarily.
5. **300 ms title update requirement:** The acceptance criteria state the title must update within 300 ms of a widget row click. With Angular signals, the update is synchronous in the signal graph and the view refreshes on the next change detection cycle. This should be well within 300 ms. No `setTimeout` or debounce is needed.

### Cross-Story Integration Points

- `filteredTransactions` (v2, defined here) depends on `periodAccountFiltered` and `activeWidgetSelection` from Stories 018 and 017 respectively. Story 019 **cannot** be implemented before those stories are merged.
- `totalBase` reads `periodAccountFiltered()` directly from the service — this signal is defined in Story 018.
- Story 020 places `<app-transactions-panel>` as the last child before the dashboard footer. Ensure the component's host element does **not** carry a fixed height or `overflow: hidden` that would clip pagination controls.
- The "Recent Transactions" widget and "View All Transactions" link from Story 007 must be **removed** from `DashboardComponent` when this story is merged. Coordinate with Story 020 which handles the full template restructuring.

---

## Architect Review Comments

### AC-019-01 — `filteredTransactions` v1/v2 naming conflict is a merge risk
The existing `DashboardStateService.readonly filteredTransactions` (v1) used by no external component except `DashboardComponent` (the old period-filter template block). After Story 017–018 are merged and the old period-filter block is removed from the dashboard template, the v1 signal has no consumers. Replace it cleanly with the v2 computed signal in Story 019's PR. Do not keep both named the same in the same class — this will cause TypeScript errors.

### AC-019-02 — `autoMode` OFF scenario: panel must not change on row click
The acceptance criteria and PO clarification confirm: when `activeAutoWidget` is `null`, row clicks in widgets produce no panel change. The v2 `filteredTransactions` computed signal handles this correctly — it returns `periodAccountFiltered()` (unfiltered) when `auto` is null. No additional guard is needed in the component.

### AC-019-03 — Search reset on new widget selection is a UX requirement
The PO clarification states: "Any new widget row selection clears the search text and resets to page 1." The `effect()` watching `activeWidgetSelection` handles this. **Risk:** if the developer forgets to `untracked()` when calling `searchText.set('')` inside the effect, Angular will throw a "signal write in reactive context" error at runtime. Verify `untracked()` is used.

### AC-019-04 — Pagination on period change behaviour
When Apply is clicked (period changes), the acceptance criteria require the panel to reset to "All Transactions" and page 1. The `effect()` watching `filteredTransactions()` resets `currentPage`. However, the panel title also needs to reset. Title is derived from `activeWidgetSelection` — after period Apply, `activeWidgetSelection` is cleared in Story 017/018 (PO clarification: "all widgets reset to no-selection state"). Verify this propagation in integration testing.

### AC-019-05 — `narration` vs `description` field name
Story 019's acceptance criteria and component code use "Narration" as the column name. The `Transaction` model's field is `narration`. This is consistent — no mismatch. However, Story 019's Technical Notes call it `Narration` while Story 008's `TransactionsListComponent` may display it as "Description". Ensure the column header label is "Narration" in this component.

### AC-019-06 — Mobile card `data-testid` must be `transaction-card` (not `transaction-row`)
The acceptance criteria define `[data-testid="transaction-card"]` for mobile and `[data-testid="transaction-row"]` for desktop. Ensure the template uses separate conditional blocks (`@if (isMobile())`) or CSS-only visibility, but with the correct `data-testid` on each element. If using CSS media query visibility only (both in DOM), the E2E test selector `[data-testid="transaction-card"]` must still be in the DOM at all viewports — which is correct if both elements are always rendered and visibility is toggled via CSS.
