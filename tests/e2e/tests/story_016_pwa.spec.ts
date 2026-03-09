import { test, expect } from '@playwright/test';

/**
 * E2E Test Suite for Story #016: Progressive Web App (PWA) — Installable & Offline-Ready
 *
 * Story Reference:      docs/stories/story_016_Progressive_Web_App.md
 * Test Cases Reference: docs/testcases/story_016_Progressive_Web_App_testcases.md
 *
 * Automatable tests (run against `ng serve`, SW DISABLED in dev mode):
 *   TC-016-011: offline-banner NOT visible when online (regression ← ConnectivityService)
 *   TC-016-012: offline-import-error NOT visible when online
 *   TC-016-013: file input for import is ENABLED when online
 *   TC-016-014: Regression — existing tests continue to pass (documented; not re-run here)
 *
 * SKIPPED (require production build / Service Worker):
 *   TC-016-015: SW caches Angular bundle assets on first load
 *   TC-016-016: Dashboard renders offline using IndexedDB data
 *   TC-016-017: Lighthouse PWA audit score ≥ 80
 *
 * ⚠️ Service Worker is intentionally DISABLED in `ng serve` development mode.
 * Any SW-dependent assertion is marked `test.skip()` with an explanatory comment.
 *
 * Prerequisites:
 *   - Angular dev server running on http://localhost:4200  (ng serve)
 *   - Network is available (CI / local machine is online)
 */

test.describe('Story #016: Progressive Web App (PWA)', () => {

  test.beforeEach(async ({ page }) => {
    page.on('console', msg =>
      console.log(`[BROWSER ${msg.type().toUpperCase()}] ${msg.text()}`)
    );
  });

  // ── TC-016-011: offline-banner is NOT visible when app loads online ───────────
  test('TC-016-011: offline-banner is NOT visible when the app is online (dev build)', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Allow Angular change detection to settle
    await page.waitForTimeout(1000);

    // Regression guard for ConnectivityService initialisation:
    // offline-banner must NOT be shown when the host machine is online.
    await expect(page.locator('[data-testid="offline-banner"]'))
      .not.toBeVisible({ timeout: 5000 });
  });

  // ── TC-016-012: offline-import-error is NOT visible when online ───────────────
  test('TC-016-012: offline-import-error is NOT visible on import page when online', async ({ page }) => {
    await page.goto('/import');
    await expect(page).toHaveTitle(/MoneyInsight/);
    await page.waitForLoadState('networkidle');

    // The offline error banner/message for the import screen must not appear
    await expect(page.locator('[data-testid="offline-import-error"]'))
      .not.toBeVisible({ timeout: 5000 });
  });

  // ── TC-016-013: file input for import is ENABLED when online ─────────────────
  test('TC-016-013: import file input is ENABLED when the app is online', async ({ page }) => {
    await page.goto('/import');
    await expect(page).toHaveTitle(/MoneyInsight/);
    await page.waitForLoadState('networkidle');

    // The file upload input must be usable (not disabled by offline guard)
    await expect(page.locator('input[type="file"]')).not.toBeDisabled({ timeout: 5000 });
  });

  // ── TC-016-015: SKIPPED — SW only active in production build ─────────────────
  test.skip('TC-016-015 (SW only — production build): Service Worker caches angular bundle assets', async () => {
    /**
     * SKIPPED: SW only active in production build.
     * Steps to run manually:
     *   1. ng build --configuration production
     *   2. npx http-server dist/client/browser -p 8080
     *   3. Open http://localhost:8080 in Chrome
     *   4. DevTools → Application → Service Workers → verify registered & active
     *   5. Network → throttle Offline → reload → verify assets served from cache
     */
  });

  // ── TC-016-016: SKIPPED — SW only active in production build ─────────────────
  test.skip('TC-016-016 (SW only — production build): Dashboard renders offline from IndexedDB cache', async () => {
    /**
     * SKIPPED: SW only active in production build.
     * This test requires both a production SW and an actual offline network simulation.
     * Perform manually against the production build.
     */
  });

  // ── TC-016-017: SKIPPED — Lighthouse audit requires production env ────────────
  test.skip('TC-016-017 (SW only — production build): Lighthouse PWA audit score ≥ 80', async () => {
    /**
     * SKIPPED: Lighthouse PWA audit is a manual gate.
     * Run against a production build deployed to Firebase Hosting or similar.
     */
  });

  // ── TC-016-014: Regression note ───────────────────────────────────────────────
  test.skip('TC-016-014 (REGRESSION, handled by full suite run): Sprint 1-2 E2E tests continue to pass', async () => {
    /**
     * The regression requirement is satisfied by running the full Playwright suite:
     *   npx playwright test
     * This skip entry documents the obligation without re-executing existing spec files.
     */
  });

});
