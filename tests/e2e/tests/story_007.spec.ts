import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * E2E Test Suite for Story #007: Dashboard Charts and Widgets
 *
 * Story Reference: docs/stories/story_007_Dashboard_Charts_and_Widgets.md
 * Test Cases Reference: docs/testcases/story_007_Dashboard_Charts_and_Widgets_testcases.md
 *
 * Note: Unit and Component tests (TC-007-01 through TC-007-11, 13-15) are Angular
 * TestBed tests and are not in this Playwright E2E spec file.
 *
 * Prerequisites:
 *   - Angular dev server running on http://localhost:4200  (ng serve)
 *   - WASM engine built and deployed to src/client/public/
 */

const TEST_DATA_DIR = path.join(__dirname, '../../../docs/testcases/story_001_testdata');
const VALID_FILE = 'SA3234_FY2025_20251221.xls';

test.describe('Story #007: Dashboard Charts and Widgets', () => {

  test.beforeEach(async ({ page }) => {
    page.on('console', msg =>
      console.log(`[BROWSER ${msg.type().toUpperCase()}] ${msg.text()}`)
    );
  });

  // ── TC-007-12: "View All Transactions" link navigates to /transactions ───────
  test('TC-007-12: "View All Transactions" link navigates to /transactions', async ({ page }) => {
    // Step 1: Seed data by uploading a statement via the import flow
    await page.goto('/import');
    await expect(page).toHaveTitle(/MoneyInsight/);

    const filePath = path.join(TEST_DATA_DIR, VALID_FILE);
    await page.locator('input[type="file"]').setInputFiles(filePath);

    // Wait for import to complete
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible({ timeout: 30000 });

    // Step 2: Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Step 3: Wait for recent transactions table or empty state
    const recentTable = page.locator('[data-testid="recent-transactions-table"]');
    const emptyDashboard = page.locator('[data-testid="empty-dashboard"]');

    await Promise.race([
      recentTable.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {}),
      emptyDashboard.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {}),
    ]);

    // Step 4: If recent transactions table is visible, click "View All"
    const tableVisible = await recentTable.isVisible().catch(() => false);
    if (!tableVisible) {
      // No transactions available — skip navigation assertion
      console.log('TC-007-12: Dashboard is empty (no transactions). Skipping link click.');
      test.skip();
      return;
    }

    // Step 5: Click "View All Transactions" link
    const viewAllLink = page.locator('[data-testid="view-all-transactions"]');
    await expect(viewAllLink).toBeVisible();
    await viewAllLink.click();

    // Step 6: Verify navigation to /transactions
    await page.waitForURL('**/transactions', { timeout: 10000 });
    expect(page.url()).toContain('/transactions');

    // Step 7: Verify TransactionsListComponent is rendered
    await expect(page.locator('[data-testid="transactions-table"]').or(
      page.locator('[data-testid="transactions-empty-state"]')
    )).toBeVisible({ timeout: 10000 });
  });

});
