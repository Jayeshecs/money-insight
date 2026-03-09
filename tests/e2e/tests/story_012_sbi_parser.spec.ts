import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import os from 'os';

/**
 * E2E Test Suite for Story #012: SBI Savings Bank Parser Plugin
 *
 * Story Reference:      docs/stories/story_012_SBI_Savings_Bank_Parser_Plugin.md
 * Test Cases Reference: docs/testcases/story_012_SBI_Savings_Bank_Parser_Plugin_testcases.md
 *
 * Covers TC-012-012, TC-012-013, TC-012-014, TC-012-015 (E2E tier only).
 *
 * Prerequisites:
 *   - Angular dev server running on http://localhost:4200  (ng serve)
 *   - WASM engine rebuilt with SbiSavingsParser registered
 */

const FIXTURES_DIR   = path.join(__dirname, '../../../src/engine/tests/fixtures');
const TEST_DATA_DIR  = path.join(__dirname, '../../../docs/testcases/story_001_testdata');
const SBI_FIXTURE    = path.join(FIXTURES_DIR, 'sbi_savings_sample.csv');
const HDFC_FIXTURE   = path.join(TEST_DATA_DIR, 'SA3234_FY2025_20251221.xls');

/** Inline CSV with headers the parser should NOT recognise */
const UNKNOWN_CSV_CONTENT = 'Name,Amount,Date,Note\nAlice,1000,2025-01-01,groceries\nBob,500,2025-01-02,transport\n';

let unknownCsvPath: string;

test.describe('Story #012: SBI Savings Bank Parser Plugin', () => {

  test.beforeAll(async () => {
    // Write the unknown-format CSV to a temp file once for all tests.
    unknownCsvPath = path.join(os.tmpdir(), 'unknown_format_test.csv');
    fs.writeFileSync(unknownCsvPath, UNKNOWN_CSV_CONTENT, 'utf-8');
  });

  test.afterAll(async () => {
    // Clean up temp file
    if (fs.existsSync(unknownCsvPath)) {
      fs.unlinkSync(unknownCsvPath);
    }
  });

  test.beforeEach(async ({ page }) => {
    page.on('console', msg =>
      console.log(`[BROWSER ${msg.type().toUpperCase()}] ${msg.text()}`)
    );
    // Clear IndexedDB for a clean state before each test
    await page.goto('/');
    await page.evaluate(() => indexedDB.deleteDatabase('MoneyInsightDB'));
    await page.goto('/import');
    await expect(page).toHaveTitle(/MoneyInsight/);
  });

  // ── TC-012-012: Upload SBI CSV → upload-success shown, transaction count > 0 ──
  test('TC-012-012: Upload SBI CSV shows upload-success and non-zero transaction count', async ({ page }) => {
    // Step: Upload the SBI savings fixture
    await page.locator('input[type="file"]').setInputFiles(SBI_FIXTURE);

    // Wait for parsing to complete
    await page.waitForSelector('[data-testid="upload-success"]', { timeout: 15000 });

    // upload-success must be visible
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible();

    // No parser-error should be shown
    await expect(page.locator('[data-testid="parser-error"]')).not.toBeVisible();

    // Navigate to /transactions to verify the count of stored transactions
    await page.goto('/transactions');
    await page.waitForSelector('[data-testid="transaction-count"]', { timeout: 5000 });

    // transaction-count must be present and contain a non-zero number (≥ 1, expected 6)
    const countEl = page.locator('[data-testid="transaction-count"]');
    await expect(countEl).toBeVisible({ timeout: 5000 });
    const countText = await countEl.textContent();
    const count = parseInt((countText ?? '0').replace(/\D/g, ''), 10);
    expect(count).toBeGreaterThan(0);
  });

  // ── TC-012-013: Upload SBI CSV → parser-name shows "SBI Savings" ───────────
  test('TC-012-013: Upload SBI CSV shows parser-name containing "SBI Savings"', async ({ page }) => {
    await page.locator('input[type="file"]').setInputFiles(SBI_FIXTURE);

    await page.waitForSelector('[data-testid="upload-success"]', { timeout: 15000 });

    // parser-name element must contain "SBI Savings"
    await expect(page.locator('[data-testid="parser-name"]')).toContainText('SBI Savings');
  });

  // ── TC-012-014: Parser isolation: SBI then HDFC ─────────────────────────────
  test('TC-012-014: Parser isolation — SBI CSV then HDFC XLS each resolved to correct parser', async ({ page }) => {
    // ── First upload: SBI ──
    await page.locator('input[type="file"]').setInputFiles(SBI_FIXTURE);
    await page.waitForSelector('[data-testid="upload-success"]', { timeout: 15000 });
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="parser-name"]')).toContainText('SBI Savings');

    // ── Navigate back / click "Upload Another" to reset the import screen ──
    const uploadAnotherBtn = page.getByRole('button', { name: /upload another/i });
    const uploadAnotherVisible = await uploadAnotherBtn.isVisible().catch(() => false);
    if (uploadAnotherVisible) {
      await uploadAnotherBtn.click();
    } else {
      await page.goto('/import');
      await expect(page).toHaveTitle(/MoneyInsight/);
    }

    // ── Second upload: HDFC ──
    await page.locator('input[type="file"]').setInputFiles(HDFC_FIXTURE);
    await page.waitForSelector('[data-testid="upload-success"]', { timeout: 15000 });
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible();

    // HDFC parser should be identified (Savings Account)
    await expect(page.locator('[data-testid="parser-name"]')).toContainText('HDFC');

    // Neither upload should show a parser-error
    await expect(page.locator('[data-testid="parser-error"]')).not.toBeVisible();
  });

  // ── TC-012-015: Unknown CSV → parser-error shown, upload-success NOT shown ──
  test('TC-012-015: Upload unknown-format CSV shows parser-error and NOT upload-success', async ({ page }) => {
    await page.locator('input[type="file"]').setInputFiles(unknownCsvPath);

    // Wait for either success or error — whichever arrives first
    await Promise.race([
      page.waitForSelector('[data-testid="upload-success"]', { timeout: 10000 }).catch(() => null),
      page.waitForSelector('[data-testid="parser-error"]',   { timeout: 10000 }).catch(() => null),
      page.waitForSelector('[data-testid="upload-error"]',   { timeout: 10000 }).catch(() => null),
    ]);

    // parser-error (or upload-error) must be visible
    const parserError  = page.locator('[data-testid="parser-error"]');
    const uploadError  = page.locator('[data-testid="upload-error"]');
    const parserErrVis = await parserError.isVisible().catch(() => false);
    const uploadErrVis = await uploadError.isVisible().catch(() => false);
    expect(parserErrVis || uploadErrVis).toBe(true);

    // upload-success must NOT be visible
    await expect(page.locator('[data-testid="upload-success"]')).not.toBeVisible();
  });

});
