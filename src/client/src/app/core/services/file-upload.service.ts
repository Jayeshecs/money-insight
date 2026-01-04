import { Injectable } from '@angular/core';
import { from, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface FileValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  private readonly SUPPORTED_EXTENSIONS = ['.xlsx', '.xls', '.csv'];
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  validateFile(file: File): FileValidationResult {
    // Check file extension
    const extension = this.getFileExtension(file.name);
    if (!this.SUPPORTED_EXTENSIONS.includes(extension)) {
      return {
        isValid: false,
        errorMessage: 'Only Excel (.xlsx/.xls) and CSV files are supported.'
      };
    }

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        errorMessage: 'File size exceeds 10MB limit.'
      };
    }

    // Check if file size is 0
    if (file.size === 0) {
      return {
        isValid: false,
        errorMessage: 'File is empty. Please select a valid statement file.'
      };
    }

    return { isValid: true };
  }

  readFileAsArrayBuffer(file: File): Observable<ArrayBuffer> {
    return from(this.readFile(file));
  }

  private async readFile(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const result = event.target?.result as ArrayBuffer;
        
        // Check for Excel encryption signatures
        if (this.isEncrypted(result, file)) {
          reject(new Error('Password-protected and encrypted statements are not supported. Please export without encryption.'));
          return;
        }
        
        resolve(result);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file. Please try again.'));
      };
      
      // Read as ArrayBuffer for all file types
      reader.readAsArrayBuffer(file);
    });
  }

  private isEncrypted(content: ArrayBuffer, file: File): boolean {
    // Check for Excel encryption signatures
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      // Check for encryption signatures in binary content
      const bytes = new Uint8Array(content);
      const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
      
      const encryptionSignatures = [
        'EncryptedPackage',
        'EncryptionInfo',
        'Microsoft.Container.EncryptionTransform'
      ];
      
      return encryptionSignatures.some(sig => text.includes(sig));
    }
    
    return false;
  }

  private getFileExtension(fileName: string): string {
    return fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
  }
}
