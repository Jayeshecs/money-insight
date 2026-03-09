# Test Cases for Story 012: SBI Savings Bank Parser Plugin

**Story Reference:** [story_012_SBI_Savings_Bank_Parser_Plugin.md](../stories/story_012_SBI_Savings_Bank_Parser_Plugin.md)  
**Date:** 2026-03-09  
**Author:** QA Automation Engineer  
**Sprint:** 3

---

## Test Fixture

Place the following CSV content at `src/engine/tests/fixtures/sbi_savings_sample.csv` (see TC-012-001 precondition):

```csv
Txn Date,Value Date,Description,Ref No./Cheque No.,Debit,Credit,Balance
07/03/2026,07/03/2026,IMPS/416000123456/UPI-ZOMATO,416000123456,350.00,,199650.00
06/03/2026,06/03/2026,ATM-WDL/SBIN0001234/MUMBAI,,2000.00,,200000.00
05/03/2026,05/03/2026,NEFT/CR/HDFC0000001/SALARY,,,50000.00,202000.00
04/03/2026,04/03/2026,INB/TRANSFER/ICICI00001/RENT,,15000.00,,152000.00
03/03/2026,03/03/2026,CREDIT INTEREST,,,127.50,167000.00
02/03/2026,02/03/2026,UPI/PhonePe/9876543210,,499.00,,166872.50
01/03/2026,01/03/2026,OPENING BALANCE,,,,167371.50
```

---

## Unit Tests (Rust)

---

### TC-012-001

| Field | Value |
|---|---|
| **TC ID** | TC-012-001 |
| **Type** | Unit |
| **Title** | `SbiSavingsParser::identify()` returns `true` for valid SBI CSV |

**Preconditions:**
- `src/engine/tests/fixtures/sbi_savings_sample.csv` exists with the content above.
- `SbiSavingsParser` struct is implemented in `src/engine/src/parsers/sbi_savings.rs`.

**Steps:**
1. In a Rust unit test, load the fixture content via `include_str!("fixtures/sbi_savings_sample.csv")`.
2. Call `SbiSavingsParser::identify(csv_content)`.
3. Assert the return value.

**Expected Result:**
- Returns `true`.

**AC Reference:** AC2, C1

---

### TC-012-002

| Field | Value |
|---|---|
| **TC ID** | TC-012-002 |
| **Type** | Unit |
| **Title** | `SbiSavingsParser::identify()` returns `false` for HDFC Savings TSV |

**Preconditions:**
- HDFC Savings test fixture TSV is available (existing `story_001_testdata/SA3234_FY2025_20251221.xls` converted to TSV).
- HDFC Savings header contains `"Date"`, `"Narration"`, `"Withdrawal Amt."`.

**Steps:**
1. Construct a string with the HDFC Savings header line: `"Date\tNarration\tWithdrawal Amt.\tDeposit Amt.\tBalance"`.
2. Call `SbiSavingsParser::identify(hdfc_savings_content)`.
3. Assert the return value.

**Expected Result:**
- Returns `false`.

**AC Reference:** AC2, C1

---

### TC-012-003

| Field | Value |
|---|---|
| **TC ID** | TC-012-003 |
| **Type** | Unit |
| **Title** | `SbiSavingsParser::identify()` returns `false` for unknown CSV format |

**Preconditions:**
- An arbitrary CSV string is available with no SBI-specific headers.

**Steps:**
1. Construct a CSV string with header `"Name,Amount,Date,Note"`.
2. Call `SbiSavingsParser::identify(unknown_csv)`.
3. Assert the return value.

**Expected Result:**
- Returns `false`.

**AC Reference:** AC2, C1

---

### TC-012-004

| Field | Value |
|---|---|
| **TC ID** | TC-012-004 |
| **Type** | Unit |
| **Title** | `SbiSavingsParser::parse()` correctly parses a Debit row |

**Preconditions:**
- SBI fixture CSV is available.

**Steps:**
1. Construct a minimal SBI CSV string containing just the header and the IMPS debit row:
   ```
   Txn Date,Value Date,Description,Ref No./Cheque No.,Debit,Credit,Balance
   07/03/2026,07/03/2026,IMPS/416000123456/UPI-ZOMATO,416000123456,350.00,,199650.00
   ```
2. Call `SbiSavingsParser::parse(csv_content)`.
3. Inspect the returned `Transaction` list.

**Expected Result:**
- Returns exactly 1 `Transaction`.
- `date` = `"2026-03-07"` (ISO YYYY-MM-DD).
- `narration` = `"IMPS/416000123456/UPI-ZOMATO"` (trimmed).
- `amount` = `350.00` (positive).
- `transaction_type` = `"EXPENSE"`.
- `balance` = `199650.00`.
- `account` = `"SBI_SAVINGS"`.

**AC Reference:** AC3, C2, C6, C8

---

### TC-012-005

| Field | Value |
|---|---|
| **TC ID** | TC-012-005 |
| **Type** | Unit |
| **Title** | `SbiSavingsParser::parse()` correctly parses a Credit row |

**Preconditions:**
- SBI fixture CSV is available.

**Steps:**
1. Construct a minimal SBI CSV string containing the header and the CREDIT INTEREST row:
   ```
   Txn Date,Value Date,Description,Ref No./Cheque No.,Debit,Credit,Balance
   03/03/2026,03/03/2026,CREDIT INTEREST,,,127.50,167000.00
   ```
2. Call `SbiSavingsParser::parse(csv_content)`.
3. Inspect the returned `Transaction` list.

**Expected Result:**
- Returns exactly 1 `Transaction`.
- `date` = `"2026-03-03"`.
- `narration` = `"CREDIT INTEREST"`.
- `amount` = `127.50`.
- `transaction_type` = `"INCOME"`.
- `account` = `"SBI_SAVINGS"`.

**AC Reference:** AC3, C2

---

### TC-012-006

| Field | Value |
|---|---|
| **TC ID** | TC-012-006 |
| **Type** | Unit |
| **Title** | `SbiSavingsParser::parse()` silently skips "Opening Balance" row |

**Preconditions:**
- SBI fixture CSV is available.

**Steps:**
1. Construct a minimal SBI CSV with the header and the OPENING BALANCE row (both Debit and Credit empty):
   ```
   Txn Date,Value Date,Description,Ref No./Cheque No.,Debit,Credit,Balance
   01/03/2026,01/03/2026,OPENING BALANCE,,,,167371.50
   ```
2. Call `SbiSavingsParser::parse(csv_content)`.
3. Inspect the returned `Transaction` list count.

**Expected Result:**
- Returns an empty list (0 transactions).
- No error is returned or thrown.

**AC Reference:** AC3, C3

---

### TC-012-007

| Field | Value |
|---|---|
| **TC ID** | TC-012-007 |
| **Type** | Unit |
| **Title** | `SbiSavingsParser::parse()` handles comma-thousands in amounts |

**Preconditions:**
- RFC 4180 quoting is handled by the parser.

**Steps:**
1. Construct a CSV row with comma-formatted amount:
   ```
   Txn Date,Value Date,Description,Ref No./Cheque No.,Debit,Credit,Balance
   07/03/2026,07/03/2026,NEFT/SALARY,,,"50,000.00",202000.00
   ```
2. Call `SbiSavingsParser::parse(csv_content)`.
3. Inspect the `amount` field of the returned transaction.

**Expected Result:**
- `amount` = `50000.00` (commas stripped, parsed as float).
- `transaction_type` = `"INCOME"`.

**AC Reference:** AC3, C2

---

### TC-012-008

| Field | Value |
|---|---|
| **TC ID** | TC-012-008 |
| **Type** | Unit |
| **Title** | `auto_detect_parser()` returns `SbiSavingsParser` for SBI CSV and no regression for HDFC and unknown |

**Preconditions:**
- `SbiSavingsParser` is registered in `auto_detect_parser()` (in `lib.rs` or `parsers/mod.rs`).
- HDFC Savings and HDFC Credit Card parsers are already registered.

**Steps:**
1. Call `auto_detect_parser(sbi_csv_content)` → assert result is `"SBI Savings"` (or equivalent parser name).
2. Call `auto_detect_parser(hdfc_savings_tsv_content)` → assert result is `"HDFC Savings"` (no regression).
3. Call `auto_detect_parser(unknown_csv_content)` → assert result is an error containing `"no parser found"` or similar (error message must not exclude SBI from candidates).

**Expected Result:**
- All three assertions pass.

**AC Reference:** AC8, C13

---

### TC-012-009

| Field | Value |
|---|---|
| **TC ID** | TC-012-009 |
| **Type** | Unit |
| **Title** | `SbiSavingsParser::parse()` uses Value Date as fallback when Txn Date is invalid |

**Preconditions:**
- Parser implements C6 date fallback logic.

**Steps:**
1. Construct a CSV row where `Txn Date` is `"INVALID"` but `Value Date` is `"07/03/2026"`:
   ```
   Txn Date,Value Date,Description,Ref No./Cheque No.,Debit,Credit,Balance
   INVALID,07/03/2026,TEST PAYMENT,,100.00,,99900.00
   ```
2. Call `SbiSavingsParser::parse(csv_content)`.

**Expected Result:**
- Returns 1 transaction with `date` = `"2026-03-07"` (Value Date used as fallback).

**AC Reference:** AC3, C6

---

### TC-012-010

| Field | Value |
|---|---|
| **TC ID** | TC-012-010 |
| **Type** | Unit |
| **Title** | `SbiSavingsParser::parse()` strips UTF-8 BOM and normalises CRLF |

**Preconditions:**
- Parser implements C7 BOM stripping and CRLF normalisation.

**Steps:**
1. Construct CSV content prefixed with UTF-8 BOM (`\u{FEFF}`) and using `\r\n` line endings.
2. Call `SbiSavingsParser::parse(bom_crlf_csv)`.

**Expected Result:**
- Parsing succeeds without error.
- Returned transactions match expected values (BOM does not corrupt the header detection).

**AC Reference:** AC3, C7

---

## Integration Tests (Rust)

---

### TC-012-011

| Field | Value |
|---|---|
| **TC ID** | TC-012-011 |
| **Type** | Integration |
| **Title** | Full parse of `sbi_savings_sample.csv` returns 6 transactions with correct types |

**Preconditions:**
- Fixture file `src/engine/tests/fixtures/sbi_savings_sample.csv` exists.
- Integration test in `src/engine/tests/integration_test.rs` (or `tests/sbi_parser.rs`) loads the fixture via `include_str!`.

**Steps:**
1. Load fixture via `include_str!("fixtures/sbi_savings_sample.csv")`.
2. Call `SbiSavingsParser::identify(content)`.
3. Call `SbiSavingsParser::parse(content)`.
4. Assert result count and field values.

**Expected Result:**
- `identify()` returns `true`.
- `parse()` returns exactly **6** transactions (OPENING BALANCE row silently skipped).
- Row summary:
  - 4 EXPENSE rows (IMPS, ATM-WDL, INB/TRANSFER, UPI/PhonePe).
  - 2 INCOME rows (NEFT/CR/SALARY, CREDIT INTEREST).
- All `account` fields = `"SBI_SAVINGS"`.

**AC Reference:** AC9, C3, C11, C12

---

## E2E Tests (Playwright)

**Base URL:** `http://localhost:4200`  
**Fixture path for E2E:** `src/engine/tests/fixtures/sbi_savings_sample.csv`

---

### TC-012-012

| Field | Value |
|---|---|
| **TC ID** | TC-012-012 |
| **Type** | E2E |
| **Title** | Upload SBI CSV → `upload-success` shown with non-zero transaction count |

**Preconditions:**
- Angular dev server running at `http://localhost:4200`.
- WASM engine rebuilt and deployed with `SbiSavingsParser` registered.
- Fixture `sbi_savings_sample.csv` present on the test runner filesystem.

**Steps:**
1. `await page.goto('/import')`.
2. `await page.locator('input[type="file"]').setInputFiles('<path>/sbi_savings_sample.csv')`.
3. `await page.waitForSelector('[data-testid="upload-success"]', { timeout: 15000 })`.
4. Read `[data-testid="transaction-count"]` text content.

**Expected Result:**
- `[data-testid="upload-success"]` is visible.
- `[data-testid="transaction-count"]` text contains a number ≥ 1 (expected 6).
- No `[data-testid="parser-error"]` is visible.

**AC Reference:** AC5, C10

---

### TC-012-013

| Field | Value |
|---|---|
| **TC ID** | TC-012-013 |
| **Type** | E2E |
| **Title** | Upload SBI CSV → `parser-name` shows "SBI Savings" |

**Preconditions:**
- Same as TC-012-012.

**Steps:**
1. Navigate to `/import`.
2. Upload `sbi_savings_sample.csv`.
3. Wait for `[data-testid="upload-success"]`.
4. Read `[data-testid="parser-name"]` text.

**Expected Result:**
- `[data-testid="parser-name"]` contains text `"SBI Savings"`.

**AC Reference:** AC5, C10

---

### TC-012-014

| Field | Value |
|---|---|
| **TC ID** | TC-012-014 |
| **Type** | E2E |
| **Title** | Parser isolation: upload HDFC Savings CSV after SBI CSV in same session |

**Preconditions:**
- Both `sbi_savings_sample.csv` and `SA3234_FY2025_20251221.xls` (HDFC Savings) are available.
- Session is fresh (no prior upload).

**Steps:**
1. Navigate to `/import`.
2. Upload `sbi_savings_sample.csv`; wait for `[data-testid="upload-success"]`; verify `[data-testid="parser-name"]` = `"SBI Savings"`.
3. Navigate back to `/import` (or click "Upload Another").
4. Upload `SA3234_FY2025_20251221.xls`; wait for `[data-testid="upload-success"]`; verify `[data-testid="parser-name"]`.

**Expected Result:**
- First upload: `parser-name` = `"SBI Savings"`.
- Second upload: `parser-name` = `"HDFC Savings Account"` (or `"HDFC Savings"`).
- Both `[data-testid="upload-success"]` assertions pass; no `parser-error` shown.

**AC Reference:** AC7, C10

---

### TC-012-015

| Field | Value |
|---|---|
| **TC ID** | TC-012-015 |
| **Type** | E2E |
| **Title** | Upload unknown CSV → `parser-error` is shown |

**Preconditions:**
- A plain CSV file with unrecognised headers (e.g., `"Name,Amount,Date"`) is available as test data.

**Steps:**
1. Navigate to `/import`.
2. Upload the unknown-format CSV.
3. Wait up to 10 s for either `[data-testid="upload-success"]` or `[data-testid="parser-error"]`.

**Expected Result:**
- `[data-testid="parser-error"]` is visible.
- `[data-testid="upload-success"]` is NOT visible.

**AC Reference:** AC6

---
