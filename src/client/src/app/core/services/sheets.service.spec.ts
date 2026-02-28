import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SheetsService } from './sheets.service';
import { AuthService } from './auth.service';
import { IndexedDbService } from './indexeddb.service';
import { Transaction } from '../models/data-models';

/** Drain all pending microtasks via a setTimeout(0) macrotask. */
const flushPromises = (): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, 0));

describe('SheetsService', () => {
  let service: SheetsService;
  let httpMock: HttpTestingController;
  let authSpy: jasmine.SpyObj<AuthService>;
  let dbSpy: jasmine.SpyObj<IndexedDbService>;

  const mockToken = 'mock-access-token';
  const mockSheetId = 'sheet_abc123';

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

  beforeEach(() => {
    authSpy = jasmine.createSpyObj<AuthService>('AuthService', ['getToken']);
    authSpy.getToken.and.returnValue(Promise.resolve(mockToken));

    dbSpy = jasmine.createSpyObj<IndexedDbService>('IndexedDbService', [
      'getSetting',
      'setSetting',
      'updateTransaction',
      'updateRule',
    ]);
    dbSpy.getSetting.and.returnValue(
      Promise.resolve({ key: 'googleSheetId', value: mockSheetId, settingType: 'STRING', updatedAt: '' })
    );
    dbSpy.setSetting.and.returnValue(Promise.resolve('googleSheetId'));
    dbSpy.updateTransaction.and.returnValue(Promise.resolve('txn_001'));
    dbSpy.updateRule.and.returnValue(Promise.resolve('rule_001'));

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        SheetsService,
        { provide: AuthService, useValue: authSpy },
        { provide: IndexedDbService, useValue: dbSpy },
      ],
    });

    service = TestBed.inject(SheetsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ─── appendTransactions ───────────────────────────────────────────────────

  it('appendTransactions: should skip synced transactions', async () => {
    const syncedTxn: Transaction = { ...mockTransaction, synced: true };
    await service.appendTransactions(mockSheetId, [syncedTxn]);
    httpMock.expectNone(r => r.url.includes('Transactions'));
  });

  it('appendTransactions: should POST correct range for unsynced transactions', async () => {
    const appendPromise = service.appendTransactions(mockSheetId, [mockTransaction]);

    // Wait for getToken() microtask so the HTTP request is queued
    await flushPromises();

    const req = httpMock.expectOne(
      r => r.url.includes('values/Transactions') && r.method === 'POST'
    );
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);

    const row = req.request.body.values[0];
    expect(row[0]).toBe('txn_001');      // A: ID
    expect(row[5]).toBe('');             // F: CreditIndicator
    expect(row[6]).toBe('EXPENSE');      // G: TransactionType
    expect(row[7]).toBe('Food');         // H: Category
    expect(row[10]).toBe('PENDING');     // K: Status

    req.flush({});
    await appendPromise;
  });

  it('appendTransactions: should mark transaction as synced in IDB after success', async () => {
    const appendPromise = service.appendTransactions(mockSheetId, [mockTransaction]);
    await flushPromises();
    const req = httpMock.expectOne(r => r.url.includes('values/Transactions') && r.method === 'POST');
    req.flush({});
    await appendPromise;

    expect(dbSpy.updateTransaction).toHaveBeenCalledWith(
      jasmine.objectContaining({ id: 'txn_001', synced: true, status: 'SYNCED' })
    );
  });

  it('appendTransactions: should make 2 POST requests when count exceeds BATCH_SIZE', async () => {
    const batchSize = (service as any).BATCH_SIZE as number;
    const txns: Transaction[] = Array.from({ length: batchSize + 1 }, (_, i) => ({
      ...mockTransaction,
      id: `txn_${i}`,
      synced: false,
    }));

    const appendPromise = service.appendTransactions(mockSheetId, txns);

    // First batch: wait for getToken() and first HTTP call to be issued
    await flushPromises();
    const req1 = httpMock.expectOne(r => r.url.includes('values/Transactions') && r.method === 'POST');
    req1.flush({});

    // Second batch: wait for IDB updates to complete and next HTTP call to be issued
    await flushPromises();
    const req2 = httpMock.expectOne(r => r.url.includes('values/Transactions') && r.method === 'POST');
    req2.flush({});

    await appendPromise;
    expect(dbSpy.updateTransaction).toHaveBeenCalledTimes(batchSize + 1);
  });

  // ─── fetchTransactionIds ──────────────────────────────────────────────────

  it('fetchTransactionIds: should GET column A and return a Set of IDs', async () => {
    const fetchPromise = service.fetchTransactionIds(mockSheetId);

    await flushPromises();
    const req = httpMock.expectOne(r => r.url.includes('values/Transactions') && r.method === 'GET');
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${mockToken}`);
    req.flush({ values: [['txn_001'], ['txn_002']] });

    const ids = await fetchPromise;
    expect(ids.size).toBe(2);
    expect(ids.has('txn_001')).toBeTrue();
    expect(ids.has('txn_002')).toBeTrue();
  });

  it('fetchTransactionIds: should return empty Set when sheet has no data', async () => {
    const fetchPromise = service.fetchTransactionIds(mockSheetId);
    await flushPromises();
    const req = httpMock.expectOne(r => r.url.includes('values/Transactions') && r.method === 'GET');
    req.flush({ values: [] });
    const ids = await fetchPromise;
    expect(ids.size).toBe(0);
  });

  // ─── updateDashboardMetrics ───────────────────────────────────────────────

  it('updateDashboardMetrics: should POST :clear then POST :append for Dashboard_Data', async () => {
    const metricsPromise = service.updateDashboardMetrics(mockSheetId, [
      { period: '2025-01', account: 'ALL', totalIncome: 5000, totalExpense: 3000, netFlow: 2000, updatedAt: null },
    ]);

    // First call: :clear  (wait for getToken() to resolve)
    await flushPromises();
    const clearReq = httpMock.expectOne(r => r.url.includes(':clear') && r.method === 'POST');
    clearReq.flush({});

    // Second call: :append  (issued after :clear resolves)
    await flushPromises();
    const appendReq = httpMock.expectOne(r => r.url.includes('Dashboard_Data') && r.method === 'POST');
    const row = appendReq.request.body.values[0];
    expect(row[0]).toBe('2025-01');   // A: Period
    expect(row[2]).toBe(5000);        // C: TotalIncome
    expect(row[5]).toBeTruthy();      // F: UpdatedAt (non-empty ISO string)
    appendReq.flush({});

    await metricsPromise;
  });

  it('updateDashboardMetrics: should NOT use HTTP DELETE (AD-01)', async () => {
    const metricsPromise = service.updateDashboardMetrics(mockSheetId, []);

    await flushPromises();
    const clearReq = httpMock.expectOne(r => r.url.includes(':clear'));
    expect(clearReq.request.method).toBe('POST'); // must NOT be DELETE (AD-01)
    clearReq.flush({});

    await flushPromises();
    const appendReq = httpMock.expectOne(r => r.url.includes('Dashboard_Data') && r.method === 'POST');
    appendReq.flush({});

    await metricsPromise;
  });
});
