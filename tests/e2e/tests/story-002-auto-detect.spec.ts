import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * E2E Test Suite for Story #002: Auto-Detect and Apply Correct Parser Plugin
 * 
 * Test Data Location: docs/testcases/story_001_testdata/ (reused), story_002_testdata/ (new)
 * Test Cases Reference: docs/testcases/story_002_Auto-Detect_and_Apply_Correct_Parser_Plugin_testcases.md
 */

const TEST_DATA_DIR_001 = path.join(__dirname, '../../../docs/testcases/story_001_testdata');
const TEST_DATA_DIR_002 = path.join(__dirname, '../../../docs/testcases/story_002_testdata');

test.describe('Story #002: Auto-Detect and Apply Correct Parser Plugin', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the import screen
    await page.goto('/import');
    await expect(page).toHaveTitle(/MoneyInsight/);
  });

  /**
   * Test Case 1: Auto-Detect HDFC Savings Statement
   * Objective: Verify that the system automatically detects and applies the HDFC Savings parser.
   */
  test('TC1: Auto-detect HDFC Savings statement', async ({ page }) => {
    const filePath = path.join(TEST_DATA_DIR_001, 'SA3234_FY2025_20251221.xls');
    
    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    
    // Wait for parsing to complete
    await page.waitForSelector('[data-testid="upload-success"]', { timeout: 10000 });
    
    // Verify parser was auto-detected and is displayed
    await expect(page.locator('[data-testid="parser-name"]')).toContainText('HDFC Savings Account');
    
    // Verify transactions are displayed
    const transactionRows = page.locator('[data-testid="transaction-row"]');
    await expect(transactionRows).not.toHaveCount(0);
    
    // Verify no manual parser selection UI was shown
    await expect(page.locator('[data-testid="parser-selector"]')).not.toBeVisible();
  });

  /**
   * Test Case 2: Auto-Detect HDFC Credit Card Statement
   * Objective: Verify that the system automatically detects and applies the HDFC Credit Card parser.
   */
  test('TC2: Auto-detect HDFC Credit Card statement', async ({ page }) => {
    const filePath = path.join(TEST_DATA_DIR_001, 'CC2486_20250418.xls');
    
    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    
    // Wait for parsing to complete
    await page.waitForSelector('[data-testid="upload-success"]', { timeout: 10000 });
    
    // Verify parser was auto-detected and is displayed
    await expect(page.locator('[data-testid="parser-name"]')).toContainText('HDFC Credit Card');
    
    // Verify transactions are displayed
    const transactionRows = page.locator('[data-testid="transaction-row"]');
    await expect(transactionRows).not.toHaveCount(0);
    
    // Verify no manual parser selection UI was shown
    await expect(page.locator('[data-testid="parser-selector"]')).not.toBeVisible();
  });

  /**
   * Test Case 3: Detect Unknown Format and Notify User
   * Objective: Verify that when no parser matches the file format, the user receives a clear error.
   */
  test('TC3: Show error for unknown/unsupported format', async ({ page }) => {
    const filePath = path.join(TEST_DATA_DIR_002, 'Unknown_Bank_Statement.csv');
    
    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    
    // Wait for error message
    await page.waitForSelector('[data-testid="upload-error"]', { timeout: 5000 });
    
    // Verify error message
    const errorMessage = page.locator('[data-testid="upload-error"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('No compatible parser found for this file format');
    
    // Verify transactions are NOT displayed
    await expect(page.locator('[data-testid="transaction-list"]')).not.toBeVisible();
    
    // Verify "Report Issue" link or button is available (if implemented)
    // await expect(page.locator('[data-testid="report-issue"]')).toBeVisible();
  });

  /**
   * Test Case 4: Auto-Detect with Multiple Parsers Registered
   * Objective: Verify correct parser selection when multiple parsers are available.
   */
  test('TC4: Correctly detect parser for different formats in sequence', async ({ page }) => {
    // Upload HDFC Savings
    const savingsPath = path.join(TEST_DATA_DIR_001, 'SA3234_FY2025_20251221.xls');
    let fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(savingsPath);
    
    await page.waitForSelector('[data-testid="upload-success"]', { timeout: 10000 });
    await expect(page.locator('[data-testid="parser-name"]')).toContainText('HDFC Savings Account');
    
    // Clear or prepare for next upload
    await page.locator('[data-testid="upload-another"]').click();
    
    // Upload HDFC Credit Card
    const creditCardPath = path.join(TEST_DATA_DIR_001, 'CC2486_20250418.xls');
    fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(creditCardPath);
    
    await page.waitForSelector('[data-testid="upload-success"]', { timeout: 10000 });
    await expect(page.locator('[data-testid="parser-name"]')).toContainText('HDFC Credit Card');
    
    // Verify no cross-contamination
    await expect(page.locator('[data-testid="parser-name"]')).not.toContainText('Savings');
  });

  /**
   * Test Case 6: Auto-Detect with CSV Format
   * Objective: Verify that auto-detection works correctly with CSV files.
   */
  test('TC6: Auto-detect CSV format statement', async ({ page }) => {
    const filePath = path.join(TEST_DATA_DIR_002, 'HDFC_Savings_Statement.csv');
    
    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    
    // Wait for parsing to complete
    await page.waitForSelector('[data-testid="upload-success"]', { timeout: 10000 });
    
    // Verify parser was auto-detected
    await expect(page.locator('[data-testid="parser-name"]')).toBeVisible();
    
    // Verify transactions are displayed
    const transactionRows = page.locator('[data-testid="transaction-row"]');
    await expect(transactionRows).not.toHaveCount(0);
  });

  /**
   * Test Case 7: Auto-Detect Fails for Corrupted File
   * Objective: Verify that corrupted files are rejected gracefully.
   */
  test('TC7: Handle corrupted file gracefully', async ({ page }) => {
    const filePath = path.join(TEST_DATA_DIR_001, 'HDFC_Savings_Corrupted.xlsx');
    
    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    
    // Wait for error message
    await page.waitForSelector('[data-testid="upload-error"]', { timeout: 5000 });
    
    // Verify error message
    const errorMessage = page.locator('[data-testid="upload-error"]');
    await expect(errorMessage).toBeVisible();
    // Error could be either "no parser found" or "corrupted file"
    const errorText = await errorMessage.textContent();
    expect(
      errorText?.includes('No compatible parser found') || 
      errorText?.includes('corrupted') || 
      errorText?.includes('unreadable')
    ).toBeTruthy();
    
    // Verify no transactions are displayed
    await expect(page.locator('[data-testid="transaction-list"]')).not.toBeVisible();
  });

  /**
   * Test Case 8: Auto-Detect Performance with Large File
   * Objective: Verify that auto-detection completes quickly even with large files.
   */
  test('TC8: Auto-detect performance with large statement', async ({ page }) => {
    const filePath = path.join(TEST_DATA_DIR_002, 'HDFC_Large_Statement.xlsx');
    
    // Upload file and measure time
    const startTime = Date.now();
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    
    // Wait for parsing to complete
    await page.waitForSelector('[data-testid="upload-success"]', { timeout: 15000 });
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    // Verify parser was detected
    await expect(page.locator('[data-testid="parser-name"]')).toBeVisible();
    
    // Check if parse duration is displayed in UI
    const parseDurationElement = page.locator('[data-testid="parse-duration"]');
    if (await parseDurationElement.isVisible()) {
      const durationText = await parseDurationElement.textContent();
      console.log(`Parse duration displayed: ${durationText}`);
    }
    
    // Performance assertion: total time should be reasonable (< 10 seconds)
    expect(totalTime).toBeLessThan(10000);
    console.log(`Total upload and parse time: ${totalTime}ms`);
  });

  /**
   * Test Case 9: Sequential File Upload with Different Formats
   * Objective: Verify auto-detection works correctly for sequential uploads.
   */
  test('TC9: Sequential uploads maintain correct parser detection', async ({ page }) => {
    // First upload: HDFC Savings
    const savingsPath = path.join(TEST_DATA_DIR_001, 'SA3234_FY2025_20251221.xls');
    let fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(savingsPath);
    
    await page.waitForSelector('[data-testid="upload-success"]', { timeout: 10000 });
    const firstParser = await page.locator('[data-testid="parser-name"]').textContent();
    expect(firstParser).toContain('HDFC Savings');
    
    // Get transaction count for first upload
    const firstTxCount = await page.locator('[data-testid="transaction-row"]').count();
    
    // Trigger upload another file (depends on UI implementation)
    // Option 1: Click "Upload Another" button
    if (await page.locator('[data-testid="upload-another"]').isVisible()) {
      await page.locator('[data-testid="upload-another"]').click();
    }
    // Option 2: Direct file input (if it allows multiple uploads)
    
    // Second upload: HDFC Credit Card
    const creditCardPath = path.join(TEST_DATA_DIR_001, 'CC2486_20250418.xls');
    fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(creditCardPath);
    
    await page.waitForSelector('[data-testid="upload-success"]', { timeout: 10000 });
    const secondParser = await page.locator('[data-testid="parser-name"]').textContent();
    expect(secondParser).toContain('HDFC Credit Card');
    
    // Verify each upload maintained its correct parser
    expect(firstParser).not.toEqual(secondParser);
    
    // Verify transactions from second upload are displayed
    const secondTxCount = await page.locator('[data-testid="transaction-row"]').count();
    expect(secondTxCount).toBeGreaterThan(0);
    
    // If transactions accumulate, verify count increased
    // If transactions replace, verify count is from second file only
    // This depends on the application's behavior
  });

  /**
   * Test Case 10: Auto-Detect with Empty File
   * Objective: Verify that empty files are handled gracefully.
   */
  test('TC10: Handle empty file gracefully', async ({ page }) => {
    const filePath = path.join(TEST_DATA_DIR_002, 'Empty_Statement.xlsx');
    
    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    
    // Wait for error message
    await page.waitForSelector('[data-testid="upload-error"]', { timeout: 5000 });
    
    // Verify error message
    const errorMessage = page.locator('[data-testid="upload-error"]');
    await expect(errorMessage).toBeVisible();
    const errorText = await errorMessage.textContent();
    expect(
      errorText?.includes('No compatible parser found') ||
      errorText?.includes('empty') ||
      errorText?.includes('no data')
    ).toBeTruthy();
    
    // Verify no transactions are displayed
    await expect(page.locator('[data-testid="transaction-list"]')).not.toBeVisible();
  });

  /**
   * Additional Test: Verify Parser Metadata is Returned
   * Objective: Verify that parser metadata (name, parse duration) is available in the result.
   */
  test('Verify parser metadata is displayed after auto-detection', async ({ page }) => {
    const filePath = path.join(TEST_DATA_DIR_001, 'SA3234_FY2025_20251221.xls');
    
    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    
    // Wait for parsing to complete
    await page.waitForSelector('[data-testid="upload-success"]', { timeout: 10000 });
    
    // Verify parser name is displayed
    await expect(page.locator('[data-testid="parser-name"]')).toBeVisible();
    
    // Verify parse duration is displayed (if implemented)
    const parseDurationElement = page.locator('[data-testid="parse-duration"]');
    if (await parseDurationElement.isVisible()) {
      const duration = await parseDurationElement.textContent();
      expect(duration).toMatch(/\d+\s*ms/); // Should contain digits followed by "ms"
    }
    
    // Verify source parser in transaction metadata (if exposed in UI)
    const sourceParser = page.locator('[data-testid="source-parser"]');
    if (await sourceParser.isVisible()) {
      await expect(sourceParser).toContainText('HDFC Savings');
    }
  });

});

/**
 * Test Group: Integration with WASM Engine
 * These tests verify the auto-detection flow through the WASM engine
 */
test.describe('Story #002: WASM Engine Auto-Detection Integration', () => {

  /**
   * Verify that WASM engine's PluginRegistry is properly initialized
   */
  test('Verify multiple parsers are registered in WASM engine', async ({ page }) => {
    await page.goto('/import');
    
    // Open console to capture WASM logs (if available)
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'log') {
        consoleLogs.push(msg.text());
      }
    });
    
    // Upload a file to trigger parser registration
    const filePath = path.join(TEST_DATA_DIR_001, 'SA3234_FY2025_20251221.xls');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    
    await page.waitForSelector('[data-testid="upload-success"]', { timeout: 10000 });
    
    // Check if WASM engine logged parser registrations (if debug mode is on)
    // This is optional and depends on whether the engine emits such logs
    const hasParserLogs = consoleLogs.some(log => 
      log.includes('parser') || log.includes('registry')
    );
    
    // At minimum, verify successful parsing indicates registry is working
    await expect(page.locator('[data-testid="transaction-list"]')).toBeVisible();
  });

  /**
   * Verify that WASM engine returns proper error when no parser matches
   */
  test('WASM engine returns proper error structure for unmatched format', async ({ page }) => {
    await page.goto('/import');
    
    // Capture any error responses from WASM
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Upload unknown format file
    const filePath = path.join(TEST_DATA_DIR_002, 'Unknown_Bank_Statement.csv');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    
    // Wait for error
    await page.waitForSelector('[data-testid="upload-error"]', { timeout: 5000 });
    
    // Verify error structure is properly displayed
    const errorMessage = page.locator('[data-testid="upload-error"]');
    await expect(errorMessage).toContainText('No compatible parser found');
    
    // Verify no uncaught exceptions occurred
    expect(consoleErrors.filter(e => e.includes('Uncaught'))).toHaveLength(0);
  });

});
