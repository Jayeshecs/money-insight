import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FileUploadService } from '../../core/services/file-upload.service';
import { ParsingService } from '../../core/services/parsing.service';
import { IndexedDbService } from '../../core/services/indexeddb.service';
import { TransactionBatch } from '../../core/models/data-models';

interface UploadStatus {
  stage: 'idle' | 'validating' | 'reading' | 'parsing' | 'saving' | 'complete' | 'error';
  message: string;
  progress: number;
  error?: string;
}

@Component({
  selector: 'app-import',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './import.component.html',
  styleUrls: ['./import.component.scss']
})
export class ImportComponent {
  uploadStatus = signal<UploadStatus>({
    stage: 'idle',
    message: 'Ready to upload',
    progress: 0
  });

  selectedFile = signal<File | null>(null);
  dragOver = signal(false);
  parsedBatch = signal<TransactionBatch | null>(null);

  constructor(
    private fileUploadService: FileUploadService,
    private parsingService: ParsingService,
    private indexedDbService: IndexedDbService,
    private router: Router
  ) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  onFileDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(false);

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(false);
  }

  private handleFile(file: File): void {
    this.selectedFile.set(file);
    
    // Validate file
    this.uploadStatus.set({
      stage: 'validating',
      message: 'Validating file...',
      progress: 10
    });

    const validation = this.fileUploadService.validateFile(file);
    if (!validation.isValid) {
      this.uploadStatus.set({
        stage: 'error',
        message: 'Validation failed',
        progress: 0,
        error: validation.errorMessage
      });
      return;
    }

    this.processFile(file);
  }

  private async processFile(file: File): Promise<void> {
    try {
      // Read file
      this.uploadStatus.set({
        stage: 'reading',
        message: 'Reading file...',
        progress: 30
      });

      const fileData = await this.fileUploadService.readFileAsArrayBuffer(file).toPromise();
      
      if (!fileData) {
        throw new Error('Failed to read file');
      }

      // Parse file
      this.uploadStatus.set({
        stage: 'parsing',
        message: 'Parsing transactions with WASM Engine...',
        progress: 50
      });

      const batch = await this.parsingService.parseFile(fileData, file.name).toPromise();
      
      if (!batch) {
        throw new Error('Parsing failed');
      }

      // Save to IndexedDB
      this.uploadStatus.set({
        stage: 'saving',
        message: 'Saving transactions to local database...',
        progress: 75
      });

      await this.indexedDbService.addTransactions(batch.transactions);
      
      // Get database stats
      const stats = await this.indexedDbService.getDatabaseStats();
      console.log('Database stats after save:', stats);

      // Success
      this.parsedBatch.set(batch);
      this.uploadStatus.set({
        stage: 'complete',
        message: `Successfully parsed and saved ${batch.transactions.length} transactions from ${batch.sourceParser}`,
        progress: 100
      });

      // Store in session/state
      sessionStorage.setItem('parsedTransactions', JSON.stringify(batch));
      
      // Don't auto-navigate - let user review results

    } catch (error: any) {
      this.uploadStatus.set({
        stage: 'error',
        message: 'Processing failed',
        progress: 0,
        error: error.message || 'An unexpected error occurred'
      });
    }
  }

  resetUpload(): void {
    this.selectedFile.set(null);
    this.parsedBatch.set(null);
    this.uploadStatus.set({
      stage: 'idle',
      message: 'Ready to upload',
      progress: 0
    });
  }
}
