# Test Cases — Story 020: Dashboard v2.0 Ad Placement Updates

**Story Reference:** `docs/stories/story_020_Dashboard_v2_Ad_Placement_Updates.md`  
**Sprint:** Sprint 4  
**Status:** To Do  
**Author:** QA Tester Agent  
**Date:** 2026-04-13

---

## Scope

Covers all acceptance criteria for the **Dashboard v2.0 Ad Placement Updates**:
- `dashboard-summary-banner` slot present and positioned between Sections 2 and 3
- `dashboard-widgets-banner` slot present and positioned between Sections 3 and 4
- Both banners visible at ≥ 768 px; hidden at < 768 px
- Accessibility attributes (`role`, `tabindex`)
- Absence of retired v1 slots (`sidebar-skyscraper`, `dashboard-banner`)
- Regression: Story 010 skyscraper assertion superseded (intentional breaking change per PO)

Automation layer: Playwright E2E → `tests/e2e/tests/story_020_dashboard_v2_ad_placements.spec.ts`

> **Note:** Per PO clarification (2026-04-13), Story 010 is superseded by Story 020. The Story 010 E2E test
> (`story_010.spec.ts`) had no Playwright tests asserting `sidebar-skyscraper` presence (it was covered
> by Angular component/unit tests). Those unit tests must be updated to assert `sidebar-skyscraper` ABSENCE.
> TC-020-E06 covers the Playwright-level regression check.

---

## Shared Test Data

No transaction seeding is required for Story 020. Both ad placement banners load unconditionally on Dashboard
page load regardless of transactions in IndexedDB. All tests navigate to `/dashboard` without seeding.

---

## Positive Test Cases

---

## Test Case: TC-020-E01 — dashboard-summary-banner Present in DOM at ≥768px

**Objective:** Verify that `[data-testid="ad-placeholder"][data-placement="dashboard-summary-banner"]` is present in the Dashboard DOM when viewport ≥ 768 px.

### Steps
1. Set viewport to 1280×800.
2. Navigate to `/dashboard`.
3. Wait for `networkidle`.
4. Count elements matching `[data-testid="ad-placeholder"][data-placement="dashboard-summary-banner"]`.

### Test Data
- No seed required.

### Expected Result
- Exactly one element with `data-placement="dashboard-summary-banner"` exists in the DOM.

---

## Test Case: TC-020-E02 — dashboard-widgets-banner Present in DOM at ≥768px

**Objective:** Verify that `[data-testid="ad-placeholder"][data-placement="dashboard-widgets-banner"]` is present in the Dashboard DOM when viewport ≥ 768 px.

### Steps
1. Set viewport to 1280×800.
2. Navigate to `/dashboard`.
3. Wait for `networkidle`.
4. Count elements matching `[data-testid="ad-placeholder"][data-placement="dashboard-widgets-banner"]`.

### Test Data
- No seed required.

### Expected Result
- Exactly one element with `data-placement="dashboard-widgets-banner"` exists in the DOM.

---

## Test Case: TC-020-E03 — Both Banners Visible at ≥768px

**Objective:** Verify both banner containers are visible (not `display: none`) at a desktop viewport width.

### Steps
1. Set viewport to 1280×800.
2. Navigate to `/dashboard`.
3. Wait for `networkidle`.
4. Check `.isVisible()` for `[data-placement="dashboard-summary-banner"]`.
5. Check `.isVisible()` for `[data-placement="dashboard-widgets-banner"]`.

### Test Data
- No seed required.

### Expected Result
- `dashboard-summary-banner` is visible.
- `dashboard-widgets-banner` is visible.
- Neither banner has `display: none`.

---

## Test Case: TC-020-E04 — Both Banners Hidden at <768px (Mobile)

**Objective:** Verify both banner containers are hidden (`display: none` via CSS media query) at mobile viewport width.

### Steps
1. Set viewport to 375×812.
2. Navigate to `/dashboard`.
3. Wait for `networkidle`.
4. Check `.isVisible()` for `[data-placement="dashboard-summary-banner"]`.
5. Check `.isVisible()` for `[data-placement="dashboard-widgets-banner"]`.

### Test Data
- No seed required.

### Expected Result
- `dashboard-summary-banner` is NOT visible (hidden by `@media (max-width: 767px) { display: none; }`).
- `dashboard-widgets-banner` is NOT visible.
- The Story 011 sticky footer (320×50) is unaffected by this story.

---

## Test Case: TC-020-E05 — Banners Have Correct Accessibility Attributes

**Objective:** Verify both banners carry `role="complementary"` and `tabindex="-1"` as required by the acceptance criteria.

### Steps
1. Set viewport to 1280×800.
2. Navigate to `/dashboard`; wait for `networkidle`.
3. Check `getAttribute('role')` on `[data-placement="dashboard-summary-banner"]`.
4. Check `getAttribute('tabindex')` on `[data-placement="dashboard-summary-banner"]`.
5. Repeat for `[data-placement="dashboard-widgets-banner"]`.

### Test Data
- No seed required.

### Expected Result
- `dashboard-summary-banner`: `role="complementary"`, `tabindex="-1"`.
- `dashboard-widgets-banner`: `role="complementary"`, `tabindex="-1"`.

---

## Test Case: TC-020-E06 — sidebar-skyscraper Does NOT Exist in DOM

**Objective:** Verify that the retired `[data-placement="sidebar-skyscraper"]` container is completely absent from the Dashboard DOM (regardless of viewport).

### Steps
1. Navigate to `/dashboard`.
2. Wait for `networkidle`.
3. Count elements matching `[data-placement="sidebar-skyscraper"]`.

### Test Data
- No seed required.

### Expected Result
- Zero elements with `data-placement="sidebar-skyscraper"` exist in the DOM.

---

## Test Case: TC-020-E07 — Old dashboard-banner (v1 Slot) Does NOT Exist in DOM

**Objective:** Verify that the Story 010 v1 ad slot `[data-placement="dashboard-banner"]` is completely absent from the Dashboard DOM.

### Steps
1. Navigate to `/dashboard`.
2. Wait for `networkidle`.
3. Count elements matching `[data-placement="dashboard-banner"]`.

### Test Data
- No seed required.

### Expected Result
- Zero elements with `data-placement="dashboard-banner"` exist in the DOM.

---

## Test Case: TC-020-E08 — dashboard-summary-banner Positioned Between Summary Bar and Widgets Grid

**Objective:** Verify the visual/DOM position of `dashboard-summary-banner` is below the Overall Summary Bar and above the Widgets Grid (Section 2 → Banner → Section 3 order).

### Steps
1. Set viewport to 1280×800.
2. Navigate to `/dashboard`; wait for `networkidle`.
3. Get `boundingBox()` for `app-overall-summary-bar` (or `[data-testid="overall-summary-bar"]`).
4. Get `boundingBox()` for `[data-placement="dashboard-summary-banner"]`.
5. Get `boundingBox()` for `[data-testid="widget-expenses"]` (or similar widgets grid element).

### Test Data
- No seed required; Stories 017–018 must be deployed for full verification.

### Expected Result
- `dashboard-summary-banner`.y > `overall-summary-bar`.y (banner below summary bar).
- `dashboard-summary-banner`.y < `widget-expenses`.y + `widget-expenses`.height (banner above widgets grid).

---

## Test Case: TC-020-E09 — dashboard-widgets-banner Positioned Between Widgets Grid and Transactions Panel

**Objective:** Verify `dashboard-widgets-banner` is positioned below the Widgets Grid and above the Transactions Panel (Section 3 → Banner → Section 4 order).

### Steps
1. Set viewport to 1280×800.
2. Navigate to `/dashboard`; wait for `networkidle`.
3. Get `boundingBox()` for `[data-testid="widget-expenses"]`.
4. Get `boundingBox()` for `[data-placement="dashboard-widgets-banner"]`.
5. Get `boundingBox()` for `[data-testid="transactions-panel-title"]` (or `app-transactions-panel`).

### Test Data
- No seed required; Stories 018–019 must be deployed for full verification.

### Expected Result
- `dashboard-widgets-banner`.y > `widget-expenses`.y (banner below widgets grid).
- `dashboard-widgets-banner`.y < `transactions-panel-title`.y (banner above transactions panel).

---

## Negative / Edge-Case Test Cases

---

## Test Case: TC-020-N01 — Banner Container Reserves Space Before AdSense Loads (CLS = 0)

**Objective:** Verify the banner container has explicit minimum dimensions that reserve layout space before AdSense fills it, avoiding Cumulative Layout Shift.

**Type:** Manual / Lighthouse  
**Automation:** Not automated (requires Lighthouse CLS metric).

### Steps
1. Open Chrome DevTools → Lighthouse → run Dashboard page audit.
2. Inspect CLS metric.
3. Alternatively: In DevTools, inspect CSS of `.ad-section-divider`: verify `min-height: 90px`.

### Test Data
- No seed required; production/staging environment.

### Expected Result
- Lighthouse CLS score = 0 on Dashboard page.
- `.ad-section-divider` CSS includes `min-height: 90px` and `width: 100%` to reserve space.

---

## Test Case: TC-020-N02 — Banners Do Not Overlap Section Content

**Objective:** Verify banners do not visually overlap the Overall Summary Bar, Widgets Grid, or Transactions Panel.

**Type:** Manual visual check.

### Steps
1. Open Dashboard on desktop Chrome at 1280×800.
2. Visually inspect the area between Overall Summary Bar and Widgets Grid.
3. Visually inspect the area between Widgets Grid and Transactions Panel.

### Expected Result
- Each banner is separated from adjacent section content by at least 8 px margin.
- No section content is clipped or obscured by the banner containers.

---

## Test Case: TC-020-N03 — Dev Placeholder Shown When AdSense Unavailable

**Objective:** Verify that in non-production environments a visible grey placeholder with an "Ad" label is shown inside each banner container.

**Type:** Manual / Local dev check.

### Steps
1. Start Angular dev server (`ng serve`).
2. Navigate to `/dashboard` (environment = development).
3. Inspect `[data-placement="dashboard-summary-banner"]` and `[data-placement="dashboard-widgets-banner"]` visually.

### Test Data
- No seed required; `environment.ts` must have empty AdSense slot IDs.

### Expected Result
- Each banner renders a grey box placeholder with text "Ad" (or equivalent dev placeholder).
- No JavaScript errors about missing AdSense slots.

---

## Regression Tests

---

## Test Case: TC-020-R01 — Story 010 Skyscraper Assertion Superseded

**Objective:** Confirm that the Story 010 Angular unit test asserting `sidebar-skyscraper` PRESENCE has been updated to assert its ABSENCE.

**Type:** Manual / Code Review

### Steps
1. Locate Story 010 Angular component/unit test files.
2. Confirm any assertion of `sidebar-skyscraper` presence has been removed or inverted.
3. Run the Angular unit test suite; confirm zero failures related to `sidebar-skyscraper`.

### Expected Result
- No unit test asserts that `sidebar-skyscraper` is rendered.
- Story 010 unit tests pass with 0 failures.

---

## Out-of-Scope (Manual / Non-E2E Tests)

| Test | Reason |
|------|--------|
| CLS = 0 metric | Requires Lighthouse audit — not a CI gate |
| AdSense real slot IDs fire impressions | Requires production environment |
| Banner dimensions exactly 728px × 90px | CSS pixel assertion — verified via component unit test |
| Mobile sticky footer unchanged (Story 011) | Owned by Story 011; covered by Story 011 E2E |
