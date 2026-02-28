import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { SyncService } from './sync.service';
import { IndexedDbService } from './indexeddb.service';
import { SheetsService } from './sheets.service';
import { AuthService } from './auth.service';
import { ConnectivityService } from './connectivity.service';
import { Transaction, SyncQueueEntry } from '../models/data-models';
import { Subject } from 'rxjs';

describe('SyncService', () => {
  let service: SyncService;
  let dbSpy: jasmine.SpyObj<IndexedDbService>;
  let sheetsSpy: jasmine.SpyObj<SheetsService>;
  let authSpy: jasmine.SpyObj<AuthService>;
  let connectivitySpy: jasmine.SpyObj<ConnectivityService>;

  const mockTransaction: Transaction = {
    id: 'txn_001',
    date: '2025-01-10',
    account: 'HDFC_SAVINGS',
    description: 'UPI-SWIGGY',
    amount: 450,
    creditIndicator: '',
    transactionType: 'EXPENSE',
    category: 'Food',
    subCategory: 'Dining',
    confidence: 0.92,
    confidenceLevel: 'HIGH',
    status: 'PENDING',
    source: 'HDFC_SAVINGS',
    memoNotes: '',
    tags: [],
    createdAt: '2025-01-10T10:00:00Z',
    lastModified: '2025-01-10T10:00:00Z',
    synced: false,
  };

  const mockPendingEntry: SyncQueueEntry = {
    id: 'sq_txn_001',
    operation: 'INSERT',
    entityType: 'TRANSACTION',
    entityId: 'txn_001',
    payload: {},
    status: 'PENDING',
    attempts: 0,
    lastError: null,
    createdAt: new Date().toISOString(),
    processedAt: null,
  };

  const reconnectSubject = new Subject<boolean>();

  beforeEach(() => {
    dbSpy = jasmine.createSpyObj<IndexedDbService>('IndexedDbService', [
      'addToSyncQueue',
      'getPendingSyncItems',
      'updateSyncQueueEntry',
      'resetFailedSyncItems',
      'getSetting',
      'getTransaction',
      'getAllRules',
      'getModel',
    ]);
    dbSpy.addToSyncQueue.and.returnValue(Promise.resolve('sq_txn_001'));
    dbSpy.getPendingSyncItems.and.returnValue(Promise.resolve([]));
    dbSpy.updateSyncQueueEntry.and.returnValue(Promise.resolve('sq_txn_001'));
    dbSpy.resetFailedSyncItems.and.returnValue(Promise.resolve());
    dbSpy.getSetting.and.returnValue(
      Promise.resolve({ key: 'googleSheetId', value: 'sheet_abc', settingType: 'STRING', updatedAt: '' })
    );
    dbSpy.getTransaction.and.returnValue(Promise.resolve(mockTransaction));
    dbSpy.getAllRules.and.returnValue(Promise.resolve([]));
    dbSpy.getModel.and.returnValue(Promise.resolve(undefined));

    sheetsSpy = jasmine.createSpyObj<SheetsService>('SheetsService', [
      'appendTransactions',
      'appendRules',
      'updateModelMetadata',
    ]);
    sheetsSpy.appendTransactions.and.returnValue(Promise.resolve());
    sheetsSpy.appendRules.and.returnValue(Promise.resolve());

    authSpy = jasmine.createSpyObj<AuthService>('AuthService', ['isAuthenticated']);
    Object.defineProperty(authSpy, 'isAuthenticated', { get: () => true });

    connectivitySpy = jasmine.createSpyObj<ConnectivityService>('ConnectivityService', [
      'isOnline',
      'onReconnect',
    ]);
    connectivitySpy.isOnline.and.returnValue(true);
    connectivitySpy.onReconnect.and.callFake(cb => reconnectSubject.subscribe(v => { if (v) cb(); }));

    TestBed.configureTestingModule({
      providers: [
        SyncService,
        { provide: IndexedDbService, useValue: dbSpy },
        { provide: SheetsService, useValue: sheetsSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: ConnectivityService, useValue: connectivitySpy },
      ],
    });

    service = TestBed.inject(SyncService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ─── triggerPostImport ────────────────────────────────────────────────────

  it('triggerPostImport: should enqueue one sync_queue entry per transaction', async () => {
    await service.triggerPostImport([mockTransaction]);
    expect(dbSpy.addToSyncQueue).toHaveBeenCalledOnceWith(
      jasmine.objectContaining({
        entityType: 'TRANSACTION',
        entityId: 'txn_001',
        status: 'PENDING',
        operation: 'INSERT',
      })
    );
  });

  // ─── processSyncQueue ─────────────────────────────────────────────────────

  it('processSyncQueue: should emit idle when queue is empty', async () => {
    dbSpy.getPendingSyncItems.and.returnValue(Promise.resolve([]));

    let lastStatus: any;
    service.getSyncStatus().subscribe(s => (lastStatus = s));

    await service.processSyncQueue();
    expect(lastStatus.state).toBe('idle');
  });

  it('processSyncQueue: should emit queued when offline', async () => {
    connectivitySpy.isOnline.and.returnValue(false);

    let lastStatus: any;
    service.getSyncStatus().subscribe(s => (lastStatus = s));

    await service.processSyncQueue();
    expect(lastStatus.state).toBe('queued');
    expect(sheetsSpy.appendTransactions).not.toHaveBeenCalled();
  });

  it('processSyncQueue: should emit auth_error when not authenticated', async () => {
    Object.defineProperty(authSpy, 'isAuthenticated', { get: () => false });

    let lastStatus: any;
    service.getSyncStatus().subscribe(s => (lastStatus = s));

    await service.processSyncQueue();
    expect(lastStatus.state).toBe('auth_error');
  });

  it('processSyncQueue: should emit success after syncing TRANSACTION entry', async () => {
    dbSpy.getPendingSyncItems.and.returnValue(Promise.resolve([mockPendingEntry]));

    let lastStatus: any;
    service.getSyncStatus().subscribe(s => (lastStatus = s));

    await service.processSyncQueue();

    expect(sheetsSpy.appendTransactions).toHaveBeenCalledOnceWith('sheet_abc', [mockTransaction]);
    expect(dbSpy.updateSyncQueueEntry).toHaveBeenCalledWith(
      jasmine.objectContaining({ id: 'sq_txn_001', status: 'SYNCED' })
    );
    expect(lastStatus.state).toBe('success');
  });

  // ─── retry / backoff ──────────────────────────────────────────────────────

  it('processSyncQueue: should retry on failure and mark FAILED after max retries', async () => {
    dbSpy.getPendingSyncItems.and.returnValue(Promise.resolve([mockPendingEntry]));
    sheetsSpy.appendTransactions.and.returnValue(Promise.reject(new Error('Network error')));

    // Speed up by overriding retry delays
    (service as any).RETRY_DELAYS_MS = [0, 0, 0];

    let lastStatus: any;
    service.getSyncStatus().subscribe(s => (lastStatus = s));

    await service.processSyncQueue();

    expect(sheetsSpy.appendTransactions).toHaveBeenCalledTimes(3); // MAX_RETRIES = 3
    expect(dbSpy.updateSyncQueueEntry).toHaveBeenCalledWith(
      jasmine.objectContaining({ status: 'FAILED', attempts: 3 })
    );
    expect(lastStatus.state).toBe('failed');
  });

  it('processSyncQueue: should call resetFailedSyncItems so FAILED entries are retried (D-1)', async () => {
    dbSpy.getPendingSyncItems.and.returnValue(Promise.resolve([mockPendingEntry]));
    await service.processSyncQueue();
    expect(dbSpy.resetFailedSyncItems).toHaveBeenCalled();
  });

  it('processSyncQueue: should mark missing-IDB entries FAILED and still sync found entries (D-3)', async () => {
    const missingEntry: SyncQueueEntry = { ...mockPendingEntry, id: 'sq_missing', entityId: 'txn_missing' };
    dbSpy.getPendingSyncItems.and.returnValue(Promise.resolve([mockPendingEntry, missingEntry]));
    dbSpy.getTransaction.and.callFake((id: string) =>
      id === 'txn_001' ? Promise.resolve(mockTransaction) : Promise.resolve(undefined)
    );

    let lastStatus: any;
    service.getSyncStatus().subscribe(s => (lastStatus = s));

    await service.processSyncQueue();

    // The found transaction should have been pushed to Sheets
    expect(sheetsSpy.appendTransactions).toHaveBeenCalledOnceWith(
      'sheet_abc',
      jasmine.arrayContaining([jasmine.objectContaining({ id: 'txn_001' })])
    );
    // The found entry should be SYNCED
    expect(dbSpy.updateSyncQueueEntry).toHaveBeenCalledWith(
      jasmine.objectContaining({ id: 'sq_txn_001', status: 'SYNCED' })
    );
    // The missing entry should be FAILED (not silently skipped)
    expect(dbSpy.updateSyncQueueEntry).toHaveBeenCalledWith(
      jasmine.objectContaining({ id: 'sq_missing', status: 'FAILED' })
    );
    // Overall status should reflect the failure
    expect(lastStatus.state).toBe('failed');
  });

  it('processSyncQueue: should emit auth_error state on AUTH_ERROR', async () => {
    dbSpy.getPendingSyncItems.and.returnValue(Promise.resolve([mockPendingEntry]));
    sheetsSpy.appendTransactions.and.returnValue(
      Promise.reject(new Error('AUTH_ERROR: No valid access token.'))
    );
    (service as any).RETRY_DELAYS_MS = [0, 0, 0];

    let lastStatus: any;
    service.getSyncStatus().subscribe(s => (lastStatus = s));

    await service.processSyncQueue();
    expect(lastStatus.state).toBe('auth_error');
  });

  // ─── auto-retry on reconnect ──────────────────────────────────────────────

  it('should auto-retry sync queue when connectivity is restored', async () => {
    dbSpy.getPendingSyncItems.and.returnValue(Promise.resolve([mockPendingEntry]));

    // Set initial state to failed/queued
    (service as any).syncStatus$.next({ state: 'failed', message: '' });

    const processSpy = spyOn(service, 'processSyncQueue').and.returnValue(Promise.resolve());

    // Simulate reconnect
    reconnectSubject.next(true);
    await new Promise(r => setTimeout(r, 50));

    expect(processSpy).toHaveBeenCalled();
  });
});
