import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import {
  Chart, CategoryScale, LinearScale, BarController, BarElement,
  Tooltip, Legend, DoughnutController, ArcElement, Title,
} from 'chart.js';
import type { ChartData, ChartOptions } from 'chart.js';
import { DashboardStateService } from '../../core/services/dashboard-state.service';
import { AdPlaceholderComponent } from '../../shared/components/ad-placeholder/ad-placeholder.component';
import { Transaction } from '../../core/models/data-models';

Chart.register(CategoryScale, LinearScale, BarController, BarElement, Tooltip, Legend, DoughnutController, ArcElement, Title);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, DecimalPipe, BaseChartDirective, AdPlaceholderComponent],
  template: `
    <!-- Loading skeleton -->
    <div *ngIf="isLoading()" class="skeleton-container" data-testid="dashboard-skeleton">
      <div class="skeleton-title"></div>
      <div class="skeleton-widgets">
        <div class="skeleton-widget" *ngFor="let i of [1,2,3,4]"></div>
      </div>
      <div class="skeleton-chart"></div>
    </div>

    <!-- Main layout -->
    <div *ngIf="!isLoading()" class="dashboard-layout">

      <!-- Left: sidebar nav -->
      <nav class="sidebar-nav" data-testid="sidebar-nav" aria-label="Main navigation">
        <div class="nav-brand">💰 MoneyInsight</div>
        <a routerLink="/dashboard" class="nav-link active">📊 Dashboard</a>
        <a routerLink="/transactions" class="nav-link">📋 Transactions</a>
        <a routerLink="/import" class="nav-link">⬆️ Import</a>
        <a routerLink="/settings" class="nav-link">⚙️ Settings</a>
      </nav>

      <!-- Center: main content -->
      <main class="main-content">
        <h1 class="dashboard-title">Dashboard</h1>

        <!-- Empty state -->
        <div *ngIf="!summary()" class="empty-state" data-testid="empty-state">
          <div data-testid="empty-dashboard" class="empty-inner">
            <div class="empty-icon">📊</div>
            <p>No transactions yet. Upload a bank statement to get started.</p>
            <a routerLink="/import" class="cta-btn">Upload Statement</a>
          </div>
        </div>

        <!-- Dashboard content (only when data exists) -->
        <ng-container *ngIf="summary()">

          <!-- Period filter -->
          <div class="period-filter" data-testid="period-filter">
            <button
              data-testid="period-btn-all"
              [class.active]="periodFilter() === 'all'"
              (click)="setFilter('all')">All Time</button>
            <button
              data-testid="period-btn-last-month"
              [class.active]="periodFilter() === 'last-month'"
              (click)="setFilter('last-month')">Last Month</button>
            <button
              data-testid="period-btn-last-3-months"
              [class.active]="periodFilter() === 'last-3-months'"
              (click)="setFilter('last-3-months')">Last 3 Months</button>
          </div>

          <!-- Key metric widgets -->
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
                      [data]="doughnutChartData()"
                      [options]="doughnutChartOptions"
                      type="doughnut"
                      aria-label="Category breakdown doughnut chart">
              </canvas>
            </div>
          </div>

          <!-- Dashboard banner ad (728×90) — visible ≥768px -->
          <div class="dashboard-banner-ad-wrapper">
            <app-ad-placeholder
              format="banner"
              placement="dashboard-banner"
              context="banking">
            </app-ad-placeholder>
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

        </ng-container>
      </main>

      <!-- Right: ad sidebar (160×600 skyscraper, desktop only ≥1024px) -->
      <aside class="ad-sidebar">
        <app-ad-placeholder
          format="skyscraper"
          placement="sidebar-skyscraper"
          context="investments">
        </app-ad-placeholder>
      </aside>

    </div>
  `,
  styles: [`
    /* ── Layout ─────────────────────────────────────────── */
    .dashboard-layout {
      display: grid;
      grid-template-columns: 200px 1fr 180px;
      min-height: 100vh;
    }

    @media (max-width: 1023px) {
      .dashboard-layout {
        grid-template-columns: 1fr;
      }
      .ad-sidebar { display: none; }
      .sidebar-nav { display: none; }
    }

    /* ── Sidebar Nav ─────────────────────────────────────── */
    .sidebar-nav {
      background: #1e293b;
      padding: 1.5rem 0;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      position: sticky;
      top: 0;
      height: 100vh;
      overflow-y: auto;
    }

    .nav-brand {
      font-weight: 700;
      color: white;
      padding: 0.75rem 1.25rem 1.25rem;
      font-size: 1rem;
      border-bottom: 1px solid #334155;
      margin-bottom: 0.5rem;
    }

    .nav-link {
      display: block;
      padding: 0.75rem 1.25rem;
      color: #94a3b8;
      text-decoration: none;
      font-size: 0.9rem;
      border-radius: 0;
      transition: background 0.15s, color 0.15s;

      &:hover, &.active {
        background: #334155;
        color: white;
      }
    }

    /* ── Main Content ────────────────────────────────────── */
    .main-content {
      padding: 2rem;
      overflow: hidden;
    }

    .dashboard-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 1.5rem;
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

    /* ── Period Filter ───────────────────────────────────── */
    .period-filter {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;

      button {
        padding: 0.5rem 1rem;
        border: 1px solid #d1d5db;
        border-radius: 20px;
        background: white;
        color: #374151;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.15s;

        &:hover { border-color: #667eea; color: #667eea; }
        &.active {
          background: #667eea;
          color: white;
          border-color: #667eea;
        }
      }
    }

    /* ── Metric Widgets ──────────────────────────────────── */
    .widgets-row {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
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

    /* ── Banner ad ──────────────────────────────────────── */
    .dashboard-banner-ad-wrapper {
      margin: 1.5rem 0;
      display: flex;
      justify-content: center;
    }

    @media (max-width: 767px) {
      .dashboard-banner-ad-wrapper { display: none; }
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

    /* ── Ad Sidebar ──────────────────────────────────────── */
    .ad-sidebar {
      background: #f8fafc;
      padding: 1.5rem 0.75rem;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding-top: 3rem;
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

  summary = this.dashboardStateService.filteredSummary;
  periodFilter = this.dashboardStateService.periodFilter;
  isLoading = this.dashboardStateService.isLoading;

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
    plugins: { legend: { position: 'top' } },
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

  setFilter(range: 'all' | 'last-month' | 'last-3-months'): void {
    this.dashboardStateService.filterByPeriod(range);
  }

  amountClass(txn: Transaction): string {
    if (txn.transactionType === 'INCOME') return 'income';
    if (txn.transactionType === 'EXPENSE') return 'expense';
    return 'transfer';
  }

  async ngOnInit(): Promise<void> {
    if (this.dashboardStateService.transactions().length === 0) {
      await this.dashboardStateService.loadFromIndexedDB();
    }
  }
}

