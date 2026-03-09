# Test Cases for Story 015: In-Feed Ad Placements in Transaction Review Screen

**Story Reference:** [story_015_In_Feed_Ads_Transactions_Screen.md](../stories/story_015_In_Feed_Ads_Transactions_Screen.md)  
**Date:** 2026-03-09  
**Author:** QA Automation Engineer  
**Sprint:** 3

---

## Unit Tests (Angular / TypeScript)

---

### TC-015-001

| Field | Value |
|---|---|
| **TC ID** | TC-015-001 |
| **Type** | Unit |
| **Title** | `pagedTransactions.length === PAGE_SIZE` evaluates to `true` when exactly 20 rows are on the page |

**Preconditions:**
- `TransactionsListComponent` (or its underlying service) uses `PAGE_SIZE = 20`.
- 25 mock transactions are loaded (page 1 = 20 rows, page 2 = 5 rows).

**Steps:**
1. Set the component's current page to 1.
2. Call the `pagedTransactions` getter.
3. Assert `pagedTransactions.length === 20`.
4. Assert the in-feed ad show condition (`pagedTransactions.length === PAGE_SIZE`) is `true`.

**Expected Result:**
- Condition evaluates to `true` on page 1 (full page).

**AC Reference:** AC1, C1

---

### TC-015-002

| Field | Value |
|---|---|
| **TC ID** | TC-015-002 |
| **Type** | Unit |
| **Title** | In-feed ad condition is `false` on partial last page (< 20 rows) |

**Preconditions:**
- 25 mock transactions loaded; current page is 2.

**Steps:**
1. Set component's current page to 2.
2. Call `pagedTransactions` getter.
3. Assert `pagedTransactions.length === 5`.
4. Assert `pagedTransactions.length === PAGE_SIZE` is `false`.

**Expected Result:**
- Condition evaluates to `false` on page 2 (partial page).

**AC Reference:** AC5, C1

---

### TC-015-003

| Field | Value |
|---|---|
| **TC ID** | TC-015-003 |
| **Type** | Unit |
| **Title** | In-feed ad condition is `false` when fewer than 20 transactions exist in total |

**Preconditions:**
- Only 19 mock transactions loaded.

**Steps:**
1. Load 19 transactions.
2. Set current page to 1.
3. Assert `pagedTransactions.length` = 19.
4. Assert `pagedTransactions.length === PAGE_SIZE` is `false`.

**Expected Result:**
- In-feed ad is not shown for 19 transactions.

**AC Reference:** AC5

---

### TC-015-004

| Field | Value |
|---|---|
| **TC ID** | TC-015-004 |
| **Type** | Unit |
| **Title** | `transaction-count` reflects data rows only (not inflated by ad presence) |

**Preconditions:**
- `TransactionsListComponent` with 25 mock transactions.

**Steps:**
1. Read the value of the component property or template binding that feeds `[data-testid="transaction-count"]`.
2. Compare with total transaction count.

**Expected Result:**
- The count matches `25` (total data rows), not `26` (which would incorrectly include the ad row).

**AC Reference:** AC4, C7

---

## Component Tests (Angular TestBed)

---

### TC-015-005

| Field | Value |
|---|---|
| **TC ID** | TC-015-005 |
| **Type** | Component |
| **Title** | `ad-row` is present in in `[data-testid="transactions-table"]` when page has exactly 20 rows (desktop) |

**Preconditions:**
- `TransactionsListComponent` created in TestBed with 25 mock transactions.
- Viewport width = 1280 px (desktop).

**Steps:**
1. Render the component.
2. Navigate to page 1.
3. Trigger change detection.
4. Query `[data-testid="ad-row"]` within `[data-testid="transactions-table"]`.

**Expected Result:**
- `[data-testid="ad-row"]` exists in the DOM.
- It contains an `<app-ad-placeholder>` element.

**AC Reference:** AC1, AC3

---

### TC-015-006

| Field | Value |
|---|---|
| **TC ID** | TC-015-006 |
| **Type** | Component |
| **Title** | `ad-row` is NOT present on a partial page (page 2 with 5 rows) |

**Preconditions:**
- `TransactionsListComponent` in TestBed with 25 mock transactions.
- Navigate to page 2.

**Steps:**
1. Render the component and navigate to page 2.
2. Trigger change detection.
3. Query `[data-testid="ad-row"]` within `[data-testid="transactions-table"]`.

**Expected Result:**
- `[data-testid="ad-row"]` does NOT exist in the DOM on page 2.

**AC Reference:** AC5, C1

---

### TC-015-007

| Field | Value |
|---|---|
| **TC ID** | TC-015-007 |
| **Type** | Component |
| **Title** | `ad-row` contains `<app-ad-placeholder>` with `format="native"` and `placement="transactions-in-feed"` |

**Preconditions:**
- `TransactionsListComponent` in TestBed with 20+ mock transactions; page 1 rendered.

**Steps:**
1. Render page 1.
2. Query `[data-testid="ad-row"] app-ad-placeholder`.
3. Inspect `format` and `placement` input attributes.

**Expected Result:**
- `format` = `"native"`.
- `placement` = `"transactions-in-feed"`.

**AC Reference:** AC3

---

### TC-015-008

| Field | Value |
|---|---|
| **TC ID** | TC-015-008 |
| **Type** | Component |
| **Title** | `ad-row` `<td>` uses `colspan="5"` to span all table columns |

**Preconditions:**
- `TransactionsListComponent` in TestBed; desktop layout; 20+ transactions.

**Steps:**
1. Render page 1 desktop layout.
2. Query `[data-testid="ad-row"] td`.
3. Inspect `colspan` attribute.

**Expected Result:**
- `colspan` = `"5"`.

**AC Reference:** C3

---

### TC-015-009

| Field | Value |
|---|---|
| **TC ID** | TC-015-009 |
| **Type** | Component |
| **Title** | `ad-sponsored-label` element contains text "Sponsored" |

**Preconditions:**
- `TransactionsListComponent` in TestBed; 20+ transactions; page 1 rendered.

**Steps:**
1. Render page 1.
2. Query `[data-testid="ad-sponsored-label"]`.
3. Read text content.

**Expected Result:**
- Text content equals `"Sponsored"`.

**AC Reference:** AC6, C8

---

### TC-015-010

| Field | Value |
|---|---|
| **TC ID** | TC-015-010 |
| **Type** | Component |
| **Title** | Mobile layout renders `ad-card` after last transaction card on a full page |

**Preconditions:**
- `TransactionsListComponent` in TestBed; viewport emulated at 375 px; 20+ mock transactions; page 1.

**Steps:**
1. Render the component in mobile viewport.
2. Trigger change detection.
3. Query `[data-testid="ad-card"]`.

**Expected Result:**
- `[data-testid="ad-card"]` exists in the DOM.
- It appears after the last `[data-testid="transaction-card"]` element in the DOM order.

**AC Reference:** AC2, C6

---

### TC-015-011

| Field | Value |
|---|---|
| **TC ID** | TC-015-011 |
| **Type** | Component |
| **Title** | No ad-card shown on mobile when page has fewer than 20 rows |

**Preconditions:**
- 19 mock transactions loaded; viewport at 375 px.

**Steps:**
1. Render the component in mobile viewport.
2. Query `[data-testid="ad-card"]`.

**Expected Result:**
- `[data-testid="ad-card"]` does NOT exist in the DOM.

**AC Reference:** AC5

---

## E2E Tests (Playwright)

**Base URL:** `http://localhost:4200`

---

### TC-015-012

| Field | Value |
|---|---|
| **TC ID** | TC-015-012 |
| **Type** | E2E |
| **Title** | Upload 25 transactions → page 1 shows `ad-row`; page 2 does NOT show `ad-row` |

**Preconditions:**
- A fixture with exactly 25 transactions is available (CSV or Excel format, any supported parser).
- App running at `http://localhost:4200`.

**Steps:**
1. Upload the 25-transaction fixture file.
2. Navigate to `/transactions`.
3. Assert page 1: `await expect(page.locator('[data-testid="ad-row"]')).toBeVisible()`.
4. Click "Next Page" to go to page 2.
5. Assert page 2: `await expect(page.locator('[data-testid="ad-row"]')).not.toBeVisible()`.

**Expected Result:**
- Page 1 (20 data rows): `ad-row` IS present.
- Page 2 (5 data rows): `ad-row` is NOT present.

**AC Reference:** AC1, AC5, C1

---

### TC-015-013

| Field | Value |
|---|---|
| **TC ID** | TC-015-013 |
| **Type** | E2E |
| **Title** | Upload 19 transactions → no `ad-row` is shown |

**Preconditions:**
- A fixture with exactly 19 transactions is available.

**Steps:**
1. Upload the 19-transaction fixture.
2. Navigate to `/transactions`.
3. Query `[data-testid="ad-row"]`.

**Expected Result:**
- `[data-testid="ad-row"]` is NOT present in the DOM.

**AC Reference:** AC5

---

### TC-015-014

| Field | Value |
|---|---|
| **TC ID** | TC-015-014 |
| **Type** | E2E |
| **Title** | `ad-sponsored-label` text is "Sponsored" on a full page |

**Preconditions:**
- 20+ transactions loaded; page 1 is full.

**Steps:**
1. Navigate to `/transactions` page 1.
2. `await expect(page.locator('[data-testid="ad-sponsored-label"]')).toHaveText('Sponsored')`.

**Expected Result:**
- The text of `[data-testid="ad-sponsored-label"]` is exactly `"Sponsored"`.

**AC Reference:** AC6

---

### TC-015-015

| Field | Value |
|---|---|
| **TC ID** | TC-015-015 |
| **Type** | E2E |
| **Title** | `transaction-count` shows 20 (not 21) when a full page has an in-feed ad |

**Preconditions:**
- Exactly 20 transactions loaded (1 full page).

**Steps:**
1. Navigate to `/transactions`.
2. Read `[data-testid="transaction-count"]` text.

**Expected Result:**
- `[data-testid="transaction-count"]` text = `"20"` (or contains `"20"`) — the ad row does NOT inflate the count.

**AC Reference:** AC4, C7

---
