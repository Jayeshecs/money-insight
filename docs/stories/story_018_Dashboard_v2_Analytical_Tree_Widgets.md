## Story: Dashboard v2.0 — Analytical Tree-Table Widgets

**Status:** ✅ QA Verified — All E2E Tests Passing (2026-04-13)

**As a** user  
**I want** to see my transactions aggregated by category and sub-category for each transaction type (Expense, Investment, Income, Transfer)  
**So that** I can understand where my money is going at a glance and drill down into specific categories

### Background
This story introduces **Section 3** of the Dashboard v2.0 redesign (see `docs/design/04_UI_UX.md` § 1.1 v2.0).

The existing Dashboard (Story 007) shows a bar chart and pie chart. The v2.0 design replaces these with four **analytical tree-table widgets**, one per transaction type. Each widget shows a two-level collapsible tree: Level 1 = Category, Level 2 = Sub-category. Amounts are aggregated and sorted descending.

This story depends on Story 017 (Granularity Bar & Summary Bar) for the `activePeriodStart`, `activePeriodEnd`, and `selectedAccounts` signals that drive the aggregation.

### Scenarios
- Dashboard loads with four widgets: Expenses, Investment, Income, Transfer — arranged in a 2×2 grid on desktop
- Each widget shows category rows sorted by total amount (descending)
- User expands a category row; sub-category rows appear beneath it, also sorted descending
- User collapses the category row; sub-category rows are hidden
- User clicks a category row; it becomes highlighted (selected); no other row in any widget is highlighted simultaneously across widgets
- User clicks a sub-category row; it becomes highlighted; the parent category row retains its expanded state
- When the Auto toggle on a widget is OFF (default), clicking rows produces visual selection only — no other section updates
- When the Auto toggle on a widget is ON, clicking a row triggers the Transactions Panel (Story 019) to refresh for that selection
- Only one Auto toggle can be active at a time across all four widgets; enabling one disables the others
- When the selected period or account filter changes (Story 017 Apply or account deselect), all widgets recompute and re-render
- A widget shows an empty state when no transactions of its type exist in the selected period

### Acceptance Criteria

**Widget Presence & Layout**
- `[data-testid="widget-expenses"]`, `[data-testid="widget-investment"]`, `[data-testid="widget-income"]`, `[data-testid="widget-transfer"]` are all rendered on the dashboard
- On viewport ≥ 768 px, widgets are arranged in a 2×2 CSS grid: Expenses top-left, Investment top-right, Income bottom-left, Transfer bottom-right
- On viewport < 768 px, widgets stack in a single column in the same order

**Auto Toggle**
- Each widget contains `[data-testid="widget-auto-toggle"]`; initial `aria-checked` value is `"false"` for all four widgets
- Enabling one widget's Auto toggle sets `aria-checked="true"` on that widget and `aria-checked="false"` on the other three (mutually exclusive)
- The toggle label reads "Auto" in all states

**Tree Table — Level 1 (Category)**
- Each `[data-testid="widget-row-category"]` row contains: a chevron icon, the category name, and the aggregated total for that category
- Category rows are sorted by total amount **descending**
- Clicking a category row toggles the visible/hidden state of its child sub-category rows
- The chevron rotates 90° when expanded, 0° when collapsed; all categories start collapsed
- Clicking a category row also sets `aria-selected="true"` on that row (and removes it from any previously selected row)

**Tree Table — Level 2 (Sub-category)**
- `[data-testid="widget-row-subcategory"]` rows are hidden by default (collapsed under their parent category)
- Sub-category rows are sorted within their parent category by amount **descending**
- Sub-category row contains: indented name, and the sub-category total amount
- Clicking a sub-category row sets `aria-selected="true"` on that row (and removes it from any previously selected row in any widget)

**Amounts**
- All amounts in widget rows are formatted in INR (₹X,XX,XXX.XX using `en-IN` locale)
- Category total = sum of all sub-category amounts for that category

**Empty State**
- When no transactions of a given type exist in the selected period, the widget displays `[data-testid="widget-empty-state"]` with text "No data for selected period"

**Reactivity**
- When Story 017's Apply is clicked, all four widgets re-render with recomputed aggregations
- When Story 017's Account/Source filter changes, all four widgets re-render immediately

### Technical Notes
- Reusable standalone Angular component: `AnalyticalWidgetComponent`  
  - Path: `src/app/features/dashboard/widgets/analytical-widget/analytical-widget.component.ts`
  - Inputs: `@Input() type: 'expense'|'investment'|'income'|'transfer'`, `@Input() data: CategoryTree[]`, `@Input() autoMode: boolean`
  - Output: `@Output() rowSelected = new EventEmitter<WidgetSelection>()`
- New shared type (in `src/app/core/models/`):
  ```ts
  export interface CategoryTree {
    category: string;
    total: number;
    subCategories: { name: string; total: number }[];
  }
  export interface WidgetSelection {
    type: 'expense'|'investment'|'income'|'transfer';
    category: string;
    subCategory?: string;
  }
  ```
- `DashboardStateService` gains four computed signals derived from `activePeriodStart`, `activePeriodEnd`, `selectedAccounts`:
  - `expenseTree: Signal<CategoryTree[]>`
  - `incomeTree: Signal<CategoryTree[]>`
  - `investmentTree: Signal<CategoryTree[]>`
  - `transferTree: Signal<CategoryTree[]>`
- Aggregation logic: group `Transaction[]` by `type → category → subCategory`, sum amounts, sort descending at both levels
- Auto toggle mutual exclusivity: `DashboardStateService` holds `activeAutoWidget: Signal<'expense'|'investment'|'income'|'transfer'|null>` (default `null`); toggling a widget emits to set this
- Row expand/collapse state is **component-local** (not persisted); reset to all-collapsed on data refresh
- Selected row state is tracked in `DashboardStateService` as `activeWidgetSelection: Signal<WidgetSelection|null>`
- CSS: use `display: grid; grid-template-columns: 1fr 1fr` for widget grid; collapse to single column via media query at < 768 px
- Widget tree table: use `<table>` with `<tbody>` toggling; sub-category rows use `class="subcategory-row hidden"` toggled by Angular `@if` or CSS class binding

### PO Clarifications (2026-04-13)

**Q: What does "only one Auto toggle active at a time" mean for the transactions panel?**  
→ The Transactions Panel (Story 019) listens to the `activeAutoWidget` signal. When it is `null` (no widget has Auto ON), the panel does not react to row selection. When a widget has Auto ON, the panel reacts to every row click on that widget. Switching Auto to a different widget transfers panel reactivity to the new widget.

**Q: What happens to the active selection when Auto is toggled OFF?**  
→ The visual highlight on the selected row remains (the selection is still tracked in `activeWidgetSelection`), but the panel no longer reacts to further clicks. The panel continues to show the last auto-refreshed data.

**Q: Are Level 1 totals inclusive of sub-category totals?**  
→ Yes. Category total = sum of all raw transaction amounts in that category, regardless of sub-category.

**Q: Can a sub-category exist under more than one category?**  
→ No. Each `Transaction` has exactly one `category` and one `subCategory`. Sub-categories are always scoped under their parent category.

**Q: What is the maximum number of rows displayed per widget?**  
→ No hard limit in v1 — all categories and sub-categories are shown. If the list becomes very long, a future story may add widget-level scroll or pagination. For now, let the widget grow to its natural height within the grid.

**Q: Does re-applying the period reset the row selection and expand/collapse state?**  
→ Yes. On any data refresh (Apply or account filter change), all widgets reset to collapsed / no-selection state.

---

## Architect Low-Level Design

### Component Tree / File Structure

```
src/app/features/dashboard/
└── widgets/
    └── analytical-widget/
        ├── analytical-widget.component.ts      (new — standalone, reusable ×4)
        └── analytical-widget.component.scss    (new)

src/app/core/services/
└── dashboard-state.service.ts    (modified — add tree signals, activeAutoWidget, activeWidgetSelection)

src/app/core/models/
└── data-models.ts                (modified — add CategoryTree, SubCategoryItem, WidgetSelection interfaces)
```

### Angular Signal / State Flow

```
DashboardStateService
  ├── transactions: WritableSignal<Transaction[]>
  ├── activePeriodStart: Signal<string>          ← from Story 017
  ├── activePeriodEnd: Signal<string>            ← from Story 017
  ├── selectedAccounts: Signal<string[]>         ← from Story 017
  │
  ├── [private] periodAccountFiltered: Signal<Transaction[]>   ← shared computed base
  │
  ├── expenseTree:    Signal<CategoryTree[]>     ← computed, type === 'EXPENSE'
  ├── incomeTree:     Signal<CategoryTree[]>     ← computed, type === 'INCOME'
  ├── investmentTree: Signal<CategoryTree[]>     ← computed, type === 'INVESTMENT'
  ├── transferTree:   Signal<CategoryTree[]>     ← computed, type === 'TRANSFER'
  │
  ├── activeAutoWidget: WritableSignal<TransactionType|null>   (default: null)
  └── activeWidgetSelection: WritableSignal<WidgetSelection|null> (default: null)

DashboardComponent template:
  ├── <app-analytical-widget type="EXPENSE"    [data]="expenseTree()"    [autoMode]="activeAutoWidget()==='EXPENSE'"    ... />
  ├── <app-analytical-widget type="INVESTMENT" [data]="investmentTree()" [autoMode]="activeAutoWidget()==='INVESTMENT'" ... />
  ├── <app-analytical-widget type="INCOME"     [data]="incomeTree()"     [autoMode]="activeAutoWidget()==='INCOME'"     ... />
  └── <app-analytical-widget type="TRANSFER"   [data]="transferTree()"   [autoMode]="activeAutoWidget()==='TRANSFER'"   ... />

AnalyticalWidgetComponent (internal local state only — never in service):
  ├── expandedCategories: WritableSignal<Set<string>>   reset on data @Input change via effect()
  └── selectedRowKey:     WritableSignal<string|null>   reset on data @Input change via effect()
```

### Interface and Type Definitions

Add to `src/app/core/models/data-models.ts`:

```typescript
export interface SubCategoryItem {
  name: string;
  total: number;
}

export interface CategoryTree {
  category: string;
  total: number;
  subCategories: SubCategoryItem[];
}

// WidgetSelection.type uses TransactionType (ALL_CAPS) to match Transaction.transactionType
export interface WidgetSelection {
  type: TransactionType;              // 'INCOME' | 'INVESTMENT' | 'EXPENSE' | 'TRANSFER'
  category: string;
  subCategory?: string;
}
```

> **Casing alignment:** The story's Technical Notes define `WidgetSelection.type` with lowercase values (`'expense'`). The existing `TransactionType` in `data-models.ts` is ALL_CAPS. Use `TransactionType` throughout to avoid runtime mismatches when filtering `Transaction[]` by widget type.

**DashboardStateService additions:**

```typescript
// Pure aggregation helper (module-level, not a service method):
function buildCategoryTree(txns: Transaction[]): CategoryTree[] {
  const map = new Map<string, Map<string, number>>();
  for (const t of txns) {
    const sub = t.subCategory ?? '(Uncategorised)';
    if (!map.has(t.category)) map.set(t.category, new Map());
    const subMap = map.get(t.category)!;
    subMap.set(sub, (subMap.get(sub) ?? 0) + t.amount);
  }
  return [...map.entries()]
    .map(([category, subMap]) => {
      const subCategories: SubCategoryItem[] = [...subMap.entries()]
        .map(([name, total]) => ({ name, total }))
        .sort((a, b) => b.total - a.total);
      return { category, total: subCategories.reduce((s, sc) => s + sc.total, 0), subCategories };
    })
    .sort((a, b) => b.total - a.total);
}

// Shared base filter (also used by Story 019 filteredTransactions):
readonly periodAccountFiltered = computed<Transaction[]>(() => {
  const txns     = this.transactions();
  const start    = this.activePeriodStart();
  const end      = this.activePeriodEnd();
  const accounts = this.selectedAccounts();
  return txns.filter(t =>
    (!start    || t.date >= start) &&
    (!end      || t.date <= end)   &&
    (accounts.length === 0 || accounts.includes(t.account))
  );
});

// Four tree signals:
readonly expenseTree    = computed<CategoryTree[]>(() =>
  buildCategoryTree(this.periodAccountFiltered().filter(t => t.transactionType === 'EXPENSE')));
readonly incomeTree     = computed<CategoryTree[]>(() =>
  buildCategoryTree(this.periodAccountFiltered().filter(t => t.transactionType === 'INCOME')));
readonly investmentTree = computed<CategoryTree[]>(() =>
  buildCategoryTree(this.periodAccountFiltered().filter(t => t.transactionType === 'INVESTMENT')));
readonly transferTree   = computed<CategoryTree[]>(() =>
  buildCategoryTree(this.periodAccountFiltered().filter(t => t.transactionType === 'TRANSFER')));

// Mutual exclusivity + row selection:
readonly activeAutoWidget       = signal<TransactionType | null>(null);
readonly activeWidgetSelection  = signal<WidgetSelection | null>(null);
```

**AnalyticalWidgetComponent skeleton:**

```typescript
@Component({
  selector: 'app-analytical-widget',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  templateUrl: './analytical-widget.component.html',
  styleUrls: ['./analytical-widget.component.scss'],
})
export class AnalyticalWidgetComponent {
  @Input({ required: true }) type!: TransactionType;
  @Input({ required: true }) set data(v: CategoryTree[]) {
    this._data.set(v);
  }
  get dataSignal() { return this._data.asReadonly(); }
  @Input() autoMode = false;

  @Output() rowSelected  = new EventEmitter<WidgetSelection>();
  @Output() autoToggled  = new EventEmitter<boolean>();

  private _data              = signal<CategoryTree[]>([]);
  expandedCategories         = signal<Set<string>>(new Set());
  selectedRowKey             = signal<string | null>(null);

  constructor() {
    // Reset expand/selection state whenever data changes (period refresh)
    effect(() => {
      this._data();               // track data changes
      untracked(() => {
        this.expandedCategories.set(new Set());
        this.selectedRowKey.set(null);
      });
    });
  }

  toggleCategory(category: string): void {
    const s = new Set(this.expandedCategories());
    s.has(category) ? s.delete(category) : s.add(category);
    this.expandedCategories.set(s);
    this.setSelected(category, undefined);
  }

  selectSubCategory(category: string, subCategory: string): void {
    this.setSelected(category, subCategory);
  }

  private setSelected(category: string, subCategory?: string): void {
    const key = subCategory ? `${category}::${subCategory}` : category;
    this.selectedRowKey.set(key);
    this.rowSelected.emit({ type: this.type, category, subCategory });
  }

  onAutoToggle(checked: boolean): void {
    this.autoToggled.emit(checked);
  }
}
```

### CSS / Layout Notes

**Widgets grid (in `dashboard.component.scss`):**
```scss
.widgets-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 767px) {
    grid-template-columns: 1fr;
  }
}
```

**Widget container:**
```scss
.widget-container {
  background: var(--surface-color);
  border-radius: 8px;
  padding: 12px 16px;
  overflow-y: auto;
  max-height: 400px;      /* prevent unbounded growth */
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-weight: 600;
}

.tree-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  cursor: pointer;
  border-radius: 4px;
  &:hover  { background: var(--hover-color); }
  &.selected { background: var(--highlight-color); }
}

.tree-row.subcategory-row { padding-left: 28px; font-size: 0.9em; }

.chevron { display: inline-block; transition: transform 0.2s; }
.chevron.expanded { transform: rotate(90deg); }
```

### Architectural Risks

1. **Type casing mismatch:** The story's Technical Notes use lowercase (`'expense'`) in the `WidgetSelection` interface. The codebase uses `TransactionType` (`'EXPENSE'`). Adopt `TransactionType` in `WidgetSelection.type` to avoid a silent filtering bug (`t.transactionType !== selection.type` would always be `true` if casings differ).
2. **`periodAccountFiltered` sharing:** Both `overallSummary` (Story 017) and the four tree signals share the same period+account filtering logic. Factor it into `readonly periodAccountFiltered` on the service rather than repeating the filter in each computed signal — otherwise a period change triggers five separate re-computations of the same filter.
3. **Expand/collapse reset on data refresh:** Component-local state (`expandedCategories`, `selectedRowKey`) does not reset automatically when `@Input() data` changes. The `effect()` watching `_data()` is the recommended mechanism. Without it, stale expand-state from the previous period is shown after a period refresh — violating the PO clarification.
4. **Auto-toggle mutual exclusivity wire-up:** `AnalyticalWidgetComponent.autoMode` is a dumb `@Input()` boolean. The exclusivity is enforced by `DashboardStateService.activeAutoWidget`. Binding `[autoMode]="state.activeAutoWidget() === type"` in the `DashboardComponent` template is sufficient — no coordination logic is needed inside the widget component itself.
5. **Max-height overflow:** Without `max-height` and `overflow-y: auto`, a deep category list causes the widget grid rows to be very unequal in height. Set `max-height: 400px` as the default; a future story can make this configurable.

### Cross-Story Integration Points

- `activePeriodStart`, `activePeriodEnd`, `selectedAccounts` **must** be added to `DashboardStateService` in Story 017 before this story's computed signals can reference them. Signal dependency is compile-time; missing signals cause TypeScript errors.
- `periodAccountFiltered` (added here) is also the base for Story 019's `filteredTransactions` computed signal. Expose it as `readonly` on the service.
- `activeWidgetSelection` and `activeAutoWidget` (defined here) are the primary inputs to Story 019's `TransactionsPanelComponent`. Define them here; Story 019 only reads them.
- Story 020 places an ad `<div class="ad-section-divider">` **after the closing tag** of `.widgets-grid`. The grid wrapper must be a concrete `<div class="widgets-grid">` (not `<ng-container>`) for the adjacent sibling placement to work.

---

## Architect Review Comments

### AC-018-01 — `WidgetSelection.type` casing is inconsistent with `TransactionType`
The story's Technical Notes define `WidgetSelection.type` as `'expense'|'investment'|'income'|'transfer'` (lowercase). The `Transaction.transactionType` field uses `TransactionType` (`'EXPENSE'|'INVESTMENT'|'INCOME'|'TRANSFER'`). If the developer implements the lowercase variant, the panel filter in Story 019 (`t.transactionType !== selection.type`) will **never match** any transaction at runtime. **Correction:** define `WidgetSelection.type` as `TransactionType` and remove the lowercase variant from the story's code block.

### AC-018-02 — `activeAutoWidget` signal uses lowercase in Story, uppercase elsewhere
The story's `activeAutoWidget: Signal<'expense'|'investment'|'income'|'transfer'|null>` must be changed to `Signal<TransactionType | null>` for the same casing reason as above.

### AC-018-03 — Category total definition
PO confirmed: "Category total = sum of all raw transaction amounts in that category, regardless of sub-category." The `buildCategoryTree` helper must sum transaction `amount` values directly (not sub-category totals) to ensure correctness when a transaction has no sub-category or is in a catch-all sub-category bucket.

### AC-018-04 — No max-height / scroll specified in acceptance criteria
The acceptance criteria do not specify a `max-height` for the widget tree table. Without it, a category with 30+ sub-categories will dominate the 2×2 grid layout. The architect recommends defaulting to `max-height: 400px; overflow-y: auto` and making this a CSS variable so it can be tuned per device.

### AC-018-05 — Missing `data-testid` for the chevron element
The acceptance criteria state "the chevron rotates 90° when expanded." No `data-testid` is defined for the chevron element, making it untestable in E2E automation without relying on structural CSS selectors. Add `[data-testid="widget-row-chevron"]` to the chevron element in the implementation.

### AC-018-06 — Empty sub-category handling
PO clarification states sub-categories are always scoped under their parent. However, the `Transaction` model has `subCategory?: string | null`. When `subCategory` is null/undefined, the implementation must assign the transaction to a defined fallback sub-category (e.g., `'(Uncategorised)'`) rather than throwing or silently dropping it.

### AC-018-07 — Reset behaviour after Apply vs. account filter change
Both Apply (period change) and account filter change must reset expand/collapse and selection state. The `effect()` approach watching `_data` handles this correctly because both triggers cause the tree signal to recompute a new array reference, which fires the effect. Confirm this during implementation testing.
