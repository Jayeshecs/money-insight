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
| Append Transactions | IDB → Sheets | After import/review | On-demand (User clicks "Sync & Train") |
| Append Rules | IDB → Sheets | After user feedback | On-demand |
| Update Dashboard_Data | IDB → Sheets | After sync | On-demand |
| Fetch Dashboard Data | Sheets → IDB | On app load | Periodic (every 5 min) |
| Fetch Rules | Sheets → IDB | On app load | On-demand |

#### 2.2.1 Append Transactions

```typescript
async appendTransactions(sheetId: string, transactions: CategorizedTransaction[]): Promise<void> {
  const token = await this.auth.getToken();
  
  const values = transactions.map(txn => [
    txn.id,                           // A: ID
    txn.date,                         // B: Date
    txn.account,                      // C: Account
    txn.description,                  // D: Description
    txn.amount,                       // E: Amount
    txn.category,                     // F: Category
    txn.subCategory,                  // G: SubCategory
    txn.confidence,                   // H: Confidence
    txn.status,                       // I: Status
    txn.source,                       // J: Source
    txn.notes,                        // K: Notes
    txn.tags.join(','),               // L: Tags
    new Date(txn.createdAt).toISOString(), // M: CreatedAt
    new Date(txn.lastModified).toISOString() // N: LastModified
  ]);
  
  await this.http.post(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Transactions!A2:N:append?valueInputOption=RAW`,
    { values },
    { headers: { Authorization: `Bearer ${token}` } }
  ).toPromise();
}
```

#### 2.2.2 Update Dashboard Metrics

```typescript
async updateDashboardMetrics(sheetId: string, metrics: DashboardMetrics[]): Promise<void> {
  const token = await this.auth.getToken();
  
  // Clear existing data
  await this.http.delete(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Dashboard_Data!A2:E`,
    { headers: { Authorization: `Bearer ${token}` } }
  ).toPromise();
  
  // Append new metrics
  const values = metrics.map(m => [
    m.period,        // A: Period (YYYY-MM)
    m.account,       // B: Account
    m.totalIncome,   // C: TotalIncome
    m.totalExpense,  // D: TotalExpense
    m.netFlow        // E: NetFlow
  ]);
  
  await this.http.post(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Dashboard_Data!A2:E:append?valueInputOption=RAW`,
    { values },
    { headers: { Authorization: `Bearer ${token}` } }
  ).toPromise();
}
```

#### 2.2.3 Fetch Dashboard Data

```typescript
async fetchDashboardData(sheetId: string): Promise<DashboardMetrics[]> {
  const token = await this.auth.getToken();
  
  const response = await this.http.get<any>(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Dashboard_Data!A2:E`,
    { headers: { Authorization: `Bearer ${token}` } }
  ).toPromise();
  
  return (response.values || []).map(row => ({
    period: row[0],
    account: row[1],
    totalIncome: parseFloat(row[2]) || 0,
    totalExpense: parseFloat(row[3]) || 0,
    netFlow: parseFloat(row[4]) || 0
  }));
}
```

---

## 3. Sync Strategy & Conflict Resolution

### 3.1 Sync Direction

**One-Way Sync Model:**
- **Primary Source:** IndexedDB (local, source of truth for unsaved changes)
- **Persistent Store:** Google Sheets (backup and archive)
- **Direction:** IndexedDB → Google Sheets (push-only after user action)

**Why One-Way:**
- User makes changes locally
- User explicitly clicks "Sync & Train"
- App pushes changes to Sheets
- Reduces conflict complexity

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
            lastError: error.message
          });
        } else {
          // Max retries exceeded
          await this.db.sync_queue.update(entry.id, {
            status: 'FAILED',
            attempts,
            lastError: error.message
          });
          
          // Notify user
          this.showError(`Sync failed: ${error.message}`);
        }
      }
    }
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
  id: string;
  date: string;           // ISO 8601: YYYY-MM-DD
  account: string;        // e.g., "HDFC_SAVINGS_XXXX1234"
  description: string;
  amount: number;
  category: string;
  subCategory: string;
  confidence: number;
  source: string;         // Parser name, e.g., "HDFC_SAVINGS"
}

// Normalize to IndexedDB transaction
function toIndexedDBTransaction(dto: TransactionDTO): Transaction {
  const id = generateUUID();
  const now = new Date().toISOString();
  
  return {
    id,
    date: dto.date,
    account: dto.account,
    description: dto.description,
    amount: dto.amount,
    category: dto.category,
    subCategory: dto.subCategory,
    confidence: dto.confidence,
    confidenceLevel: getConfidenceLevel(dto.confidence),
    status: 'PENDING',
    source: dto.source,
    memoNotes: '',
    tags: [],
    createdAt: now,
    lastModified: now,
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

## References

- Architecture Design: [01_ARCHITECTURE.md](01_ARCHITECTURE.md)
- Data Model: [02_DATA_MODEL.md](02_DATA_MODEL.md)
- FSD: [../specifications/fsd_1.0.md](../specifications/fsd_1.0.md)
- Google Sheets API: https://developers.google.com/sheets/api/guides/concepts
