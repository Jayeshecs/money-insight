import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { IndexedDbService } from './indexeddb.service';
import { SheetsService } from './sheets.service';
import { AuthService } from './auth.service';
import { ConnectivityService } from './connectivity.service';
import { SyncQueueEntry, Transaction } from '../models/data-models';
import { SyncState, SyncStatus } from '../models/sync-models';

/**
 * SyncService — orchestrates IDB → Google Sheets synchronization
 *
 * Responsibilities:
 * - Triggered automatically post-import (triggerPostImport)
 * - Processes the sync_queue with exponential-backoff retries
 * - Emits a SyncStatus observable for the UI (SyncStatusComponent)
 * - Auto-retries queued items when connectivity is restored
 *
 * Sync trigger strategy (PO/PM decision):
 * - PRIMARY: auto-fires after every import+IDB write (no user action needed)
 * - SECONDARY: manual "Retry Sync" button exposed when state is FAILED/QUEUED
 *
 * Idempotency: SheetsService.appendTransactions filters synced===false internally;
 * the sync_queue entry is the routing mechanism, not the dedup mechanism.
 *
 * Reference: docs/design/05_GOOGLE_SHEETS_SYNC.md §3.3, §9 (AD-02, AD-06)
 */
@Injectable({ providedIn: 'root' })
export class SyncService implements OnDestroy {
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAYS_MS = [1000, 5000, 15000];

  private readonly syncStatus$ = new BehaviorSubject<SyncStatus>({
    state: 'idle',
    message: '',
  });

  private reconnectSub: Subscription | null = null;

  constructor(
    private readonly db: IndexedDbService,
    private readonly sheetsService: SheetsService,
    private readonly authService: AuthService,
    private readonly connectivity: ConnectivityService,
    private readonly ngZone: NgZone
  ) {
    // Auto-retry queued items whenever connectivity is restored
    this.reconnectSub = this.connectivity.onReconnect(() => {
      if (this.syncStatus$.getValue().state === 'queued' ||
          this.syncStatus$.getValue().state === 'failed') {
        this.processSyncQueue();
      }
    });
  }

  ngOnDestroy(): void {
    this.reconnectSub?.unsubscribe();
  }

  // ─── Public API ──────────────────────────────────────────────────────────────

  /** Observable of the current sync state (used by SyncStatusComponent) */
  getSyncStatus(): Observable<SyncStatus> {
    return this.syncStatus$.asObservable();
  }

  /**
   * Called immediately after IndexedDB write completes on import.
   * Enqueues all newly parsed transactions and triggers sync.
   *
   * @param transactions - The batch of transactions just saved to IDB
   */
  async triggerPostImport(transactions: Transaction[]): Promise<void> {
    // Enqueue each transaction as a PENDING INSERT in the sync queue
    const now = new Date().toISOString();
    await Promise.all(
      transactions.map(txn =>
        this.db.addToSyncQueue({
          id: `sq_${txn.id}`,
          operation: 'INSERT',
          entityType: 'TRANSACTION',
          entityId: txn.id,
          payload: {},          // Payload not used — SheetsService reads direct from IDB
          status: 'PENDING',
          attempts: 0,
          lastError: null,
          createdAt: now,
          processedAt: null,
        } as SyncQueueEntry)
      )
    );

    await this.processSyncQueue();
  }

  /**
   * Processes all PENDING entries in the sync queue.
   * Each entry is retried up to MAX_RETRIES times with exponential backoff.
   * Safe to call multiple times — already-SYNCED entries are skipped by IDB query.
   */
  async processSyncQueue(): Promise<void> {
    if (!this.authService.isAuthenticated) {
      this.setSyncStatus('auth_error', 'Please connect your Google account to sync.');
      return;
    }

    if (!this.connectivity.isOnline()) {
      this.setSyncStatus('queued', 'Sync queued — waiting for network');
      return;
    }

    // Reset any FAILED entries so they are retried (D-1: previously they were
    // permanently FAILED and getPendingSyncItems() would return 0, making the
    // Retry button silently transition to idle without attempting anything).
    await this.db.resetFailedSyncItems();

    const entries = await this.db.getPendingSyncItems();
    if (entries.length === 0) {
      this.setSyncStatus('idle', '');
      return;
    }

    this.setSyncStatus('syncing', `Syncing ${entries.length} item(s) to Google Sheets…`, entries.length);

    let failedCount = 0;

    // ── Batch all TRANSACTION entries into a single Sheets API call ──────────
    const txnEntries = entries.filter(e => e.entityType === 'TRANSACTION');
    const otherEntries = entries.filter(e => e.entityType !== 'TRANSACTION');

    if (txnEntries.length > 0) {
      const ok = await this.syncTransactionsBatch(txnEntries);
      if (!ok) failedCount += txnEntries.length;
    }

    // ── RULE / MODEL entries retain per-entry retry with backoff ─────────────
    for (const entry of otherEntries) {
      const ok = await this.retryWithBackoff(entry);
      if (!ok) failedCount++;
    }

    if (failedCount === 0) {
      this.setSyncStatus('success', `Synced to Google Sheets ✓`);
      // Auto-dismiss after 4 s
      setTimeout(() => {
        if (this.syncStatus$.getValue().state === 'success') {
          this.setSyncStatus('idle', '');
        }
      }, 4000);
    } else {
      // Do not overwrite auth_error state set during retry (AD-07)
      if (this.syncStatus$.getValue().state !== 'auth_error') {
        this.setSyncStatus(
          'failed',
          `Sync failed for ${failedCount} item(s). Tap "Retry" to try again.`
        );
      }
    }
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  /**
   * Sends all TRANSACTION sync-queue entries to Sheets in one API call.
   * Retries the whole batch up to MAX_RETRIES times with exponential backoff.
   * @returns true when every entry was successfully synced
   */
  private async syncTransactionsBatch(entries: SyncQueueEntry[]): Promise<boolean> {
    let sheetId: string;
    try {
      sheetId = await this.getSheetId();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      await this.markEntriesFailed(entries, message, 0);
      return false;
    }

    const now = new Date().toISOString();

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const resolved = await Promise.all(
          entries.map(e => this.db.getTransaction(e.entityId))
        );

        // D-3: split entries into found vs missing-from-IDB
        const foundEntries: SyncQueueEntry[] = [];
        const missingEntries: SyncQueueEntry[] = [];
        entries.forEach((e, i) => {
          if (resolved[i] != null) {
            foundEntries.push(e);
          } else {
            missingEntries.push(e);
          }
        });

        if (missingEntries.length > 0) {
          await this.markEntriesFailed(
            missingEntries,
            'Transaction not found in IndexedDB',
            attempt
          );
        }

        const txns = resolved.filter((t): t is Transaction => t != null);

        if (txns.length > 0) {
          await this.sheetsService.appendTransactions(sheetId, txns);
        }

        await Promise.all(
          foundEntries.map(e =>
            this.db.updateSyncQueueEntry({
              ...e,
              status: 'SYNCED',
              processedAt: now,
              attempts: attempt,
            })
          )
        );
        // Return true only if no missing entries (all entries accounted for)
        return missingEntries.length === 0;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);

        if (attempt < this.MAX_RETRIES) {
          await this.sleep(this.RETRY_DELAYS_MS[attempt - 1]);
        } else {
          await this.markEntriesFailed(entries, message, attempt);
          if (message.startsWith('AUTH_ERROR')) {
            this.setSyncStatus('auth_error', 'Google Sheets sync failed. Please re-authenticate.');
          }
        }
      }
    }
    return false;
  }

  private async markEntriesFailed(
    entries: SyncQueueEntry[],
    lastError: string,
    attempts: number
  ): Promise<void> {
    await Promise.all(
      entries.map(e =>
        this.db.updateSyncQueueEntry({ ...e, status: 'FAILED', attempts, lastError })
      )
    );
  }

  /**
   * Retries a single sync queue entry with exponential backoff.
   * @returns true on success, false if all retries exhausted
   */
  private async retryWithBackoff(entry: SyncQueueEntry): Promise<boolean> {
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        await this.syncEntry(entry);

        await this.db.updateSyncQueueEntry({
          ...entry,
          status: 'SYNCED',
          processedAt: new Date().toISOString(),
          attempts: attempt,
        });

        return true;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);

        if (attempt < this.MAX_RETRIES) {
          const delay = this.RETRY_DELAYS_MS[attempt - 1];
          await this.sleep(delay);

          await this.db.updateSyncQueueEntry({
            ...entry,
            attempts: attempt,
            lastError: message,
          });
        } else {
          // All retries exhausted
          const isAuthError = message.startsWith('AUTH_ERROR');
          await this.db.updateSyncQueueEntry({
            ...entry,
            status: 'FAILED',
            attempts: attempt,
            lastError: message,
          });

          if (isAuthError) {
            this.setSyncStatus(
              'auth_error',
              'Google Sheets sync failed. Please re-authenticate.'
            );
          }
        }
      }
    }
    return false;
  }

  /**
   * Routes a sync_queue entry to the correct SheetsService method.
   * AD-06: Switch on entityType — TRANSACTION, RULE, MODEL.
   */
  private async syncEntry(entry: SyncQueueEntry): Promise<void> {
    const sheetId = await this.getSheetId();

    switch (entry.entityType) {
      case 'TRANSACTION': {
        const txn = await this.db.getTransaction(entry.entityId);
        if (!txn) throw new Error(`Transaction ${entry.entityId} not found in IDB`);
        await this.sheetsService.appendTransactions(sheetId, [txn]);
        break;
      }

      case 'RULE': {
        const allRules = await this.db.getAllRules();
        const rule = allRules.find(r => r.id === entry.entityId);
        if (!rule) throw new Error(`Rule ${entry.entityId} not found in IDB`);
        await this.sheetsService.appendRules(sheetId, [rule]);
        break;
      }

      case 'MODEL': {
        const model = await this.db.getModel(entry.entityId);
        if (!model) throw new Error(`Model ${entry.entityId} not found in IDB`);
        await this.sheetsService.updateModelMetadata(sheetId, model);
        break;
      }

      default:
        throw new Error(`Unknown entityType in sync_queue: ${(entry as any).entityType}`);
    }
  }

  private async getSheetId(): Promise<string> {
    const setting = await this.db.getSetting('googleSheetId');
    if (!setting?.value) {
      throw new Error('Google Sheet ID not configured. Please link your Google account.');
    }
    return setting.value as string;
  }

  private setSyncStatus(state: SyncState, message: string, pendingCount?: number): void {
    // Run inside Angular zone so that BehaviorSubject emissions always trigger
    // change detection — IDB callbacks may fire outside zone.js's patched scope.
    this.ngZone.run(() => this.syncStatus$.next({ state, message, pendingCount }));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
