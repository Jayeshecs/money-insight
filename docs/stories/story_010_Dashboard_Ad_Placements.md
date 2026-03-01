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
