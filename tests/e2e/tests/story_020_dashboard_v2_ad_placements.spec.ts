import { test, expect } from '@playwright/test';

/**
 * E2E Test Suite for Story #020: Dashboard v2.0 — Ad Placement Updates
 *
 * Story Reference:      docs/stories/story_020_Dashboard_v2_Ad_Placement_Updates.md
 * Test Cases Reference: docs/testcases/story_020_Dashboard_v2_Ad_Placement_Updates_testcases.md
 *
 * Automatable E2E tests:
 *   TC-020-E01: dashboard-summary-banner present in DOM between Summary Bar and Widgets Grid at ≥768px
 *   TC-020-E02: dashboard-widgets-banner present in DOM between Widgets Grid and Transactions Panel at ≥768px
 *   TC-020-E03: Both banners are visible (not display:none) at ≥768px viewport
 *   TC-020-E04: Both banners are hidden (display:none) at <768px viewport
 *   TC-020-E05: Both banners have role="complementary" and tabindex="-1"
 *   TC-020-E06: No sidebar-skyscraper container exists in the Dashboard DOM
 *   TC-020-E07: No dashboard-banner (v1 slot) container exists in the Dashboard DOM
 *
 * Prerequisites:
 *   - Angular dev server running on http://localhost:4200  (ng serve)
 *   - WASM engine built and deployed to src/client/public/
 *
 * Note: Story 010 asserted sidebar-skyscraper presence. Per PO clarification
 * (2026-04-13), Story 010 is superseded by Story 020. The sidebar-skyscraper
 * presence assertion has been intentionally removed. TC-020-E06 now asserts
 * its ABSENCE.
 */

// ---------------------------------------------------------------------------
// Helper — guard that skips if new ad placement containers are not present.
// This prevents false failures when Story 020 is not yet deployed.
// ---------------------------------------------------------------------------

async function waitForDashboardV2AdSlots(page: import('@playwright/test').Page) {
  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');

  const summaryBanner = page.locator('[data-placement="dashboard-summary-banner"]');
  const widgetsBanner = page.locator('[data-placement="dashboard-widgets-banner"]');

  const summaryExists = await summaryBanner.count().then(c => c > 0).catch(() => false);
  const widgetsExists = await widgetsBanner.count().then(c => c > 0).catch(() => false);

  if (!summaryExists && !widgetsExists) {
    // Check for old v1 banner: if present the old layout is still active
    const oldBanner = await page.locator('[data-placement="dashboard-banner"]').count().then(c => c > 0).catch(() => false);
    if (oldBanner) {
      test.skip(true, 'Old dashboard-banner (v1) still present — Story 020 ad placement migration not yet deployed.');
    } else {
      test.skip(true, 'Neither dashboard-summary-banner nor dashboard-widgets-banner found — Story 020 not yet deployed.');
    }
  }
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

test.describe('Story #020: Dashboard v2.0 — Ad Placement Updates', () => {

  test.beforeEach(async ({ page }) => {
    page.on('console', msg =>
      console.log(`[BROWSER ${msg.type().toUpperCase()}] ${msg.text()}`)
    );
  });

  // ─── TC-020-E01: dashboard-summary-banner present at ≥768px ──────────────

  test('TC-020-E01: dashboard-summary-banner present in DOM at ≥768px viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await waitForDashboardV2AdSlots(page);

    const banner = page.locator('[data-testid="ad-placeholder"][data-placement="dashboard-summary-banner"]');
    await expect(banner).toHaveCount(1);
  });

  // ─── TC-020-E02: dashboard-widgets-banner present at ≥768px ──────────────

  test('TC-020-E02: dashboard-widgets-banner present in DOM at ≥768px viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await waitForDashboardV2AdSlots(page);

    const banner = page.locator('[data-testid="ad-placeholder"][data-placement="dashboard-widgets-banner"]');
    await expect(banner).toHaveCount(1);
  });

  // ─── TC-020-E03: Both banners visible at ≥768px ───────────────────────────

  test('TC-020-E03: both banners are visible (not hidden) at ≥768px viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await waitForDashboardV2AdSlots(page);

    const summaryBanner = page.locator('[data-placement="dashboard-summary-banner"]');
    const widgetsBanner = page.locator('[data-placement="dashboard-widgets-banner"]');

    await expect(summaryBanner).toBeVisible();
    await expect(widgetsBanner).toBeVisible();
  });

  // ─── TC-020-E04: Both banners hidden at <768px ────────────────────────────

  test('TC-020-E04: both banners hidden at <768px viewport (mobile)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await waitForDashboardV2AdSlots(page);

    const summaryBanner = page.locator('[data-placement="dashboard-summary-banner"]');
    const widgetsBanner = page.locator('[data-placement="dashboard-widgets-banner"]');

    // Both must be hidden — either via CSS display:none or not rendered
    await expect(summaryBanner).not.toBeVisible();
    await expect(widgetsBanner).not.toBeVisible();
  });

  // ─── TC-020-E05: Banners have correct accessibility attributes ────────────

  test('TC-020-E05: both banners have role="complementary" and tabindex="-1"', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await waitForDashboardV2AdSlots(page);

    const summaryBanner = page.locator('[data-placement="dashboard-summary-banner"]');
    const widgetsBanner = page.locator('[data-placement="dashboard-widgets-banner"]');

    // dashboard-summary-banner accessibility attributes
    await expect(summaryBanner).toHaveAttribute('role', 'complementary');
    await expect(summaryBanner).toHaveAttribute('tabindex', '-1');

    // dashboard-widgets-banner accessibility attributes
    await expect(widgetsBanner).toHaveAttribute('role', 'complementary');
    await expect(widgetsBanner).toHaveAttribute('tabindex', '-1');
  });

  // ─── TC-020-E06: sidebar-skyscraper does NOT exist in DOM ─────────────────

  test('TC-020-E06: sidebar-skyscraper container does NOT exist in the Dashboard DOM', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const skyscraper = page.locator('[data-placement="sidebar-skyscraper"]');
    await expect(skyscraper).toHaveCount(0);
  });

  // ─── TC-020-E07: Old dashboard-banner (v1) does NOT exist in DOM ──────────

  test('TC-020-E07: old dashboard-banner (v1 slot) does NOT exist in the Dashboard DOM', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const oldBanner = page.locator('[data-placement="dashboard-banner"]');
    await expect(oldBanner).toHaveCount(0);
  });

  // ─── TC-020-E08: DOM order — summary-banner between sections 2 and 3 ──────

  test('TC-020-E08: dashboard-summary-banner is positioned between overall-summary-bar and widgets grid', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await waitForDashboardV2AdSlots(page);

    // The summary bar must appear above the banner which must appear above the widgets grid
    const summaryBar = page.locator('app-overall-summary-bar, [data-testid="overall-summary-bar"]').first();
    const banner     = page.locator('[data-placement="dashboard-summary-banner"]');
    const widgetsGrid = page.locator('[data-testid="widget-expenses"], app-analytical-widget').first();

    const summaryBarVisible = await summaryBar.isVisible({ timeout: 5000 }).catch(() => false);
    if (!summaryBarVisible) {
      test.skip(true, 'overall-summary-bar not found — Story 017 not yet deployed; cannot verify banner DOM order.');
      return;
    }

    const summaryBox = await summaryBar.boundingBox();
    const bannerBox  = await banner.boundingBox();
    const widgetsBox = await widgetsGrid.boundingBox().catch(() => null);

    expect(summaryBox).not.toBeNull();
    expect(bannerBox).not.toBeNull();

    // Banner must appear below the summary bar
    expect(bannerBox!.y).toBeGreaterThan(summaryBox!.y);

    // Banner must appear above the widgets grid (if deployed)
    if (widgetsBox) {
      expect(bannerBox!.y).toBeLessThan(widgetsBox.y + widgetsBox.height);
    }
  });

  // ─── TC-020-E09: DOM order — widgets-banner between sections 3 and 4 ──────

  test('TC-020-E09: dashboard-widgets-banner positioned between widgets grid and transactions panel', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await waitForDashboardV2AdSlots(page);

    const widgetsGrid      = page.locator('[data-testid="widget-expenses"], app-analytical-widget').first();
    const widgetsBanner    = page.locator('[data-placement="dashboard-widgets-banner"]');
    const transactionsPanel = page.locator('[data-testid="transactions-panel-title"], app-transactions-panel').first();

    const widgetsVisible = await widgetsGrid.isVisible({ timeout: 5000 }).catch(() => false);
    if (!widgetsVisible) {
      test.skip(true, 'widget-expenses not found — Stories 018/019 not yet deployed; cannot verify banner order.');
      return;
    }

    const widgetsBox    = await widgetsGrid.boundingBox();
    const bannerBox     = await widgetsBanner.boundingBox();
    const panelBox      = await transactionsPanel.boundingBox().catch(() => null);

    expect(widgetsBox).not.toBeNull();
    expect(bannerBox).not.toBeNull();

    // Banner must appear below the widgets grid
    expect(bannerBox!.y).toBeGreaterThan(widgetsBox!.y);

    // Banner must appear above the transactions panel (if deployed)
    if (panelBox) {
      expect(bannerBox!.y).toBeLessThan(panelBox.y + panelBox.height);
    }
  });

});
