import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * E2E Test Suite for Story #008: Full Transactions Review Screen
 *
 * Story Reference: docs/stories/story_008_Full_Transactions_Review_Screen.md
 * Test Cases Reference: docs/testcases/story_008_Full_Transactions_Review_Screen_testcases.md
 *
 * Note: Unit and Component tests (TC-008-02 through TC-008-13) are Angular
 * TestBed tests and are not included in this Playwright E2E spec file.
 *
 * Prerequisites:
 *   - Angular dev server running on http://localhost:4200  (ng serve)
 *   - WASM engine built and deployed to src/client/public/
 */

const TEST_DATA_DIR = path.join(__dirname, '../../../docs/testcases/story_001_testdata');
const VALID_FILE = 'SA3234_FY2025_20251221.xls';

test.describe('Story #008: Full Transactions Review Screen', () => {

  test.beforeEach(async ({ page }) => {
    page.on('console', msg =>
      console.log(`[BROWSER ${msg.type().toUpperCase()}] ${msg.text()}`)
    );
  });

  // ── TC-008-01: /transactions route loads TransactionsListComponent ───────────
  test('TC-008-01: /transactions route loads TransactionsListComponent', async ({ page }) => {
    // Step 1: Navigate directly to /transactions
    await page.goto('/transactions');
    await expect(page).toHaveTitle(/MoneyInsight/);
    await page.waitForLoadState('networkidle');

    // Step 2: Assert either the transactions table or empty state is visible
    // (TransactionsListComponent renders one of these — proves the component loaded)
    const table = page.locator('[data-testid="transactions-table"]');
    const emptyState = page.locator('[data-testid="transactions-empty-state"]');

    await Promise.race([
      table.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {}),
      emptyState.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {}),
    ]);

    const tableVisible = await table.isVisible().catch(() => false);
    const emptyVisible = await emptyState.isVisible().catch(() => false);

    // One of these must be visible — proves TransactionsListComponent loaded
    expect(tableVisible || emptyVisible).toBe(true);

    // Step 3: No router error (404 / error page) — verify title still shows MoneyInsight
    await expect(page).toHaveTitle(/MoneyInsight/);
  });

  // ── TC-008-14: Sidebar nav link for /transactions navigates correctly ─────────
  test('TC-008-14: Sidebar nav link for /transactions is present and works', async ({ page }) => {
    // Step 1: Navigate to dashboard at desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Step 2: Locate the sidebar navigation
    const sidebarNav = page.locator('[data-testid="sidebar-nav"]');
    await expect(sidebarNav).toBeVisible({ timeout: 10000 });

    // Step 3: Find and click the Transactions link
    const transactionsLink = sidebarNav.locator('a[href="/transactions"]');
    await expect(transactionsLink).toBeVisible({ timeout: 5000 });
    await transactionsLink.click();

    // Step 4: Wait for navigation to /transactions
    await page.waitForURL('**/transactions', { timeout: 10000 });
    expect(page.url()).toContain('/transactions');

    // Step 5: Verify TransactionsListComponent rendered
    const table = page.locator('[data-testid="transactions-table"]');
    const emptyState = page.locator('[data-testid="transactions-empty-state"]');

    await Promise.race([
      table.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {}),
      emptyState.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {}),
    ]);

    const tableVisible = await table.isVisible().catch(() => false);
    const emptyVisible = await emptyState.isVisible().catch(() => false);
    expect(tableVisible || emptyVisible).toBe(true);
  });

  // ── TC-008-15: Mobile (<768px) shows transaction-card; not transaction-row ────
  test('TC-008-15: Mobile (<768px) shows transaction-card instead of transaction-row', async ({ page }) => {
    // Step 1: Seed data via import flow
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/import');
    await expect(page).toHaveTitle(/MoneyInsight/);

    const filePath = path.join(TEST_DATA_DIR, VALID_FILE);
    await page.locator('input[type="file"]').setInputFiles(filePath);

    // Wait for import to complete
    await expect(
      page.locator('[data-testid="upload-success"]')
    ).toBeVisible({ timeout: 30000 });

    // Step 2: Navigate to /transactions at mobile viewport
    await page.goto('/transactions');
    await page.waitForLoadState('networkidle');

    // Step 3: Wait for data to load
    const card = page.locator('[data-testid="transaction-card"]').first();
    await card.waitFor({ state: 'visible', timeout: 10000 });

    // Step 4: Assert transaction-card elements are present
    const cardCount = await page.locator('[data-testid="transaction-card"]').count();
    expect(cardCount).toBeGreaterThan(0);

    // Step 5: Assert transaction-row elements are NOT visible
    // (desktop table is hidden via CSS .desktop-only at <768px — rows may still
    //  be in the DOM but must not be visible to the user)
    const firstRow = page.locator('[data-testid="transaction-row"]').first();
    const rowExists = await firstRow.count() > 0;
    if (rowExists) {
      await expect(firstRow).not.toBeVisible();
    }

    // Step 6: Verify card content includes required fields
    const firstCard = page.locator('[data-testid="transaction-card"]').first();
    await expect(firstCard.locator('[data-testid="txn-narration"]')).toBeVisible();
    await expect(firstCard.locator('[data-testid="txn-amount"]')).toBeVisible();
    await expect(firstCard.locator('[data-testid="txn-date"]')).toBeVisible();
    await expect(firstCard.locator('[data-testid="txn-category"]')).toBeVisible();
  });

});
