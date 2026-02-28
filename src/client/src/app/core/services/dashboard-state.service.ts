import { Injectable, signal } from '@angular/core';
import { Transaction, DashboardSummary } from '../models/data-models';
import { IndexedDbService } from './indexeddb.service';
import { get_dashboard_summary } from '../../wasm/pkg/moneyinsight_wasm';

@Injectable({ providedIn: 'root' })
export class DashboardStateService {
  readonly transactions = signal<Transaction[]>([]);
  readonly dashboardSummary = signal<DashboardSummary | null>(null);

  constructor(private indexedDbService: IndexedDbService) {}

  updateTransactions(txns: Transaction[]): void {
    this.transactions.set(txns);
    if (txns.length === 0) {
      this.dashboardSummary.set(null);
      return;
    }
    try {
      const summaryJson = get_dashboard_summary(JSON.stringify(txns));
      const summary: DashboardSummary = JSON.parse(summaryJson);
      this.dashboardSummary.set(summary);
    } catch (err) {
      console.error('Failed to compute dashboard summary:', err);
      this.dashboardSummary.set(null);
    }
  }

  async loadFromIndexedDB(): Promise<void> {
    try {
      const txns = await this.indexedDbService.getAllTransactions();
      this.updateTransactions(txns);
    } catch (err) {
      console.error('Failed to load transactions from IndexedDB:', err);
    }
  }

  reset(): void {
    this.transactions.set([]);
    this.dashboardSummary.set(null);
  }
}
