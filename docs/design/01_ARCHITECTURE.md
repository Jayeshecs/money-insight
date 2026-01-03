# MoneyInsight Architecture Design

## 1. System Overview

MoneyInsight is a privacy-first, serverless personal finance platform built on a three-tier architecture:

```
┌─────────────────────┐
│   Angular 21 SPA    │  Frontend UI/UX
│   (Client-side)     │
└──────────┬──────────┘
           │
           ├─────────────────────────┐
           │                         │
┌──────────▼──────────┐  ┌──────────▼────────────┐
│  Rust WASM Engine   │  │   IndexedDB (Cache)   │
│  (In-browser)       │  │   (Offline-first)     │
└──────────┬──────────┘  └──────────┬────────────┘
           │                        │
           └────────────┬───────────┘
                        │
                   ┌────▼──────────┐
                   │  Google Sheets│
                   │  (Persistent) │
                   └───────────────┘
```

## 2. Core Components

### 2.1 Frontend Layer (Angular 21 SPA)

**Responsibility:** User interface, data visualization, user interaction handling.

**Key Modules:**
- **App Core**
  - Services: Authentication (Google OAuth), Google Sheets API client
  - Guards: Route guards for authenticated access
  - State Management: Angular signals or RxJS for reactive data flow

- **Features**
  - **Dashboard Module:** Net Flow, Income vs Expense, Category Breakdown, Recent Transactions widgets
  - **Import Module:** File upload, bank selection, password handling, progress display
  - **Transactions Module:** Transaction review, category editing, confidence indicators, sync & train action
  - **Settings Module:** Google Sheet configuration, account settings

- **Shared**
  - UI Components: Button, Card, Modal, Table, Charts
  - Directives: Ad placeholder directives
  - Pipes: Currency formatting, date formatting

### 2.2 WASM Engine Layer (Rust)

**Responsibility:** File parsing, transaction extraction, auto-detection of bank format, AI categorization.

**Plugin Architecture:**
- **Traits (Interfaces)**
  - `BankParser`: Core trait for implementing bank-specific parsers
    ```
    pub trait BankParser {
        fn identify(&self, data: &str) -> bool;
        fn parse(&self, data: &str) -> Result<Vec<Transaction>>;
    }
    ```
  - `Categorizer`: ML-based categorization
    ```
    pub trait Categorizer {
        fn categorize(&self, transaction: &Transaction) -> CategorizedTransaction;
    }
    ```

- **Plugin Registry**
  - Dynamically loads available parsers
  - Auto-detects the correct parser based on file content

- **Available Parsers**
  - HDFC Savings Account
  - HDFC Credit Card
  - (Extensible for new banks)

- **Processing Pipeline**
  1. File upload → WASM engine
  2. Auto-detect bank format using plugin registry
  3. Parse file using matched parser
  4. Categorize transactions using ML model
  5. Emit `TransactionBatch` event with parsed data
  6. Return JSON to Angular frontend

### 2.3 Data Caching Layer (IndexedDB)

**Responsibility:** Client-side caching for offline-first access and instant UI updates.

**Stores:**
- `transactions`: All parsed transactions with categorization
- `rules`: User-defined categorization rules
- `models`: ML model state and metadata
- `sync_queue`: Pending changes awaiting sync to Google Sheets

**Indexing:**
- Primary: `id` (transaction ID)
- Secondary: `date`, `account`, `category`, `status`, `lastModified`

### 2.4 Data Persistence Layer (Google Sheets)

**Responsibility:** Persistent storage owned by the user.

**Sheet Structure:**
- **Transactions Tab:**
  - Columns: ID, Date, Description, Amount, Category, SubCategory, Confidence, Status, LastModified
  - Records parsed and categorized transactions

- **Rules Tab:**
  - Columns: PatternType, Pattern, Category, SubCategory, CreatedDate, Source
  - User-defined rules for categorization

- **Dashboard_Data Tab:**
  - Aggregated metrics: Total Income, Total Expense, Net Flow, by period/account

- **Models Tab:**
  - ML model metadata: Version, LastTrained, AccuracyMetrics, TrainingDataSize

## 3. Data Flow Architecture

### 3.1 Upload & Processing Flow

```
User Upload
    ↓
[Angular] Upload Modal
    ↓
WASM Engine (Rust)
├─ Auto-detect Bank Format
├─ Parse File (Plugin)
├─ Categorize Transactions (ML)
    ↓
IndexedDB (Cache)
├─ Store Transactions
├─ Store Rules
├─ Emit Progress Events
    ↓
[Angular] Dashboard Update
    ├─ Refresh Widgets
    ├─ Show Recent Transactions
```

### 3.2 Review & Sync Flow

```
User Reviews Transactions
    ↓
[Angular] Transactions Module
├─ Display Card/Table View
├─ Show Confidence Indicators
├─ Allow Category Editing
    ↓
User Clicks "Sync & Train"
    ↓
IndexedDB → Google Sheets (Background Service)
├─ Sync Transactions Tab
├─ Sync Rules Tab (new mappings)
├─ Update Dashboard_Data Tab
    ↓
WASM Engine (Background)
├─ Retrain ML Model (Incremental)
├─ Save Updated Model to IndexedDB
    ↓
[Angular] Toast Notification
"Sync complete. Your AI just got smarter!"
```

### 3.3 Dashboard Data Flow

```
Google Sheets
(Transactions, Rules, Dashboard_Data Tabs)
    ↓
Background Service (Sync)
├─ Fetch updated data
├─ Update IndexedDB
    ↓
Angular Signals / RxJS
├─ Emit data to Dashboard widgets
    ↓
[Angular] Widgets
├─ Net Flow
├─ Income vs Expense
├─ Category Breakdown
├─ Recent Transactions
    ↓
User Views Dashboard
```

## 4. Integration Points

### 4.1 Google OAuth & Sheets API

- **Auth Flow:**
  1. User clicks "Login with Google"
  2. Angular obtains OAuth token with `drive.file` scope
  3. App creates/accesses user's dedicated Google Sheet
  4. Background service uses token to sync data

- **Endpoints:**
  - `/spreadsheets.create()`: Create dedicated sheet
  - `/spreadsheets.values.append()`: Add transactions and rules
  - `/spreadsheets.values.update()`: Update categorization
  - `/spreadsheets.values.get()`: Fetch data for dashboard

### 4.2 WASM ↔ Angular Communication

- **JavaScript Binding:**
  - WASM exports: `parseFile(data, bankHint)`, `categorize(transactions)`
  - Events: Progress updates, parsing errors, categorization results

- **Data Exchange Format:**
  - Input: File content (string/buffer), Bank type hint
  - Output: JSON array of `TransactionDTO` with confidence scores

### 4.3 IndexedDB ↔ Google Sheets Sync

- **Sync Strategy:**
  - **One-way from IndexedDB to Sheets:** After user "Sync & Train" action
  - **Periodic fetch from Sheets to IndexedDB:** Load initial data, poll for external changes

- **Conflict Resolution:**
  - Last-write-wins (based on `lastModified` timestamp)
  - User actions always win over background updates

## 5. Offline-First Architecture

- **Local-First:** All operations are local-first (IndexedDB).
- **Background Sync:** Angular service detects connectivity and syncs when online.
- **Sync Queue:** Queued changes are persisted in `sync_queue` store.
- **Retry Logic:** Failed syncs are retried with exponential backoff.

## 6. Scalability & Extensibility

### 6.1 Plugin Architecture for Bank Parsers

**Adding a New Bank Parser:**
1. Create new Rust module implementing `BankParser` trait
2. Register in plugin registry (`parsers/mod.rs`)
3. WASM automatically exposes the new parser

**Example (SBI Bank):**
```rust
pub struct SBIParser;

impl BankParser for SBIParser {
    fn identify(&self, data: &str) -> bool {
        data.contains("State Bank of India") || data.contains("SBI")
    }
    
    fn parse(&self, data: &str) -> Result<Vec<Transaction>> {
        // SBI-specific parsing logic
    }
}
```

### 6.2 ML Model Extension

- **Incremental Training:** `model.partial_fit()` updates model with new user feedback
- **Rule Engine:** User-defined rules override ML categorization
- **Confidence Tracking:** All predictions include confidence scores for UX guidance

## 7. Performance Optimization

- **WASM Caching:** Compiled WASM module cached by browser
- **IndexedDB Indexing:** Queries optimized with strategic indexes on `date`, `account`, `category`
- **Lazy Loading:** Dashboard widgets load data on-demand
- **Pagination:** Transaction table uses pagination (20 rows per page)
- **Background Workers:** Sync and retraining offload to background service workers

## 8. Error Handling & Resilience

**File Upload Errors:**
- Unsupported format → Show "Report Broken Format" option
- Password-protected file → Prompt for password
- Parsing error → Display error details and fallback options

**Sync Failures:**
- Network error → Queue for retry, show notification
- Auth error → Trigger re-authentication flow
- Sheet quota exceeded → Show user-friendly error

**WASM Errors:**
- Panic handling → Graceful error message to user
- Out-of-memory → Suggest processing smaller batches

## 9. Security & Privacy

- **Client-Side Only:** All parsing and ML happen in-browser; no server processing
- **No Raw Data Transmission:** Files are never uploaded to external servers
- **Google Sheets Security:** Data stored in user's own Google Drive
- **OAuth Scopes:** Minimal permission requests (`drive.file` only)
- **HTTPS Only:** All communication encrypted in transit

## 10. Monitoring & Observability

- **Client-side Logging:** Error tracking (e.g., Sentry integration)
- **Sync Metrics:** Track sync success/failure rates
- **Performance Metrics:** Monitor WASM parsing duration, categorization latency
- **User Engagement:** Track import frequency, sync patterns
- **Ad Performance:** Monitor ad impressions and click-through rates

---

## References

- FSD: [fsd_1.0.md](../specifications/fsd_1.0.md)
- UX Design: [ux_design_1.0.md](../specifications/ux_design_1.0.md)
