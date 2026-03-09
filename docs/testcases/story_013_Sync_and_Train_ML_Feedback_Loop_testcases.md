# Test Cases for Story 013: Sync & Train — ML Feedback Loop

**Story Reference:** [story_013_Sync_and_Train_ML_Feedback_Loop.md](../stories/story_013_Sync_and_Train_ML_Feedback_Loop.md)  
**Date:** 2026-03-09  
**Author:** QA Automation Engineer  
**Sprint:** 3

---

## Unit Tests (Angular / TypeScript)

---

### TC-013-001

| Field | Value |
|---|---|
| **TC ID** | TC-013-001 |
| **Type** | Unit |
| **Title** | `reApplyRulesToAllTransactions()` returns 0 updated when there are no active rules |

**Preconditions:**
- `RulesService` is instantiated in a TestBed with an `IndexedDbService` spy.
- IndexedDB returns 0 active rules.
- IndexedDB returns a non-empty transaction list (e.g., 5 transactions).

**Steps:**
1. Stub `indexedDbService.getAllRules()` to return `[]`.
2. Stub `indexedDbService.getAllTransactions()` to return 5 mock transactions.
3. Call `rulesService.reApplyRulesToAllTransactions()`.
4. Await the returned promise.

**Expected Result:**
- Promise resolves to `0` (zero transactions updated).
- `indexedDbService.putTransaction()` is NOT called.

**AC Reference:** AC2b, C8

---

### TC-013-002

| Field | Value |
|---|---|
| **TC ID** | TC-013-002 |
| **Type** | Unit |
| **Title** | `reApplyRulesToAllTransactions()` skips transactions with `source === 'USER_FEEDBACK'` |

**Preconditions:**
- `RulesService` is instantiated with mocked IndexedDB.
- 3 transactions in IDB: 2 with `source = 'AI'`, 1 with `source = 'USER_FEEDBACK'`.
- 1 active rule is present.

**Steps:**
1. Stub `indexedDbService.getAllRules()` to return `[mockRule]`.
2. Stub `indexedDbService.getAllTransactions()` to return 3 mock transactions (2 AI, 1 USER_FEEDBACK).
3. Spy on `indexedDbService.putTransaction()`.
4. Call `rulesService.reApplyRulesToAllTransactions()`.
5. Await and inspect the result and spy call count.

**Expected Result:**
- Promise resolves to the count of AI-assigned transactions actually updated (0, 1, or 2 depending on rule match, but the USER_FEEDBACK transaction is NEVER passed to `putTransaction`).
- `putTransaction` is never called with the transaction whose `source === 'USER_FEEDBACK'`.

**AC Reference:** AC2b, C4

---

### TC-013-003

| Field | Value |
|---|---|
| **TC ID** | TC-013-003 |
| **Type** | Unit |
| **Title** | `reApplyRulesToAllTransactions()` updates AI-assigned transactions and returns correct count |

**Preconditions:**
- `RulesService` is instantiated with mocked IndexedDB.
- 4 transactions: 3 with `source = 'AI'`, 1 with `source = 'USER_FEEDBACK'`.
- 1 active rule matching all 3 AI transactions (assigns category `"Food"`).

**Steps:**
1. Stub rules and transactions as described.
2. Call `rulesService.reApplyRulesToAllTransactions()`.
3. Await the promise.

**Expected Result:**
- Returns `3` (three AI transactions updated).
- `putTransaction` called exactly 3 times (not 4).
- The USER_FEEDBACK transaction's `category` is unchanged.

**AC Reference:** AC2b, C4

---

### TC-013-004

| Field | Value |
|---|---|
| **TC ID** | TC-013-004 |
| **Type** | Unit |
| **Title** | `SheetsService.syncRules()` writes all 10 columns per rule row |

**Preconditions:**
- `SheetsService` is instantiated with a mock Google Sheets API client.
- 2 active rules with all fields populated.

**Steps:**
1. Spy on the Sheets API `append`/`update` method.
2. Call `sheetsService.syncRules(mockRules)`.
3. Await the promise.
4. Inspect the payload sent to the API.

**Expected Result:**
- Each rule row contains exactly 10 values in the correct column order:
  `ID | PatternType | Pattern | Category | SubCategory | Priority | Active | Source | CreatedAt | LastModified`.
- `LastModified` contains a valid ISO timestamp string.
- `SubCategory` is empty string `""` if not present on the rule.

**AC Reference:** AC8 (corrected), C2

---

### TC-013-005

| Field | Value |
|---|---|
| **TC ID** | TC-013-005 |
| **Type** | Unit |
| **Title** | `SheetsService.syncRules()` uses clear-and-rewrite strategy |

**Preconditions:**
- `SheetsService` mocked with Sheets API spy.
- 3 active rules available.

**Steps:**
1. Spy on the Sheets API clear and append methods.
2. Call `sheetsService.syncRules(mockRules)`.
3. Inspect call order of spies.

**Expected Result:**
- Clear call (on the Rules tab beyond the header row) occurs BEFORE the append call.
- Append call receives all 3 rule rows.

**AC Reference:** C3

---

## Component Tests (Angular TestBed)

---

### TC-013-006

| Field | Value |
|---|---|
| **TC ID** | TC-013-006 |
| **Type** | Component |
| **Title** | `sync-train-btn` is disabled while sync is in progress |

**Preconditions:**
- `DashboardComponent` is created in TestBed with `SheetsService` and `RulesService` mocked.
- User is authenticated (mock auth state = authenticated).

**Steps:**
1. Create the component and trigger change detection.
2. Spy on `sheetsService.syncRules()` to return a never-resolving promise (simulate long-running sync).
3. Click `[data-testid="sync-train-btn"]`.
4. Trigger change detection.
5. Query `[data-testid="sync-train-btn"]` disabled attribute.

**Expected Result:**
- `[data-testid="sync-train-btn"]` has `disabled` attribute (or `[attr.disabled]` evaluates to truthy) while `syncing()` is true.

**AC Reference:** AC2, C6

---

### TC-013-007

| Field | Value |
|---|---|
| **TC ID** | TC-013-007 |
| **Type** | Component |
| **Title** | Toast shows loading text during sync and success text on completion |

**Preconditions:**
- `DashboardComponent` is created in TestBed.
- `ToastService` is mocked with ability to read emitted messages.
- `sheetsService.syncRules()` resolves after a tick.

**Steps:**
1. Click `[data-testid="sync-train-btn"]`.
2. Before resolving the sync, check `[data-testid="sync-train-status"]` text (or toast message).
3. Let the promise resolve.
4. Trigger change detection.
5. Check `[data-testid="sync-train-status"]` text again.

**Expected Result:**
- During sync: `sync-train-status` contains a loading indicator or progress text (e.g., "Syncing…").
- After success: `sync-train-status` contains `"Sync complete ✓"`.

**AC Reference:** AC3, AC4

---

### TC-013-008

| Field | Value |
|---|---|
| **TC ID** | TC-013-008 |
| **Type** | Component |
| **Title** | Toast shows error message and does NOT auto-dismiss on Sheets API failure |

**Preconditions:**
- `DashboardComponent` in TestBed.
- `sheetsService.syncRules()` is stubbed to reject with an error.

**Steps:**
1. Click `[data-testid="sync-train-btn"]`.
2. Let the rejected promise propagate.
3. Trigger change detection.
4. Check `[data-testid="sync-train-status"]` text.
5. Wait 4 seconds (simulate auto-dismiss timeout).
6. Check `[data-testid="sync-train-status"]` is still visible.

**Expected Result:**
- `sync-train-status` shows an error message (non-empty, error-styled).
- Toast does NOT disappear after 3 s — it persists until user dismissal.

**AC Reference:** AC5, C11

---

### TC-013-009

| Field | Value |
|---|---|
| **TC ID** | TC-013-009 |
| **Type** | Component |
| **Title** | "Nothing to sync" toast shown when there are 0 active rules |

**Preconditions:**
- `DashboardComponent` in TestBed.
- `indexedDbService.getAllRules()` stubbed to return `[]`.

**Steps:**
1. Click `[data-testid="sync-train-btn"]`.
2. Trigger change detection.

**Expected Result:**
- `[data-testid="sync-train-status"]` text matches `"Nothing to sync — no active rules."`.
- `sheetsService.syncRules()` (Sheets API) is NOT called.

**AC Reference:** C8

---

### TC-013-010

| Field | Value |
|---|---|
| **TC ID** | TC-013-010 |
| **Type** | Component |
| **Title** | Mobile layout renders `sync-train-btn` as a FAB (fixed bottom-right) at ≤ 767 px viewport |

**Preconditions:**
- `DashboardComponent` created in TestBed.
- Viewport emulated at 375 × 667 px (mobile).
- `BreakpointObserver` correctly reports mobile breakpoint.

**Steps:**
1. Render the component at 375 × 667 px.
2. Trigger change detection.
3. Query `[data-testid="sync-train-btn"]` and inspect its computed CSS position and dimensions.

**Expected Result:**
- Element uses `position: fixed` (FAB).
- Element is positioned bottom-right.
- Minimum tap target dimensions are ≥ 44 × 44 px.

**AC Reference:** AC7, C7

---

### TC-013-011

| Field | Value |
|---|---|
| **TC ID** | TC-013-011 |
| **Type** | Component |
| **Title** | Desktop layout renders `sync-train-btn` as a plain button (not FAB) at ≥ 768 px viewport |

**Preconditions:**
- `DashboardComponent` created in TestBed.
- Viewport emulated at 1280 × 800 px (desktop).

**Steps:**
1. Render the component at 1280 × 800 px.
2. Trigger change detection.
3. Query `[data-testid="sync-train-btn"]` and inspect CSS position property.

**Expected Result:**
- Element does NOT use `position: fixed`.
- Element is a plain `<button>` in the Dashboard header area.
- `FabButtonComponent` is NOT rendered in the desktop layout.

**AC Reference:** AC1, C7

---

## E2E Tests (Playwright)

**Base URL:** `http://localhost:4200`

---

### TC-013-012

| Field | Value |
|---|---|
| **TC ID** | TC-013-012 |
| **Type** | E2E |
| **Title** | Authenticated user clicks Sync & Train → loading indicator → success toast → auto-dismisses after 3 s |

**Preconditions:**
- User is authenticated (Google OAuth mock or test account).
- At least 1 active rule is in IndexedDB.
- At least 1 AI-assigned transaction is in IndexedDB.
- App is running at `http://localhost:4200`.

**Steps:**
1. `await page.goto('/dashboard')`.
2. `await page.locator('[data-testid="sync-train-btn"]').click()`.
3. Assert `[data-testid="sync-train-status"]` is visible and contains loading text.
4. Wait for `[data-testid="sync-train-status"]` to contain `"Sync complete ✓"`.
5. Wait 3.5 seconds.
6. Assert `[data-testid="sync-train-status"]` is no longer visible.

**Expected Result:**
- Loading state is shown during sync.
- Success toast appears with text containing `"Sync complete ✓"`.
- Toast auto-dismisses within ~3 s after success.

**AC Reference:** AC2, AC3, AC4

---

### TC-013-013

| Field | Value |
|---|---|
| **TC ID** | TC-013-013 |
| **Type** | E2E |
| **Title** | Unauthenticated user clicking Sync & Train sees `auth-error` prompt |

**Preconditions:**
- User is NOT authenticated (no Google token present in session).
- App is running at `http://localhost:4200`.

**Steps:**
1. `await page.goto('/dashboard')`.
2. Ensure no auth token is present (clear localStorage).
3. `await page.locator('[data-testid="sync-train-btn"]').click()`.
4. Wait for `[data-testid="auth-error"]` to be visible.

**Expected Result:**
- `[data-testid="auth-error"]` prompt is visible.
- `[data-testid="sync-train-status"]` does NOT show a sync-in-progress or success state.

**AC Reference:** AC6

---

### TC-013-014

| Field | Value |
|---|---|
| **TC ID** | TC-013-014 |
| **Type** | E2E |
| **Title** | Sync complete with 0 updated transactions shows "Sync complete ✓ (0 updated)" |

**Preconditions:**
- User is authenticated.
- Rules are present in IndexedDB but all transactions are either USER_FEEDBACK or already correctly categorised.
- App is running at `http://localhost:4200`.

**Steps:**
1. `await page.goto('/dashboard')`.
2. `await page.locator('[data-testid="sync-train-btn"]').click()`.
3. Wait for `[data-testid="sync-train-status"]` to be stable.

**Expected Result:**
- `[data-testid="sync-train-status"]` text contains `"Sync complete ✓ (0 updated)"`.

**AC Reference:** C9

---

### TC-013-015

| Field | Value |
|---|---|
| **TC ID** | TC-013-015 |
| **Type** | E2E |
| **Title** | Regression: Story 004 Sheets sync tests continue to pass |

**Preconditions:**
- Story 004 test fixtures and environment are available.
- Story 004 E2E spec file (`story_004.spec.ts`) exists.

**Steps:**
1. Run `story_004.spec.ts` E2E tests without modification.
2. Observe all test outcomes.

**Expected Result:**
- All Story 004 E2E tests pass with 0 failures.

**AC Reference:** AC9

---
