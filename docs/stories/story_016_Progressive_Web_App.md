## Story: Progressive Web App (PWA) — Installable & Offline-Ready

**Status:** To Do

**As a** user on a mobile device  
**I want** MoneyInsight to be installable as a home-screen app and work offline for browsing my transaction history  
**So that** I have a native-app-like experience without needing to open a browser each time, and I can review my finances even without internet connectivity

### Background
MoneyInsight is an Angular SPA with an IndexedDB-first data layer — all transaction data is already available offline in IndexedDB. Sprint 3 adds a Service Worker (`@angular/pwa`) to enable offline access to cached assets, a Web App Manifest for installability, and a graceful offline-mode UI indicator.

### Scenarios
- User is prompted to install MoneyInsight on mobile after two visits (browser's native install prompt)
- User installs the app; it launches in standalone mode without browser chrome
- User opens the app while offline; previously viewed pages load from the Service Worker cache
- User navigates to `/dashboard` offline; they see their last-loaded transactions (from IndexedDB)
- User tries to import a file offline; they see an `[data-testid="offline-import-error"]` message
- User comes back online; the app resumes normal operation without a reload

### Acceptance Criteria
1. `@angular/pwa` is installed and `ngsw-config.json` is configured; `ng build --configuration production` outputs `ngsw.json` and `ngsw-worker.js`.
2. `src/manifest.webmanifest` contains at minimum: `name`, `short_name`, `start_url`, `display: "standalone"`, `background_color`, `theme_color`, and icons at 192 × 192 and 512 × 512 px.
3. On first load, the Service Worker caches all static Angular bundle assets (lazy chunks, WASM `.wasm` file, `ngsw.json`) for offline use.
4. When offline, navigating to `/dashboard` renders the Dashboard with previously loaded IndexedDB data (no "network error" page).
5. Attempting to import a file while offline shows `[data-testid="offline-import-error"]` with text "You are offline. Uploads are not available." — the file input is disabled.
6. `[data-testid="offline-banner"]` is shown at the top of every page when the browser is offline; it disappears automatically when connectivity is restored.
7. The app passes Chrome Lighthouse PWA audit with score ≥ 80 on a production build (manual verification; not a CI gate for Sprint 3).
8. Existing E2E tests (Sprint 1 + Sprint 2) continue to pass against the development build (Service Worker is disabled in development mode by default with `@angular/pwa`).

### Technical Notes
- `ng add @angular/pwa` scaffolds: `ngsw-config.json`, updates `angular.json`, `app.config.ts` (service worker registration), and adds a manifest link to `index.html`.
- `ngsw-config.json` asset group: include `/**` for shell, `wasm/*.wasm` for WASM binary, and configure data groups for Google Sheets API calls with a `freshness` strategy.
- Offline detection: `fromEvent(window, 'online' / 'offline')` → Angular signal `isOnline = signal(navigator.onLine)` in `AppComponent`.
- Import guard: `ImportComponent` checks `isOnline()` signal before triggering file-picker; if false, shows `[data-testid="offline-import-error"]`.
- Offline banner: add `[data-testid="offline-banner"]` to `AppComponent` template with `*ngIf="!isOnline()"`.
- Icons: create two placeholder icons (192 × 192 and 512 × 512) at `src/client/public/icons/` using SVG-to-PNG; update manifest accordingly.
- Note: Service Worker only activates in **production** builds; development (`ng serve`) intentionally bypasses the SW — no impact on existing E2E tests run against `ng serve`.

### PO Clarifications (2025-06-XX — post agent pre-analysis)

**C1 — AC3 CORRECTION — Do NOT cache `ngsw.json` in the Service Worker:**
**Discard** "`ngsw.json`" from the list of items the SW caches in AC3. The `ngsw.json` control file is the Service Worker's own manifest — it must NOT be listed in any `assetGroup`. The SW fetches this file from the network to detect updates. Caching it would break the update mechanism entirely. Updated AC3: "On first load, the Service Worker caches all static Angular bundle assets (lazy chunks and the WASM `.wasm` binary) for offline use."

**C2 — Use existing `ConnectivityService` (do NOT duplicate):**
`ConnectivityService` already exists at `src/client/src/app/core/services/connectivity.service.ts` and handles `online`/`offline` events via a `BehaviorSubject`. Do NOT create a new `fromEvent(window, 'online'/'offline')` in `AppComponent`. Instead, inject `ConnectivityService` and expose its state as a signal via `toSignal()`:

```typescript
// In AppComponent
private connectivityService = inject(ConnectivityService);
isOnline = toSignal(this.connectivityService.isOnline$, { initialValue: navigator.onLine });
```

Remove the Technical Notes bullet about `fromEvent(window, 'online' / 'offline')` in `AppComponent` — replace with this pattern.

**C3 — `provideServiceWorker()` in `app.config.ts`:**
Angular 17+ / Angular 21 standalone apps register the Service Worker via `provideServiceWorker()` in `app.config.ts` (NOT via `ServiceWorkerModule.register()` in an `NgModule`). The `ng add @angular/pwa` schematic targets `app.config.ts` automatically in standalone mode — verify it does so post-install and correct if needed.

**C4 — File input disabled binding:**
In `ImportComponent`, add `[disabled]="!isOnline()"` to BOTH the `<input type="file">` element AND the trigger `<button>`. This prevents the native file-picker from opening when offline. The `isOnline` signal should be obtained from `ConnectivityService` via `toSignal()`.

**C5 — `@if`/`@for` for all new Sprint 3 template code:**
Use Angular's new block control-flow syntax (`@if`, `@for`) — not `*ngIf`/`*ngFor` — for ALL new template additions in Sprint 3 (offline banner, offline import error). This applies to `AppComponent` template and `ImportComponent` template.

```html
<!-- Correct Sprint 3 pattern -->
@if (!isOnline()) {
  <div data-testid="offline-banner">You are offline.</div>
}
```

**C6 — WASM binary caching in `ngsw-config.json`:**
Add the WASM binary to an `assetGroup` with `installMode: "lazy"` to avoid blocking the initial install with a large WASM download. The path must match the actual deployed path in `angular.json` assets. Verify the current WASM output path (likely `wasm/` or `assets/wasm/`) and use the matching glob in `ngsw-config.json`. Example:

```json
{
  "name": "wasm",
  "installMode": "lazy",
  "updateMode": "prefetch",
  "resources": {
    "files": ["/wasm/**/*.wasm"]
  }
}
```

**C7 — E2E test isolation (offline banner false positive risk):**
`[data-testid="offline-banner"]` must NOT appear in CI E2E runs. Since the Service Worker is disabled in `ng serve` (development mode), the offline banner is only triggered by `ConnectivityService.isOnline$` emitting `false`. In Playwright E2E tests run against `ng serve`, `navigator.onLine` will be `true` — the banner must NOT appear unless the network is explicitly mocked offline. Verify `ConnectivityService` initialises with `navigator.onLine` (not always `false`) to prevent false positives.

**C8 — `manifest.webmanifest` icon paths:**
Icons at 192 × 192 and 512 × 512 px must be placed at `src/client/public/icons/icon-192x192.png` and `src/client/public/icons/icon-512x512.png`. Placeholder SVG-based PNGs are acceptable for Sprint 3. Manifest `src` paths must be relative (not absolute) for Production Firebase hosting compatibility.

**C9 — Lighthouse PWA audit scope:**
Lighthouse ≥ 80 is a **manual verification step** performed against a `ng build --configuration production` Firebase preview deployment. It is NOT a CI gate for Sprint 3. The E2E test suite does not need to assert the Lighthouse score.
