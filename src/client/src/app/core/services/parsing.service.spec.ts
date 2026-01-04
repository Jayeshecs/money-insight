import { TestBed } from '@angular/core/testing';
import { ParsingService } from './parsing.service';

describe('ParsingService', () => {
  let service: ParsingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ParsingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('mapErrorMessage', () => {
    it('should map "No parser found" error', () => {
      const error = 'No parser found for this file format';
      const mapped = (service as any).mapErrorMessage(error);
      
      expect(mapped).toContain('No parser found');
      expect(mapped).toContain('HDFC');
    });

    it('should map "could not be parsed" error', () => {
      const error = 'File could not be parsed';
      const mapped = (service as any).mapErrorMessage(error);
      
      expect(mapped).toContain('could not be parsed');
      expect(mapped).toContain('check the file');
    });

    it('should map "Header not found" error', () => {
      const error = 'Header not found in file';
      const mapped = (service as any).mapErrorMessage(error);
      
      expect(mapped).toContain('Invalid file format');
      expect(mapped).toContain('corrupted');
    });

    it('should map "No valid transactions" error', () => {
      const error = 'No valid transactions found';
      const mapped = (service as any).mapErrorMessage(error);
      
      expect(mapped).toContain('No valid transactions');
      expect(mapped).toContain('transaction data');
    });

    it('should return original error if no mapping found', () => {
      const error = 'Some unknown error';
      const mapped = (service as any).mapErrorMessage(error);
      
      expect(mapped).toBe(error);
    });
  });

  // Note: Full integration tests would require WASM module to be loaded
  // These tests focus on the service's error handling and mapping logic
});
