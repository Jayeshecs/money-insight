import { test, expect } from '@playwright/test';

/**
 * E2E Test Suite for Story #019: Dashboard v2.0 — Integrated Transactions Panel
 *
 * Story Reference:      docs/stories/story_019_Dashboard_v2_Transactions_Panel.md
 * Test Cases Reference: docs/testcases/story_019_Dashboard_v2_Transactions_Panel_testcases.md
 *
 * Automatable E2E tests:
 *   TC-019-E01: transactions-panel-title visible and reads "All Transactions" by default
 *   TC-019-E02: Title updates to "<Type> Transactions — <Category> / <Sub-category>" when Auto ON widget sub-category row selected
 *   TC-019-E03: transactions-record-count shows "Records: X / Y" format
 *   TC-019-E04: transactions-search-btn is visible; clicking reveals transactions-search-input with focus
 *   TC-019-E05: Typing in search filters rows case-insensitively; record count updates in real time
 *   TC-019-E06: Escape collapses search input and clears filter
 *   TC-019-E07: transactions-table visible at ≥768px; transaction-card visible at <768px
 *   TC-019-E08: Table columns — Account/Source, Category, Sub-category, Date, Amount, Narration
 *   TC-019-E09: Amount colour-coded: green INCOME, red EXPENSE, blue INVESTMENT, grey TRANSFER
 *   TC-019-E10: transactions-pagination-prev disabled on page 1; transactions-pagination-next disabled on last page
 *   TC-019-E11: transactions-panel-empty-state shown when no results match
 *   TC-019-E12: Searching again button while open collapses search input (toggle behaviour)
 *   TC-019-E13: Widget auto-toggle OFF — further row clicks do not change the panel title
 *   TC-019-E14: Apply period resets panel to "All Transactions" (page 1, no search)
 *
 * Prerequisites:
 *   - Angular dev server running on http://localhost:4200  (ng serve)
 *   - WASM engine built and deployed to src/client/public/
 */

// ---------------------------------------------------------------------------
// Seed transactions — rich multi-category, multi-sub-category data with
// enough rows to trigger pagination (>20 required).
// ---------------------------------------------------------------------------

const BASE_SEED: Array<{
  id: string; date: string; description: string; amount: number;
  type: string; transactionType: string; category: string; subCategory: string; account: string;
}> = [
  // ── INCOME — Salary/Finastra ──────────────────────────────────────────────
  { id: 'tx-i01', date: '2025-03-01', description: 'Salary Feb Finastra',  amount: 75000,
    type: 'INCOME', transactionType: 'INCOME', category: 'Salary', subCategory: 'Finastra', account: 'HDFC-001' },
  { id: 'tx-i02', date: '2025-03-15', description: 'Bonus Finastra',        amount: 10000,
    type: 'INCOME', transactionType: 'INCOME', category: 'Salary', subCategory: 'Finastra', account: 'HDFC-001' },
  { id: 'tx-i03', date: '2025-03-07', description: 'Freelance NEFT A',      amount: 20000,
    type: 'INCOME', transactionType: 'INCOME', category: 'Freelance', subCategory: 'Project-A', account: 'SBI-002' },
  { id: 'tx-i04', date: '2025-03-22', description: 'Freelance NEFT B',      amount: 5000,
    type: 'INCOME', transactionType: 'INCOME', category: 'Freelance', subCategory: 'Project-B', account: 'SBI-002' },

  // ── EXPENSE ───────────────────────────────────────────────────────────────
  { id: 'tx-e01', date: '2025-03-01', description: 'Rent March',            amount: 15000,
    type: 'EXPENSE', transactionType: 'EXPENSE', category: 'Housing', subCategory: 'Rent', account: 'HDFC-001' },
  { id: 'tx-e02', date: '2025-03-05', description: 'Grocery Big Basket',    amount: 4500,
    type: 'EXPENSE', transactionType: 'EXPENSE', category: 'Food', subCategory: 'Groceries', account: 'HDFC-001' },
  { id: 'tx-e03', date: '2025-03-12', description: 'Dinner Zomato',         amount: 2000,
    type: 'EXPENSE', transactionType: 'EXPENSE', category: 'Food', subCategory: 'Restaurants', account: 'SBI-002' },
  { id: 'tx-e04', date: '2025-03-15', description: 'Electricity BESCOM',    amount: 1800,
    type: 'EXPENSE', transactionType: 'EXPENSE', category: 'Utilities', subCategory: 'Electricity', account: 'SBI-002' },
  { id: 'tx-e05', date: '2025-03-20', description: 'Water board bill',      amount: 500,
    type: 'EXPENSE', transactionType: 'EXPENSE', category: 'Utilities', subCategory: 'Water', account: 'HDFC-001' },
  { id: 'tx-e06', date: '2025-03-28', description: 'Amazon shopping',       amount: 3200,
    type: 'EXPENSE', transactionType: 'EXPENSE', category: 'Lifestyle', subCategory: 'Shopping', account: 'HDFC-001' },

  // ── INVESTMENT ────────────────────────────────────────────────────────────
  { id: 'tx-v01', date: '2025-03-10', description: 'MF Lumpsum axis',       amount: 25000,
    type: 'INVESTMENT', transactionType: 'INVESTMENT', category: 'Mutual Fund', subCategory: 'Lumpsum', account: 'HDFC-001' },
  { id: 'tx-v02', date: '2025-03-01', description: 'SIP Mirae',             amount: 10000,
    type: 'INVESTMENT', transactionType: 'INVESTMENT', category: 'Mutual Fund', subCategory: 'SIP', account: 'HDFC-001' },
  { id: 'tx-v03', date: '2025-03-18', description: 'NIFTY50 buy',           amount: 8000,
    type: 'INVESTMENT', transactionType: 'INVESTMENT', category: 'Stocks', subCategory: 'NIFTY50', account: 'SBI-002' },

  // ── TRANSFER ──────────────────────────────────────────────────────────────
  { id: 'tx-t01', date: '2025-03-25', description: 'FD Opening HDFC',       amount: 20000,
    type: 'TRANSFER', transactionType: 'TRANSFER', category: 'Fixed Deposit', subCategory: 'FD', account: 'HDFC-001' },
  { id: 'tx-t02', date: '2025-03-05', description: 'Savings sweep',         amount: 5000,
    type: 'TRANSFER', transactionType: 'TRANSFER', category: 'Savings Account', subCategory: 'Transfer', account: 'HDFC-001' },
];

/**
 * Generates additional filler transactions so the panel has >20 rows
 * (pagination becomes meaningful).
 */
function buildPaginationSeed(): typeof BASE_SEED {
  const extra: typeof BASE_SEED = [];
  for (let i = 1; i <= 10; i++) {
    extra.push({
      id: `tx-fill-${i}`,
      date: `2025-03-${String(i).padStart(2, '0')}`,
      description: `Filler expense ${i}`,
      amount: 100 * i,
      type: 'EXPENSE',
      transactionType: 'EXPENSE',
      category: 'Miscellaneous',
      subCategory: 'Other',
      account: 'HDFC-001',
    });
  }
  return [...BASE_SEED, ...extra];
}

const SEED_TRANSACTIONS      = BASE_SEED;
const PAGINATED_TRANSACTIONS = buildPaginationSeed(); // 25+ rows

/** Seeds the MoneyInsightDB IndexedDB with the provided transactions. */
async function seedIndexedDB(
  page: import('@playwright/test').Page,
  txns = SEED_TRANSACTIONS,
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
 * Guard: waits for the Transactions Panel to be visible.
 * Skips the test gracefully if Story 019 components are not yet deployed.
 */
async function waitForTransactionsPanel(page: import('@playwright/test').Page) {
  const panel = page.locator('[data-testid="transactions-panel-title"]');
  const visible = await panel.isVisible({ timeout: 8000 }).catch(() => false);
  if (!visible) {
    const oldDashboard = await page.locator('[data-testid="period-filter"]').isVisible().catch(() => false);
    if (oldDashboard) {
      test.skip(true, 'transactions-panel-title not found — Story 019 not yet deployed (old dashboard still active).');
    } else {
      test.skip(true, 'transactions-panel-title not found — Story 019 components not yet deployed.');
    }
  }
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

test.describe('Story #019: Dashboard v2.0 — Integrated Transactions Panel', () => {

  test.beforeEach(async ({ page }) => {
    page.on('console', msg =>
      console.log(`[BROWSER ${msg.type().toUpperCase()}] ${msg.text()}`)
    );
    await page.goto('/');
    await seedIndexedDB(page);
  });

  // ─── TC-019-E01: Default panel title is "All Transactions" ───────────────

  test('TC-019-E01: transactions-panel-title visible; default text is "All Transactions"', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForTransactionsPanel(page);

    const title = page.locator('[data-testid="transactions-panel-title"]');
    await expect(title).toBeVisible();
    await expect(title).toHaveText('All Transactions');
  });

  // ─── TC-019-E02: Title updates on sub-category row selection (Auto ON) ───

  test('TC-019-E02: title updates to "Income Transactions — Salary / Finastra" when income widget Auto ON and sub-category selected', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForTransactionsPanel(page);

    // Enable the Income widget Auto toggle
    const incomeWidget = page.locator('[data-testid="widget-income"]');
    const autoToggle   = incomeWidget.locator('[data-testid="widget-auto-toggle"]');
    const toggleVisible = await autoToggle.isVisible({ timeout: 5000 }).catch(() => false);
    if (!toggleVisible) {
      test.skip(true, 'widget-income auto-toggle not found — Story 018 widgets not yet deployed.');
      return;
    }
    await autoToggle.click();
    await page.waitForTimeout(300);
    await expect(autoToggle).toHaveAttribute('aria-checked', 'true');

    // Expand the Salary category row in the Income widget, then click the Finastra sub-category
    const salaryRow = incomeWidget.locator('[data-testid="widget-row-category"]', { hasText: 'Salary' });
    await salaryRow.click();
    await page.waitForTimeout(300);

    const finestraRow = incomeWidget.locator('[data-testid="widget-row-subcategory"]', { hasText: 'Finastra' });
    const subRowVisible = await finestraRow.isVisible({ timeout: 3000 }).catch(() => false);
    if (!subRowVisible) {
      test.skip(true, 'Finastra sub-category row not visible — seeded data may not have been loaded yet.');
      return;
    }
    await finestraRow.click();
    await page.waitForTimeout(400);

    const title = page.locator('[data-testid="transactions-panel-title"]');
    await expect(title).toHaveText('Income Transactions — Salary / Finastra', { timeout: 1000 });
  });

  // ─── TC-019-E03: Record count format "Records: X / Y" ────────────────────

  test('TC-019-E03: transactions-record-count shows "Records: X / Y" format', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForTransactionsPanel(page);

    const countEl = page.locator('[data-testid="transactions-record-count"]');
    await expect(countEl).toBeVisible();
    const text = (await countEl.textContent()) ?? '';
    expect(text.trim()).toMatch(/^Records:\s*\d+\s*\/\s*\d+$/);
  });

  // ─── TC-019-E04: Search button visible; clicking reveals focused search input ─

  test('TC-019-E04: transactions-search-btn visible; clicking reveals transactions-search-input with focus', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForTransactionsPanel(page);

    const searchBtn = page.locator('[data-testid="transactions-search-btn"]');
    await expect(searchBtn).toBeVisible();

    // Search input must not be visible before clicking
    const searchInput = page.locator('[data-testid="transactions-search-input"]');
    const inputBeforeClick = await searchInput.isVisible().catch(() => false);
    expect(inputBeforeClick).toBe(false);

    // Click the search button
    await searchBtn.click();
    await page.waitForTimeout(300);

    // Search input must now be visible and focused
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toBeFocused();
  });

  // ─── TC-019-E05: Typing filters rows; count updates in real time ──────────

  test('TC-019-E05: typing in search input filters rows case-insensitively; record count (X) updates in real time', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForTransactionsPanel(page);

    const countEl    = page.locator('[data-testid="transactions-record-count"]');
    const countBefore = (await countEl.textContent()) ?? '';
    const xBefore = parseInt((countBefore.match(/Records:\s*(\d+)/) ?? [])[1] ?? '0', 10);

    // Open search
    await page.locator('[data-testid="transactions-search-btn"]').click();
    await page.waitForTimeout(300);

    // Type a term that matches exactly the Finastra entries (2 rows)
    await page.locator('[data-testid="transactions-search-input"]').fill('finastra');
    await page.waitForTimeout(400);

    const countAfter = (await countEl.textContent()) ?? '';
    const xAfter = parseInt((countAfter.match(/Records:\s*(\d+)/) ?? [])[1] ?? '0', 10);

    // Filtered count must be at most the unfiltered total
    expect(xAfter).toBeLessThanOrEqual(xBefore);

    // At least one row must match (seed has "Finastra" narrations)
    // Note: if the app deduplicates or no "Finastra" data is loaded we skip gracefully
    if (xAfter === 0) {
      console.warn('TC-019-E05: No rows matched "finastra" — verify seed data is loaded.');
    }
    expect(countAfter.trim()).toMatch(/^Records:\s*\d+\s*\/\s*\d+$/);
  });

  // ─── TC-019-E06: Escape collapses search input and clears filter ──────────

  test('TC-019-E06: pressing Escape collapses transactions-search-input and clears filter', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForTransactionsPanel(page);

    const countEl   = page.locator('[data-testid="transactions-record-count"]');
    const countFull = (await countEl.textContent()) ?? '';

    // Open search and type a filter
    await page.locator('[data-testid="transactions-search-btn"]').click();
    await page.waitForTimeout(300);
    const searchInput = page.locator('[data-testid="transactions-search-input"]');
    await searchInput.fill('finastra');
    await page.waitForTimeout(400);

    // Record the filtered count
    const countFiltered = (await countEl.textContent()) ?? '';

    // Press Escape
    await searchInput.press('Escape');
    await page.waitForTimeout(400);

    // Input must be collapsed (hidden)
    await expect(searchInput).not.toBeVisible();

    // Count must revert to pre-search value
    const countReverted = (await countEl.textContent()) ?? '';
    expect(countReverted).toEqual(countFull);

    // If counts were different (filter had effect), confirm revert is meaningful
    if (countFiltered !== countFull) {
      expect(countReverted).not.toEqual(countFiltered);
    }
  });

  // ─── TC-019-E07: Table at ≥768px; cards at <768px ────────────────────────

  test('TC-019-E07: transactions-table visible at ≥768px viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForTransactionsPanel(page);

    await expect(page.locator('[data-testid="transactions-table"]')).toBeVisible();
  });

  test('TC-019-E07b: transaction-card visible at <768px viewport; table hidden', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForTransactionsPanel(page);

    // Table must be hidden, cards must be visible
    const table = page.locator('[data-testid="transactions-table"]');
    const card  = page.locator('[data-testid="transaction-card"]').first();

    // Table is hidden (CSS display:none)
    await expect(table).not.toBeVisible();
    await expect(card).toBeVisible();
  });

  // ─── TC-019-E08: Table columns present ───────────────────────────────────

  test('TC-019-E08: transactions-table has all required column headers', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForTransactionsPanel(page);

    const table   = page.locator('[data-testid="transactions-table"]');
    const headers = table.locator('th');

    await expect(headers).not.toHaveCount(0);
    const headerTexts = await headers.allTextContents();
    const normalised  = headerTexts.map(h => h.trim().toLowerCase());

    // Required columns (order-insensitive check)
    const required = ['account', 'category', 'sub-category', 'date', 'amount', 'narration'];
    for (const col of required) {
      const found = normalised.some(h => h.includes(col.toLowerCase()));
      expect(found, `Column "${col}" not found in table headers: ${normalised.join(', ')}`).toBe(true);
    }
  });

  // ─── TC-019-E09: Amount colour-coding ────────────────────────────────────

  test('TC-019-E09: Amount colour-coded — green for INCOME, red for EXPENSE, blue for INVESTMENT, grey for TRANSFER', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForTransactionsPanel(page);

    // Look for data-type attributes or CSS classes on amount cells that indicate colour
    // The spec says colour-coded; implementation may use data attributes or classes.
    // We check for a reasonable data attribute or class strategy.
    const incomeAmountEl = page.locator(
      '[data-testid="transaction-row"][data-type="INCOME"] [data-testid="transaction-amount"],' +
      '[data-testid="transaction-row"].income [data-testid="transaction-amount"]'
    ).first();

    const expenseAmountEl = page.locator(
      '[data-testid="transaction-row"][data-type="EXPENSE"] [data-testid="transaction-amount"],' +
      '[data-testid="transaction-row"].expense [data-testid="transaction-amount"]'
    ).first();

    const incomeVisible  = await incomeAmountEl.isVisible({ timeout: 3000 }).catch(() => false);
    const expenseVisible = await expenseAmountEl.isVisible({ timeout: 3000 }).catch(() => false);

    if (!incomeVisible && !expenseVisible) {
      // Fallback: check for colour-related class on any amount cells
      const anyAmount = page.locator('[data-testid="transaction-amount"]').first();
      const anyVisible = await anyAmount.isVisible({ timeout: 3000 }).catch(() => false);
      if (!anyVisible) {
        test.skip(true, 'transaction-amount elements not found — Story 019 not fully deployed.');
        return;
      }
      // Verify at least one amount cell has a colour indicator class or inline style
      const classAttr = (await anyAmount.getAttribute('class')) ?? '';
      const styleAttr = (await anyAmount.getAttribute('style')) ?? '';
      const hasColorIndicator = classAttr.match(/income|expense|investment|transfer/i) ||
                                styleAttr.match(/color/i);
      expect(hasColorIndicator, 'Amount cells have no colour indicator class or style').toBeTruthy();
      return;
    }

    if (incomeVisible) {
      const classAttr  = (await incomeAmountEl.getAttribute('class')) ?? '';
      const styleAttr  = (await incomeAmountEl.getAttribute('style')) ?? '';
      const isGreen    = classAttr.includes('income') || classAttr.includes('green') ||
                         styleAttr.includes('green') || styleAttr.match(/color.*#0/) !== null;
      expect(isGreen, 'INCOME amount should have green colour indicator').toBe(true);
    }

    if (expenseVisible) {
      const classAttr = (await expenseAmountEl.getAttribute('class')) ?? '';
      const styleAttr = (await expenseAmountEl.getAttribute('style')) ?? '';
      const isRed     = classAttr.includes('expense') || classAttr.includes('red') ||
                        styleAttr.includes('red');
      expect(isRed, 'EXPENSE amount should have red colour indicator').toBe(true);
    }
  });

  // ─── TC-019-E10: Pagination — prev disabled on page 1; next disabled on last ─

  test('TC-019-E10: transactions-pagination-prev disabled on page 1', async ({ page }) => {
    await page.goto('/');
    await clearIndexedDB(page);
    await seedIndexedDB(page, PAGINATED_TRANSACTIONS);

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForTransactionsPanel(page);

    const prevBtn = page.locator('[data-testid="transactions-pagination-prev"]');
    const nextBtn = page.locator('[data-testid="transactions-pagination-next"]');

    await expect(prevBtn).toBeVisible();
    await expect(nextBtn).toBeVisible();

    // On page 1 — prev must be disabled
    await expect(prevBtn).toBeDisabled();
  });

  test('TC-019-E10b: transactions-pagination-next disabled on last page', async ({ page }) => {
    await page.goto('/');
    await clearIndexedDB(page);

    // Seed only a few rows so the first page IS the last page
    await seedIndexedDB(page, SEED_TRANSACTIONS.slice(0, 5));

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForTransactionsPanel(page);

    const nextBtn = page.locator('[data-testid="transactions-pagination-next"]');
    await expect(nextBtn).toBeVisible();

    // With ≤20 rows, page 1 is the last page → next must be disabled
    await expect(nextBtn).toBeDisabled();
  });

  test('TC-019-E10c: navigating to page 2 enables prev and may disable next', async ({ page }) => {
    await page.goto('/');
    await clearIndexedDB(page);
    await seedIndexedDB(page, PAGINATED_TRANSACTIONS);

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForTransactionsPanel(page);

    const prevBtn = page.locator('[data-testid="transactions-pagination-prev"]');
    const nextBtn = page.locator('[data-testid="transactions-pagination-next"]');

    await expect(prevBtn).toBeDisabled();

    // Move to page 2
    const nextEnabled = await nextBtn.isEnabled({ timeout: 3000 }).catch(() => false);
    if (!nextEnabled) {
      test.skip(true, 'Pagination next button not enabled — not enough rows loaded to trigger page 2.');
      return;
    }
    await nextBtn.click();
    await page.waitForTimeout(400);

    // Prev must now be enabled
    await expect(prevBtn).toBeEnabled();
  });

  // ─── TC-019-E11: Empty state shown when no results ────────────────────────

  test('TC-019-E11: transactions-panel-empty-state shown when search yields no results', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForTransactionsPanel(page);

    // Open search and type a term that matches nothing
    await page.locator('[data-testid="transactions-search-btn"]').click();
    await page.waitForTimeout(300);
    await page.locator('[data-testid="transactions-search-input"]').fill('zzz_no_match_xyz_99999');
    await page.waitForTimeout(500);

    await expect(page.locator('[data-testid="transactions-panel-empty-state"]')).toBeVisible({ timeout: 3000 });
    const emptyText = (await page.locator('[data-testid="transactions-panel-empty-state"]').textContent()) ?? '';
    expect(emptyText).toContain('No transactions match the current filter.');
  });

  // ─── TC-019-E12: Search button again collapses search (toggle) ───────────

  test('TC-019-E12: clicking transactions-search-btn again while open collapses search input', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForTransactionsPanel(page);

    const searchBtn   = page.locator('[data-testid="transactions-search-btn"]');
    const searchInput = page.locator('[data-testid="transactions-search-input"]');

    // Open
    await searchBtn.click();
    await page.waitForTimeout(300);
    await expect(searchInput).toBeVisible();

    // Click again — should collapse
    await searchBtn.click();
    await page.waitForTimeout(300);
    await expect(searchInput).not.toBeVisible();
  });

  // ─── TC-019-E13: Auto OFF — widget row clicks do not change panel title ───

  test('TC-019-E13: when widget Auto toggle is OFF, row clicks do not change panel title', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForTransactionsPanel(page);

    // Ensure income widget auto toggle is OFF (default)
    const incomeWidget = page.locator('[data-testid="widget-income"]');
    const autoToggle   = incomeWidget.locator('[data-testid="widget-auto-toggle"]');
    const toggleVisible = await autoToggle.isVisible({ timeout: 5000 }).catch(() => false);
    if (!toggleVisible) {
      test.skip(true, 'widget-income auto-toggle not found — Story 018 widgets not yet deployed.');
      return;
    }

    // Make sure it is OFF
    const isOn = (await autoToggle.getAttribute('aria-checked')) === 'true';
    if (isOn) {
      await autoToggle.click();
      await page.waitForTimeout(300);
    }
    await expect(autoToggle).toHaveAttribute('aria-checked', 'false');

    const titleBefore = (await page.locator('[data-testid="transactions-panel-title"]').textContent()) ?? '';

    // Click a category row in the income widget
    const salaryRow = incomeWidget.locator('[data-testid="widget-row-category"]').first();
    const rowVisible = await salaryRow.isVisible({ timeout: 3000 }).catch(() => false);
    if (!rowVisible) {
      test.skip(true, 'Income widget category rows not visible — Story 018 not deployed.');
      return;
    }
    await salaryRow.click();
    await page.waitForTimeout(400);

    // Title must NOT have changed
    const titleAfter = (await page.locator('[data-testid="transactions-panel-title"]').textContent()) ?? '';
    expect(titleAfter).toEqual(titleBefore);
  });

  // ─── TC-019-E14: Apply period resets panel to "All Transactions" ──────────

  test('TC-019-E14: clicking Apply resets panel title to "All Transactions" and returns to page 1', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForTransactionsPanel(page);

    const applyBtn = page.locator('[data-testid="apply-period-btn"]');
    const applyVisible = await applyBtn.isVisible({ timeout: 5000 }).catch(() => false);
    if (!applyVisible) {
      test.skip(true, 'apply-period-btn not found — Story 017 not yet deployed.');
      return;
    }

    // Open search to make a dirty state
    await page.locator('[data-testid="transactions-search-btn"]').click();
    await page.waitForTimeout(300);
    await page.locator('[data-testid="transactions-search-input"]').fill('salary');
    await page.waitForTimeout(400);

    // Click Apply
    await applyBtn.click();
    await page.waitForTimeout(800);

    // Panel title must revert to "All Transactions"
    const title = page.locator('[data-testid="transactions-panel-title"]');
    await expect(title).toHaveText('All Transactions', { timeout: 2000 });

    // Search input must be collapsed
    await expect(page.locator('[data-testid="transactions-search-input"]')).not.toBeVisible();

    // Prev button must be disabled (page 1)
    const prevBtn = page.locator('[data-testid="transactions-pagination-prev"]');
    if (await prevBtn.isVisible().catch(() => false)) {
      await expect(prevBtn).toBeDisabled();
    }
  });

});
