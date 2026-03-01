## Story: Category Correction and Rules Engine

**Status:** ✅ QA Verified — All E2E Tests Passing (2026-03-01)

**As a** user  
**I want** to correct the AI-assigned category for any transaction and have that rule remembered  
**So that** similar transactions are categorized correctly in the future

### Scenarios
- User sees a transaction with wrong category on the Transactions screen
- User changes the category via a dropdown on the transaction row
- The category change is saved to IndexedDB immediately
- The correction creates/updates a rule ("narration keyword → category") in the Rules store
- The rule is synced to the Google Sheets "Rules" tab on the next sync cycle
- When new transactions are parsed, existing rules are applied before AI categorization
- User can see a "Rules" count somewhere (optional: a Rules management view, but not required in Sprint 2)

### Acceptance Criteria
- Each transaction row has `[data-testid="txn-category-select"]` — a dropdown with all available categories
- Selecting a different category immediately updates the transaction's category in IndexedDB
- The updated category is reflected in the UI without page reload
- A rule is created in IndexedDB `rules` store: `{ narration_keyword: <first 3 words of narration>, category: <selected>, source: 'user' }`
- `[data-testid="category-saved-toast"]` toast message appears for 3 seconds: "Category saved"
- On next Google Sheets sync, the Rules tab is updated with the new/updated rule
- The `DashboardStateService` recomputes the dashboard summary when a category changes (category breakdown chart updates)
- Available categories are: Food, Rent, Travel, Shopping, Entertainment, Investment, Income, Transfer, Insurance, Other

### Technical Notes
- Add `rules` object store to IndexedDB schema (if not already present from Sprint 1 schema)
- `RulesService` (new): `saveRule(keyword, category)`, `getRules()`, `applyRulesToTransactions(txns)`
- When `ImportComponent` processes a new file, call `RulesService.applyRulesToTransactions(batch.transactions)` before saving to IndexedDB
- Google Sheets sync for Rules tab: each rule as a row `[keyword, category, created_date, source]`
- Component changes: `TransactionsListComponent` — add editable category dropdown per row
- Install `@angular/cdk` before implementing toast

### PO Clarifications (2026-03-01)

**Q: Rule schema conflict — story says `source: 'user'` but existing `RuleSource` type is `'USER_CREATED' | 'USER_FEEDBACK' | 'SYSTEM'`?**  
→ Use the **existing** `Rule` model. Map story intent as follows:  
  - `patternType: 'CONTAINS'` (keyword match)  
  - `source: 'USER_FEEDBACK'` (user corrected an AI prediction)  
  - Upsert: if a rule with the same keyword already exists, **update** its category; do not insert a duplicate.

**Q: Available categories — hardcoded or dynamic?**  
→ **Hardcoded enum** for Sprint 2: `Food, Rent, Travel, Shopping, Entertainment, Investment, Income, Transfer, Insurance, Other`. Extensible/user-managed in Sprint 3.

**Q: Retroactive rule application — does saving a rule re-categorize past transactions?**  
→ **No.** Rules apply only to **new imports** going forward. Existing stored transactions are not modified (except the one the user directly edited).

**Q: Toast implementation — which library?**  
→ Custom minimal `ToastComponent` using **`@angular/cdk` Overlay** service. No Angular Material dependency.

**Q: Toast auto-dismiss timer in tests?**  
→ Tester to use `fakeAsync` + `tick(3000)` for the 3-second dismiss in unit tests. E2E tests may use `waitForSelector` with `{ state: 'hidden' }` after a delay.

**Q: Dismiss behavior if same rule is saved again?**  
→ Toast reappears each time a save occurs (including upserts).
