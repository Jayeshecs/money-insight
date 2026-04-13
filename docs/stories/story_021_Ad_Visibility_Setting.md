## Story: Ad Visibility Setting — Show / Hide Ad Placeholders

**Status:** ✅ QA Verified — All E2E Tests Passing (2026-04-13)

**As a** user  
**I want** a setting in the Settings screen to show or hide all ad placeholders across the app  
**So that** I can choose a cleaner, distraction-free view of my finances when I don't want to see ads

### Background
MoneyInsight currently shows `AdPlaceholderComponent` instances in four locations:
1. **Import / Processing screen** — 300×250 medium-rectangle (Story 006)
2. **Dashboard v2.0 — Summary Banner** — 728×90 banner between Overall Summary and Widgets Grid (Story 020)
3. **Dashboard v2.0 — Widgets Banner** — 728×90 banner between Widgets Grid and Transactions Panel (Story 020)
4. **Transactions Review screen** — native in-feed ads (Story 015)
5. **Mobile sticky footer** — 320×50 mobile-banner in `AppComponent` (Story 011)

Users should have control over their ad experience without requiring a browser extension. The preference is stored in `localStorage` (key: `mi_show_ads`) and defaults to `false` (ads hidden). When ads are hidden, ad containers are removed from the DOM entirely (not just CSS-hidden) to avoid layout space reservation.

### Scenarios
- User navigates to `/settings` and sees an "Ad Preferences" section with a **"Show ad placeholders"** toggle defaulting to OFF
- User toggles it ON → all ad placeholder containers appear in the Import screen, Dashboard, and Transactions screen immediately (no page reload required)
- User toggles it back OFF → all ad placeholders are removed from the DOM immediately
- User refreshes the page → their preference is remembered (persisted in `localStorage`)
- User who has never visited Settings has ads hidden by default (first-time visit)

### Acceptance Criteria
1. A `UserPreferencesService` (`src/client/src/app/core/services/user-preferences.service.ts`) provides a reactive `showAds = signal<boolean>(false)` initialised from `localStorage` key `mi_show_ads`; writes back to `localStorage` on every change.
2. The Settings screen at `/settings` renders an **"Ad Preferences"** section (`data-testid="ad-preferences-section"`) containing:
   - A descriptive label: "Show ad placeholders" (`data-testid="show-ads-label"`)
   - A toggle checkbox / switch input (`data-testid="show-ads-toggle"`, `type="checkbox"`, `role="switch"`) reflecting the current preference
3. Toggling the switch updates `UserPreferencesService.showAds` signal and persists the value (`"true"` / `"false"`) to `localStorage['mi_show_ads']`.
4. Every `AdPlaceholderComponent` instance in the app is wrapped in an `@if (prefsService.showAds())` guard OR the `AdPlaceholderComponent` itself reads the signal and conditionally renders; the result is that when `showAds = false`, **no** `[data-testid="ad-placeholder"]` elements exist in the DOM.
5. When `showAds = true`, all existing ad placeholder containers appear with their correct dimensions and `data-testid="ad-placeholder"` attributes (regression: Stories 006, 010/020, 015, 011 ad assertions hold).
6. Default value is `false` (ads hidden) on a clean session where `localStorage['mi_show_ads']` is absent.
7. The preference persists across page reloads (stored in `localStorage`, not `sessionStorage`).
8. No layout shift or reserved blank space appears in any screen when `showAds = false`.
9. The Settings toggle reflects the correct state when navigated to directly (e.g. the page is reloaded at `/settings`).

### Technical Notes
- Create `UserPreferencesService` as `providedIn: 'root'`; use Angular `signal()` for reactivity; load initial value from `localStorage.getItem('mi_show_ads') === 'true'`; persist via `effect()` or in the setter.
- `SettingsComponent` injects `UserPreferencesService`; replaces the "Coming Soon" placeholder with a proper settings form containing the Ad Preferences section.
- Guard pattern in `DashboardComponent`, `AppComponent`, `ImportComponent`, and `TransactionsListComponent`: wrap each `<app-ad-placeholder>` with `@if (prefs.showAds())`.
- Alternatively, `AdPlaceholderComponent` itself can inject `UserPreferencesService` and use `@if` inside its template — **preferred** to avoid scattering guards across 5+ components.
- `data-testid="settings-ad-toggle-section"` is acceptable as an alias for `ad-preferences-section`.

### PO Clarifications
- **Q: Should we use a real toggle (CSS switch) or a standard checkbox?**  
  A: A standard HTML checkbox styled as a switch is fine. Accessibility matters — use `role="switch"` and `aria-checked`.
- **Q: Should this setting apply to the mobile sticky footer too?**  
  A: Yes — all ad placeholders, including the mobile footer, must respect this setting.
- **Q: Can the user still enable ads if they want?**  
  A: Yes — the setting is opt-in. Default is OFF (hidden); user can turn it ON anytime.
- **Q: Will this affect AdSense revenue tracking?**  
  A: Out of scope for this story — treat as a UX/layout concern only.
