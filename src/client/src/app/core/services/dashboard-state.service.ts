import { Injectable, inject, signal, computed } from '@angular/core';
import { Transaction, DashboardSummary, CategoryStats, Granularity, OverallSummary, CategoryTree, WidgetSelection } from '../models/data-models';
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

  // ── v2.0 Granularity & Period signals ────────────────────────────────────
  readonly granularity = signal<Granularity>('monthly');
  readonly pendingPeriodStart = signal<string>('');
  readonly pendingPeriodEnd = signal<string>('');
  readonly activePeriodStart = signal<string>('');
  readonly activePeriodEnd = signal<string>('');
  readonly selectedAccounts = signal<string[]>([]);
  /** Increments every time applyPeriod() is called — even if dates haven't changed. */
  readonly applyCount = signal(0);

  // ── v2.0 Computed signals ────────────────────────────────────────────────

  /** Earliest available transaction month (YYYY-MM). */
  readonly availableDateMin = computed<string>(() => {
    const txns = this.transactions();
    if (txns.length === 0) return new Date().toISOString().substring(0, 7);
    return txns.map(t => t.date.substring(0, 7)).sort()[0];
  });

  /** Latest available transaction month (YYYY-MM). */
  readonly availableDateMax = computed<string>(() => {
    const txns = this.transactions();
    if (txns.length === 0) return new Date().toISOString().substring(0, 7);
    const months = txns.map(t => t.date.substring(0, 7)).sort();
    return months[months.length - 1];
  });

  /** Distinct account/source values across all transactions. */
  readonly availableAccounts = computed<string[]>(() =>
    [...new Set(this.transactions().map(t => t.account).filter(a => !!a))].sort()
  );

  /** Transactions filtered by active period and selected accounts. */
  readonly periodAccountFiltered = computed<Transaction[]>(() => {
    const txns = this.transactions();
    const start = this.activePeriodStart();
    const end = this.activePeriodEnd();
    const accounts = this.selectedAccounts();
    return txns.filter(t => {
      const tMonth = t.date.substring(0, 7);
      return (!start || tMonth >= start) &&
             (!end   || tMonth <= end)   &&
             (accounts.length === 0 || accounts.includes(t.account));
    });
  });

  /** Overall income/expense/investment/transfer totals for the active period. */
  readonly overallSummary = computed<OverallSummary>(() => {
    const filtered = this.periodAccountFiltered();
    return {
      income:     filtered.filter(t => t.transactionType === 'INCOME').reduce((s, t) => s + t.amount, 0),
      expense:    filtered.filter(t => t.transactionType === 'EXPENSE').reduce((s, t) => s + t.amount, 0),
      investment: filtered.filter(t => t.transactionType === 'INVESTMENT').reduce((s, t) => s + t.amount, 0),
      transfer:   filtered.filter(t => t.transactionType === 'TRANSFER').reduce((s, t) => s + t.amount, 0),
    };
  });

  // ── v2.0 Widget selection signals ────────────────────────────────────────
  readonly activeWidgetSelection = signal<WidgetSelection | null>(null);
  readonly activeAutoWidget = signal<'expense' | 'investment' | 'income' | 'transfer' | null>(null);

  /** Row selected in a widget whose Auto toggle is OFF — awaiting manual drilldown confirm. */
  readonly pendingDrilldownSelection = signal<WidgetSelection | null>(null);

  // ── v2.0 CategoryTree computed signals ───────────────────────────────────
  readonly expenseTree = computed<CategoryTree[]>(() => this.buildTree('EXPENSE'));
  readonly incomeTree = computed<CategoryTree[]>(() => this.buildTree('INCOME'));
  readonly investmentTree = computed<CategoryTree[]>(() => this.buildTree('INVESTMENT'));
  readonly transferTree = computed<CategoryTree[]>(() => this.buildTree('TRANSFER'));

  private buildTree(type: string): CategoryTree[] {
    const txns = this.periodAccountFiltered().filter(t => t.transactionType === type);
    const map = new Map<string, Map<string, number>>();
    for (const t of txns) {
      const cat = t.category || 'Uncategorized';
      const sub = t.subCategory || t.category || 'General';
      if (!map.has(cat)) map.set(cat, new Map());
      map.get(cat)!.set(sub, (map.get(cat)!.get(sub) ?? 0) + Math.abs(t.amount));
    }
    return Array.from(map.entries())
      .map(([category, subMap]) => ({
        category,
        total: Array.from(subMap.values()).reduce((s, v) => s + v, 0),
        subCategories: Array.from(subMap.entries())
          .map(([name, total]) => ({ name, total }))
          .sort((a, b) => b.total - a.total),
      }))
      .sort((a, b) => b.total - a.total);
  }

  /** Transactions filtered by active period, accounts, AND active widget selection. */
  readonly widgetFilteredTransactions = computed<Transaction[]>(() => {
    const base = this.periodAccountFiltered();
    const sel = this.activeWidgetSelection();
    if (!sel) return base;
    return base.filter(t => {
      const typeMatch = t.transactionType === sel.type.toUpperCase();
      const catMatch = !sel.category || t.category === sel.category;
      const subMatch = !sel.subCategory || t.subCategory === sel.subCategory;
      return typeMatch && catMatch && subMatch;
    });
  });

  selectWidgetRow(selection: WidgetSelection): void {
    this.activeWidgetSelection.set(selection);
    this.pendingDrilldownSelection.set(null);
  }

  /** Commit a pending (auto-OFF) row selection to the active widget selection. */
  applyPendingDrilldown(): void {
    const pending = this.pendingDrilldownSelection();
    if (pending) {
      this.activeWidgetSelection.set(pending);
      this.pendingDrilldownSelection.set(null);
    }
  }

  setAutoWidget(type: 'expense' | 'investment' | 'income' | 'transfer' | null): void {
    this.activeAutoWidget.set(type);
  }

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

  // ── v2.0 Methods ─────────────────────────────────────────────────────────

  /** Copy pending period values → active; triggers downstream recomputation. */
  applyPeriod(): void {
    this.activePeriodStart.set(this.pendingPeriodStart());
    this.activePeriodEnd.set(this.pendingPeriodEnd());
    this.applyCount.update(n => n + 1);
  }

  /** Update the set of selected accounts and trigger periodAccountFiltered recomputation. */
  setSelectedAccounts(accounts: string[]): void {
    this.selectedAccounts.set(accounts);
  }

  /** Reset pending period to the full available data range. */
  resetPendingToFullRange(): void {
    const txns = this.transactions();
    if (txns.length === 0) return;
    const dates = txns.map(t => t.date.substring(0, 7)).sort();
    this.pendingPeriodStart.set(dates[0]);
    this.pendingPeriodEnd.set(dates[dates.length - 1]);
  }

  updateTransactions(txns: Transaction[]): void {
    this.transactions.set(txns);

    // ── v2.0 initialisation (runs once per load cycle) ──────────────────────
    if (txns.length > 0) {
      // Initialise period range if not yet set
      if (!this.activePeriodStart()) {
        const sortedDates = txns.map(t => t.date.substring(0, 7)).sort();
        const minDate = sortedDates[0];
        const maxDate = sortedDates[sortedDates.length - 1];
        this.pendingPeriodStart.set(minDate);
        this.pendingPeriodEnd.set(maxDate);
        this.activePeriodStart.set(minDate);
        this.activePeriodEnd.set(maxDate);
      }
      // Initialise account selection (select all by default)
      if (this.selectedAccounts().length === 0) {
        const allAccounts = [...new Set(txns.map(t => t.account).filter(a => !!a))].sort();
        this.selectedAccounts.set(allAccounts);
      }
    }

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
    // v2.0 resets
    this.pendingPeriodStart.set('');
    this.pendingPeriodEnd.set('');
    this.activePeriodStart.set('');
    this.activePeriodEnd.set('');
    this.selectedAccounts.set([]);
  }
}
