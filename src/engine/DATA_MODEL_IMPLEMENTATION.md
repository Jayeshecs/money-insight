# WASM Engine Data Model Implementation

## Overview

The WASM engine has been enhanced to implement the full data model as specified in [docs/design/02_DATA_MODEL.md](../../docs/design/02_DATA_MODEL.md). The engine now outputs transactions in a format that's ready for IndexedDB storage with automatic categorization, confidence scoring, and unique identifiers.

## Key Changes

### 1. Enhanced Data Models (`src/models.rs`)

Created comprehensive data structures matching the IndexedDB schema:

#### Transaction Model
- **id**: UUID v4 (auto-generated)
- **date**: ISO 8601 format (YYYY-MM-DD)
- **account**: Bank account identifier
- **description**: Transaction description/merchant
- **amount**: Signed amount (negative for debits, positive for credits)
- **category**: Primary category (e.g., "Food", "Transportation")
- **subCategory**: Optional secondary category
- **confidence**: ML confidence score (0.0-1.0)
- **confidenceLevel**: "HIGH" (>0.9), "MEDIUM" (0.6-0.9), "LOW" (<0.6)
- **status**: "PENDING", "APPROVED", "FLAGGED", "SYNCED"
- **source**: Parser source (e.g., "HDFC_SAVINGS", "HDFC_CREDIT")
- **memoNotes**: Optional user notes
- **tags**: Array of user-added tags
- **createdAt**: ISO 8601 timestamp
- **lastModified**: ISO 8601 timestamp
- **synced**: Boolean flag for Google Sheets sync status

#### Other Models
- **Rule**: Categorization rules with pattern matching
- **Model**: ML model metadata
- **SyncQueueEntry**: Tracks pending sync operations
- **Setting**: Application settings

### 2. Categorization Engine (`src/categorizer.rs`)

Implemented a rule-based categorization system:

- **Default Rules**: Pre-configured patterns for common merchants (Swiggy, Zomato, Netflix, etc.)
- **Custom Rules**: Support for user-defined rules with priority ordering
- **Keyword Matching**: Fallback to keyword-based categorization
- **Confidence Scoring**: 
  - User rules: 0.95 (HIGH)
  - Default rules: 0.85 (HIGH)
  - Keyword match: 0.7 (MEDIUM)
  - Uncategorized: 0.1 (LOW)

#### Supported Categories

**Food & Dining**: Swiggy, Zomato, restaurants, cafes, groceries (BigBasket, DMart, Blinkit)
**Transportation**: Uber, Ola, fuel, parking, FASTag
**Utilities**: Electricity, mobile recharge, water, gas
**Shopping**: Amazon, Flipkart, Myntra, Ajio
**Entertainment**: Netflix, Spotify, movies (PVR, INOX), BookMyShow
**Healthcare**: Pharmacies (Apollo, 1mg, NetMeds), hospitals, clinics
**Insurance**: Policy premiums
**Subscriptions**: Various memberships

### 3. Updated Parsers

Both HDFC Savings and HDFC Credit parsers now:
- Generate unique UUID for each transaction
- Set creation and modification timestamps
- Output transactions in the enhanced format
- Initialize with default status (PENDING) and synced flag (false)

### 4. Dependencies Added

```toml
uuid = { version = "1.7", features = ["v4", "js", "serde"] }
chrono = { version = "0.4", features = ["serde", "wasmbind"] }
```

## Usage

### WASM Engine Output Format

When parsing a statement, the engine returns a `TransactionBatch` with:

```json
{
  "sourceParser": "HDFC Savings Account",
  "transactions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "date": "2025-01-10",
      "account": "HDFC_SAVINGS",
      "description": "UPI-SWIGGY-BANGALORE-12345",
      "amount": -450.0,
      "category": "Food",
      "subCategory": "Dining",
      "confidence": 0.85,
      "confidenceLevel": "HIGH",
      "status": "PENDING",
      "source": "HDFC_SAVINGS",
      "memoNotes": null,
      "tags": [],
      "createdAt": "2026-02-15T10:30:00Z",
      "lastModified": "2026-02-15T10:30:00Z",
      "synced": false
    }
  ],
  "parseDurationMs": 0,
  "error": null
}
```

### Integration with Angular Frontend

The Angular frontend should:

1. **Parse the file** using WasmEngine:
   ```typescript
   const engine = new WasmEngine();
   const result = engine.parse_file(fileData, fileName);
   const batch = JSON.parse(result);
   ```

2. **Store in IndexedDB**:
   - Each transaction in `batch.transactions` is ready to be inserted directly into IndexedDB
   - No additional transformation needed - all fields match the schema

3. **Allow user review**:
   - Display transactions with confidence levels
   - Allow users to modify categories for LOW confidence items
   - Update `status` from "PENDING" to "APPROVED"

4. **Queue for sync**:
   - Set `synced: true` after successful Google Sheets sync
   - Track changes in `sync_queue` store

## Categorization Flow

1. **Parser extracts raw transaction** → Creates Transaction with default values
2. **Categorizer processes transaction**:
   - Check user rules (highest priority)
   - Check default rules
   - Fall back to keyword matching
   - Default to "Uncategorized" if no match
3. **Output includes**:
   - Category and sub-category
   - Confidence score
   - Confidence level (HIGH/MEDIUM/LOW)

## Testing

All unit tests pass (63 tests):
- Data model creation and validation
- Categorization with various merchants
- Custom rule priority
- Parser output format
- Confidence level calculations

Run tests:
```bash
cd src/engine
cargo test --lib
```

Build for WASM:
```bash
cargo build --target wasm32-unknown-unknown --release
```

## Future Enhancements

1. **Machine Learning Integration**: Replace rule-based categorizer with ML model
2. **Regex Support**: Full regex pattern matching for rules
3. **User Feedback Learning**: Automatically create rules from user corrections
4. **Multi-currency Support**: Handle different currencies
5. **Transaction Deduplication**: Detect and merge duplicate transactions

## References

- [Data Model Design](../../docs/design/02_DATA_MODEL.md)
- [Architecture](../../docs/design/01_ARCHITECTURE.md)
- [Story 001: Upload and Parse Bank Statement](../../docs/stories/story_001_Upload_and_Parse_Bank_Statement.md)
- [Story 003: Store Parsed Transactions in IndexedDB](../../docs/stories/story_003_Store_Parsed_Transactions_in_IndexedDB.md)
