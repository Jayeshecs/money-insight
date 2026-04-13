## Story: Dashboard Ad Placements

**Status:** ✅ QA Verified — All E2E Tests Passing (2026-03-01)

**As a** product owner  
**I want** AdSense ad placeholders on the Dashboard screen (sidebar skyscraper and native banner between widgets)  
**So that** we can monetize dashboard views in addition to the import screen

### Scenarios
- User views the Dashboard on desktop and sees a 160×600 skyscraper ad in the sidebar
- User views the Dashboard on desktop and sees a 728×90 native banner ad between the charts and the Recent Transactions table
- On mobile, neither the skyscraper nor the banner appears (replaced by sticky footer ad in Story 011)
- Ads do not overlap or block any widget content
- Ads use the existing `AdPlaceholderComponent` and show the dev placeholder when AdSense is unavailable

### Acceptance Criteria
- `[data-testid="ad-placeholder"][data-placement="sidebar-skyscraper"]` is present and visible on desktop (width ≥ 1024px) in the Dashboard sidebar
- Sidebar skyscraper dimensions: exactly 160px wide × 600px tall
- `[data-testid="ad-placeholder"][data-placement="dashboard-banner"]` is present and visible between the Category Breakdown widget and the Recent Transactions table
- Dashboard native banner dimensions: exactly 728px wide × 90px tall
- Both ads have `tabindex="-1"` and `role="complementary"` for accessibility
- On viewport width < 1024px, sidebar skyscraper is hidden (`display: none`)
- On viewport width < 768px, dashboard banner is hidden (mobile layout uses Story 011's sticky footer instead)
- Ads do not cause any layout shift (CLS = 0 — containers reserve space before AdSense fills)

### Technical Notes
- Reuse `AdPlaceholderComponent` (shared component from Sprint 1)
- Dashboard layout: `DashboardComponent` template update — add sidebar with skyscraper + main content area
- CSS: sidebar at 160px fixed width on desktop; main content takes remaining width
- Use CSS media queries for responsive visibility toggling
- New AdSense slot IDs in slot map: `'sidebar-skyscraper'` and `'dashboard-banner'`
- This story's **layout restructure** (`DashboardComponent` sidebar template) is a prerequisite for Story 007 widget placement — implement Story 010 first in the sprint.

### PO Clarifications (2026-03-01)

**Q: Is the 728×90 banner visible at tablet (768–1023px)?**  
→ **Yes.** The `dashboard-banner` (728×90) is visible at **768px and above**. It is hidden only on mobile (< 768px).

**Q: Is the 160×600 sidebar skyscraper visible at tablet?**  
→ **No.** Sidebar skyscraper is hidden at < 1024px. The sidebar area collapses at tablet; skyscraper does not reflow to a smaller size.

**Q: AdSense slot IDs — hardcoded or configurable?**  
→ Use **environment config** (`environment.ts` / `environment.prod.ts`). Slot IDs are empty strings in `environment.ts` (dev) and filled in `environment.prod.ts`.

**Q: CLS = 0 — how is this verified?**  
→ **Manual Lighthouse check** before story closure. Not a CI gate in Sprint 2. Dev must ensure ad containers have explicit `width`/`height` set via CSS before AdSense fills them.

**Q: Does Story 010 change the sidebar navigation template?**  
→ Story 010 adds the **ad sidebar** (right side). The **nav sidebar** (left side) belongs to Story 011. They are separate concerns; coordinate to avoid template conflicts.

**Design Revision:** v2.0 — The v1.0 sidebar skyscraper (160×600) and single banner placement are superseded by the new full-width four-section dashboard layout. Ad positions are updated to fit the vertical section structure.

**As a** product owner  
**I want** AdSense ad placeholders on the Dashboard screen at high-engagement positions within the new four-section layout  
**So that** we can monetise dashboard views without blocking analytical widget content

### Scenarios
- User views the Dashboard on desktop (≥ 768 px) and sees a 728×90 native banner between the Overall Summary section (Section 2) and the Widgets section (Section 3)
- User views the Dashboard on desktop (≥ 768 px) and sees a 728×90 native banner between the Widgets section (Section 3) and the Transactions Panel (Section 4)
- On mobile (< 768 px), neither banner ad appears; a sticky footer banner (320×50) remains visible during scroll
- Ads do not overlap or block any section content
- Ads use the existing `AdPlaceholderComponent` and show the dev placeholder when AdSense is unavailable

### Acceptance Criteria
- `[data-testid="ad-placeholder"][data-placement="dashboard-summary-banner"]` is present and visible between Section 2 and Section 3 at viewport ≥ 768 px; dimensions: 728 px wide × 90 px tall
- `[data-testid="ad-placeholder"][data-placement="dashboard-widgets-banner"]` is present and visible between Section 3 and Section 4 at viewport ≥ 768 px; dimensions: 728 px wide × 90 px tall
- Both banner ads are hidden (`display: none`) at viewport < 768 px
- Both banners have `tabindex="-1"` and `role="complementary"` for accessibility
- Banners do not cause any layout shift (CLS = 0 — containers have explicit `width: 728px; height: 90px` before AdSense fills them)
- On mobile (< 768 px), `[data-testid="ad-placeholder"][data-placement="mobile-sticky-footer"]` is visible at the bottom of the viewport (fixed position); dimensions: 320 px wide × 50 px tall (from Story 011)
- The old `sidebar-skyscraper` and `dashboard-banner` placement IDs are removed; no orphaned ad containers remain in the template

### Technical Notes
- Remove `[data-placement="sidebar-skyscraper"]` and `[data-placement="dashboard-banner"]` ad containers introduced in v1.0 (sidebar layout is retired)
- Add two new ad containers directly in `DashboardComponent` template at the correct section boundaries:
  1. After `<app-overall-summary-bar>`, before `<div class="widgets-grid">` → `data-placement="dashboard-summary-banner"`
  2. After `</div>` (closing `widgets-grid`), before `<app-transactions-panel>` → `data-placement="dashboard-widgets-banner"`
- Reuse `AdPlaceholderComponent` with `format="banner"` and `placement` bound to the slot string
- CSS: centre banners horizontally within the full-width section container; use `margin: 8px auto` and `width: 728px; height: 90px`
- Update AdSense slot map in `environment.ts` / `environment.prod.ts`: add keys `'dashboard-summary-banner'` and `'dashboard-widgets-banner'`; remove retired keys
- Mobile sticky footer (320×50) remains owned by Story 011; no change needed here

### PO Clarifications (2026-04-13)

**Q: Is the 728×90 summary banner visible at tablet (768–1023 px)?**
→ **Yes.** Both banners are visible at 768 px and above. Hidden only on mobile (< 768 px).

**Q: What happens to the old sidebar skyscraper (160×600)?**
→ **Removed.** The v2.0 dashboard has no sidebar panel. Remove the container and its AdSense slot config.

**Q: Are the two banners both shown on every dashboard visit, or only conditionally?**
→ Both are shown on every dashboard page load (not gated by widget interaction). The `dashboard-widgets-banner` loads even before any widget row is selected.

**Q: AdSense slot IDs — hardcoded or configurable?**
→ Use **environment config** (`environment.ts` / `environment.prod.ts`). Slot IDs are empty strings in `environment.ts` (dev) and filled in `environment.prod.ts`.

**Q: CLS = 0 — how is this verified?**
→ Manual Lighthouse check before story closure. Dev must ensure ad containers have explicit `width`/`height` set in CSS before AdSense fills them.

**Q: Does Story 010 v2.0 affect Story 015 (in-feed ads in Transactions screen)?**
→ No. Story 015 targets the standalone `/transactions` route (`TransactionsListComponent`). The Transactions Panel inside the dashboard (Section 4) is a separate component (`TransactionsPanelComponent`) and does not carry Story 015's in-feed ad rows.
