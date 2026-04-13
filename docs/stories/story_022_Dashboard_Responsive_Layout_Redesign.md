## Story: Dashboard Responsive Layout Redesign

**Status:** ✅ Done — Implementation complete, E2E tests written (2026-04-14)

**As a** user on any device (mobile, tablet, or desktop)  
**I want** the MoneyInsight dashboard to use a responsive Bootstrap 5.3 header + full-width layout instead of the current sidebar layout  
**So that** I can comfortably use the app on my phone or any screen size without layout breakage or hidden navigation

---

### Background

The v1.0 Dashboard uses a fixed left sidebar for navigation and ad placement. The v2.0 specification (see `fsd_2.0.md` §4.1 and `ux_design_2.0.md` — *Global: App Header*) replaces the sidebar with:

- A full-width blue Bootstrap navbar pinned to the top of the viewport
- Inline navigation links on desktop (≥ 992 px)
- A hamburger dropdown on mobile (< 992 px) that reveals nav links + user info
- A Bootstrap 5.3 responsive container governing all dashboard content
- Material Icons replacing any icon font previously used

This story covers the **shell / structural changes only**: the header, removal of the sidebar, Bootstrap integration, and global responsive grid wrapper. Component-level content (granularity bar, summary bar, widgets, transactions panel) is governed by Stories 017–019. This story must not break any test assertions from Stories 017–021.

---

### Scenarios

- **Desktop navigation (≥ 992 px):** User loads the dashboard on a 1440 px wide screen and sees a blue topbar with "MoneyInsight" branding on the left, four inline nav links in the centre/right, and user account info with Google Drive status on the far right. No sidebar is present.
- **Mobile navigation (< 992 px):** User loads on a 390 px phone. The topbar shows only the app title and a hamburger icon. Tapping the hamburger opens a full-width dropdown below the header listing Dashboard, Transactions, Import, Settings, then a divider, user name, Drive status chip, and a Sign Out button.
- **Mobile hamburger dismiss:** User taps hamburger again (or the close icon) and the dropdown collapses.
- **Active nav link highlight:** The link corresponding to the current route (e.g. `/dashboard`) is visually differentiated (underline or increased opacity) from inactive links.
- **Google Drive status chip:** When connected, a green chip "Connected" appears next to the user name. When offline or not authenticated, a red chip "Offline" appears.
- **Responsive grid — xl breakpoint (≥ 1200 px):** Dashboard body content uses a Bootstrap container-fluid with the four widgets in `col-xl-3` columns (4-column row).
- **Responsive grid — sm/md breakpoints (576–991 px):** Widgets display in `col-sm-6` columns (2-column row, 2 rows of 2).
- **Responsive grid — xs breakpoint (< 576 px):** All sections and widgets stack in a single full-width column.
- **No sidebar regression:** The `sidebar-skyscraper` ad slot is absent from the DOM; no `[data-testid="sidebar-skyscraper"]` element exists. Story 010's E2E tests that previously asserted this element must be updated to assert its absence.

---

### Acceptance Criteria

1. **Bootstrap 5.3 installed:** `bootstrap` (≥ 5.3.0) is listed in `package.json` dependencies. Bootstrap CSS is imported globally in `angular.json` styles or `styles.scss`. No conflicting Bootstrap 4 or lower versions remain.

2. **Material Icons integrated:** `material-icons` font is loaded globally (via `styles.scss` `@import` or `angular.json` assets). The `<span class="material-icons">` pattern renders icons correctly. No broken icon placeholders appear on first paint.

3. **App header component (`AppHeaderComponent`) created** at `src/client/src/app/shared/components/app-header/app-header.component.ts` with:
   - `data-testid="app-header"` on the root `<nav>` element
   - Bootstrap classes `navbar navbar-expand-lg bg-primary` (blue header)
   - App title/logo: `data-testid="header-app-title"` renders "MoneyInsight" in white bold text
   - Desktop nav links: `data-testid="header-nav-dashboard"`, `data-testid="header-nav-transactions"`, `data-testid="header-nav-import"`, `data-testid="header-nav-settings"` — visible at ≥ 992 px, hidden below
   - Hamburger button: `data-testid="header-hamburger-btn"` with `aria-expanded` attribute toggling `true`/`false`; visible only at < 992 px
   - Mobile dropdown: `data-testid="header-mobile-menu"` — a Bootstrap collapse panel containing all four nav links, a `<hr>` divider, user name, Drive status, and Sign Out button
   - User info block: `data-testid="header-user-info"` visible inline on desktop; inside `header-mobile-menu` on mobile
   - Drive status chip: `data-testid="header-drive-status"` renders "Connected" (green) or "Offline" (red) text string with appropriate Material Icon (`check_circle` or `cloud_off`)
   - Sign-out button: `data-testid="header-sign-out-btn"`

4. **Sidebar removed:** The `SidebarComponent` (or equivalent v1.0 side-nav element) is no longer rendered anywhere in the `AppComponent` or `DashboardComponent` templates. No `[class*="sidebar"]` wrapper element appears in the DOM for authenticated routes.

5. **Old dashboard-banner ad slot removed:** The v1.0 `data-placement="dashboard-banner"` and `data-placement="sidebar-skyscraper"` `AdPlaceholderComponent` instances are deleted from all templates.

6. **Bootstrap responsive container:** The main content area of `DashboardComponent` is wrapped in `<div class="container-fluid px-3" data-testid="dashboard-container">`. All four dashboard sections (granularity bar, summary bar, widgets grid, transactions panel) are children of this container.

7. **Widgets grid bootstrap classes:** The widgets row in `DashboardComponent` has the class string `row g-3` with each widget column using `col-12 col-sm-6 col-xl-3`. Verified by querying the DOM — `[data-testid="widgets-grid"] > .col-12.col-sm-6.col-xl-3` returns exactly 4 elements.

8. **Responsive breakpoint — xs (< 576 px):** At a simulated viewport of 375 × 812 px:
   - `[data-testid="app-header"]` is present and full-width
   - `[data-testid="header-hamburger-btn"]` is visible (`display` ≠ `none`)
   - `[data-testid="header-nav-dashboard"]` is NOT visible in the top bar (hidden, inside the collapsed mobile menu)
   - Each `.col-12.col-sm-6.col-xl-3` widget column renders at full viewport width (≈ 100%)

9. **Responsive breakpoint — sm (576–991 px):** At a simulated viewport of 768 × 1024 px:
   - `[data-testid="header-hamburger-btn"]` is visible
   - Each widget column renders at ≈ 50% width (two per row)

10. **Responsive breakpoint — lg/xl (≥ 992 px):** At a simulated viewport of 1280 × 800 px:
    - `[data-testid="header-hamburger-btn"]` is hidden (`display: none`)
    - Nav links `header-nav-dashboard`, `header-nav-transactions`, `header-nav-import`, `header-nav-settings` are all visible in the topbar
    - `[data-testid="header-user-info"]` is visible inline in the topbar
    - Each widget column renders at ≈ 25% width (four per row)

11. **Active route link:** The nav link matching the current Angular Router URL has a CSS class `active` applied. E.g. when on `/dashboard`, `[data-testid="header-nav-dashboard"]` has class `active`.

12. **Hamburger toggle:** Clicking `[data-testid="header-hamburger-btn"]` toggles `aria-expanded` between `"true"` and `"false"` and shows/hides `[data-testid="header-mobile-menu"]`.

13. **No regression:** All tests passing in Stories 017, 018, 019, 020, 021 continue to pass after this story is implemented. No existing `data-testid` attributes are removed or renamed.

14. **Accessibility:**
    - `<nav data-testid="app-header">` has `aria-label="Main navigation"`
    - `[data-testid="header-hamburger-btn"]` has `aria-controls="header-mobile-menu"` and `aria-label="Toggle navigation"`
    - All nav link `<a>` elements have discernible text content (not icon-only)

---

### Technical Notes

- Import Bootstrap CSS in `src/client/src/styles.scss`:
  ```scss
  @import 'bootstrap/scss/bootstrap';
  @import 'https://fonts.googleapis.com/icon?family=Material+Icons';
  ```
  Or via `angular.json` `styles` array using the CSS dist file path.
- `AppHeaderComponent` is added to `AppComponent` template above `<router-outlet>`.
- Use Angular Router's `routerLinkActive="active"` directive on each nav `<a>` for active state.
- Bootstrap Collapse for the mobile menu: use `[ngClass]` or a boolean flag toggled on hamburger click with Bootstrap's `collapse` class pattern; or install `@ng-bootstrap/ng-bootstrap` for proper Bootstrap JS integration.
- The `DashboardStateService` signals (`activePeriodStart`, `activePeriodEnd`, etc.) introduced in Story 017 are not changed by this story.
- `SidebarComponent` file may be deleted once it is confirmed no other component imports it.
- Run `ng test` after implementation; all pre-existing Cypress/Jest tests must remain green.

---

### PO Clarifications

- **Q: Should Bootstrap JS (dropdown, collapse) be loaded via CDN or npm?**  
  A: Install `bootstrap` via npm. Use Angular CDK or `@ng-bootstrap/ng-bootstrap` for JS behaviour (collapse, dropdowns) — do NOT add a `<script>` CDN tag to `index.html`.

- **Q: Should the sidebar CSS be deleted immediately or kept as dead code?**  
  A: Delete it. Dead CSS adds build weight and confusion. Remove all `.sidebar`, `.sidebar-nav`, and `.sidebar-ad` CSS rules in the same PR.

- **Q: Is the header sticky/fixed?**  
  A: Yes — add Bootstrap `fixed-top` class to the `<nav>`. Add matching `padding-top` to the `<body>` or the main content wrapper to prevent content appearing behind the fixed bar.

- **Q: Which exact blue colour for the header?**  
  A: Bootstrap `bg-primary` is acceptable; if the project uses a custom Bootstrap theme variable, set `$primary: #1565C0` in `_variables.scss` before importing Bootstrap.

- **Q: Does the Sign Out button actually log out in this story?**  
  A: Wire it to the existing `AuthService.signOut()` method if it exists. If auth is not yet implemented, the button should exist in the DOM with `data-testid="header-sign-out-btn"` and log a `console.warn('Sign out not yet implemented')` — no crash.
