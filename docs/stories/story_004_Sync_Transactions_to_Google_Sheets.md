## Story: Sync Transactions to Google Sheets

**Status:** ✅ QA Verified — All Tests Passing  
**Sprint:** Sprint 1  
**Last Updated:** 2026-02-28

**As a** user  
**I want** my transactions to be synced from IndexedDB to my Google Sheets  
**So that** I have a persistent, cloud-based backup

### Scenarios
- Background service syncs IndexedDB changes to Google Sheets
- User is notified of sync status and errors

### Acceptance Criteria
- Transactions are written to the correct tab in the user's Google Sheet
- Sync failures are queued and retried; user is notified of issues

### Implementation Summary
| Component | File | Notes |
|-----------|------|-------|
| Auth (PKCE) | `auth.service.ts` | OAuth 2.0 PKCE — no backend proxy; direct Google token exchange |
| Sheets API | `sheets.service.ts` | Append transactions in batches of 500 rows; idempotency via `synced` flag |
| Sync orchestration | `sync.service.ts` | Batch TRANSACTION entries per queue flush; exponential backoff (3 retries: 1s/5s/15s) |
| Sync UI | `sync-status/sync-status.component.ts` | States: idle/syncing/success/failed/queued/auth_error; auto-dismiss on success |
| Connectivity | `connectivity.service.ts` | Offline detection; auto-retry on reconnect via `pairwise()` |
| Unit tests | `*.spec.ts` | 73/73 passing |
| E2E tests | `tests/e2e/tests/story_004.spec.ts` | 8/8 passing (TC9 skipped — requires live Google account) |
