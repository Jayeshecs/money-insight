import { Injectable, signal, computed } from '@angular/core';
import { Transaction, DashboardSummary, CategoryStats } from '../models/data-models';
import { IndexedDbService } from './indexeddb.service';
import { get_dashboard_summary } from '../../wasm/pkg/moneyinsight_wasm';

export type PeriodFilter = 'all' | 'last-month' | 'last-3-months';

@Injectable({ providedIn: 'root' })
export class DashboardStateService {
  readonly transactions = signal<Transaction[]>([]);
  readonly dashboardSummary = signal<DashboardSummary | null>(null);
  readonly isLoading = signal(false);
  readonly periodFilter = signal<PeriodFilter>('all');

  readonly filteredTransactions = computed(() => {
    const txns = this.transactions();
    const period = this.periodFilter();
    if (period === 'all') return txns;
    const now = new Date();
    if (period === 'last-month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      return txns.filter(t => t.date >= start);
    }
    // last-3-months
    const start = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString().split('T')[0];
    return txns.filter(t => t.date >= start);
  });

  readonly filteredSummary = computed<DashboardSummary | null>(() => {
    const filtered = this.filteredTransactions();
    if (filtered.length === 0) return null;

    const totalCredit = filtered
      .filter(t => t.transactionType === 'INCOME')
      .reduce((s, t) => s + t.amount, 0);
    const totalDebit = filtered
      .filter(t => t.transactionType === 'EXPENSE')
      .reduce((s, t) => s + t.amount, 0);

    // Monthly series
    const monthlySeries: Record<string, { income: number; expense: number }> = {};
    for (const t of filtered) {
      const month = t.date.substring(0, 7);
      if (!monthlySeries[month]) monthlySeries[month] = { income: 0, expense: 0 };
      if (t.transactionType === 'INCOME') monthlySeries[month].income += t.amount;
      else if (t.transactionType === 'EXPENSE') monthlySeries[month].expense += t.amount;
    }

    // Previous period net flow
    const allTxns = this.transactions();
    const period = this.periodFilter();
    let previousNetFlow = 0;
    const now = new Date();
    if (period === 'last-month') {
      const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
      const prev = allTxns.filter(t => t.date >= prevStart && t.date <= prevEnd);
      previousNetFlow =
        prev.filter(t => t.transactionType === 'INCOME').reduce((s, t) => s + t.amount, 0) -
        prev.filter(t => t.transactionType === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
    } else if (period === 'last-3-months') {
      const prevStart = new Date(now.getFullYear(), now.getMonth() - 6, 1).toISOString().split('T')[0];
      const prevEnd = new Date(now.getFullYear(), now.getMonth() - 3, 0).toISOString().split('T')[0];
      const prev = allTxns.filter(t => t.date >= prevStart && t.date <= prevEnd);
      previousNetFlow =
        prev.filter(t => t.transactionType === 'INCOME').reduce((s, t) => s + t.amount, 0) -
        prev.filter(t => t.transactionType === 'EXPENSE').reduce((s, t) => s + t.amount, 0);
    }

    // Category breakdown
    const categoryBreakdown: Record<string, CategoryStats> = {};
    for (const t of filtered) {
      if (!categoryBreakdown[t.category]) categoryBreakdown[t.category] = { totalAmount: 0, count: 0, percentage: 0 };
      categoryBreakdown[t.category].totalAmount += t.amount;
      categoryBreakdown[t.category].count++;
    }
    const totalForPct = Object.values(categoryBreakdown).reduce((s, c) => s + c.totalAmount, 0);
    for (const cat of Object.values(categoryBreakdown)) {
      cat.percentage = totalForPct > 0 ? (cat.totalAmount / totalForPct) * 100 : 0;
    }

    const sorted = [...filtered].sort((a, b) => a.date.localeCompare(b.date));
    return {
      transactionCount: filtered.length,
      totalCredit,
      totalDebit,
      netFlow: totalCredit - totalDebit,
      categoryBreakdown,
      sourceBreakdown: {},
      period: sorted.length > 0 ? { fromDate: sorted[0].date, toDate: sorted[sorted.length - 1].date } : null,
      monthlySeries,
      previousNetFlow,
    };
  });

  constructor(private indexedDbService: IndexedDbService) {}

  filterByPeriod(range: PeriodFilter): void {
    this.periodFilter.set(range);
  }

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
    this.isLoading.set(true);
    try {
      const txns = await this.indexedDbService.getAllTransactions();
      this.updateTransactions(txns);
    } catch (err) {
      console.error('Failed to load transactions from IndexedDB:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  reset(): void {
    this.transactions.set([]);
    this.dashboardSummary.set(null);
  }
}
