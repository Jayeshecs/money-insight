## Test Cases for Story: Auto-Detect and Apply Correct Parser Plugin

### Test Case 1: Auto-Detect HDFC Savings Statement
**Objective:** Verify that the system automatically detects and applies the HDFC Savings parser without manual selection.

#### Steps
1. Navigate to the upload screen.
2. Upload a valid HDFC Savings .xlsx/.xls file.
3. Observe the parsing process.

#### Test Data
- story_001_testdata/SA3234_FY2025_20251221.xls

#### Expected Result
- System automatically detects the file as HDFC Savings format.
- Parser name displayed: "HDFC Savings Account"
- Transactions are parsed successfully.
- No manual parser selection required.

---

### Test Case 2: Auto-Detect HDFC Credit Card Statement
**Objective:** Verify that the system automatically detects and applies the HDFC Credit Card parser without manual selection.

#### Steps
1. Navigate to the upload screen.
2. Upload a valid HDFC Credit Card .xls file.
3. Observe the parsing process.

#### Test Data
- story_001_testdata/CC2486_20250418.xls

#### Expected Result
- System automatically detects the file as HDFC Credit Card format.
- Parser name displayed: "HDFC Credit Card"
- Transactions are parsed successfully.
- No manual parser selection required.

---

### Test Case 3: Detect Unknown Format and Notify User
**Objective:** Verify that when no parser matches the file format, the user receives a clear error message.

#### Steps
1. Navigate to the upload screen.
2. Upload a CSV file with an unknown/unsupported bank format.
3. Observe the system response.

#### Test Data
- story_002_testdata/Unknown_Bank_Statement.csv

#### Expected Result
- System displays error: "No compatible parser found for this file format"
- User is notified that the format is not yet supported.
- Option to report the issue is displayed (if implemented).
- No transactions are displayed.

---

### Test Case 4: Auto-Detect with Multiple Parsers Registered
**Objective:** Verify that the auto-detection mechanism correctly identifies the parser when multiple parsers are registered.

#### Steps
1. Ensure multiple parsers are registered (HDFC Savings, HDFC Credit Card).
2. Upload an HDFC Savings statement.
3. Verify correct parser is selected.
4. Upload an HDFC Credit Card statement.
5. Verify correct parser is selected.

#### Test Data
- story_001_testdata/SA3234_FY2025_20251221.xls (HDFC Savings)
- story_001_testdata/CC2486_20250418.xls (HDFC Credit Card)

#### Expected Result
- Each file is correctly matched to its corresponding parser.
- HDFC Savings file → HDFC Savings parser
- HDFC Credit Card file → HDFC Credit Card parser
- No cross-contamination or misidentification.

---

### Test Case 5: Auto-Detect Priority - First Match Wins
**Objective:** Verify that the system uses the first parser that successfully identifies the file (as per plugin registry order).

#### Steps
1. Upload a file that could potentially match multiple patterns (edge case).
2. Observe which parser is selected.

#### Test Data
- story_002_testdata/Ambiguous_Statement.xls (if available)

#### Expected Result
- System selects the first parser whose `identify()` method returns true.
- Parsing completes successfully with the selected parser.
- Parser name is clearly displayed to the user.

---

### Test Case 6: Auto-Detect with CSV Format
**Objective:** Verify that auto-detection works correctly with CSV files.

#### Steps
1. Navigate to the upload screen.
2. Upload a valid HDFC CSV statement.
3. Observe the parsing process.

#### Test Data
- story_002_testdata/HDFC_Savings_Statement.csv

#### Expected Result
- System automatically detects the CSV format.
- Correct parser is applied.
- Transactions are parsed successfully.

---

### Test Case 7: Auto-Detect Fails for Corrupted File
**Objective:** Verify that corrupted files that don't match any parser signature are rejected gracefully.

#### Steps
1. Navigate to the upload screen.
2. Upload a corrupted .xlsx file.
3. Observe the system response.

#### Test Data
- story_001_testdata/HDFC_Savings_Corrupted.xlsx

#### Expected Result
- System displays error: "No compatible parser found for this file format" OR "File is corrupted or unreadable"
- No transactions are displayed.
- No parser is applied.

---

### Test Case 8: Auto-Detect Performance with Large File
**Objective:** Verify that auto-detection completes quickly even with large statement files.

#### Steps
1. Navigate to the upload screen.
2. Upload a large HDFC statement file (500+ transactions).
3. Measure time for parser detection.

#### Test Data
- story_002_testdata/HDFC_Large_Statement.xlsx (500+ rows)

#### Expected Result
- Parser is detected within 1 second.
- Detection time is displayed in the result metadata.
- Parsing proceeds normally after detection.

---

### Test Case 9: Sequential File Upload with Different Formats
**Objective:** Verify that auto-detection works correctly when uploading multiple files of different formats in sequence.

#### Steps
1. Upload HDFC Savings statement → verify correct parser.
2. Without refreshing, upload HDFC Credit Card statement → verify correct parser.
3. Observe that each file is parsed with the appropriate parser.

#### Test Data
- story_001_testdata/SA3234_FY2025_20251221.xls (HDFC Savings)
- story_001_testdata/CC2486_20250418.xls (HDFC Credit Card)

#### Expected Result
- First file: HDFC Savings parser applied.
- Second file: HDFC Credit Card parser applied.
- No parser state pollution between uploads.
- Each parsing result is independent and correct.

---

### Test Case 10: Auto-Detect with Empty File
**Objective:** Verify that empty files are handled gracefully by the auto-detection mechanism.

#### Steps
1. Navigate to the upload screen.
2. Upload an empty .xlsx file.
3. Observe the system response.

#### Test Data
- story_002_testdata/Empty_Statement.xlsx

#### Expected Result
- System displays error: "No compatible parser found for this file format" OR "File is empty or contains no data"
- No transactions are displayed.
- No parser is applied.

---

## Test Data Requirements

### Required Test Files (to be created in story_002_testdata/)

1. **Unknown_Bank_Statement.csv** - A CSV file with a format that doesn't match any registered parser
2. **HDFC_Savings_Statement.csv** - CSV version of HDFC Savings statement
3. **HDFC_Large_Statement.xlsx** - HDFC statement with 500+ transactions
4. **Empty_Statement.xlsx** - An Excel file with no data
5. **Ambiguous_Statement.xls** - (Optional) A file that could match multiple parsers

### Reused Test Files from Story 001
- SA3234_FY2025_20251221.xls (HDFC Savings)
- CC2486_20250418.xls (HDFC Credit Card)
- HDFC_Savings_Corrupted.xlsx (Corrupted file)

---

## Notes on Test Coverage

- **Positive Testing:** TC1, TC2, TC4, TC6, TC9 verify successful auto-detection
- **Negative Testing:** TC3, TC7, TC10 verify error handling for unrecognizable files
- **Edge Cases:** TC5, TC8 test boundary conditions
- **Regression:** TC9 ensures state management between multiple uploads

---

## Integration with Rust WASM Engine

These tests verify the behavior of the `PluginRegistry::auto_detect()` function exposed through the WASM interface:

```rust
// src/engine/src/traits.rs
pub fn auto_detect(&self, data: &str) -> Option<&dyn BankParser>
```

The auto-detection flow:
1. File content is passed to WASM engine
2. `PluginRegistry::auto_detect()` iterates through registered parsers
3. Each parser's `identify()` method is called
4. First matching parser is returned
5. Parser's `parse()` method is invoked
6. Results are returned to Angular frontend

---

## Acceptance Criteria Validation

✅ **AC1:** System correctly identifies and applies the parser for HDFC Savings and Credit Card formats  
- Covered by: TC1, TC2, TC4, TC6, TC9

✅ **AC2:** If no parser matches, user is notified and can report the issue  
- Covered by: TC3, TC7, TC10

---
