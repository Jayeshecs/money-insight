import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import os from 'os';

/**
 * E2E Test Suite for Story #015: In-Feed Ad Placements in Transaction Review Screen
 *
 * Story Reference:      docs/stories/story_015_In_Feed_Ads_Transactions_Screen.md
 * Test Cases Reference: docs/testcases/story_015_In_Feed_Ads_Transactions_Screen_testcases.md
 *
 * Covers TC-015-012, TC-015-013, TC-015-014, TC-015-015 (E2E tier only).
 *
 * CSV format used: SBI Savings format (Txn Date, Value Date, Description,
 *   Ref No./Cheque No., Debit, Credit, Balance) — pure CSV, parsed by SbiSavingsParser.
 *
 * Prerequisites:
 *   - Angular dev server running on http://localhost:4200  (ng serve)
 *   - WASM engine with SbiSavingsParser registered
 */

const FIXTURE_DIR = os.tmpdir();

/** Generate an SBI-format CSV string with `rowCount` data rows. */
function generateSbiCsv(rowCount: number): string {
  const header = 'Txn Date,Value Date,Description,Ref No./Cheque No.,Debit,Credit,Balance\n';
  const rows: string[] = [];
  let balance = 100000.00;

  for (let i = 0; i < rowCount; i++) {
    const day  = String((i % 28) + 1).padStart(2, '0');
    const date = `${day}/03/2026`;
    const debit = (100 + i).toFixed(2);
    balance -= parseFloat(debit);
    rows.push(`${date},${date},Test Transaction ${i + 1},REF${i + 1000},${debit},,${balance.toFixed(2)}`);
  }

  return header + rows.join('\n') + '\n';
}

/** File paths written by test.beforeAll */
let csv25Path: string;
let csv20Path: string;
let csv19Path: string;

test.describe('Story #015: In-Feed Ads Transactions Screen', () => {

  test.beforeAll(async () => {
    csv25Path = path.join(FIXTURE_DIR, 'sbi_25rows.csv');
    csv20Path = path.join(FIXTURE_DIR, 'sbi_20rows.csv');
    csv19Path = path.join(FIXTURE_DIR, 'sbi_19rows.csv');

    fs.writeFileSync(csv25Path, generateSbiCsv(25), 'utf-8');
    fs.writeFileSync(csv20Path, generateSbiCsv(20), 'utf-8');
    fs.writeFileSync(csv19Path, generateSbiCsv(19), 'utf-8');
  });

  test.afterAll(async () => {
    for (const p of [csv25Path, csv20Path, csv19Path]) {
      if (p && fs.existsSync(p)) fs.unlinkSync(p);
    }
  });

  /** Helper: seed the app by uploading a CSV then navigate to /transactions */
  async function seedAndNavigate(page: import('@playwright/test').Page, csvPath: string) {
    // Clear state
    await page.goto('/');
    await page.evaluate(() => indexedDB.deleteDatabase('MoneyInsightDB'));
    await page.goto('/import');
    await expect(page).toHaveTitle(/MoneyInsight/);

    await page.locator('input[type="file"]').setInputFiles(csvPath);
    await page.waitForSelector('[data-testid="upload-success"]', { timeout: 20000 });
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible();

    await page.goto('/transactions');
    await page.waitForLoadState('networkidle');

    // Wait for the transactions table or empty state
    const table      = page.locator('[data-testid="transactions-table"]');
    const emptyState = page.locator('[data-testid="transactions-empty-state"]');
    await Promise.race([
      table.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {}),
      emptyState.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {}),
    ]);
  }

  test.beforeEach(async ({ page }) => {
    page.on('console', msg =>
      console.log(`[BROWSER ${msg.type().toUpperCase()}] ${msg.text()}`)
    );
  });

  // ── TC-015-012: 25 transactions → page 1 shows ad-row; page 2 does NOT ───────
  test('TC-015-012: 25 transactions — page 1 shows ad-row, page 2 does not', async ({ page }) => {
    await seedAndNavigate(page, csv25Path);

    // Page 1 (20 rows) — ad-row must be present
    await expect(page.locator('[data-testid="ad-row"]')).toBeVisible({ timeout: 8000 });

    // Navigate to page 2 (5 rows — partial page, no ad)
    const nextPageBtn = page.getByRole('button', { name: /next/i })
      .or(page.locator('[data-testid="next-page"]'));
    const nextVisible = await nextPageBtn.first().isVisible().catch(() => false);
    if (!nextVisible) {
      // Try pagination links
      await page.locator('[data-testid="pagination-next"]').click();
    } else {
      await nextPageBtn.first().click();
    }
    await page.waitForLoadState('networkidle');

    // Page 2 — ad-row must NOT be visible
    await expect(page.locator('[data-testid="ad-row"]')).not.toBeVisible({ timeout: 5000 });
  });

  // ── TC-015-013: 19 transactions → no ad-row shown ────────────────────────────
  test('TC-015-013: 19 transactions — no ad-row shown', async ({ page }) => {
    // Create the 19-row CSV inline to avoid beforeAll timing issues
    const inlineCsv19Path = path.join(os.tmpdir(), `sbi_19rows_${Date.now()}.csv`);
    fs.writeFileSync(inlineCsv19Path, generateSbiCsv(19), 'utf-8');
    try {
      await seedAndNavigate(page, inlineCsv19Path);
      // With 19 rows (< PAGE_SIZE of 20) there should be no ad-row
      await expect(page.locator('[data-testid="ad-row"]')).not.toBeVisible({ timeout: 5000 });
    } finally {
      if (fs.existsSync(inlineCsv19Path)) fs.unlinkSync(inlineCsv19Path);
    }
  });

  // ── TC-015-014: ad-sponsored-label text is "Sponsored" ───────────────────────
  test('TC-015-014: ad-sponsored-label text is "Sponsored" on a full page', async ({ page }) => {
    await seedAndNavigate(page, csv25Path);

    // Page 1 must show the ad; the sponsored label must read "Sponsored"
    // Use .first() since both desktop ad-row and mobile ad-card may render ad-sponsored-label
    await expect(page.locator('[data-testid="ad-sponsored-label"]').first())
      .toHaveText('Sponsored', { timeout: 8000 });
  });

  // ── TC-015-015: transaction-count shows 20 (not 21) for exactly 20 rows ──────
  test('TC-015-015: transaction-count shows "20" (ad row does not inflate count)', async ({ page }) => {
    await seedAndNavigate(page, csv20Path);

    // The count element must show 20 — the in-feed ad row must NOT inflate it
    const countEl = page.locator('[data-testid="transaction-count"]');
    await expect(countEl).toBeVisible({ timeout: 8000 });
    const countText = (await countEl.textContent()) ?? '';
    // Accept "20" whether it's formatted as "20", "20 transactions", etc.
    expect(countText).toContain('20');
    // Ensure it does NOT say "21"
    expect(countText).not.toContain('21');
  });

});
