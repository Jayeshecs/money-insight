# Test Cases: Story #021 — Ad Visibility Setting

**Story:** Ad Visibility Setting — Show / Hide Ad Placeholders  
**Story File:** `docs/stories/story_021_Ad_Visibility_Setting.md`  
**Spec File:** `tests/e2e/tests/story_021_ad_visibility_setting.spec.ts`

---

## Test Case: TC-021-E01 — Settings page has "Ad Preferences" section with show-ads-toggle

**Objective:** Verify that the Settings page renders the Ad Preferences section with the correct label and toggle control.

### Steps
1. Clear `localStorage` key `mi_show_ads`.
2. Navigate to `/settings`.
3. Wait for `networkidle`.
4. Assert `[data-testid="ad-preferences-section"]` is visible.
5. Assert `[data-testid="show-ads-label"]` contains the text "Show ad placeholders".
6. Assert `[data-testid="show-ads-toggle"]` is visible, has `type="checkbox"` and `role="switch"`.

### Test Data
- No transactions required.
- `localStorage['mi_show_ads']` removed (clean state).

### Expected Result
- The Ad Preferences section is visible on the Settings page.
- The label reads "Show ad placeholders".
- The toggle is a checkbox with `role="switch"`.

---

## Test Case: TC-021-E02 — Default state: no ad placeholders exist in the DOM at /dashboard

**Objective:** Verify that when no `mi_show_ads` preference is set (default = `false`), no `[data-testid="ad-placeholder"]` elements exist in the Dashboard DOM.

### Steps
1. Clear `localStorage` key `mi_show_ads`.
2. Navigate to `/dashboard`.
3. Wait for `networkidle`.
4. Count `[data-testid="ad-placeholder"]` elements.

### Test Data
- `localStorage['mi_show_ads']` removed (default state).

### Expected Result
- `[data-testid="ad-placeholder"]` count equals **0** — no ad containers in the DOM.

---

## Test Case: TC-021-E03 — Default state: no ad placeholders at /settings itself

**Objective:** Verify that the Settings page itself does not render any `AdPlaceholderComponent` instances when ads are hidden (default state).

### Steps
1. Clear `localStorage` key `mi_show_ads`.
2. Navigate to `/settings`.
3. Wait for `networkidle`.
4. Count `[data-testid="ad-placeholder"]` elements.

### Test Data
- `localStorage['mi_show_ads']` removed (default state).

### Expected Result
- `[data-testid="ad-placeholder"]` count equals **0**.

---

## Test Case: TC-021-E04 — Enabling ads via toggle makes placeholders appear on /dashboard

**Objective:** Verify that clicking the show-ads-toggle from OFF→ON state causes ad placeholders to appear on the Dashboard without requiring a full page reload.

### Steps
1. Clear `localStorage` key `mi_show_ads`.
2. Navigate to `/settings`.
3. Assert `[data-testid="show-ads-toggle"]` is **unchecked**.
4. Click `[data-testid="show-ads-toggle"]`.
5. Assert toggle is now **checked**.
6. Navigate to `/dashboard`.
7. Wait for `networkidle`.
8. Count `[data-testid="ad-placeholder"]` elements.

### Test Data
- `localStorage['mi_show_ads']` removed before test.

### Expected Result
- After enabling the toggle, navigating to `/dashboard` shows at least **1** `[data-testid="ad-placeholder"]` element in the DOM.

---

## Test Case: TC-021-E05 — Disabling ads via toggle removes placeholders from /dashboard

**Objective:** Verify that clicking the show-ads-toggle from ON→OFF state removes all ad placeholders from the Dashboard.

### Steps
1. Set `localStorage['mi_show_ads'] = "true"`.
2. Navigate to `/settings`.
3. Assert `[data-testid="show-ads-toggle"]` is **checked**.
4. Click `[data-testid="show-ads-toggle"]` to uncheck it.
5. Assert toggle is now **unchecked**.
6. Navigate to `/dashboard`.
7. Wait for `networkidle`.
8. Count `[data-testid="ad-placeholder"]` elements.

### Test Data
- `localStorage['mi_show_ads']` pre-set to `"true"` to simulate ads-enabled state.

### Expected Result
- After unchecking the toggle, navigating to `/dashboard` shows **0** `[data-testid="ad-placeholder"]` elements.

---

## Test Case: TC-021-E06 — Ad preference persists after page reload

**Objective:** Verify that the `mi_show_ads` preference is stored in `localStorage` (not `sessionStorage`) and survives a full page reload.

### Steps
1. Clear `localStorage` key `mi_show_ads`.
2. Navigate to `/settings`.
3. Assert toggle is **unchecked**.
4. Click the toggle to enable ads.
5. Assert toggle is **checked**.
6. Call `page.reload()`.
7. Wait for `networkidle`.
8. Assert `[data-testid="show-ads-toggle"]` is still **checked**.

### Test Data
- `localStorage['mi_show_ads']` removed before test.

### Expected Result
- After reloading `/settings`, the toggle reflects the previously-saved ON state (preference survived the reload).

---

## Test Case: TC-021-E07 — First-time visit: ads hidden by default

**Objective:** Verify that a user who has never visited the app (empty `localStorage`) sees no ad placeholders anywhere — confirming the default is `false`.

### Steps
1. Call `localStorage.clear()` to wipe all storage.
2. Navigate to `/dashboard`.
3. Wait for `networkidle`.
4. Count `[data-testid="ad-placeholder"]` elements.

### Test Data
- All `localStorage` cleared (simulates brand-new visitor with no stored preferences).

### Expected Result
- `[data-testid="ad-placeholder"]` count equals **0** — ads are hidden on first visit.

---

## Test Case: TC-021-E08 — Toggling ON shows ads on /transactions screen

**Objective:** Verify that the ad visibility setting applies to the Transactions Review screen and that enabling ads causes in-feed ad placeholders to appear there.

### Steps
1. Clear `localStorage` key `mi_show_ads`.
2. Navigate to `/` to bootstrap the app and initialise IndexedDB.
3. Seed IndexedDB `transactions` store with 5 transactions (each with `narration` field).
4. Navigate to `/settings`.
5. Assert `[data-testid="show-ads-toggle"]` is **unchecked**.
6. Click the toggle to enable ads.
7. Assert toggle is **checked**.
8. Navigate to `/transactions`.
9. Wait for `networkidle`; assert transactions table/list is rendered.
10. Count `[data-testid="ad-placeholder"]` elements.

### Test Data
Seeded transactions:
| ID | Date | Description | Narration | Amount | Type |
|---|---|---|---|---|---|
| tx-021-01 | 2025-03-01 | Salary March | NEFT CR - Salary March | 75000 | INCOME |
| tx-021-02 | 2025-03-05 | Grocery Big Basket | UPI BigBasket payment | 3200 | EXPENSE |
| tx-021-03 | 2025-03-10 | Rent March | NEFT Rent March 2025 | 15000 | EXPENSE |
| tx-021-04 | 2025-03-15 | SIP Mirae | AUTO DEBIT SIP Mirae Asset | 5000 | INVESTMENT |
| tx-021-05 | 2025-03-20 | Electricity BESCOM | BillPay BESCOM Electricity | 1800 | EXPENSE |

### Expected Result
- `[data-testid="ad-placeholder"]` count is greater than **0** on the Transactions screen.
- Test is skipped gracefully if Story 008/019 (Transactions screen) is not yet deployed.

---

## Coverage Summary

| Test ID | Type | Priority | Covers AC |
|---|---|---|---|
| TC-021-E01 | UI / structural | CRITICAL | AC #2 |
| TC-021-E02 | Functional | High | AC #4, #6 |
| TC-021-E03 | Functional | Medium | AC #4, #6 |
| TC-021-E04 | Functional | High | AC #3, #4, #5 |
| TC-021-E05 | Functional | High | AC #3, #4 |
| TC-021-E06 | Persistence | High | AC #7, #9 |
| TC-021-E07 | Default state | High | AC #6 |
| TC-021-E08 | Integration | Medium | AC #4, #5 |
