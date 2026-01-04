# DEF-001: Missing Realistic Test Data for Parser Validation

**Defect ID:** DEF-001  
**Story:** [Story #001 - Upload and Parse Bank Statement](../../stories/story_001_Upload_and_Parse_Bank_Statement.md)  
**Test Cases Affected:** TC1, TC2  
**Severity:** High  
**Priority:** High  
**Status:** Open  
**Reported Date:** 2026-01-04  
**Reported By:** QA Automation Engineer  

---

## Description

Test data files exist in `docs/testcases/story_001_testdata/` but contain placeholder or unknown data. Real HDFC bank statement samples (anonymized) are needed to verify parsing logic for both Savings Account and Credit Card formats.

### Files Affected
- `SA3234_FY2025_20251221.xls` - HDFC Savings Account statement
- `CC2486_20250418.xls` - HDFC Credit Card statement  
- `CC2486_20251218.xls` - HDFC Credit Card statement (alternate)

---

## Impact

### Test Cases Blocked
- **TC1:** Upload valid HDFC Savings .xls file - Cannot verify parser accuracy
- **TC2:** Upload valid HDFC Credit Card .xls file - Cannot verify parser accuracy

### Functionality Affected
- Parser accuracy cannot be validated
- Date format parsing (DD/MM/YY → YYYY-MM-DD) unverified
- Amount parsing with Indian comma separators unverified
- Transaction type detection (Credit/Debit, Withdrawal/Deposit) unverified
- Account number extraction unverified
- Description field parsing unverified
- Edge cases untested (special characters, very large amounts, etc.)

---

## Steps to Reproduce

1. Navigate to `docs/testcases/story_001_testdata/`
2. Examine `SA3234_FY2025_20251221.xls` content
3. Examine `CC2486_20250418.xls` content
4. Compare with actual HDFC statement format from reference Python scripts

**Expected:** Files should contain realistic transaction data matching HDFC statement structure  
**Actual:** Files exist but content/structure is unknown or may be placeholder data

---

## Root Cause

Test data files were created as placeholders but not populated with representative HDFC bank statement content that matches the parser logic implemented in:
- `src/engine/src/parsers/hdfc_savings.rs`
- `src/engine/src/parsers/hdfc_credit.rs`

Reference implementation exists in Python:
- `reference/python_scripts/stmt-proc-py/src/processors/hdfc_bank_acct_processor.py`
- `reference/python_scripts/stmt-proc-py/src/processors/hdfc_credit_card_processor.py`

---

## Recommended Fix

### Option 1: Create Sample Data (Recommended)
Create Excel files with realistic but anonymized HDFC statement structure:

**For HDFC Savings Account (SA3234_FY2025_20251221.xls):**
```
Header row: HDFC Bank
Column headers: Date | Narration | Chq./Ref.No. | Value Dt | Withdrawal Amt. | Deposit Amt. | Closing Balance

Sample rows:
01/12/24    ATM Withdrawal        123456    01/12/24    5,000.00              45,000.00
02/12/24    UPI/AMAZON PAY        789012    02/12/24    1,500.00              43,500.00
03/12/24    SALARY CREDIT         -         03/12/24                50,000.00 93,500.00
```

**For HDFC Credit Card (CC2486_20250418.xls):**
```
Header row: HDFC Credit Card
Column headers: Transaction Date | Description | Amount | Cr/Dr

Sample rows:
15/04/25    AMAZON RETAIL           2,500.00    Dr
16/04/25    SWIGGY FOOD             850.00      Dr
20/04/25    PAYMENT RECEIVED        10,000.00   Cr
```

### Option 2: Use Reference Python Test Data
Extract test data from `reference/python_scripts/stmt-proc-py/src/tests/` if available.

### Option 3: Manual Test with Real Statements
Use actual HDFC statements (with sensitive data masked) for one-time validation.

---

## Test Data Requirements

### HDFC Savings Account File Should Include:
- [ ] Minimum 10 transactions
- [ ] Mix of withdrawals and deposits
- [ ] Date format: DD/MM/YY
- [ ] Amounts with Indian comma separator (e.g., 1,23,456.78)
- [ ] Various transaction types (ATM, UPI, NEFT, RTGS, Salary)
- [ ] Cheque numbers for some transactions
- [ ] Valid closing balance progression

### HDFC Credit Card File Should Include:
- [ ] Minimum 10 transactions
- [ ] Mix of debits (Dr) and credits (Cr)
- [ ] Date format: DD/MM/YYYY
- [ ] Merchant names of varying lengths
- [ ] Payment transactions (Cr)
- [ ] Purchase transactions (Dr)
- [ ] Valid amount formats

---

## Acceptance Criteria for Resolution

1. ✅ Sample HDFC Savings .xls file created with 10+ realistic transactions
2. ✅ Sample HDFC Credit Card .xls file created with 10+ realistic transactions
3. ✅ Parser successfully extracts all transactions from both files
4. ✅ Dates are correctly converted to YYYY-MM-DD format
5. ✅ Amounts are correctly parsed (comma removal, decimal handling)
6. ✅ Transaction types are correctly identified
7. ✅ TC1 passes with new test data
8. ✅ TC2 passes with new test data
9. ✅ No parsing errors or WASM exceptions
10. ✅ Transaction display shows correct data in UI

---

## Workaround

None - Parser testing is blocked until representative test data is available.

---

## Related Issues

- DEF-004: Missing Test IDs (Fixed)
- Future: Need CSV format test data as well

---

## Additional Notes

Consider creating multiple test data files for:
- Minimum case (1-2 transactions)
- Normal case (10-20 transactions)
- Large case (100+ transactions for performance testing)
- Edge cases (special characters, very long descriptions, negative balances)

---

**Last Updated:** 2026-01-04  
**Assigned To:** Development Team  
**Target Resolution:** Sprint 1
