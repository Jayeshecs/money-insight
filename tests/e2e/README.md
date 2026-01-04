# MoneyInsight E2E Test Suite

End-to-end automated tests for MoneyInsight using Playwright.

## Quick Start

### Prerequisites
- Node.js 20+ installed
- Angular dev server running on port 4200

### Installation
```bash
npm install
npx playwright install chromium
```

### Running Tests

#### Option 1: Manual Server Start (Recommended)
```bash
# Terminal 1: Start Angular dev server
cd ../../src/client
ng serve

# Terminal 2: Run tests
cd ../../tests/e2e
npm test
```

#### Option 2: Using Shell Script (Linux/Mac/Git Bash)
```bash
chmod +x run-tests.sh
./run-tests.sh
```

### View Test Report
```bash
npx playwright show-report
```

## Test Structure

### Test Files
- `tests/story_001.spec.ts` - Story #001: Upload and Parse Bank Statement
  - 11 test cases covering file upload, validation, parsing, and error handling

### Test Data
Test data is located in `../../docs/testcases/story_001_testdata/`:
- HDFC Savings statements (.xls)
- HDFC Credit Card statements (.xls)
- Password-protected files
- Invalid format files (PDF, TXT, DOC, JSON)
- Encrypted files

## Test Cases

### Story #001: Upload and Parse Bank Statement

| ID | Test Case | Status | Notes |
|----|-----------|--------|-------|
| TC1 | Upload HDFC Savings .xls | ⚠️ Blocked | DEF-001: Missing test data |
| TC2 | Upload HDFC Credit Card .xls | ⚠️ Blocked | DEF-001: Missing test data |
| TC3 | Reject password-protected file | ⚠️ Pending | DEF-002: Detection unverified |
| TC4 | Reject PDF format | ✅ Ready | UI validation |
| TC5a | Reject .txt format | ✅ Ready | UI validation |
| TC5b | Reject .doc format | ✅ Ready | UI validation |
| TC5c | Reject .json format | ✅ Ready | UI validation |
| TC6 | Reject encrypted file | ⚠️ Pending | DEF-002: Detection unverified |
| TC7 | Reject corrupted file | ⚠️ Blocked | DEF-003: Missing test data |
| TC8 | Drag and drop upload | ✅ Ready | Needs validation |
| TC9 | No network requests (privacy) | ✅ Ready | Privacy verification |

## Configuration

### playwright.config.ts
- **Base URL:** http://localhost:4200
- **Browser:** Chromium (Desktop Chrome)
- **Reporters:** line (console), html (detailed report)
- **Screenshot:** On failure only
- **Trace:** On first retry
- **Parallel Execution:** Enabled

## Test Selectors

Tests use `data-testid` attributes for reliable element selection:

### Import Component
- `drop-zone` - File drag-drop area
- `file-input` - Hidden file input element
- `upload-error` - Error message container
- `upload-success` - Success message container

### Transactions Component
- `transaction-list` - Transaction list container
- `transaction-row` - Individual transaction card

## Troubleshooting

### Server Not Running
```
Error: page.goto: net::ERR_CONNECTION_REFUSED
```
**Solution:** Start Angular dev server first:
```bash
cd ../../src/client && ng serve
```

### Test Data Not Found
```
Error: ENOENT: no such file or directory
```
**Solution:** Verify test data files exist in `../../docs/testcases/story_001_testdata/`

### Browser Not Installed
```
Error: Executable doesn't exist at ...
```
**Solution:** Install Chromium browser:
```bash
npx playwright install chromium
```

### Tests Timing Out
**Solution:** Increase timeout in test file or ensure WASM module loads correctly

## Development

### Running Tests in Debug Mode
```bash
npx playwright test --debug
```

### Running Tests in UI Mode (Interactive)
```bash
npx playwright test --ui
```

### Running Specific Test
```bash
npx playwright test -g "TC1"
```

### Running with Different Reporter
```bash
npx playwright test --reporter=json
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - name: Install dependencies
        run: |
          cd src/client && npm install
          cd ../../tests/e2e && npm install
      - name: Install Playwright
        run: cd tests/e2e && npx playwright install chromium
      - name: Build and Start Server
        run: cd src/client && npm run build && npm run start &
      - name: Wait for Server
        run: npx wait-on http://localhost:4200
      - name: Run Tests
        run: cd tests/e2e && npx playwright test
      - name: Upload Report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: tests/e2e/playwright-report/
```

## Known Issues

1. **DEF-001:** Missing realistic HDFC test data - TC1, TC2 blocked
2. **DEF-002:** Encryption detection needs verification - TC3, TC6 pending
3. **DEF-003:** Missing corrupted file test data - TC7 blocked
4. **webServer config** disabled due to Windows path issues - require manual server start

See [Defect Reports](../../docs/testcases/story_001_defects/) for details.

## Test Coverage

- ✅ File upload UI interactions
- ✅ File format validation
- ✅ Error/success state rendering
- ✅ Drag-and-drop functionality
- ⚠️ Parser accuracy (blocked by missing data)
- ⚠️ Encryption detection (needs verification)
- ⚠️ Corruption handling (missing test files)

## Contributing

### Adding New Tests
1. Create test file in `tests/` directory
2. Follow naming convention: `story_XXX.spec.ts`
3. Use `data-testid` selectors
4. Add test data to `../../docs/testcases/story_XXX_testdata/`
5. Document test cases in `../../docs/testcases/`

### Test Case Template
```typescript
test('TC#: Test description', async ({ page }) => {
  // Navigate
  await page.goto('/import');
  
  // Interact
  const fileInput = page.locator('[data-testid="file-input"]');
  await fileInput.setInputFiles(testFilePath);
  
  // Assert
  await expect(page.locator('[data-testid="upload-success"]')).toBeVisible();
});
```

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Test Case Specifications](../../docs/testcases/story_001_Upload_and_Parse_Bank_Statement_testcases.md)
- [Manual Test Report](../../docs/testcases/story_001_testdata/MANUAL_TEST_REPORT.md)
- [Testing Summary](../../docs/testcases/TESTING_SUMMARY.md)
- [Defect Reports](../../docs/testcases/story_001_defects/)

## Support

For issues or questions:
- Check [Known Issues](#known-issues)
- Review [Troubleshooting](#troubleshooting)
- See [Sprint Status](../../docs/sprints/sprint1_status.md)
- Contact QA Team

---

**Last Updated:** 2026-01-04  
**Framework:** Playwright v1.40.0  
**Status:** Ready for execution (pending test data)
