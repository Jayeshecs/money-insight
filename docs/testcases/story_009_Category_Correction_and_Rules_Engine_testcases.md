# Test Cases: Category Correction and Rules Engine

**Story Reference:** [story_009_Category_Correction_and_Rules_Engine.md](../stories/story_009_Category_Correction_and_Rules_Engine.md)  
**Date:** 2026-03-01  
**Author:** QA Tester  
**Total Test Cases:** 11

> **Technical Notes:**
> - Toast auto-dismiss tests use `fakeAsync` + `tick(3000)`.
> - Rule model fields: `patternType: 'CONTAINS'`, `source: 'USER_FEEDBACK'` per PO clarification.
> - The 10 hardcoded categories for Sprint 2: `Food`, `Rent`, `Travel`, `Shopping`, `Entertainment`, `Investment`, `Income`, `Transfer`, `Insurance`, `Other`.

---

## Unit Tests

---

### TC-009-01: Each transaction row has txn-category-select dropdown with all 10 categories

**Type:** Unit  
**Priority:** High  
**Preconditions:** `TransactionsListComponent` is instantiated in `TestBed` with a stub returning 1 transaction.

**Steps:**
1. Instantiate `TransactionsListComponent` in `TestBed`.
2. Call `fixture.detectChanges()`.
3. Query `[data-testid="txn-category-select"]` within the first `[data-testid="transaction-row"]`.
4. Read all `<option>` elements inside the select.

**Expected Result:** The `[data-testid="txn-category-select"]` element exists. It contains exactly 10 options with values: `Food`, `Rent`, `Travel`, `Shopping`, `Entertainment`, `Investment`, `Income`, `Transfer`, `Insurance`, `Other`.

**data-testid(s):** `txn-category-select`, `transaction-row`

---

### TC-009-02: Selecting different category updates IndexedDB immediately

**Type:** Unit  
**Priority:** High  
**Preconditions:** `TransactionsListComponent` instantiated with 1 transaction (`category: 'Food'`). `IndexedDbService` is mocked with a `updateTransaction` spy.

**Steps:**
1. Instantiate `TransactionsListComponent` in `TestBed` with `IndexedDbService` spy.
2. Call `fixture.detectChanges()`.
3. Change `[data-testid="txn-category-select"]` value to `"Travel"` and dispatch a `change` event.
4. Call `fixture.detectChanges()`.
5. Assert `IndexedDbService.updateTransaction` spy was called once with the updated `category: 'Travel'`.

**Expected Result:** `IndexedDbService.updateTransaction` is called exactly once with the transaction's `id` and the updated `category` field set to `"Travel"`.

**data-testid(s):** `txn-category-select`

---

### TC-009-03: UI reflects new category without page reload

**Type:** Unit  
**Priority:** High  
**Preconditions:** Same as TC-009-02 with `IndexedDbService` spy that resolves successfully.

**Steps:**
1. Instantiate `TransactionsListComponent` in `TestBed`.
2. Call `fixture.detectChanges()`.
3. Change `[data-testid="txn-category-select"]` to `"Travel"` and dispatch change.
4. Call `fixture.detectChanges()`.
5. Read the current value of `[data-testid="txn-category-select"]` and `[data-testid="txn-category"]`.

**Expected Result:** The `txn-category-select` selected value is `"Travel"`. The `txn-category` display element (if present) also shows `"Travel"`. No page reload or route navigation occurs.

**data-testid(s):** `txn-category-select`, `txn-category`

---

### TC-009-04: Rule created in IndexedDB — patternType CONTAINS, source USER_FEEDBACK

**Type:** Unit  
**Priority:** High  
**Preconditions:** `RulesService` is instantiated with an `IndexedDbService` spy. Transaction narration is `"Swiggy Food Delivery INR 250"`.

**Steps:**
1. Call `RulesService.saveRule('Swiggy Food Delivery', 'Food')`.
2. Assert `IndexedDbService.putRule` (or `saveRule`) spy was called with a `Rule` object.
3. Inspect the saved `Rule` object's fields.

**Expected Result:** The saved `Rule` object has:
- `patternType: 'CONTAINS'`
- `pattern`: first 3 words of narration = `"Swiggy Food Delivery"` (or equivalent keyword extracted)
- `category: 'Food'`
- `source: 'USER_FEEDBACK'`
- `active: true`
- `feedback: true`

**data-testid(s):** *(service-level unit test — no DOM)*

---

### TC-009-05: Saving same keyword again upserts (no duplicate rule)

**Type:** Unit  
**Priority:** High  
**Preconditions:** `RulesService` has an existing rule with `pattern: 'Swiggy Food Delivery'`, `category: 'Food'`.

**Steps:**
1. Call `RulesService.saveRule('Swiggy Food Delivery', 'Travel')` (new category for the same keyword).
2. Call `RulesService.getRules()`.
3. Count rules with `pattern: 'Swiggy Food Delivery'`.

**Expected Result:** Exactly 1 rule exists with `pattern: 'Swiggy Food Delivery'`. Its `category` is updated to `'Travel'`. No duplicate rule is inserted.

**data-testid(s):** *(service-level unit test — no DOM)*

---

### TC-009-06: category-saved-toast appears for 3 seconds then auto-dismisses

**Type:** Unit  
**Priority:** High  
**Preconditions:** `TransactionsListComponent` instantiated in `TestBed`; `fakeAsync` zone active; `ToastComponent` integrated.

**Steps:**
1. Wrap test in `fakeAsync`.
2. Instantiate `TransactionsListComponent` in `TestBed`.
3. Call `fixture.detectChanges()`.
4. Trigger a category change via `[data-testid="txn-category-select"]`.
5. Call `fixture.detectChanges()`.
6. Assert `[data-testid="category-saved-toast"]` is visible.
7. Call `tick(3000)`.
8. Call `fixture.detectChanges()`.
9. Assert `[data-testid="category-saved-toast"]` is no longer visible (or removed from DOM).

**Expected Result:** Toast appears immediately on save and is automatically removed from the DOM after exactly 3000 ms.

**data-testid(s):** `category-saved-toast`

---

### TC-009-07: Toast reappears on each save (including upserts)

**Type:** Unit  
**Priority:** Medium  
**Preconditions:** Same as TC-009-06.

**Steps:**
1. Wrap test in `fakeAsync`.
2. Trigger first category change; assert toast visible; `tick(3000)`; assert toast dismissed.
3. Trigger a second category change on the same or a different transaction.
4. Call `fixture.detectChanges()`.
5. Assert `[data-testid="category-saved-toast"]` is visible again.

**Expected Result:** Toast appears a second time after the second save. It is not skipped because the same keyword was saved (upsert path). Toast lifetime resets to 3 seconds on each occurrence.

**data-testid(s):** `category-saved-toast`

---

### TC-009-09: Retroactive — changing category does NOT re-categorize other stored transactions

**Type:** Unit  
**Priority:** High  
**Preconditions:** `IndexedDbService` stub contains 3 transactions all with narration starting with `"Swiggy"`.

**Steps:**
1. Instantiate `TransactionsListComponent` in `TestBed` with 3 Swiggy transactions all categorized as `"Food"`.
2. Change category for only the first transaction to `"Travel"`.
3. Call `fixture.detectChanges()`.
4. Assert `IndexedDbService.updateTransaction` was called exactly once (for the first transaction).
5. Read the `category` of the second and third transactions from the stub.

**Expected Result:** Only the first transaction is updated in IndexedDB. The second and third transactions retain `category: 'Food'`. `updateTransaction` is called exactly once.

**data-testid(s):** `txn-category-select`

---

### TC-009-10: New import — rules applied before saving to IndexedDB

**Type:** Unit  
**Priority:** High  
**Preconditions:** `RulesService` has a rule `{ pattern: 'Swiggy', patternType: 'CONTAINS', category: 'Food', source: 'USER_FEEDBACK', active: true }`. A new batch of 3 transactions is parsed, one of which has narration `"Swiggy Instamart 350"`.

**Steps:**
1. Call `RulesService.applyRulesToTransactions(batch)` where batch contains the 3 transactions.
2. Inspect the returned transactions array.

**Expected Result:** The transaction with narration `"Swiggy Instamart 350"` has its `category` set to `"Food"` (matched by the CONTAINS rule). The other 2 transactions retain their original AI-assigned categories. `applyRulesToTransactions` returns the full 3-transaction array.

**data-testid(s):** *(service-level unit test — no DOM)*

---

### TC-009-11: All 10 hardcoded categories appear in dropdown

**Type:** Unit  
**Priority:** High  
**Preconditions:** `TransactionsListComponent` instantiated in `TestBed` with 1 transaction.

**Steps:**
1. Instantiate `TransactionsListComponent` in `TestBed`.
2. Call `fixture.detectChanges()`.
3. Query all `<option>` text content inside `[data-testid="txn-category-select"]`.
4. Compare against expected list.

**Expected Result:** Options contain exactly these 10 values (order may vary): `Food`, `Rent`, `Travel`, `Shopping`, `Entertainment`, `Investment`, `Income`, `Transfer`, `Insurance`, `Other`. No additional or missing options.

**data-testid(s):** `txn-category-select`

---

## Component Tests

---

### TC-009-08: Dashboard category breakdown chart updates after category change

**Type:** Component  
**Priority:** Medium  
**Preconditions:** `DashboardComponent` and `TransactionsListComponent` are both rendered; `DashboardStateService` is a shared service instance (not stub). 1 transaction currently in `'Food'` category.

**Steps:**
1. Render both components in `TestBed` sharing a real `DashboardStateService`.
2. Read initial `[data-testid="category-breakdown-chart"]` dataset (Food slice value).
3. Change the transaction's category from `"Food"` to `"Travel"` via `[data-testid="txn-category-select"]`.
4. Call `fixture.detectChanges()`.
5. Read the updated chart dataset.

**Expected Result:** `DashboardStateService` recomputes its `categoryBreakdown` signal. The `category-breakdown-chart` updates — Food slice decreases (or disappears) and Travel slice increases without a page reload.

**data-testid(s):** `txn-category-select`, `category-breakdown-chart`

---

## Summary Table

| TC | Description | Type | Priority |
|----|-------------|------|----------|
| TC-009-01 | Each transaction row has txn-category-select with all 10 categories | Unit | High |
| TC-009-02 | Selecting different category updates IndexedDB immediately | Unit | High |
| TC-009-03 | UI reflects new category without page reload | Unit | High |
| TC-009-04 | Rule created: patternType CONTAINS, source USER_FEEDBACK | Unit | High |
| TC-009-05 | Saving same keyword upserts (no duplicate rule) | Unit | High |
| TC-009-06 | category-saved-toast appears for 3 seconds then auto-dismisses | Unit | High |
| TC-009-07 | Toast reappears on each save (including upserts) | Unit | Medium |
| TC-009-08 | Dashboard category breakdown chart updates after category change | Component | Medium |
| TC-009-09 | Retroactive: changing category does NOT re-categorize other stored transactions | Unit | High |
| TC-009-10 | New import: rules applied before saving to IndexedDB | Unit | High |
| TC-009-11 | All 10 hardcoded categories appear in dropdown | Unit | High |
