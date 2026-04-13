import { Component, OnInit, inject, computed, signal, HostListener } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import {
  Chart, CategoryScale, LinearScale, BarController, BarElement,
  Tooltip, Legend, DoughnutController, ArcElement, Title,
  LineController, LineElement, PointElement, Filler,
} from 'chart.js';
import type { ChartData, ChartOptions, ChartEvent, ActiveElement } from 'chart.js';
import { DashboardStateService } from '../../core/services/dashboard-state.service';
import { AdPlaceholderComponent } from '../../shared/components/ad-placeholder/ad-placeholder.component';
import { NetFlowTrendChartComponent } from './widgets/net-flow-trend-chart.component';
import { FabButtonComponent } from '../../shared/components/fab-button/fab-button.component';
import { RulesService } from '../../core/services/rules.service';
import { SheetsService } from '../../core/services/sheets.service';
import { AuthService } from '../../core/services/auth.service';
import { Transaction, WidgetSelection } from '../../core/models/data-models';
import { GranularityBarComponent } from './granularity-bar/granularity-bar.component';
import { OverallSummaryBarComponent } from './overall-summary-bar/overall-summary-bar.component';
import { AnalyticalWidgetComponent } from './widgets/analytical-widget/analytical-widget.component';
import { TransactionsPanelComponent } from './transactions-panel/transactions-panel.component';
import { AppHeaderComponent } from '../../shared/components/app-header/app-header.component';

Chart.register(CategoryScale, LinearScale, BarController, BarElement, Tooltip, Legend, DoughnutController, ArcElement, Title, LineController, LineElement, PointElement, Filler);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, DecimalPipe, FormsModule, BaseChartDirective, AdPlaceholderComponent, NetFlowTrendChartComponent, FabButtonComponent, GranularityBarComponent, OverallSummaryBarComponent, AnalyticalWidgetComponent, TransactionsPanelComponent, AppHeaderComponent],
  template: `
    <!-- Loading skeleton -->
    <div *ngIf="isLoading()" class="skeleton-container pt-3 px-3" data-testid="dashboard-skeleton">
      <div class="skeleton-title"></div>
      <div class="skeleton-widgets">
        <div class="skeleton-widget" *ngFor="let i of [1,2,3,4]"></div>
      </div>
      <div class="skeleton-chart"></div>
    </div>

    <!-- Main layout: full-width top-nav + content -->
    <div *ngIf="!isLoading()">

      <!-- Bootstrap navbar (Story 022) -->
      <app-header data-testid="navbar"></app-header>

      <!-- Main content container -->
      <main class="container-fluid px-3 py-3" data-testid="dashboard-container">

        <!-- Dashboard title row + Sync & Train (desktop) -->
        <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
          <h1 class="h4 mb-0 fw-bold text-dark">Dashboard</h1>
          <button
            class="btn btn-primary btn-sm sync-train-btn"
            data-testid="sync-train-btn"
            [disabled]="syncing() || null"
            (click)="syncAndTrain()">
            @if (syncing()) { ⏳ Syncing… } @else { 🔄 Sync &amp; Train }
          </button>
        </div>

        <!-- Auth error (shown when unauthenticated user attempts sync) -->
        @if (showAuthError()) {
          <div class="auth-error-banner mb-2" data-testid="auth-error" role="alert">
            ⚠️ Please sign in with Google to sync rules.
            <button class="dismiss-btn" (click)="showAuthError.set(false)">✕</button>
          </div>
        }

        <!-- Sync & Train status toast -->
        @if (syncStatus()) {
          <div
            class="sync-status-toast mb-2"
            data-testid="sync-train-status"
            [class.toast-success]="syncStatus()!.startsWith('success')"
            [class.toast-error]="syncStatus() === 'error'"
            [class.toast-info]="syncStatus() === 'loading' || syncStatus() === 'nothing'"
            role="status">
            @if (syncStatus() === 'loading') {
              <span class="toast-spinner" aria-hidden="true">⏳</span> Syncing rules to Google Sheets…
            }
            @if (syncStatus() === 'nothing') {
              <span>ℹ️ Nothing to sync — no active rules.</span>
            }
            @if (syncStatus()!.startsWith('success')) {
              <span>✅ Sync complete ✓ ({{ syncStatus()!.split(':')[1] }} updated)</span>
            }
            @if (syncStatus() === 'error') {
              <span>❌ Sync failed. Please try again.</span>
              <button class="dismiss-btn" (click)="syncStatus.set(null)">✕</button>
            }
          </div>
        }

        <!-- Mobile FAB (< 768 px) -->
        @if (isMobile()) {
          <app-fab-button
            label="Sync &amp; Train"
            icon="🔄"
            [disabled]="syncing()"
            data-testid="sync-train-btn"
            (clicked)="syncAndTrain()">
          </app-fab-button>
        }

        <!-- Empty state -->
        <div *ngIf="!summary()" class="empty-state" data-testid="empty-state">
          <div data-testid="empty-dashboard" class="empty-inner">
            <div class="empty-icon">📊</div>
            <p>No transactions yet. Upload a bank statement to get started.</p>
            <a routerLink="/import" class="cta-btn">Upload Statement</a>
          </div>
        </div>

        <!-- Dashboard content (only when transactions are loaded) -->
        <ng-container *ngIf="transactions().length > 0">

          <!-- Section 1: Granularity Bar (v2.0) -->
          <app-granularity-bar></app-granularity-bar>

          <!-- Section 2: Overall Summary Bar (v2.0) -->
          <app-overall-summary-bar></app-overall-summary-bar>

          <!-- Ad: between Summary and Widgets -->
          <div class="ad-section-divider" aria-hidden="true">
            <app-ad-placeholder
              data-testid="ad-placeholder"
              data-placement="dashboard-summary-banner"
              format="banner"
              placement="dashboard-summary-banner"
              role="complementary"
              tabindex="-1">
            </app-ad-placeholder>
          </div>

          <!-- Section 3: Analytical Tree-Table Widgets (v2.0) — Bootstrap responsive grid -->
          <div class="row g-3" data-testid="widgets-grid">
            <div class="col-12 col-sm-6 col-xl-3">
              <app-analytical-widget
                type="expense"
                [data]="expenseTree()"
                [isAutoOn]="activeAutoWidget() === 'expense'"
                (autoToggled)="onAutoToggle('expense', $event)"
                (rowSelected)="onWidgetRowSelected($event)">
              </app-analytical-widget>
            </div>
            <div class="col-12 col-sm-6 col-xl-3">
              <app-analytical-widget
                type="investment"
                [data]="investmentTree()"
                [isAutoOn]="activeAutoWidget() === 'investment'"
                (autoToggled)="onAutoToggle('investment', $event)"
                (rowSelected)="onWidgetRowSelected($event)">
              </app-analytical-widget>
            </div>
            <div class="col-12 col-sm-6 col-xl-3">
              <app-analytical-widget
                type="income"
                [data]="incomeTree()"
                [isAutoOn]="activeAutoWidget() === 'income'"
                (autoToggled)="onAutoToggle('income', $event)"
                (rowSelected)="onWidgetRowSelected($event)">
              </app-analytical-widget>
            </div>
            <div class="col-12 col-sm-6 col-xl-3">
              <app-analytical-widget
                type="transfer"
                [data]="transferTree()"
                [isAutoOn]="activeAutoWidget() === 'transfer'"
                (autoToggled)="onAutoToggle('transfer', $event)"
                (rowSelected)="onWidgetRowSelected($event)">
              </app-analytical-widget>
            </div>
          </div>

          <!-- Ad: between Widgets and Transactions Panel -->
          <div class="ad-section-divider" aria-hidden="true">
            <app-ad-placeholder
              data-testid="ad-placeholder"
              data-placement="dashboard-widgets-banner"
              format="banner"
              placement="dashboard-widgets-banner"
              role="complementary"
              tabindex="-1">
            </app-ad-placeholder>
          </div>

          <!-- Section 4: Transactions Panel -->
          <app-transactions-panel></app-transactions-panel>

          <!-- Category filter indicator -->
          @if (activeCategoryFilter()) {
            <div class="category-filter-bar">
              <div data-testid="chart-category-filter-active" class="filter-badge">
                📂 Filtered by: <strong>{{ activeCategoryFilter() }}</strong>
              </div>
              <button data-testid="clear-chart-filter"
                      class="clear-filter-btn"
                      (click)="setActiveCategoryFilter(null)">✕ Clear</button>
            </div>
          }

          <!-- Key metric widgets (only when filtered summary has data) -->
          <ng-container *ngIf="summary()">
          <div class="widgets-row">
            <div class="widget widget-income" data-testid="income-widget">
              <span class="widget-label">Total Income</span>
              <span class="widget-value" data-testid="income-amount">
                {{ summary()!.totalCredit | currency:'INR':'symbol-narrow':'1.2-2' }}
              </span>
            </div>
            <div class="widget widget-expense" data-testid="expense-widget">
              <span class="widget-label">Total Expenses</span>
              <span class="widget-value" data-testid="expense-amount">
                {{ summary()!.totalDebit | currency:'INR':'symbol-narrow':'1.2-2' }}
              </span>
            </div>
            <div class="widget" data-testid="net-flow-widget">
              <span class="widget-label">Net Flow</span>
              <span class="widget-value"
                    [class.positive]="summary()!.netFlow >= 0"
                    [class.negative]="summary()!.netFlow < 0"
                    data-testid="net-flow-amount">
                {{ summary()!.netFlow | currency:'INR':'symbol-narrow':'1.2-2' }}
              </span>
              <span class="trend-arrow"
                    [class.trend-up]="trendUp()"
                    [class.trend-down]="!trendUp()"
                    data-testid="trend-arrow">{{ trendUp() ? '▲' : '▼' }}</span>
            </div>
            <div class="widget" data-testid="transaction-count">
              <span class="widget-label">Transactions</span>
              <span class="widget-value">{{ summary()!.transactionCount | number }}</span>
            </div>
          </div>

          <!-- Charts row -->
          <div class="charts-row">
            <div class="chart-card" data-testid="monthly-chart">
              <h3 class="chart-title">Monthly Income vs Expense</h3>
              <canvas baseChart
                      [data]="barChartData()"
                      [options]="barChartOptions"
                      type="bar"
                      aria-label="Monthly income and expense bar chart">
              </canvas>
            </div>
            <div class="chart-card" data-testid="category-chart">
              <h3 class="chart-title">Category Breakdown</h3>
              <canvas baseChart
                      data-testid="category-breakdown-chart"
                      [data]="doughnutChartData()"
                      [options]="doughnutChartOptions"
                      type="doughnut"
                      aria-label="Category breakdown doughnut chart"
                      (chartClick)="onDoughnutClick($event)">
              </canvas>
              <!-- Hidden Playwright test-hook buttons (C5) -->
              @for (cat of doughnutCategories(); track cat) {
                <button [attr.data-testid]="'category-filter-' + cat.toLowerCase().replaceAll(' ', '-')"
                        style="display:none"
                        (click)="setActiveCategoryFilter(cat)">{{ cat }}</button>
              }
            </div>
          </div>

          <!-- Net Flow Trend chart -->
          <div class="chart-card chart-card-full" data-testid="net-flow-trend-section">
            <h3 class="chart-title">Net Flow Trend</h3>
            <app-net-flow-trend-chart></app-net-flow-trend-chart>
          </div>

          <!-- Recent Transactions -->
          <div class="recent-transactions-section">
            <h3 class="section-title">Recent Transactions</h3>
            <table class="recent-txn-table" data-testid="recent-transactions-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Narration</th>
                  <th>Amount</th>
                  <th>Category</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let txn of recentTransactions()" data-testid="transaction-row">
                  <td data-testid="txn-date">{{ txn.date }}</td>
                  <td data-testid="txn-narration" class="narration-cell">{{ txn.narration }}</td>
                  <td data-testid="txn-amount" [class]="amountClass(txn)" class="amount-cell">
                    {{ txn.amount | currency:'INR':'symbol-narrow':'1.2-2' }}
                  </td>
                  <td data-testid="txn-category">{{ txn.category }}</td>
                </tr>
              </tbody>
            </table>
            <a routerLink="/transactions" class="view-all-link" data-testid="view-all-transactions">
              View All Transactions →
            </a>
          </div>
          </ng-container><!-- /summary() -->

        </ng-container><!-- /transactions().length > 0 -->

      </main>

    </div>
  `,
  styles: [`
    /* ── Layout ─────────────────────────────────────────── */
    /* Full-width layout — sidebar removed in Story 022. Bootstrap container-fluid handles padding. */

    /* ── Sync & Train desktop button ─────────────────────── */
    /* Hide desktop sync button on mobile (FAB takes over) */
    @media (max-width: 767px) {
      .sync-train-btn { display: none; }
    }

    /* ── Sync status toast ───────────────────────────────── */
    .sync-status-toast {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .toast-info    { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
    .toast-success { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
    .toast-error   { background: #fef2f2; color: #991b1b; border: 1px solid #fca5a5; }

    .toast-spinner { animation: spin 1s linear infinite; display: inline-block; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .dismiss-btn {
      margin-left: auto;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 0.9rem;
      color: inherit;
      padding: 0 0.25rem;
      opacity: 0.7;
      &:hover { opacity: 1; }
    }

    /* ── Auth error banner ───────────────────────────────── */
    .auth-error-banner {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      background: #fffbeb;
      color: #92400e;
      border: 1px solid #fcd34d;
      font-size: 0.9rem;
    }

    /* ── Empty State ─────────────────────────────────────── */
    .empty-state {
      padding: 5rem 2rem;
    }

    .empty-inner {
      text-align: center;
      background: #f9fafb;
      border-radius: 12px;
      border: 2px dashed #d1d5db;
      padding: 4rem 2rem;

      .empty-icon { font-size: 4rem; margin-bottom: 1rem; }
      p { color: #6b7280; font-size: 1.125rem; margin-bottom: 1.5rem; }
    }

    .cta-btn {
      display: inline-block;
      padding: 0.75rem 2rem;
      background: #667eea;
      color: white;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 500;

      &:hover { background: #5568d3; }
    }

    .category-filter-bar {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .filter-badge {
      font-size: 0.8rem;
      color: #4f46e5;
      background: #eef2ff;
      border: 1px solid #c7d2fe;
      border-radius: 20px;
      padding: 0.3rem 0.85rem;
    }

    .clear-filter-btn {
      padding: 0.3rem 0.85rem;
      border: 1px solid #d1d5db;
      border-radius: 20px;
      background: white;
      color: #6b7280;
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.15s;
      &:hover { border-color: #ef4444; color: #ef4444; }
    }

    .chart-card-full {
      grid-column: 1 / -1;
      margin-bottom: 1.5rem;
    }

    /* ── Metric Widgets ──────────────────────────────────── */
    .widgets-row {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
      margin-top: 1.5rem;
    }

    .widget {
      background: white;
      border-radius: 10px;
      padding: 1.25rem 1.5rem;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
      border-left: 4px solid #667eea;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .widget-income { border-left-color: #10b981; }
    .widget-expense { border-left-color: #ef4444; }

    .widget-label {
      font-size: 0.72rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #6b7280;
    }

    .widget-value {
      font-size: 1.35rem;
      font-weight: 700;
      color: #1f2937;

      &.positive { color: #10b981; }
      &.negative { color: #ef4444; }
    }

    .trend-arrow {
      font-size: 1.1rem;
      font-weight: 700;

      &.trend-up { color: #10b981; }
      &.trend-down { color: #ef4444; }
    }

    /* ── Charts ──────────────────────────────────────────── */
    .charts-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    @media (max-width: 767px) {
      .charts-row { grid-template-columns: 1fr; }
    }

    .chart-card {
      background: white;
      border-radius: 10px;
      padding: 1.25rem;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
    }

    .chart-title {
      font-size: 0.9rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 1rem;
    }

    /* ── Ad Section Dividers ───────────────────────────── */
    .ad-section-divider {
      display: flex;
      justify-content: center;
      margin: 8px 0;
      width: 100%;
      min-height: 90px;
    }

    @media (max-width: 767px) {
      .ad-section-divider { display: none; }
    }

    /* ── Recent Transactions ─────────────────────────────── */
    .recent-transactions-section {
      background: white;
      border-radius: 10px;
      padding: 1.25rem;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
      margin-bottom: 1.5rem;
    }

    .section-title {
      font-size: 0.9rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 1rem;
    }

    .recent-txn-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;

      th {
        text-align: left;
        padding: 0.5rem 0.75rem;
        background: #f9fafb;
        color: #6b7280;
        font-weight: 600;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      td {
        padding: 0.625rem 0.75rem;
        border-bottom: 1px solid #f3f4f6;
        color: #374151;
      }

      tr:last-child td { border-bottom: none; }
    }

    .narration-cell {
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .amount-cell {
      font-weight: 600;
      white-space: nowrap;

      &.income { color: #10b981; }
      &.expense { color: #ef4444; }
      &.transfer { color: #6b7280; }
    }

    .view-all-link {
      display: inline-block;
      margin-top: 1rem;
      color: #667eea;
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 500;

      &:hover { text-decoration: underline; }
    }

    /* ── Skeleton ────────────────────────────────────────── */
    .skeleton-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem;
    }

    .skeleton-title {
      height: 2rem;
      width: 180px;
      background: #e5e7eb;
      border-radius: 6px;
      margin-bottom: 1.5rem;
      animation: pulse 1.5s ease-in-out infinite;
    }

    .skeleton-widgets {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .skeleton-widget {
      height: 90px;
      background: #e5e7eb;
      border-radius: 10px;
      animation: pulse 1.5s ease-in-out infinite;
    }

    .skeleton-chart {
      height: 280px;
      background: #e5e7eb;
      border-radius: 10px;
      animation: pulse 1.5s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    @media (max-width: 640px) {
      .widgets-row { grid-template-columns: 1fr 1fr; }
      .skeleton-widgets { grid-template-columns: 1fr 1fr; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private dashboardStateService = inject(DashboardStateService);
  private rulesService = inject(RulesService);
  private sheetsService = inject(SheetsService);
  readonly authService = inject(AuthService);

  summary = this.dashboardStateService.filteredSummary;
  periodFilter = this.dashboardStateService.periodFilter;
  isLoading = this.dashboardStateService.isLoading;
  activeCategoryFilter = this.dashboardStateService.activeCategoryFilter;
  /** All loaded transactions (before filtering) — used to gate period controls visibility */
  transactions = this.dashboardStateService.transactions;

  // ─── v2.0 Analytical widgets ───────────────────────────────────────────────
  readonly expenseTree = this.dashboardStateService.expenseTree;
  readonly incomeTree = this.dashboardStateService.incomeTree;
  readonly investmentTree = this.dashboardStateService.investmentTree;
  readonly transferTree = this.dashboardStateService.transferTree;
  readonly activeAutoWidget = this.dashboardStateService.activeAutoWidget;

  // ─── Sync & Train state ────────────────────────────────────────────────────
  /** True while the sync operation is in progress; disables the trigger button. */
  syncing = signal(false);

  /**
   * Sync status for the toast:
   * null | 'loading' | 'nothing' | 'success:<count>' | 'error'
   */
  syncStatus = signal<string | null>(null);

  /** Whether to show the auth-error banner (set when unauthenticated user taps sync). */
  showAuthError = signal(false);

  /** True when viewport is < 768 px (controls FAB visibility). */
  isMobile = signal(typeof window !== 'undefined' && window.innerWidth < 768);

  @HostListener('window:resize')
  onResize(): void {
    this.isMobile.set(window.innerWidth < 768);
  }

  // Custom date range state (plain properties so [(ngModel)] works)
  customFrom = '';
  customTo = '';

  get dateRangeError(): boolean {
    return this.periodFilter() === 'custom' &&
           !!this.customFrom && !!this.customTo &&
           this.customFrom > this.customTo;
  }

  recentTransactions = computed(() =>
    [...this.dashboardStateService.filteredTransactions()]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 10)
  );

  trendUp = computed(() => {
    const s = this.summary();
    if (!s || s.previousNetFlow === undefined) return true;
    return s.netFlow >= s.previousNetFlow;
  });

  barChartData = computed<ChartData<'bar'>>(() => {
    const monthlySeries = this.summary()?.monthlySeries;
    if (!monthlySeries) return { labels: [], datasets: [] };
    const entries = Object.entries(monthlySeries)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6);
    return {
      labels: entries.map(([m]) => m),
      datasets: [
        { label: 'Income', data: entries.map(([, v]) => v.income), backgroundColor: 'rgba(16,185,129,0.7)' },
        { label: 'Expense', data: entries.map(([, v]) => v.expense), backgroundColor: 'rgba(239,68,68,0.7)' },
      ],
    };
  });

  barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        callbacks: {
          label: (ctx) => `₹${(ctx.parsed.y ?? 0).toLocaleString('en-IN')}`,
        },
      },
    },
  };

  doughnutChartData = computed<ChartData<'doughnut'>>(() => {
    const breakdown = this.summary()?.categoryBreakdown;
    if (!breakdown) return { labels: [], datasets: [{ data: [] }] };
    const entries = Object.entries(breakdown)
      .sort((a, b) => b[1].totalAmount - a[1].totalAmount)
      .slice(0, 8);
    return {
      labels: entries.map(([name]) => name),
      datasets: [{ data: entries.map(([, s]) => s.totalAmount) }],
    };
  });

  doughnutChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    plugins: { legend: { position: 'right' } },
  };

  doughnutCategories = computed<string[]>(() =>
    (this.doughnutChartData().labels ?? []) as string[]
  );

  setFilter(range: 'all' | 'last-month' | 'last-3-months' | 'custom'): void {
    this.dashboardStateService.filterByPeriod(range);
    // Reset custom dates when switching away from custom
    if (range !== 'custom') {
      this.customFrom = '';
      this.customTo = '';
    }
  }

  onCustomDateChange(): void {
    if (this.customFrom && this.customTo && !this.dateRangeError) {
      this.dashboardStateService.filterByPeriod('custom', this.customFrom, this.customTo);
    } else if (this.periodFilter() === 'custom') {
      // Dates incomplete or invalid — update with current values so signal reacts
      this.dashboardStateService.filterByPeriod('custom', this.customFrom, this.customTo);
    }
  }

  setActiveCategoryFilter(cat: string | null): void {
    this.dashboardStateService.setActiveCategoryFilter(cat);
  }

  // ─── v2.0 Analytical widget handlers ──────────────────────────────────────
  onAutoToggle(type: 'expense' | 'investment' | 'income' | 'transfer', enabled: boolean): void {
    this.dashboardStateService.setAutoWidget(enabled ? type : null);
  }

  onWidgetRowSelected(sel: WidgetSelection): void {
    const autoWidget = this.activeAutoWidget();
    if (autoWidget === sel.type.toLowerCase()) {
      // Auto is ON for this widget type → immediate panel refresh
      this.dashboardStateService.selectWidgetRow(sel);
    } else {
      // Auto is OFF → deferred; record pending, don't update panel yet
      this.dashboardStateService.pendingDrilldownSelection.set(sel);
    }
  }

  onDoughnutClick(event: { event?: ChartEvent; active?: object[] }): void {
    if (!event.active || event.active.length === 0) return;
    const idx = (event.active[0] as ActiveElement).index;
    const labels = this.doughnutChartData().labels;
    const label = labels?.[idx] as string | undefined;
    if (label) {
      this.dashboardStateService.setActiveCategoryFilter(label);
    }
  }

  amountClass(txn: Transaction): string {
    if (txn.transactionType === 'INCOME') return 'income';
    if (txn.transactionType === 'EXPENSE') return 'expense';
    return 'transfer';
  }

  // ─── Sync & Train action ───────────────────────────────────────────────────

  /**
   * Syncs all active rules to Google Sheets (clear-and-rewrite strategy),
   * then re-applies the updated rule set to AI-assigned IDB transactions.
   * Guarded against double-tap via the `syncing` signal.
   */
  async syncAndTrain(): Promise<void> {
    if (this.syncing()) return; // double-tap / re-entry guard

    // Auth check — show error banner instead of proceeding
    if (!this.authService.isAuthenticated) {
      this.showAuthError.set(true);
      return;
    }

    this.syncing.set(true);
    this.syncStatus.set('loading');
    this.showAuthError.set(false);

    try {
      const rules = await this.rulesService.getActiveRules();

      // C8: 0 active rules — skip API call
      if (rules.length === 0) {
        this.syncStatus.set('nothing');
        return;
      }

      await this.sheetsService.syncRules(rules);

      const updated = await this.rulesService.reApplyRulesToAllTransactions();

      // Refresh dashboard widgets with updated categories
      await this.dashboardStateService.reload();

      this.syncStatus.set(`success:${updated}`);
      // C11: auto-dismiss success after 3 s
      setTimeout(() => this.syncStatus.set(null), 3000);
    } catch (err) {
      console.error('[DashboardComponent] syncAndTrain failed:', err);
      // C11: error toast does NOT auto-dismiss
      this.syncStatus.set('error');
    } finally {
      this.syncing.set(false);
    }
  }

  async ngOnInit(): Promise<void> {
    if (this.dashboardStateService.transactions().length === 0) {
      await this.dashboardStateService.loadFromIndexedDB();
    }
  }
}

