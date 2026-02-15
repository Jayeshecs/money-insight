import { TestBed } from '@angular/core/testing';
import { IndexedDbService } from './indexeddb.service';

describe('IndexedDbService', () => {
  let service: IndexedDbService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IndexedDbService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize database', async () => {
    const stats = await service.getDatabaseStats();
    expect(stats).toBeDefined();
    expect(stats.transactions).toBeGreaterThanOrEqual(0);
  });
});
