## Test Cases for Story: Sync Transactions to Google Sheets

**Story Reference:** [story_004_Sync_Transactions_to_Google_Sheets.md](../stories/story_004_Sync_Transactions_to_Google_Sheets.md)  
**Date:** 2026-02-26  
**Author:** QA Automation Engineer

---

### Test Case 1: Sync Transactions to Correct Google Sheet Tab
**Objective:** Verify that parsed transactions are written to the designated tab in the user's Google Sheet after a successful upload.

#### Steps
1. Sign in with a Google account that has a linked MoneyInsight Google Sheet.
2. Navigate to the import screen.
3. Upload a valid HDFC Savings statement (`SA3234_FY2025_20251221.xls`).
4. Wait for parsing and IndexedDB storage to complete.
5. Trigger Google Sheets sync (manually or via automatic background sync).
6. Open the linked Google Sheet and navigate to the "Transactions" tab.

#### Test Data
- `story_001_testdata/SA3234_FY2025_20251221.xls`
- A Google Sheet pre-linked to the test user account

#### Expected Result
- All 17 parsed transactions appear in the "Transactions" tab of the Google Sheet.
- Each row contains the correct fields: Date, Narration, Amount, Type, Category, Account Source.
- Dates are in `YYYY-MM-DD` format.
- Amounts are numeric (not formatted strings).
- No duplicate rows are written on repeated sync triggers.

---

### Test Case 2: Sync Transactions from Multiple Statements
**Objective:** Verify that transactions from multiple uploaded statements are all synced to Google Sheets without overwriting previous data.

#### Steps
1. Upload and parse HDFC Savings statement; wait for sync to complete.
2. Navigate back to the import screen.
3. Upload and parse HDFC Credit Card statement; wait for sync to complete.
4. Open the linked Google Sheet.

#### Test Data
- `story_001_testdata/SA3234_FY2025_20251221.xls` (HDFC Savings — 17 txns)
- `story_001_testdata/CC2486_20250418.xls` (HDFC Credit Card — 12 txns)

#### Expected Result
- Google Sheet contains rows from both uploads (total: 29 rows).
- Each transaction retains its source account identifier (`txn_source`).
- No data is overwritten or lost between syncs.

---

### Test Case 3: Sync Status Indicator Shown to User
**Objective:** Verify that the UI shows a sync status indicator (e.g., "Syncing…", "Sync complete", "Sync failed") during and after the sync operation.

#### Steps
1. Upload and parse a valid bank statement.
2. Observe the UI during the Google Sheets sync.
3. Wait for sync to complete.
4. Observe the UI after sync completion.

#### Test Data
- `story_001_testdata/SA3234_FY2025_20251221.xls`

#### Expected Result
- A loading/spinner indicator is shown with text such as "Syncing to Google Sheets…" while sync is in progress.
- On success, a success message such as "Synced to Google Sheets ✓" is displayed.
- The indicator disappears or transitions gracefully after completion.
- No raw error objects or stack traces are shown to the user.

---

### Test Case 4: Sync Failure is Queued and Retried
**Objective:** Verify that if Google Sheets sync fails (e.g., network unavailable), the failed sync is queued and retried when connectivity is restored.

#### Steps
1. Upload and parse a valid bank statement while online.
2. Disable network connectivity (airplane mode or DevTools → Offline).
3. Wait for the sync attempt; observe the failure notification.
4. Re-enable network connectivity.
5. Wait for the automatic retry.
6. Open the linked Google Sheet.

#### Test Data
- `story_001_testdata/SA3234_FY2025_20251221.xls`

#### Expected Result
- When offline, a notification is shown: "Sync failed — will retry when online" or similar.
- The failed sync is added to the IndexedDB `syncQueue` object store.
- When connectivity is restored, the retry occurs automatically.
- After retry, all transactions appear correctly in Google Sheets.
- The sync queue is cleared after a successful retry.

---

### Test Case 5: User is Notified of Sync Failure
**Objective:** Verify that the user receives a clear, actionable error notification when a sync fails (e.g., revoked Google auth token, quota exceeded).

#### Steps
1. Revoke Google Sheets access for the test account (Google OAuth token invalidated).
2. Upload and parse a valid bank statement.
3. Wait for the sync attempt.
4. Observe the error notification shown in the UI.

#### Test Data
- `story_001_testdata/SA3234_FY2025_20251221.xls`
- A Google account with revoked Sheets access

#### Expected Result
- UI shows a clear error notification: "Google Sheets sync failed. Please re-authenticate." or similar.
- A "Re-authenticate" or "Reconnect Google Sheets" call-to-action button is displayed.
- Transactions remain safe in IndexedDB — no data loss occurs.
- The error message does not expose internal OAuth token details.

---

### Test Case 6: No Raw Transaction Data Sent to Server
**Objective:** Verify that raw bank statement data is not transmitted to any third-party server during the sync process (privacy requirement).

#### Steps
1. Open browser DevTools → Network tab and start recording.
2. Upload and parse a valid bank statement.
3. Trigger Google Sheets sync.
4. Inspect all outbound network requests during sync.

#### Test Data
- `story_001_testdata/SA3234_FY2025_20251221.xls`

#### Expected Result
- Only Google Sheets API calls (`sheets.googleapis.com`) are made during sync.
- No raw Excel/CSV file bytes are sent in any request body.
- No MoneyInsight-owned backend server receives transaction data.
- All sensitive fields (account number, name) match the anonymized parsed output — not the raw file content.

---

### Test Case 7: Sync Idempotency — No Duplicate Rows on Re-Sync
**Objective:** Verify that triggering sync multiple times for the same set of transactions does not create duplicate rows in Google Sheets.

#### Steps
1. Upload and parse a valid bank statement; allow sync to complete.
2. Trigger sync again manually (or reload and allow automatic sync).
3. Open the linked Google Sheet and count rows.

#### Test Data
- `story_001_testdata/SA3234_FY2025_20251221.xls`

#### Expected Result
- Row count in Google Sheets equals the number of parsed transactions (17), not a multiple.
- Each transaction's UUID (column A — `id` field) is used for deduplication; no MD5/hash mechanism is used.
- No duplicate rows exist in the "Transactions" tab.

---

### Test Case Summary

| TC | Description | Priority | Status |
|----|-------------|----------|--------|
| TC1 | Sync to correct Google Sheet tab | High | Not Executed (requires live Google account) |
| TC2 | Sync multiple statements | High | Not Executed (requires live Google account) |
| TC3 | Sync status indicator shown | Medium | ✅ Pass (E2E) |
| TC4 | Sync failure queued and retried | High | ✅ Pass (E2E) |
| TC5 | User notified of sync failure | High | ✅ Pass (E2E) |
| TC6 | No raw data sent to server | High | ✅ Pass (E2E) |
| TC7 | Sync idempotency — no duplicates | Medium | Not Executed (requires live Google account) |

---

## E2E Playwright Test Results

**Test Suite:** `tests/e2e/tests/story_004.spec.ts`  
**Executed:** 2026-02-26  
**Environment:** `http://localhost:4200` (Angular dev server), Chromium, Google APIs mocked via `page.route()`  
**Result:** 8 passed, 0 failed, 1 skipped (TC9)

| E2E TC | Description | Result | Notes |
|--------|-------------|--------|-------|
| E2E-TC1 | Auth-error state shown after upload when unauthenticated | ✅ Pass | |
| E2E-TC2 | Sync status bar hidden in idle state before upload | ✅ Pass | |
| E2E-TC3 | Syncing → success with mocked Google APIs | ✅ Pass | Mocked via `page.route()` |
| E2E-TC4 | Queued state shown when offline (auth injected) | ✅ Pass | `context.setOffline(true)` |
| E2E-TC5 | Retry Sync succeeds after coming back online | ✅ Pass | Mocked APIs + offline→online transition |
| E2E-TC6 | No raw XLS bytes transmitted to any server | ✅ Pass | Request body inspection |
| E2E-TC7 | syncQueue PENDING→SYNCED + `transactions.synced=true` | ✅ Pass | IDB state verified via `page.evaluate()` |
| E2E-TC8 | Spinner visible during syncing state | ✅ Pass | 2-second delay mock |
| E2E-TC9 | Real rows appear in Google Sheet (live account) | ⏭ Skipped | Requires real Google account — manual only |

### Defects Found and Fixed During E2E Testing

| ID | Severity | Description | Fix Applied |
|----|----------|-------------|-------------|
| E2E-D1 | Medium | `SyncStatusComponent` not updating — `BehaviorSubject.next()` fired outside Angular zone from IDB async callbacks | Added `NgZone.run()` in `SyncService.setSyncStatus()` and `ChangeDetectorRef.markForCheck()` in component subscription |
| E2E-D2 | Low | Test helper `injectFakeRefreshToken` missing `googleSheetId` — caused "Sheet ID not configured" error | Updated helper to also inject `googleSheetId` setting alongside `refreshToken` |
| E2E-D3 | Low | `getTransactionSyncedCount` helper used IDB index shortcut `count(1)` which doesn't match JS `true` booleans | Fixed to always use full scan with `v === true \|\| v === 1` check |
