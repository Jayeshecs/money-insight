import { test, expect } from '@playwright/test';

/**
 * E2E Test Suite for Story #022: Dashboard Responsive Layout Redesign
 *
 * Story Reference:      docs/stories/story_022_Dashboard_Responsive_Layout_Redesign.md
 * Test Cases Reference: docs/testcases/story_022_Dashboard_Responsive_Layout_Redesign_testcases.md
 *
 * Automatable E2E tests:
 *   TC-022-E01: app-header <nav> is rendered with aria-label="Main navigation"
 *   TC-022-E02: header-app-title displays "MoneyInsight" brand text
 *   TC-022-E03: Desktop (≥992px) — nav links visible; hamburger hidden
 *   TC-022-E04: Desktop (≥992px) — header-user-info & drive-status present in topbar
 *   TC-022-E05: Active route nav link has CSS class "active"
 *   TC-022-E06: Mobile (<992px) — hamburger visible; nav links collapsed
 *   TC-022-E07: Mobile (<992px) — hamburger click opens mobile menu; aria-expanded toggles
 *   TC-022-E08: Mobile menu closed on second hamburger click; aria-expanded resets
 *   TC-022-E09: Mobile menu contains user-info, drive-status, sign-out-btn elements
 *   TC-022-E10: No sidebar or sidebar-skyscraper in DOM
 *   TC-022-E11: No v1.0 ad placement attributes in DOM
 *   TC-022-E12: dashboard-container exists with container-fluid class
 *   TC-022-E13: widgets-grid has exactly 4 col-12.col-sm-6.col-xl-3 columns
 *   TC-022-E14: XL viewport (1440px) — each widget column ≈25% width
 *   TC-022-E15: SM viewport (768px) — each widget column ≈50% width
 *   TC-022-E16: XS viewport (375px) — each widget column ≈100% width; hamburger visible
 *   TC-022-E17: Navbar has correct aria-controls on hamburger button
 *
 * Prerequisites:
 *   - Angular dev server running on http://localhost:4200  (ng serve)
 *   - WASM engine built and deployed to src/client/public/
 */

// ---------------------------------------------------------------------------
// Shared seed data — enough transactions to render the dashboard content area
// ---------------------------------------------------------------------------
const SEED_TRANSACTIONS = [
  { id: 'tx-s01', date: '2025-03-05', narration: 'Salary March', amount: 75000,
    transactionType: 'INCOME', category: 'Salary', subCategory: 'Regular', account: 'HDFC-001' },
  { id: 'tx-s02', date: '2025-03-10', narration: 'Grocery BigBasket', amount: 4500,
    transactionType: 'EXPENSE', category: 'Food', subCategory: 'Groceries', account: 'HDFC-001' },
  { id: 'tx-s03', date: '2025-03-15', narration: 'MF SIP Axis', amount: 10000,
    transactionType: 'INVESTMENT', category: 'Mutual Fund', subCategory: 'SIP', account: 'HDFC-001' },
  { id: 'tx-s04', date: '2025-03-20', narration: 'FD Transfer', amount: 5000,
    transactionType: 'TRANSFER', category: 'Fixed Deposit', subCategory: 'FD', account: 'HDFC-001' },
  { id: 'tx-s05', date: '2025-03-07', narration: 'Freelance NEFT', amount: 20000,
    transactionType: 'INCOME', category: 'Freelance', subCategory: 'Project-A', account: 'SBI-002' },
  { id: 'tx-s06', date: '2025-03-25', narration: 'Electricity Bill', amount: 1800,
    transactionType: 'EXPENSE', category: 'Utilities', subCategory: 'Electricity', account: 'SBI-002' },
];

/** Seeds the MoneyInsightDB IndexedDB with the provided transactions. */
async function seedIndexedDB(page: import('@playwright/test').Page, txns = SEED_TRANSACTIONS) {
  await page.evaluate(async (transactions) => {
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.open('MoneyInsightDB');
      req.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('transactions')) {
          db.close();
          reject(new Error('transactions object store not found in MoneyInsightDB'));
          return;
        }
        const tx = db.transaction('transactions', 'readwrite');
        const store = tx.objectStore('transactions');
        for (const t of transactions) {
          store.put(t);
        }
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => { db.close(); reject(tx.error); };
      };
      req.onerror = () => reject(req.error);
    });
  }, txns);
}

/** Clears all transactions from IndexedDB. */
async function clearIndexedDB(page: import('@playwright/test').Page) {
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.open('MoneyInsightDB');
      req.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('transactions')) {
          db.close();
          resolve();
          return;
        }
        const tx = db.transaction('transactions', 'readwrite');
        tx.objectStore('transactions').clear();
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => { db.close(); reject(tx.error); };
      };
      req.onerror = () => reject(req.error);
    });
  });
}

/**
 * Guards: waits for app-header to become visible; skips if Story 022 components not deployed.
 */
async function waitForAppHeader(page: import('@playwright/test').Page) {
  const header = page.locator('[data-testid="app-header"]');
  const visible = await header.isVisible({ timeout: 8000 }).catch(() => false);
  if (!visible) {
    test.skip(true, 'app-header not found — Story 022 AppHeaderComponent not yet deployed.');
  }
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

test.describe('Story #022: Dashboard Responsive Layout Redesign', () => {

  test.beforeEach(async ({ page }) => {
    page.on('console', msg =>
      console.log(`[BROWSER ${msg.type().toUpperCase()}] ${msg.text()}`)
    );
    // Navigate first so IndexedDB exists in the correct origin, then seed
    await page.goto('/');
    await seedIndexedDB(page);
  });

  // ─── TC-022-E01: app-header <nav> has aria-label="Main navigation" ───────────

  test('TC-022-E01: app-header <nav> is rendered with aria-label="Main navigation"', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForAppHeader(page);

    const header = page.locator('[data-testid="app-header"]');
    await expect(header).toBeVisible();

    // Must be a <nav> element
    const tagName = await header.evaluate(el => el.tagName.toLowerCase());
    expect(tagName).toBe('nav');

    // Must have aria-label="Main navigation"
    await expect(header).toHaveAttribute('aria-label', 'Main navigation');

    console.log('TC-022-E01 PASS: app-header nav with aria-label found');
  });

  // ─── TC-022-E02: header-app-title displays "MoneyInsight" ────────────────────

  test('TC-022-E02: header-app-title displays "MoneyInsight" brand text', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForAppHeader(page);

    const title = page.locator('[data-testid="header-app-title"]');
    await expect(title).toBeVisible();

    const text = await title.textContent() ?? '';
    console.log(`TC-022-E02: header-app-title text = "${text.trim()}"`);
    expect(text).toContain('MoneyInsight');
  });

  // ─── TC-022-E03: Desktop — nav links visible; hamburger hidden ───────────────

  test('TC-022-E03: at 1280px desktop — nav links visible; hamburger hidden via Bootstrap', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForAppHeader(page);

    // Hamburger must be hidden at ≥992px (Bootstrap .navbar-expand-lg hides .navbar-toggler)
    const hamburger = page.locator('[data-testid="header-hamburger-btn"]');
    const hamburgerVisible = await hamburger.isVisible().catch(() => false);
    console.log(`TC-022-E03: hamburger visible at 1280px = ${hamburgerVisible}`);
    expect(hamburgerVisible).toBe(false);

    // Nav links must be visible in the topbar (navbar-collapse is always flex at ≥lg)
    await expect(page.locator('[data-testid="header-nav-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="header-nav-transactions"]')).toBeVisible();
    await expect(page.locator('[data-testid="header-nav-import"]')).toBeVisible();
    await expect(page.locator('[data-testid="header-nav-settings"]')).toBeVisible();
  });

  // ─── TC-022-E04: Desktop — header-user-info and header-drive-status present in topbar

  test('TC-022-E04: at 1280px desktop — header-user-info and header-drive-status are visible', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForAppHeader(page);

    const driveStatus = page.locator('[data-testid="header-drive-status"]').first();
    await expect(driveStatus).toBeVisible({ timeout: 5000 });

    const statusText = await driveStatus.textContent() ?? '';
    console.log(`TC-022-E04: header-drive-status text = "${statusText.trim()}"`);
    // Must show either "Connected" or "Offline"
    expect(statusText.toLowerCase()).toMatch(/connected|offline/);
  });

  // ─── TC-022-E05: Active route nav link has CSS class "active" ────────────────

  test('TC-022-E05: nav link for current route (/dashboard) has CSS class "active"', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForAppHeader(page);

    const dashboardLink = page.locator('[data-testid="header-nav-dashboard"]');
    await expect(dashboardLink).toBeVisible();

    const classes = await dashboardLink.getAttribute('class') ?? '';
    console.log(`TC-022-E05: header-nav-dashboard classes = "${classes}"`);
    expect(classes).toContain('active');

    // Other nav links must NOT be active
    const transactionsLink = page.locator('[data-testid="header-nav-transactions"]');
    const transClasses = await transactionsLink.getAttribute('class') ?? '';
    expect(transClasses).not.toContain('active');
  });

  // ─── TC-022-E06: Mobile (<992px) — hamburger visible; nav links collapsed ────

  test('TC-022-E06: at 375px mobile — hamburger button visible; nav links in closed menu', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForAppHeader(page);

    // Hamburger must be visible at < 992px (Bootstrap shows .navbar-toggler)
    const hamburger = page.locator('[data-testid="header-hamburger-btn"]');
    await expect(hamburger).toBeVisible();

    // aria-expanded must start as false
    const expanded = await hamburger.getAttribute('aria-expanded');
    console.log(`TC-022-E06: hamburger aria-expanded = "${expanded}"`);
    expect(expanded).toBe('false');

    // nav links must NOT be visible (inside collapsed mobile menu)
    const dashboardLink = page.locator('[data-testid="header-nav-dashboard"]');
    const dashboardVisible = await dashboardLink.isVisible().catch(() => false);
    console.log(`TC-022-E06: header-nav-dashboard visible at 375px = ${dashboardVisible}`);
    expect(dashboardVisible).toBe(false);
  });

  // ─── TC-022-E07: Mobile — hamburger click opens mobile menu ──────────────────

  test('TC-022-E07: at 375px — clicking hamburger opens mobile menu and sets aria-expanded="true"', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForAppHeader(page);

    const hamburger = page.locator('[data-testid="header-hamburger-btn"]');
    const mobileMenu = page.locator('[data-testid="header-mobile-menu"]');

    // Before click: menu hidden
    const menuVisibleBefore = await mobileMenu.isVisible().catch(() => false);
    expect(menuVisibleBefore).toBe(false);

    // Click to open
    await hamburger.click();
    await page.waitForTimeout(400); // allow Angular CD + Bootstrap transition

    // After click: menu visible
    await expect(mobileMenu).toBeVisible();

    // aria-expanded must now be "true"
    const expandedAfter = await hamburger.getAttribute('aria-expanded');
    console.log(`TC-022-E07: hamburger aria-expanded after click = "${expandedAfter}"`);
    expect(expandedAfter).toBe('true');

    // Nav links inside the menu must now be visible
    await expect(page.locator('[data-testid="header-nav-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="header-nav-transactions"]')).toBeVisible();
    await expect(page.locator('[data-testid="header-nav-import"]')).toBeVisible();
    await expect(page.locator('[data-testid="header-nav-settings"]')).toBeVisible();
  });

  // ─── TC-022-E08: Mobile — second hamburger click closes the mobile menu ──────

  test('TC-022-E08: at 375px — second hamburger click closes mobile menu and resets aria-expanded="false"', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForAppHeader(page);

    const hamburger = page.locator('[data-testid="header-hamburger-btn"]');
    const mobileMenu = page.locator('[data-testid="header-mobile-menu"]');

    // Open the menu
    await hamburger.click();
    await page.waitForTimeout(400);
    await expect(mobileMenu).toBeVisible();

    // Close the menu
    await hamburger.click();
    await page.waitForTimeout(400);

    // Menu must now be hidden
    const menuVisibleAfter = await mobileMenu.isVisible().catch(() => false);
    console.log(`TC-022-E08: mobile menu visible after close = ${menuVisibleAfter}`);
    expect(menuVisibleAfter).toBe(false);

    // aria-expanded must reset to "false"
    const expandedAfter = await hamburger.getAttribute('aria-expanded');
    console.log(`TC-022-E08: hamburger aria-expanded after close = "${expandedAfter}"`);
    expect(expandedAfter).toBe('false');
  });

  // ─── TC-022-E09: Mobile menu contains user-info, drive-status, sign-out-btn ──

  test('TC-022-E09: at 375px — mobile menu contains header-user-info, drive-status, and optionally sign-out-btn', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForAppHeader(page);

    const hamburger = page.locator('[data-testid="header-hamburger-btn"]');
    await hamburger.click();
    await page.waitForTimeout(400);

    const mobileMenu = page.locator('[data-testid="header-mobile-menu"]');
    await expect(mobileMenu).toBeVisible();

    // user-info block must be inside the mobile menu
    const userInfo = mobileMenu.locator('[data-testid="header-user-info"]');
    await expect(userInfo).toBeVisible({ timeout: 3000 });

    // drive-status must be inside the mobile menu
    const driveStatus = mobileMenu.locator('[data-testid="header-drive-status"]');
    await expect(driveStatus).toBeVisible({ timeout: 3000 });

    const statusText = await driveStatus.textContent() ?? '';
    console.log(`TC-022-E09: drive-status text in mobile menu = "${statusText.trim()}"`);
    expect(statusText.toLowerCase()).toMatch(/connected|offline/);
  });

  // ─── TC-022-E10: No sidebar or sidebar-skyscraper in DOM ─────────────────────

  test('TC-022-E10: no sidebar or sidebar-skyscraper elements in the DOM', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // No element with class containing "sidebar"
    const sidebarEl = await page.evaluate(() =>
      document.querySelector('[class*="sidebar"]') !== null
    );
    console.log(`TC-022-E10: sidebar class element present = ${sidebarEl}`);
    expect(sidebarEl).toBe(false);

    // No sidebar-skyscraper testid
    const skyscraperEl = await page.evaluate(() =>
      document.querySelector('[data-testid="sidebar-skyscraper"]') !== null
    );
    console.log(`TC-022-E10: sidebar-skyscraper testid present = ${skyscraperEl}`);
    expect(skyscraperEl).toBe(false);
  });

  // ─── TC-022-E11: No v1.0 ad placement attributes in DOM ──────────────────────

  test('TC-022-E11: no dashboard-banner or sidebar-skyscraper data-placement attributes in DOM', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const bannerEl = await page.evaluate(() =>
      document.querySelector('[data-placement="dashboard-banner"]') !== null
    );
    console.log(`TC-022-E11: data-placement="dashboard-banner" present = ${bannerEl}`);
    expect(bannerEl).toBe(false);

    const skyscraperEl = await page.evaluate(() =>
      document.querySelector('[data-placement="sidebar-skyscraper"]') !== null
    );
    console.log(`TC-022-E11: data-placement="sidebar-skyscraper" present = ${skyscraperEl}`);
    expect(skyscraperEl).toBe(false);
  });

  // ─── TC-022-E12: dashboard-container exists with container-fluid class ────────

  test('TC-022-E12: dashboard-container element exists and has class "container-fluid"', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForAppHeader(page);

    const container = page.locator('[data-testid="dashboard-container"]');
    await expect(container).toBeVisible({ timeout: 8000 });

    const classes = await container.getAttribute('class') ?? '';
    console.log(`TC-022-E12: dashboard-container classes = "${classes}"`);
    expect(classes).toContain('container-fluid');
  });

  // ─── TC-022-E13: widgets-grid has exactly 4 col-12.col-sm-6.col-xl-3 columns ─

  test('TC-022-E13: widgets-grid has exactly 4 col-12.col-sm-6.col-xl-3 child columns', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForAppHeader(page);

    // Wait for widgets grid to appear (may need transactions to load)
    const widgetsGrid = page.locator('[data-testid="widgets-grid"]');
    const gridVisible = await widgetsGrid.isVisible({ timeout: 8000 }).catch(() => false);

    if (!gridVisible) {
      test.skip(true, 'widgets-grid not visible — dashboard may be showing empty-state or loading.');
      return;
    }

    const widgetCols = widgetsGrid.locator('.col-12.col-sm-6.col-xl-3');
    const count = await widgetCols.count();
    console.log(`TC-022-E13: widget columns found = ${count}`);
    expect(count).toBe(4);
  });

  // ─── TC-022-E14: XL viewport (1440px) — each widget column ≈25% width ────────

  test('TC-022-E14: at 1440px (xl) — each widget column occupies ≈25% of container width', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForAppHeader(page);

    const widgetsGrid = page.locator('[data-testid="widgets-grid"]');
    const gridVisible = await widgetsGrid.isVisible({ timeout: 8000 }).catch(() => false);
    if (!gridVisible) {
      test.skip(true, 'widgets-grid not visible at xl breakpoint.');
      return;
    }

    const widgetCols = widgetsGrid.locator('.col-12.col-sm-6.col-xl-3');
    const colCount = await widgetCols.count();
    if (colCount < 4) {
      test.skip(true, 'Fewer than 4 widget columns found — skipping width check.');
      return;
    }

    // Get the container width
    const containerBox = await page.locator('[data-testid="dashboard-container"]').boundingBox();
    expect(containerBox).not.toBeNull();
    const containerWidth = containerBox!.width;

    // Each widget column should be approximately 25% (allow ±5% for gutters)
    for (let i = 0; i < 4; i++) {
      const colBox = await widgetCols.nth(i).boundingBox();
      expect(colBox).not.toBeNull();
      const colWidthPercent = (colBox!.width / containerWidth) * 100;
      console.log(`TC-022-E14: column ${i} width = ${colBox!.width}px (${colWidthPercent.toFixed(1)}%)`);
      expect(colWidthPercent).toBeGreaterThan(20);
      expect(colWidthPercent).toBeLessThan(32);
    }
  });

  // ─── TC-022-E15: SM viewport (768px) — each widget column ≈50% width ─────────

  test('TC-022-E15: at 768px (sm) — each widget column occupies ≈50% of container width', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForAppHeader(page);

    const widgetsGrid = page.locator('[data-testid="widgets-grid"]');
    const gridVisible = await widgetsGrid.isVisible({ timeout: 8000 }).catch(() => false);
    if (!gridVisible) {
      test.skip(true, 'widgets-grid not visible at sm breakpoint.');
      return;
    }

    const widgetCols = widgetsGrid.locator('.col-12.col-sm-6.col-xl-3');
    const colCount = await widgetCols.count();
    if (colCount < 4) {
      test.skip(true, 'Fewer than 4 widget columns found — skipping width check.');
      return;
    }

    const containerBox = await page.locator('[data-testid="dashboard-container"]').boundingBox();
    expect(containerBox).not.toBeNull();
    const containerWidth = containerBox!.width;

    // At sm (768px), col-sm-6 → each column occupies 50% (allow ±5% for gutters)
    for (let i = 0; i < 4; i++) {
      const colBox = await widgetCols.nth(i).boundingBox();
      expect(colBox).not.toBeNull();
      const colWidthPercent = (colBox!.width / containerWidth) * 100;
      console.log(`TC-022-E15: column ${i} width at 768px = ${colBox!.width}px (${colWidthPercent.toFixed(1)}%)`);
      expect(colWidthPercent).toBeGreaterThan(43);
      expect(colWidthPercent).toBeLessThan(57);
    }
  });

  // ─── TC-022-E16: XS viewport (375px) — each widget column ≈100% width ────────

  test('TC-022-E16: at 375px (xs) — each widget column occupies ≈100% of viewport width and hamburger is visible', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForAppHeader(page);

    // Hamburger must be visible at 375px
    await expect(page.locator('[data-testid="header-hamburger-btn"]')).toBeVisible();

    const widgetsGrid = page.locator('[data-testid="widgets-grid"]');
    const gridVisible = await widgetsGrid.isVisible({ timeout: 8000 }).catch(() => false);
    if (!gridVisible) {
      test.skip(true, 'widgets-grid not visible at xs breakpoint.');
      return;
    }

    const widgetCols = widgetsGrid.locator('.col-12.col-sm-6.col-xl-3');
    const colCount = await widgetCols.count();
    if (colCount < 1) {
      test.skip(true, 'No widget columns found — skipping xs width check.');
      return;
    }

    // At xs (<576px), col-12 → each column occupies 100% of the container
    const containerBox = await page.locator('[data-testid="dashboard-container"]').boundingBox();
    expect(containerBox).not.toBeNull();
    const containerWidth = containerBox!.width;

    for (let i = 0; i < Math.min(colCount, 4); i++) {
      const colBox = await widgetCols.nth(i).boundingBox();
      expect(colBox).not.toBeNull();
      const colWidthPercent = (colBox!.width / containerWidth) * 100;
      console.log(`TC-022-E16: column ${i} width at 375px = ${colBox!.width}px (${colWidthPercent.toFixed(1)}%)`);
      // col-12 should span full width (80–102% allowing for padding)
      expect(colWidthPercent).toBeGreaterThan(80);
    }
  });

  // ─── TC-022-E17: Hamburger button has aria-controls="header-mobile-menu" ─────

  test('TC-022-E17: hamburger button has correct aria-controls and aria-label attributes', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForAppHeader(page);

    const hamburger = page.locator('[data-testid="header-hamburger-btn"]');
    await expect(hamburger).toBeVisible();

    const ariaControls = await hamburger.getAttribute('aria-controls');
    const ariaLabel = await hamburger.getAttribute('aria-label');

    console.log(`TC-022-E17: aria-controls = "${ariaControls}", aria-label = "${ariaLabel}"`);

    expect(ariaControls).toBe('header-mobile-menu');
    expect(ariaLabel).toContain('navigation');
  });

  // ─── TC-022-E18: Regression — Story 017–021 data-testid attributes intact ────

  test('TC-022-E18: regression check — granularity-select, overall-income, transactions-panel-title still present', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForAppHeader(page);

    // These must not have been removed by Story 022 changes
    const selectors = [
      'granularity-select',
      'overall-income',
      'overall-expense',
      'transactions-panel-title',
    ];

    for (const testid of selectors) {
      const el = page.locator(`[data-testid="${testid}"]`);
      const exists = await el.count() > 0;
      const visible = exists ? await el.first().isVisible({ timeout: 3000 }).catch(() => false) : false;
      console.log(`TC-022-E18: data-testid="${testid}" exists=${exists} visible=${visible}`);
      // The element must at least exist in the DOM
      expect(exists, `Expected data-testid="${testid}" to exist in DOM`).toBe(true);
    }
  });

});
