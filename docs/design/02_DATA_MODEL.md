# MoneyInsight Data Model Design

## 1. IndexedDB Schema

### 1.1 Database Overview

**Database Name:** `MoneyInsightDB`
**Version:** 1
**Stores:**
- transactions
- rules
- models
- sync_queue
- settings

### 1.2 Store: transactions

**Purpose:** Store all parsed and categorized transactions.

**Schema:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | String | ✓ | Unique transaction ID (UUID) |
| date | Date | ✓ | Transaction date |
| account | String | ✓ | Bank account identifier |
| description | String | ✓ | Transaction description/merchant |
| amount | Number | ✓ | Transaction amount (absolute value) |
| creditIndicator | String | ✓ | "Yes" for credit transactions, empty string or other value for debit |
| transactionType | String | ✓ | Enum: "Income", "Investment", "Expense", "Transfer" |
| category | String | ✓ | Primary category (e.g., "Food", "Rent") |
| subCategory | String | | Secondary category (e.g., "Dining", "Groceries") |
| confidence | Number | ✓ | ML confidence (0-1) |
| confidenceLevel | String | ✓ | Enum: "HIGH" (>0.9), "MEDIUM" (0.6-0.9), "LOW" (<0.6) |
| status | String | ✓ | Enum: "PENDING", "APPROVED", "FLAGGED", "SYNCED" |
| source | String | ✓ | Parser source (e.g., "HDFC_SAVINGS", "HDFC_CREDIT") |
| memoNotes | String | | User-added notes |
| tags | Array<String> | | User-added tags |
| createdAt | Date | ✓ | Creation timestamp |
| lastModified | Date | ✓ | Last modification timestamp |
| synced | Boolean | ✓ | Whether synced to Google Sheets |

**Indexes:**

| Index Name | Fields | Type |
|-----------|--------|------|
| PRIMARY | id | Unique |
| idx_date | date | Ascending |
| idx_account | account | Ascending |
| idx_category | category | Ascending |
| idx_status | status | Ascending |
| idx_confidence | confidenceLevel | Ascending |
| idx_synced | synced | Ascending |
| idx_date_account | [date, account] | Compound |
| idx_lastModified | lastModified | Descending |

**Example Record:**

```json
{
  "id": "txn_550e8400-e29b-41d4-a716-446655440000",
  "date": "2025-01-10",
  "account": "HDFC_SAVINGS_XXXX1234",
  "description": "UPI-SWIGGY-BANGALORE-12345",
  "amount": 450.00,
  "creditIndicator": "",
  "transactionType": "Expense",
  "category": "Food",
  "subCategory": "Dining",
  "confidence": 0.92,
  "confidenceLevel": "HIGH",
  "status": "APPROVED",
  "source": "HDFC_SAVINGS",
  "memoNotes": "Lunch order",
  "tags": ["swiggy", "recurring"],
  "createdAt": "2025-01-10T10:30:00Z",
  "lastModified": "2025-01-10T10:30:00Z",
  "synced": true
}
```

### 1.3 Store: rules

**Purpose:** Store user-defined categorization rules for ML override.

**Schema:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | String | ✓ | Unique rule ID (UUID) |
| patternType | String | ✓ | Enum: "EXACT", "CONTAINS", "REGEX", "MERCHANT_ID" |
| pattern | String | ✓ | Pattern to match (e.g., "STARBUCKS", "SWIGGY") |
| category | String | ✓ | Assigned category |
| subCategory | String | | Assigned sub-category |
| priority | Number | ✓ | Rule priority (higher = match first, 1-100) |
| active | Boolean | ✓ | Whether rule is active |
| source | String | ✓ | Enum: "USER_CREATED", "USER_FEEDBACK", "SYSTEM" |
| feedback | Boolean | | Whether rule was created from user feedback |
| createdAt | Date | ✓ | Creation timestamp |
| lastModified | Date | ✓ | Last modification timestamp |
| synced | Boolean | ✓ | Whether synced to Google Sheets |

**Indexes:**

| Index Name | Fields | Type |
|-----------|--------|------|
| PRIMARY | id | Unique |
| idx_pattern | pattern | Ascending |
| idx_category | category | Ascending |
| idx_priority | priority | Descending |
| idx_active | active | Ascending |
| idx_source | source | Ascending |

**Example Records:**

```json
{
  "id": "rule_550e8400-e29b-41d4-a716-446655440001",
  "patternType": "CONTAINS",
  "pattern": "STARBUCKS",
  "category": "Food",
  "subCategory": "Coffee",
  "priority": 95,
  "active": true,
  "source": "USER_CREATED",
  "feedback": false,
  "createdAt": "2024-12-01T09:00:00Z",
  "lastModified": "2024-12-01T09:00:00Z",
  "synced": true
}
```

### 1.4 Store: models

**Purpose:** Store ML model metadata and state.

**Schema:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | String | ✓ | Model identifier (typically "default") |
| version | String | ✓ | Semantic version (e.g., "1.0.0") |
| modelBlob | Blob | ✓ | Serialized model (pickle or binary format) |
| accuracyMetrics | Object | | Model performance metrics |
| accuracyMetrics.precision | Number | | Weighted precision score |
| accuracyMetrics.recall | Number | | Weighted recall score |
| accuracyMetrics.f1Score | Number | | Weighted F1 score |
| trainingDataSize | Number | | Number of samples used in training |
| lastTrained | Date | ✓ | Last training timestamp |
| createdAt | Date | ✓ | Model creation timestamp |
| synced | Boolean | ✓ | Synced to Google Drive |

**Indexes:**

| Index Name | Fields | Type |
|-----------|--------|------|
| PRIMARY | id | Unique |
| idx_version | version | Ascending |
| idx_lastTrained | lastTrained | Descending |

**Example Record:**

```json
{
  "id": "default",
  "version": "1.2.3",
  "modelBlob": "<binary_data>",
  "accuracyMetrics": {
    "precision": 0.87,
    "recall": 0.85,
    "f1Score": 0.86
  },
  "trainingDataSize": 2450,
  "lastTrained": "2025-01-08T14:30:00Z",
  "createdAt": "2024-11-01T10:00:00Z",
  "synced": true
}
```

### 1.5 Store: sync_queue

**Purpose:** Queue changes awaiting sync to Google Sheets.

**Schema:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | String | ✓ | Queue entry ID (UUID) |
| operation | String | ✓ | Enum: "INSERT", "UPDATE", "DELETE" |
| entityType | String | ✓ | Enum: "TRANSACTION", "RULE", "MODEL" |
| entityId | String | ✓ | ID of the entity being synced |
| payload | Object | ✓ | Entity data to sync |
| status | String | ✓ | Enum: "PENDING", "IN_PROGRESS", "FAILED", "SYNCED" |
| attempts | Number | ✓ | Number of sync attempts |
| lastError | String | | Error message from last attempt |
| createdAt | Date | ✓ | When queued |
| processedAt | Date | | When successfully synced |

**Indexes:**

| Index Name | Fields | Type |
|-----------|--------|------|
| PRIMARY | id | Unique |
| idx_status | status | Ascending |
| idx_createdAt | createdAt | Ascending |
| idx_entityId | entityId | Ascending |

**Example Record:**

```json
{
  "id": "queue_550e8400-e29b-41d4-a716-446655440002",
  "operation": "UPDATE",
  "entityType": "TRANSACTION",
  "entityId": "txn_550e8400-e29b-41d4-a716-446655440000",
  "payload": {
    "category": "Food",
    "subCategory": "Dining",
    "status": "APPROVED",
    "lastModified": "2025-01-10T15:45:00Z"
  },
  "status": "PENDING",
  "attempts": 0,
  "lastError": null,
  "createdAt": "2025-01-10T15:45:00Z",
  "processedAt": null
}
```

### 1.6 Store: settings

**Purpose:** Store user preferences and application configuration.

**Schema:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| key | String | ✓ | Setting key (unique identifier) |
| value | Any | ✓ | Setting value |
| type | String | ✓ | Enum: "STRING", "NUMBER", "BOOLEAN", "OBJECT" |
| updatedAt | Date | ✓ | Last update timestamp |

**Indexes:**

| Index Name | Fields | Type |
|-----------|--------|------|
| PRIMARY | key | Unique |

**Common Settings:**

```json
[
  {
    "key": "googleSheetId",
    "value": "1a2b3c4d5e6f7g8h9i0j",
    "type": "STRING",
    "updatedAt": "2024-11-01T10:00:00Z"
  },
  {
    "key": "defaultCurrency",
    "value": "INR",
    "type": "STRING",
    "updatedAt": "2024-11-01T10:00:00Z"
  },
  {
    "key": "theme",
    "value": "dark",
    "type": "STRING",
    "updatedAt": "2025-01-05T08:30:00Z"
  },
  {
    "key": "autoSyncEnabled",
    "value": true,
    "type": "BOOLEAN",
    "updatedAt": "2024-11-01T10:00:00Z"
  },
  {
    "key": "syncInterval",
    "value": 300000,
    "type": "NUMBER",
    "updatedAt": "2024-11-01T10:00:00Z"
  },
  {
    "key": "lastSyncTime",
    "value": "2025-01-10T18:00:00Z",
    "type": "STRING",
    "updatedAt": "2025-01-10T18:00:00Z"
  }
]
```

## 2. Google Sheets Schema

### 2.1 Sheet: Transactions

**Purpose:** Persistent storage of all transactions.

**Columns:**

| Column | Format | Description |
|--------|--------|-------------|
| A: ID | Text | Transaction ID (auto-generated) |
| B: Date | Date | Transaction date (YYYY-MM-DD) |
| C: Account | Text | Bank account code |
| D: Description | Text | Transaction description/merchant |
| E: Amount | Number | Amount (absolute value) |
| F: CreditIndicator | Text | "Yes" for credit, empty for debit |
| G: TransactionType | Text | Income, Investment, Expense, Transfer |
| H: Category | Text | Primary category |
| I: SubCategory | Text | Secondary category |
| J: Confidence | Number | ML confidence (0-1) |
| K: Status | Text | PENDING, APPROVED, FLAGGED, SYNCED |
| L: Source | Text | Parser source (HDFC_SAVINGS, HDFC_CREDIT) |
| M: Notes | Text | User notes |
| N: Tags | Text | Comma-separated tags |
| O: CreatedAt | DateTime | ISO 8601 timestamp |
| P: LastModified | DateTime | ISO 8601 timestamp |

**Row 1:** Headers (frozen)
**Data:** Starting from Row 2
**Sorting:** By Date (descending), then by ID
**Filters:** Enabled on header row

### 2.2 Sheet: Rules

**Purpose:** User-defined categorization rules.

**Columns:**

| Column | Format | Description |
|--------|--------|-------------|
| A: ID | Text | Rule ID |
| B: PatternType | Text | EXACT, CONTAINS, REGEX, MERCHANT_ID |
| C: Pattern | Text | Pattern string |
| D: Category | Text | Assigned category |
| E: SubCategory | Text | Assigned sub-category |
| F: Priority | Number | Priority (1-100) |
| G: Active | Boolean | Is rule active |
| H: Source | Text | USER_CREATED, USER_FEEDBACK, SYSTEM |
| I: CreatedAt | DateTime | ISO 8601 timestamp |
| J: LastModified | DateTime | ISO 8601 timestamp |

**Row 1:** Headers (frozen)
**Data:** Starting from Row 2
**Sorting:** By Priority (descending)

### 2.3 Sheet: Dashboard_Data

**Purpose:** Aggregated metrics for dashboard widgets (read-only for app).

**Columns:**

| Column | Format | Description |
|--------|--------|-------------|
| A: Period | Text | YYYY-MM (e.g., "2025-01") |
| B: Account | Text | Account code or "ALL" |
| C: TotalIncome | Number | Sum of income transactions |
| D: TotalExpense | Number | Sum of expense transactions |
| E: NetFlow | Number | Income - Expense |
| F: UpdatedAt | DateTime | Last update timestamp |

**Aggregation Logic:**
- Grouped by Period (month) and Account
- Manually recalculated after each sync
- Or use Google Sheets formulas (SUMIF) to auto-calculate

### 2.4 Sheet: Models

**Purpose:** ML model metadata.

**Columns:**

| Column | Format | Description |
|--------|--------|-------------|
| A: ID | Text | Model ID (typically "default") |
| B: Version | Text | Semantic version |
| C: Accuracy | Number | Model accuracy percentage |
| D: Precision | Number | Weighted precision |
| E: Recall | Number | Weighted recall |
| F: F1Score | Number | Weighted F1 score |
| G: TrainingDataSize | Number | Samples used in training |
| H: LastTrained | DateTime | ISO 8601 timestamp |
| I: CreatedAt | DateTime | ISO 8601 timestamp |

## 3. Data Model Relationships

```
┌─────────────────┐
│  transactions   │
├─────────────────┤
│ id (PK)         │
│ date            │
│ category ───────┼──────► ┌─────────────────┐
│ status          │        │  rules          │
│ source          │        ├─────────────────┤
│ lastModified    │        │ id (PK)         │
└─────────────────┘        │ pattern         │
                           │ category        │
                           │ priority        │
                           │ active          │
                           └─────────────────┘

┌─────────────────┐
│  models         │
├─────────────────┤
│ id (PK)         │
│ version         │
│ modelBlob       │ (Used by categorization engine)
│ lastTrained     │
└─────────────────┘

┌─────────────────┐
│  sync_queue     │
├─────────────────┤
│ id (PK)         │
│ entityType      │
│ entityId ───────┼──────► (Transactions, Rules, or Models)
│ status          │
└─────────────────┘
```

## 4. Data Constraints & Validation

### 4.1 Transactions Store

- **date**: Must be ISO 8601 format (YYYY-MM-DD)
- **amount**: Non-zero number
- **category**: Must match one of predefined categories
- **confidence**: Range [0, 1]
- **status**: Must be one of enum values
- **id**: Must be unique within the store

### 4.2 Rules Store

- **pattern**: Non-empty string
- **priority**: Range [1, 100]
- **category**: Must match one of predefined categories
- **patternType**: Must be one of enum values

### 4.3 Cross-Store Constraints

- All **lastModified** timestamps must be ISO 8601
- All **id** values must be UUIDs (v4)
- Foreign key integrity: `transactions.category` must exist in a predefined category list

## 5. Category Taxonomy

**Primary Categories (L1):**
- Income
- Food
- Transportation
- Utilities
- Rent
- Shopping
- Entertainment
- Healthcare
- Insurance
- Savings
- Investments
- Subscriptions
- Personal Care
- Education
- Miscellaneous

**Sub-Categories (L2) - Examples:**

| Primary | Sub-Categories |
|---------|-----------------|
| Food | Dining, Groceries, Delivery, Cafe, Restaurant |
| Transportation | Fuel, Public Transit, Ride Share, Parking, Maintenance |
| Shopping | Clothing, Electronics, Home, Books |
| Entertainment | Movies, Gaming, Music, Sports |
| Healthcare | Doctor, Pharmacy, Dental, Mental Health |
| Insurance | Health, Auto, Home, Life |

---

## References

- Architecture Design: [01_ARCHITECTURE.md](01_ARCHITECTURE.md)
- FSD: [../specifications/fsd_1.0.md](../specifications/fsd_1.0.md)
