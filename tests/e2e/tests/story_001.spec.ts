import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * E2E Test Suite for Story #001: Upload and Parse Bank Statement
 * 
 * Test Data Location: docs/testcases/story_001_testdata/
 * Test Cases Reference: docs/testcases/story_001_Upload_and_Parse_Bank_Statement_testcases.md
 */

const TEST_DATA_DIR = path.join(__dirname, '../../../docs/testcases/story_001_testdata');

test.describe('Story #001: Upload and Parse Bank Statement', () => {
  
  test.beforeEach(async ({ page }) => {
    // Capture browser console to show WASM debug logs in test output
    page.on('console', msg => {
      console.log(`[BROWSER ${msg.type().toUpperCase()}] ${msg.text()}`);
    });
    // Navigate to the import screen
    await page.goto('/import');
    await expect(page).toHaveTitle(/MoneyInsight/);
  });

  /**
   * Test Case 1: Upload Supported HDFC Savings Statement
   * Objective: Verify that a valid HDFC Savings Excel file is parsed successfully in-browser.
   */
  test('TC1: Upload valid HDFC Savings .xls file', async ({ page }) => {
    const filePath = path.join(TEST_DATA_DIR, 'SA3234_FY2025_20251221.xls');
    
    // Locate file input and upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    
    // Wait for parsing to complete
    await page.waitForSelector('[data-testid="upload-success"]', { timeout: 10000 });
    
    // Verify success message
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible();
    
    // Verify transactions are displayed
    await expect(page.locator('[data-testid="transaction-list"]')).toBeVisible();
    
    // Verify parser name is shown
    await expect(page.locator('[data-testid="parser-name"]')).toContainText('HDFC Savings Account');
    
    // Verify at least one transaction is displayed
    const transactionRows = page.locator('[data-testid="transaction-row"]');
    await expect(transactionRows).not.toHaveCount(0);
  });

  /**
   * Test Case 2: Upload Supported HDFC Credit Card Statement
   * Objective: Verify that a valid HDFC Credit Card XLS file is parsed successfully in-browser.
   */
  test('TC2: Upload valid HDFC Credit Card .xls file', async ({ page }) => {
    const filePath = path.join(TEST_DATA_DIR, 'CC2486_20250418.xls');
    
    // Locate file input and upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    
    // Wait for parsing to complete
    await page.waitForSelector('[data-testid="upload-success"]', { timeout: 10000 });
    
    // Verify success message
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible();
    
    // Verify transactions are displayed
    await expect(page.locator('[data-testid="transaction-list"]')).toBeVisible();
    
    // Verify parser name is shown
    await expect(page.locator('[data-testid="parser-name"]')).toContainText('HDFC Credit Card');
    
    // Verify at least one transaction is displayed
    const transactionRows = page.locator('[data-testid="transaction-row"]');
    await expect(transactionRows).not.toHaveCount(0);
  });

  /**
   * Test Case 3: Reject Password-Protected Statement
   * Objective: Verify that password-protected statements are rejected with a clear error message.
   */
  test('TC3: Reject password-protected .xlsx file', async ({ page }) => {
    const filePath = path.join(TEST_DATA_DIR, 'HDFC_Savings_Protected.xlsx');
    
    // Locate file input and upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    
    // Wait for error message
    await page.waitForSelector('[data-testid="upload-error"]', { timeout: 5000 });
    
    // Verify error message contains expected text
    const errorMessage = page.locator('[data-testid="upload-error"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Password-protected and encrypted statements are not supported');
    
    // Verify transactions are NOT displayed
    await expect(page.locator('[data-testid="transaction-list"]')).not.toBeVisible();
  });

  /**
   * Test Case 4: Reject PDF File Format
   * Objective: Verify that PDF files are rejected with a clear error message.
   */
  test('TC4: Reject .pdf file format', async ({ page }) => {
    const filePath = path.join(TEST_DATA_DIR, 'Statement.pdf');
    
    // Locate file input and upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    
    // Wait for error message
    await page.waitForSelector('[data-testid="upload-error"]', { timeout: 5000 });
    
    // Verify error message contains expected text
    const errorMessage = page.locator('[data-testid="upload-error"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Only Excel (.xlsx/.xls) and CSV files are supported');
    
    // Verify transactions are NOT displayed
    await expect(page.locator('[data-testid="transaction-list"]')).not.toBeVisible();
  });

  /**
   * Test Case 5: Reject Unsupported File Formats
   * Objective: Verify that unsupported file formats are rejected with a clear error message.
   */
  test('TC5a: Reject .txt file format', async ({ page }) => {
    const filePath = path.join(TEST_DATA_DIR, 'Notes.txt');
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    
    await page.waitForSelector('[data-testid="upload-error"]', { timeout: 5000 });
    
    const errorMessage = page.locator('[data-testid="upload-error"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Only Excel (.xlsx/.xls) and CSV files are supported');
  });

  test('TC5b: Reject .doc file format', async ({ page }) => {
    const filePath = path.join(TEST_DATA_DIR, 'Document.doc');
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    
    await page.waitForSelector('[data-testid="upload-error"]', { timeout: 5000 });
    
    const errorMessage = page.locator('[data-testid="upload-error"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Only Excel (.xlsx/.xls) and CSV files are supported');
  });

  test('TC5c: Reject .json file format', async ({ page }) => {
    const filePath = path.join(TEST_DATA_DIR, 'Data.json');
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    
    await page.waitForSelector('[data-testid="upload-error"]', { timeout: 5000 });
    
    const errorMessage = page.locator('[data-testid="upload-error"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Only Excel (.xlsx/.xls) and CSV files are supported');
  });

  /**
   * Test Case 6: Reject Encrypted Statement
   * Objective: Verify that encrypted statements are rejected with a clear error message.
   */
  test('TC6: Reject encrypted .xlsx file', async ({ page }) => {
    const filePath = path.join(TEST_DATA_DIR, 'HDFC_Savings_Encrypted.xlsx');
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    
    await page.waitForSelector('[data-testid="upload-error"]', { timeout: 5000 });
    
    const errorMessage = page.locator('[data-testid="upload-error"]');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('Password-protected and encrypted statements are not supported');
  });

  /**
   * Test Case 7: Upload Corrupted or Malformed File
   * Objective: Verify that corrupted or malformed files are rejected with a clear error message.
   */
  test('TC7: Reject corrupted .xlsx file', async ({ page }) => {
    const filePath = path.join(TEST_DATA_DIR, 'Corrupted_Savings.xlsx');
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    
    // Wait for error from WASM parser
    await page.waitForSelector('[data-testid="upload-error"]', { timeout: 10000 });
    
    const errorMessage = page.locator('[data-testid="upload-error"]');
    await expect(errorMessage).toBeVisible();
    
    // Should show parsing/corruption error, not format validation error
    const errorText = await errorMessage.textContent();
    expect(
      errorText?.toLowerCase().includes('could not be parsed') || 
      errorText?.toLowerCase().includes('corrupted') ||
      errorText?.toLowerCase().includes('invalid') ||
      errorText?.toLowerCase().includes('failed to open')
    ).toBeTruthy();
  });

  /**
   * Additional Test: Drag and Drop Upload
   */
  test('TC8: Upload via drag and drop', async ({ page }) => {
    const filePath = path.join(TEST_DATA_DIR, 'SA3234_FY2025_20251221.xls');
    
    // Create a file buffer
    const buffer = require('fs').readFileSync(filePath);
    const dataTransfer = await page.evaluateHandle((data) => {
      const dt = new DataTransfer();
      const file = new File([new Uint8Array(data)], 'SA3234_FY2025_20251221.xls', { 
        type: 'application/vnd.ms-excel' 
      });
      dt.items.add(file);
      return dt;
    }, Array.from(buffer));

    // Locate drop zone
    const dropZone = page.locator('[data-testid="drop-zone"]');
    await dropZone.dispatchEvent('drop', { dataTransfer });
    
    // Wait for parsing to complete
    await page.waitForSelector('[data-testid="upload-success"]', { timeout: 10000 });
    
    // Verify success
    await expect(page.locator('[data-testid="upload-success"]')).toBeVisible();
  });

  /**
   * Additional Test: Privacy - No Network Requests for Parsing
   */
  test('TC9: Verify no network requests during parsing', async ({ page }) => {
    const filePath = path.join(TEST_DATA_DIR, 'SA3234_FY2025_20251221.xls');
    
    // Track network requests
    const requests: string[] = [];
    page.on('request', request => {
      requests.push(request.url());
    });
    
    // Upload file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    
    // Wait for parsing to complete
    await page.waitForSelector('[data-testid="upload-success"]', { timeout: 10000 });
    
    // Verify no API calls were made (excluding static assets and analytics)
    const apiRequests = requests.filter(url => 
      url.includes('/api/') || 
      url.includes('/parse') || 
      url.includes('/upload')
    );
    
    expect(apiRequests).toHaveLength(0);
  });
});
