# Unit Test Results & Root Cause Analysis

**Date:** January 9, 2026  
**Component:** WASM Engine - HDFC Savings Parser  
**Test Suite:** Unit Tests + Integration Analysis

---

## Executive Summary

**✅ ALL 32 unit tests PASS** - The parser identification logic works correctly with synthetic test data

**❌ E2E tests FAIL** - The parser fails to identify actual test files after Excel-to-TSV conversion

**Root Cause:** Mismatch between test data assumptions and actual Excel file structure

---

## Unit Test Results

### Test Execution
```bash
$ cargo test --lib parsers::hdfc_savings::tests
Running 32 tests... ALL PASSED ✅
- 18 identification tests
- 10 parsing tests  
- 4 invalid format tests
```

### Key Findings from Unit Tests

1. **Parser Logic is Sound** - All identification patterns work correctly
2. **Header Detection Works** - Finds "Date", "Narration", "Withdrawal Amt", "Deposit Amt"
3. **Bank Name Detection Works** - Finds "hdfc bank" (case-insensitive)
4. **Parsing Logic Works** - Correctly extracts transactions, amounts, dates

---

## Actual Test File Analysis

### HDFC Savings File: SA3234_FY2025_20251221.xls

**File Structure (TSV Conversion):**
```
Line 1  | HDFC BANK Ltd.                                      Page No .:   1
                        Statement of accounts
Line 2  | 
Line 3-20 | [Metadata: Account details, address, etc.]
Line 21 | Date Narration       Chq./Ref.No.    Value Dt        Withdrawal Amt. Deposit Amt.
Closing Balance
Line 22 | ********     **********************************      ************    ********   
Line 23 | 02/04/25     IB FUNDS TRANSFER CR...    MB02182140197T39    02/04/25             10000.0 67111.86
[... more transactions ...]
```

**Parser Identification Check:**

| Requirement | Status | Details |
|-------------|--------|---------|
| "hdfc bank" in first 10 lines | ✅ YES | Line 1: "HDFC BANK Ltd." |
| "Date" header | ✅ YES | Line 21 |
| "Narration" header | ✅ YES | Line 21 |
| "Withdrawal Amt" OR "Deposit Amt" | ✅ YES | Line 21 (both present) |
| All on SAME line | ✅ YES | Line 21 has all headers |

**Expected Result:** Parser SHOULD identify this file ✅

---

### HDFC Credit Card File: CC2486_20250418.xls

**File Structure (TSV Conversion):**
```
Line 1  | Name                                                            JAYESH MANILAL PRAJAPATI
Line 2  | Card No: 6530 29XX XXXX 2486
Line 3  | AAN :0001010730012732481
[... metadata lines ...]
Line 28 | Transaction type                                        Primary / Addon Customer Name                                                                                  DATE                             Description
Line 29 | Domestic                                        JAYESH M PRAJAPATI
                19/03/2025 09:54:04        UPI-BORLAI FAST FOOD LLP                                        75.0
[... more transactions ...]
```

**Parser Identification Check:**

| Requirement | Status | Details |
|-------------|--------|---------|
| "hdfc" anywhere | ❌ NO | Not explicitly visible in first ~40 lines |
| "credit" anywhere | ❌ NO | Mentioned in metadata but may not be detected |
| "card no" or "credit card no" | ✅ YES | Line 2: "Card No: ..." |
| "Transaction type" (case-sensitive) | ✅ YES | Line 28 |

**Expected Result:** Parser may NOT identify (missing "hdfc" and "credit" keywords clearly)

---

## Root Cause Analysis

### Why E2E Tests Fail

**The actual issue is NOT in the parser logic itself, but in how the Excel file is structured after TSV conversion.**

#### Issue 1: HDFC Savings - Should Work But Doesn't

The file HAS all required elements:
- ✅ "HDFC BANK Ltd." on Line 1 (within first 10 lines)
- ✅ "Date", "Narration", "Withdrawal Amt.", "Deposit Amt." all on Line 21

**Hypothesis:** The parser identify() method is working correctly, but something else is failing:

1. **Possible Excel Conversion Issue:**
   - Excel file may have formatting/hidden characters
   - TSV conversion in Rust (calamine) may differ from Python (xlrd)
   - Cell values may have trailing spaces or special characters

2. **Possible WASM Initialization Issue:**
   - WASM module may not be loading correctly
   - Parser registration may be failing
   - Error occurring before identify() is even called

3. **Possible Angular Integration Issue:**
   - File upload may not be passing data correctly to WASM
   - WASM result parsing may be failing
   - Error message may be generic fallback, not actual parser error

#### Issue 2: HDFC Credit Card - Ambiguous

The credit card file is less clear:
- "hdfc" keyword doesn't appear prominently in visible lines
- "credit" keyword may be in metadata but not obvious
- Parser requirements may be too strict

---

## Recommended Next Steps

### Step 1: Add Debug Logging to WASM Engine ⭐

**File:** `src/engine/src/lib.rs`

Add console logging right after Excel-to-TSV conversion:

```rust
// After TSV conversion
#[cfg(target_arch = "wasm32")]
{
    use web_sys::console;
    let first_30_lines: String = text_data.lines()
        .take(30)
        .enumerate()
        .map(|(i, line)| format!("{}| {}", i, line))
        .collect::<Vec<_>>()
        .join("\n");
    console::log_1(&format!("TSV First 30 lines:\n{}", first_30_lines).into());
}

// Before auto-detect
#[cfg(target_arch = "wasm32")]
console::log_1(&format!("Calling auto-detect with {} bytes of data", text_data.len()).into());

let detection = StatementDetector::detect(&self.registry.parsers, &text_data);

#[cfg(target_arch = "wasm32")]
console::log_1(&format!("Detection result: parser={}, confidence={:?}", 
    detection.parser.is_some(), detection.confidence).into());
```

This will show EXACTLY what the WASM engine sees when processing the file.

### Step 2: Rebuild and Redeploy WASM

```bash
cd src/engine
./build-deploy.sh
```

### Step 3: Run E2E Test with Browser DevTools Open

```bash
cd tests/e2e
npx playwright test story_001.spec.ts:25 --headed --debug
```

Open browser DevTools console to see the debug logs.

### Step 4: Based on Debug Output

#### If TSV looks correct:
- Parser logic issue → Adjust identify() method
- Add more lenient matching

#### If TSV looks wrong:
- Excel conversion issue → Check calamine library
- May need to handle cell formatting differently

#### If no logs appear:
- WASM initialization issue → Check WASM loading in Angular
- Check browser console for WASM errors

### Step 5: Fix Parser Identification (If Needed)

If the issue is parser logic being too strict, update `hdfc_savings.rs`:

```rust
fn identify(&self, data: &str) -> bool {
    let lower_data = data.to_lowercase();
    
    // More lenient checks
    let has_hdfc = lower_data.contains("hdfc");
    let has_date = lower_data.contains("date");
    let has_narration = lower_data.contains("narration");
    let has_withdrawal_or_deposit = lower_data.contains("withdrawal") || 
                                     lower_data.contains("deposit");
    
    // Need at least HDFC + 2 other indicators
    let score = [has_hdfc, has_date, has_narration, has_withdrawal_or_deposit]
        .iter()
        .filter(|&&x| x)
        .count();
    
    score >= 3 && has_hdfc  // Must have HDFC + at least 2 others
}
```

---

## Test Coverage Summary

### ✅ Well-Tested Areas
- Parser identification logic with various header formats
- Date parsing (DD/MM/YY format)
- Amount parsing with Indian number format (1,00,000.00)
- Transaction type detection (DEBIT/CREDIT)
- Error handling for invalid data

### ⚠️ Needs More Testing
- Excel-to-TSV conversion accuracy
- Real-world file format variations
- WASM ↔ Angular integration
- Error propagation from WASM to UI

### ❌ Not Tested
- Large files (500+ transactions) performance
- Memory limits in WASM
- Concurrent file uploads
- Browser compatibility (only Chromium tested)

---

## Conclusion

**The parser implementation is correct** based on unit tests. The E2E failures suggest an issue in:
1. Excel file format vs TSV conversion
2. WASM module initialization/loading
3. Data transfer between Angular and WASM

**Next action:** Add debug logging to WASM engine and re-run tests with browser DevTools open to see actual data flow.

---

## Appendix: Test Files Used

- **Unit Tests:** Synthetic TSV data matching expected format
- **E2E Tests:** Actual Excel files from `docs/testcases/story_001_testdata/`
  - SA3234_FY2025_20251221.xls (HDFC Savings, 65 rows)
  - CC2486_20250418.xls (HDFC Credit Card, 104 rows)

## Appendix: Commands for Debugging

```bash
# Run unit tests
cd src/engine
cargo test --lib parsers::hdfc_savings::tests -- --nocapture

# Analyze test files
python debug_test_files.py

# Run single E2E test with debugging
cd tests/e2e
npx playwright test story_001.spec.ts:25 --headed --debug

# Rebuild WASM
cd src/engine
./build-deploy.sh
```
