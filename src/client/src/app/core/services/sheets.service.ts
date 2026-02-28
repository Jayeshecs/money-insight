import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { IndexedDbService } from './indexeddb.service';
import { Transaction, Rule, Model } from '../models/data-models';
import { DashboardMetrics } from '../models/sync-models';

/**
 * SheetsService — Google Sheets API v4 integration
 *
 * Responsibilities:
 * - Create and initialize the MoneyInsight spreadsheet on first login
 * - Append transactions (Transactions tab, columns A:P)
 * - Append rules (Rules tab, columns A:J) — designed for future story
 * - Update and fetch dashboard metrics (Dashboard_Data tab, columns A:F)
 * - Fetch existing transaction IDs for bootstrap deduplication
 * - Update model metadata (Models tab)
 *
 * Idempotency: appendTransactions/appendRules only push records where
 * `synced === false` in IDB, then mark them `synced = true` on success.
 * Batch size: 500 rows per request (≈200 KB; well under 10 MB API limit).
 *
 * Reference: docs/design/05_GOOGLE_SHEETS_SYNC.md §2
 */
@Injectable({ providedIn: 'root' })
export class SheetsService {
  private readonly SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';
  private readonly BATCH_SIZE = 500;

  constructor(
    private readonly http: HttpClient,
    private readonly auth: AuthService,
    private readonly db: IndexedDbService
  ) {}

  // ─── Sheet Initialization ────────────────────────────────────────────────────

  /**
   * Creates the MoneyInsight spreadsheet with 4 tabs + frozen headers.
   * Called once on first login by AuthService.ensureSheetExists().
   * Stores the resulting spreadsheetId in IDB settings['googleSheetId'].
   */
  async createSheet(): Promise<string> {
    const token = await this.auth.getToken();

    const response = await firstValueFrom(
      this.http.post<any>(
        this.SHEETS_API,
        {
          properties: { title: 'MoneyInsight - Personal Finance Dashboard' },
          sheets: [
            { properties: { title: 'Transactions' } },
            { properties: { title: 'Rules' } },
            { properties: { title: 'Dashboard_Data' } },
            { properties: { title: 'Models' } },
          ],
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
    );

    const sheetId: string = response.spreadsheetId;

    await this.initializeHeaders(sheetId, token);

    await this.db.setSetting({
      key: 'googleSheetId',
      value: sheetId,
      settingType: 'STRING',
      updatedAt: new Date().toISOString(),
    });

    return sheetId;
  }

  /**
   * Ensures the MoneyInsight sheet exists.
   * Uses the stored sheetId; creates a new sheet if none is found.
   */
  async ensureSheetExists(): Promise<string> {
    const setting = await this.db.getSetting('googleSheetId');
    if (setting?.value) {
      return setting.value as string;
    }
    return this.createSheet();
  }

  // ─── Transaction Sync ────────────────────────────────────────────────────────

  /**
   * Pushes unsynced transactions to the Transactions sheet (columns A:P).
   * Only records where `synced === false` are processed.
   * After each successful batch, marks records as synced in IDB.
   *
   * @param sheetId      - Google spreadsheetId
   * @param transactions - Candidate transactions (filtered internally to unsynced)
   */
  async appendTransactions(sheetId: string, transactions: Transaction[]): Promise<void> {
    const token = await this.auth.getToken();

    const unsynced = transactions.filter(txn => !txn.synced);
    if (unsynced.length === 0) return;

    for (let i = 0; i < unsynced.length; i += this.BATCH_SIZE) {
      const batch = unsynced.slice(i, i + this.BATCH_SIZE);

      const values = batch.map(txn => [
        txn.id,                                                 // A: ID
        txn.date,                                               // B: Date
        txn.account,                                            // C: Account
        txn.narration,                                         // D: Narration
        txn.amount,                                             // E: Amount
        txn.creditIndicator,                                    // F: CreditIndicator
        txn.transactionType,                                    // G: TransactionType
        txn.category,                                           // H: Category
        txn.subCategory ?? '',                                  // I: SubCategory
        txn.confidence,                                         // J: Confidence
        txn.status,                                             // K: Status
        txn.source,                                             // L: Source
        txn.memoNotes ?? '',                                    // M: Notes
        (txn.tags ?? []).join(','),                             // N: Tags
        new Date(txn.createdAt).toISOString(),                  // O: CreatedAt
        new Date(txn.lastModified).toISOString(),               // P: LastModified
      ]);

      await firstValueFrom(
        this.http.post(
          `${this.SHEETS_API}/${sheetId}/values/Transactions!A2:P:append?valueInputOption=USER_ENTERED`,
          { values },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      );

      // Mark batch as synced in IDB
      await Promise.all(
        batch.map(txn =>
          this.db.updateTransaction({ ...txn, synced: true, status: 'SYNCED' })
        )
      );
    }
  }

  /**
   * Bootstrap deduplication helper.
   * Reads only column A (IDs) to build a Set of UUIDs already in the sheet.
   * Use ONLY during the very first bootstrap import — incremental syncs use
   * the IDB `synced` flag instead.
   */
  async fetchTransactionIds(sheetId: string): Promise<Set<string>> {
    const token = await this.auth.getToken();

    const response = await firstValueFrom(
      this.http.get<any>(
        `${this.SHEETS_API}/${sheetId}/values/Transactions!A2:A`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
    );

    const rows: string[][] = response.values ?? [];
    return new Set(rows.map((row: string[]) => row[0]).filter(Boolean));
  }

  // ─── Rules Sync (designed for future story; wired into syncEntry routing) ────

  /**
   * Pushes unsynced rules to the Rules sheet (columns A:J).
   * Follows the same pattern as appendTransactions.
   * NOTE: Currently out of scope for Story 4 — triggered by future story.
   */
  async appendRules(sheetId: string, rules: Rule[]): Promise<void> {
    const token = await this.auth.getToken();

    const unsynced = rules.filter(r => !r.synced);
    if (unsynced.length === 0) return;

    for (let i = 0; i < unsynced.length; i += this.BATCH_SIZE) {
      const batch = unsynced.slice(i, i + this.BATCH_SIZE);

      const values = batch.map(r => [
        r.id,                                              // A: ID
        r.patternType,                                     // B: PatternType
        r.pattern,                                         // C: Pattern
        r.category,                                        // D: Category
        r.subCategory ?? '',                               // E: SubCategory
        r.priority,                                        // F: Priority
        r.active ? 'TRUE' : 'FALSE',                       // G: Active
        r.source,                                          // H: Source
        new Date(r.createdAt).toISOString(),               // I: CreatedAt
        new Date(r.lastModified).toISOString(),            // J: LastModified
      ]);

      await firstValueFrom(
        this.http.post(
          `${this.SHEETS_API}/${sheetId}/values/Rules!A2:J:append?valueInputOption=USER_ENTERED`,
          { values },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      );

      await Promise.all(
        batch.map(r => this.db.updateRule({ ...r, synced: true }))
      );
    }
  }

  // ─── Dashboard_Data Sync (Story 5 scope; method provided for completeness) ──

  /**
   * Replaces all rows in Dashboard_Data (A:F) with fresh aggregates.
   * Uses POST .../values/{range}:clear (NOT HTTP DELETE — AD-01).
   * Includes UpdatedAt column F per data model §2.3 (AD-04).
   */
  async updateDashboardMetrics(sheetId: string, metrics: DashboardMetrics[]): Promise<void> {
    const token = await this.auth.getToken();
    const now = new Date().toISOString();

    await firstValueFrom(
      this.http.post(
        `${this.SHEETS_API}/${sheetId}/values/Dashboard_Data!A2:F:clear`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
    );

    const values = metrics.map(m => [
      m.period,         // A: Period (YYYY-MM)
      m.account,        // B: Account
      m.totalIncome,    // C: TotalIncome
      m.totalExpense,   // D: TotalExpense
      m.netFlow,        // E: NetFlow
      now,              // F: UpdatedAt (ISO 8601)
    ]);

    await firstValueFrom(
      this.http.post(
        `${this.SHEETS_API}/${sheetId}/values/Dashboard_Data!A2:F:append?valueInputOption=USER_ENTERED`,
        { values },
        { headers: { Authorization: `Bearer ${token}` } }
      )
    );
  }

  async fetchDashboardData(sheetId: string): Promise<DashboardMetrics[]> {
    const token = await this.auth.getToken();

    const response = await firstValueFrom(
      this.http.get<any>(
        `${this.SHEETS_API}/${sheetId}/values/Dashboard_Data!A2:F`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
    );

    return (response.values ?? []).map((row: string[]) => ({
      period: row[0],
      account: row[1],
      totalIncome: parseFloat(row[2]) || 0,
      totalExpense: parseFloat(row[3]) || 0,
      netFlow: parseFloat(row[4]) || 0,
      updatedAt: row[5] ?? null,
    }));
  }

  // ─── Model Metadata Sync ─────────────────────────────────────────────────────

  /**
   * Writes model accuracy metadata to the Models sheet (no binary blob).
   * Binary blobs cannot be stored in Sheets — only scalar metrics are written.
   */
  async updateModelMetadata(sheetId: string, model: Model): Promise<void> {
    const token = await this.auth.getToken();

    const values = [[
      model.id,
      model.version ?? '',
      model.accuracyMetrics?.precision ?? '',
      model.accuracyMetrics?.recall ?? '',
      model.accuracyMetrics?.f1Score ?? '',
      model.trainingDataSize ?? '',
      model.lastTrained,
      model.createdAt,
    ]];

    await firstValueFrom(
      this.http.post(
        `${this.SHEETS_API}/${sheetId}/values/Models!A2:H:append?valueInputOption=USER_ENTERED`,
        { values },
        { headers: { Authorization: `Bearer ${token}` } }
      )
    );
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  private async initializeHeaders(sheetId: string, token: string): Promise<void> {
    // Write header rows and freeze row 1 for all 4 sheets
    const headerBatch = await firstValueFrom(
      this.http.post(
        `${this.SHEETS_API}/${sheetId}/values:batchUpdate`,
        {
          valueInputOption: 'RAW',
          data: [
            {
              range: 'Transactions!A1:P1',
              values: [['ID', 'Date', 'Account', 'Description', 'Amount',
                'CreditIndicator', 'TransactionType', 'Category', 'SubCategory',
                'Confidence', 'Status', 'Source', 'Notes', 'Tags',
                'CreatedAt', 'LastModified']],
            },
            {
              range: 'Rules!A1:J1',
              values: [['ID', 'PatternType', 'Pattern', 'Category', 'SubCategory',
                'Priority', 'Active', 'Source', 'CreatedAt', 'LastModified']],
            },
            {
              range: 'Dashboard_Data!A1:F1',
              values: [['Period', 'Account', 'TotalIncome', 'TotalExpense', 'NetFlow', 'UpdatedAt']],
            },
            {
              range: 'Models!A1:H1',
              values: [['ID', 'Version', 'Precision', 'Recall', 'F1Score',
                'TrainingDataSize', 'LastTrained', 'CreatedAt']],
            },
          ],
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
    );

    // Freeze first row on all sheets
    const sheetListResponse = await firstValueFrom(
      this.http.get<any>(
        `${this.SHEETS_API}/${sheetId}?fields=sheets.properties`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
    );

    const freezeRequests = sheetListResponse.sheets.map((s: any) => ({
      updateSheetProperties: {
        fields: 'gridProperties.frozenRowCount',
        properties: {
          sheetId: s.properties.sheetId,
          gridProperties: { frozenRowCount: 1 },
        },
      },
    }));

    await firstValueFrom(
      this.http.post(
        `${this.SHEETS_API}/${sheetId}:batchUpdate`,
        { requests: freezeRequests },
        { headers: { Authorization: `Bearer ${token}` } }
      )
    );
  }
}
