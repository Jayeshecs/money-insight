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

---

## 11. Dashboard v2.0 Architecture (Sprint 4)

### 11.1 Overview

Sprint 4 replaces the v1.0 chart-based Dashboard (Stories 007, 010) with a four-section, vertically-stacked analytical layout. No new WASM functions are needed — all aggregation is performed in Angular via computed signals over the `Transaction[]` array held in `DashboardStateService`.

```
DashboardComponent (v2.0)
├── GranularityBarComponent          Section 1 — period/granularity controls
├── OverallSummaryBarComponent       Section 2 — four totals + account filter
├── [ad-section-divider]             Ad slot: dashboard-summary-banner (728×90)
├── .widgets-grid
│   ├── AnalyticalWidgetComponent    Section 3a — Expense tree table
│   ├── AnalyticalWidgetComponent    Section 3b — Investment tree table
│   ├── AnalyticalWidgetComponent    Section 3c — Income tree table
│   └── AnalyticalWidgetComponent    Section 3d — Transfer tree table
├── [ad-section-divider]             Ad slot: dashboard-widgets-banner (728×90)
└── TransactionsPanelComponent       Section 4 — inline transaction browser
```

### 11.2 New Components Introduced

| Component | Selector | Path | Story |
|-----------|----------|------|-------|
| `GranularityBarComponent` | `app-granularity-bar` | `features/dashboard/granularity-bar/` | 017 |
| `OverallSummaryBarComponent` | `app-overall-summary-bar` | `features/dashboard/overall-summary-bar/` | 017 |
| `AnalyticalWidgetComponent` | `app-analytical-widget` | `features/dashboard/widgets/analytical-widget/` | 018 |
| `TransactionsPanelComponent` | `app-transactions-panel` | `features/dashboard/transactions-panel/` | 019 |

All four are **standalone Angular components**. `AnalyticalWidgetComponent` is reused four times with different `@Input() type` values.

### 11.3 DashboardStateService Extensions

The following signals are added to `DashboardStateService` in Sprint 4. Existing v1 signals (`periodFilter`, `customDateFrom`, `customDateTo`, `activeCategoryFilter`, `monthlySeries`, `filteredSummary`) are preserved during transition and eventually superseded by the v2 signals.

**Story 017 additions:**

| Signal | Type | Description |
|--------|------|-------------|
| `granularity` | `WritableSignal<Granularity>` | Active granularity (`monthly`/`quarterly`/`yearly`). Default: `'monthly'`. |
| `pendingPeriodStart` | `WritableSignal<string>` | Slider/input value not yet applied. Updated on every drag/keystroke. |
| `pendingPeriodEnd` | `WritableSignal<string>` | Slider/input value not yet applied. |
| `activePeriodStart` | `WritableSignal<string>` | Applied start value. Set only by `applyPeriod()`. |
| `activePeriodEnd` | `WritableSignal<string>` | Applied end value. Set only by `applyPeriod()`. |
| `selectedAccounts` | `WritableSignal<string[]>` | Currently selected accounts. Empty = all accounts. Immediate effect. |
| `availableAccounts` | `Signal<string[]>` (computed) | Distinct `Transaction.account` values from all loaded transactions. |
| `overallSummary` | `Signal<OverallSummary>` (computed) | Income/Expense/Investment/Transfer totals for the active period + account filter. |

**Story 018 additions:**

| Signal | Type | Description |
|--------|------|-------------|
| `periodAccountFiltered` | `Signal<Transaction[]>` (computed) | Base filter: transactions within `activePeriodStart..End` and matching `selectedAccounts`. Shared by all tree signals and Story 019. |
| `expenseTree` | `Signal<CategoryTree[]>` (computed) | Category/sub-category tree for EXPENSE transactions. |
| `incomeTree` | `Signal<CategoryTree[]>` (computed) | Category/sub-category tree for INCOME transactions. |
| `investmentTree` | `Signal<CategoryTree[]>` (computed) | Category/sub-category tree for INVESTMENT transactions. |
| `transferTree` | `Signal<CategoryTree[]>` (computed) | Category/sub-category tree for TRANSFER transactions. |
| `activeAutoWidget` | `WritableSignal<TransactionType\|null>` | Which widget's Auto toggle is ON. At most one at a time. |
| `activeWidgetSelection` | `WritableSignal<WidgetSelection\|null>` | Currently highlighted row across all widgets. |

**Story 019 addition:**

| Signal | Type | Description |
|--------|------|-------------|
| `filteredTransactions` (v2) | `Signal<Transaction[]>` (computed) | `periodAccountFiltered` further narrowed by `activeWidgetSelection` (when `activeAutoWidget` is non-null). Replaces v1 `filteredTransactions`. |

### 11.4 Data Flow: IndexedDB → Signals → Components

```
IndexedDB.getAllTransactions()
  └── DashboardStateService.transactions (WritableSignal)
        │
        ├── [computed] availableAccounts
        ├── [computed] overallSummary ← activePeriodStart/End + selectedAccounts
        ├── [computed] periodAccountFiltered ← activePeriodStart/End + selectedAccounts
        │     ├── [computed] expenseTree
        │     ├── [computed] incomeTree
        │     ├── [computed] investmentTree
        │     ├── [computed] transferTree
        │     └── [computed] filteredTransactions (v2)
        │           └── [further filtered by activeWidgetSelection when activeAutoWidget≠null]
        │
        └── GranularityBarComponent
              writes: pendingPeriodStart/End, granularity
              calls: applyPeriod() → sets activePeriodStart/End → invalidates all computed signals

OverallSummaryBarComponent
  reads:  overallSummary, availableAccounts, selectedAccounts
  writes: selectedAccounts → immediate invalidation of periodAccountFiltered + downstream

AnalyticalWidgetComponent (×4)
  reads:  expenseTree / incomeTree / investmentTree / transferTree (via @Input)
  writes: activeWidgetSelection, activeAutoWidget (via @Output → DashboardComponent handler)

TransactionsPanelComponent
  reads:  filteredTransactions (v2), periodAccountFiltered, activeAutoWidget, activeWidgetSelection
  local:  searchText, currentPage (component-level WritableSignals — not in service)
```

### 11.5 Ad Placement Changes (Story 020)

Sprint 4 retires the v1 sidebar + dashboard-banner ad layout and introduces two full-width banner slots at section boundaries:

| Retired Slot | Replacement |
|---|---|
| `sidebar-skyscraper` (160×600, right sidebar) | Removed — no sidebar in v2 layout |
| `dashboard-banner` (728×90, between pie chart and recent transactions) | Removed — neither element exists in v2 |
| *(new)* `dashboard-summary-banner` (728×90) | Between `<app-overall-summary-bar>` and `.widgets-grid` |
| *(new)* `dashboard-widgets-banner` (728×90) | Between `.widgets-grid` and `<app-transactions-panel>` |

Both new slots use `<div class="ad-section-divider">` wrappers with `min-height: 90px` to guarantee CLS = 0. Both are hidden on mobile (`display: none` at `< 768 px`). The Story 011 mobile sticky footer (320×50) is unaffected.

### 11.6 Responsive Layout Breakpoints (Dashboard v2.0)

| Viewport | Section 1 | Section 2 | Section 3 | Section 4 | Ads |
|---|---|---|---|---|---|
| ≥ 768 px | Flex row | Flex row (4 chips + filter) | 2×2 CSS grid | Table view | Visible (728×90) |
| < 768 px | 2-row stack | 2×2 grid + filter below | 1-column stack | Card list | Hidden |
