## Story: Mobile Responsive UI

**Status:** ✅ QA Verified — All E2E Tests Passing (2026-03-01)

**As a** mobile user  
**I want** the app to be fully usable on a small screen with intuitive navigation  
**So that** I can review my finances on the go without needing a desktop

### Scenarios
- User opens the app on a mobile screen (< 768px)
- Bottom navigation bar replaces the desktop sidebar
- Dashboard widgets stack vertically and are swipeable/scrollable
- Transaction review shows card layout instead of table rows
- A sticky footer ad (320×50) appears at the bottom above the nav bar during scroll
- The sticky ad can be dismissed with an [X] button and reappears after 3 page navigations

### Acceptance Criteria
- At viewport ≤ 767px: `[data-testid="bottom-nav"]` is visible and contains tabs: Dashboard, Transactions, Import, Settings
- At viewport ≥ 1024px: `[data-testid="sidebar-nav"]` is visible; `[data-testid="bottom-nav"]` is hidden
- At mobile viewport: Dashboard widgets stack in a single column (no grid)
- At mobile viewport: Transaction list shows `[data-testid="transaction-card"]` cards instead of `[data-testid="transaction-row"]` table rows; each card shows Narration, Amount, Date, Category
- Sticky footer ad: `[data-testid="ad-placeholder"][data-placement="mobile-sticky-footer"]` with dimensions 320×50 — visible at mobile only
- `[data-testid="sticky-ad-close"]` button within the sticky ad dismisses it; it must not reappear for the same session until 3 navigations
- All tap targets are ≥ 44×44px (WCAG 2.1 AA)
- Import screen remains a full-screen modal (no layout change required from Sprint 1)

### Technical Notes
- Bottom navigation: new `BottomNavComponent` at `src/app/shared/components/bottom-nav/`
- CSS breakpoints: `mobile: <768px`, `tablet: 768–1023px`, `desktop: ≥1024px`
- Transaction cards: refactor `TransactionsListComponent` to conditionally render cards (mobile) vs table (desktop/tablet)
- Sticky footer ad: add to `AppComponent` template (not per-page) so it persists across routes; use `ViewportService` or CSS media query for visibility
- Dismiss logic: store dismiss count in `sessionStorage`; show after every 3 navigations
- Install `@angular/cdk` before implementing `BreakpointObserver`

### PO Clarifications (2026-03-01)

**Q: Tablet navigation — bottom nav or sidebar nav at 768–1023px?**  
→ **Sidebar nav** at tablet (768–1023px). Bottom nav is **mobile-only** (< 768px). Sidebar collapses to icon-only or is hidden behind a hamburger at tablet — dev to choose simplest implementation.

**Q: Settings tab — does a Settings route/screen exist?**  
→ **No.** Story 011 must create a **stub** `SettingsComponent` at `/settings` with placeholder text "Settings — Coming Soon". This unblocks the nav tab.

**Q: Swipe gesture — full swiper library or CSS overflow?**  
→ **CSS `overflow-x: scroll` only** (no swiper library). Native browser scroll is sufficient for Sprint 2 horizontal widget scrolling.

**Q: Dismiss counter — persists across hard refresh?**  
→ **No.** Use `sessionStorage` — resets on hard refresh / new tab. Count resets to 0 on session start.

**Q: Dismiss counter — what counts as a "navigation"?**  
→ Angular `Router` `NavigationEnd` events. Each `NavigationEnd` increments the counter. When counter reaches 3, sticky ad re-shows (and counter resets to 0).

**Q: Tap targets 44×44px — retroactive to Sprint 1 components?**  
→ **No.** Only apply to **new Sprint 2 components** (BottomNavComponent, transaction cards, sticky ad close button). Sprint 1 components are out of scope for tap-target fixes.

**Q: CLS for sticky footer ad?**  
→ Sticky footer must be positioned `fixed` at bottom so it never causes layout shift. Container height (50px) reserved at page bottom via `padding-bottom: 50px` on `AppComponent` wrapper when ad is visible.
