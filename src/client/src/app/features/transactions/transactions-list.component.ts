import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Transaction, ConfidenceLevel } from '../../core/models/data-models';
import { IndexedDbService } from '../../core/services/indexeddb.service';
import { DashboardStateService } from '../../core/services/dashboard-state.service';
import { RulesService } from '../../core/services/rules.service';
import { ToastService } from '../../shared/services/toast.service';
import { ToastComponent } from '../../shared/components/toast/toast.component';
import { AdPlaceholderComponent } from '../../shared/components/ad-placeholder/ad-placeholder.component';

const CATEGORIES = [
  'All',
  'Food', 'Rent', 'Travel', 'Shopping', 'Entertainment',
  'Investment', 'Income', 'Transfer', 'Insurance', 'Other',
];

const PAGE_SIZE = 20;

@Component({
  selector: 'app-transactions-list',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, FormsModule, ToastComponent, AdPlaceholderComponent],
  template: `
    <div class="txn-layout">

      <!-- Sidebar nav -->
      <nav class="sidebar-nav" data-testid="sidebar-nav" aria-label="Main navigation">
        <div class="nav-brand">💰 MoneyInsight</div>
        <a routerLink="/dashboard" class="nav-link">📊 Dashboard</a>
        <a routerLink="/transactions" class="nav-link active">📋 Transactions</a>
        <a routerLink="/import" class="nav-link">⬆️ Import</a>
        <a routerLink="/settings" class="nav-link">⚙️ Settings</a>
      </nav>

      <!-- Main content -->
      <main class="txn-main">
        <h1 class="txn-title">Transactions</h1>

        <!-- Filter bar -->
        <div class="filter-bar">
          <select class="filter-input" data-testid="filter-category"
                  [(ngModel)]="selectedCategory" (ngModelChange)="onFilterChange()">
            <option *ngFor="let cat of categories" [value]="cat">{{ cat }}</option>
          </select>

          <input class="filter-input" type="date" data-testid="filter-date-from"
                 [(ngModel)]="dateFrom" (ngModelChange)="onFilterChange()" placeholder="From date">

          <input class="filter-input" type="date" data-testid="filter-date-to"
                 [(ngModel)]="dateTo" (ngModelChange)="onFilterChange()" placeholder="To date">

          <input class="filter-input search-input" type="text" data-testid="search-narration"
                 [(ngModel)]="searchText" (ngModelChange)="onFilterChange()"
                 placeholder="Search narration...">
        </div>

        <!-- Count -->
        <div class="txn-count-row">
          <span class="txn-count" data-testid="transaction-count">
            {{ filteredTransactions.length }} transaction{{ filteredTransactions.length !== 1 ? 's' : '' }}
          </span>
        </div>

        <!-- Empty state -->
        <div *ngIf="filteredTransactions.length === 0"
             class="empty-state"
             data-testid="transactions-empty-state">
          <div class="empty-icon">📭</div>
          <p *ngIf="allTransactions().length === 0">
            No transactions found. <a routerLink="/import">Upload a statement</a> to get started.
          </p>
          <p *ngIf="allTransactions().length > 0">No transactions match your current filters.</p>
        </div>

        <!-- Desktop/tablet table -->
        <div class="table-wrapper desktop-only" *ngIf="filteredTransactions.length > 0">
          <table class="txn-table" data-testid="transactions-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Narration</th>
                <th>Amount</th>
                <th>Category</th>
                <th>Confidence</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let txn of pagedTransactions" data-testid="transaction-row">
                <td data-testid="txn-date">{{ txn.date }}</td>
                <td data-testid="txn-narration" class="narration-cell">{{ txn.narration }}</td>
                <td data-testid="txn-amount" [class]="'amount-cell ' + amountClass(txn)">
                  {{ txn.amount | currency:'INR':'symbol-narrow':'1.2-2' }}
                </td>
                <td data-testid="txn-category">
                  <select class="category-select"
                          data-testid="txn-category-select"
                          [value]="txn.category"
                          (change)="onCategoryChange(txn, $event)">
                    <option *ngFor="let cat of editableCategories" [value]="cat">{{ cat }}</option>
                  </select>
                </td>
                <td data-testid="txn-confidence">{{ confidenceEmoji(txn.confidenceLevel) }}</td>
              </tr>
              @if (pagedTransactions.length === PAGE_SIZE) {
                <tr data-testid="ad-row">
                  <td colspan="5">
                    <span data-testid="ad-sponsored-label">Sponsored</span>
                    <app-ad-placeholder format="native" placement="transactions-in-feed"></app-ad-placeholder>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Mobile cards -->
        <div class="mobile-only" *ngIf="filteredTransactions.length > 0">
          <div *ngFor="let txn of pagedTransactions" class="txn-card" data-testid="transaction-card">
            <div class="card-row">
              <span class="card-narration" data-testid="txn-narration">{{ txn.narration }}</span>
              <span [class]="'card-amount ' + amountClass(txn)" data-testid="txn-amount">
                {{ txn.amount | currency:'INR':'symbol-narrow':'1.2-2' }}
              </span>
            </div>
            <div class="card-row card-meta">
              <span class="card-date" data-testid="txn-date">{{ txn.date }}</span>
              <span class="card-category" data-testid="txn-category">{{ txn.category }}</span>
              <span class="card-confidence" data-testid="txn-confidence">{{ confidenceEmoji(txn.confidenceLevel) }}</span>
            </div>
            <div class="card-row">
              <select class="category-select-mobile"
                      data-testid="txn-category-select"
                      [value]="txn.category"
                      (change)="onCategoryChange(txn, $event)">
                <option *ngFor="let cat of editableCategories" [value]="cat">{{ cat }}</option>
              </select>
            </div>
          </div>
          @if (pagedTransactions.length === PAGE_SIZE) {
            <div data-testid="ad-card">
              <span data-testid="ad-sponsored-label">Sponsored</span>
              <app-ad-placeholder format="native" placement="transactions-in-feed"></app-ad-placeholder>
            </div>
          }
        </div>

        <!-- Pagination -->
        <div class="pagination" *ngIf="totalPages > 1">
          <button data-testid="pagination-prev"
                  [disabled]="currentPage === 0"
                  (click)="prevPage()">← Prev</button>
          <span class="page-info">{{ currentPage + 1 }} / {{ totalPages }}</span>
          <button data-testid="pagination-next"
                  [disabled]="currentPage >= totalPages - 1"
                  (click)="nextPage()">Next →</button>
        </div>

      </main>
    </div>

    <!-- Toast notification -->
    <app-toast></app-toast>
  `,
  styles: [`
    .txn-layout {
      display: grid;
      grid-template-columns: 200px 1fr;
      min-height: 100vh;
    }

    @media (max-width: 767px) {
      .txn-layout { grid-template-columns: 1fr; }
      .sidebar-nav { display: none; }
    }

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
      transition: background 0.15s, color 0.15s;

      &:hover, &.active {
        background: #334155;
        color: white;
      }
    }

    .txn-main {
      padding: 2rem;
      overflow: hidden;
    }

    .txn-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 1.5rem;
    }

    /* Filter bar */
    .filter-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .filter-input {
      padding: 0.5rem 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.875rem;
      color: #374151;
      background: white;
      min-width: 140px;

      &:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 2px rgba(102,126,234,0.2);
      }
    }

    .search-input { min-width: 220px; }

    /* Count row */
    .txn-count-row {
      margin-bottom: 0.75rem;
    }

    .txn-count {
      font-size: 0.875rem;
      color: #6b7280;
    }

    /* Empty state */
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      background: #f9fafb;
      border-radius: 10px;
      border: 2px dashed #d1d5db;

      .empty-icon { font-size: 3rem; margin-bottom: 1rem; }
      p { color: #6b7280; font-size: 1rem; }
      a { color: #667eea; }
    }

    /* Table */
    .table-wrapper {
      overflow-x: auto;
      border-radius: 10px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
      background: white;
    }

    .txn-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;

      th {
        text-align: left;
        padding: 0.75rem 1rem;
        background: #f9fafb;
        color: #6b7280;
        font-weight: 600;
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        border-bottom: 1px solid #e5e7eb;
      }

      td {
        padding: 0.625rem 1rem;
        border-bottom: 1px solid #f3f4f6;
        color: #374151;
        vertical-align: middle;
      }

      tr:last-child td { border-bottom: none; }
      tr:hover td { background: #fafafa; }
    }

    .narration-cell {
      max-width: 280px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .amount-cell {
      font-weight: 600;
      white-space: nowrap;
    }

    .income { color: #10b981; }
    .expense { color: #ef4444; }
    .transfer { color: #6b7280; }

    .category-select {
      padding: 0.25rem 0.5rem;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      font-size: 0.8rem;
      background: white;
      cursor: pointer;
      min-width: 110px;
    }

    /* Mobile cards */
    .txn-card {
      background: white;
      border-radius: 8px;
      padding: 0.875rem 1rem;
      margin-bottom: 0.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }

    .card-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.4rem;

      &:last-child { margin-bottom: 0; }
    }

    .card-narration {
      font-weight: 500;
      color: #1f2937;
      font-size: 0.875rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 65%;
    }

    .card-amount { font-weight: 700; font-size: 0.875rem; white-space: nowrap; }
    .card-meta { font-size: 0.78rem; color: #6b7280; }
    .card-date, .card-category, .card-confidence { color: #6b7280; }

    .category-select-mobile {
      padding: 0.25rem 0.5rem;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      font-size: 0.8rem;
      background: white;
      cursor: pointer;
      width: 100%;
    }

    /* Responsive visibility */
    .desktop-only { display: block; }
    .mobile-only { display: none; }

    @media (max-width: 767px) {
      .desktop-only { display: none; }
      .mobile-only { display: block; }
    }

    /* Pagination */
    .pagination {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-top: 1.25rem;
      justify-content: center;

      button {
        padding: 0.5rem 1rem;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        background: white;
        color: #374151;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.15s;

        &:hover:not([disabled]) {
          border-color: #667eea;
          color: #667eea;
        }

        &[disabled] {
          opacity: 0.4;
          cursor: not-allowed;
        }
      }

      .page-info { font-size: 0.875rem; color: #6b7280; }
    }
  `],
})
export class TransactionsListComponent implements OnInit {
  private idb = inject(IndexedDbService);
  private dashboardState = inject(DashboardStateService);
  private rulesService = inject(RulesService);
  private toastService = inject(ToastService);

  readonly categories = CATEGORIES;
  readonly editableCategories = CATEGORIES.filter(c => c !== 'All');
  protected readonly PAGE_SIZE = PAGE_SIZE;

  allTransactions = signal<Transaction[]>([]);

  // Filter state — regular properties so [(ngModel)] works
  selectedCategory = 'All';
  dateFrom = '';
  dateTo = '';
  searchText = '';
  currentPage = 0;

  constructor() {
    // C11: Pre-fill category dropdown when dashboard drill-down sets a filter
    effect(() => {
      const cat = this.dashboardState.activeCategoryFilter();
      if (cat !== null && this.categories.includes(cat)) {
        this.selectedCategory = cat;
        this.currentPage = 0;
      } else if (cat === null) {
        // Filter was cleared — reset to 'All' only if it was previously set by the signal
        // (don't reset if user manually chose a category)
      }
    });
  }

  get filteredTransactions(): Transaction[] {
    let txns = [...this.allTransactions()].sort((a, b) => b.date.localeCompare(a.date));
    if (this.selectedCategory && this.selectedCategory !== 'All') {
      txns = txns.filter(t => t.category === this.selectedCategory);
    }
    if (this.dateFrom) txns = txns.filter(t => t.date >= this.dateFrom);
    if (this.dateTo) txns = txns.filter(t => t.date <= this.dateTo);
    if (this.searchText) {
      const q = this.searchText.toLowerCase();
      txns = txns.filter(t => t.narration.toLowerCase().includes(q));
    }
    return txns;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredTransactions.length / PAGE_SIZE));
  }

  get pagedTransactions(): Transaction[] {
    const start = this.currentPage * PAGE_SIZE;
    return this.filteredTransactions.slice(start, start + PAGE_SIZE);
  }

  onFilterChange(): void {
    this.currentPage = 0;
  }

  prevPage(): void {
    if (this.currentPage > 0) this.currentPage--;
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages - 1) this.currentPage++;
  }

  amountClass(txn: Transaction): string {
    if (txn.transactionType === 'INCOME') return 'income';
    if (txn.transactionType === 'EXPENSE') return 'expense';
    return 'transfer';
  }

  confidenceEmoji(level: ConfidenceLevel | undefined): string {
    if (level === 'HIGH') return '🟢';
    if (level === 'MEDIUM') return '🟡';
    return '🔴';
  }

  async onCategoryChange(txn: Transaction, event: Event): Promise<void> {
    const newCategory = (event.target as HTMLSelectElement).value;
    if (!newCategory || newCategory === txn.category) return;

    const updated: Transaction = { ...txn, category: newCategory, lastModified: new Date().toISOString() };
    await this.idb.updateTransaction(updated);

    // Update local signal
    this.allTransactions.update(list =>
      list.map(t => t.id === txn.id ? updated : t)
    );

    // Save rule: first 3 words of narration → category
    const keyword = txn.narration.trim().split(/\s+/).slice(0, 3).join(' ').toLowerCase();
    await this.rulesService.saveRule(keyword, newCategory);

    // Refresh dashboard
    await this.dashboardState.loadFromIndexedDB();

    // Show toast
    this.toastService.show('Category saved');
  }

  async ngOnInit(): Promise<void> {
    const txns = await this.idb.getAllTransactions();
    this.allTransactions.set(txns);
  }
}
