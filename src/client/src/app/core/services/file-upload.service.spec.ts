import { TestBed } from '@angular/core/testing';
import { FileUploadService } from './file-upload.service';

describe('FileUploadService', () => {
  let service: FileUploadService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FileUploadService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('validateFile', () => {
    it('should reject PDF files', () => {
      const file = new File(['content'], 'statement.pdf', { type: 'application/pdf' });
      const result = service.validateFile(file);
      
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Only Excel (.xlsx/.xls) and CSV files are supported.');
    });

    it('should reject TXT files', () => {
      const file = new File(['content'], 'statement.txt', { type: 'text/plain' });
      const result = service.validateFile(file);
      
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('Only Excel (.xlsx/.xls) and CSV files are supported.');
    });

    it('should accept XLSX files', () => {
      const file = new File(['content'], 'statement.xlsx', { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const result = service.validateFile(file);
      
      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should accept XLS files', () => {
      const file = new File(['content'], 'statement.xls', { 
        type: 'application/vnd.ms-excel' 
      });
      const result = service.validateFile(file);
      
      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should accept CSV files', () => {
      const file = new File(['content'], 'statement.csv', { type: 'text/csv' });
      const result = service.validateFile(file);
      
      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
    });

    it('should reject files over 10MB', () => {
      const largeContent = new Array(11 * 1024 * 1024).fill('a').join('');
      const file = new File([largeContent], 'large.xlsx', { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const result = service.validateFile(file);
      
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('10MB');
    });

    it('should reject empty files', () => {
      const file = new File([], 'empty.xlsx', { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const result = service.validateFile(file);
      
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('empty');
    });

    it('should handle mixed case extensions', () => {
      const file = new File(['content'], 'statement.XLSX', { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const result = service.validateFile(file);
      
      expect(result.isValid).toBe(true);
    });
  });

  describe('getFileExtension', () => {
    it('should extract extension from filename', () => {
      const file = new File(['content'], 'statement.xlsx', { type: 'application/octet-stream' });
      const result = service.validateFile(file);
      
      expect(result.isValid).toBe(true);
    });

    it('should handle filenames with multiple dots', () => {
      const file = new File(['content'], 'bank.statement.2024.csv', { type: 'text/csv' });
      const result = service.validateFile(file);
      
      expect(result.isValid).toBe(true);
    });
  });
});
