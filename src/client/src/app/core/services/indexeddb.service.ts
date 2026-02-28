import { Injectable } from '@angular/core';
import { openDB, IDBPDatabase } from 'idb';
import { 
  Transaction, 
  Rule, 
  Model, 
  SyncQueueEntry, 
  Setting 
} from '../models/data-models';

// IndexedDB Schema Definition
// Using any to avoid idb v8 strict type checking issues
interface MoneyInsightDB {
  transactions: {
    key: string;
    value: Transaction;
    indexes: {
      'by-date': string;
      'by-account': string;
      'by-category': string;
      'by-status': string;
      'by-confidence': string;
      'by-synced': boolean;
      'by-date-account': [string, string];
      'by-lastModified': string;
    };
  };
  rules: {
    key: string;
    value: Rule;
    indexes: {
      'by-pattern': string;
      'by-category': string;
      'by-priority': number;
      'by-active': boolean;
      'by-source': string;
    };
  };
  models: {
    key: string;
    value: Model;
    indexes: {
      'by-version': string;
      'by-lastTrained': string;
    };
  };
  syncQueue: {
    key: string;
    value: SyncQueueEntry;
    indexes: {
      'by-status': string;
      'by-createdAt': string;
      'by-entityId': string;
    };
  };
  settings: {
    key: string;
    value: Setting;
  };
}

@Injectable({
  providedIn: 'root'
})
export class IndexedDbService {
  private dbName = 'MoneyInsightDB';
  private dbVersion = 3; // Incremented for creditIndicator field
  private db: IDBPDatabase<MoneyInsightDB> | null = null;

  constructor() {
    this.initDatabase();
  }

  private async initDatabase(): Promise<IDBPDatabase<MoneyInsightDB>> {
    if (this.db) {
      return this.db;
    }

    this.db = await openDB<MoneyInsightDB>(this.dbName, this.dbVersion, {
      upgrade(db: any, oldVersion: number, newVersion: number | null, transaction: any) {
        console.log(`Upgrading IndexedDB from version ${oldVersion} to ${newVersion}`);

        // Create transactions store
        if (!db.objectStoreNames.contains('transactions')) {
          const txnStore = db.createObjectStore('transactions', { keyPath: 'id' });
          txnStore.createIndex('by-date', 'date');
          txnStore.createIndex('by-account', 'account');
          txnStore.createIndex('by-category', 'category');
          txnStore.createIndex('by-transactionType', 'transactionType');
          txnStore.createIndex('by-creditIndicator', 'creditIndicator');
          txnStore.createIndex('by-status', 'status');
          txnStore.createIndex('by-confidence', 'confidenceLevel');
          txnStore.createIndex('by-synced', 'synced');
          txnStore.createIndex('by-date-account', ['date', 'account']);
          txnStore.createIndex('by-lastModified', 'lastModified');
        } else if (oldVersion < 2) {
          // Migration: Add transactionType index if upgrading from version 1
          const txnStore = transaction.objectStore('transactions');
          if (!txnStore.indexNames.contains('by-transactionType')) {
            txnStore.createIndex('by-transactionType', 'transactionType');
          }
        } else if (oldVersion < 3) {
          // Migration: Add creditIndicator index if upgrading from version 2
          const txnStore = transaction.objectStore('transactions');
          if (!txnStore.indexNames.contains('by-creditIndicator')) {
            txnStore.createIndex('by-creditIndicator', 'creditIndicator');
          }
        }

        // Create rules store
        if (!db.objectStoreNames.contains('rules')) {
          const ruleStore = db.createObjectStore('rules', { keyPath: 'id' });
          ruleStore.createIndex('by-pattern', 'pattern');
          ruleStore.createIndex('by-category', 'category');
          ruleStore.createIndex('by-priority', 'priority');
          ruleStore.createIndex('by-active', 'active');
          ruleStore.createIndex('by-source', 'source');
        }

        // Create models store
        if (!db.objectStoreNames.contains('models')) {
          const modelStore = db.createObjectStore('models', { keyPath: 'id' });
          modelStore.createIndex('by-version', 'version');
          modelStore.createIndex('by-lastTrained', 'lastTrained');
        }

        // Create sync queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          syncStore.createIndex('by-status', 'status');
          syncStore.createIndex('by-createdAt', 'createdAt');
          syncStore.createIndex('by-entityId', 'entityId');
        }

        // Create settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      },
    });

    console.log('IndexedDB initialized successfully');
    return this.db;
  }

  // ==================== Transaction Operations ====================

  async addTransaction(transaction: Transaction): Promise<string> {
    const db = await this.initDatabase();
    return (await db.add('transactions', transaction)) as string;
  }

  async addTransactions(transactions: Transaction[]): Promise<void> {
    const db = await this.initDatabase();
    const tx = db.transaction('transactions', 'readwrite');
    
    await Promise.all([
      ...transactions.map(txn => tx.store.add(txn)),
      tx.done
    ]);
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    const db = await this.initDatabase();
    return await db.get('transactions', id);
  }

  async getAllTransactions(): Promise<Transaction[]> {
    const db = await this.initDatabase();
    return await db.getAll('transactions');
  }

  async getTransactionsByDateRange(startDate: string, endDate: string): Promise<Transaction[]> {
    const db = await this.initDatabase();
    const index = db.transaction('transactions').store.index('by-date');
    const range = IDBKeyRange.bound(startDate, endDate);
    return await index.getAll(range);
  }

  async getTransactionsByAccount(account: string): Promise<Transaction[]> {
    const db = await this.initDatabase();
    return await db.getAllFromIndex('transactions', 'by-account', account);
  }

  async getTransactionsByStatus(status: string): Promise<Transaction[]> {
    const db = await this.initDatabase();
    return await db.getAllFromIndex('transactions', 'by-status', status);
  }

  async getUnsyncedTransactions(): Promise<Transaction[]> {
    const db = await this.initDatabase();
    // Query for unsynced transactions (synced = false)
    const tx = db.transaction('transactions');
    const index = tx.store.index('by-synced');
    const results: Transaction[] = [];
    
    let cursor = await index.openCursor(0); // 0 represents false in IndexedDB
    while (cursor) {
      results.push(cursor.value);
      cursor = await cursor.continue();
    }
    
    return results;
  }

  async updateTransaction(transaction: Transaction): Promise<string> {
    const db = await this.initDatabase();
    transaction.lastModified = new Date().toISOString();
    return (await db.put('transactions', transaction)) as string;
  }

  async deleteTransaction(id: string): Promise<void> {
    const db = await this.initDatabase();
    await db.delete('transactions', id);
  }

  async getTransactionCount(): Promise<number> {
    const db = await this.initDatabase();
    return await db.count('transactions');
  }

  // ==================== Rule Operations ====================

  async addRule(rule: Rule): Promise<string> {
    const db = await this.initDatabase();
    return (await db.add('rules', rule)) as string;
  }

  async getAllRules(): Promise<Rule[]> {
    const db = await this.initDatabase();
    return await db.getAll('rules');
  }

  async getActiveRules(): Promise<Rule[]> {
    const db = await this.initDatabase();
    // Query for active rules (active = true)
    const tx = db.transaction('rules');
    const index = tx.store.index('by-active');
    const results: Rule[] = [];
    
    let cursor = await index.openCursor(1); // 1 represents true in IndexedDB
    while (cursor) {
      results.push(cursor.value);
      cursor = await cursor.continue();
    }
    
    return results;
  }

  async updateRule(rule: Rule): Promise<string> {
    const db = await this.initDatabase();
    rule.lastModified = new Date().toISOString();
    return (await db.put('rules', rule)) as string;
  }

  async deleteRule(id: string): Promise<void> {
    const db = await this.initDatabase();
    await db.delete('rules', id);
  }

  // ==================== Model Operations ====================

  async addModel(model: Model): Promise<string> {
    const db = await this.initDatabase();
    return (await db.add('models', model)) as string;
  }

  async getModel(id: string): Promise<Model | undefined> {
    const db = await this.initDatabase();
    return await db.get('models', id);
  }

  async updateModel(model: Model): Promise<string> {
    const db = await this.initDatabase();
    return (await db.put('models', model)) as string;
  }

  // ==================== Sync Queue Operations ====================

  async addToSyncQueue(entry: SyncQueueEntry): Promise<string> {
    const db = await this.initDatabase();
    return (await db.add('syncQueue', entry)) as string;
  }

  async getPendingSyncItems(): Promise<SyncQueueEntry[]> {
    const db = await this.initDatabase();
    return await db.getAllFromIndex('syncQueue', 'by-status', 'PENDING');
  }

  async updateSyncQueueEntry(entry: SyncQueueEntry): Promise<string> {
    const db = await this.initDatabase();
    return (await db.put('syncQueue', entry)) as string;
  }

  /**
   * Resets all FAILED sync-queue entries back to PENDING so they will be
   * picked up on the next processSyncQueue() call (e.g. when user presses
   * "Retry Sync" or connectivity is restored).
   */
  async resetFailedSyncItems(): Promise<void> {
    const db = await this.initDatabase();
    const failed = await db.getAllFromIndex('syncQueue', 'by-status', 'FAILED');
    if (failed.length === 0) return;
    const tx = db.transaction('syncQueue', 'readwrite');
    await Promise.all([
      ...failed.map(entry => tx.store.put({ ...entry, status: 'PENDING', lastError: null })),
      tx.done,
    ]);
  }

  async deleteSyncQueueEntry(id: string): Promise<void> {
    const db = await this.initDatabase();
    await db.delete('syncQueue', id);
  }

  // ==================== Settings Operations ====================

  async getSetting(key: string): Promise<Setting | undefined> {
    const db = await this.initDatabase();
    return await db.get('settings', key);
  }

  async setSetting(setting: Setting): Promise<string> {
    const db = await this.initDatabase();
    setting.updatedAt = new Date().toISOString();
    return (await db.put('settings', setting)) as string;
  }

  async getAllSettings(): Promise<Setting[]> {
    const db = await this.initDatabase();
    return await db.getAll('settings');
  }

  // ==================== Utility Operations ====================

  async clearAllData(): Promise<void> {
    const db = await this.initDatabase();
    const tx = db.transaction(['transactions', 'rules', 'models', 'syncQueue', 'settings'], 'readwrite');
    
    await Promise.all([
      tx.objectStore('transactions').clear(),
      tx.objectStore('rules').clear(),
      tx.objectStore('models').clear(),
      tx.objectStore('syncQueue').clear(),
      tx.objectStore('settings').clear(),
      tx.done
    ]);
  }

  async getDatabaseStats(): Promise<{
    transactions: number;
    rules: number;
    models: number;
    syncQueue: number;
    settings: number;
  }> {
    const db = await this.initDatabase();
    
    return {
      transactions: await db.count('transactions'),
      rules: await db.count('rules'),
      models: await db.count('models'),
      syncQueue: await db.count('syncQueue'),
      settings: await db.count('settings')
    };
  }
}
