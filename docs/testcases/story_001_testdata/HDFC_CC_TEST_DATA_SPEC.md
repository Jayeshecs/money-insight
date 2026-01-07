# HDFC Credit Card Test Data Specification

**Generated:** 2026-01-06  
**Purpose:** Realistic test data for HDFC Credit Card parser validation  
**Related Defect:** DEF-001  

---

## Files Generated

### 1. CC2486_20250418.xls (Version 2 Format)

**Format Characteristics:**
- **Detection Key:** Column 0 (1st column) = "Transaction type"
- **Column Mapping:**
  - Column 9: Transaction date (DD/MM/YYYY)
  - Column 12: Description/Narration
  - Column 20: Transaction amount
  - Column 23: Cr/Dr indicator

**Structure:**
```
Row 0: HDFC Bank Credit Card Statement
Row 1: Card Number: XXXX XXXX XXXX 2486
Row 2: Statement Date: 18/04/2025
Row 3: [HEADER ROW] Transaction type | ... | Transaction date | ... | Description | ... | Amount | ... | Cr/Dr
Row 4+: Transaction data
```

### 2. CC2486_20251218.xls (Version 1 Format)

**Format Characteristics:**
- **Detection Key:** Column 1 (2nd column) = "Transaction type"
- **Column Mapping:**
  - Column 17: Transaction date (DD/MM/YYYY)
  - Column 21: Description/Narration
  - Column 48: Transaction amount
  - Column 54: Cr/Dr indicator

**Structure:**
```
Row 0: HDFC Bank Credit Card Statement
Row 1: Card Number: XXXX XXXX XXXX 2486
Row 2: Statement Date: 18/12/2025
Row 3: [HEADER ROW] | Transaction type | ... | Transaction date | ... | Description | ... | Amount | ... | Cr/Dr
Row 4+: Transaction data
```

---

## Transaction Data (Both Files)

Both files contain identical transactions for consistency testing:

| Date | Description | Amount (₹) | Cr/Dr |
|------|-------------|------------|-------|
| 15/04/2025 | AMAZON RETAIL INDIA | 2,500.00 | Dr |
| 15/04/2025 | SWIGGY FOOD DELIVERY | 850.00 | Dr |
| 16/04/2025 | UBER INDIA TRIP | 450.00 | Dr |
| 16/04/2025 | BIG BAZAAR PURCHASE | 3,200.00 | Dr |
| 17/04/2025 | FLIPKART ELECTRONICS | 15,000.00 | Dr |
| 17/04/2025 | ZOMATO FOOD ORDER | 680.00 | Dr |
| 17/04/2025 | PAYMENT RECEIVED THANK YOU | 10,000.00 | Cr |
| 18/04/2025 | NETFLIX SUBSCRIPTION | 649.00 | Dr |
| 18/04/2025 | DMart GROCERY | 2,450.00 | Dr |
| 18/04/2025 | PETROL PUMP INDIAN OIL | 3,500.00 | Dr |
| 18/04/2025 | APOLLO PHARMACY | 890.00 | Dr |
| 18/04/2025 | PAYMENT RECEIVED THANK YOU | 5,000.00 | Cr |

**Totals:**
- **Total Debits:** ₹30,169.00 (10 transactions)
- **Total Credits:** ₹15,000.00 (2 transactions)
- **Net:** -₹15,169.00

---

## Expected Parser Output

When parsed, each transaction should be converted to the following format:

```json
{
  "row-id": "<MD5 hash of raw data>",
  "txn-source": "CC2486",
  "txn-date": "2025-04-15",
  "narration": "AMAZON RETAIL INDIA",
  "txn-amount": 2500.00,
  "credit-indicator": "",
  "txn-type": "",
  "category": "",
  "sub-category": "",
  "raw-data": "15/04/2025|AMAZON RETAIL INDIA|2500.0|Dr"
}
```

**Key Transformations:**
1. **Date:** DD/MM/YYYY → YYYY-MM-DD
2. **txn-source:** First 6 characters of filename (CC2486)
3. **credit-indicator:** "Yes" if Cr/Dr = "Cr", else ""
4. **row-id:** MD5 hash of concatenated raw data

---

## Test Coverage

### Data Variations Included:
✅ Mix of debit and credit transactions  
✅ Various merchant categories (retail, food, transport, utilities)  
✅ Amount range: ₹450 - ₹15,000  
✅ Multiple transactions on same date  
✅ Payment transactions (credits)  
✅ Purchase transactions (debits)  
✅ Both single-word and multi-word descriptions  

### Edge Cases Covered:
✅ Two-digit year format (25 for 2025)  
✅ Merchant names with special characters (/)  
✅ Large transaction amounts (₹15,000)  
✅ Small transaction amounts (₹450)  
✅ Multiple payments in one statement  

### Edge Cases NOT Covered (Future Enhancement):
❌ Negative amounts  
❌ Zero amounts  
❌ Refund transactions  
❌ Foreign currency transactions  
❌ EMI transactions  
❌ Reward points  
❌ Interest charges  
❌ Late fees  

---

## Validation Checklist

Use this checklist to validate parser implementation:

### File Reading
- [ ] File opens without errors
- [ ] Correct version detected (v1 or v2)
- [ ] Header row identified correctly

### Data Extraction
- [ ] All 12 transactions extracted
- [ ] Date parsing successful (DD/MM/YYYY → YYYY-MM-DD)
- [ ] Amount parsing successful (numeric values)
- [ ] Cr/Dr indicator correctly read
- [ ] Description/narration extracted without truncation

### Data Transformation
- [ ] txn-source = "CC2486"
- [ ] Dates converted to YYYY-MM-DD format
- [ ] credit-indicator = "Yes" for Cr, "" for Dr
- [ ] row-id generated (MD5 hash)
- [ ] raw-data field populated

### Output Validation
- [ ] 12 transaction records generated
- [ ] No duplicate row-ids
- [ ] All required fields populated
- [ ] No parsing errors or exceptions

---

## Usage

### Generate Test Files
```bash
cd docs/testcases/story_001_testdata
python generate_hdfc_cc_testdata.py
```

### Verify Generated Files
```bash
python verify_testdata.py
```

### Test with Reference Python Parser
```bash
cd reference/python_scripts/stmt-proc-py
python -m src.processors.hdfc_credit_card_processor ../../../docs/testcases/story_001_testdata/CC2486_20250418.xls
```

---

## References

- **Python Reference:** [hdfc_credit_card_processor.py](../../../../reference/python_scripts/stmt-proc-py/src/processors/hdfc_credit_card_processor.py)
- **Defect Report:** [DEF-001](./DEF-001_Missing_Realistic_Test_Data.md)
- **Story:** [Story #001](../../stories/story_001_Upload_and_Parse_Bank_Statement.md)
- **Test Cases:** [Story #001 Test Cases](../story_001_Upload_and_Parse_Bank_Statement_testcases.md)

---

**Version:** 1.0  
**Last Updated:** 2026-01-06  
**Maintainer:** WASM Developer Team
