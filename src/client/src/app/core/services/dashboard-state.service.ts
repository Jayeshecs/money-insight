import { Injectable, inject, signal, computed } from '@angular/core';
import { Transaction, DashboardSummary, CategoryStats } from '../models/data-models';
import { IndexedDbService } from './indexeddb.service';
import { ParsingService } from './parsing.service';
import { get_dashboard_summary } from '../../wasm/pkg/moneyinsight_wasm';

export type PeriodFilter = 'all' | 'last-month' | 'last-3-months' | 'custom';

@Injectable({ providedIn: 'root' })
export class DashboardStateService {
  private parsingService = inject(ParsingService);
  readonly transactions = signal<Transaction[]>([]);
  readonly dashboardSummary = signal<DashboardSummary | null>(null);
  readonly isLoading = signal(false);
  readonly periodFilter = signal<PeriodFilter>('all');
  readonly customDateFrom = signal<string | null>(null);
  readonly customDateTo = signal<string | null>(null);
  readonly activeCategoryFilter = signal<string | null>(null);

  readonly filteredTransactions = computed(() => {
    const txns = this.transactions();
    const period = this.periodFilter();
    if (period === 'all') return txns;
    const now = new Date();
    if (period === 'last-month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      return txns.filter(t => t.date >= start);
    }
    if (period === 'custom') {
      const from = this.customDateFrom();
      const to = this.customDateTo();
      // Dates not yet set or invalid range → show all transactions so summary
      // stays non-null and the date pickers remain visible
      if (!from || !to || from > to) return txns;
      return txns.filter(t => t.date >= from! && t.date <= to!);
    }
    // last-3-months
    const start = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString().split('T')[0];
    return txns.filter(t => t.date >= start);
  });

  /** Monthly net-flow series (last 12 calendar months, zero-filled). C10 compliant. */
  readonly monthlySeries = computed<{ month: string; income: number; expense: number; net: number }[]>(() => {
    const txns = this.filteredTransactions();
    if (txns.length === 0) return [];

    // Aggregate per YYYY-MM key
    const agg: Record<string, { income: number; expense: number }> = {};
    for (const t of txns) {
      const k = t.date.substring(0, 7);
      if (!agg[k]) agg[k] = { income: 0, expense: 0 };
      if (t.transactionType === 'INCOME') agg[k].income += t.amount;
      else if (t.transactionType === 'EXPENSE') agg[k].expense += t.amount;
    }

    // Determine contiguous month range
    const keys = Object.keys(agg).sort();
    const parseYM = (k: string) => { const [y, m] = k.split('-').map(Number); return { y, m }; };
    const { y: y0, m: m0 } = parseYM(keys[0]);
    const { y: yN, m: mN } = parseYM(keys[keys.length - 1]);
    const all: string[] = [];
    let cy = y0, cm = m0;
    while (cy < yN || (cy === yN && cm <= mN)) {
      all.push(`${cy}-${String(cm).padStart(2, '0')}`);
      cm++;
      if (cm > 12) { cm = 1; cy++; }
    }

    // Cap to last 12 months (C3)
    const capped = all.slice(-12);
    return capped.map(k => {
      const d = agg[k] ?? { income: 0, expense: 0 };
      return { month: k, income: d.income, expense: d.expense, net: d.income - d.expense };
    });
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

  filterByPeriod(range: PeriodFilter, from?: string, to?: string): void {
    this.customDateFrom.set(from ?? null);
    this.customDateTo.set(to ?? null);
    this.periodFilter.set(range);
    // C6: clear category drill-down when period changes
    this.activeCategoryFilter.set(null);
  }

  setActiveCategoryFilter(category: string | null): void {
    this.activeCategoryFilter.set(category);
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
      // Ensure WASM is ready before computing get_dashboard_summary
      await this.parsingService.ensureInitialized();
      const txns = await this.indexedDbService.getAllTransactions();
      this.updateTransactions(txns);
    } catch (err) {
      console.error('Failed to load transactions from IndexedDB:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  /** Reload alias — triggers a fresh load from IDB so all computed signals refresh. */
  async reload(): Promise<void> {
    return this.loadFromIndexedDB();
  }

  reset(): void {
    this.transactions.set([]);
    this.dashboardSummary.set(null);
  }
}
