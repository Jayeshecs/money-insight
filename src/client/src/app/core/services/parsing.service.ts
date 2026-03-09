import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

// Import WASM module
import init, { WasmEngine } from '../../wasm/pkg/moneyinsight_wasm';

// Import data models
import { Transaction, TransactionBatch } from '../models/data-models';

@Injectable({
  providedIn: 'root'
})
export class ParsingService {
  private wasmEngine: WasmEngine | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.initPromise = this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Initialize WASM with correct path for Angular dev server
      await init('/wasm/pkg/moneyinsight_wasm_bg.wasm');
      this.wasmEngine = new WasmEngine();
      console.log('WASM Engine initialized successfully');
    } catch (error) {
      console.error('Failed to initialize WASM engine:', error);
      throw new Error('Failed to initialize parsing engine. Please refresh the page.');
    }
  }

  /** Awaits WASM initialisation. Safe to call multiple times (resolves immediately once loaded). */
  async ensureInitialized(): Promise<void> {
    if (this.initPromise) {
      await this.initPromise;
    }
  }

  parseFile(fileData: ArrayBuffer, fileName: string): Observable<TransactionBatch> {
    return from(this.parseFileAsync(fileData, fileName));
  }

  private async parseFileAsync(fileData: ArrayBuffer, fileName: string): Promise<TransactionBatch> {
    // Ensure WASM is initialized
    if (this.initPromise) {
      await this.initPromise;
    }

    if (!this.wasmEngine) {
      throw new Error('WASM engine not initialized');
    }

    try {
      // Convert ArrayBuffer to Uint8Array for WASM
      const uint8Array = new Uint8Array(fileData);
      const resultJson = this.wasmEngine.parse_file(uint8Array, fileName);
      const batch: TransactionBatch = JSON.parse(resultJson);
      
      if (batch.error) {
        throw new Error(batch.error);
      }
      
      return batch;
    } catch (error: any) {
      console.log('Error during parsing:', error);
      // Map WASM errors to user-friendly messages
      throw new Error(this.mapErrorMessage(error.message || error.toString()));
    }
  }

  listAvailableParsers(): Observable<string[]> {
    return from(this.listParsersAsync());
  }

  private async listParsersAsync(): Promise<string[]> {
    if (this.initPromise) {
      await this.initPromise;
    }

    if (!this.wasmEngine) {
      throw new Error('WASM engine not initialized');
    }

    return this.wasmEngine.list_parsers();
  }

  private mapErrorMessage(error: string): string {
    console.error('Parsing error:', error);
    if (error.includes('No parser found')) {
      return 'No parser found for this file format. Please ensure you\'re uploading a valid HDFC Savings or Credit Card statement.';
    }
    
    if (error.includes('Header not found')) {
      return 'Invalid file format. The statement appears to be corrupted or in an unsupported format.';
    }
    
    if (error.includes('No valid transactions')) {
      return 'No valid transactions found in the statement. Please ensure the file contains transaction data.';
    }
    
    if (error.includes('could not be parsed')) {
      return 'File could not be parsed. Please check the file and try again.';
    }
    
    return error;
  }
}
