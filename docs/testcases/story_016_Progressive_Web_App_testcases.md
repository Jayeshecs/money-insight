# Test Cases for Story 016: Progressive Web App (PWA) — Installable & Offline-Ready

**Story Reference:** [story_016_Progressive_Web_App.md](../stories/story_016_Progressive_Web_App.md)  
**Date:** 2026-03-09  
**Author:** QA Automation Engineer  
**Sprint:** 3

---

> **CI / Automation Note:**  
> Tests depending on the Service Worker (asset caching, offline page load from SW cache, Lighthouse score) require a **production build** (`ng build --configuration production`). These tests are marked **MANUAL** and are NOT CI gates for Sprint 3. The Service Worker is intentionally disabled in `ng serve` development mode — all automatable E2E tests run against `ng serve` without SW interference.

---

## Unit Tests (Angular / TypeScript)

---

### TC-016-001

| Field | Value |
|---|---|
| **TC ID** | TC-016-001 |
| **Type** | Unit |
| **Title** | `ConnectivityService` emits `true` when window fires `online` event |

**Preconditions:**
- `ConnectivityService` is instantiated in an Angular TestBed with `PLATFORM_ID` set to `"browser"`.

**Steps:**
1. Inject `ConnectivityService`.
2. Collect emissions from `isOnline$`.
3. Fire `window.dispatchEvent(new Event('online'))`.
4. Inspect the latest emission.

**Expected Result:**
- `isOnline$` emits `true` after the `online` event.

**AC Reference:** AC6, C2

---

### TC-016-002

| Field | Value |
|---|---|
| **TC ID** | TC-016-002 |
| **Type** | Unit |
| **Title** | `ConnectivityService` emits `false` when window fires `offline` event |

**Preconditions:**
- `ConnectivityService` instantiated in TestBed.

**Steps:**
1. Inject `ConnectivityService`.
2. Fire `window.dispatchEvent(new Event('offline'))`.
3. Inspect `isOnline$` latest emission.

**Expected Result:**
- `isOnline$` emits `false` after the `offline` event.

**AC Reference:** AC6, C2

---

### TC-016-003

| Field | Value |
|---|---|
| **TC ID** | TC-016-003 |
| **Type** | Unit |
| **Title** | `ConnectivityService` initialises with `navigator.onLine` value (not hardcoded `false`) |

**Preconditions:**
- `ConnectivityService` instantiated in TestBed.
- `navigator.onLine` is `true` (standard test environment).

**Steps:**
1. Inject `ConnectivityService`.
2. Read the initial value of `isOnline$` (BehaviorSubject initial emission).

**Expected Result:**
- Initial emission equals `navigator.onLine` (i.e., `true` in a standard browser test environment).
- Does NOT hardcode `false` as initial value.

**AC Reference:** AC6, C7

---

### TC-016-004

| Field | Value |
|---|---|
| **TC ID** | TC-016-004 |
| **Type** | Unit |
| **Title** | `AppComponent.isOnline` signal is derived from `ConnectivityService` via `toSignal()` |

**Preconditions:**
- `AppComponent` is created in TestBed with `ConnectivityService` provided.

**Steps:**
1. Inject `AppComponent`.
2. Stub `ConnectivityService.isOnline$` to emit `false`.
3. Trigger change detection.
4. Read `appComponent.isOnline()` signal value.

**Expected Result:**
- `isOnline()` returns `false` when `ConnectivityService.isOnline$` emits `false`.
- `fromEvent(window, ...)` is NOT independently set up in `AppComponent`.

**AC Reference:** AC6, C2

---

## Component Tests (Angular TestBed)

---

### TC-016-005

| Field | Value |
|---|---|
| **TC ID** | TC-016-005 |
| **Type** | Component |
| **Title** | `offline-banner` is visible when `isOnline` signal is `false` |

**Preconditions:**
- `AppComponent` created in TestBed with `ConnectivityService` mocked.

**Steps:**
1. Stub `connectivityService.isOnline$` to emit `false`.
2. Trigger change detection.
3. Query `[data-testid="offline-banner"]`.

**Expected Result:**
- `[data-testid="offline-banner"]` is present and visible in the DOM.

**AC Reference:** AC6

---

### TC-016-006

| Field | Value |
|---|---|
| **TC ID** | TC-016-006 |
| **Type** | Component |
| **Title** | `offline-banner` is hidden when `isOnline` signal is `true` |

**Preconditions:**
- `AppComponent` in TestBed; `ConnectivityService` emits `true`.

**Steps:**
1. Stub `connectivityService.isOnline$` to emit `true`.
2. Trigger change detection.
3. Query `[data-testid="offline-banner"]`.

**Expected Result:**
- `[data-testid="offline-banner"]` is NOT present in the DOM (Angular `@if` removes it).

**AC Reference:** AC6, C5

---

### TC-016-007

| Field | Value |
|---|---|
| **TC ID** | TC-016-007 |
| **Type** | Component |
| **Title** | `ImportComponent` file input is disabled when `isOnline` is `false` |

**Preconditions:**
- `ImportComponent` created in TestBed with `ConnectivityService` mocked.

**Steps:**
1. Stub `connectivityService.isOnline$` to emit `false`.
2. Trigger change detection.
3. Query `input[type="file"]` and the trigger `<button>`.
4. Check `disabled` attribute on both elements.

**Expected Result:**
- Both `input[type="file"]` and trigger `<button>` have `disabled` attribute set.

**AC Reference:** AC5, C4

---

### TC-016-008

| Field | Value |
|---|---|
| **TC ID** | TC-016-008 |
| **Type** | Component |
| **Title** | `offline-import-error` is shown in `ImportComponent` when offline |

**Preconditions:**
- `ImportComponent` in TestBed; `ConnectivityService` emits `false`.

**Steps:**
1. Stub `connectivityService.isOnline$` to emit `false`.
2. Trigger change detection.
3. Query `[data-testid="offline-import-error"]`.
4. Read its text content.

**Expected Result:**
- `[data-testid="offline-import-error"]` is visible.
- Text content = `"You are offline. Uploads are not available."`.

**AC Reference:** AC5

---

### TC-016-009

| Field | Value |
|---|---|
| **TC ID** | TC-016-009 |
| **Type** | Component |
| **Title** | `ImportComponent` file input is ENABLED when `isOnline` is `true` |

**Preconditions:**
- `ImportComponent` in TestBed; `ConnectivityService` emits `true`.

**Steps:**
1. Stub `connectivityService.isOnline$` to emit `true`.
2. Trigger change detection.
3. Query `input[type="file"]`.
4. Check `disabled` attribute.

**Expected Result:**
- `input[type="file"]` does NOT have `disabled` attribute.
- File import flow is accessible.

**AC Reference:** AC5, C4

---

### TC-016-010

| Field | Value |
|---|---|
| **TC ID** | TC-016-010 |
| **Type** | Component |
| **Title** | `manifest.webmanifest` contains required fields: name, short_name, start_url, display, icons |

**Preconditions:**
- `src/manifest.webmanifest` file is present.
- File is valid JSON.

**Steps:**
1. Read and parse `src/manifest.webmanifest`.
2. Assert presence of required fields.

**Expected Result:**
- `name` — non-empty string.
- `short_name` — non-empty string.
- `start_url` — non-empty string.
- `display` = `"standalone"`.
- `background_color` — valid hex colour string.
- `theme_color` — valid hex colour string.
- `icons` — array containing at least one entry with size `"192x192"` and one with `"512x512"`.

**AC Reference:** AC2

---

## E2E Tests (Playwright — Automatable, running against `ng serve`)

**Base URL:** `http://localhost:4200`

---

### TC-016-011

| Field | Value |
|---|---|
| **TC ID** | TC-016-011 |
| **Type** | E2E |
| **Title** | `offline-banner` is NOT visible when app loads online in development mode |

**Preconditions:**
- Angular dev server running at `http://localhost:4200` (SW disabled).
- Network is available (CI environment is online).

**Steps:**
1. `await page.goto('/dashboard')`.
2. Wait for page to be fully loaded.
3. Assert `[data-testid="offline-banner"]` is not visible.

**Expected Result:**
- `[data-testid="offline-banner"]` is NOT visible.
- No false positive from incorrect `ConnectivityService` initialisation.

**AC Reference:** AC6, C7

---

### TC-016-012

| Field | Value |
|---|---|
| **TC ID** | TC-016-012 |
| **Type** | E2E |
| **Title** | `offline-import-error` is NOT visible when app is online |

**Preconditions:**
- Dev server running; network is online.

**Steps:**
1. `await page.goto('/import')`.
2. Query `[data-testid="offline-import-error"]`.

**Expected Result:**
- `[data-testid="offline-import-error"]` is NOT visible in the DOM.

**AC Reference:** AC5

---

### TC-016-013

| Field | Value |
|---|---|
| **TC ID** | TC-016-013 |
| **Type** | E2E |
| **Title** | Import file input is ENABLED when app is online |

**Preconditions:**
- Dev server running; network is online.

**Steps:**
1. `await page.goto('/import')`.
2. `await expect(page.locator('input[type="file"]')).not.toBeDisabled()`.

**Expected Result:**
- `input[type="file"]` is not disabled.

**AC Reference:** AC5, C4

---

### TC-016-014

| Field | Value |
|---|---|
| **TC ID** | TC-016-014 |
| **Type** | E2E |
| **Title** | Regression: existing Sprint 1 and Sprint 2 E2E tests continue to pass with PWA code in place |

**Preconditions:**
- PWA changes (`@angular/pwa`, `ConnectivityService`, manifest, offline banner) are applied.
- Dev server running (`ng serve`, SW disabled in dev mode).

**Steps:**
1. Run the full Playwright E2E suite against `http://localhost:4200`.
2. Observe results for stories 001–011 spec files.

**Expected Result:**
- All Story 001–011 E2E tests pass with 0 failures.
- No regressions introduced by the PWA code changes.

**AC Reference:** AC8

---

## E2E Tests — MANUAL (Production Build Required)

---

### TC-016-015 — MANUAL

| Field | Value |
|---|---|
| **TC ID** | TC-016-015 |
| **Type** | E2E — **MANUAL** |
| **Title** | Service Worker caches Angular bundle assets on first production load |

> **Cannot be automated in CI:** Service Worker only activates in production builds; not available in `ng serve`.

**Steps:**
1. Build: `ng build --configuration production`.
2. Serve the `dist/` folder via a local HTTP server (e.g., `http-server`).
3. Open Chrome DevTools → Application → Service Workers.
4. Verify a Service Worker is registered and active.
5. Open Network tab, throttle to "Offline".
6. Reload the page.

**Expected Result:**
- Previously loaded pages (e.g., `/dashboard`) load from SW cache without network errors.
- Angular bundle assets are served from the SW cache.

**AC Reference:** AC3 (corrected)

---

### TC-016-016 — MANUAL

| Field | Value |
|---|---|
| **TC ID** | TC-016-016 |
| **Type** | E2E — **MANUAL** |
| **Title** | Dashboard renders offline using IndexedDB data (production build) |

> **Cannot be automated in CI:** Requires production build and real offline simulation.

**Steps:**
1. Load the production app at `/dashboard` while online; verify transactions load.
2. In Chrome DevTools → Network, set "Offline".
3. Navigate away and back to `/dashboard`.

**Expected Result:**
- Dashboard renders successfully showing previously loaded transaction data from IndexedDB.
- No "network error" page is shown.

**AC Reference:** AC4

---

### TC-016-017 — MANUAL

| Field | Value |
|---|---|
| **TC ID** | TC-016-017 |
| **Type** | E2E — **MANUAL** |
| **Title** | Chrome Lighthouse PWA audit score ≥ 80 on production build |

> **Cannot be automated in CI:** Lighthouse score is a manual verification gate only.

**Steps:**
1. Build: `ng build --configuration production`; deploy to Firebase preview.
2. Open Chrome → Lighthouse → Run PWA audit against the production URL.
3. Note the PWA score.

**Expected Result:**
- Lighthouse PWA score ≥ 80.

**AC Reference:** AC7, C9

---
