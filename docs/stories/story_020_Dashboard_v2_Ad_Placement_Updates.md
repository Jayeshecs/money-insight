## Story: Dashboard v2.0 — Ad Placement Updates

**Status:** ✅ QA Verified — All E2E Tests Passing (2026-04-13)

**As a** product owner  
**I want** AdSense ad placeholders repositioned to fit the new v2.0 four-section Dashboard layout  
**So that** ad revenue is maintained on the Dashboard without blocking analytical widget content, and without a sidebar that no longer exists

### Background
Story 010 (Dashboard Ad Placements) placed ads in a left nav + right sidebar structure: a 160×600 skyscraper in the right sidebar and a 728×90 banner between the pie chart and the Recent Transactions table.

The v2.0 Dashboard redesign (Stories 017–019) uses a full-width, vertically-stacked layout with no sidebar. The sidebar skyscraper placement is no longer feasible. This story replaces the retired ad containers with two new 728×90 banner slots placed at the natural decision points between sections:

1. **Between Section 2 (Overall Summary) and Section 3 (Widgets Grid)** — user has just seen total figures and is about to explore category detail. High contextual relevance for financial products.
2. **Between Section 3 (Widgets Grid) and Section 4 (Transactions Panel)** — user has selected a category and is about to drill into individual transactions. Ideal for category-contextual ads (e.g., dining cards for Expense → Food selection).

### Scenarios
- User opens Dashboard on desktop (≥ 768 px) and sees a 728×90 native banner between the Overall Summary Bar and the Widgets Grid
- User opens Dashboard on desktop (≥ 768 px) and sees a 728×90 native banner between the Widgets Grid and the Transactions Panel
- On mobile (< 768 px), both banners are hidden; the existing Story 011 sticky footer (320×50) remains the only mobile ad
- Ads do not cause layout shift — containers reserve their space before AdSense fills them
- Ads do not overlap or visually merge with any section content
- Dev placeholder (grey box with "Ad" label) is shown when AdSense is unavailable (non-prod environment)
- After Story 017–019 implementation, no orphaned `sidebar-skyscraper` or old `dashboard-banner` ad containers remain in the Dashboard template

### Acceptance Criteria
- `[data-testid="ad-placeholder"][data-placement="dashboard-summary-banner"]` is present in the Dashboard template between `<app-overall-summary-bar>` and the widgets grid container
- `dashboard-summary-banner` is visible (not `display: none`) at viewport ≥ 768 px
- `dashboard-summary-banner` container has explicit CSS `width: 728px; height: 90px` before AdSense loads (CLS = 0)
- `[data-testid="ad-placeholder"][data-placement="dashboard-widgets-banner"]` is present between the widgets grid container and `<app-transactions-panel>`
- `dashboard-widgets-banner` is visible (not `display: none`) at viewport ≥ 768 px
- `dashboard-widgets-banner` container has explicit CSS `width: 728px; height: 90px` (CLS = 0)
- Both banners are hidden (`display: none`) at viewport < 768 px
- Both banners have `tabindex="-1"` and `role="complementary"`
- No `[data-placement="sidebar-skyscraper"]` container exists anywhere in the Dashboard template
- No `[data-placement="dashboard-banner"]` container (the Story 010 v1 slot) exists in the Dashboard template
- Story 010 and Story 011 E2E tests continue to pass (regression check — skyscraper test must be removed/updated)
- Lighthouse CLS score remains 0 on Dashboard page (manual check before story closure)

### Technical Notes
- Remove from `DashboardComponent` template:
  - The sidebar wrapper div and `<app-ad-placeholder data-placement="sidebar-skyscraper">` element
  - The `<app-ad-placeholder data-placement="dashboard-banner">` element (v1 position)
- Add to `DashboardComponent` template (in section order):
  ```html
  <!-- After </app-overall-summary-bar> -->
  <div class="ad-section-divider" aria-hidden="true">
    <app-ad-placeholder
      data-testid="ad-placeholder"
      data-placement="dashboard-summary-banner"
      format="banner"
      placement="dashboard-summary-banner"
      role="complementary"
      tabindex="-1">
    </app-ad-placeholder>
  </div>

  <!-- After </div> (widgets grid closing tag), before <app-transactions-panel> -->
  <div class="ad-section-divider" aria-hidden="true">
    <app-ad-placeholder
      data-testid="ad-placeholder"
      data-placement="dashboard-widgets-banner"
      format="banner"
      placement="dashboard-widgets-banner"
      role="complementary"
      tabindex="-1">
    </app-ad-placeholder>
  </div>
  ```
- CSS for `.ad-section-divider`:
  ```css
  .ad-section-divider {
    display: flex;
    justify-content: center;
    margin: 8px 0;
    width: 100%;
    min-height: 90px; /* reserve space for CLS = 0 */
  }
  @media (max-width: 767px) {
    .ad-section-divider { display: none; }
  }
  ```
- Update `environment.ts` / `environment.prod.ts` AdSense slot map:
  - **Remove:** `'sidebar-skyscraper'`, `'dashboard-banner'`
  - **Add:** `'dashboard-summary-banner': ''` (dev) / `'<real-slot-id>'` (prod), `'dashboard-widgets-banner': ''` (dev) / `'<real-slot-id>'` (prod)
- Update any E2E tests that assert on `sidebar-skyscraper` or old `dashboard-banner` placement — tester owns this per the existing test update protocol

### PO Clarifications (2026-04-13)

**Q: Are the two new banners shown unconditionally on every Dashboard visit, or only after widget interaction?**  
→ Both banners load unconditionally on Dashboard page load. They do not depend on any widget row being selected.

**Q: Does the `dashboard-widgets-banner` shift position when the Transactions Panel expands?**  
→ No. The `dashboard-widgets-banner` is positioned between the closing tag of the widgets grid and the opening tag of `<app-transactions-panel>`. As the Transactions Panel grows (more rows, pagination), it expands downward — the banner stays fixed between sections 3 and 4.

**Q: The Story 010 acceptance criteria check `sidebar-skyscraper` being present. Does retiring it break Story 010 QA?**  
→ Story 010 status will be updated to "Superseded by Story 020". The QA test asserting `sidebar-skyscraper` presence must be removed by the tester. This is an intentional breaking change to Story 010's test suite.

**Q: Does this story own the mobile sticky footer ad?**  
→ No. The mobile sticky footer (320×50) is owned by Story 011. No changes to it are required here.

**Q: AdSense slot IDs for prod — who provides them?**  
→ Slot IDs are provided by the product owner at the time of prod deployment. Leave as empty strings in code; fill in `environment.prod.ts` outside of this story's scope.

---

## Architect Low-Level Design

### Component Tree / File Structure

No new component files. All changes are confined to existing files:

```
src/app/features/dashboard/
└── dashboard.component.ts        (modified — template restructure only; see v2.0 order below)

src/client/src/environments/
├── environment.ts                (modified — remove sidebar-skyscraper, dashboard-banner; add two new slots)
└── environment.prod.ts           (modified — same; prod slot IDs left empty as per PO)
```

Relevant existing files (read-only reference):
```
src/app/shared/components/ad-placeholder/ad-placeholder.component.ts   (unchanged)
```

### v2.0 Dashboard Template — Definitive Section Order

The `DashboardComponent` template main-content area must be restructured to the following order after Stories 017–019 are merged:

```html
<!-- SECTION 1 -->
<app-granularity-bar />

<!-- SECTION 2 -->
<app-overall-summary-bar />

<!-- AD SLOT 1: between Summary Bar and Widgets Grid -->
<div class="ad-section-divider" aria-hidden="true">
  <app-ad-placeholder
    data-testid="ad-placeholder"
    data-placement="dashboard-summary-banner"
    format="banner"
    placement="dashboard-summary-banner"
    role="complementary"
    tabindex="-1">
  </app-ad-placeholder>
</div>

<!-- SECTION 3 -->
<div class="widgets-grid">
  <app-analytical-widget type="EXPENSE"    [data]="state.expenseTree()"    [autoMode]="state.activeAutoWidget()==='EXPENSE'"    (rowSelected)="onRowSelected($event)" (autoToggled)="onAutoToggled('EXPENSE',   $event)" />
  <app-analytical-widget type="INVESTMENT" [data]="state.investmentTree()" [autoMode]="state.activeAutoWidget()==='INVESTMENT'" (rowSelected)="onRowSelected($event)" (autoToggled)="onAutoToggled('INVESTMENT',$event)" />
  <app-analytical-widget type="INCOME"     [data]="state.incomeTree()"     [autoMode]="state.activeAutoWidget()==='INCOME'"     (rowSelected)="onRowSelected($event)" (autoToggled)="onAutoToggled('INCOME',    $event)" />
  <app-analytical-widget type="TRANSFER"   [data]="state.transferTree()"   [autoMode]="state.activeAutoWidget()==='TRANSFER'"   (rowSelected)="onRowSelected($event)" (autoToggled)="onAutoToggled('TRANSFER',  $event)" />
</div>

<!-- AD SLOT 2: between Widgets Grid and Transactions Panel -->
<div class="ad-section-divider" aria-hidden="true">
  <app-ad-placeholder
    data-testid="ad-placeholder"
    data-placement="dashboard-widgets-banner"
    format="banner"
    placement="dashboard-widgets-banner"
    role="complementary"
    tabindex="-1">
  </app-ad-placeholder>
</div>

<!-- SECTION 4 -->
<app-transactions-panel />
```

Elements that **must be removed** from the v1 template:
- `<nav class="sidebar-nav">` wrapper div and its contents (full sidebar element)
- `<app-ad-placeholder ... placement="sidebar-skyscraper">` and its wrapper
- `<app-ad-placeholder ... placement="dashboard-banner">` and its wrapper `.dashboard-banner-ad-wrapper`
- Old period-filter button group div (`data-testid="period-filter"`)
- Old widgets-row, charts-row, net-flow-trend section, recent-transactions-section

### v2.0 DashboardComponent Handler Methods

Two event handler methods are needed in `DashboardComponent` to wire widget outputs to the state service:

```typescript
// In DashboardComponent class:
readonly state = inject(DashboardStateService);

onRowSelected(selection: WidgetSelection): void {
  this.state.activeWidgetSelection.set(selection);
}

onAutoToggled(type: TransactionType, enabled: boolean): void {
  this.state.activeAutoWidget.set(enabled ? type : null);
}
```

### CSS Notes

**New CSS to add in `dashboard.component.scss`:**
```scss
.ad-section-divider {
  display: flex;
  justify-content: center;
  margin: 8px 0;
  width: 100%;
  min-height: 90px;   /* reserve space before AdSense fills — CLS = 0 */
}

@media (max-width: 767px) {
  .ad-section-divider { display: none; }
}
```

**CSS to remove from `dashboard.component.scss`:**
- `.sidebar-nav` and all related sidebar rules
- `.dashboard-layout` two-column rule (was `grid: sidebar + content`; now single column)
- `.dashboard-banner-ad-wrapper` rule
- Any rule referencing `sidebar-skyscraper` placement

### environment.ts Slot Map Changes

```typescript
// REMOVE:
adSlots: {
  'sidebar-skyscraper': '',
  'dashboard-banner': '',
  ...
}

// ADD:
adSlots: {
  'dashboard-summary-banner': '',   // dev: shows placeholder; prod: real slot ID
  'dashboard-widgets-banner': '',   // dev: shows placeholder; prod: real slot ID
  ...
}
```

### Architectural Risks

1. **CLS guarantee — `min-height: 90px` must be set before AdSense injects:** The `min-height` must be in the initial CSS (not injected by JavaScript), so the browser reserves 90 px during the layout phase. Verify in Lighthouse CLS audit; if AdSense resizes the container after load, CLS > 0.
2. **`aria-hidden="true"` on the outer `<div>` vs `role="complementary"` on inner `<app-ad-placeholder>`:** The outer div has `aria-hidden="true"` to hide the entire ad block from screen readers. The inner `<app-ad-placeholder>` has `role="complementary"`. This creates a role inside an `aria-hidden` subtree, which is valid but unusual. If `AdPlaceholderComponent` renders a native `<aside>` element (which implicitly has `role="complementary"`), the outer `aria-hidden` will hide the aside from the accessibility tree. Verify the final rendered HTML with an accessibility audit tool.
3. **Story 020 depends on Stories 017–019 being merged first:** The template references `<app-granularity-bar>`, `<app-overall-summary-bar>`, `<app-analytical-widget>`, and `<app-transactions-panel>`. All four must be importable in `DashboardComponent.imports` before Story 020 changes compile.
4. **E2E test regression from Story 010:** Story 010's test file asserts `[data-placement="sidebar-skyscraper"]` is present on the Dashboard. Removing the element breaks that test. The PO confirmed Story 010 is superseded. Before Story 020 is merged, the Story 010 E2E test must be updated or removed. Gate Story 020 on QA sign-off for the test update.
5. **`DashboardComponent` layout class change:** The v1 template uses `.dashboard-layout` as a two-column CSS grid (`sidebar + main`). After removing the sidebar, `.dashboard-layout` becomes a single-column container. Update its CSS rule (or remove it and use a simpler wrapper) to prevent residual grid rules from causing layout gaps.

### Cross-Story Integration Points

- **Story 017:** `<app-granularity-bar>` and `<app-overall-summary-bar>` must be added to `DashboardComponent.imports[]` and the template in this story's PR.
- **Story 018:** `<app-analytical-widget>` must be in `DashboardComponent.imports[]`; the `.widgets-grid` div is rendered here for the first time.
- **Story 019:** `<app-transactions-panel>` must be in `DashboardComponent.imports[]`; Story 007's "Recent Transactions" section must be removed at the same time.
- This story owns the **final template assembly** and the removal of all v1 ad containers. It is the integration story for the full v2.0 Dashboard layout.

---

## Architect Review Comments

### AC-020-01 — Removal of Story 007 "Recent Transactions" is not mentioned in the story scope
The story's Technical Notes list elements to remove from `DashboardComponent`, but omit the "Recent Transactions" table and "View All Transactions" link from Story 007. Story 019's PO clarification confirms these must be removed when the Transactions Panel is added. Story 020 owns the final template — add these to the removal checklist.

### AC-020-02 — `tabindex="-1"` on `<app-ad-placeholder>` host vs outer `<div>`
The acceptance criteria require `tabindex="-1"` on the ad placeholder container. The story's code snippet puts `tabindex="-1"` on `<app-ad-placeholder>`. Whether this attribute is applied to the component's host element or the outer `<div>` depends on `AdPlaceholderComponent`'s implementation. Verify that the component propagates or declares `tabindex` correctly (e.g., via `@HostBinding('attr.tabindex')`). If not, move `tabindex="-1"` to the outer `<div>`.

### AC-020-03 — `.ad-section-divider` class must not conflict with Story 011 sticky footer
The mobile sticky footer from Story 011 may share `.ad-section-divider` class or similar naming. Confirm there is no CSS selector collision — the `@media (max-width: 767px) { display: none; }` rule on `.ad-section-divider` must not hide the sticky footer. Use a specific BEM class like `.dashboard-ad-divider` if there is any risk of class collision.

### AC-020-04 — `DashboardComponent.imports[]` must be updated for all four new components
The story does not explicitly call out updating the `imports` array in `DashboardComponent`. Each new standalone component (`GranularityBarComponent`, `OverallSummaryBarComponent`, `AnalyticalWidgetComponent`, `TransactionsPanelComponent`) must be added. Missing any one will cause a compile error when the template references its selector.

### AC-020-05 — No acceptance criterion for `data-testid="dashboard-empty-state"` in v2
Story 017 defines `[data-testid="dashboard-empty-state"]` for when the selected period has zero transactions. Story 020 restructures the template. Ensure the empty-state element is preserved in the v2 template — it should appear above or in place of `<app-overall-summary-bar>` when `overallSummary` has all-zero values. Coordinate with Story 017 implementation to clarify where the empty state renders in the new layout.

### AC-020-06 — `environment.ts` key removal is a breaking change for `AdPlaceholderComponent`
Removing `'sidebar-skyscraper'` and `'dashboard-banner'` from the slot map means `AdPlaceholderComponent` will receive an undefined slot ID for those placements. If the component has a fallback path for unknown slots (e.g., renders the dev placeholder), this is safe. If it throws, any remaining test that renders the dashboard against the old environment will break. Confirm the component gracefully handles unknown placement keys.
