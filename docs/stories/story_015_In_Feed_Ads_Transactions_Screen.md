## Story: In-Feed Ad Placements in Transaction Review Screen

**Status:** To Do

**As a** product owner maximising ad revenue  
**I want** strategically placed in-feed ads in the Transactions Review screen  
**So that** monetisation is extended to the high-engagement transaction review workflow without disrupting user experience

### Background
Sprint 2 (Story 010) placed ads on the Dashboard (skyscraper + banner). The FSD also specifies in-feed ads inside the transaction review: a native ad card/row after every 20th transaction on desktop, and an ad card inside the mobile card list. This story extends `AdPlaceholderComponent` to work as an inline list item.

### Scenarios
- Desktop: Transactions table shows a native ad row after every 20th data row
- Mobile: Transaction card list shows an ad card after every 20th transaction card
- Empty transactions list shows no ad
- Fewer than 20 transactions shows no in-feed ad
- Ad row/card is clearly labelled "Sponsored" and does not interfere with filter/sort state
- Paginating to a new page re-evaluates ad insertion positions correctly

### Acceptance Criteria
1. On desktop (≥ 768 px), `[data-testid="transactions-table"]` contains an `<tr data-testid="ad-row">` after every 20th data row (row index 20, 40, 60, …).
2. On mobile (< 768 px), the transaction card list contains a `[data-testid="ad-card"]` element after every 20th `[data-testid="transaction-card"]`.
3. Each `[data-testid="ad-row"]` and `[data-testid="ad-card"]` contains an `<app-ad-placeholder>` with `format="native"` and `placement="transactions-in-feed"`.
4. `[data-testid="ad-row"]` / `[data-testid="ad-card"]` are **not** counted toward the pagination 20-rows-per-page limit; each page shows exactly 20 data rows plus inline ads.
5. If the displayed page has fewer than 20 data rows, no in-feed ad is shown on that page.
6. The in-feed ad contains a visible `[data-testid="ad-sponsored-label"]` element with text "Sponsored".
7. Sprint 1 Story 006 and Sprint 2 Story 010 ad E2E tests continue to pass (no regression).
8. `AdPlaceholderComponent` gains a `"native"` format option rendering: `min-height: 90px`, `width: 100%`, grey background with "Ad" label, same dev-placeholder styling as existing formats.

### Technical Notes
- `TransactionsListComponent` template: use `*ngFor` with `index`; add `*ngIf="(index + 1) % 20 === 0"` after each row/card.
- New format `'native'` in `AdPlaceholderComponent`: add to the `@Input() format` union type and the size map.
- In-feed ad uses `placement="transactions-in-feed"` and context `"transactions"`.
- Ensure `[data-testid="transaction-count"]` still reflects only data rows (not ad rows).
- Pagination: `pagedTransactions` getter already slices to 20; ad insertion is purely template-level and does not affect the data array.
- Mobile card CSS: the ad card should occupy a full-width card slot with no extra margin collapsing.

### PO Clarifications (2025-06-XX — post agent pre-analysis)

**C1 — Ad positioning with PAGE_SIZE = 20 pagination:**
`TransactionsListComponent` paginates at `PAGE_SIZE = 20`. "Ad after every 20th row" with this page size means **one ad per full page, positioned after the 20th (last) data row on that page**. This is the correct and intended behaviour. There will never be a mid-page ad in Sprint 3. The template condition is:  
- Show the in-feed ad `@if(pagedTransactions.length === PAGE_SIZE)` — i.e., only when the current page is full (20 rows). Partial last pages (< 20 rows) show no ad, satisfying AC5.

**C2 — Template placement:**
The ad element must appear **after** the `@for` loop (or at the end of the loop on the final iteration), NOT inline between arbitrary rows. Recommended pattern:
```html
<!-- Desktop table -->
@for (tx of pagedTransactions; track tx.id; let i = $index) {
  <tr ...>...</tr>
}
@if (pagedTransactions.length === PAGE_SIZE) {
  <tr data-testid="ad-row"><td colspan="5"><app-ad-placeholder .../></td></tr>
}
```

**C3 — `<td colspan>` for valid HTML:**
`<tr data-testid="ad-row">` must contain a single `<td colspan="5">` child to span all table columns (ID, Date, Description, Amount, Category = 5 columns). Using a raw `<tr>` without a `<td>` produces invalid HTML and breaks table layout. `colspan` value must match the actual column count in the table header.

**C4 — AC8 CORRECTION — `'native'` format already exists:**
**Remove** the requirement in AC8 to "add a `'native'` format option to `AdPlaceholderComponent`". The `'native'` format with `min-height: 90px` and `width: 100%` is **already implemented** in `AdPlaceholderComponent`. No changes to `AdPlaceholderComponent` are needed. AC8 should be reworded as: "Verify `<app-ad-placeholder format='native' placement='transactions-in-feed'>` renders correctly with the existing `'native'` format styling."

**C5 — `*ngFor` vs `@for` for Sprint 3:**
Use the new Angular control-flow syntax (`@for`, `@if`) for all Sprint 3 template additions. Do NOT use `*ngFor`/`*ngIf` in new code. The Technical Notes reference to `*ngFor` and `*ngIf` must be updated by the developer to `@for`/`@if`.

**C6 — Mobile card list — ad position:**
For mobile (`< 768 px`), the ad card appears after the last `[data-testid="transaction-card"]` on a full page (same condition: `pagedTransactions.length === PAGE_SIZE`). Use `[data-testid="ad-card"]` on the wrapper element.

**C7 — `[data-testid="transaction-count"]` unaffected:**
The count displayed in `[data-testid="transaction-count"]` always reflects only data rows. The ad row/card must NOT increment this count. Since ad insertion is purely template-level (no changes to the data array), this is guaranteed — no additional code needed.

**C8 — `[data-testid="ad-sponsored-label"]`:**
The "Sponsored" label element must be rendered as part of the in-feed ad template in `TransactionsListComponent` (not inside `AdPlaceholderComponent`). This keeps `AdPlaceholderComponent` generic and reusable. Add `<span data-testid="ad-sponsored-label">Sponsored</span>` inside the `<td colspan="5">` / `[data-testid="ad-card"]` wrapper, above `<app-ad-placeholder>`.
