## Test Cases for Story 022: Dashboard Responsive Layout Redesign

**Story Reference:** [story_022_Dashboard_Responsive_Layout_Redesign.md](../stories/story_022_Dashboard_Responsive_Layout_Redesign.md)  
**Date:** 2026-04-13  
**Author:** QA Automation Engineer

---

### TC-022-01: Bootstrap 5.3 is installed and applied globally

**Objective:** Verify Bootstrap 5.3 CSS is installed via npm and applied to the application.

#### Steps
1. Open a terminal in the project root.
2. Run `npm list bootstrap` in `src/client`.
3. Load the application in a browser.
4. Open DevTools → Sources and search for `bootstrap`.
5. Inspect a `.container-fluid` element in the DevTools Elements panel.

#### Expected Result
- `npm list bootstrap` shows `bootstrap@5.3.x` (no `bootstrap@4.x` or lower).
- Bootstrap CSS classes (e.g. `row`, `col-`, `navbar`) compute to Bootstrap 5 grid values.
- `.container-fluid` receives `padding-right` and `padding-left` values from Bootstrap 5 (≥ 12 px by default).

---

### TC-022-02: Material Icons font loads correctly

**Objective:** Verify the Material Icons icon font is loaded and renders icons without broken placeholders.

#### Steps
1. Navigate to the dashboard at `/dashboard`.
2. Inspect any `<span class="material-icons">trending_up</span>` element in DevTools.
3. Check that the element renders a graphical icon (not the raw string "trending_up").
4. Open DevTools → Network → filter by "Font" and reload the page.

#### Expected Result
- The Material Icons font file (`MaterialIcons-Regular.woff2` or equivalent) loads with HTTP 200 or from cache.
- `<span class="material-icons">trending_up</span>` renders the upward-trend arrow icon.
- No icons render as empty boxes or raw text strings.

---

### TC-022-03: Blue app header renders on desktop (≥ 992 px)

**Objective:** Verify the blue Bootstrap navbar header is present and correctly structured on a desktop viewport.

#### Steps
1. Set browser viewport to 1280 × 800 px.
2. Navigate to `/dashboard`.
3. Inspect `[data-testid="app-header"]` in DevTools.
4. Verify computed background colour.
5. Verify visibility and text content of each nav link.

#### Expected Result
- `[data-testid="app-header"]` exists with tag `<nav>` and `aria-label="Main navigation"`.
- The element has Bootstrap class `navbar-expand-lg bg-primary` (or equivalent inline colour `#1565C0`).
- `[data-testid="header-app-title"]` displays "MoneyInsight" with white text (`color: #ffffff` or `rgb(255, 255, 255)`).
- `[data-testid="header-nav-dashboard"]`, `header-nav-transactions`, `header-nav-import`, `header-nav-settings` are all visible (computed `display` ≠ `none`).
- `[data-testid="header-hamburger-btn"]` has computed `display: none`.

---

### TC-022-04: Active route nav link highlighted

**Objective:** Verify the nav link for the current route receives the `active` CSS class.

#### Steps
1. Navigate to `/dashboard`.
2. Inspect `[data-testid="header-nav-dashboard"]`.
3. Navigate to `/transactions`.
4. Inspect `[data-testid="header-nav-transactions"]`.

#### Expected Result
- On `/dashboard`: `header-nav-dashboard` has CSS class `active`. `header-nav-transactions` does NOT have class `active`.
- On `/transactions`: `header-nav-transactions` has class `active`. `header-nav-dashboard` does NOT have class `active`.

---

### TC-022-05: Google Drive "Connected" status chip

**Objective:** Verify the Drive status chip shows "Connected" with the correct icon when authenticated and synced.

#### Steps
1. Log in with a Google account that has Drive connected.
2. Navigate to `/dashboard` on a 1280 × 800 px viewport.
3. Inspect `[data-testid="header-drive-status"]` in the inline user info area.

#### Expected Result
- `[data-testid="header-drive-status"]` is visible in the topbar.
- It contains a `check_circle` Material Icon.
- It displays the text "Connected" in green.

---

### TC-022-06: Google Drive "Offline" status chip (disconnected state)

**Objective:** Verify the Drive status chip shows "Offline" with the correct icon when not connected.

#### Steps
1. Simulate a disconnected Drive state (e.g. revoke Google OAuth token or mock the auth service).
2. Navigate to `/dashboard` on a 1280 × 800 px viewport.
3. Inspect `[data-testid="header-drive-status"]`.

#### Expected Result
- `[data-testid="header-drive-status"]` displays a `cloud_off` Material Icon.
- Text reads "Offline" in red.

---

### TC-022-07: Hamburger button visible on mobile (< 992 px)

**Objective:** Verify the hamburger button appears and nav links are hidden in the topbar at mobile widths.

#### Steps
1. Set browser viewport to 375 × 812 px.
2. Navigate to `/dashboard`.
3. Inspect `[data-testid="header-hamburger-btn"]`.
4. Inspect `[data-testid="header-nav-dashboard"]`.

#### Expected Result
- `[data-testid="header-hamburger-btn"]` has computed `display` ≠ `none`; it is tappable.
- `[data-testid="header-hamburger-btn"]` has `aria-expanded="false"` initially.
- `[data-testid="header-nav-dashboard"]` is NOT visible in the topbar (inside the collapsed mobile menu, with effective `display: none`).

---

### TC-022-08: Hamburger menu opens and closes on tap

**Objective:** Verify the mobile menu dropdown opens on hamburger tap and closes on second tap or close icon.

#### Steps
1. Set viewport to 375 × 812 px. Navigate to `/dashboard`.
2. Tap `[data-testid="header-hamburger-btn"]`.
3. Verify `[data-testid="header-mobile-menu"]` is visible.
4. Tap the hamburger button again (or the close icon if present).
5. Verify `[data-testid="header-mobile-menu"]` is collapsed.

#### Expected Result
- After step 2: `[data-testid="header-mobile-menu"]` is visible; `aria-expanded="true"` on the hamburger button; menu contains links for Dashboard, Transactions, Import, Settings.
- After step 4: `[data-testid="header-mobile-menu"]` is collapsed (hidden); `aria-expanded="false"`.

---

### TC-022-09: Mobile menu contains user info and sign-out

**Objective:** Verify the mobile menu collapse includes user name, Drive status, and sign-out button.

#### Steps
1. Set viewport to 375 × 812 px. Navigate to `/dashboard`. Log in.
2. Tap `[data-testid="header-hamburger-btn"]` to open the menu.
3. Scroll within `[data-testid="header-mobile-menu"]` to find user info.

#### Expected Result
- `[data-testid="header-user-info"]` is present inside `header-mobile-menu`.
- `[data-testid="header-drive-status"]` is present inside `header-mobile-menu`.
- `[data-testid="header-sign-out-btn"]` is present inside `header-mobile-menu`.
- A visual `<hr>` divider separates nav links from user info.

---

### TC-022-10: No sidebar in the DOM on authenticated routes

**Objective:** Verify the v1.0 sidebar is completely removed from the DOM.

#### Steps
1. Navigate to `/dashboard`.
2. Run `document.querySelector('[class*="sidebar"]')` in the browser console.
3. Run `document.querySelector('[data-testid="sidebar-skyscraper"]')` in the console.
4. Navigate to `/transactions` and repeat.

#### Expected Result
- Both queries return `null` on `/dashboard` and `/transactions`.
- No element with a class containing "sidebar" exists in the DOM.

---

### TC-022-11: v1.0 ad slots removed from DOM

**Objective:** Verify `dashboard-banner` (v1.0) and `sidebar-skyscraper` ad placements no longer exist.

#### Steps
1. Navigate to `/dashboard`.
2. Query `document.querySelector('[data-placement="dashboard-banner"]')`.
3. Query `document.querySelector('[data-placement="sidebar-skyscraper"]')`.

#### Expected Result
- Both queries return `null`. No retired v1.0 ad containers are present.

---

### TC-022-12: Dashboard container is a Bootstrap container-fluid

**Objective:** Verify the dashboard body uses the Bootstrap container-fluid wrapper.

#### Steps
1. Navigate to `/dashboard`.
2. Inspect `[data-testid="dashboard-container"]`.

#### Expected Result
- `[data-testid="dashboard-container"]` exists as a `<div>` with class `container-fluid`.
- All four dashboard sections (granularity bar, summary bar, widgets grid, transactions panel) are descendants of this container.

---

### TC-022-13: Widgets grid uses col-12 col-sm-6 col-xl-3 at xl breakpoint (≥ 1200 px)

**Objective:** Verify four widgets render in a single 4-column row at xl viewport.

#### Steps
1. Set viewport to 1440 × 900 px. Navigate to `/dashboard`.
2. Query `document.querySelectorAll('[data-testid="widgets-grid"] > .col-12.col-sm-6.col-xl-3')`.
3. Measure the computed width of each column element.

#### Expected Result
- Query returns exactly 4 elements.
- Each column has computed width of approximately 25% of the container (within ±2 px rounding).
- All four widget columns are on the same visual row (no row break between them).

---

### TC-022-14: Widgets grid stacks in 2-column layout at sm breakpoint (576–991 px)

**Objective:** Verify widgets render 2-per-row at tablet widths.

#### Steps
1. Set viewport to 768 × 1024 px. Navigate to `/dashboard`.
2. Measure computed widths of the four `.col-12.col-sm-6.col-xl-3` elements.

#### Expected Result
- Each element has computed width of approximately 50% of the container.
- Widgets 1 and 2 are on row 1; Widgets 3 and 4 are on row 2.

---

### TC-022-15: Widgets stack single-column at xs breakpoint (< 576 px)

**Objective:** Verify widgets render full-width stacked on a 375 px mobile screen.

#### Steps
1. Set viewport to 375 × 812 px. Navigate to `/dashboard`.
2. Measure computed widths of the four `.col-12.col-sm-6.col-xl-3` elements.

#### Expected Result
- Each element has computed width of approximately 100% of the container (≥ 360 px at 375 px viewport).
- All four widget columns are stacked vertically (each on its own row).

---

### TC-022-16: Fixed topbar does not overlap main content

**Objective:** Verify that `fixed-top` navbar is offset by correct padding so dashboard content is not hidden behind it.

#### Steps
1. Set viewport to 1280 × 800 px. Navigate to `/dashboard`.
2. Inspect the computed `padding-top` on the `<body>` or the main content wrapper element.
3. Measure the rendered height of `[data-testid="app-header"]`.

#### Expected Result
- The `padding-top` on `<body>` or the main content wrapper is ≥ the rendered height of the header (typically 56 px for Bootstrap`s default navbar height).
- The top of the Granularity Bar section is fully visible below the header with no overlap.

---

### TC-022-17: Keyboard accessibility — hamburger button

**Objective:** Verify the hamburger button is keyboard-operable.

#### Steps
1. Set viewport to 375 × 812 px. Navigate to `/dashboard`.
2. Tab to `[data-testid="header-hamburger-btn"]` using the keyboard.
3. Press `Enter` to activate.
4. Verify menu opens.
5. Press `Enter` again (or `Escape`).
6. Verify menu closes.

#### Expected Result
- Hamburger button receives focus outline when tabbed to.
- `Enter` key opens the mobile menu (`aria-expanded="true"`).
- Second `Enter` or `Escape` closes the menu (`aria-expanded="false"`).
- Focus returns to the hamburger button after close.

---

### TC-022-18: Regression — Stories 017–021 data-testid attributes intact

**Objective:** Verify no existing test IDs from prior stories were removed or renamed.

#### Steps
1. Navigate to `/dashboard`.
2. Query each of the following `data-testid` selectors and verify they return a DOM element:
   - `granularity-select`, `period-start`, `period-end`, `apply-period-btn`
   - `overall-income`, `overall-expense`, `overall-investment`, `overall-transfer`, `account-source-filter`
   - `widget-auto-toggle` (4 instances)
   - `widget-row-category`, `widget-row-subcategory`
   - `transactions-panel-title`, `transactions-record-count`, `transactions-table`
   - `ad-placeholder` with `data-placement="dashboard-summary-banner"` (when ads enabled)
   - `ad-placeholder` with `data-placement="dashboard-widgets-banner"` (when ads enabled)
   - `show-ads-toggle` on `/settings`

#### Expected Result
- All listed `data-testid` selectors return at least one matching DOM element.
- No console errors during navigation.
