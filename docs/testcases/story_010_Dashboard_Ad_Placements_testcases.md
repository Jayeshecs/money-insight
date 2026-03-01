# Test Cases: Dashboard Ad Placements

**Story Reference:** [story_010_Dashboard_Ad_Placements.md](../stories/story_010_Dashboard_Ad_Placements.md)  
**Date:** 2026-03-01  
**Author:** QA Tester  
**Total Test Cases:** 8

> **Technical Notes:**
> - TC-010-06 (CLS = 0) is a **manual Lighthouse check** — not a CI gate for Sprint 2.
> - Reuses `AdPlaceholderComponent` from Sprint 1 (Story 006).
> - Slot IDs: `'sidebar-skyscraper'` and `'dashboard-banner'` registered in `environment.ts`.
> - Story 010 layout restructure (Dashboard sidebar) is a prerequisite for Story 007 — implement Story 010 first.

---

## Unit Tests

---

### TC-010-07: Both ads have role="complementary" and tabindex="-1"

**Type:** Unit  
**Priority:** Medium  
**Preconditions:** `DashboardComponent` instantiated in `TestBed` at desktop viewport; `AdPlaceholderComponent` is part of the component tree.

**Steps:**
1. Instantiate `DashboardComponent` in `TestBed`.
2. Call `fixture.detectChanges()`.
3. Query `[data-testid="ad-placeholder"][data-placement="sidebar-skyscraper"]`.
4. Assert `role` attribute equals `"complementary"`.
5. Assert `tabindex` attribute equals `"-1"`.
6. Query `[data-testid="ad-placeholder"][data-placement="dashboard-banner"]`.
7. Repeat role and tabindex assertions.

**Expected Result:** Both ad placeholder elements have `role="complementary"` and `tabindex="-1"`. No interactive focus is reachable within the ad containers via keyboard.

**data-testid(s):** `ad-placeholder` (with `data-placement="sidebar-skyscraper"`), `ad-placeholder` (with `data-placement="dashboard-banner"`)

---

### TC-010-08: Dev placeholder shown when AdSense SDK absent

**Type:** Unit  
**Priority:** Medium  
**Preconditions:** `DashboardComponent` instantiated in `TestBed`; environment slot IDs are empty strings (dev `environment.ts`); AdSense script is not loaded.

**Steps:**
1. Ensure `environment.ts` has `adSlots: { 'sidebar-skyscraper': '', 'dashboard-banner': '' }`.
2. Instantiate `DashboardComponent` in `TestBed`.
3. Call `fixture.detectChanges()`.
4. Query `[data-testid="ad-placeholder"]` elements.
5. Inspect inner content for a dev placeholder label (e.g., "Advertisement" or a placeholder image or a branded placeholder box).

**Expected Result:** Both `AdPlaceholderComponent` instances render a visible dev placeholder (e.g., a grey box with "Ad Placeholder" text). No real AdSense `<ins>` tag or SDK error is shown.

**data-testid(s):** `ad-placeholder`

---

## Component Tests

---

### TC-010-01: Sidebar skyscraper (160×600) visible at ≥ 1024px

**Type:** Component  
**Priority:** High  
**Preconditions:** `DashboardComponent` rendered in `TestBed`; `BreakpointObserver` stub returns a desktop breakpoint (width ≥ 1024px).

**Steps:**
1. Render `DashboardComponent` in `TestBed` with `BreakpointObserver` stubbed to emit `{ matches: true }` for `(min-width: 1024px)`.
2. Call `fixture.detectChanges()`.
3. Query `[data-testid="ad-placeholder"][data-placement="sidebar-skyscraper"]`.
4. Assert the element is in the DOM and not hidden.
5. Read `getBoundingClientRect()` (or CSS `width`/`height` bindings) — or read computed styles from the component's host element.

**Expected Result:** `[data-placement="sidebar-skyscraper"]` is visible (`display` is not `none`). Explicit CSS dimensions are `width: 160px` and `height: 600px`.

**data-testid(s):** `ad-placeholder` (with `data-placement="sidebar-skyscraper"`)

---

### TC-010-02: Sidebar skyscraper hidden at < 1024px

**Type:** Component  
**Priority:** High  
**Preconditions:** `DashboardComponent` rendered in `TestBed`; `BreakpointObserver` stub returns no match for `(min-width: 1024px)`.

**Steps:**
1. Render `DashboardComponent` in `TestBed` with `BreakpointObserver` stubbed to emit `{ matches: false }` for `(min-width: 1024px)`.
2. Call `fixture.detectChanges()`.
3. Query `[data-testid="ad-placeholder"][data-placement="sidebar-skyscraper"]`.
4. Assert the element is either absent from the DOM or has `display: none`.

**Expected Result:** The sidebar skyscraper ad is not visible at tablet/mobile breakpoints. `display: none` or `*ngIf` removes it from the DOM.

**data-testid(s):** `ad-placeholder` (with `data-placement="sidebar-skyscraper"`)

---

### TC-010-03: Dashboard banner (728×90) visible between charts and recent-transactions at ≥ 768px

**Type:** Component  
**Priority:** High  
**Preconditions:** `DashboardComponent` rendered with `BreakpointObserver` stub returning match for `(min-width: 768px)`.

**Steps:**
1. Render `DashboardComponent` in `TestBed` with desktop/tablet breakpoint stub.
2. Call `fixture.detectChanges()`.
3. Query `[data-testid="ad-placeholder"][data-placement="dashboard-banner"]`.
4. Assert the element is visible.
5. Assert it is positioned after `[data-testid="category-breakdown-chart"]` and before `[data-testid="recent-transactions-table"]` in DOM order.

**Expected Result:** `[data-placement="dashboard-banner"]` is visible. DOM order confirms it appears between the category breakdown chart section and the recent transactions widget. Explicit dimensions: `width: 728px`, `height: 90px`.

**data-testid(s):** `ad-placeholder` (with `data-placement="dashboard-banner"`), `category-breakdown-chart`, `recent-transactions-table`

---

### TC-010-04: Dashboard banner hidden at < 768px

**Type:** Component  
**Priority:** High  
**Preconditions:** `DashboardComponent` rendered with `BreakpointObserver` stub returning no match for `(min-width: 768px)`.

**Steps:**
1. Render `DashboardComponent` in `TestBed` with mobile breakpoint stub.
2. Call `fixture.detectChanges()`.
3. Query `[data-testid="ad-placeholder"][data-placement="dashboard-banner"]`.
4. Assert the element is absent or has `display: none`.

**Expected Result:** The dashboard banner ad is not visible on mobile (< 768px). No layout space is reserved for it at the mobile breakpoint.

**data-testid(s):** `ad-placeholder` (with `data-placement="dashboard-banner"`)

---

### TC-010-05: Ads do not overlap widget content (no z-index conflict)

**Type:** Component  
**Priority:** High  
**Preconditions:** `DashboardComponent` rendered at desktop breakpoint (≥ 1024px).

**Steps:**
1. Render `DashboardComponent` in `TestBed` at desktop breakpoint.
2. Call `fixture.detectChanges()`.
3. Read the computed `z-index` of `[data-placement="sidebar-skyscraper"]`.
4. Read the computed `z-index` of `[data-placement="dashboard-banner"]`.
5. Read the computed `z-index` of `[data-testid="total-flow-widget"]` and `[data-testid="income-expense-chart"]`.

**Expected Result:** Ad placeholder `z-index` values are lower than (or equal to) widget `z-index` values, ensuring no visual overlap. Widgets remain fully interactive above ad layers.

**data-testid(s):** `ad-placeholder`, `total-flow-widget`, `income-expense-chart`

---

## Manual Tests

---

### TC-010-06: Ad containers have explicit dimensions (no CLS)

**Type:** Manual  
**Priority:** High  
**Preconditions:** Production build deployed; Chrome DevTools Lighthouse available; Dashboard page loads with real (or stubbed) transactions.

**Steps:**
1. Open the deployed Dashboard page in Chrome (desktop viewport ≥ 1024px).
2. Open Chrome DevTools → Lighthouse tab.
3. Run a Lighthouse Performance audit.
4. Review the **Cumulative Layout Shift (CLS)** score and the Layout Shift details.
5. Inspect the CSS for `[data-placement="sidebar-skyscraper"]` and `[data-placement="dashboard-banner"]` — confirm explicit `width` and `height` are set before AdSense fills.

**Expected Result:** CLS score is `0.0` (or very close to 0). No layout shift events originate from the ad placeholder containers. Both ad containers have CSS `width`/`height` set to their respective dimensions (`160×600` and `728×90`) before the page renders.

**data-testid(s):** `ad-placeholder` (with `data-placement="sidebar-skyscraper"`), `ad-placeholder` (with `data-placement="dashboard-banner"`)

---

## Summary Table

| TC | Description | Type | Priority |
|----|-------------|------|----------|
| TC-010-01 | Sidebar skyscraper (160×600) visible at ≥ 1024px | Component | High |
| TC-010-02 | Sidebar skyscraper hidden at < 1024px (display:none) | Component | High |
| TC-010-03 | Dashboard banner (728×90) visible between charts and recent-transactions at ≥ 768px | Component | High |
| TC-010-04 | Dashboard banner hidden at < 768px | Component | High |
| TC-010-05 | Ads do not overlap widget content (no z-index conflict) | Component | High |
| TC-010-06 | Ad containers have explicit dimensions (no CLS) — **Manual Lighthouse** | Manual | High |
| TC-010-07 | Both ads have role="complementary" and tabindex="-1" | Unit | Medium |
| TC-010-08 | Dev placeholder shown when AdSense SDK absent | Unit | Medium |
