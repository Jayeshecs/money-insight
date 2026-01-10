## Test Cases for Story: Store Parsed Transactions in IndexedDB

### Test Case 1: Store Transactions After Successful Parsing
**Objective:** Verify that all parsed transactions are stored in IndexedDB immediately after successful parsing.

#### Steps
1. Navigate to the upload screen.
2. Upload a valid HDFC Savings statement.
3. Wait for parsing to complete.
4. Open browser DevTools → Application → IndexedDB.
5. Verify that transactions are stored in the database.

#### Test Data
- story_001_testdata/SA3234_FY2025_20251221.xls

#### Expected Result
- All parsed transactions appear in IndexedDB under the "transactions" object store.
- Each transaction has required fields: date, description, amount, account, transaction_type.
- Transaction count in IndexedDB matches the count displayed in UI.

---

### Test Case 2: Persist Data Across Page Reload
**Objective:** Verify that transactions stored in IndexedDB remain available after page reload.

#### Steps
1. Upload and parse a bank statement.
2. Verify transactions are displayed.
3. Refresh the browser page (F5).
4. Navigate back to the transactions view.

#### Test Data
- story_001_testdata/CC2486_20250418.xls

#### Expected Result
- Previously uploaded transactions are still available.
- No re-upload is required to view the data.
- Transaction count and details match the original upload.

---

### Test Case 3: Access Data Offline
**Objective:** Verify that transactions can be accessed when the browser is offline.

#### Steps
1. Upload and parse a bank statement while online.
2. Verify data is stored in IndexedDB.
3. Disconnect from the internet (airplane mode or disable network).
4. Navigate to the transactions view or refresh the page.

#### Test Data
- story_001_testdata/SA3234_FY2025_20251221.xls

#### Expected Result
- Transactions are displayed from IndexedDB cache.
- No network errors occur.
- Full offline functionality is maintained for viewing cached data.

---

### Test Case 4: Store Multiple Statement Uploads
**Objective:** Verify that transactions from multiple statement uploads are all stored in IndexedDB without overwriting previous data.

#### Steps
1. Upload and parse HDFC Savings statement.
2. Verify data is stored in IndexedDB.
3. Upload and parse HDFC Credit Card statement.
4. Verify both sets of transactions are stored.

#### Test Data
- story_001_testdata/SA3234_FY2025_20251221.xls (HDFC Savings)
- story_001_testdata/CC2486_20250418.xls (HDFC Credit Card)

#### Expected Result
- Both sets of transactions are stored in IndexedDB.
- Total transaction count = sum of both uploads.
- Each transaction retains its source account identifier.
- No data loss or overwriting occurs.

---

### Test Case 5: Update Existing Transactions (Deduplication)
**Objective:** Verify that uploading the same statement twice does not create duplicate entries.

#### Steps
1. Upload and parse a statement.
2. Note the transaction count in IndexedDB.
3. Upload the same statement file again.
4. Check IndexedDB for duplicates.

#### Test Data
- story_001_testdata/SA3234_FY2025_20251221.xls (uploaded twice)

#### Expected Result
- Duplicate transactions are either:
  - **Option A:** Prevented from being stored (preferred)
  - **Option B:** Clearly marked as duplicates with a flag
- Transaction count does not double after second upload.
- System notifies user if duplicates are detected.

---

### Test Case 6: Clear Transactions from IndexedDB
**Objective:** Verify that users can clear all stored transactions from IndexedDB.

#### Steps
1. Upload and parse multiple statements.
2. Verify data is stored in IndexedDB.
3. Use the "Clear Data" or "Delete All" function in the app.
4. Check IndexedDB to confirm data is removed.

#### Test Data
- story_001_testdata/SA3234_FY2025_20251221.xls
- story_001_testdata/CC2486_20250418.xls

#### Expected Result
- All transactions are removed from IndexedDB.
- IndexedDB object store is empty.
- UI reflects the cleared state (no transactions displayed).
- User receives confirmation message.

---

### Test Case 7: Handle Large Transaction Dataset
**Objective:** Verify that IndexedDB can store and retrieve a large number of transactions efficiently.

#### Steps
1. Upload a statement with 500+ transactions.
2. Verify all transactions are stored in IndexedDB.
3. Measure storage time.
4. Reload page and measure retrieval time.

#### Test Data
- story_002_testdata/HDFC_Large_Statement.xlsx (500+ transactions)

#### Expected Result
- All 500+ transactions are stored successfully.
- Storage operation completes within 2 seconds.
- Retrieval on page reload completes within 2 seconds.
- No browser performance degradation.

---

### Test Case 8: Verify IndexedDB Schema
**Objective:** Verify that the IndexedDB schema matches the expected structure.

#### Steps
1. Upload a statement.
2. Open browser DevTools → Application → IndexedDB.
3. Inspect the database schema and object stores.

#### Test Data
- story_001_testdata/SA3234_FY2025_20251221.xls

#### Expected Result
- Database name: "MoneyInsightDB" (or as defined)
- Object store exists: "transactions"
- Index on "date" field exists (for querying by date)
- Index on "account" field exists (for filtering by account)
- Each transaction has a unique key or auto-incremented ID.

---

### Test Case 9: Handle Storage Quota Exceeded
**Objective:** Verify that the system handles gracefully when IndexedDB storage quota is exceeded.

#### Steps
1. Upload multiple large statements to approach storage quota.
2. Continue uploading until quota is exceeded.
3. Observe system behavior.

#### Test Data
- Multiple large statement files

#### Expected Result
- System displays error message: "Storage quota exceeded. Please delete old transactions."
- Latest upload is rejected or user is prompted to clear old data.
- Existing data remains intact.
- No data corruption occurs.

---

### Test Case 10: Export Data from IndexedDB
**Objective:** Verify that users can export their locally stored transactions to a file.

#### Steps
1. Upload and parse statements.
2. Verify data is in IndexedDB.
3. Use the "Export Data" function.
4. Download the exported file (JSON or CSV).
5. Verify exported data matches IndexedDB content.

#### Test Data
- story_001_testdata/SA3234_FY2025_20251221.xls

#### Expected Result
- Export generates a valid JSON or CSV file.
- All transactions from IndexedDB are included.
- Data format matches the Transaction model.
- File can be re-imported if needed.

---

### Test Case 11: Browser Compatibility - Chrome
**Objective:** Verify IndexedDB functionality works correctly in Chrome browser.

#### Steps
1. Open application in Chrome.
2. Upload and parse a statement.
3. Verify IndexedDB storage.
4. Reload page and verify data persistence.

#### Test Data
- story_001_testdata/CC2486_20250418.xls

#### Expected Result
- All IndexedDB operations work as expected in Chrome.
- No console errors related to IndexedDB.

---

### Test Case 12: Browser Compatibility - Firefox
**Objective:** Verify IndexedDB functionality works correctly in Firefox browser.

#### Steps
1. Open application in Firefox.
2. Upload and parse a statement.
3. Verify IndexedDB storage.
4. Reload page and verify data persistence.

#### Test Data
- story_001_testdata/CC2486_20250418.xls

#### Expected Result
- All IndexedDB operations work as expected in Firefox.
- No console errors related to IndexedDB.

---

### Test Case 13: Browser Compatibility - Edge
**Objective:** Verify IndexedDB functionality works correctly in Edge browser.

#### Steps
1. Open application in Edge.
2. Upload and parse a statement.
3. Verify IndexedDB storage.
4. Reload page and verify data persistence.

#### Test Data
- story_001_testdata/CC2486_20250418.xls

#### Expected Result
- All IndexedDB operations work as expected in Edge.
- No console errors related to IndexedDB.

---

### Test Case 14: Handle Transaction Update
**Objective:** Verify that individual transactions can be updated in IndexedDB (for manual corrections).

#### Steps
1. Upload and parse a statement.
2. Modify a transaction (e.g., update category or description).
3. Save the changes.
4. Reload the page.
5. Verify the updated transaction persists.

#### Test Data
- story_001_testdata/SA3234_FY2025_20251221.xls

#### Expected Result
- Transaction is updated in IndexedDB.
- Updated values persist after page reload.
- Other transactions are not affected.

---

### Test Case 15: Handle Transaction Deletion
**Objective:** Verify that individual transactions can be deleted from IndexedDB.

#### Steps
1. Upload and parse a statement.
2. Delete a specific transaction from the UI.
3. Check IndexedDB to confirm deletion.
4. Reload the page.
5. Verify the deleted transaction does not appear.

#### Test Data
- story_001_testdata/SA3234_FY2025_20251221.xls

#### Expected Result
- Transaction is removed from IndexedDB.
- Deletion persists after page reload.
- Transaction count decreases by 1.

---

## Test Data Requirements

### Required Test Files
All test files are reused from Story 001 testdata:
- SA3234_FY2025_20251221.xls (HDFC Savings)
- CC2486_20250418.xls (HDFC Credit Card)
- HDFC_Large_Statement.xlsx (500+ transactions) - from Story 002

### Browser Testing Requirements
- Chrome (latest version)
- Firefox (latest version)
- Edge (latest version)

---

## IndexedDB Schema Specification

```typescript
// Database: MoneyInsightDB
// Version: 1

interface TransactionSchema {
  id: number;                    // Auto-incremented primary key
  date: string;                  // ISO 8601 format
  description: string;
  amount: number;                // Signed value
  account: string;               // Account identifier
  transaction_type: string;      // "DEBIT" or "CREDIT"
  source_parser: string;         // Parser that generated this transaction
  created_at: string;            // Timestamp of when stored
  updated_at?: string;           // Timestamp of last update (optional)
}

// Indexes:
// - "date_idx" on date field
// - "account_idx" on account field
```

---

## Notes on Test Coverage

- **Persistence Testing:** TC1, TC2, TC3 verify data storage and retrieval
- **Multi-Upload:** TC4 tests accumulation of data from multiple sources
- **Deduplication:** TC5 ensures no duplicate entries
- **Data Management:** TC6, TC14, TC15 test CRUD operations
- **Performance:** TC7 tests large dataset handling
- **Edge Cases:** TC9 tests quota limits
- **Cross-Browser:** TC11, TC12, TC13 ensure compatibility
- **Offline-First:** TC3 validates offline functionality

---

## Integration with Angular Service

These tests verify the behavior of the Angular IndexedDB service:

```typescript
// Pseudo-code service interface
class TransactionStorageService {
  saveTransactions(transactions: Transaction[]): Promise<void>;
  getAllTransactions(): Promise<Transaction[]>;
  getTransactionsByAccount(account: string): Promise<Transaction[]>;
  deleteTransaction(id: number): Promise<void>;
  clearAllTransactions(): Promise<void>;
}
```

---

## Acceptance Criteria Validation

✅ **AC1:** All parsed transactions are available in IndexedDB after upload  
- Covered by: TC1, TC4, TC7

✅ **AC2:** Data remains available after page reload or offline  
- Covered by: TC2, TC3

---
