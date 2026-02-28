// Data Models matching IndexedDB Schema and WASM Engine output
// Reference: docs/design/02_DATA_MODEL.md

export type TransactionType = 'INCOME' | 'INVESTMENT' | 'EXPENSE' | 'TRANSFER';
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';
export type TransactionStatus = 'PENDING' | 'APPROVED' | 'FLAGGED' | 'SYNCED';

export interface Transaction {
  id: string;                          // UUID v4
  date: string;                        // ISO 8601: YYYY-MM-DD
  account: string;                     // Bank account identifier
  narration: string;                   // Transaction narration/description/merchant
  amount: number;                      // Absolute value
  creditIndicator: string;             // "Yes" for credit, empty string for debit
  transactionType: TransactionType;    // Income/Investment/Expense/Transfer
  category: string;                    // Primary category
  subCategory?: string | null;         // Secondary category
  confidence: number;                  // ML confidence (0.0 - 1.0)
  confidenceLevel: ConfidenceLevel;    // HIGH/MEDIUM/LOW
  status: TransactionStatus;           // PENDING/APPROVED/FLAGGED/SYNCED
  source: string;                      // Parser source (HDFC_SAVINGS, HDFC_CREDIT)
  memoNotes?: string | null;           // User-added notes
  tags: string[];                      // User-added tags
  createdAt: string;                   // ISO 8601 timestamp
  lastModified: string;                // ISO 8601 timestamp
  synced: boolean;                     // Whether synced to Google Sheets
}

export interface TransactionBatch {
  sourceParser: string;                // camelCase from WASM
  transactions: Transaction[];
  parseDurationMs: number;             // camelCase from WASM
  error?: string | null;
}

export type PatternType = 'EXACT' | 'CONTAINS' | 'REGEX' | 'MERCHANT_ID';
export type RuleSource = 'USER_CREATED' | 'USER_FEEDBACK' | 'SYSTEM';

export interface Rule {
  id: string;
  patternType: PatternType;
  pattern: string;
  category: string;
  subCategory?: string | null;
  priority: number;                    // 1-100
  active: boolean;
  source: RuleSource;
  feedback: boolean;
  createdAt: string;
  lastModified: string;
  synced: boolean;
}

export interface AccuracyMetrics {
  precision: number;
  recall: number;
  f1Score: number;
}

export interface Model {
  id: string;
  version: string;
  accuracyMetrics: AccuracyMetrics;
  trainingDataSize: number;
  lastTrained: string;
  createdAt: string;
  synced: boolean;
}

export type SyncOperation = 'INSERT' | 'UPDATE' | 'DELETE';
export type EntityType = 'TRANSACTION' | 'RULE' | 'MODEL';
export type SyncStatus = 'PENDING' | 'IN_PROGRESS' | 'FAILED' | 'SYNCED';

export interface SyncQueueEntry {
  id: string;
  operation: SyncOperation;
  entityType: EntityType;
  entityId: string;
  payload: any;
  status: SyncStatus;
  attempts: number;
  lastError?: string | null;
  createdAt: string;
  processedAt?: string | null;
}

export type SettingType = 'STRING' | 'NUMBER' | 'BOOLEAN' | 'OBJECT';

export interface Setting {
  key: string;
  value: any;
  settingType: SettingType;
  updatedAt: string;
}

// ==================== Dashboard Summary Models ====================

export interface CategoryStats {
  totalAmount: number;
  count: number;
  percentage: number;
}

export interface PeriodSummary {
  fromDate: string;
  toDate: string;
}

export interface DashboardSummary {
  transactionCount: number;
  totalCredit: number;
  totalDebit: number;
  netFlow: number;
  categoryBreakdown: Record<string, CategoryStats>;
  sourceBreakdown: Record<string, number>;
  period: PeriodSummary | null;
}
