import { test, expect } from '@playwright/test';

/**
 * E2E Test Suite for Story #011: Mobile Responsive UI
 *
 * Story Reference: docs/stories/story_011_Mobile_Responsive_UI.md
 * Test Cases Reference: docs/testcases/story_011_Mobile_Responsive_UI_testcases.md
 *
 * Note: Unit and Component tests (TC-011-01 through TC-011-08, 10, 11) are Angular
 * TestBed tests and are not included in this Playwright E2E spec file.
 *
 * Prerequisites:
 *   - Angular dev server running on http://localhost:4200  (ng serve)
 *   - WASM engine built and deployed to src/client/public/
 */

test.describe('Story #011: Mobile Responsive UI', () => {

  test.beforeEach(async ({ page }) => {
    page.on('console', msg =>
      console.log(`[BROWSER ${msg.type().toUpperCase()}] ${msg.text()}`)
    );
  });

  // ── TC-011-09: /settings stub route loads with "Coming Soon" placeholder ─────
  test('TC-011-09: /settings stub route loads with "Coming Soon" placeholder', async ({ page }) => {
    // Step 1: Navigate to /settings
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');

    // Step 2: Verify page loaded without error
    await expect(page).toHaveTitle(/MoneyInsight/);

    // Step 3: Assert settings-placeholder element is present
    const placeholder = page.locator('[data-testid="settings-placeholder"]');
    await expect(placeholder).toBeVisible({ timeout: 10000 });

    // Step 4: Assert "Coming Soon" text is visible
    await expect(placeholder).toContainText('Coming Soon');

    // Step 5: Verify no router error or 404
    // (Title check above confirms the Angular app is running)
    const errorHeading = page.locator('h1').filter({ hasText: /cannot get|not found|404/i });
    await expect(errorHeading).toHaveCount(0);
  });

});
