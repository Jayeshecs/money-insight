import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ImportComponent } from './import.component';
import { FileUploadService } from '../../core/services/file-upload.service';
import { ParsingService } from '../../core/services/parsing.service';
import { Router } from '@angular/router';

describe('ImportComponent', () => {
  let component: ImportComponent;
  let fixture: ComponentFixture<ImportComponent>;
  let mockFileUploadService: jasmine.SpyObj<FileUploadService>;
  let mockParsingService: jasmine.SpyObj<ParsingService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    mockFileUploadService = jasmine.createSpyObj('FileUploadService', ['validateFile', 'readFileAsArrayBuffer']);
    mockParsingService = jasmine.createSpyObj('ParsingService', ['parseFile']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [ImportComponent],
      providers: [
        { provide: FileUploadService, useValue: mockFileUploadService },
        { provide: ParsingService, useValue: mockParsingService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with idle status', () => {
    expect(component.uploadStatus().stage).toBe('idle');
    expect(component.uploadStatus().progress).toBe(0);
  });

  it('should handle file drop', () => {
    const file = new File(['content'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const mockEvent = {
      preventDefault: jasmine.createSpy('preventDefault'),
      stopPropagation: jasmine.createSpy('stopPropagation'),
      dataTransfer: { files: [file] }
    } as any;

    mockFileUploadService.validateFile.and.returnValue({ isValid: true });

    component.onFileDrop(mockEvent);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(component.selectedFile()).toBe(file);
  });

  it('should set drag over state', () => {
    const mockEvent = {
      preventDefault: jasmine.createSpy('preventDefault'),
      stopPropagation: jasmine.createSpy('stopPropagation')
    } as any;

    component.onDragOver(mockEvent);

    expect(component.dragOver()).toBe(true);
    expect(mockEvent.preventDefault).toHaveBeenCalled();
  });

  it('should reset drag over state on drag leave', () => {
    const mockEvent = {
      preventDefault: jasmine.createSpy('preventDefault'),
      stopPropagation: jasmine.createSpy('stopPropagation')
    } as any;

    component.dragOver.set(true);
    component.onDragLeave(mockEvent);

    expect(component.dragOver()).toBe(false);
  });

  it('should show error on validation failure', () => {
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    mockFileUploadService.validateFile.and.returnValue({ 
      isValid: false, 
      errorMessage: 'Only Excel (.xlsx/.xls) and CSV files are supported.' 
    });

    (component as any).handleFile(file);

    expect(component.uploadStatus().stage).toBe('error');
    expect(component.uploadStatus().error).toContain('Excel');
  });

  it('should reset upload state', () => {
    component.selectedFile.set(new File(['content'], 'test.xlsx', { type: 'application/octet-stream' }));
    component.uploadStatus.set({ stage: 'error', message: 'Error', progress: 0, error: 'Test error' });

    component.resetUpload();

    expect(component.selectedFile()).toBeNull();
    expect(component.uploadStatus().stage).toBe('idle');
    expect(component.uploadStatus().progress).toBe(0);
  });
});
