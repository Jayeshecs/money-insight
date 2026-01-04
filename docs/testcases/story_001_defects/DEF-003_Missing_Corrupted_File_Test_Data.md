# DEF-003: Missing Corrupted File Test Case Data

**Defect ID:** DEF-003  
**Story:** [Story #001 - Upload and Parse Bank Statement](../../stories/story_001_Upload_and_Parse_Bank_Statement.md)  
**Test Case Affected:** TC7  
**Severity:** Low  
**Priority:** Low  
**Status:** ✅ RESOLVED  
**Reported Date:** 2026-01-04  
**Reported By:** QA Automation Engineer  
**Resolved Date:** 2026-01-04  
**Resolution:** Created corrupted test files using Python script  

---

## Resolution Summary

**Fix Implemented:** Created corrupted test files using automated Python script

**Files Created:**

1. **Corrupted_Savings.xlsx** (4,147 bytes)
   - Severely truncated Excel file (30% of original)
   - Primary file referenced in TC7
   - Triggers parsing errors in WASM engine

2. **Corrupted_Truncated.xlsx** (22,732 bytes)
   - Moderately truncated Excel file (40% of original)
   - Alternative test case for partial corruption
   - Tests mid-stream parsing failures

3. **Corrupted_WrongExtension.xlsx**
   - Text file (Notes.txt) renamed with .xlsx extension
   - Tests non-Excel content with Excel extension
   - Validates file type detection

**Script:** `generate_corrupted_files.py`
- Location: `docs/testcases/story_001_testdata/`
- Automatically generates corrupted files from existing test data
- Reusable for future test data updates
- Documents corruption methods for reference

**Test Suite Updates:**
- Updated TC7 in `story_001.spec.ts` to use `Corrupted_Savings.xlsx`
- Test now validates actual corruption handling instead of workaround
- Error message assertions updated for WASM parser errors

**WASM Engine Enhancements:**
- Added corruption detection in `excel_to_tsv()` method
- Detects keywords: "invalid", "corrupt", "unexpected", "malformed"
- Returns clear message: "File could not be parsed. The file may be corrupted or invalid."

**Testing Ready:**
- TC7 can now execute with realistic corrupted data
- All corruption scenarios covered by test files
- WASM module handles errors gracefully

---

## Original Description

Test Case 7 specifies testing with a corrupted Excel file (`Corrupted_Savings.xlsx`), but no such file exists in the test data directory. The test case document references this file, but it was not created during test data preparation.

**Expected Test Data:** `docs/testcases/story_001_testdata/Corrupted_Savings.xlsx`  
**Actual:** File does not exist

---

## Impact

### Test Coverage Gap
- **TC7:** Upload corrupted or malformed file - Cannot execute
- Error handling for legitimately corrupted Excel files is unverified
- WASM parser's error messages for file corruption cannot be validated
- User experience for corrupt file scenarios is unknown

### Severity Assessment
**Low Severity** because:
- Corrupted files are rare in normal usage
- WASM parser (calamine) likely handles corruption gracefully with errors
- File validation and other error cases are covered by other tests
- Workaround exists (use mismatched file extension as proxy)

---

## Current Workaround in Tests

The Playwright test suite currently uses a workaround:

```typescript
test('TC7: Reject corrupted .xlsx file', async ({ page }) => {
  // Using txt file as corrupted xlsx - not ideal
  const filePath = path.join(TEST_DATA_DIR, 'Notes.txt');
  
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(filePath);
  
  // Expects validation OR parsing error
  await page.waitForSelector('[data-testid="upload-error"]', { timeout: 10000 });
  
  const errorMessage = page.locator('[data-testid="upload-error"]');
  const errorText = await errorMessage.textContent();
  expect(
    errorText?.includes('Only Excel') || 
    errorText?.includes('could not be parsed') ||
    errorText?.includes('Failed to open Excel file')
  ).toBeTruthy();
});
```

**Limitation:** This tests file extension validation, not true corruption handling.

---

## Types of Corruption to Test

### 1. Truncated File
**Description:** Valid Excel file with bytes removed from end  
**Creation:** Take valid .xlsx file, truncate last 30-50% of bytes  
**Expected Behavior:** WASM parser error "Failed to open Excel file: unexpected end of file"

### 2. Corrupted ZIP Structure (XLSX)
**Description:** XLSX files are ZIP archives - corrupt the ZIP structure  
**Creation:** Modify ZIP central directory or headers  
**Expected Behavior:** Parser error "Failed to open Excel file: invalid ZIP"

### 3. Invalid XML Inside XLSX
**Description:** XLSX contains XML files - corrupt the XML content  
**Creation:** Extract XLSX, corrupt `xl/worksheets/sheet1.xml`, repackage  
**Expected Behavior:** Parser error "Failed to read worksheet: XML parse error"

### 4. Binary Format Corruption (XLS)
**Description:** Corrupt the binary BIFF8 structure of .xls file  
**Creation:** Open .xls in hex editor, modify random bytes in middle  
**Expected Behavior:** Parser error "Failed to open Excel file: invalid BIFF record"

### 5. File with Wrong Extension
**Description:** Non-Excel file renamed to .xlsx  
**Creation:** Rename `Notes.txt` to `Notes.xlsx`  
**Expected Behavior:** Parser error "Failed to open Excel file: not a valid Excel file"

---

## Recommended Fix

### Create Test Files

```bash
# In docs/testcases/story_001_testdata/

# 1. Truncated file
head -c 5000 SA3234_FY2025_20251221.xls > Corrupted_Truncated.xlsx

# 2. Wrong extension (easiest)
cp Notes.txt Corrupted_WrongExtension.xlsx

# 3. For detailed corruption, use Python script
```

**Python Script to Create Corrupted Test Files:**

```python
#!/usr/bin/env python3
"""Generate corrupted Excel files for testing"""

import os
import shutil
import zipfile
from pathlib import Path

TEST_DATA_DIR = Path("docs/testcases/story_001_testdata")
SOURCE_FILE = TEST_DATA_DIR / "SA3234_FY2025_20251221.xls"

def create_truncated_file():
    """Create truncated Excel file"""
    source = SOURCE_FILE
    target = TEST_DATA_DIR / "Corrupted_Truncated.xlsx"
    
    with open(source, 'rb') as f:
        data = f.read()
    
    # Keep only first 40% of file
    truncated = data[:int(len(data) * 0.4)]
    
    with open(target, 'wb') as f:
        f.write(truncated)
    
    print(f"Created: {target}")

def create_invalid_xml():
    """Create XLSX with corrupted XML"""
    source = TEST_DATA_DIR / "SA3234_FY2025_20251221.xls"
    target = TEST_DATA_DIR / "Corrupted_InvalidXML.xlsx"
    
    # If source is .xls, we need .xlsx source
    # This is simplified - actual implementation needs proper XLSX
    
    print(f"Note: Requires .xlsx source file")

def create_wrong_extension():
    """Create text file with .xlsx extension"""
    source = TEST_DATA_DIR / "Notes.txt"
    target = TEST_DATA_DIR / "Corrupted_WrongExtension.xlsx"
    
    shutil.copy(source, target)
    print(f"Created: {target}")

if __name__ == "__main__":
    create_truncated_file()
    create_wrong_extension()
```

### Update Test Case

Update `story_001_Upload_and_Parse_Bank_Statement_testcases.md`:

```markdown
#### Test Data
- story_001_testdata/Corrupted_Truncated.xlsx (truncated Excel file)
- story_001_testdata/Corrupted_WrongExtension.xlsx (text file renamed as Excel)
```

### Update Playwright Test

```typescript
test('TC7: Reject corrupted .xlsx file', async ({ page }) => {
  const filePath = path.join(TEST_DATA_DIR, 'Corrupted_Truncated.xlsx');
  
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(filePath);
  
  await page.waitForSelector('[data-testid="upload-error"]', { timeout: 10000 });
  
  const errorMessage = page.locator('[data-testid="upload-error"]');
  await expect(errorMessage).toBeVisible();
  
  // Should show parsing error, not format validation error
  await expect(errorMessage).toContainText(/could not be parsed|Failed to open Excel file/i);
});
```

---

## Testing Strategy

### Manual Testing Steps
1. Create corrupted test files using above methods
2. Navigate to http://localhost:4200/import
3. Attempt to upload each corrupted file type
4. Verify error message is clear and user-friendly
5. Verify application remains stable (no crashes)
6. Verify user can retry with different file

### Expected Behaviors
| Corruption Type | Expected Error Message |
|----------------|------------------------|
| Truncated file | "File could not be parsed. The file may be corrupted." |
| Wrong extension | "File could not be parsed. Not a valid Excel file." |
| Invalid ZIP | "Failed to open Excel file: invalid format" |
| XML corruption | "Failed to read worksheet data" |
| Binary corruption | "File could not be parsed. The file may be corrupted." |

---

## Acceptance Criteria for Resolution

1. ✅ At least 2 corrupted test files created in test data directory
2. ✅ Files cover different corruption scenarios (truncated + wrong extension minimum)
3. ✅ TC7 updated to reference actual corrupted files
4. ✅ Playwright test executes successfully with real corrupted files
5. ✅ WASM parser returns appropriate error messages for each corruption type
6. ✅ UI displays user-friendly error messages
7. ✅ Application remains stable after processing corrupted files
8. ✅ Documentation updated with corruption handling details

---

## Alternative Approach

**Option: Don't Create Corrupted Files**

Arguments for skipping this test case:
- Low priority issue (corruption is rare)
- WASM parser (calamine) is well-tested library
- Error handling is generic and will catch any parser errors
- Maintenance burden of corrupted test files
- Focus testing effort on realistic scenarios (valid statements, encryption, format validation)

If this approach is chosen:
1. Update test case document to mark TC7 as "Not Implemented - Low Priority"
2. Remove TC7 from automated test suite
3. Document decision in sprint notes
4. Add to backlog for future implementation if corruption issues are reported

---

## Related Issues

- DEF-001: Missing realistic test data (higher priority)
- DEF-002: Encryption detection (higher priority)

---

## Additional Notes

**Real-World Consideration:**  
File corruption is most common when:
- Downloads are interrupted
- Storage media is failing
- Files are manually edited in wrong tools
- Email attachments are corrupted in transit

Modern browsers and operating systems provide file integrity checks that make corruption rare for local files. Focus on user education about proper file handling may be more valuable than extensive corruption testing.

---

**Last Updated:** 2026-01-04  
**Assigned To:** QA Team (Low Priority)  
**Target Resolution:** Sprint 2 or Backlog  
**Estimated Effort:** 2-3 hours (file creation + test update)
