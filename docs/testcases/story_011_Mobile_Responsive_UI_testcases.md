# Test Cases: Mobile Responsive UI

**Story Reference:** [story_011_Mobile_Responsive_UI.md](../stories/story_011_Mobile_Responsive_UI.md)  
**Date:** 2026-03-01  
**Author:** QA Tester  
**Total Test Cases:** 11

> **Technical Notes:**
> - `sessionStorage` bleeds between tests — add `beforeEach(() => sessionStorage.clear())` in all unit/component test files that cover TC-011-07 and TC-011-08.
> - Dismiss counter increments on Angular `Router` `NavigationEnd` events.
> - Sticky footer ad is positioned `fixed` at bottom; `AppComponent` wrapper has `padding-bottom: 50px` when ad is visible.
> - CSS breakpoints: `mobile: <768px`, `tablet: 768–1023px`, `desktop: ≥1024px`.
> - Tap target tests apply only to **new Sprint 2 components** (BottomNavComponent, transaction cards, sticky ad close button).

---

## Unit Tests

---

### TC-011-06: sticky-ad-close button dismisses the ad

**Type:** Unit  
**Priority:** High  
**Preconditions:** `AppComponent` instantiated in `TestBed` with mobile breakpoint stub; sticky footer ad is visible. `beforeEach(() => sessionStorage.clear())` is in place.

**Steps:**
1. Instantiate `AppComponent` in `TestBed` with `BreakpointObserver` stubbed to emit mobile (< 768px).
2. Call `fixture.detectChanges()`.
3. Assert `[data-testid="ad-placeholder"][data-placement="mobile-sticky-footer"]` is visible.
4. Click `[data-testid="sticky-ad-close"]`.
5. Call `fixture.detectChanges()`.
6. Assert the sticky footer ad is no longer visible.

**Expected Result:** After clicking `[data-testid="sticky-ad-close"]`, the sticky footer ad is removed from the DOM (or has `display: none`). The dismiss counter in `sessionStorage` is set to `0` (awaiting 3 navigations).

**data-testid(s):** `ad-placeholder` (with `data-placement="mobile-sticky-footer"`), `sticky-ad-close`

---

### TC-011-07: Dismissed ad reappears after 3 Router navigations (sessionStorage counter)

**Type:** Unit  
**Priority:** High  
**Preconditions:** `AppComponent` instantiated in `TestBed`; `Router` is mocked. `beforeEach(() => sessionStorage.clear())` is in place.

**Steps:**
1. Instantiate `AppComponent` in `TestBed` with mobile breakpoint and `Router` mock.
2. Call `fixture.detectChanges()`.
3. Dismiss the sticky ad via `[data-testid="sticky-ad-close"]`.
4. Simulate 1 `NavigationEnd` event from the `Router` mock; call `fixture.detectChanges()`.
5. Assert ad is still hidden.
6. Simulate 2nd `NavigationEnd`; call `fixture.detectChanges()`.
7. Assert ad is still hidden.
8. Simulate 3rd `NavigationEnd`; call `fixture.detectChanges()`.
9. Assert `[data-testid="ad-placeholder"][data-placement="mobile-sticky-footer"]` is visible again.
10. Assert `sessionStorage` counter has been reset to `0`.

**Expected Result:** The sticky footer ad reappears after exactly 3 `NavigationEnd` events following dismissal. On re-show, the session counter resets to `0`. The ad does not reappear on the 1st or 2nd navigation.

**data-testid(s):** `ad-placeholder` (with `data-placement="mobile-sticky-footer"`), `sticky-ad-close`

---

### TC-011-08: Dismiss counter resets on hard refresh (sessionStorage)

**Type:** Unit  
**Priority:** Medium  
**Preconditions:** Unit test simulates session reset by calling `sessionStorage.clear()` before component instantiation.

**Steps:**
1. Manually set `sessionStorage.setItem('stickyAdDismissCount', '2')` to simulate a previous session state.
2. Call `sessionStorage.clear()` to simulate a hard refresh / new session.
3. Instantiate `AppComponent` in `TestBed` with mobile breakpoint.
4. Call `fixture.detectChanges()`.
5. Assert the sticky footer ad is visible (counter starts at 0, not 2).

**Expected Result:** After `sessionStorage.clear()`, the dismiss counter starts at `0`. The sticky footer ad is visible because no active dismiss is in effect.

**data-testid(s):** `ad-placeholder` (with `data-placement="mobile-sticky-footer"`)

---

### TC-011-10: Tap targets on bottom-nav items are ≥ 44px tall

**Type:** Unit  
**Priority:** High  
**Preconditions:** `BottomNavComponent` instantiated in `TestBed`.

**Steps:**
1. Instantiate `BottomNavComponent` in `TestBed`.
2. Call `fixture.detectChanges()`.
3. Query all anchor/button elements inside `[data-testid="bottom-nav"]`.
4. For each element, read the computed `height` from the host element's style or CSS class binding.

**Expected Result:** Each nav tab inside `[data-testid="bottom-nav"]` has a computed `height` of at least `44px`, satisfying WCAG 2.1 AA tap target requirements.

**data-testid(s):** `bottom-nav`

---

## Component Tests

---

### TC-011-01: At ≤767px, bottom-nav is visible with 4 tabs

**Type:** Component  
**Priority:** High  
**Preconditions:** `AppComponent` (or shell component containing `BottomNavComponent`) is rendered in `TestBed` with `BreakpointObserver` stubbed to match `(max-width: 767px)`. `beforeEach(() => sessionStorage.clear())` is in place.

**Steps:**
1. Render the shell component with mobile breakpoint stub.
2. Call `fixture.detectChanges()`.
3. Query `[data-testid="bottom-nav"]` — assert it is visible.
4. Query `[data-testid="sidebar-nav"]` — assert it is hidden or absent.
5. Query all tab elements inside `bottom-nav` and read their labels.

**Expected Result:** `[data-testid="bottom-nav"]` is visible. It contains exactly 4 navigation tabs with labels: `Dashboard`, `Transactions`, `Import`, `Settings` (in any order). `[data-testid="sidebar-nav"]` is not visible.

**data-testid(s):** `bottom-nav`, `sidebar-nav`

---

### TC-011-02: At ≥1024px, sidebar-nav is visible; bottom-nav is hidden

**Type:** Component  
**Priority:** High  
**Preconditions:** Shell component rendered with `BreakpointObserver` stubbed to match `(min-width: 1024px)`. `beforeEach(() => sessionStorage.clear())` is in place.

**Steps:**
1. Render shell component with desktop breakpoint stub.
2. Call `fixture.detectChanges()`.
3. Query `[data-testid="sidebar-nav"]` — assert it is visible.
4. Query `[data-testid="bottom-nav"]` — assert it is hidden or absent.

**Expected Result:** `[data-testid="sidebar-nav"]` is visible. `[data-testid="bottom-nav"]` has `display: none` or is removed from the DOM.

**data-testid(s):** `sidebar-nav`, `bottom-nav`

---

### TC-011-03: At mobile, dashboard widgets stack in single column

**Type:** Component  
**Priority:** High  
**Preconditions:** `DashboardComponent` rendered with `BreakpointObserver` stubbed to mobile (< 768px).

**Steps:**
1. Render `DashboardComponent` in `TestBed` with mobile breakpoint stub.
2. Call `fixture.detectChanges()`.
3. Read the CSS layout class or flex/grid direction of the dashboard widgets container.

**Expected Result:** At mobile, the dashboard widgets container applies a single-column stacking layout (e.g., `flex-direction: column` or `grid-template-columns: 1fr`). No side-by-side widget grid is applied.

**data-testid(s):** `income-widget`, `expense-widget`, `total-flow-widget`, `income-expense-chart`, `category-breakdown-chart`

---

### TC-011-04: At mobile, transaction-card renders instead of transaction-row

**Type:** Component  
**Priority:** High  
**Preconditions:** `TransactionsListComponent` rendered with `BreakpointObserver` stubbed to mobile (< 768px); `IndexedDbService` stub returns 3 transactions.

**Steps:**
1. Render `TransactionsListComponent` at mobile breakpoint.
2. Call `fixture.detectChanges()`.
3. Query `[data-testid="transaction-card"]` elements — expect 3.
4. Query `[data-testid="transaction-row"]` elements — expect 0.
5. Verify each card contains: Narration, Amount, Date, Category.

**Expected Result:** 3 `[data-testid="transaction-card"]` elements are rendered. No `[data-testid="transaction-row"]` elements are present. Each card displays all 4 required fields.

**data-testid(s):** `transaction-card`, `transaction-row`

---

### TC-011-05: Sticky footer ad (320×50) visible at mobile only

**Type:** Component  
**Priority:** High  
**Preconditions:** `AppComponent` rendered. Test runs in two configurations: mobile and desktop breakpoints. `beforeEach(() => sessionStorage.clear())` is in place.

**Steps:**
1. Render `AppComponent` with `BreakpointObserver` stubbed to mobile (< 768px).
2. Call `fixture.detectChanges()`.
3. Assert `[data-testid="ad-placeholder"][data-placement="mobile-sticky-footer"]` is visible.
4. Re-render (or update breakpoint stub) with desktop breakpoint (≥ 1024px).
5. Call `fixture.detectChanges()`.
6. Assert `[data-placement="mobile-sticky-footer"]` is hidden or absent.

**Expected Result:** At mobile breakpoint: sticky footer ad is visible with computed dimensions `320×50`. At desktop breakpoint: sticky footer ad is hidden (`display: none` or removed from DOM).

**data-testid(s):** `ad-placeholder` (with `data-placement="mobile-sticky-footer"`)

---

### TC-011-11: At tablet (768–1023px), sidebar-nav is visible; bottom-nav is hidden

**Type:** Component  
**Priority:** High  
**Preconditions:** Shell component rendered with `BreakpointObserver` stubbed to match `768px ≤ width < 1024px`. `beforeEach(() => sessionStorage.clear())` is in place.

**Steps:**
1. Render shell component with tablet breakpoint stub (e.g., `matches: true` for `(min-width: 768px) and (max-width: 1023px)`).
2. Call `fixture.detectChanges()`.
3. Query `[data-testid="sidebar-nav"]` — assert visible.
4. Query `[data-testid="bottom-nav"]` — assert hidden or absent.

**Expected Result:** At tablet viewport, `[data-testid="sidebar-nav"]` is visible (may be collapsed to icon-only or behind a hamburger — implementation-dependent). `[data-testid="bottom-nav"]` is not visible.

**data-testid(s):** `sidebar-nav`, `bottom-nav`

---

## E2E Tests

---

### TC-011-09: /settings stub route loads with "Coming Soon" placeholder

**Type:** E2E  
**Priority:** Medium  
**Preconditions:** App is running; `/settings` route is configured pointing to `SettingsComponent` stub.

**Steps:**
1. Navigate browser to `/settings`.
2. Wait for page to load.
3. Assert `[data-testid="settings-placeholder"]` (or equivalent) is present in the DOM with text containing `"Coming Soon"`.

**Expected Result:** `/settings` route renders without error. The page displays a `"Settings — Coming Soon"` or equivalent placeholder text. No 404 or router error is thrown. The sidebar or bottom nav link for Settings navigates here successfully.

**data-testid(s):** `settings-placeholder`

---

## Summary Table

| TC | Description | Type | Priority |
|----|-------------|------|----------|
| TC-011-01 | At ≤767px, bottom-nav is visible with 4 tabs | Component | High |
| TC-011-02 | At ≥1024px, sidebar-nav is visible; bottom-nav is hidden | Component | High |
| TC-011-03 | At mobile, dashboard widgets stack in single column | Component | High |
| TC-011-04 | At mobile, transaction-card renders instead of transaction-row | Component | High |
| TC-011-05 | Sticky footer ad (320×50) visible at mobile only | Component | High |
| TC-011-06 | sticky-ad-close button dismisses the ad | Unit | High |
| TC-011-07 | Dismissed ad reappears after 3 Router navigations (sessionStorage counter) | Unit | High |
| TC-011-08 | Dismiss counter resets on hard refresh (sessionStorage) | Unit | Medium |
| TC-011-09 | /settings stub route loads with "Coming Soon" placeholder | E2E | Medium |
| TC-011-10 | Tap targets on bottom-nav items are ≥ 44px tall | Unit | High |
| TC-011-11 | At tablet (768–1023px), sidebar-nav is visible; bottom-nav is hidden | Component | High |
