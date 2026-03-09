## Story: Sync & Train — ML Feedback Loop

**Status:** To Do

**As a** user who has corrected AI-assigned transaction categories  
**I want** a "Sync & Train" action that pushes my corrections to Google Sheets and re-applies updated rules to all transactions  
**So that** the categorisation improves over time and my data is fully persisted

### Background
Sprint 2 delivered per-transaction category editing (`story_009`) and rule persistence in IndexedDB. The rules are now applied to new imports but never pushed to the Google Sheets **Rules tab** and are not retroactively applied to existing stored transactions. This story closes the ML feedback loop: rules sync to Sheets, and a "Re-apply rules" pass updates any existing transactions whose category is still AI-assigned.

### Scenarios
- User has corrected several transaction categories; corrections are in IndexedDB
- User taps "Sync & Train" — rules are written to the Google Sheets Rules tab
- After sync, un-corrected AI transactions are re-categorised by the updated rules
- Sync & Train status (progress / success / error) is shown in the UI
- User who is not authenticated sees an auth-error prompt instead of syncing
- Sync & Train FAB is visible on mobile; inline button is visible on desktop

### Acceptance Criteria
1. A `[data-testid="sync-train-btn"]` element is present on the Dashboard (desktop: header area; mobile: FAB bottom-right).
2. Clicking `[data-testid="sync-train-btn"]` when the user is authenticated triggers:
   a. Write all active rules from IndexedDB to the Google Sheets **Rules tab** (upsert by pattern).
   b. Re-apply the full rule set to **all** existing IndexedDB transactions whose `source` is NOT `'USER_FEEDBACK'` (i.e., AI-assigned categories only).
   c. Write updated transactions back to IndexedDB.
   d. Trigger a `DashboardStateService.reload()` so widgets refresh.
3. During sync, `[data-testid="sync-train-status"]` shows a loading/progress indicator.
4. On success, `[data-testid="sync-train-status"]` shows "Sync complete ✓" and auto-dismisses after 3 s.
5. On Google Sheets API failure, `[data-testid="sync-train-status"]` shows an error message; no partial writes remain.
6. If the user is not authenticated, clicking `[data-testid="sync-train-btn"]` shows the existing `[data-testid="auth-error"]` prompt (re-use Sprint 1 Story 004 pattern).
7. On mobile (≤ 767 px), the FAB is positioned `fixed` bottom-right, above the bottom-nav bar, with a minimum tap target of 44 × 44 px.
8. Rules tab column layout in Google Sheets: `Pattern | PatternType | Category | Source | Active | UpdatedAt`.
9. Existing Sprint 1 Story 004 sync tests must continue to pass (no regression).

### Technical Notes
- New service method: `GoogleSheetsService.syncRules(rules: Rule[]): Promise<void>` — writes to the **Rules** named range / sheet.
- New method on `RulesService`: `reApplyRulesToAllTransactions(): Promise<number>` — loads all IDB transactions, applies `applyRulesToTransactions()`, writes back changed records only, returns count updated.
- Coordinate with `DashboardStateService.reload()` (already exists from Sprint 2) to refresh widgets post-sync.
- FAB component: reusable `FabButtonComponent` at `shared/components/fab-button/`.
- Status display: extend existing `ToastService` (Story 009) with a `persistent` mode that does not auto-dismiss until resolved, then auto-dismiss success after 3 s.
- Mobile FAB z-index must be above bottom-nav but below modals.

### PO Clarifications (2025-06-XX — post agent pre-analysis)

**C1 — Service name correction:**
The correct service class name is **`SheetsService`** (at `src/client/src/app/core/services/sheets.service.ts`), NOT `GoogleSheetsService`. All references in Technical Notes and implementation must use `SheetsService`. The new method to add is `SheetsService.syncRules(rules: Rule[]): Promise<void>`.

**C2 — Rules tab column schema (BREAKING CORRECTION to AC8):**
**Discard** the 6-column schema in AC8. Use the **existing 10-column schema** already implemented in `SheetsService.initializeHeaders()`:  
`ID | PatternType | Pattern | Category | SubCategory | Priority | Active | Source | CreatedAt | LastModified`  
The `syncRules()` method must write all 10 columns, populating `LastModified` with the current ISO timestamp and leaving `SubCategory` empty if not present on the rule.

**C3 — Sync strategy: clear-and-rewrite:**
Use a **clear-and-rewrite** strategy: clear the entire Rules tab (except header row), then append all active rules as new rows. Do NOT attempt row-by-row batchUpdate or upsert-by-pattern — this avoids merge conflicts and keeps the implementation simple.

**C4 — "AI-assigned" transactions definition:**
"AI-assigned" means transactions where `source !== 'USER_FEEDBACK'`. The `re-apply` pass in `reApplyRulesToAllTransactions()` must load ALL IDB transactions, apply the current rule set, and write back only the records where `source !== 'USER_FEEDBACK'`. Transactions manually corrected by the user (`source === 'USER_FEEDBACK'`) must **never** be overwritten by re-apply.

**C5 — Re-applied transactions: no Sheets re-sync:**
After re-applying rules, the updated transactions are written back to IndexedDB only. Their `synced` flag is NOT changed to `false` — do NOT trigger a secondary Sheets sync for re-applied categories. Reason: the category re-assignment is deterministic and can be re-derived from rules; double-syncing risks duplicating rows.

**C6 — Button disabled during sync:**
`[data-testid="sync-train-btn"]` must have `[disabled]="syncing()"` (or Angular `[attr.disabled]`) during the sync operation. The button must also be non-interactive during debounce (protect against rapid taps on mobile FAB). A simple `syncing = signal(false)` guard is sufficient — no external debounce library needed.

**C7 — Desktop button: NOT a FAB:**
On desktop (≥ 768 px), the Sync & Train trigger is a **plain `<button class="btn-primary">`** placed in the Dashboard component's header area — NOT an `<app-fab-button>`. The `FabButtonComponent` is mobile-only (< 768 px). Both elements share `[data-testid="sync-train-btn"]`.

**C8 — 0 active rules edge case:**
If there are no active rules in IndexedDB, skip the Google Sheets API call entirely and show a `[data-testid="sync-train-status"]` toast with text "Nothing to sync — no active rules." Do not count this as an error.

**C9 — 0 transactions updated edge case:**
If re-apply completes with 0 transactions updated (all transactions are already correctly categorised), show `[data-testid="sync-train-status"]` with text "Sync complete ✓ (0 updated)". This is a success state, not an error.

**C10 — `DashboardStateService.reload()` scope:**
After a successful sync+re-apply, call `DashboardStateService.reload()` once to trigger recomputation of all signals. The `filteredTransactions` computed signal will pick up the updated categories from IDB automatically.

**C11 — Toast persistence:**
The sync status toast should **not** auto-dismiss during the in-progress state. On success, it auto-dismisses after 3 s (as specified). On error, it does NOT auto-dismiss — the user must tap to dismiss.
