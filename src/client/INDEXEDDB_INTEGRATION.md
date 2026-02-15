# Client App Enhancement - IndexedDB Integration

## Overview

This document describes the enhancements made to the Angular client application to accommodate the new data model from the WASM engine and implement IndexedDB storage for offline-first transaction management.

## Changes Made

### 1. Data Models (`core/models/data-models.ts`)

Created comprehensive TypeScript interfaces matching the IndexedDB schema:

- **Transaction**: Complete transaction model with categorization, confidence scores, and sync status
- **TransactionBatch**: Result from WASM parsing
- **Rule**: User-defined categorization rules
- **Model**: ML model metadata
- **SyncQueueEntry**: Queue for Google Sheets sync
- **Setting**: Application settings

All models use proper TypeScript types matching the Rust engine output.

### 2. IndexedDB Service (`core/services/indexeddb.service.ts`)

Comprehensive service for IndexedDB operations using the `idb` library:

**Features:**
- Auto-initialization of database with proper schema
- Full CRUD operations for all entities
- Indexed queries for efficient data retrieval
- Transaction statistics and aggregation
- Bulk operations for batch inserts

**Key Methods:**
```typescript
// Transactions
addTransaction(transaction: Transaction): Promise<string>
addTransactions(transactions: Transaction[]): Promise<void>
getAllTransactions(): Promise<Transaction[]>
getTransactionsByDateRange(start, end): Promise<Transaction[]>
getUnsyncedTransactions(): Promise<Transaction[]>

// Rules
addRule(rule: Rule): Promise<string>
getActiveRules(): Promise<Rule[]>

// Utility
getDatabaseStats(): Promise<Stats>
clearAllData(): Promise<void>
```

### 3. Enhanced Parsing Service (`core/services/parsing.service.ts`)

Updated to use the new data models:
- Removed old interface definitions
- Imported models from `data-models.ts`
- No functional changes - maintains backward compatibility

### 4. Enhanced Import Component (`features/dashboard/import.component.ts`)

Integrated IndexedDB storage in the upload flow:

**Flow:**
1. File validation
2. File reading
3. WASM parsing (with categorization)
4. **NEW: Save to IndexedDB** ← Added
5. Display success with statistics

**Changes:**
- Added `IndexedDbService` injection
- Added 'saving' stage to upload status
- Automatically saves all transactions to IndexedDB
- Displays database statistics in console
- Updated success message

### 5. Transaction Utils Service (`core/services/transaction-utils.service.ts`)

Helper service for UI operations:

**Features:**
- Badge styling for confidence levels and statuses
- Amount formatting (₹ symbols, sign handling)
- Date formatting
- Category icons
- Transaction summaries and statistics
- Grouping (by category, month)
- Filtering and searching
- Sorting helpers

**Example Usage:**
```typescript
constructor(private utils: TransactionUtilsService) {}

formatAmount(txn: Transaction): string {
  return this.utils.formatAmount(txn.amount); // "₹1,000.00"
}

needsReview(txn: Transaction): boolean {
  return this.utils.needsReview(txn); // true if LOW confidence
}
```

### 6. Package Updates (`package.json`)

Added dependency:
```json
"idb": "^8.0.0"
```

## Database Schema

### Stores

1. **transactions** - Main transaction data
   - Indexes: date, account, category, status, confidence, synced
   
2. **rules** - Categorization rules
   - Indexes: pattern, category, priority, active, source

3. **models** - ML model metadata
   - Indexes: version, lastTrained

4. **syncQueue** - Google Sheets sync queue
   - Indexes: status, createdAt, entityId

5. **settings** - App settings
   - Key-value store

## Transaction Flow

```
User Uploads File
    ↓
File Validation
    ↓
File Reading (ArrayBuffer)
    ↓
WASM Engine (Parse + Categorize)
    ↓
Transaction Batch Output
    ↓
IndexedDB Storage ← NEW!
    ↓
Display Results
```

## Data Model Features

### Categorization
Each transaction includes:
- `category`: Primary category (Food, Transportation, etc.)
- `subCategory`: Optional sub-category (Dining, Fuel, etc.)
- `confidence`: 0.0 - 1.0 score
- `confidenceLevel`: HIGH/MEDIUM/LOW

### Status Tracking
- `PENDING`: Awaiting user review
- `APPROVED`: User approved
- `FLAGGED`: Needs attention
- `SYNCED`: Synced to Google Sheets

### Metadata
- `id`: UUID v4 for unique identification
- `createdAt`: ISO 8601 timestamp
- `lastModified`: ISO 8601 timestamp
- `synced`: Boolean flag

## Usage Examples

### Saving Transactions
```typescript
// Automatic in import component
await this.indexedDbService.addTransactions(batch.transactions);
```

### Querying Transactions
```typescript
// Get all transactions
const all = await this.indexedDbService.getAllTransactions();

// Get unsynced transactions
const unsynced = await this.indexedDbService.getUnsyncedTransactions();

// Get by date range
const ranged = await this.indexedDbService.getTransactionsByDateRange(
  '2025-01-01',
  '2025-01-31'
);

// Get by status
const pending = await this.indexedDbService.getTransactionsByStatus('PENDING');
```

### Processing Transactions
```typescript
constructor(
  private db: IndexedDbService,
  private utils: TransactionUtilsService
) {}

async processTransactions() {
  const txns = await this.db.getAllTransactions();
  
  // Calculate summary
  const summary = this.utils.calculateSummary(txns);
  console.log(`Total Income: ${this.utils.formatAmount(summary.totalIncome)}`);
  console.log(`Total Expense: ${this.utils.formatAmount(summary.totalExpense)}`);
  
  // Group by category
  const byCategory = this.utils.groupByCategory(txns);
  
  // Find transactions needing review
  const needsReview = txns.filter(t => this.utils.needsReview(t));
}
```

## Installation

1. **Install dependencies:**
   ```bash
   cd src/client
   npm install
   ```

2. **Build WASM engine:**
   ```bash
   cd ../engine
   cargo build --target wasm32-unknown-unknown --release
   wasm-bindgen target/wasm32-unknown-unknown/release/moneyinsight_wasm.wasm \
     --out-dir ../client/src/app/wasm/pkg --target web
   ```

3. **Start development server:**
   ```bash
   cd ../client
   npm start
   ```

## Testing

Run unit tests:
```bash
npm test
```

Test files included:
- `indexeddb.service.spec.ts`
- `transaction-utils.service.spec.ts`

## Browser Compatibility

IndexedDB is supported in all modern browsers:
- Chrome 24+
- Firefox 16+
- Safari 10+
- Edge 12+

## Performance Considerations

1. **Bulk Inserts**: Use `addTransactions()` for batch operations
2. **Indexed Queries**: Leverage indexes for filtering (date, account, category)
3. **Lazy Loading**: Fetch data on-demand, not all at once
4. **Pagination**: For large datasets, implement pagination

## Future Enhancements

1. **Sync to Google Sheets**: Implement sync queue processing
2. **Conflict Resolution**: Handle offline edits vs cloud updates
3. **Export Functionality**: CSV/Excel export from IndexedDB
4. **Advanced Filtering**: Multi-criteria search
5. **Data Migration**: Handle schema upgrades
6. **Backup/Restore**: Export/import database

## Troubleshooting

### Database Not Initializing
- Check browser console for errors
- Clear IndexedDB: Dev Tools → Application → IndexedDB
- Verify `idb` package is installed

### Transactions Not Saving
- Check WASM engine output format
- Verify transaction objects have all required fields
- Check browser storage quota

### Performance Issues
- Use indexed queries instead of full scans
- Implement pagination for large datasets
- Consider data archival strategy

## Architecture Diagram

```
┌─────────────────────────────────────┐
│         Angular Frontend           │
├─────────────────────────────────────┤
│                                     │
│  Import Component                   │
│    ↓                               │
│  Parsing Service (WASM)            │
│    ↓                               │
│  IndexedDB Service                 │
│    ↓                               │
│  ┌──────────────────────┐         │
│  │   IndexedDB          │         │
│  │  ┌────────────────┐  │         │
│  │  │ transactions   │  │         │
│  │  │ rules          │  │         │
│  │  │ models         │  │         │
│  │  │ syncQueue      │  │         │
│  │  │ settings       │  │         │
│  │  └────────────────┘  │         │
│  └──────────────────────┘         │
│                                     │
└─────────────────────────────────────┘
         ↕ (Future)
┌─────────────────────────────────────┐
│      Google Sheets API              │
└─────────────────────────────────────┘
```

## Contact

For questions or issues, refer to the main project documentation or create an issue in the repository.
