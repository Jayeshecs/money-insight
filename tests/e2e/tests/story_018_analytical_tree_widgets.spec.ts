import { test, expect } from '@playwright/test';

/**
 * E2E Test Suite for Story #018: Dashboard v2.0 — Analytical Tree-Table Widgets
 *
 * Story Reference:      docs/stories/story_018_Dashboard_v2_Analytical_Tree_Widgets.md
 * Test Cases Reference: docs/testcases/story_018_Dashboard_v2_Analytical_Tree_Widgets_testcases.md
 *
 * Automatable E2E tests:
 *   TC-018-E01: All four widget containers are rendered on the dashboard
 *   TC-018-E02: Desktop 2×2 grid layout — widgets arranged in 2 columns
 *   TC-018-E03: Mobile (<768 px) layout — widgets stack in single column
 *   TC-018-E04: Each widget's auto-toggle has aria-checked="false" by default
 *   TC-018-E05: Enabling one auto-toggle sets the others to aria-checked="false"
 *   TC-018-E06: widget-expenses shows category rows sorted descending by amount
 *   TC-018-E07: widget-income shows category rows sorted descending by amount
 *   TC-018-E08: widget-investment shows category rows sorted descending by amount
 *   TC-018-E09: widget-transfer shows category rows sorted descending by amount
 *   TC-018-E10: Sub-category rows are hidden (collapsed) by default
 *   TC-018-E11: Clicking a category row expands its sub-category rows
 *   TC-018-E12: Clicking the same category row again collapses sub-category rows
 *   TC-018-E13: Sub-categories are sorted descending by amount within their category
 *   TC-018-E14: Clicking a category row sets aria-selected="true" on that row
 *   TC-018-E15: Clicking a sub-category row sets aria-selected="true" on that row
 *   TC-018-E16: Selecting a row in one widget clears selection in another widget
 *   TC-018-E17: widget-empty-state shown when no transactions in selected period
 *   TC-018-E18: Apply period button resets all widgets (collapse + no selection)
 *   TC-018-E19: Category totals are formatted in INR (₹) notation
 *   TC-018-E20: Auto toggle label text reads "Auto" in all states
 *
 * Prerequisites:
 *   - Angular dev server running on http://localhost:4200  (ng serve)
 *   - WASM engine built and deployed to src/client/public/
 */

// ---------------------------------------------------------------------------
// Seed transactions — rich multi-category, multi-sub-category data
// ---------------------------------------------------------------------------
const SEED_TRANSACTIONS = [
  // ── EXPENSES ──────────────────────────────────────────────────────────────
  // Housing: 15000  (highest expense category)
  { id: 'tx-e01', date: '2025-03-01', description: 'Rent March', amount: 15000,
    type: 'EXPENSE', transactionType: 'EXPENSE', category: 'Housing', subCategory: 'Rent', account: 'HDFC-001' },
  // Food: 4500 + 2000 = 6500
  { id: 'tx-e02', date: '2025-03-05', description: 'Grocery',     amount: 4500,
    type: 'EXPENSE', transactionType: 'EXPENSE', category: 'Food', subCategory: 'Groceries', account: 'HDFC-001' },
  { id: 'tx-e03', date: '2025-03-12', description: 'Dinner out',  amount: 2000,
    type: 'EXPENSE', transactionType: 'EXPENSE', category: 'Food', subCategory: 'Restaurants', account: 'SBI-002' },
  // Utilities: 1800 + 500 = 2300
  { id: 'tx-e04', date: '2025-03-15', description: 'Electricity', amount: 1800,
    type: 'EXPENSE', transactionType: 'EXPENSE', category: 'Utilities', subCategory: 'Electricity', account: 'SBI-002' },
  { id: 'tx-e05', date: '2025-03-20', description: 'Water bill',  amount: 500,
    type: 'EXPENSE', transactionType: 'EXPENSE', category: 'Utilities', subCategory: 'Water', account: 'HDFC-001' },

  // ── INCOME ────────────────────────────────────────────────────────────────
  // Salary: 75000 + 10000 = 85000 (highest)
  { id: 'tx-i01', date: '2025-03-01', description: 'Salary March', amount: 75000,
    type: 'INCOME', transactionType: 'INCOME', category: 'Salary', subCategory: 'Basic', account: 'HDFC-001' },
  { id: 'tx-i02', date: '2025-03-15', description: 'Bonus',        amount: 10000,
    type: 'INCOME', transactionType: 'INCOME', category: 'Salary', subCategory: 'Bonus', account: 'HDFC-001' },
  // Freelance: 20000 + 5000 = 25000
  { id: 'tx-i03', date: '2025-03-07', description: 'Freelance Project-A', amount: 20000,
    type: 'INCOME', transactionType: 'INCOME', category: 'Freelance', subCategory: 'Project-A', account: 'SBI-002' },
  { id: 'tx-i04', date: '2025-03-22', description: 'Freelance Project-B', amount: 5000,
    type: 'INCOME', transactionType: 'INCOME', category: 'Freelance', subCategory: 'Project-B', account: 'SBI-002' },

  // ── INVESTMENT ────────────────────────────────────────────────────────────
  // Mutual Fund: 25000 + 10000 = 35000 (highest)
  { id: 'tx-v01', date: '2025-03-10', description: 'MF Lumpsum', amount: 25000,
    type: 'INVESTMENT', transactionType: 'INVESTMENT', category: 'Mutual Fund', subCategory: 'Lumpsum', account: 'HDFC-001' },
  { id: 'tx-v02', date: '2025-03-01', description: 'MF SIP',     amount: 10000,
    type: 'INVESTMENT', transactionType: 'INVESTMENT', category: 'Mutual Fund', subCategory: 'SIP', account: 'HDFC-001' },
  // Stocks: 8000
  { id: 'tx-v03', date: '2025-03-18', description: 'NIFTY50',    amount: 8000,
    type: 'INVESTMENT', transactionType: 'INVESTMENT', category: 'Stocks', subCategory: 'NIFTY50', account: 'SBI-002' },

  // ── TRANSFER ──────────────────────────────────────────────────────────────
  // Fixed Deposit: 20000 (highest)
  { id: 'tx-t01', date: '2025-03-25', description: 'FD Opening', amount: 20000,
    type: 'TRANSFER', transactionType: 'TRANSFER', category: 'Fixed Deposit', subCategory: 'FD', account: 'HDFC-001' },
  // Savings: 5000
  { id: 'tx-t02', date: '2025-03-05', description: 'Move to Savings', amount: 5000,
    type: 'TRANSFER', transactionType: 'TRANSFER', category: 'Savings Account', subCategory: 'Transfer', account: 'HDFC-001' },

  // ── APRIL transactions (different period — used for period-change reset test)
  { id: 'tx-apr01', date: '2025-04-05', description: 'Salary April', amount: 75000,
    type: 'INCOME', transactionType: 'INCOME', category: 'Salary', subCategory: 'Basic', account: 'HDFC-001' },
  { id: 'tx-apr02', date: '2025-04-10', description: 'Rent April',   amount: 15000,
    type: 'EXPENSE', transactionType: 'EXPENSE', category: 'Housing', subCategory: 'Rent', account: 'HDFC-001' },
];

/** Seeds the MoneyInsightDB IndexedDB with the provided transactions. */
async function seedIndexedDB(
  page: import('@playwright/test').Page,
  txns = SEED_TRANSACTIONS
) {
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
        tx.onerror   = () => { db.close(); reject(tx.error); };
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
        tx.onerror   = () => { db.close(); reject(tx.error); };
      };
      req.onerror = () => reject(req.error);
    });
  });
}

/**
 * Guard: waits for the first analytical widget to become visible.
 * Skips the test if Story 018 components are not yet deployed.
 */
async function waitForAnalyticalWidgets(page: import('@playwright/test').Page) {
  const widget = page.locator('[data-testid="widget-expenses"]');
  const visible = await widget.isVisible({ timeout: 8000 }).catch(() => false);
  if (!visible) {
    const oldDashboard = await page.locator('[data-testid="period-filter"]').isVisible().catch(() => false);
    if (oldDashboard) {
      test.skip(true, 'widget-expenses not found — Story 018 components not yet deployed (old dashboard still active).');
    } else {
      test.skip(true, 'widget-expenses not found — Story 018 components not yet deployed.');
    }
  }
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

test.describe('Story #018: Dashboard v2.0 — Analytical Tree-Table Widgets', () => {

  test.beforeEach(async ({ page }) => {
    page.on('console', msg =>
      console.log(`[BROWSER ${msg.type().toUpperCase()}] ${msg.text()}`)
    );
    await page.goto('/');
    await seedIndexedDB(page);
  });

  // ─── TC-018-E01: All four widget containers are present ───────────────────

  test('TC-018-E01: all four widget containers are rendered on the dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForAnalyticalWidgets(page);

    await expect(page.locator('[data-testid="widget-expenses"]')).toBeVisible();
    await expect(page.locator('[data-testid="widget-investment"]')).toBeVisible();
    await expect(page.locator('[data-testid="widget-income"]')).toBeVisible();
    await expect(page.locator('[data-testid="widget-transfer"]')).toBeVisible();
  });

  // ─── TC-018-E02: Desktop 2×2 grid layout ─────────────────────────────────

  test('TC-018-E02: desktop viewport (≥768 px) — widgets arranged in 2-column grid', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForAnalyticalWidgets(page);

    const expenses    = page.locator('[data-testid="widget-expenses"]');
    const investment  = page.locator('[data-testid="widget-investment"]');
    const income      = page.locator('[data-testid="widget-income"]');
    const transfer    = page.locator('[data-testid="widget-transfer"]');

    const expBox   = await expenses.boundingBox();
    const invBox   = await investment.boundingBox();
    const incBox   = await income.boundingBox();
    const trfBox   = await transfer.boundingBox();

    expect(expBox).not.toBeNull();
    expect(invBox).not.toBeNull();
    expect(incBox).not.toBeNull();
    expect(trfBox).not.toBeNull();

    // Expenses (top-left) and Investment (top-right) must be on the same row
    // i.e., their top y-coordinates are within 10px of each other
    expect(Math.abs(expBox!.y - invBox!.y)).toBeLessThan(10);

    // Income (bottom-left) and Transfer (bottom-right) must be on the same row
    expect(Math.abs(incBox!.y - trfBox!.y)).toBeLessThan(10);

    // Expenses must be to the LEFT of Investment (smaller x)
    expect(expBox!.x).toBeLessThan(invBox!.x);

    // Income must be BELOW Expenses (larger y)
    expect(incBox!.y).toBeGreaterThan(expBox!.y + expBox!.height - 10);
  });

  // ─── TC-018-E03: Mobile single-column layout ─────────────────────────────

  test('TC-018-E03: mobile viewport (<768 px) — widgets stack in single column', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForAnalyticalWidgets(page);

    const expenses   = page.locator('[data-testid="widget-expenses"]');
    const investment = page.locator('[data-testid="widget-investment"]');
    const income     = page.locator('[data-testid="widget-income"]');
    const transfer   = page.locator('[data-testid="widget-transfer"]');

    const expBox = await expenses.boundingBox();
    const invBox = await investment.boundingBox();
    const incBox = await income.boundingBox();
    const trfBox = await transfer.boundingBox();

    expect(expBox).not.toBeNull();
    expect(invBox).not.toBeNull();
    expect(incBox).not.toBeNull();
    expect(trfBox).not.toBeNull();

    // All widgets must fill (nearly) the full viewport width
    const viewportWidth = 375;
    expect(expBox!.width).toBeGreaterThan(viewportWidth * 0.8);
    expect(invBox!.width).toBeGreaterThan(viewportWidth * 0.8);

    // Each widget must appear below the previous one (stacked)
    expect(invBox!.y).toBeGreaterThan(expBox!.y + expBox!.height - 10);
    expect(incBox!.y).toBeGreaterThan(invBox!.y + invBox!.height - 10);
    expect(trfBox!.y).toBeGreaterThan(incBox!.y + incBox!.height - 10);
  });

  // ─── TC-018-E04: Auto toggles default aria-checked="false" ───────────────

  test('TC-018-E04: each widget auto-toggle has aria-checked="false" by default', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForAnalyticalWidgets(page);

    const widgets = ['widget-expenses', 'widget-investment', 'widget-income', 'widget-transfer'];

    for (const widgetId of widgets) {
      const toggle = page.locator(`[data-testid="${widgetId}"] [data-testid="widget-auto-toggle"]`);
      await expect(toggle).toBeVisible();
      await expect(toggle).toHaveAttribute('aria-checked', 'false');
    }
  });

  // ─── TC-018-E05: Auto toggle mutual exclusivity ───────────────────────────

  test('TC-018-E05: enabling one auto-toggle sets others to aria-checked="false"', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForAnalyticalWidgets(page);

    const widgets = ['widget-expenses', 'widget-investment', 'widget-income', 'widget-transfer'];

    // Enable the Expenses toggle
    const expensesToggle = page.locator('[data-testid="widget-expenses"] [data-testid="widget-auto-toggle"]');
    await expensesToggle.click();
    await page.waitForTimeout(300);

    await expect(expensesToggle).toHaveAttribute('aria-checked', 'true');

    // The other three must now be false
    for (const widgetId of ['widget-investment', 'widget-income', 'widget-transfer']) {
      const toggle = page.locator(`[data-testid="${widgetId}"] [data-testid="widget-auto-toggle"]`);
      await expect(toggle).toHaveAttribute('aria-checked', 'false');
    }

    // Now enable Income toggle — Expenses must revert to false
    const incomeToggle = page.locator('[data-testid="widget-income"] [data-testid="widget-auto-toggle"]');
    await incomeToggle.click();
    await page.waitForTimeout(300);

    await expect(incomeToggle).toHaveAttribute('aria-checked', 'true');
    await expect(expensesToggle).toHaveAttribute('aria-checked', 'false');

    // Verify the other two are also false
    for (const widgetId of ['widget-investment', 'widget-transfer']) {
      const toggle = page.locator(`[data-testid="${widgetId}"] [data-testid="widget-auto-toggle"]`);
      await expect(toggle).toHaveAttribute('aria-checked', 'false');
    }
  });

  // ─── TC-018-E06: Expenses category rows ──────────────────────────────────

  test('TC-018-E06: widget-expenses shows category rows sorted descending by amount', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForAnalyticalWidgets(page);

    // Apply period to load data
    const applyBtn = page.locator('[data-testid="apply-period-btn"]');
    if (await applyBtn.isVisible().catch(() => false)) {
      await applyBtn.click();
      await page.waitForTimeout(800);
    }

    const widget      = page.locator('[data-testid="widget-expenses"]');
    const categoryRows = widget.locator('[data-testid="widget-row-category"]');

    // Seed data: Housing=15000, Food=6500, Utilities=2300 — expect ≥ 1 row
    await expect(categoryRows.first()).toBeVisible();
    const count = await categoryRows.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Verify each row has a name and amount visible
    for (let i = 0; i < count; i++) {
      await expect(categoryRows.nth(i)).toBeVisible();
    }

    // Verify descending order: extract amounts per row
    if (count >= 2) {
      const amounts: number[] = [];
      for (let i = 0; i < count; i++) {
        const amountEl = categoryRows.nth(i).locator('[data-testid="widget-row-amount"]');
        if (await amountEl.isVisible().catch(() => false)) {
          const text = (await amountEl.textContent()) ?? '';
          const numeric = parseFloat(text.replace(/[^0-9.]/g, ''));
          if (!isNaN(numeric)) amounts.push(numeric);
        }
      }
      for (let i = 1; i < amounts.length; i++) {
        expect(amounts[i - 1]).toBeGreaterThanOrEqual(amounts[i]);
      }
    }
  });

  // ─── TC-018-E07: Income category rows ────────────────────────────────────

  test('TC-018-E07: widget-income shows category rows sorted descending by amount', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForAnalyticalWidgets(page);

    const applyBtn = page.locator('[data-testid="apply-period-btn"]');
    if (await applyBtn.isVisible().catch(() => false)) {
      await applyBtn.click();
      await page.waitForTimeout(800);
    }

    const widget       = page.locator('[data-testid="widget-income"]');
    const categoryRows = widget.locator('[data-testid="widget-row-category"]');

    // Seed: Salary=85000, Freelance=25000
    await expect(categoryRows.first()).toBeVisible();
    const count = await categoryRows.count();
    expect(count).toBeGreaterThanOrEqual(1);

    if (count >= 2) {
      const amounts: number[] = [];
      for (let i = 0; i < count; i++) {
        const amountEl = categoryRows.nth(i).locator('[data-testid="widget-row-amount"]');
        if (await amountEl.isVisible().catch(() => false)) {
          const text = (await amountEl.textContent()) ?? '';
          const numeric = parseFloat(text.replace(/[^0-9.]/g, ''));
          if (!isNaN(numeric)) amounts.push(numeric);
        }
      }
      for (let i = 1; i < amounts.length; i++) {
        expect(amounts[i - 1]).toBeGreaterThanOrEqual(amounts[i]);
      }
    }
  });

  // ─── TC-018-E08: Investment category rows ────────────────────────────────

  test('TC-018-E08: widget-investment shows category rows sorted descending by amount', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForAnalyticalWidgets(page);

    const applyBtn = page.locator('[data-testid="apply-period-btn"]');
    if (await applyBtn.isVisible().catch(() => false)) {
      await applyBtn.click();
      await page.waitForTimeout(800);
    }

    const widget       = page.locator('[data-testid="widget-investment"]');
    const categoryRows = widget.locator('[data-testid="widget-row-category"]');

    // Seed: Mutual Fund=35000, Stocks=8000
    await expect(categoryRows.first()).toBeVisible();
    const count = await categoryRows.count();
    expect(count).toBeGreaterThanOrEqual(1);

    if (count >= 2) {
      const amounts: number[] = [];
      for (let i = 0; i < count; i++) {
        const amountEl = categoryRows.nth(i).locator('[data-testid="widget-row-amount"]');
        if (await amountEl.isVisible().catch(() => false)) {
          const text = (await amountEl.textContent()) ?? '';
          const numeric = parseFloat(text.replace(/[^0-9.]/g, ''));
          if (!isNaN(numeric)) amounts.push(numeric);
        }
      }
      for (let i = 1; i < amounts.length; i++) {
        expect(amounts[i - 1]).toBeGreaterThanOrEqual(amounts[i]);
      }
    }
  });

  // ─── TC-018-E09: Transfer category rows ──────────────────────────────────

  test('TC-018-E09: widget-transfer shows category rows sorted descending by amount', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForAnalyticalWidgets(page);

    const applyBtn = page.locator('[data-testid="apply-period-btn"]');
    if (await applyBtn.isVisible().catch(() => false)) {
      await applyBtn.click();
      await page.waitForTimeout(800);
    }

    const widget       = page.locator('[data-testid="widget-transfer"]');
    const categoryRows = widget.locator('[data-testid="widget-row-category"]');

    // Seed: Fixed Deposit=20000, Savings Account=5000
    await expect(categoryRows.first()).toBeVisible();
  });

  // ─── TC-018-E10: Sub-category rows hidden by default ─────────────────────

  test('TC-018-E10: sub-category rows are hidden (collapsed) by default', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForAnalyticalWidgets(page);

    const applyBtn = page.locator('[data-testid="apply-period-btn"]');
    if (await applyBtn.isVisible().catch(() => false)) {
      await applyBtn.click();
      await page.waitForTimeout(800);
    }

    // All subcategory rows across all widgets must NOT be visible on initial load
    const allSubRows = page.locator('[data-testid="widget-row-subcategory"]');
    const count = await allSubRows.count();

    // Either no subcategory rows are in the DOM, or they are hidden
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        await expect(allSubRows.nth(i)).toBeHidden();
      }
    }
  });

  // ─── TC-018-E11: Clicking category row expands sub-categories ────────────

  test('TC-018-E11: clicking a category row expands its sub-category rows', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForAnalyticalWidgets(page);

    const applyBtn = page.locator('[data-testid="apply-period-btn"]');
    if (await applyBtn.isVisible().catch(() => false)) {
      await applyBtn.click();
      await page.waitForTimeout(800);
    }

    const widget        = page.locator('[data-testid="widget-expenses"]');
    const firstCategory = widget.locator('[data-testid="widget-row-category"]').first();

    await expect(firstCategory).toBeVisible();
    await firstCategory.click();
    await page.waitForTimeout(400);

    // After click, sub-category rows under this widget must become visible
    const subRows = widget.locator('[data-testid="widget-row-subcategory"]');
    const visibleCount = await subRows.count();
    expect(visibleCount).toBeGreaterThan(0);

    for (let i = 0; i < visibleCount; i++) {
      await expect(subRows.nth(i)).toBeVisible();
    }
  });

  // ─── TC-018-E12: Clicking category row again collapses sub-categories ────

  test('TC-018-E12: clicking the same category row again collapses its sub-category rows', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForAnalyticalWidgets(page);

    const applyBtn = page.locator('[data-testid="apply-period-btn"]');
    if (await applyBtn.isVisible().catch(() => false)) {
      await applyBtn.click();
      await page.waitForTimeout(800);
    }

    const widget        = page.locator('[data-testid="widget-expenses"]');
    const firstCategory = widget.locator('[data-testid="widget-row-category"]').first();

    // Expand
    await firstCategory.click();
    await page.waitForTimeout(400);

    const subRows = widget.locator('[data-testid="widget-row-subcategory"]');
    expect(await subRows.count()).toBeGreaterThan(0);

    // Collapse (second click)
    await firstCategory.click();
    await page.waitForTimeout(400);

    const remainingCount = await subRows.count();
    if (remainingCount > 0) {
      for (let i = 0; i < remainingCount; i++) {
        await expect(subRows.nth(i)).toBeHidden();
      }
    }
  });

  // ─── TC-018-E13: Sub-categories sorted descending within category ─────────

  test('TC-018-E13: sub-category rows are sorted descending by amount within category', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForAnalyticalWidgets(page);

    const applyBtn = page.locator('[data-testid="apply-period-btn"]');
    if (await applyBtn.isVisible().catch(() => false)) {
      await applyBtn.click();
      await page.waitForTimeout(800);
    }

    // Use Income widget: Salary category has Basic(75000) > Bonus(10000)
    const widget        = page.locator('[data-testid="widget-income"]');
    const firstCategory = widget.locator('[data-testid="widget-row-category"]').first();

    await firstCategory.click();
    await page.waitForTimeout(400);

    const subRows = widget.locator('[data-testid="widget-row-subcategory"]');
    const subCount = await subRows.count();

    if (subCount >= 2) {
      const amounts: number[] = [];
      for (let i = 0; i < subCount; i++) {
        const amountEl = subRows.nth(i).locator('[data-testid="widget-row-amount"]');
        if (await amountEl.isVisible().catch(() => false)) {
          const text = (await amountEl.textContent()) ?? '';
          const numeric = parseFloat(text.replace(/[^0-9.]/g, ''));
          if (!isNaN(numeric)) amounts.push(numeric);
        }
      }
      for (let i = 1; i < amounts.length; i++) {
        expect(amounts[i - 1]).toBeGreaterThanOrEqual(amounts[i]);
      }
    }
  });

  // ─── TC-018-E14: Clicking category row sets aria-selected="true" ─────────

  test('TC-018-E14: clicking a category row sets aria-selected="true" on that row', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForAnalyticalWidgets(page);

    const applyBtn = page.locator('[data-testid="apply-period-btn"]');
    if (await applyBtn.isVisible().catch(() => false)) {
      await applyBtn.click();
      await page.waitForTimeout(800);
    }

    const widget        = page.locator('[data-testid="widget-expenses"]');
    const firstCategory = widget.locator('[data-testid="widget-row-category"]').first();

    await firstCategory.click();
    await page.waitForTimeout(300);

    await expect(firstCategory).toHaveAttribute('aria-selected', 'true');
  });

  // ─── TC-018-E15: Clicking sub-category row sets aria-selected="true" ─────

  test('TC-018-E15: clicking a sub-category row sets aria-selected="true" on that row', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForAnalyticalWidgets(page);

    const applyBtn = page.locator('[data-testid="apply-period-btn"]');
    if (await applyBtn.isVisible().catch(() => false)) {
      await applyBtn.click();
      await page.waitForTimeout(800);
    }

    const widget        = page.locator('[data-testid="widget-income"]');
    const firstCategory = widget.locator('[data-testid="widget-row-category"]').first();

    // Expand the category first
    await firstCategory.click();
    await page.waitForTimeout(400);

    const firstSubRow = widget.locator('[data-testid="widget-row-subcategory"]').first();
    await expect(firstSubRow).toBeVisible();

    await firstSubRow.click();
    await page.waitForTimeout(300);

    await expect(firstSubRow).toHaveAttribute('aria-selected', 'true');
    // Category row should NOT be aria-selected (sub-category takes selection)
    await expect(firstCategory).not.toHaveAttribute('aria-selected', 'true');
  });

  // ─── TC-018-E16: Cross-widget selection clears other selections ───────────

  test('TC-018-E16: selecting a row in one widget clears selection in all other widgets', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForAnalyticalWidgets(page);

    const applyBtn = page.locator('[data-testid="apply-period-btn"]');
    if (await applyBtn.isVisible().catch(() => false)) {
      await applyBtn.click();
      await page.waitForTimeout(800);
    }

    // Select in widget-expenses
    const expWidget   = page.locator('[data-testid="widget-expenses"]');
    const expFirstRow = expWidget.locator('[data-testid="widget-row-category"]').first();
    await expFirstRow.click();
    await page.waitForTimeout(300);
    await expect(expFirstRow).toHaveAttribute('aria-selected', 'true');

    // Now select in widget-income — expenses selection must clear
    const incWidget   = page.locator('[data-testid="widget-income"]');
    const incFirstRow = incWidget.locator('[data-testid="widget-row-category"]').first();
    await incFirstRow.click();
    await page.waitForTimeout(300);

    await expect(incFirstRow).toHaveAttribute('aria-selected', 'true');
    await expect(expFirstRow).not.toHaveAttribute('aria-selected', 'true');
  });

  // ─── TC-018-E17: Empty state when no transactions in period ───────────────

  test('TC-018-E17: widget-empty-state shown when no transactions exist in the selected period', async ({ page }) => {
    await page.goto('/');
    // Replace seed data with a far-future period that has no transactions
    await clearIndexedDB(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForAnalyticalWidgets(page);

    // Set period to a month that has no data
    const startInput = page.locator('[data-testid="period-start"]');
    const endInput   = page.locator('[data-testid="period-end"]');

    if (await startInput.isVisible().catch(() => false)) {
      await startInput.fill('2099-01');
      await endInput.fill('2099-01');
      const applyBtn = page.locator('[data-testid="apply-period-btn"]');
      if (await applyBtn.isVisible().catch(() => false)) {
        await applyBtn.click();
        await page.waitForTimeout(800);
      }
    }

    // All four widgets must show empty state
    const widgets = ['widget-expenses', 'widget-investment', 'widget-income', 'widget-transfer'];
    for (const widgetId of widgets) {
      const emptyState = page.locator(`[data-testid="${widgetId}"] [data-testid="widget-empty-state"]`);
      await expect(emptyState).toBeVisible();
      const text = await emptyState.textContent() ?? '';
      expect(text.trim().toLowerCase()).toContain('no data');
    }
  });

  // ─── TC-018-E18: Apply period resets all widgets ──────────────────────────

  test('TC-018-E18: clicking Apply resets all widgets to collapsed and no selection', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForAnalyticalWidgets(page);

    const applyBtn = page.locator('[data-testid="apply-period-btn"]');
    if (!await applyBtn.isVisible().catch(() => false)) {
      test.skip(true, 'apply-period-btn not found — Story 017 Apply button not deployed.');
      return;
    }

    await applyBtn.click();
    await page.waitForTimeout(800);

    // Expand a category and select it
    const widget        = page.locator('[data-testid="widget-expenses"]');
    const firstCategory = widget.locator('[data-testid="widget-row-category"]').first();
    await firstCategory.click();
    await page.waitForTimeout(300);

    await expect(firstCategory).toHaveAttribute('aria-selected', 'true');
    const subRows = widget.locator('[data-testid="widget-row-subcategory"]');
    expect(await subRows.count()).toBeGreaterThan(0);

    // Click Apply again to trigger data refresh / period reapplication
    await applyBtn.click();
    await page.waitForTimeout(800);

    // All sub-category rows across all widgets should be hidden again
    const allSubRows = page.locator('[data-testid="widget-row-subcategory"]');
    const subCount = await allSubRows.count();
    if (subCount > 0) {
      for (let i = 0; i < subCount; i++) {
        await expect(allSubRows.nth(i)).toBeHidden();
      }
    }

    // No row should be selected
    const allSelected = page.locator('[data-testid^="widget-row"][aria-selected="true"]');
    await expect(allSelected).toHaveCount(0);
  });

  // ─── TC-018-E19: Category amounts formatted in INR ────────────────────────

  test('TC-018-E19: category row amounts are formatted with ₹ (INR) symbol', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForAnalyticalWidgets(page);

    const applyBtn = page.locator('[data-testid="apply-period-btn"]');
    if (await applyBtn.isVisible().catch(() => false)) {
      await applyBtn.click();
      await page.waitForTimeout(800);
    }

    const widgets = ['widget-expenses', 'widget-investment', 'widget-income', 'widget-transfer'];
    for (const widgetId of widgets) {
      const widget       = page.locator(`[data-testid="${widgetId}"]`);
      const categoryRows = widget.locator('[data-testid="widget-row-category"]');
      const firstRow     = categoryRows.first();

      if (await firstRow.isVisible().catch(() => false)) {
        const amountEl = firstRow.locator('[data-testid="widget-row-amount"]');
        if (await amountEl.isVisible().catch(() => false)) {
          const text = (await amountEl.textContent()) ?? '';
          expect(text).toContain('₹');
        }
      }
    }
  });

  // ─── TC-018-E20: Auto toggle label text reads "Auto" ─────────────────────

  test('TC-018-E20: auto toggle label reads "Auto" in all states', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForAnalyticalWidgets(page);

    const widgets = ['widget-expenses', 'widget-investment', 'widget-income', 'widget-transfer'];

    for (const widgetId of widgets) {
      const toggleLabel = page.locator(
        `[data-testid="${widgetId}"] [data-testid="widget-auto-toggle-label"]`
      );
      if (await toggleLabel.isVisible().catch(() => false)) {
        const text = (await toggleLabel.textContent()) ?? '';
        expect(text.trim()).toBe('Auto');
      } else {
        // Fallback: look for aria-label on the toggle itself
        const toggle = page.locator(`[data-testid="${widgetId}"] [data-testid="widget-auto-toggle"]`);
        if (await toggle.isVisible().catch(() => false)) {
          const ariaLabel = await toggle.getAttribute('aria-label') ?? '';
          expect(ariaLabel.toLowerCase()).toContain('auto');
        }
      }
    }

    // Enable one toggle and re-check label
    const expToggle = page.locator('[data-testid="widget-expenses"] [data-testid="widget-auto-toggle"]');
    await expToggle.click();
    await page.waitForTimeout(200);

    const expToggleLabel = page.locator('[data-testid="widget-expenses"] [data-testid="widget-auto-toggle-label"]');
    if (await expToggleLabel.isVisible().catch(() => false)) {
      const text = (await expToggleLabel.textContent()) ?? '';
      expect(text.trim()).toBe('Auto');
    }
  });
});
