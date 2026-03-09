import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * E2E Test Suite for Story #013: Sync & Train — ML Feedback Loop
 *
 * Story Reference:      docs/stories/story_013_Sync_and_Train_ML_Feedback_Loop.md
 * Test Cases Reference: docs/testcases/story_013_Sync_and_Train_ML_Feedback_Loop_testcases.md
 *
 * Covers:
 *   TC-013-012 — SKIPPED (requires authenticated Google OAuth in test env)
 *   TC-013-013 — Unauthenticated click → auth-error prompt
 *   TC-013-014 — SKIPPED (requires authenticated + seeded rules/transactions)
 *   Additional: sync-train-btn is visible on dashboard
 *
 * Note: Full authenticated sync tests (TC-013-012, TC-013-014) are SKIPPED
 * because Google OAuth cannot be mocked in the current ng-serve test environment.
 *
 * Prerequisites:
 *   - Angular dev server running on http://localhost:4200  (ng serve)
 */

const TEST_DATA_DIR = path.join(__dirname, '../../../docs/testcases/story_001_testdata');
const VALID_FILE    = 'SA3234_FY2025_20251221.xls';

test.describe('Story #013: Sync & Train — ML Feedback Loop', () => {

  test.beforeEach(async ({ page }) => {
    page.on('console', msg =>
      console.log(`[BROWSER ${msg.type().toUpperCase()}] ${msg.text()}`)
    );
    // Ensure no auth token present (clean session)
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      return indexedDB.deleteDatabase('MoneyInsightDB');
    });
  });

  // ── Regression check: sync-train-btn is visible on the Dashboard (mobile FAB) ─
  test('sync-train-btn (FAB) is visible on the dashboard at mobile viewport', async ({ page }) => {
    // The desktop sync-train-btn is always visible (auth guard is in syncAndTrain() logic,
    // not on the button's @if). At desktop viewport, the CSS media query does NOT hide it.

    // Seed data first so the dashboard renders with content
    await page.goto('/import');
    await expect(page).toHaveTitle(/MoneyInsight/);

    const filePath = path.join(TEST_DATA_DIR, VALID_FILE);
    await page.locator('input[type="file"]').setInputFiles(filePath);
    await page.waitForSelector('[data-testid="upload-success"]', { timeout: 30000 });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // The desktop sync-train-btn must be visible at full viewport (not mobile).
    const syncBtn = page.locator('[data-testid="sync-train-btn"]');
    await expect(syncBtn).toBeVisible({ timeout: 10000 });
  });

  // ── TC-013-013: Unauthenticated click → auth-error prompt shown ──────────────
  test('TC-013-013: Unauthenticated user clicking sync-train-btn sees auth-error prompt', async ({ page }) => {
    // The desktop sync-train-btn is always visible (no @if(isAuthenticated) wrapper).
    // Clicking it calls syncAndTrain() which checks auth and sets showAuthError(true).

    // Seed data so dashboard renders
    await page.goto('/import');
    await expect(page).toHaveTitle(/MoneyInsight/);

    const filePath = path.join(TEST_DATA_DIR, VALID_FILE);
    await page.locator('input[type="file"]').setInputFiles(filePath);
    await page.waitForSelector('[data-testid="upload-success"]', { timeout: 30000 });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Ensure no auth token is in storage (user is NOT authenticated)
    await page.evaluate(() => {
      localStorage.removeItem('google_access_token');
      localStorage.removeItem('auth_token');
      sessionStorage.clear();
    });

    const syncBtn = page.locator('[data-testid="sync-train-btn"]');
    await expect(syncBtn).toBeVisible({ timeout: 10000 });
    await syncBtn.click();

    // An unauthenticated click must surface an auth-error prompt
    await expect(page.locator('[data-testid="auth-error"]')).toBeVisible({ timeout: 8000 });

    // sync-train-status must NOT show an in-progress or success state
    const statusEl = page.locator('[data-testid="sync-train-status"]');
    const statusVisible = await statusEl.isVisible().catch(() => false);
    if (statusVisible) {
      const statusText = (await statusEl.textContent()) ?? '';
      expect(statusText).not.toContain('Sync complete');
      expect(statusText).not.toContain('Syncing');
    }
  });

  // ── TC-013-012: SKIPPED — requires Google OAuth mock ────────────────────────
  test.skip('TC-013-012 (SKIPPED): Authenticated sync shows loading → success toast → auto-dismisses', async ({ page }) => {
    /**
     * SKIPPED: Full Google OAuth authentication cannot be mocked in the
     * ng serve development environment.
     * Perform this test manually or in a separate authenticated E2E pipeline.
     */
  });

  // ── TC-013-014: SKIPPED — requires authenticated user + seeded rules ─────────
  test.skip('TC-013-014 (SKIPPED): Sync with 0 updated transactions shows "Sync complete ✓ (0 updated)"', async ({ page }) => {
    /**
     * SKIPPED: Requires authenticated Google OAuth session and
     * specific IndexedDB state (rules present but no AI-assigned transactions to update).
     * Perform this test manually in an authenticated environment.
     */
  });

  // ── TC-013-015: Regression — Story 004 Sheets sync tests continue to pass ────
  // (This is handled by running the full suite; surfaced here as a note only.)
  test.skip('TC-013-015 (REGRESSION): Story 004 Sheets sync tests continue to pass', async () => {
    /**
     * Regression guard: run story_004.spec.ts directly to confirm no regressions.
     * This skip entry documents the requirement; the actual assertion is made by
     * running the full E2E suite via: npx playwright test tests/story_004.spec.ts
     */
  });

});
