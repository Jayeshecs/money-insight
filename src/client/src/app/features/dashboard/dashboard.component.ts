import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardStateService } from '../../core/services/dashboard-state.service';
import { CategoryStats } from '../../core/models/data-models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, DecimalPipe],
  template: `
    <div class="dashboard-container">
      <h1 class="dashboard-title">Dashboard</h1>

      <!-- Empty State -->
      <div *ngIf="!summary()" class="empty-state" data-testid="empty-state">
        <div class="empty-icon">📊</div>
        <p>No transactions yet. Upload a bank statement to get started.</p>
        <a routerLink="/import" class="cta-btn">Upload Statement</a>
      </div>

      <!-- Dashboard Widgets -->
      <div *ngIf="summary()" class="widgets-grid">

        <!-- Date Range -->
        <div class="widget widget-full" *ngIf="summary()!.period" data-testid="date-range">
          <span class="widget-label">Period</span>
          <span class="widget-value date-value">
            {{ summary()!.period!.fromDate }} &mdash; {{ summary()!.period!.toDate }}
          </span>
        </div>

        <!-- Transaction Count -->
        <div class="widget" data-testid="transaction-count">
          <span class="widget-label">Transactions</span>
          <span class="widget-value">{{ summary()!.transactionCount | number }}</span>
        </div>

        <!-- Total Credit -->
        <div class="widget widget-credit" data-testid="total-credit">
          <span class="widget-label">Total Credit</span>
          <span class="widget-value">{{ summary()!.totalCredit | currency:'INR':'symbol-narrow':'1.2-2' }}</span>
        </div>

        <!-- Total Debit -->
        <div class="widget widget-debit" data-testid="total-debit">
          <span class="widget-label">Total Debit</span>
          <span class="widget-value">{{ summary()!.totalDebit | currency:'INR':'symbol-narrow':'1.2-2' }}</span>
        </div>

        <!-- Net Flow -->
        <div class="widget"
             [style.border-left-color]="summary()!.netFlow >= 0 ? '#10b981' : '#ef4444'"
             data-testid="net-flow">
          <span class="widget-label">Net Flow</span>
          <span class="widget-value"
                [style.color]="summary()!.netFlow >= 0 ? '#10b981' : '#ef4444'">
            {{ summary()!.netFlow | currency:'INR':'symbol-narrow':'1.2-2' }}
          </span>
        </div>

        <!-- Category Breakdown (top 5) -->
        <div class="widget widget-full category-widget" data-testid="category-breakdown">
          <span class="widget-label">Top Categories by Spending</span>
          <div class="category-list">
            <div class="category-row" *ngFor="let cat of top5Categories()">
              <div class="category-name">{{ cat.name }}</div>
              <div class="category-bar-wrap">
                <div class="category-bar" [style.width.%]="cat.percentage"></div>
              </div>
              <div class="category-amount">
                {{ cat.totalAmount | currency:'INR':'symbol-narrow':'1.2-2' }}
                <span class="category-count">({{ cat.count }})</span>
              </div>
            </div>
            <div class="no-categories" *ngIf="top5Categories().length === 0">
              No category data available.
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      max-width: 1100px;
      margin: 0 auto;
      padding: 2rem;
    }

    .dashboard-title {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 2rem;
      color: #1f2937;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 5rem 2rem;
      background: #f9fafb;
      border-radius: 12px;
      border: 2px dashed #d1d5db;

      .empty-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
      }

      p {
        color: #6b7280;
        font-size: 1.125rem;
        margin-bottom: 1.5rem;
      }

      .cta-btn {
        display: inline-block;
        padding: 0.75rem 2rem;
        background: #667eea;
        color: white;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 500;
        transition: background 0.2s;

        &:hover { background: #5568d3; }
      }
    }

    /* Widgets grid */
    .widgets-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 1.25rem;
    }

    .widget {
      background: white;
      border-radius: 10px;
      padding: 1.25rem 1.5rem;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
      border-left: 4px solid #667eea;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .widget-full {
      grid-column: 1 / -1;
    }

    .widget-credit { border-left-color: #10b981; }
    .widget-debit  { border-left-color: #ef4444; }

    .widget-label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #6b7280;
    }

    .widget-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1f2937;
    }

    .date-value {
      font-size: 1rem;
      font-weight: 500;
    }

    /* Category breakdown */
    .category-widget .widget-label {
      margin-bottom: 0.75rem;
    }

    .category-list {
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
    }

    .category-row {
      display: grid;
      grid-template-columns: 160px 1fr 180px;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.9rem;
    }

    .category-name {
      font-weight: 600;
      color: #374151;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .category-bar-wrap {
      background: #f3f4f6;
      border-radius: 4px;
      height: 8px;
      overflow: hidden;
    }

    .category-bar {
      height: 100%;
      background: #667eea;
      border-radius: 4px;
      transition: width 0.4s ease;
    }

    .category-amount {
      text-align: right;
      color: #374151;
      font-weight: 500;
    }

    .category-count {
      color: #9ca3af;
      font-size: 0.8rem;
    }

    .no-categories {
      color: #9ca3af;
      font-size: 0.9rem;
    }

    @media (max-width: 640px) {
      .category-row {
        grid-template-columns: 1fr;
        gap: 0.25rem;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private dashboardStateService = inject(DashboardStateService);
  summary = this.dashboardStateService.dashboardSummary;

  constructor() {}

  async ngOnInit(): Promise<void> {
    if (this.dashboardStateService.transactions().length === 0) {
      await this.dashboardStateService.loadFromIndexedDB();
    }
  }

  top5Categories(): Array<{ name: string } & CategoryStats> {
    const breakdown = this.summary()?.categoryBreakdown;
    if (!breakdown) return [];
    return Object.entries(breakdown)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5);
  }
}
