## Story: Sync Transactions to Google Sheets

**As a** user  
**I want** my transactions to be synced from IndexedDB to my Google Sheets  
**So that** I have a persistent, cloud-based backup

### Scenarios
- Background service syncs IndexedDB changes to Google Sheets
- User is notified of sync status and errors

### Acceptance Criteria
- Transactions are written to the correct tab in the user’s Google Sheet
- Sync failures are queued and retried; user is notified of issues
