import { Component, ElementRef, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardStateService } from '../../../core/services/dashboard-state.service';
import { Transaction } from '../../../core/models/data-models';

type SortCol = 'account' | 'category' | 'subcategory' | 'date' | 'amount' | 'narration';
type SortDir = 'asc' | 'desc';

const DEFAULT_SORT_COL: SortCol = 'date';
const DEFAULT_SORT_DIR: SortDir = 'desc';

@Component({
  selector: 'app-transactions-panel',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, FormsModule],
  template: `
    <div class="transactions-panel" data-testid="drilldown-section">

      <!-- Panel header -->
      <div class="panel-header">
        <h2 class="panel-title" data-testid="transactions-panel-title">{{ panelTitle() }}</h2>
        <div class="header-actions">
          <span class="record-count" data-testid="transactions-record-count">
            Records: {{ filteredCount() }} / {{ totalCount() }}
          </span>
          <button
            class="search-btn"
            data-testid="transactions-search-btn"
            title="Search transactions"
            (click)="toggleSearch()">
            <span class="material-icons" style="font-size:1.1rem;vertical-align:middle;">search</span>
          </button>
        </div>
      </div>

      <!-- Search input row -->
      @if (searchVisible()) {
        <div class="search-bar">
          <div class="search-input-wrap">
            <input
              type="text"
              class="search-input"
              data-testid="transactions-search-input"
              placeholder="Search transactions…"
              [value]="searchText()"
              #searchInputRef
              (input)="onSearchInput($any($event.target).value)"
              (keydown.escape)="closeSearch()" />
            @if (searchText()) {
              <button
                class="search-clear-btn"
                data-testid="transactions-search-clear"
                title="Clear search"
                (click)="clearSearch()">
                <span class="material-icons" style="font-size:1rem;">close</span>
              </button>
            }
          </div>
        </div>
      }

      <!-- Deferred drilldown prompt (Auto OFF) -->
      @if (pendingSelection()) {
        <div class="drilldown-prompt" data-testid="drilldown-prompt">
          <span>Row selected. Click <strong>Show Drilldown</strong> to refresh the panel.</span>
          <button class="show-drilldown-btn" data-testid="drilldown-show-btn" (click)="applyDrilldown()">
            Show Drilldown
          </button>
        </div>
      }

      <!-- Mobile Order-by dropdown (< 768px) -->
      <div class="mobile-sort-bar">
        <label class="mobile-sort-label">Order by:</label>
        <select
          class="mobile-sort-select"
          data-testid="transactions-mobile-sort-select"
          [value]="sortColumn()"
          (change)="onMobileSortChange($any($event.target).value)">
          <option value="date">Date</option>
          <option value="amount">Amount</option>
          <option value="category">Category</option>
          <option value="account">Account/Source</option>
          <option value="narration">Narration</option>
        </select>
      </div>

      <!-- Empty state -->
      @if (pagedTransactions().length === 0) {
        <div class="empty-state" data-testid="transactions-panel-empty-state">
          <span>No transactions found for the selected filter.</span>
        </div>
      }

      <!-- Desktop table (≥768px) -->
      @if (pagedTransactions().length > 0) {
        <table class="transactions-table" data-testid="transactions-table">
          <thead>
            <tr>
              <th
                data-testid="sort-col-account"
                [attr.aria-sort]="ariaSortAttr('account')"
                (click)="toggleSort('account')">
                Account/Source
                <span class="material-icons sort-icon" *ngIf="sortColumn() === 'account'">
                  {{ sortDir() === 'asc' ? 'arrow_upward' : 'arrow_downward' }}
                </span>
              </th>
              <th
                data-testid="sort-col-category"
                [attr.aria-sort]="ariaSortAttr('category')"
                (click)="toggleSort('category')">
                Category
                <span class="material-icons sort-icon" *ngIf="sortColumn() === 'category'">
                  {{ sortDir() === 'asc' ? 'arrow_upward' : 'arrow_downward' }}
                </span>
              </th>
              <th
                data-testid="sort-col-subcategory"
                [attr.aria-sort]="ariaSortAttr('subcategory')"
                (click)="toggleSort('subcategory')">
                Sub-category
                <span class="material-icons sort-icon" *ngIf="sortColumn() === 'subcategory'">
                  {{ sortDir() === 'asc' ? 'arrow_upward' : 'arrow_downward' }}
                </span>
              </th>
              <th
                data-testid="sort-col-date"
                [attr.aria-sort]="ariaSortAttr('date')"
                (click)="toggleSort('date')">
                Date
                <span class="material-icons sort-icon" *ngIf="sortColumn() === 'date'">
                  {{ sortDir() === 'asc' ? 'arrow_upward' : 'arrow_downward' }}
                </span>
              </th>
              <th
                data-testid="sort-col-amount"
                [attr.aria-sort]="ariaSortAttr('amount')"
                (click)="toggleSort('amount')">
                Amount
                <span class="material-icons sort-icon" *ngIf="sortColumn() === 'amount'">
                  {{ sortDir() === 'asc' ? 'arrow_upward' : 'arrow_downward' }}
                </span>
              </th>
              <th
                data-testid="sort-col-narration"
                [attr.aria-sort]="ariaSortAttr('narration')"
                (click)="toggleSort('narration')">
                Narration
                <span class="material-icons sort-icon" *ngIf="sortColumn() === 'narration'">
                  {{ sortDir() === 'asc' ? 'arrow_upward' : 'arrow_downward' }}
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            @for (t of pagedTransactions(); track t.id) {
              <tr class="transaction-row" data-testid="transaction-row">
                <td>{{ t.account }}</td>
                <td>{{ t.category }}</td>
                <td>{{ t.subCategory ?? '—' }}</td>
                <td>{{ t.date }}</td>
                <td class="amount-cell" data-testid="txn-row-amount" [style.color]="amountColor(t)">
                  {{ t.amount | currency:'INR':'symbol-narrow':'1.2-2' }}
                </td>
                <td class="narration-cell" [title]="t.narration">{{ t.narration }}</td>
              </tr>
            }
          </tbody>
        </table>

        <!-- Mobile cards (<768px) -->
        <div class="transaction-cards" data-testid="drilldown-cards-list">
          @for (t of pagedTransactions(); track t.id) {
            <div class="transaction-card" data-testid="transaction-card">
              <div class="card-row card-top">
                <span class="card-date" data-testid="card-date">{{ t.date }}</span>
                <span class="card-amount" data-testid="card-amount" [style.color]="amountColor(t)">
                  {{ t.amount | currency:'INR':'symbol-narrow':'1.2-2' }}
                </span>
              </div>
              <div class="card-row">
                <span class="card-category" data-testid="card-category">
                  {{ t.category }}{{ t.subCategory ? ' / ' + t.subCategory : '' }}
                </span>
              </div>
              <div class="card-row">
                <span class="card-account" data-testid="card-account">{{ t.account }}</span>
              </div>
              <div class="card-narration" data-testid="card-narration">{{ t.narration }}</div>
            </div>
          }
        </div>

        <!-- Pagination -->
        <div class="pagination">
          <button
            class="page-btn"
            data-testid="transactions-pagination-prev"
            [disabled]="currentPage() === 1"
            (click)="prevPage()">
            ‹ Prev
          </button>
          <span class="page-info">Page {{ currentPage() }} of {{ totalPages() }}</span>
          <button
            class="page-btn"
            data-testid="transactions-pagination-next"
            [disabled]="currentPage() === totalPages()"
            (click)="nextPage()">
            Next ›
          </button>
        </div>
      }

    </div>
  `,
  styles: [`
    .transactions-panel {
      background: #fff;
      border-radius: 12px;
      padding: 1.25rem 1.5rem;
      margin-top: 1.5rem;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
      border: 1px solid #e2e8f0;
    }

    /* Header */
    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
      margin-bottom: 0.75rem;
    }

    .panel-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .record-count {
      font-size: 0.85rem;
      color: #64748b;
    }

    .search-btn {
      background: none;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 0.3rem 0.6rem;
      cursor: pointer;
      font-size: 1rem;
      line-height: 1;
      display: flex;
      align-items: center;
      &:hover { background: #f1f5f9; }
    }

    /* Search bar */
    .search-bar {
      margin-bottom: 0.75rem;
    }

    .search-input-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-input {
      width: 100%;
      padding: 0.5rem 2.5rem 0.5rem 0.75rem;
      border: 1px solid #94a3b8;
      border-radius: 6px;
      font-size: 0.9rem;
      outline: none;
      box-sizing: border-box;
      &:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.2); }
    }

    .search-clear-btn {
      position: absolute;
      right: 0.4rem;
      background: none;
      border: none;
      cursor: pointer;
      color: #94a3b8;
      display: flex;
      align-items: center;
      padding: 0.2rem;
      &:hover { color: #475569; }
    }

    /* Drilldown deferred prompt */
    .drilldown-prompt {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
      padding: 0.6rem 0.9rem;
      background: #fffbeb;
      border: 1px solid #fcd34d;
      border-radius: 6px;
      font-size: 0.875rem;
      color: #92400e;
    }

    .show-drilldown-btn {
      padding: 0.35rem 0.9rem;
      background: #1976d2;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
      &:hover { background: #1565c0; }
    }

    /* Mobile Order-by bar — hidden on desktop */
    .mobile-sort-bar {
      display: none;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }

    .mobile-sort-label {
      font-size: 0.8rem;
      color: #64748b;
      font-weight: 500;
      white-space: nowrap;
    }

    .mobile-sort-select {
      flex: 1;
      padding: 0.35rem 0.6rem;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 0.85rem;
      background: white;
    }

    @media (max-width: 767px) {
      .mobile-sort-bar { display: flex; }
    }

    /* Empty state */
    .empty-state {
      padding: 2rem;
      text-align: center;
      color: #94a3b8;
      font-size: 0.95rem;
    }

    /* Desktop table — shown ≥768px */
    .transactions-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .transactions-table th {
      background: #f8fafc;
      padding: 0.6rem 0.75rem;
      text-align: left;
      font-weight: 600;
      color: #475569;
      border-bottom: 2px solid #e2e8f0;
      white-space: nowrap;
      cursor: pointer;
      user-select: none;
      &:hover { background: #f1f5f9; }
    }

    .sort-icon {
      font-size: 0.9rem !important;
      vertical-align: middle;
      margin-left: 2px;
    }

    .transactions-table td {
      padding: 0.55rem 0.75rem;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: middle;
    }

    .transaction-row:nth-child(even) td {
      background: #f8fafc;
    }

    .transaction-row:hover td {
      background: #eff6ff;
    }

    .narration-cell {
      max-width: 220px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .amount-cell {
      font-weight: 600;
      white-space: nowrap;
    }

    /* Mobile cards — hidden ≥768px, shown <768px */
    .transaction-cards {
      display: none;
    }

    @media (max-width: 767px) {
      .transactions-table {
        display: none;
      }

      .transaction-cards {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .transaction-card {
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 0.75rem;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .card-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .card-top {
        margin-bottom: 0.25rem;
      }

      .card-date {
        font-weight: 700;
        font-size: 0.85rem;
        color: #1e293b;
      }

      .card-amount {
        font-weight: 700;
        font-size: 0.95rem;
      }

      .card-category {
        font-size: 0.8rem;
        color: #475569;
      }

      .card-account {
        font-size: 0.8rem;
        color: #64748b;
      }

      .card-narration {
        font-size: 0.8rem;
        color: #94a3b8;
        overflow: hidden;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }
    }

    /* Pagination */
    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      margin-top: 1rem;
      padding-top: 0.75rem;
      border-top: 1px solid #e2e8f0;
    }

    .page-btn {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 0.4rem 0.9rem;
      cursor: pointer;
      font-size: 0.85rem;
      color: #1e293b;
      &:hover:not([disabled]) { background: #dbeafe; border-color: #93c5fd; }
      &[disabled] { opacity: 0.4; cursor: not-allowed; }
    }

    .page-info {
      font-size: 0.85rem;
      color: #64748b;
    }
  `]
})
export class TransactionsPanelComponent {
  private readonly dashboardState = inject(DashboardStateService);

  @ViewChild('searchInputRef') searchInputEl?: ElementRef<HTMLInputElement>;

  // Search
  readonly searchVisible = signal(false);
  readonly searchText = signal('');

  // Sort
  readonly sortColumn = signal<SortCol>(DEFAULT_SORT_COL);
  readonly sortDir = signal<SortDir>(DEFAULT_SORT_DIR);
  private sortClickCount = 0;

  // Pagination
  readonly currentPage = signal(1);
  readonly PAGE_SIZE = 20;

  // Total count = periodAccountFiltered (unfiltered by widget/search)
  readonly totalCount = computed(() => this.dashboardState.periodAccountFiltered().length);

  /** Pending deferred selection (Auto OFF path) */
  readonly pendingSelection = computed(() => this.dashboardState.pendingDrilldownSelection());

  // After search filter applied on top of widget-filtered transactions
  readonly searchFilteredTransactions = computed(() => {
    const q = this.searchText().toLowerCase().trim();
    const txns = this.dashboardState.widgetFilteredTransactions();
    if (!q) return txns;
    return txns.filter((t: Transaction) =>
      (t.narration ?? '').toLowerCase().includes(q) ||
      (t.category ?? '').toLowerCase().includes(q) ||
      (t.subCategory ?? '').toLowerCase().includes(q) ||
      (t.account ?? '').toLowerCase().includes(q) ||
      t.date.includes(q) ||
      String(t.amount).includes(q)
    );
  });

  readonly filteredCount = computed(() => this.searchFilteredTransactions().length);

  /** Sorted result for paging */
  readonly sortedTransactions = computed(() => {
    const txns = this.searchFilteredTransactions();
    const col = this.sortColumn();
    const dir = this.sortDir();
    const m = dir === 'asc' ? 1 : -1;
    return [...txns].sort((a, b) => {
      if (col === 'amount') return m * (a.amount - b.amount);
      let aVal = '', bVal = '';
      switch (col) {
        case 'account':     aVal = a.account ?? '';     bVal = b.account ?? '';     break;
        case 'category':    aVal = a.category ?? '';    bVal = b.category ?? '';    break;
        case 'subcategory': aVal = a.subCategory ?? ''; bVal = b.subCategory ?? ''; break;
        case 'date':        aVal = a.date;              bVal = b.date;              break;
        case 'narration':   aVal = a.narration ?? '';   bVal = b.narration ?? '';   break;
      }
      return m * aVal.localeCompare(bVal);
    });
  });

  readonly pagedTransactions = computed(() => {
    const all = this.sortedTransactions();
    const page = this.currentPage();
    return all.slice((page - 1) * this.PAGE_SIZE, page * this.PAGE_SIZE);
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredCount() / this.PAGE_SIZE))
  );

  // Dynamic panel title
  readonly panelTitle = computed(() => {
    const sel = this.dashboardState.activeWidgetSelection();
    const autoWidget = this.dashboardState.activeAutoWidget();
    if (!sel || !autoWidget) return 'All Transactions';
    const typeLabel = sel.type.charAt(0).toUpperCase() + sel.type.slice(1).toLowerCase();
    if (sel.subCategory) return `${typeLabel} Transactions — ${sel.category} / ${sel.subCategory}`;
    return `${typeLabel} Transactions — ${sel.category}`;
  });

  constructor() {
    // Reset page + search + sort when widget selection changes
    effect(() => {
      this.dashboardState.activeWidgetSelection();
      this.currentPage.set(1);
      this.searchText.set('');
      this.searchVisible.set(false);
      this.sortColumn.set(DEFAULT_SORT_COL);
      this.sortDir.set(DEFAULT_SORT_DIR);
    });

    // Reset page + search + sort when Apply is pressed
    effect(() => {
      this.dashboardState.applyCount();
      this.currentPage.set(1);
      this.searchText.set('');
      this.searchVisible.set(false);
      this.sortColumn.set(DEFAULT_SORT_COL);
      this.sortDir.set(DEFAULT_SORT_DIR);
    });
  }

  toggleSearch(): void {
    if (this.searchVisible()) {
      this.closeSearch();
    } else {
      this.searchVisible.set(true);
      setTimeout(() => this.searchInputEl?.nativeElement.focus(), 50);
    }
  }

  closeSearch(): void {
    this.searchVisible.set(false);
    this.searchText.set('');
  }

  clearSearch(): void {
    this.searchText.set('');
    setTimeout(() => this.searchInputEl?.nativeElement.focus(), 50);
  }

  onSearchInput(value: string): void {
    this.searchText.set(value);
    this.currentPage.set(1);
  }

  /** Toggle sort: first click → asc, second → desc, third → reset to default. */
  toggleSort(col: SortCol): void {
    if (this.sortColumn() !== col) {
      this.sortColumn.set(col);
      this.sortDir.set('asc');
      this.sortClickCount = 1;
    } else {
      this.sortClickCount++;
      if (this.sortClickCount === 2) {
        this.sortDir.set('desc');
      } else {
        // Third click: reset to default date-descending
        this.sortColumn.set(DEFAULT_SORT_COL);
        this.sortDir.set(DEFAULT_SORT_DIR);
        this.sortClickCount = 0;
      }
    }
    this.currentPage.set(1);
  }

  onMobileSortChange(col: string): void {
    this.sortColumn.set(col as SortCol);
    this.sortDir.set('desc');
    this.currentPage.set(1);
  }

  ariaSortAttr(col: SortCol): string {
    if (this.sortColumn() !== col) return 'none';
    return this.sortDir() === 'asc' ? 'ascending' : 'descending';
  }

  /** Commit the pending deferred drilldown selection to the active selection. */
  applyDrilldown(): void {
    this.dashboardState.applyPendingDrilldown();
  }

  prevPage(): void {
    if (this.currentPage() > 1) this.currentPage.update(p => p - 1);
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) this.currentPage.update(p => p + 1);
  }

  amountColor(t: Transaction): string {
    switch (t.transactionType) {
      case 'INCOME':     return '#2E7D32';
      case 'EXPENSE':    return '#C62828';
      case 'INVESTMENT': return '#1565C0';
      case 'TRANSFER':   return '#616161';
      default:           return '#616161';
    }
  }
}
