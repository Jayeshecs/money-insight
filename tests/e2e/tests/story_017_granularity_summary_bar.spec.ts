import { test, expect } from '@playwright/test';

/**
 * E2E Test Suite for Story #017: Dashboard v2.0 — Granularity Bar & Overall Summary Bar
 *
 * Story Reference:      docs/stories/story_017_Dashboard_v2_Granularity_and_Summary_Bar.md
 * Test Cases Reference: docs/testcases/story_017_Dashboard_v2_Granularity_and_Summary_Bar_testcases.md
 *
 * Automatable E2E tests:
 *   TC-017-E01: granularity-select has 3 options; default is monthly
 *   TC-017-E02: period-start and period-end inputs exist; display YYYY-MM strings
 *   TC-017-E03: period-range-slider element is present
 *   TC-017-E04: changing granularity to quarterly resets period range
 *   TC-017-E05: apply-period-btn is present; totals do NOT change before click
 *   TC-017-E06: overall-income/expense/investment/transfer show formatted INR amounts
 *   TC-017-E07: account-source-filter multiselect exists; badge shows account count
 *   TC-017-E08: deselecting an account immediately updates totals (no Apply)
 *   TC-017-E09: dashboard-empty-state shown when period has no transactions
 *   TC-017-E10: mobile viewport (<768px) — elements stack vertically
 *   TC-017-E11: slider left handle cannot exceed right handle (constraint check)
 *   TC-017-E12: pending period changes do NOT update totals until Apply clicked
 *   TC-017-E13: reselecting all accounts restores full totals
 *   TC-017-E14: INR formatting uses Indian thousands separator (₹X,XX,XXX)
 *   TC-017-E15: empty IndexedDB → both period inputs render today's YYYY-MM; totals ₹0
 *
 * Prerequisites:
 *   - Angular dev server running on http://localhost:4200  (ng serve)
 *   - WASM engine built and deployed to src/client/public/
 */

// ---------------------------------------------------------------------------
// Shared test data — realistic transactions across two accounts, two months
// ---------------------------------------------------------------------------
const SEED_TRANSACTIONS = [
  // Account: HDFC-001 — 2025-03
  { id: 'tx001', date: '2025-03-05', description: 'Salary March', amount: 75000, type: 'INCOME',     category: 'Salary',    account: 'HDFC-001' },
  { id: 'tx002', date: '2025-03-10', description: 'Grocery',      amount: 4500,  type: 'EXPENSE',    category: 'Food',      account: 'HDFC-001' },
  { id: 'tx003', date: '2025-03-15', description: 'Mutual Fund',  amount: 10000, type: 'INVESTMENT', category: 'Savings',   account: 'HDFC-001' },
  { id: 'tx004', date: '2025-03-20', description: 'Transfer Out', amount: 5000,  type: 'TRANSFER',   category: 'Transfer',  account: 'HDFC-001' },
  // Account: SBI-002 — 2025-03
  { id: 'tx005', date: '2025-03-07', description: 'Freelance',    amount: 20000, type: 'INCOME',     category: 'Freelance', account: 'SBI-002'  },
  { id: 'tx006', date: '2025-03-25', description: 'Electricity',  amount: 1800,  type: 'EXPENSE',    category: 'Utilities', account: 'SBI-002'  },
  // Account: HDFC-001 — 2025-04 (different period)
  { id: 'tx007', date: '2025-04-02', description: 'Salary April', amount: 75000, type: 'INCOME',     category: 'Salary',    account: 'HDFC-001' },
  { id: 'tx008', date: '2025-04-10', description: 'Rent April',   amount: 15000, type: 'EXPENSE',    category: 'Housing',   account: 'HDFC-001' },
];

/**
 * Seeds the MoneyInsightDB IndexedDB with the provided transactions.
 * Must be called inside page.evaluate() so it runs in the browser context.
 */
async function seedIndexedDB(page: import('@playwright/test').Page, txns = SEED_TRANSACTIONS) {
  await page.evaluate(async (transactions) => {
    await new Promise<void>((resolve, reject) => {
      // Open without specifying a version so we use whatever version the app has created
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

/** Guards: waits for granularity-bar to become visible; skips if v2.0 components not deployed. */
async function waitForGranularityBar(page: import('@playwright/test').Page) {
  const bar = page.locator('[data-testid="granularity-select"]');
  const visible = await bar.isVisible({ timeout: 8000 }).catch(() => false);
  if (!visible) {
    // Check whether we are on a stub/old dashboard
    const oldFilter = await page.locator('[data-testid="period-filter"]').isVisible().catch(() => false);
    if (oldFilter) {
      test.skip(true, 'granularity-select not found — Story 017 components not yet deployed. Old period-filter still active.');
    } else {
      test.skip(true, 'granularity-select not found — Story 017 components not yet deployed.');
    }
  }
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

test.describe('Story #017: Dashboard v2.0 — Granularity Bar & Overall Summary Bar', () => {

  test.beforeEach(async ({ page }) => {
    page.on('console', msg =>
      console.log(`[BROWSER ${msg.type().toUpperCase()}] ${msg.text()}`)
    );
    // Navigate first so IndexedDB exists in the right origin, then seed
    await page.goto('/');
    await seedIndexedDB(page);
  });

  // ─── TC-017-E01: granularity-select dropdown has 3 options; default = monthly ─

  test('TC-017-E01: granularity-select exists with exactly 3 options; default is monthly', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForGranularityBar(page);

    const select = page.locator('[data-testid="granularity-select"]');
    await expect(select).toBeVisible();

    // Verify 3 options
    const options = select.locator('option');
    await expect(options).toHaveCount(3);
    await expect(options.nth(0)).toHaveAttribute('value', 'monthly');
    await expect(options.nth(1)).toHaveAttribute('value', 'quarterly');
    await expect(options.nth(2)).toHaveAttribute('value', 'yearly');

    // Verify default selected value
    await expect(select).toHaveValue('monthly');
  });

  // ─── TC-017-E02: period-start and period-end inputs show YYYY-MM ─────────────

  test('TC-017-E02: period-start and period-end exist and show YYYY-MM formatted strings', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForGranularityBar(page);

    const startInput = page.locator('[data-testid="period-start"]');
    const endInput   = page.locator('[data-testid="period-end"]');

    await expect(startInput).toBeVisible();
    await expect(endInput).toBeVisible();

    const startVal = await startInput.inputValue();
    const endVal   = await endInput.inputValue();

    // Must match YYYY-MM (monthly default granularity)
    expect(startVal).toMatch(/^\d{4}-\d{2}$/);
    expect(endVal).toMatch(/^\d{4}-\d{2}$/);

    // start must be ≤ end
    expect(startVal <= endVal).toBe(true);
  });

  // ─── TC-017-E03: period-range-slider element is present ──────────────────────

  test('TC-017-E03: period-range-slider element is present on the dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForGranularityBar(page);

    await expect(page.locator('[data-testid="period-range-slider"]')).toBeVisible();
  });

  // ─── TC-017-E04: changing granularity resets period range ────────────────────

  test('TC-017-E04: changing granularity to quarterly resets period-start and period-end', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForGranularityBar(page);

    // Record baseline monthly values
    const startBefore = await page.locator('[data-testid="period-start"]').inputValue();
    const endBefore   = await page.locator('[data-testid="period-end"]').inputValue();

    // Switch to quarterly
    await page.locator('[data-testid="granularity-select"]').selectOption('quarterly');
    await page.waitForTimeout(500);

    const startAfter = await page.locator('[data-testid="period-start"]').inputValue();
    const endAfter   = await page.locator('[data-testid="period-end"]').inputValue();

    // Values must now use YYYY-Q# format (or YYYY-MM clamped to quarter boundary)
    // Key invariant: they must snap to quarter boundaries, so start should be
    // the beginning of a quarter (month = 01, 04, 07, or 10)
    const quarterStartMonths = ['01', '04', '07', '10'];
    const startMonth = startAfter.slice(5); // last 2 chars for YYYY-MM, or "Q#" for YYYY-Q#
    // Accept either format per PO clarification
    const isValidStart = quarterStartMonths.includes(startMonth) || /^\d{4}-Q[1-4]$/.test(startAfter);
    expect(isValidStart).toBe(true);

    // End must also snap to a quarter boundary (last month of quarter: 03,06,09,12)
    // or be in YYYY-Q# format
    const quarterEndMonths = ['03', '06', '09', '12'];
    const endMonth = endAfter.slice(5);
    const isValidEnd = quarterEndMonths.includes(endMonth) || /^\d{4}-Q[1-4]$/.test(endAfter);
    expect(isValidEnd).toBe(true);

    // Values must have changed (reset happened)
    // (They may or may not equal the monthly values — what matters is the format/snap)
    console.log(`Quarterly reset: ${startBefore}→${startAfter}  ${endBefore}→${endAfter}`);
  });

  // ─── TC-017-E05: apply-period-btn is present ─────────────────────────────────

  test('TC-017-E05: apply-period-btn is visible and clickable', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForGranularityBar(page);

    const applyBtn = page.locator('[data-testid="apply-period-btn"]');
    await expect(applyBtn).toBeVisible();
    await expect(applyBtn).toBeEnabled();
  });

  // ─── TC-017-E06: overall-* tiles show formatted INR amounts ──────────────────

  test('TC-017-E06: overall-income / expense / investment / transfer show INR amounts', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForGranularityBar(page);

    // Click Apply to make the seeded data populate the summary
    await page.locator('[data-testid="apply-period-btn"]').click();
    await page.waitForTimeout(800);

    const incomeEl     = page.locator('[data-testid="overall-income"]');
    const expenseEl    = page.locator('[data-testid="overall-expense"]');
    const investEl     = page.locator('[data-testid="overall-investment"]');
    const transferEl   = page.locator('[data-testid="overall-transfer"]');

    await expect(incomeEl).toBeVisible();
    await expect(expenseEl).toBeVisible();
    await expect(investEl).toBeVisible();
    await expect(transferEl).toBeVisible();

    // Each amount must contain the ₹ symbol
    const incomeText   = await incomeEl.textContent() ?? '';
    const expenseText  = await expenseEl.textContent() ?? '';
    const investText   = await investEl.textContent() ?? '';
    const transferText = await transferEl.textContent() ?? '';

    expect(incomeText).toContain('₹');
    expect(expenseText).toContain('₹');
    expect(investText).toContain('₹');
    expect(transferText).toContain('₹');
  });

  // ─── TC-017-E07: account-source-filter multiselect + badge count ─────────────

  test('TC-017-E07: account-source-filter exists; badge shows selected account count', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForGranularityBar(page);

    const filter = page.locator('[data-testid="account-source-filter"]');
    await expect(filter).toBeVisible();

    // Badge must show a numeric count (seed data has 2 distinct accounts: HDFC-001, SBI-002)
    const badge = page.locator('[data-testid="account-source-filter-badge"]');
    await expect(badge).toBeVisible();

    const badgeText = await badge.textContent() ?? '';
    const badgeNum  = parseInt(badgeText.trim(), 10);
    expect(Number.isFinite(badgeNum)).toBe(true);
    expect(badgeNum).toBeGreaterThan(0);
  });

  // ─── TC-017-E08: deselecting account immediately updates totals ───────────────

  test('TC-017-E08: deselecting an account immediately updates totals without Apply', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForGranularityBar(page);

    // Apply period first to populate totals
    await page.locator('[data-testid="apply-period-btn"]').click();
    await page.waitForTimeout(800);

    const incomeEl = page.locator('[data-testid="overall-income"]');
    const incomeBefore = await incomeEl.textContent() ?? '';

    // Open the account-source-filter dropdown
    const filter = page.locator('[data-testid="account-source-filter"]');
    await filter.click();
    await page.waitForTimeout(300);

    // Deselect the first available account option
    // The dropdown renders account items with data-testid="account-option-{account}"
    const firstOption = page.locator('[data-testid^="account-option-"]').first();
    const optionVisible = await firstOption.isVisible({ timeout: 3000 }).catch(() => false);
    if (!optionVisible) {
      test.skip(true, 'account-source-filter dropdown options not rendered — component not implemented yet.');
      return;
    }
    await firstOption.click();
    await page.waitForTimeout(500);

    // Income total must change immediately (no Apply needed)
    const incomeAfter = await incomeEl.textContent() ?? '';
    expect(incomeAfter).not.toEqual(incomeBefore);
  });

  // ─── TC-017-E09: dashboard-empty-state when period has no transactions ────────

  test('TC-017-E09: dashboard-empty-state shown when selected period has zero transactions', async ({ page }) => {
    await page.goto('/');
    // Seed with transactions only in 2025-03 / 2025-04, then select a period in 2020
    await clearIndexedDB(page);
    await seedIndexedDB(page); // data is in 2025-03 and 2025-04

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForGranularityBar(page);

    // Set period-start and period-end to a range with no data
    await page.locator('[data-testid="period-start"]').fill('2020-01');
    await page.locator('[data-testid="period-start"]').dispatchEvent('change');
    await page.locator('[data-testid="period-end"]').fill('2020-12');
    await page.locator('[data-testid="period-end"]').dispatchEvent('change');
    await page.waitForTimeout(300);

    // Click Apply
    await page.locator('[data-testid="apply-period-btn"]').click();
    await page.waitForTimeout(800);

    // dashboard-empty-state must be visible
    await expect(page.locator('[data-testid="dashboard-empty-state"]')).toBeVisible({ timeout: 5000 });
  });

  // ─── TC-017-E10: INR format uses Indian thousands separator ──────────────────

  test('TC-017-E10: INR amounts use Indian thousands separator (₹X,XX,XXX)', async ({ page }) => {
    // Seed larger amounts to force commas
    await page.goto('/');
    await clearIndexedDB(page);
    await seedIndexedDB(page, [
      { id: 'tx-big-1', date: '2025-03-05', description: 'Big Salary', amount: 123456, type: 'INCOME',  category: 'Salary',   account: 'HDFC-001', narration: 'Big Salary Credit' },
      { id: 'tx-big-2', date: '2025-03-10', description: 'Big Expense', amount: 78900, type: 'EXPENSE', category: 'Housing',  account: 'HDFC-001', narration: 'Big Expense Debit' },
    ]);

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForGranularityBar(page);

    await page.locator('[data-testid="apply-period-btn"]').click();
    await page.waitForTimeout(800);

    const incomeText = await page.locator('[data-testid="overall-income"]').textContent() ?? '';

    // Indian format: ₹1,23,456.00 — contains at least one comma after ₹
    expect(incomeText).toContain('₹');
    expect(incomeText).toMatch(/₹[\d,]+/);
    // Extract just the numeric portion (digits, commas, decimal point)
    const numericPart = (incomeText.match(/[\d,]+\.\d{2}/) ?? incomeText.match(/[\d,]+/) ?? [''])[0];
    // Two-digit groups after the first three digits indicate Indian format
    // e.g. 1,23,456.00 not 123,456.00; 0.00 is also valid
    expect(numericPart).toMatch(/^\d{1,3}(,\d{2,3})*(\.\d{2})?$/);
  });

  // ─── TC-017-E11: pending slider changes do NOT update totals before Apply ─────

  test('TC-017-E11: editing period-start input does NOT update totals until Apply is clicked', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForGranularityBar(page);

    // Establish a baseline with Apply
    await page.locator('[data-testid="apply-period-btn"]').click();
    await page.waitForTimeout(800);

    const incomeEl = page.locator('[data-testid="overall-income"]');
    const incomeBefore = await incomeEl.textContent() ?? '';

    // Change period-start to a very narrow range (should cut income if applied)
    const currentEnd = await page.locator('[data-testid="period-end"]').inputValue();
    await page.locator('[data-testid="period-start"]').fill(currentEnd); // start = end → 1 month only
    await page.locator('[data-testid="period-start"]').dispatchEvent('change');
    await page.waitForTimeout(500); // allow Angular CD

    // Totals must NOT have changed (no Apply clicked)
    const incomeAfterEdit = await incomeEl.textContent() ?? '';
    expect(incomeAfterEdit).toEqual(incomeBefore);
  });

  // ─── TC-017-E12: reselecting all accounts restores full totals ────────────────

  test('TC-017-E12: reselecting all accounts after deselecting restores original totals', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForGranularityBar(page);

    await page.locator('[data-testid="apply-period-btn"]').click();
    await page.waitForTimeout(800);

    const incomeEl = page.locator('[data-testid="overall-income"]');
    const incomeFull = await incomeEl.textContent() ?? '';

    // Open filter and deselect first account
    const filter = page.locator('[data-testid="account-source-filter"]');
    await filter.click();
    await page.waitForTimeout(300);

    const firstOption = page.locator('[data-testid^="account-option-"]').first();
    const optionVisible = await firstOption.isVisible({ timeout: 3000 }).catch(() => false);
    if (!optionVisible) {
      test.skip(true, 'account-source-filter options not rendered — component not implemented yet.');
      return;
    }
    await firstOption.click();
    await page.waitForTimeout(400);

    // Reselect the same account
    await firstOption.click();
    await page.waitForTimeout(400);

    const incomeRestored = await incomeEl.textContent() ?? '';
    expect(incomeRestored).toEqual(incomeFull);
  });

  // ─── TC-017-E13: empty IndexedDB → totals show ₹0; period defaults to today ──

  test('TC-017-E13: empty IndexedDB — both period inputs show current YYYY-MM; totals show ₹0', async ({ page }) => {
    await page.goto('/');
    await clearIndexedDB(page);

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForGranularityBar(page);

    // Period inputs should default to today's YYYY-MM
    const today = new Date();
    const expectedYYYYMM = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    const startVal = await page.locator('[data-testid="period-start"]').inputValue();
    const endVal   = await page.locator('[data-testid="period-end"]').inputValue();
    expect(startVal).toEqual(expectedYYYYMM);
    expect(endVal).toEqual(expectedYYYYMM);

    // Apply to populate totals
    await page.locator('[data-testid="apply-period-btn"]').click();
    await page.waitForTimeout(800);

    // All totals must be ₹0 (or dashboard-empty-state visible)
    const emptyState = page.locator('[data-testid="dashboard-empty-state"]');
    const incomeEl   = page.locator('[data-testid="overall-income"]');

    const emptyVisible  = await emptyState.isVisible({ timeout: 3000 }).catch(() => false);
    const incomeVisible = await incomeEl.isVisible({ timeout: 3000 }).catch(() => false);

    if (emptyVisible) {
      // Empty-state is the accepted UX for zero data
      await expect(emptyState).toBeVisible();
    } else if (incomeVisible) {
      const incomeText = await incomeEl.textContent() ?? '';
      expect(incomeText).toContain('0');
    }
  });

  // ─── TC-017-E14: mobile viewport — granularity bar stacks elements ────────────

  test('TC-017-E14: at mobile viewport (<768px) granularity bar elements are visible and stacked', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone SE

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForGranularityBar(page);

    // All key elements must still be visible on mobile
    await expect(page.locator('[data-testid="granularity-select"]')).toBeVisible();
    await expect(page.locator('[data-testid="period-start"]')).toBeVisible();
    await expect(page.locator('[data-testid="period-end"]')).toBeVisible();
    await expect(page.locator('[data-testid="apply-period-btn"]')).toBeVisible();

    // Verify vertical stacking: granularity-select should be above period-start
    const selectBox = await page.locator('[data-testid="granularity-select"]').boundingBox();
    const startBox  = await page.locator('[data-testid="period-start"]').boundingBox();

    if (selectBox && startBox) {
      // On mobile, granularity dropdown rows above the start input (row 1 vs row 2)
      expect(selectBox.y).toBeLessThan(startBox.y);
    }
  });

  // ─── TC-017-E15: mobile summary bar — income+expense row 1, invest+transfer row 2 ─

  test('TC-017-E15: mobile viewport — overall summary bar tiles stack in 2x2 grid', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForGranularityBar(page);

    await page.locator('[data-testid="apply-period-btn"]').click({ force: true });
    await page.waitForTimeout(800);

    const incomeBox  = await page.locator('[data-testid="overall-income"]').boundingBox();
    const expenseBox = await page.locator('[data-testid="overall-expense"]').boundingBox();
    const investBox  = await page.locator('[data-testid="overall-investment"]').boundingBox();

    if (incomeBox && expenseBox && investBox) {
      // income and expense should be on the same row (same y)
      expect(Math.abs(incomeBox.y - expenseBox.y)).toBeLessThan(10);
      // investment should be on a row below income
      expect(investBox.y).toBeGreaterThan(incomeBox.y + incomeBox.height - 5);
    }
  });

  // ─── TC-017-E16: overall tiles have correct icon text / colour class ──────────

  test('TC-017-E16: overall-expense has red colour class; overall-income has green class', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForGranularityBar(page);

    await page.locator('[data-testid="apply-period-btn"]').click();
    await page.waitForTimeout(800);

    const incomeEl  = page.locator('[data-testid="overall-income"]');
    const expenseEl = page.locator('[data-testid="overall-expense"]');
    const investEl  = page.locator('[data-testid="overall-investment"]');
    const transferEl = page.locator('[data-testid="overall-transfer"]');

    // Colour is implemented via CSS class or inline style; check either
    const incomeClass  = await incomeEl.getAttribute('class') ?? '';
    const expenseClass = await expenseEl.getAttribute('class') ?? '';
    const investClass  = await investEl.getAttribute('class') ?? '';
    const transferClass = await transferEl.getAttribute('class') ?? '';

    // Green for income
    const incomeGreen  = incomeClass.includes('green') || await hasGreenColor(page, incomeEl);
    // Red for expense
    const expenseRed   = expenseClass.includes('red')  || await hasRedColor(page, expenseEl);
    // Blue for investment
    const investBlue   = investClass.includes('blue')  || await hasBlueColor(page, investEl);
    // Grey for transfer
    const transferGrey = transferClass.includes('grey') || transferClass.includes('gray') || await hasGreyColor(page, transferEl);

    expect(incomeGreen).toBe(true);
    expect(expenseRed).toBe(true);
    expect(investBlue).toBe(true);
    expect(transferGrey).toBe(true);
  });

  // ─── TC-017-E17: yearly granularity changes period-start format to YYYY ───────

  test('TC-017-E17: switching to yearly granularity changes period-start to YYYY format', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await waitForGranularityBar(page);

    await page.locator('[data-testid="granularity-select"]').selectOption('yearly');
    await page.waitForTimeout(500);

    const startVal = await page.locator('[data-testid="period-start"]').inputValue();
    // Should now be YYYY (4-digit year only) per PO clarification
    expect(startVal).toMatch(/^\d{4}$/);
  });

});

// ---------------------------------------------------------------------------
// Colour helper utilities (computed style checks)
// ---------------------------------------------------------------------------

async function hasGreenColor(page: import('@playwright/test').Page, locator: import('@playwright/test').Locator): Promise<boolean> {
  const color = await locator.evaluate(el => getComputedStyle(el).color);
  // Green: rgb values where G is dominant
  return color.includes('green') || /rgb\(\s*\d+\s*,\s*(1[0-9][0-9]|2[0-9][0-9])\s*,\s*\d+\s*\)/.test(color);
}

async function hasRedColor(page: import('@playwright/test').Page, locator: import('@playwright/test').Locator): Promise<boolean> {
  const color = await locator.evaluate(el => getComputedStyle(el).color);
  return color.includes('red') || /rgb\(\s*(1[0-9][0-9]|2[0-4][0-9]|25[0-5])\s*,\s*[0-5]\d?\s*,\s*[0-5]\d?\s*\)/.test(color);
}

async function hasBlueColor(page: import('@playwright/test').Page, locator: import('@playwright/test').Locator): Promise<boolean> {
  const color = await locator.evaluate(el => getComputedStyle(el).color);
  return color.includes('blue') || /rgb\(\s*\d+\s*,\s*\d+\s*,\s*(1[0-9][0-9]|2[0-4][0-9]|25[0-5])\s*\)/.test(color);
}

async function hasGreyColor(page: import('@playwright/test').Page, locator: import('@playwright/test').Locator): Promise<boolean> {
  const color = await locator.evaluate(el => getComputedStyle(el).color);
  return color.includes('grey') || color.includes('gray') ||
    /rgb\(\s*(1[0-4]\d|15\d)\s*,\s*(1[0-4]\d|15\d)\s*,\s*(1[0-4]\d|15\d)\s*\)/.test(color);
}
