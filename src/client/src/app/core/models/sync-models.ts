// Sync & Google Sheets integration models
// Reference: docs/design/05_GOOGLE_SHEETS_SYNC.md

export interface DashboardMetrics {
  period: string;       // YYYY-MM
  account: string;      // Account code or "ALL"
  totalIncome: number;
  totalExpense: number;
  netFlow: number;
  updatedAt: string | null; // ISO 8601 — column F per data model
}

export type SyncState =
  | 'idle'
  | 'syncing'
  | 'success'
  | 'failed'
  | 'queued'
  | 'auth_error';

export interface SyncStatus {
  state: SyncState;
  message: string;
  pendingCount?: number;
  error?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export interface GoogleUserInfo {
  email: string;
  name: string;
  picture?: string;
}
