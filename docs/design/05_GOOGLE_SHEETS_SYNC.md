# MoneyInsight Google Sheets Sync & Integration Design

## 1. Google OAuth & API Integration

### 1.1 Authentication Flow

**OAuth 2.0 Authorization Code Flow:**

```
1. User clicks "Login with Google"
   ↓
2. [Angular] Redirects to Google OAuth consent screen
   ├─ Client ID: <moneyinsight-app-id>
   ├─ Scopes: https://www.googleapis.com/auth/drive.file
   ├─ Redirect URI: https://moneyinsight.app/callback
   └─ State: Random token (CSRF protection)
   ↓
3. User grants permission
   ↓
4. Google redirects to callback with authorization code
   ↓
5. [Angular] Exchanges code for tokens
   ├─ Access Token (expires in 1 hour)
   ├─ Refresh Token (long-lived)
   └─ Token stored in secure storage
   ↓
6. [Angular] Fetches user info (email, name)
   ↓
7. App creates dedicated Google Sheet (if first login)
   ↓
8. [Angular] Stores Sheet ID in IndexedDB settings
   ↓
9. User redirected to Dashboard
```

**Angular Service Implementation:**

```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly googleClientId = environment.googleClientId;
  private authToken$ = new BehaviorSubject<string | null>(null);
  
  constructor(private http: HttpClient) {}
  
  async initiateLogin(): Promise<void> {
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?
      client_id=${this.googleClientId}
      &redirect_uri=${window.location.origin}/callback
      &response_type=code
      &scope=https://www.googleapis.com/auth/drive.file
      &access_type=offline`;
    
    window.location.href = authUrl;
  }
  
  async handleCallback(code: string): Promise<void> {
    // Exchange code for tokens
    const tokens = await this.http.post<any>('/api/auth/token', { code }).toPromise();
    
    // Store tokens (in secure storage, not localStorage)
    await this.storeTokens(tokens);
    
    // Verify sheet exists
    await this.ensureSheetExists();
    
    this.authToken$.next(tokens.access_token);
  }
  
  getAuthToken(): Observable<string | null> {
    return this.authToken$.asObservable();
  }
}
```

### 1.2 Scopes & Permissions

**Requested Scope:**
- `https://www.googleapis.com/auth/drive.file`
  - Allows: Create, read, update files in Google Drive created by this app
  - Prevents: Access to user's existing files (privacy-first)

**Why `drive.file` only:**
- Minimal permission principle
- Cannot access other user files
- Can create and manage dedicated MoneyInsight sheet
- Clear security boundary for users

---

## 2. Google Sheets API Integration

### 2.1 Sheet Initialization

**On First Login:**

```typescript
@Injectable({ providedIn: 'root' })
export class SheetsService {
  constructor(private http: HttpClient, private auth: AuthService) {}
  
  async createSheet(): Promise<string> {
    const token = await this.auth.getToken();
    
    const response = await this.http.post<any>(
      'https://sheets.googleapis.com/v4/spreadsheets',
      {
        properties: {
          title: 'MoneyInsight - Personal Finance Dashboard'
        },
        sheets: [
          { properties: { title: 'Transactions' } },
          { properties: { title: 'Rules' } },
          { properties: { title: 'Dashboard_Data' } },
          { properties: { title: 'Models' } }
        ]
      },
      { headers: { Authorization: `Bearer ${token}` } }
    ).toPromise();
    
    const sheetId = response.spreadsheetId;
    
    // Initialize headers for each sheet
    await this.initializeHeaders(sheetId, token);
    
    // Store sheet ID
    await this.db.settings.put({
      key: 'googleSheetId',
      value: sheetId,
      type: 'STRING'
    });
    
    return sheetId;
  }
  
  private async initializeHeaders(sheetId: string, token: string): Promise<void> {
    // Add frozen headers and formatting
    await this.http.post(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate`,
      {
        requests: [
          {
            updateSheetProperties: {
              fields: 'gridProperties.frozenRowCount',
              properties: {
                sheetId: 0,  // Transactions sheet
                gridProperties: { frozenRowCount: 1 }
              }
            }
          }
          // Similar for other sheets...
        ]
      },
      { headers: { Authorization: `Bearer ${token}` } }
    ).toPromise();
  }
}
```

### 2.2 Data Sync Operations

**Operation Types:**

| Operation | Direction | Trigger | Frequency |
|-----------|-----------|---------|-----------|
| Append Transactions | IDB → Sheets | **Automatic** — fires post-import once IDB write completes | Per import |
| Manual Retry | IDB → Sheets | User clicks "Retry Sync" button (shown only on FAILED/QUEUED state) | On-demand |
| Append Rules | IDB → Sheets | After user feedback | On-demand (future story) |
| Update Dashboard_Data | IDB → Sheets | After transactions sync | On-demand (Story 5 scope) |
| Fetch Dashboard Data | Sheets → IDB | On app load | Periodic (every 5 min) |
| Fetch Rules | Sheets → IDB | On app load | On-demand |

#### 2.2.1 Append Transactions

**Architectural Decisions:**
- **Idempotency:** Only records where `synced === false` in IndexedDB are pushed. This is the primary gate. A sheet-side ID lookup (`fetchTransactionIds`) is performed only during the initial bootstrap import to guard against duplicates from a re-import of an already-synced sheet.
- **Batch Size:** Requests are capped at **500 rows** per API call to stay well within the Google Sheets API 10 MB body limit and the 2 M cell quota per spreadsheet.
- **valueInputOption:** Use `USER_ENTERED` (not `RAW`) so that date strings are parsed as Sheets date values, enabling native sorting and filtering.

```typescript
private readonly BATCH_SIZE = 500;

async appendTransactions(sheetId: string, transactions: CategorizedTransaction[]): Promise<void> {
  const token = await this.auth.getToken();

  // Idempotency: only push records not yet synced to Sheets
  const unsynced = transactions.filter(txn => !txn.synced);
  if (unsynced.length === 0) return;

  // Process in batches of BATCH_SIZE to avoid request size limits
  for (let i = 0; i < unsynced.length; i += this.BATCH_SIZE) {
    const batch = unsynced.slice(i, i + this.BATCH_SIZE);

    const values = batch.map(txn => [
      txn.id,                                           // A: ID
      txn.date,                                         // B: Date
      txn.account,                                      // C: Account
      txn.description,                                  // D: Description
      txn.amount,                                       // E: Amount
      txn.creditIndicator,                              // F: CreditIndicator
      txn.transactionType,                              // G: TransactionType
      txn.category,                                     // H: Category
      txn.subCategory,                                  // I: SubCategory
      txn.confidence,                                   // J: Confidence
      txn.status,                                       // K: Status
      txn.source,                                       // L: Source
      txn.memoNotes ?? '',                              // M: Notes
      (txn.tags ?? []).join(','),                       // N: Tags
      new Date(txn.createdAt).toISOString(),            // O: CreatedAt
      new Date(txn.lastModified).toISOString()          // P: LastModified
    ]);

    await this.http.post(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Transactions!A2:P:append?valueInputOption=USER_ENTERED`,
      { values },
      { headers: { Authorization: `Bearer ${token}` } }
    ).toPromise();

    // Mark each successfully pushed record as synced in IndexedDB
    await Promise.all(
      batch.map(txn =>
        this.db.transactions.update(txn.id, { synced: true, status: 'SYNCED' })
      )
    );
  }
}
```

#### 2.2.2 Update Dashboard Metrics

**Architectural Decision — Clear Range API:**
HTTP DELETE is **not** a valid Google Sheets API verb for clearing cell values. The correct call is:
```
POST https://sheets.googleapis.com/v4/spreadsheets/{id}/values/{range}:clear
```
This is a POST with an empty body. The previous design's `http.delete(...)` would return a 404/405 and leave stale rows in place.

**Architectural Decision — UpdatedAt column:**
The data model defines column F (`UpdatedAt`) for `Dashboard_Data`. Both the write and read paths must include it.

```typescript
async updateDashboardMetrics(sheetId: string, metrics: DashboardMetrics[]): Promise<void> {
  const token = await this.auth.getToken();
  const now = new Date().toISOString();

  // Clear existing data — correct API is POST .../values/{range}:clear
  await this.http.post(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Dashboard_Data!A2:F:clear`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  ).toPromise();

  // Write fresh aggregates including UpdatedAt (column F per data model)
  const values = metrics.map(m => [
    m.period,        // A: Period (YYYY-MM)
    m.account,       // B: Account
    m.totalIncome,   // C: TotalIncome
    m.totalExpense,  // D: TotalExpense
    m.netFlow,       // E: NetFlow
    now              // F: UpdatedAt (ISO 8601)
  ]);

  await this.http.post(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Dashboard_Data!A2:F:append?valueInputOption=USER_ENTERED`,
    { values },
    { headers: { Authorization: `Bearer ${token}` } }
  ).toPromise();
}
```

#### 2.2.3 Fetch Dashboard Data

```typescript
async fetchDashboardData(sheetId: string): Promise<DashboardMetrics[]> {
  const token = await this.auth.getToken();

  // Range updated to A2:F to include UpdatedAt column (F per data model)
  const response = await this.http.get<any>(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Dashboard_Data!A2:F`,
    { headers: { Authorization: `Bearer ${token}` } }
  ).toPromise();

  return (response.values || []).map((row: string[]) => ({
    period: row[0],
    account: row[1],
    totalIncome: parseFloat(row[2]) || 0,
    totalExpense: parseFloat(row[3]) || 0,
    netFlow: parseFloat(row[4]) || 0,
    updatedAt: row[5] ?? null        // F: UpdatedAt
  }));
}
```

#### 2.2.4 Append Rules

**Architectural Decision:** `appendRules` follows the same write-then-mark pattern as `appendTransactions`. Columns A:J match the Rules sheet schema defined in the data model (§2.2 of `02_DATA_MODEL.md`).

```typescript
async appendRules(sheetId: string, rules: Rule[]): Promise<void> {
  const token = await this.auth.getToken();

  const unsynced = rules.filter(r => !r.synced);
  if (unsynced.length === 0) return;

  for (let i = 0; i < unsynced.length; i += this.BATCH_SIZE) {
    const batch = unsynced.slice(i, i + this.BATCH_SIZE);

    const values = batch.map(r => [
      r.id,                                        // A: ID
      r.patternType,                               // B: PatternType
      r.pattern,                                   // C: Pattern
      r.category,                                  // D: Category
      r.subCategory ?? '',                         // E: SubCategory
      r.priority,                                  // F: Priority
      r.active ? 'TRUE' : 'FALSE',                 // G: Active
      r.source,                                    // H: Source
      new Date(r.createdAt).toISOString(),         // I: CreatedAt
      new Date(r.lastModified).toISOString()       // J: LastModified
    ]);

    await this.http.post(
      `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Rules!A2:J:append?valueInputOption=USER_ENTERED`,
      { values },
      { headers: { Authorization: `Bearer ${token}` } }
    ).toPromise();

    await Promise.all(
      batch.map(r => this.db.rules.update(r.id, { synced: true }))
    );
  }
}
```

#### 2.2.5 Fetch Transaction IDs (Bootstrap Deduplication)

**When to use:** Called once during first-ever bootstrap import to build an in-memory ID set and skip IDs already present in the sheet. Not called on every incremental sync — the IDB `synced` flag handles that case.

```typescript
async fetchTransactionIds(sheetId: string): Promise<Set<string>> {
  const token = await this.auth.getToken();

  // Fetch only column A (IDs) to minimise data transfer
  const response = await this.http.get<any>(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Transactions!A2:A`,
    { headers: { Authorization: `Bearer ${token}` } }
  ).toPromise();

  const rows: string[][] = response.values ?? [];
  return new Set(rows.map((row: string[]) => row[0]).filter(Boolean));
}
```

---

## 3. Sync Strategy & Conflict Resolution

### 3.1 Sync Direction

**One-Way Sync Model:**
- **Primary Source:** IndexedDB (local, source of truth for unsaved changes)
- **Persistent Store:** Google Sheets (backup and archive)
- **Direction:** IndexedDB → Google Sheets (push-only)

**Trigger Strategy (PO/PM Decision — Story 4):**
- **Primary trigger:** Sync fires **automatically** immediately after import + IndexedDB write completes. No extra user action required.
- **Secondary trigger:** A "Retry Sync" button is shown in the sync status bar **only** when sync status is `FAILED` or `QUEUED` (offline scenario). This is the user-visible recovery action for TC4/TC5.
- The "Sync & Train" button described in earlier design iterations is a broader future feature (includes ML retraining) and is **out of scope for Story 4**.

**Why One-Way:**
- User makes changes locally (parsed transactions in IDB)
- Sync pushes to Sheets immediately post-import
- Reduces conflict complexity
- Failures are transparently queued and retried on reconnect

### 3.2 Conflict Resolution

**Last-Write-Wins (LWW) with Timestamps:**

When syncing, check `lastModified` timestamps:
- If local timestamp > sheet timestamp: Update sheet
- If sheet timestamp > local timestamp: Skip (sheet is newer)
- Tie: Local wins (user's explicit action takes priority)

```typescript
async resolveConflict(
  localTxn: CategorizedTransaction,
  sheetTxn: CategorizedTransaction
): Promise<CategorizedTransaction> {
  const localTime = new Date(localTxn.lastModified).getTime();
  const sheetTime = new Date(sheetTxn.lastModified).getTime();
  
  if (localTime >= sheetTime) {
    return localTxn;  // Use local version
  } else {
    return sheetTxn;  // Use sheet version
  }
}
```

### 3.3 Sync Queue

**Persistent Queue in IndexedDB:**

```
┌─────────────────────────┐
│  User Action            │
│  (Edit category)        │
└────────────┬────────────┘
             │
             ↓
┌─────────────────────────┐
│ IndexedDB: transactions │
│ (Update record)         │
└────────────┬────────────┘
             │
             ↓
┌─────────────────────────┐
│ IndexedDB: sync_queue   │
│ (Queue UPDATE entry)    │
└────────────┬────────────┘
             │
             ↓ (User clicks "Sync & Train")
┌─────────────────────────┐
│ Process Sync Queue      │
├─────────────────────────┤
│ 1. Check connectivity   │
│ 2. Get auth token       │
│ 3. For each queue entry:│
│    - Append/Update sheet│
│    - Mark as SYNCED     │
│    - Remove from queue  │
└────────────┬────────────┘
             │
             ↓ (Success)
┌─────────────────────────┐
│ Update Dashboard_Data   │
│ Recalculate aggregates  │
└────────────┬────────────┘
             │
             ↓
┌─────────────────────────┐
│ Toast: "Sync Complete"  │
│ Dashboard updates       │
└─────────────────────────┘
```

**Retry Logic:**

```typescript
@Injectable({ providedIn: 'root' })
export class SyncService {
  private readonly maxRetries = 3;
  private readonly retryDelays = [1000, 5000, 15000];  // ms
  
  async processSyncQueue(): Promise<void> {
    const queueEntries = await this.db.sync_queue.where('status').equals('PENDING').toArray();
    
    for (const entry of queueEntries) {
      await this.retryWithBackoff(entry);
    }
  }
  
  private async retryWithBackoff(entry: SyncQueueEntry): Promise<void> {
    let attempts = 0;
    
    while (attempts < this.maxRetries) {
      try {
        await this.syncEntry(entry);
        
        // Mark as synced
        await this.db.sync_queue.update(entry.id, {
          status: 'SYNCED',
          processedAt: new Date()
        });
        
        return;  // Success
      } catch (error) {
        attempts++;
        
        if (attempts < this.maxRetries) {
          // Exponential backoff
          const delay = this.retryDelays[attempts - 1];
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Update attempt count
          await this.db.sync_queue.update(entry.id, {
            attempts,
            lastError: (error as Error).message
          });
        } else {
          // Max retries exceeded
          await this.db.sync_queue.update(entry.id, {
            status: 'FAILED',
            attempts,
            lastError: (error as Error).message
          });

          // Notify user
          this.showError(`Sync failed: ${(error as Error).message}`);
        }
      }
    }
  }

  /**
   * Routes a sync_queue entry to the correct SheetsService method.
   *
   * Architectural Decisions:
   * - TRANSACTION INSERT maps to appendTransactions (idempotency handled by
   *   synced flag — appendTransactions filters to synced===false).
   * - TRANSACTION UPDATE: currently treated as append because the IDB
   *   synced-flag prevents double appends. A targeted row-update using
   *   QUERY lookup is a future enhancement once update frequency warrants it.
   * - RULE INSERT/UPDATE both map to appendRules (same pattern).
   * - MODEL: binary blobs are NOT pushed to Sheets; only metadata (version,
   *   accuracy metrics) is written to the Models sheet via updateModelMetadata.
   * - DELETE operations are not supported; use soft-delete via status field.
   */
  private async syncEntry(entry: SyncQueueEntry): Promise<void> {
    const sheetId = await this.getSheetId();

    switch (entry.entityType) {
      case 'TRANSACTION': {
        const txn = await this.db.transactions.get(entry.entityId);
        if (!txn) throw new Error(`Transaction ${entry.entityId} not found in IDB`);
        await this.sheetsService.appendTransactions(sheetId, [txn]);
        break;
      }

      case 'RULE': {
        const rule = await this.db.rules.get(entry.entityId);
        if (!rule) throw new Error(`Rule ${entry.entityId} not found in IDB`);
        await this.sheetsService.appendRules(sheetId, [rule]);
        break;
      }

      case 'MODEL': {
        // Binary model blob is not written to Sheets — only metadata
        const model = await this.db.models.get(entry.entityId);
        if (!model) throw new Error(`Model ${entry.entityId} not found in IDB`);
        await this.sheetsService.updateModelMetadata(sheetId, model);
        break;
      }

      default:
        throw new Error(`Unknown entityType in sync_queue: ${(entry as any).entityType}`);
    }
  }

  private async getSheetId(): Promise<string> {
    const setting = await this.db.settings.get('googleSheetId');
    if (!setting?.value) throw new Error('Google Sheet ID not configured in settings');
    return setting.value as string;
  }
}
```

---

## 4. Background Sync Service

### 4.1 Service Worker Integration

**Periodic Background Sync:**

```typescript
// In main service worker
self.addEventListener('sync', (event: SyncEvent) => {
  if (event.tag === 'sync-sheets') {
    event.waitUntil(
      syncDatabase()
        .catch(error => {
          console.error('Sync failed, will retry:', error);
          // Browser will retry the sync on next online event
        })
    );
  }
});

async function syncDatabase() {
  // Fetch auth token from secure storage
  const token = await getAuthToken();
  
  // Get pending sync entries from IndexedDB
  const pending = await db.sync_queue.where('status').equals('PENDING').toArray();
  
  // Process each entry
  for (const entry of pending) {
    await appendToSheet(entry, token);
  }
}
```

### 4.2 Online/Offline Detection

```typescript
@Injectable({ providedIn: 'root' })
export class ConnectivityService {
  private online$ = new BehaviorSubject<boolean>(navigator.onLine);
  
  constructor() {
    window.addEventListener('online', () => this.online$.next(true));
    window.addEventListener('offline', () => this.online$.next(false));
  }
  
  getOnlineStatus(): Observable<boolean> {
    return this.online$.asObservable();
  }
  
  async autoSync(): Promise<void> {
    this.online$.pipe(
      filter(online => online),  // Wait until online
      debounceTime(2000),         // Debounce to prevent multiple syncs
      take(1)
    ).subscribe(() => {
      this.syncService.processSyncQueue();
    });
  }
}
```

---

## 5. Data Mapping & Normalization

### 5.1 Transaction DTO (Data Transfer Object)

**WASM Output → IDB Input:**

```typescript
interface TransactionDTO {
  id: string;               // Stable ID assigned by the WASM engine
  date: string;             // ISO 8601: YYYY-MM-DD
  account: string;          // e.g., "HDFC_SAVINGS_XXXX1234"
  description: string;
  amount: number;
  creditIndicator: string;  // "Yes" for credit, empty for debit
  transactionType: string;  // "Income", "Investment", "Expense", "Transfer"
  category: string;
  subCategory: string;
  confidence: number;
  source: string;           // Parser name, e.g., "HDFC_SAVINGS"
  // Fields optionally emitted by WASM; defaulted below if absent:
  confidenceLevel?: string; // Derived from confidence if not provided
  status?: string;          // Defaults to 'PENDING'
  memoNotes?: string;
  tags?: string[];
  createdAt?: string;       // ISO 8601; defaults to import time if absent
  lastModified?: string;    // ISO 8601; defaults to import time if absent
}

/**
 * Normalize WASM output to an IndexedDB Transaction record.
 *
 * Architectural Decision — ID field:
 * Use `dto.id` (the WASM engine's stable ID) rather than generating a fresh
 * UUID here. The WASM engine derives IDs deterministically from a hash of
 * (account + date + description + amount), so the same source row always
 * produces the same ID. This is the foundation of idempotency for both IDB
 * upserts (`db.transactions.put` is safe to call again with the same ID) and
 * the Sheets bootstrap deduplication check (`fetchTransactionIds`). Generating
 * a new UUID here would break that guarantee and create phantom duplicates on
 * any re-import of a file that was already synced.
 */
function toIndexedDBTransaction(dto: TransactionDTO): Transaction {
  const now = new Date().toISOString();

  return {
    id: dto.id,             // ← use WASM-assigned stable ID (NOT generateUUID())
    date: dto.date,
    account: dto.account,
    description: dto.description,
    amount: dto.amount,
    creditIndicator: dto.creditIndicator,
    transactionType: dto.transactionType,
    category: dto.category,
    subCategory: dto.subCategory ?? '',
    confidence: dto.confidence,
    confidenceLevel: dto.confidenceLevel ?? getConfidenceLevel(dto.confidence),
    status: dto.status ?? 'PENDING',
    source: dto.source,
    memoNotes: dto.memoNotes ?? '',
    tags: dto.tags ?? [],
    createdAt: dto.createdAt ?? now,
    lastModified: dto.lastModified ?? now,
    synced: false
  };
}

function getConfidenceLevel(confidence: number): string {
  if (confidence > 0.9) return 'HIGH';
  if (confidence >= 0.6) return 'MEDIUM';
  return 'LOW';
}
```

---

## 6. Monitoring & Error Handling

### 6.1 Sync Errors

**Common Errors:**

| Error | Cause | Handling |
|-------|-------|----------|
| Auth Token Expired | Token refresh needed | Refresh token and retry |
| Network Error | Internet offline | Queue for retry on online |
| Quota Exceeded | Google Drive quota full | Show user-friendly message |
| Sheet Corrupted | Invalid format | Reset sheet, notify user |
| Rate Limit | Too many requests | Exponential backoff |

### 6.2 Logging & Alerts

```typescript
@Injectable({ providedIn: 'root' })
export class SyncLogger {
  logSync(action: string, status: 'success' | 'failure', details: any): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action,
      status,
      details
    };
    
    // Store locally for debugging
    this.db.logs.add(logEntry);
    
    // Send to monitoring service (Sentry, LogRocket, etc.)
    if (status === 'failure') {
      this.monitoring.captureException(new Error(action), { extra: details });
    }
  }
}
```

---

## 7. Security Considerations

### 7.1 Token Storage

**Secure Storage:**
- **Never** store tokens in localStorage (vulnerable to XSS)
- **Use** in-memory storage + secure HTTP-only cookies (if backend)
- **Alternative:** sessionStorage (cleared on browser close) or IndexedDB with encryption

```typescript
// Secure token storage
private storeTokens(tokens: TokenResponse): void {
  // Method 1: In-memory (requires re-auth per session)
  this.accessToken = tokens.access_token;
  
  // Method 2: IndexedDB encrypted
  const encrypted = this.encryptionService.encrypt(tokens.refresh_token);
  this.db.settings.put({
    key: 'refreshToken',
    value: encrypted,
    type: 'STRING'
  });
}
```

### 7.2 Data Encryption

**In Transit:** All Sheets API calls use HTTPS.

**At Rest:** Consider encrypting sensitive fields in IndexedDB:

```typescript
// Encrypt sensitive description before storing
const encrypted = {
  ...transaction,
  description: this.encryptionService.encrypt(transaction.description)
};

await this.db.transactions.add(encrypted);
```

### 7.3 CSRF Protection

- OAuth includes `state` parameter validation
- All POST requests to Sheets API use bearer token (OAuth-based)
- No session cookies needed (stateless OAuth)

---

## 8. Reconciliation & Audit Trail

### 8.1 Data Reconciliation

**Weekly Audit Job:**

```typescript
async auditSheetsData(): Promise<void> {
  const sheetTransactions = await this.fetchAllTransactions();
  const localTransactions = await this.db.transactions.toArray();
  
  const mismatches = findMismatches(sheetTransactions, localTransactions);
  
  if (mismatches.length > 0) {
    // Log for manual review
    this.syncLogger.logSync('audit', 'failure', { mismatches });
    
    // Notify user
    this.showWarning(`Found ${mismatches.length} data discrepancies`);
  }
}

function findMismatches(sheet: Transaction[], local: Transaction[]): Transaction[] {
  const sheetMap = new Map(sheet.map(t => [t.id, t]));
  
  return local.filter(localTxn => {
    const sheetTxn = sheetMap.get(localTxn.id);
    if (!sheetTxn) return true;  // Missing in sheet
    
    // Compare critical fields
    return localTxn.amount !== sheetTxn.amount ||
           localTxn.category !== sheetTxn.category;
  });
}
```

---

## 9. Architectural Decisions Log (Story 4)

The following decisions were made during the Story 4 design review to close identified gaps.

| # | Area | Decision | Rationale |
|---|------|----------|-----------|
| AD-01 | Clear Range API | Use `POST .../values/{range}:clear` — **not** HTTP DELETE | `DELETE` is not a valid Sheets API v4 verb for clearing values; it returns 404/405 and leaves stale rows |
| AD-02 | Idempotency strategy | IDB `synced===false` flag is the **primary gate**; sheet-side `fetchTransactionIds` only on first-ever bootstrap import | Checking the sheet on every incremental sync adds a full read round-trip per batch; the IDB flag is authoritative and free |
| AD-03 | Transaction ID in `toIndexedDBTransaction` | Use `dto.id` from WASM engine; **never** call `generateUUID()` here | WASM derives IDs deterministically from (account+date+description+amount); a new UUID on each import creates phantom duplicates and breaks dedup |
| AD-04 | `Dashboard_Data!F` (UpdatedAt) | Add `UpdatedAt` to both `updateDashboardMetrics` and `fetchDashboardData` | Column F is defined in the data model schema (§2.3 `02_DATA_MODEL.md`); omitting it causes silent schema drift |
| AD-05 | `appendRules` method | Added; mirrors `appendTransactions` — 500-row batches, IDB `synced` flag, columns A:J | Consistent with Transactions pattern; aligns to the Rules sheet schema |
| AD-06 | `syncEntry` routing | Switch on `entityType`: TRANSACTION→appendTransactions, RULE→appendRules, MODEL→updateModelMetadata (metadata only, no blob) | MODEL blobs are binary and cannot be stored in Sheets; metadata rows are sufficient for audit |
| AD-07 | Batch size | **500 rows** per `values:append` request | Google Sheets API hard limit is 10 MB per HTTP request body; 500 rows of 16 text columns is ≈ 200 KB, safely under the limit with headroom for long descriptions |
| AD-08 | `valueInputOption` | Changed from `RAW` to `USER_ENTERED` for all write operations | Allows Sheets to parse date strings natively, enabling column-level sorting, filtering, and formula references |
| AD-09 | `TransactionDTO` completeness | Added optional fields: `confidenceLevel`, `status`, `memoNotes`, `tags`, `createdAt`, `lastModified` | These fields are in the IDB schema; accepting them from WASM avoids silent data loss when the engine does emit them |
| AD-10 | `fetchTransactionIds` method | Added — reads only column A of Transactions sheet | Required for bootstrap dedup and `auditSheetsData` reconciliation (§8.1); reading only column A minimises quota consumption |

---

## References

- Architecture Design: [01_ARCHITECTURE.md](01_ARCHITECTURE.md)
- Data Model: [02_DATA_MODEL.md](02_DATA_MODEL.md)
- FSD: [../specifications/fsd_1.0.md](../specifications/fsd_1.0.md)
- Google Sheets API: https://developers.google.com/sheets/api/guides/concepts
