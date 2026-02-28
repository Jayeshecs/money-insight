## Test Cases for Story: WASM Engine Emits JSON for Dashboard

**Story Reference:** [story_005_WASM_Engine_Emits_JSON_for_Dashboard.md](../stories/story_005_WASM_Engine_Emits_JSON_for_Dashboard.md)  
**Date:** 2026-02-26  
**Author:** QA Automation Engineer

---

### Test Case 1: WASM Parse Output Contains All Required JSON Fields
**Objective:** Verify that the JSON returned by the WASM engine after parsing a bank statement includes all fields required by the dashboard (date, narration, amount, type, category, account source).

#### Steps
1. Open the MoneyInsight application.
2. Navigate to the import screen.
3. Upload a valid HDFC Savings statement (`SA3234_FY2025_20251221.xls`).
4. Intercept the WASM engine output by inspecting the Angular service layer or browser console.
5. Examine the parsed JSON structure for each transaction.

#### Test Data
- `story_001_testdata/SA3234_FY2025_20251221.xls`

#### Expected Result
- WASM returns a valid JSON array.
- Each transaction object contains all of the following fields:
  - `date` (ISO format: `YYYY-MM-DD`)
  - `narration` (string)
  - `amount` (number)
  - `transaction_type` (`CREDIT` or `DEBIT`)
  - `category` (string or `null`)
  - `txn_source` (string, e.g. `"SA3234"`)
- Total array length equals the number of transactions (17 for savings test file).
- No field contains `undefined`, `null` on mandatory fields, or malformed values.

---

### Test Case 2: Dashboard Widgets Update Immediately After Parsing
**Objective:** Verify that the dashboard widgets (e.g., total spend, transaction count, category breakdown) refresh immediately after a statement is parsed, without requiring a page reload.

#### Steps
1. Navigate to the dashboard.
2. Note the current state of the dashboard (e.g., empty or previous data).
3. Navigate to the import screen and upload a valid bank statement.
4. Wait for parsing to complete.
5. Navigate back to the dashboard.

#### Test Data
- `story_001_testdata/SA3234_FY2025_20251221.xls`

#### Expected Result
- Dashboard widgets reflect the newly parsed transactions without requiring a manual refresh.
- Transaction count widget shows 17.
- Total credit and total debit amounts match the parsed data.
- Any category-based widget (e.g., chart) is populated with the new data.
- No stale data from prior state persists in the dashboard.

---

### Test Case 3: JSON Transaction Count Matches IndexedDB Record Count
**Objective:** Verify that the number of transactions in the WASM JSON output is identical to the number of records stored in IndexedDB.

#### Steps
1. Upload and parse a valid bank statement.
2. Capture the WASM JSON output (transaction array length).
3. Open browser DevTools → Application → IndexedDB → `moneyinsight-db` → `transactions` object store.
4. Count the records in the store.

#### Test Data
- `story_001_testdata/SA3234_FY2025_20251221.xls` (17 expected transactions)

#### Expected Result
- WASM JSON array length = 17.
- IndexedDB `transactions` store record count = 17.
- Both counts are equal with no off-by-one errors or missing rows.

---

### Test Case 4: Dashboard Reflects Data from Multiple Uploaded Statements
**Objective:** Verify that the dashboard aggregates data from multiple statement uploads correctly, showing a combined view.

#### Steps
1. Upload and parse HDFC Savings statement.
2. Navigate to the dashboard and note transaction count.
3. Navigate back to import and upload HDFC Credit Card statement.
4. Navigate to the dashboard again.

#### Test Data
- `story_001_testdata/SA3234_FY2025_20251221.xls` (17 txns)
- `story_001_testdata/CC2486_20250418.xls` (12 txns)

#### Expected Result
- After first upload: transaction count = 17.
- After second upload: transaction count = 29 (17 + 12).
- Dashboard aggregation (total spend, credits, debits) updates correctly.
- Transactions from both account sources (`SA3234` and `CC2486`) are present.

---

### Test Case 5: JSON Date and Amount Formats Are Dashboard-Compatible
**Objective:** Verify that dates and amounts in the WASM JSON output are in formats that the Angular dashboard can consume directly without additional transformation.

#### Steps
1. Upload and parse a valid bank statement.
2. Capture the WASM JSON output.
3. Inspect the `date` field of at least 3 transactions.
4. Inspect the `amount` field of at least 3 transactions.

#### Test Data
- `story_001_testdata/SA3234_FY2025_20251221.xls`

#### Expected Result
- All `date` values follow `YYYY-MM-DD` ISO format (e.g., `"2025-03-15"`).
- All `amount` values are JSON numbers (not strings or currency-formatted strings, e.g., `1500.00`, not `"₹1,500.00"`).
- No dates are in raw Excel serial number format.
- Angular date pipe and currency pipe can consume the fields without additional parsing.

---

### Test Case 6: Dashboard Shows Empty State When No Statements Are Uploaded
**Objective:** Verify that the dashboard shows a meaningful empty state (rather than crashing or showing zeros) when no transactions are present in IndexedDB.

#### Steps
1. Clear all IndexedDB data (`moneyinsight-db` → transactions store).
2. Navigate to the dashboard.
3. Observe the widget states.

#### Test Data
- No data (empty IndexedDB)

#### Expected Result
- Dashboard shows a friendly empty-state message such as "No transactions yet. Upload a bank statement to get started."
- No widget shows `NaN`, `undefined`, or throws a JavaScript error.
- A "Upload Statement" CTA button or link is visible.
- Browser console shows no uncaught errors.

---

### Test Case 7: WASM JSON Handles Large Files Without Performance Degradation
**Objective:** Verify that the WASM engine produces valid JSON within an acceptable time window when processing a large statement file.

#### Steps
1. Prepare a test file with 500+ transactions (or use the largest available test file).
2. Upload and parse the file.
3. Measure the time from file selection to dashboard update using browser Performance tools.

#### Test Data
- A large HDFC Savings statement with 500+ rows (or largest available test file)

#### Expected Result
- WASM parsing completes within 5 seconds for files up to 1000 rows.
- JSON output is valid and complete (all rows present).
- Dashboard updates within 2 seconds of parse completion.
- No memory-related browser errors or crashes occur.

---

### Test Case Summary

| TC | Description | Priority | Status |
|----|-------------|----------|--------|
| TC1 | WASM JSON contains all required fields | High | Not Executed |
| TC2 | Dashboard updates immediately after parse | High | Not Executed |
| TC3 | JSON count matches IndexedDB record count | High | Not Executed |
| TC4 | Dashboard aggregates multiple uploads | Medium | Not Executed |
| TC5 | Date and amount formats are compatible | Medium | Not Executed |
| TC6 | Empty state shown when no data present | Low | Not Executed |
| TC7 | Large file handled without degradation | Medium | Not Executed |
