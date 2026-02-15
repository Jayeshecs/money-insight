import { TestBed } from '@angular/core/testing';
import { TransactionUtilsService } from './transaction-utils.service';
import { Transaction } from '../models/data-models';

describe('TransactionUtilsService', () => {
  let service: TransactionUtilsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TransactionUtilsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should format amount correctly for INR', () => {
    expect(service.formatAmount(1000)).toBe('₹1,000.00');
    expect(service.formatAmount(-500.50)).toBe('-₹500.50');
  });

  it('should identify debit vs credit', () => {
    expect(service.getTransactionTypeLabel(-100)).toBe('Debit');
    expect(service.getTransactionTypeLabel(100)).toBe('Credit');
  });

  it('should identify transactions needing review', () => {
    const lowConfidence: Transaction = {
      id: '1',
      date: '2025-01-01',
      account: 'TEST',
      description: 'Test',
      amount: -100,
      category: 'Food',
      confidence: 0.3,
      confidenceLevel: 'LOW',
      status: 'PENDING',
      source: 'TEST',
      tags: [],
      createdAt: '',
      lastModified: '',
      synced: false
    };

    expect(service.needsReview(lowConfidence)).toBe(true);
  });
});
