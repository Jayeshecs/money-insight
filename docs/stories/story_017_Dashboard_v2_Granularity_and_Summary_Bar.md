## Story: Dashboard v2.0 — Granularity Bar & Overall Summary Bar

**Status:** ✅ QA Verified — All E2E Tests Passing (2026-04-13)

**As a** user  
**I want** to control the time period and granularity applied to the entire Dashboard, and see top-level financial totals at a glance  
**So that** I can quickly assess my finances for any custom time window (monthly, quarterly, yearly) and filter by account/source

### Background
This story introduces **Sections 1 and 2** of the Dashboard v2.0 redesign (see `docs/design/04_UI_UX.md` § 1.1 v2.0).

The existing Dashboard (Stories 007, 010) uses a simple period dropdown (Last Month / Last 3 Months / All Time). The v2.0 design replaces this with:
- A **Granularity Bar** (Section 1) featuring a dual-handle range slider and an Apply button
- An **Overall Summary Bar** (Section 2) showing four aggregated totals and a multiselect Account/Source filter

These two sections sit above the widget grid (Story 018) and the transactions panel (Story 019). They drive the period and account context for the entire dashboard.

### Scenarios
- User opens Dashboard; Granularity defaults to Monthly; period range spans the full available data range (earliest to latest transaction date)
- User drags the range slider; start and end date inputs update in real time to reflect the new range
- User types a date directly into the start/end date input; slider handles move to match
- User changes Granularity to Quarterly; slider step size snaps to quarter boundaries
- User clicks Apply; Sections 2, 3, and 4 all recompute with the new period and granularity
- Without clicking Apply, changing the slider or date inputs does NOT refresh other sections
- Overall Summary Bar shows total Income, Expense, Investment, and Transfer for the selected period in INR
- User opens Account/Source multiselect and deselects two accounts; Summary totals and all downstream sections filter immediately (no Apply required)
- User reselects all accounts; totals return to full-period values
- On mobile, all elements stack vertically; date inputs are tappable and open a native date picker

### Acceptance Criteria

**Section 1 — Granularity Bar**
- `[data-testid="granularity-select"]` is a dropdown with exactly three options: `yearly`, `quarterly`, `monthly`; default selected value is `monthly`
- `[data-testid="period-start"]` is an editable date input (ISO date string `YYYY-MM`); value reflects the left handle of the range slider
- `[data-testid="period-end"]` is an editable date input (ISO date string `YYYY-MM`); value reflects the right handle
- `[data-testid="period-range-slider"]` is a dual-handle slider; left handle = start, right handle = end; handle step size equals one granularity unit
- Moving a slider handle updates the corresponding date input in real time
- Editing a date input moves the corresponding slider handle
- Changing `granularity-select` value resets both handles to the full available data range and snaps them to the nearest valid boundary
- `[data-testid="apply-period-btn"]` triggers dashboard data refresh; clicking is the only way to cause the refresh
- Before Apply is clicked, `[data-testid="overall-income"]` (and all other summary/widget data) must NOT reflect a slider change
- Slider left handle cannot exceed right handle position; date inputs enforce the same constraint

**Section 2 — Overall Summary Bar**
- `[data-testid="overall-income"]` displays the sum of all INCOME transactions in the selected period; label has ↑ icon; text colour is green
- `[data-testid="overall-expense"]` displays the sum of all EXPENSE transactions in the selected period; label has ↓ icon; text colour is red
- `[data-testid="overall-investment"]` displays the sum of all INVESTMENT transactions in the selected period; icon 💼; text colour is blue
- `[data-testid="overall-transfer"]` displays the sum of all TRANSFER transactions in the selected period; icon ⇄; text colour is grey
- All amounts are formatted in INR with Indian thousands separator (₹X,XX,XXX.XX)
- `[data-testid="account-source-filter"]` is a multiselect dropdown; all accounts are selected by default ("All")
- The badge on `account-source-filter` shows the count of selected accounts (e.g., "4")
- Deselecting an account causes `overall-income`, `overall-expense`, `overall-investment`, and `overall-transfer` to re-aggregate **immediately** (no Apply click required)
- When all accounts are selected, the badge shows the total count of accounts (not "All" text)
- `[data-testid="dashboard-empty-state"]` is shown when the selected period contains zero transactions across all types

**Responsive**
- At viewport < 768 px, Granularity Bar elements stack in two rows: [Granularity dropdown] on row 1; [Start input] [Slider] [End input] [Apply] on row 2
- At viewport < 768 px, Overall Summary Bar shows two columns: Income + Expense in row 1; Investment + Transfer in row 2; Account/Source multiselect below

### Technical Notes
- New Angular components (standalone):
  - `GranularityBarComponent` — `src/app/features/dashboard/granularity-bar/granularity-bar.component.ts`
  - `OverallSummaryBarComponent` — `src/app/features/dashboard/overall-summary-bar/overall-summary-bar.component.ts`
- Dual-handle slider: implement using `@angular/cdk` drag-and-drop or a lightweight wrapper; no `Chart.js` dependency
- `DashboardStateService` gains:
  - `granularity: Signal<'yearly'|'quarterly'|'monthly'>` (default `'monthly'`)
  - `pendingPeriodStart: Signal<string>` / `pendingPeriodEnd: Signal<string>` — updated by slider/input without triggering refresh
  - `activePeriodStart: Signal<string>` / `activePeriodEnd: Signal<string>` — set only when Apply is clicked
  - `selectedAccounts: Signal<string[]>` — set of currently selected account/source values; triggers immediate re-aggregation
  - `availableAccounts: Signal<string[]>` — derived from all unique `Transaction.accountSource` values in IndexedDB
- Aggregation: computed from `Transaction[]` in `DashboardStateService`; no WASM changes required
- Account/Source filter is applied with AND logic alongside the active period filter across all dashboard sections

### PO Clarifications (2026-04-13)

**Q: Does Apply also apply the Account/Source filter?**  
→ No. Account/Source selection takes effect immediately. Apply only triggers period/granularity refresh.

**Q: Granularity options — what does "Yearly" mean for the slider?**  
→ Each slider step represents one calendar year (e.g., 2023, 2024). Start/end inputs show `YYYY` format when granularity is `yearly`, `YYYY-Q#` for quarterly, `YYYY-MM` for monthly.

**Q: What is the default period range on first load?**  
→ Earliest available transaction date (from IndexedDB) to latest available transaction date. If IndexedDB is empty, both handles are at today's date and totals show ₹0.

**Q: Are "pending" period values persisted across navigation?**  
→ No. Pending values are in-memory only. Navigating away and back resets to the last applied values.

**Q: INR format — which locale?**  
→ Use Angular's `CurrencyPipe` with locale `en-IN` and currency code `INR`. Symbol: `₹`.

---

## Architect Low-Level Design

### Component Tree / File Structure

```
src/app/features/dashboard/
├── granularity-bar/
│   ├── granularity-bar.component.ts       (new — standalone)
│   └── granularity-bar.component.scss     (new)
├── overall-summary-bar/
│   ├── overall-summary-bar.component.ts   (new — standalone)
│   └── overall-summary-bar.component.scss (new)
└── dashboard.component.ts                 (modified — replace period-filter block with new section components)

src/app/core/services/
└── dashboard-state.service.ts             (modified — add v2.0 signals listed below)

src/app/core/models/
└── data-models.ts                         (modified — add Granularity, OverallSummary types)
```

### Angular Signal / State Flow

```
IndexedDB
  └── DashboardStateService.loadFromIndexedDB()
        └── transactions: WritableSignal<Transaction[]>
              │
              ├── availableAccounts: Signal<string[]>         ← computed; distinct t.account values
              │
              ├── [GranularityBarComponent writes]
              │   ├── granularity: WritableSignal<Granularity>
              │   ├── pendingPeriodStart: WritableSignal<string>
              │   └── pendingPeriodEnd: WritableSignal<string>
              │
              ├── [Apply button click]
              │   ├── activePeriodStart: WritableSignal<string>  ← set ONLY via applyPeriod()
              │   └── activePeriodEnd: WritableSignal<string>    ← set ONLY via applyPeriod()
              │
              ├── [OverallSummaryBarComponent writes]
              │   └── selectedAccounts: WritableSignal<string[]>
              │
              └── overallSummary: Signal<OverallSummary>
                    └── computed from activePeriodStart + activePeriodEnd + selectedAccounts + transactions

GranularityBarComponent   reads: pendingPeriodStart, pendingPeriodEnd, granularity, availableAccounts
                          writes: granularity, pendingPeriodStart, pendingPeriodEnd
                          fires: state.applyPeriod() on Apply click

OverallSummaryBarComponent reads: overallSummary, availableAccounts, selectedAccounts
                           writes: selectedAccounts (immediate, no Apply)
```

### Interface and Type Definitions

Add to `src/app/core/models/data-models.ts`:

```typescript
export type Granularity = 'yearly' | 'quarterly' | 'monthly';

export interface OverallSummary {
  income: number;
  expense: number;
  investment: number;
  transfer: number;
}
```

**DashboardStateService additions** (do NOT replace existing signals — add alongside them):

```typescript
// New writable signals:
readonly granularity = signal<Granularity>('monthly');
readonly pendingPeriodStart = signal<string>('');
readonly pendingPeriodEnd = signal<string>('');
readonly activePeriodStart = signal<string>('');
readonly activePeriodEnd = signal<string>('');
readonly selectedAccounts = signal<string[]>([]);

// New computed signals:
readonly availableAccounts = computed<string[]>(() =>
  [...new Set(this.transactions().map(t => t.account))].sort()
);

readonly overallSummary = computed<OverallSummary>(() => {
  const txns = this.transactions();
  const start = this.activePeriodStart();
  const end = this.activePeriodEnd();
  const accounts = this.selectedAccounts();
  const filtered = txns.filter(t =>
    (!start || t.date >= start) &&
    (!end   || t.date <= end)   &&
    (accounts.length === 0 || accounts.includes(t.account))
  );
  return {
    income:     filtered.filter(t => t.transactionType === 'INCOME').reduce((s, t) => s + t.amount, 0),
    expense:    filtered.filter(t => t.transactionType === 'EXPENSE').reduce((s, t) => s + t.amount, 0),
    investment: filtered.filter(t => t.transactionType === 'INVESTMENT').reduce((s, t) => s + t.amount, 0),
    transfer:   filtered.filter(t => t.transactionType === 'TRANSFER').reduce((s, t) => s + t.amount, 0),
  };
});

// New method — called by GranularityBarComponent Apply button only:
applyPeriod(): void {
  this.activePeriodStart.set(this.pendingPeriodStart());
  this.activePeriodEnd.set(this.pendingPeriodEnd());
}

// New method — called when granularity changes to reset pending range to full available range:
resetPendingToFullRange(): void {
  const txns = this.transactions();
  if (txns.length === 0) return;
  const dates = txns.map(t => t.date).sort();
  this.pendingPeriodStart.set(dates[0].substring(0, 7));
  this.pendingPeriodEnd.set(dates[dates.length - 1].substring(0, 7));
}
```

**GranularityBarComponent skeleton:**

```typescript
@Component({
  selector: 'app-granularity-bar',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './granularity-bar.component.html',
  styleUrls: ['./granularity-bar.component.scss'],
})
export class GranularityBarComponent {
  private state = inject(DashboardStateService);

  readonly granularity    = this.state.granularity;
  readonly pendingStart   = this.state.pendingPeriodStart;
  readonly pendingEnd     = this.state.pendingPeriodEnd;

  onApply(): void {
    this.state.applyPeriod();
  }

  onGranularityChange(value: Granularity): void {
    this.state.granularity.set(value);
    this.state.resetPendingToFullRange();
  }
}
```

**OverallSummaryBarComponent skeleton:**

```typescript
@Component({
  selector: 'app-overall-summary-bar',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  templateUrl: './overall-summary-bar.component.html',
  styleUrls: ['./overall-summary-bar.component.scss'],
})
export class OverallSummaryBarComponent {
  private state = inject(DashboardStateService);

  readonly summary           = this.state.overallSummary;
  readonly availableAccounts = this.state.availableAccounts;
  readonly selectedAccounts  = this.state.selectedAccounts;

  onAccountToggle(account: string, selected: boolean): void {
    const current = this.selectedAccounts();
    this.state.selectedAccounts.set(
      selected ? [...current, account] : current.filter(a => a !== account)
    );
  }
}
```

### CSS / Layout Notes

**GranularityBarComponent — Desktop (≥ 768 px):**
```scss
.granularity-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 12px 16px;
  background: var(--surface-color);
  border-radius: 8px;
}
.range-slider-wrapper { flex: 1; min-width: 200px; position: relative; height: 24px; }
```

**GranularityBarComponent — Mobile (< 768 px):**
```scss
@media (max-width: 767px) {
  .granularity-bar { flex-direction: column; align-items: stretch; }
  .granularity-row-1 { display: flex; justify-content: center; }
  .granularity-row-2 { display: flex; gap: 8px; align-items: center; }
}
```

**OverallSummaryBarComponent — Desktop:**
```scss
.summary-bar {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: center;
  padding: 12px 16px;
}
.stat-chip  { flex: 1 1 150px; }
.account-filter { margin-left: auto; }
```

**OverallSummaryBarComponent — Mobile (< 768 px):**
```scss
@media (max-width: 767px) {
  .summary-bar {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .account-filter { grid-column: 1 / -1; }
}
```

### Architectural Risks

1. **Dual-handle slider:** `@angular/cdk` DragDrop is not a range slider. Implement a custom component with two absolutely-positioned `<input type="range">` overlaid on a shared track (the overlapping-inputs technique), or use `HostListener` on `mousedown`/`mousemove`/`mouseup`. Avoid heavyweight third-party slider libraries; the CDK drag approach risks significant CSS complexity.
2. **Date format by granularity:** The story defines three input formats (`YYYY`, `YYYY-Q#`, `YYYY-MM`). Use `<input type="text">` with a `pattern` attribute, **not** `<input type="month">` (no browser support for `YYYY-Q#`). Validate on blur; reject invalid values and revert to previous.
3. **Initialization order:** On `loadFromIndexedDB()` completion, call `resetPendingToFullRange()` and then `applyPeriod()` once to ensure the initial state is consistent and downstream tree signals compute correctly.
4. **Account filter "All" badge logic:** Never store a `"All"` literal in `selectedAccounts`. Represent "all selected" as `selectedAccounts.length === availableAccounts.length`. The badge count is always `selectedAccounts.length`.
5. **`transactionType` casing:** The existing `Transaction` model uses ALL_CAPS (`'INCOME'`, `'EXPENSE'`, etc.). The summary aggregation must filter with the same casing — do not compare against lowercase variants.

### Cross-Story Integration Points

- `activePeriodStart` and `activePeriodEnd` (defined here) are consumed by Story 018's `expenseTree / incomeTree / investmentTree / transferTree` computed signals. They must be defined in `DashboardStateService` before Story 018 is implemented.
- `selectedAccounts` (defined here) is an additional filter for all Story 018 tree computations and Story 019's `filteredTransactions`.
- Story 019's `TransactionsPanelComponent` must reset to page 1 when `activePeriodStart` or `activePeriodEnd` change (tracked via `effect()`).
- Story 020's `DashboardComponent` template places `<app-granularity-bar>` and `<app-overall-summary-bar>` as the first two elements in the main content area.

---

## Architect Review Comments

### AC-017-01 — Slider handle step constraint not precision-safe
The acceptance criteria state slider handles snap to granularity boundaries. The implementation must convert slider numeric positions (integers representing month/quarter/year offsets) to date strings — not raw ISO dates — to avoid off-by-one errors on month boundary calculations. Recommend a utility function `offsetToDateString(offset: number, granularity: Granularity, baseDate: string): string`.

### AC-017-02 — Apply button and initial load
The scenario "Dashboard loads; Granularity defaults to Monthly; period range spans the full available data range" implies that on **first load** the `activePeriodStart/End` are already set (not empty). The implementation must call `resetPendingToFullRange()` followed by `applyPeriod()` at the end of `loadFromIndexedDB()`. Missing this means `overallSummary` returns all-zeros on first render.

### AC-017-03 — "Before Apply is clicked, summary must NOT reflect slider change" is a testability concern
The acceptance criteria require an E2E test asserting that moving the slider does **not** update `overall-income` until Apply is clicked. This requires `pendingPeriodStart/End` and `activePeriodStart/End` to be strictly separate signals. Merging them (e.g., using a single signal that is debounced) would violate this requirement. The architect confirms the two-signal design is mandatory.

### AC-017-04 — Account/Source field naming mismatch
The story uses `Account/Source` in the UI and `Transaction.accountSource` in its Technical Notes, but the actual `Transaction` interface in `data-models.ts` uses `account` (not `accountSource`). Correct the Technical Notes: `availableAccounts` must be derived from `Transaction.account`, not a non-existent `accountSource` field.

### AC-017-05 — INR formatting with `CurrencyPipe` locale
`CurrencyPipe` with locale `en-IN` requires `LOCALE_ID` to be set to `en-IN` in `app.config.ts` (via `{ provide: LOCALE_ID, useValue: 'en-IN' }`) and the locale data must be registered (`registerLocaleData(localeEnIN)`). Verify this is already in place from Story 007; if not, it must be added here.

### AC-017-06 — Empty IndexedDB state
When IndexedDB is empty, both handles should be at "today" in the current granularity. The implementation must handle the case where `transactions()` is empty: skip `resetPendingToFullRange()` and default pending start/end to the current month in `YYYY-MM` format.
