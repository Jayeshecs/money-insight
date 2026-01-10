# Test Execution Guide - Stories 001 & 002

## Overview
This document provides instructions for executing automated tests for Story 001 (Upload and Parse) and Story 002 (Auto-Detect Parser).

---

## Prerequisites

### 1. System Requirements
- Node.js 20+ installed
- Rust toolchain installed (for WASM engine)
- Git Bash or equivalent terminal (Windows)

### 2. Build WASM Engine
```bash
cd src/engine
./build-deploy.sh  # Linux/Mac/Git Bash
# OR
build-deploy.bat   # Windows CMD
```

### 3. Install Dependencies

#### Angular Client
```bash
cd src/client
npm install
```

#### E2E Tests
```bash
cd tests/e2e
npm install
npx playwright install chromium
```

---

## Test Execution

### Step 1: Start Angular Development Server

Open Terminal 1:
```bash
cd src/client
npm run start
# Wait for "Compiled successfully" message
# Server runs on http://localhost:4200
```

### Step 2: Run Story 001 Tests

Open Terminal 2:
```bash
cd tests/e2e

# Run all Story 001 tests
npx playwright test story_001.spec.ts

# Run specific test
npx playwright test story_001.spec.ts -g "TC1"

# Run with UI mode (interactive)
npx playwright test story_001.spec.ts --ui

# Run in headed mode (see browser)
npx playwright test story_001.spec.ts --headed
```

### Step 3: Run Story 002 Tests

```bash
cd tests/e2e

# Run all Story 002 tests
npx playwright test story-002-auto-detect.spec.ts

# Run with detailed output
npx playwright test story-002-auto-detect.spec.ts --reporter=list

# Run specific test case
npx playwright test story-002-auto-detect.spec.ts -g "TC1"
```

### Step 4: Run All Tests

```bash
cd tests/e2e

# Run all test suites
npx playwright test

# Run tests in parallel
npx playwright test --workers=4

# Generate and view HTML report
npx playwright test
npx playwright show-report
```

---

## Test Case Coverage

### Story 001: Upload and Parse Bank Statement
**File:** `tests/e2e/tests/story_001.spec.ts`

| Test Case | Description | Status |
|-----------|-------------|--------|
| TC1 | Upload valid HDFC Savings .xls file | ✅ Implemented |
| TC2 | Upload valid HDFC Credit Card .xls file | ✅ Implemented |
| TC3 | Reject password-protected .xlsx file | ✅ Implemented |
| TC4 | Reject PDF file format | ✅ Implemented |
| TC5a | Reject .txt file format | ✅ Implemented |
| TC5b | Reject .doc file format | ✅ Implemented |
| TC5c | Reject .json file format | ✅ Implemented |
| TC6 | Reject encrypted statement | ✅ Implemented |
| TC7 | Handle corrupted file | ⚠️ Depends on test data |

**Test Data Location:** `docs/testcases/story_001_testdata/`

---

### Story 002: Auto-Detect Parser Plugin
**File:** `tests/e2e/tests/story-002-auto-detect.spec.ts`

| Test Case | Description | Status |
|-----------|-------------|--------|
| TC1 | Auto-detect HDFC Savings statement | ✅ Implemented |
| TC2 | Auto-detect HDFC Credit Card statement | ✅ Implemented |
| TC3 | Show error for unknown format | ✅ Implemented |
| TC4 | Correctly detect parser in sequence | ✅ Implemented |
| TC6 | Auto-detect CSV format | ✅ Implemented |
| TC7 | Handle corrupted file gracefully | ✅ Implemented |
| TC8 | Auto-detect performance with large file | ✅ Implemented |
| TC9 | Sequential uploads maintain detection | ✅ Implemented |
| TC10 | Handle empty file gracefully | ✅ Implemented |

**Test Data Requirements:**
- Reuses: `docs/testcases/story_001_testdata/`
- New data needed: `docs/testcases/story_002_testdata/` (see below)

---

## Required Test Data for Story 002

Create the following files in `docs/testcases/story_002_testdata/`:

### 1. Unknown_Bank_Statement.csv
A CSV file with a format that doesn't match any registered parser:
```csv
Account,Date,Particulars,Amount
123456,2025-01-01,Sample Transaction,1000.00
```

### 2. HDFC_Savings_Statement.csv
CSV version of HDFC Savings statement (convert from existing .xls):
```csv
Date,Narration,Chq./Ref.No.,Value Dt,Withdrawal Amt.,Deposit Amt.,Closing Balance
01/01/25,ATM Withdrawal,,,5000.00,,45000.00
```

### 3. HDFC_Large_Statement.xlsx
Generate an Excel file with 500+ transactions using the HDFC Savings format.
- Use `docs/testcases/story_001_testdata/generate_hdfc_cc_testdata.py` as reference
- Create similar script for large dataset generation

### 4. Empty_Statement.xlsx
An Excel file with headers but no data rows.

---

## Test Execution Status

### ✅ Completed Tasks

1. **Test Case Documentation**
   - ✅ Story 002 test cases documented: [story_002_Auto-Detect_and_Apply_Correct_Parser_Plugin_testcases.md](../../docs/testcases/story_002_Auto-Detect_and_Apply_Correct_Parser_Plugin_testcases.md)
   - ✅ Story 003 test cases documented: [story_003_Store_Parsed_Transactions_in_IndexedDB_testcases.md](../../docs/testcases/story_003_Store_Parsed_Transactions_in_IndexedDB_testcases.md)

2. **Playwright Test Implementation**
   - ✅ Story 002 Playwright tests: [story-002-auto-detect.spec.ts](tests/story-002-auto-detect.spec.ts)
   - ✅ 12 test cases implemented
   - ✅ Integration tests with WASM engine included

3. **Test Infrastructure**
   - ✅ Test framework configured
   - ✅ Test data structure established

### ⚠️ Pending Tasks

1. **Test Data Generation**
   - ⚠️ Create `story_002_testdata/` directory
   - ⚠️ Generate required test files (see list above)
   - ⚠️ Verify corrupted file test data from Story 001

2. **Angular Application Updates**
   - ⚠️ Ensure `data-testid` attributes are implemented in Angular components
   - ⚠️ Verify auto-detect functionality is exposed in UI
   - ⚠️ Implement error handling for "No compatible parser found"

3. **Test Execution**
   - ⚠️ Run Story 001 tests with current implementation
   - ⚠️ Run Story 002 tests after test data is created
   - ⚠️ Generate HTML test report
   - ⚠️ Document test results

---

## Expected Angular Component Test IDs

The following `data-testid` attributes should be present in Angular templates:

### Upload Component
```html
<input type="file" data-testid="file-input" />
<button data-testid="upload-button">Upload</button>
```

### Result/Status Component
```html
<div data-testid="upload-success">File processed successfully</div>
<div data-testid="upload-error">{{ errorMessage }}</div>
<div data-testid="parser-name">{{ parserName }}</div>
<div data-testid="parse-duration">{{ parseDuration }} ms</div>
<button data-testid="upload-another">Upload Another File</button>
```

### Transaction List Component
```html
<div data-testid="transaction-list">
  <div data-testid="transaction-row" *ngFor="let tx of transactions">
    <span data-testid="transaction-date">{{ tx.date }}</span>
    <span data-testid="transaction-description">{{ tx.description }}</span>
    <span data-testid="transaction-amount">{{ tx.amount }}</span>
  </div>
</div>
```

---

## Running Tests Without Angular Server

If you want to run tests against a different environment:

```bash
# Set base URL
npx playwright test --config=playwright.config.ts --base-url=http://localhost:3000

# Or modify playwright.config.ts:
# baseURL: 'http://your-server:port'
```

---

## Debugging Failed Tests

### View Test Results
```bash
# Open HTML report
npx playwright show-report

# View trace for failed tests
npx playwright show-trace test-results/.../trace.zip
```

### Run in Debug Mode
```bash
# Debug mode with Playwright Inspector
npx playwright test story_001.spec.ts --debug

# Debug specific test
npx playwright test story_001.spec.ts -g "TC1" --debug
```

### View Screenshots
Screenshots for failed tests are saved in `test-results/` directory.

---

## Continuous Integration

To run tests in CI/CD pipeline:

```bash
# Install dependencies
npm ci
npx playwright install --with-deps chromium

# Run tests with retries
CI=true npx playwright test --reporter=json

# Generate JSON report
npx playwright test --reporter=json > test-results.json
```

---

## Test Maintenance

### Adding New Tests

1. Create test file in `tests/` directory following naming convention:
   - Format: `story-XXX-description.spec.ts`

2. Follow existing test structure:
   ```typescript
   import { test, expect } from '@playwright/test';
   
   test.describe('Story #XXX: Title', () => {
     test.beforeEach(async ({ page }) => {
       await page.goto('/import');
     });
     
     test('TC1: Test description', async ({ page }) => {
       // Test implementation
     });
   });
   ```

3. Document test cases in `docs/testcases/story_XXX_testcases.md`

4. Add test data to `docs/testcases/story_XXX_testdata/`

### Updating Existing Tests

1. Update test case documentation first
2. Modify test implementation
3. Run tests to verify changes
4. Update this execution guide if needed

---

## Troubleshooting

### Issue: Tests fail with "Timeout waiting for selector"
**Solution:** Ensure Angular dev server is running and accessible at `http://localhost:4200`

### Issue: Tests fail with "File not found"
**Solution:** Verify test data files exist in `docs/testcases/story_XXX_testdata/`

### Issue: WASM parsing fails
**Solution:** 
1. Rebuild WASM engine: `cd src/engine && ./build-deploy.sh`
2. Clear browser cache
3. Verify WASM files are in `src/client/src/assets/wasm/`

### Issue: Tests pass locally but fail in CI
**Solution:** 
1. Check Node.js and Playwright versions match CI environment
2. Ensure all dependencies are in `package.json`
3. Verify test data is committed to repository

---

## Next Steps

1. **Generate Test Data**
   ```bash
   cd docs/testcases/story_002_testdata
   # Create test data files as specified above
   ```

2. **Run Story 001 Tests**
   ```bash
   cd tests/e2e
   npx playwright test story_001.spec.ts --reporter=list
   ```

3. **Run Story 002 Tests**
   ```bash
   cd tests/e2e
   npx playwright test story-002-auto-detect.spec.ts --reporter=list
   ```

4. **Review and Document Results**
   - Check HTML report
   - Document any failures
   - Create defect tickets if needed

---

## References

- [Playwright Documentation](https://playwright.dev/)
- [Story 001 Test Cases](../../docs/testcases/story_001_Upload_and_Parse_Bank_Statement_testcases.md)
- [Story 002 Test Cases](../../docs/testcases/story_002_Auto-Detect_and_Apply_Correct_Parser_Plugin_testcases.md)
- [Story 003 Test Cases](../../docs/testcases/story_003_Store_Parsed_Transactions_in_IndexedDB_testcases.md)
- [Test Data Specification](../../docs/testcases/story_001_testdata/HDFC_CC_TEST_DATA_SPEC.md)

---
