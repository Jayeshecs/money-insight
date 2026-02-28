import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * E2E Test Suite for Story #003: Store Parsed Transactions in IndexedDB
 *
 * Acceptance Criteria:
 *   AC1: All parsed transactions are available in IndexedDB after upload
 *   AC2: Data remains available after page reload or offline
 *
 * Test Cases Reference: docs/testcases/story_003_Store_Parsed_Transactions_in_IndexedDB_testcases.md
 * Test Data Location:   docs/testcases/story_001_testdata/
 *
 * IndexedDB Details:
 *   Database:     MoneyInsightDB (version 3)
 *   Object store: transactions
 */

const TEST_DATA_DIR = path.join(__dirname, '../../../docs/testcases/story_001_testdata');

/** Helper: read transaction count directly from IndexedDB in the browser context */
async function getIndexedDBCount(page: any): Promise<number> {
  return page.evaluate((): Promise<number> => {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('MoneyInsightDB');
      req.onsuccess = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('transactions')) {
          db.close();
          resolve(0);
          return;
        }
        const tx = db.transaction('transactions', 'readonly');
        const countReq = tx.objectStore('transactions').count();
        countReq.onsuccess = () => {
          db.close();
          resolve(countReq.result);
        };
        countReq.onerror = () => {
          db.close();
          reject(countReq.error);
        };
      };
      req.onerror = () => reject(req.error);
    });
  });
}

/** Helper: clear all transactions from IndexedDB by emptying the object store.
 * Using store.clear() instead of deleteDatabase() avoids the "blocked" error
 * that occurs when Angular's IndexedDbService keeps an open connection.
 */
async function clearIndexedDB(page: any): Promise<void> {
  await page.evaluate((): Promise<void> => {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('MoneyInsightDB');
      req.onsuccess = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('transactions')) {
          db.close();
          resolve();
          return;
        }
        const tx = db.transaction('transactions', 'readwrite');
        const clearReq = tx.objectStore('transactions').clear();
        clearReq.onsuccess = () => { db.close(); resolve(); };
        clearReq.onerror  = () => { db.close(); reject(clearReq.error); };
      };
      req.onerror = () => reject(req.error);
    });
  });
}

/** Helper: count transactions for a specific account identifier using the by-account IndexedDB index. */
async function getAccountCount(page: any, account: string): Promise<number> {
  return page.evaluate((acct: string): Promise<number> => {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('MoneyInsightDB');
      req.onsuccess = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('transactions')) {
          db.close();
          resolve(0);
          return;
        }
        const tx = db.transaction('transactions', 'readonly');
        const index = tx.objectStore('transactions').index('by-account');
        const countReq = index.count(acct);
        countReq.onsuccess = () => { db.close(); resolve(countReq.result); };
        countReq.onerror  = () => { db.close(); reject(countReq.error); };
      };
      req.onerror = () => reject(req.error);
    });
  }, account);
}

test.describe('Story #003: Store Parsed Transactions in IndexedDB', () => {
  // Run serially to ensure IndexedDB state is deterministic between tests
  // (fullyParallel:true would put multiple writers into the same shared IndexedDB)
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      console.log(`[BROWSER ${msg.type().toUpperCase()}] ${msg.text()}`);
    });
    // Navigate once to the app to have a page context, then clear the DB
    await page.goto('/');
    await clearIndexedDB(page);
    await page.goto('/import');
    await expect(page).toHaveTitle(/MoneyInsight/);
  });

  /**
   * TC1: Transactions Stored in IndexedDB After Parsing
   * Verifies AC1: all parsed transactions are written to IndexedDB.
   */
  test('TC1: All parsed transactions are stored in IndexedDB after successful upload', async ({ page }) => {
    const filePath = path.join(TEST_DATA_DIR, 'SA3234_FY2025_20251221.xls');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);

    await page.waitForSelector('[data-testid="upload-success"]', { timeout: 15000 });
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible();

    // AC1: savings file always produces 17 transactions; account field = "HDFC_SAVINGS"
    const count = await getAccountCount(page, 'HDFC_SAVINGS');
    expect(count).toBe(17);
  });

  /**
   * TC2: Data Persists Across Page Reload
   * Verifies AC2: IndexedDB data survives a full page refresh.
   */
  test('TC2: Transactions remain in IndexedDB after page reload', async ({ page }) => {
    const filePath = path.join(TEST_DATA_DIR, 'SA3234_FY2025_20251221.xls');

    // Upload and wait for success
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    await page.waitForSelector('[data-testid="upload-success"]', { timeout: 15000 });

    const countBefore = await getAccountCount(page, 'HDFC_SAVINGS');
    expect(countBefore).toBe(17);

    // Reload the page (simulates browser restart / navigation)
    await page.reload();
    await expect(page).toHaveTitle(/MoneyInsight/);

    // AC2: data must survive the reload
    const countAfter = await getAccountCount(page, 'HDFC_SAVINGS');
    expect(countAfter).toBe(17);
  });

  /**
   * TC3: Data is Accessible Offline
   * Verifies AC2: IndexedDB data is readable when the network is cut off.
   * Note: We do NOT reload the page while offline because the dev server is
   * not behind a service-worker cache — Angular would fail to reload the app
   * shell. Instead we simulate a network-cut after initial load and verify
   * that the same browser context can still read data from IndexedDB (which
   * is a purely local store and does not need network connectivity).
   */
  test('TC3: Stored transactions are accessible when browser is offline', async ({ page, context }) => {
    const filePath = path.join(TEST_DATA_DIR, 'SA3234_FY2025_20251221.xls');

    // Upload while online
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    await page.waitForSelector('[data-testid="upload-success"]', { timeout: 15000 });

    const countOnline = await getAccountCount(page, 'HDFC_SAVINGS');
    expect(countOnline).toBe(17);

    // Simulate loss of network connectivity
    await context.setOffline(true);

    // AC2: IndexedDB (a local store) must remain readable without a network
    const countOffline = await getAccountCount(page, 'HDFC_SAVINGS');
    expect(countOffline).toBe(17);

    // Restore connectivity
    await context.setOffline(false);
  });

  /**
   * TC4: Multiple Statement Uploads Are Accumulated in IndexedDB
   * Verifies AC1: each subsequent upload ADDS new transactions — does not overwrite prior data.
   *
   * Strategy: reads DB counts before and after each upload, verifies a positive
   * delta and that prior data is not erased. Avoids hardcoded transaction counts
   * because actual counts depend on real statement files.
   */
  test('TC4: Transactions from multiple uploads accumulate in IndexedDB', async ({ page }) => {
    const savingsFile = path.join(TEST_DATA_DIR, 'SA3234_FY2025_20251221.xls');
    const creditFile  = path.join(TEST_DATA_DIR, 'CC2486_20250418.xls');

    // Baseline (db was cleared in beforeEach)
    const totalBaseline = await getIndexedDBCount(page);

    // --- Upload 1: HDFC Savings ---
    let fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(savingsFile);
    await page.waitForSelector('[data-testid="upload-success"]', { timeout: 15000 });

    // Extract savings UI count for verification
    const savingsHeading = await page.locator('[data-testid="transaction-list"] h4').textContent();
    const savingsUiCount = parseInt(savingsHeading?.match(/\((\d+)\)/)?.[1] ?? '0', 10);
    expect(savingsUiCount).toBeGreaterThan(0);

    const totalAfterSavings = await getIndexedDBCount(page);
    const savingsDelta = totalAfterSavings - totalBaseline;
    expect(savingsDelta).toBe(savingsUiCount);  // DB delta matches UI count

    // Reset for second upload
    await page.getByRole('button', { name: /upload another/i }).click();

    // --- Upload 2: HDFC Credit Card ---
    fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(creditFile);
    await page.waitForSelector('[data-testid="upload-success"]', { timeout: 15000 });

    // Extract credit UI count for verification
    const creditHeading = await page.locator('[data-testid="transaction-list"] h4').textContent();
    const creditUiCount = parseInt(creditHeading?.match(/\((\d+)\)/)?.[1] ?? '0', 10);
    expect(creditUiCount).toBeGreaterThan(0);

    const totalAfterCredit = await getIndexedDBCount(page);
    const creditDelta = totalAfterCredit - totalAfterSavings;

    // AC1: credit card upload added new rows — it did not wipe savings rows
    expect(creditDelta).toBe(creditUiCount);
    expect(totalAfterCredit).toBe(totalAfterSavings + creditUiCount);
    // The savings rows must still be present
    expect(await getAccountCount(page, 'HDFC_SAVINGS')).toBe(savingsDelta);
  });

  /**
   * TC5: IndexedDB Transaction Count Matches UI Displayed Count
   * Verifies consistency between WASM parse output, UI display, and IndexedDB storage.
   */
  test('TC5: IndexedDB count matches the count shown in the UI', async ({ page }) => {
    const filePath = path.join(TEST_DATA_DIR, 'CC2486_20250418.xls');

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    await page.waitForSelector('[data-testid="upload-success"]', { timeout: 15000 });

    // Extract displayed count from the "Parsed Transactions (N)" heading
    const listHeading = page.locator('[data-testid="transaction-list"] h4');
    const headingText = await listHeading.textContent();
    const match = headingText?.match(/\((\d+)\)/);
    const uiCount = match ? parseInt(match[1], 10) : -1;
    expect(uiCount).toBeGreaterThan(0);

    // IndexedDB per-account count must match UI count for this specific upload
    const dbCount = await getAccountCount(page, 'CC2486');
    expect(dbCount).toBe(uiCount);
  });
});

