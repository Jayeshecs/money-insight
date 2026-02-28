import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * E2E Test Suite for Story #002: Auto-Detect and Apply Correct Parser Plugin
 *
 * Acceptance Criteria:
 *   AC1: System correctly identifies and applies the parser for HDFC Savings and Credit Card formats
 *   AC2: If no parser matches, user is notified and can report the issue
 *
 * Test Cases Reference: docs/testcases/story_002_Auto-Detect_and_Apply_Correct_Parser_Plugin_testcases.md
 * Test Data Location:   docs/testcases/story_001_testdata/
 */

const TEST_DATA_DIR = path.join(__dirname, '../../../docs/testcases/story_001_testdata');

test.describe('Story #002: Auto-Detect and Apply Correct Parser Plugin', () => {

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      console.log(`[BROWSER ${msg.type().toUpperCase()}] ${msg.text()}`);
    });
    // Clear IndexedDB before each test to ensure a clean state
    await page.goto('/');
    await page.evaluate(() => indexedDB.deleteDatabase('MoneyInsightDB'));
    await page.goto('/import');
    await expect(page).toHaveTitle(/MoneyInsight/);
  });

  /**
   * TC1: Auto-Detect HDFC Savings Statement
   * Verifies AC1: system selects HDFC Savings parser automatically.
   */
  test('TC1: Auto-detect HDFC Savings parser from .xls file', async ({ page }) => {
    const filePath = path.join(TEST_DATA_DIR, 'SA3234_FY2025_20251221.xls');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);

    await page.waitForSelector('[data-testid="upload-success"]', { timeout: 15000 });

    // AC1: Correct parser identified without manual selection
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="parser-name"]')).toContainText('HDFC Savings Account');

    // Transactions should be present
    await expect(page.locator('[data-testid="transaction-list"]')).toBeVisible();
    const rows = page.locator('[data-testid="transaction-row"]');
    await expect(rows).not.toHaveCount(0);
  });

  /**
   * TC2: Auto-Detect HDFC Credit Card Statement
   * Verifies AC1: system selects HDFC Credit Card parser automatically.
   */
  test('TC2: Auto-detect HDFC Credit Card parser from .xls file', async ({ page }) => {
    const filePath = path.join(TEST_DATA_DIR, 'CC2486_20250418.xls');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);

    await page.waitForSelector('[data-testid="upload-success"]', { timeout: 15000 });

    // AC1: Correct parser identified without manual selection
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="parser-name"]')).toContainText('HDFC Credit Card');

    await expect(page.locator('[data-testid="transaction-list"]')).toBeVisible();
    const rows = page.locator('[data-testid="transaction-row"]');
    await expect(rows).not.toHaveCount(0);
  });

  /**
   * TC3: Unknown Format Triggers Error Notification
   * Verifies AC2: user is notified when no parser matches.
   */
  test('TC3: Unknown format shows "no parser" error', async ({ page }) => {
    // A plain text file with no recognisable bank statement structure
    const filePath = path.join(TEST_DATA_DIR, 'Notes.txt');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);

    await page.waitForSelector('[data-testid="upload-error"]', { timeout: 5000 });

    const errorMsg = page.locator('[data-testid="upload-error"]');
    await expect(errorMsg).toBeVisible();

    // AC2: user-friendly error is shown; no transactions displayed
    await expect(page.locator('[data-testid="transaction-list"]')).not.toBeVisible();
  });

  /**
   * TC4: Multiple Parsers Registered — Correct Plugin Selected Per File
   * Verifies AC1: with both parsers registered, each file routes to its own parser.
   */
  test('TC4: Correct parser selected for each file when multiple parsers are registered', async ({ page }) => {
    const savingsFile = path.join(TEST_DATA_DIR, 'SA3234_FY2025_20251221.xls');
    const creditFile  = path.join(TEST_DATA_DIR, 'CC2486_20250418.xls');

    // --- First upload: Savings ---
    let fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(savingsFile);
    await page.waitForSelector('[data-testid="upload-success"]', { timeout: 15000 });
    await expect(page.locator('[data-testid="parser-name"]')).toContainText('HDFC Savings Account');

    // Reset for second upload
    await page.getByRole('button', { name: /upload another/i }).click();

    // --- Second upload: Credit Card ---
    fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(creditFile);
    await page.waitForSelector('[data-testid="upload-success"]', { timeout: 15000 });
    await expect(page.locator('[data-testid="parser-name"]')).toContainText('HDFC Credit Card');
  });

  /**
   * TC7: Corrupted File Rejected Gracefully
   * Verifies AC2: corrupted files produce a clear error, no parser applied, no crash.
   */
  test('TC7: Corrupted file is rejected with a clear error', async ({ page }) => {
    const filePath = path.join(TEST_DATA_DIR, 'Corrupted_Savings.xlsx');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);

    await page.waitForSelector('[data-testid="upload-error"]', { timeout: 15000 });

    const errorMsg = page.locator('[data-testid="upload-error"]');
    await expect(errorMsg).toBeVisible();

    // Verify no transaction data is shown
    await expect(page.locator('[data-testid="transaction-list"]')).not.toBeVisible();
  });

  /**
   * TC9: Sequential Uploads with Different Formats
   * Verifies no parser state pollution between consecutive uploads.
   */
  test('TC9: Sequential uploads each detect the correct parser independently', async ({ page }) => {
    const savingsFile = path.join(TEST_DATA_DIR, 'SA3234_FY2025_20251221.xls');
    const creditFileV1 = path.join(TEST_DATA_DIR, 'CC2486_20251218.xls');

    // Upload 1
    let fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(savingsFile);
    await page.waitForSelector('[data-testid="upload-success"]', { timeout: 15000 });
    await expect(page.locator('[data-testid="parser-name"]')).toContainText('HDFC Savings Account');

    // Reset
    await page.getByRole('button', { name: /upload another/i }).click();

    // Upload 2 — different version of credit card file
    fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(creditFileV1);
    await page.waitForSelector('[data-testid="upload-success"]', { timeout: 15000 });
    await expect(page.locator('[data-testid="parser-name"]')).toContainText('HDFC Credit Card');
  });
});
