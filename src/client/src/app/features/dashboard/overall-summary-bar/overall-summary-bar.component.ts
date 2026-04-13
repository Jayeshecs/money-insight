import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardStateService } from '../../../core/services/dashboard-state.service';

@Component({
  selector: 'app-overall-summary-bar',
  standalone: true,
  imports: [CurrencyPipe, FormsModule],
  template: `
    <!-- Empty state: no transactions for the selected period/accounts -->
    @if (periodAccountFiltered().length === 0) {
      <div class="empty-state" data-testid="dashboard-empty-state" role="status">
        <span class="empty-icon">📊</span>
        <p>No transactions for the selected period and account filter.</p>
      </div>
    }

    <div class="summary-bar" aria-label="Overall financial summary">

      <!-- Stat chips -->
      <div class="stat-chip stat-income chip-income" data-testid="overall-income" aria-label="Total income">
        <span class="chip-icon" aria-hidden="true">↑</span>
        <span class="chip-label">Income</span>
        <span class="chip-value">
          {{ summary().income | currency:'INR':'symbol':'1.2-2':'en-IN' }}
        </span>
      </div>

      <div class="stat-chip stat-expense chip-expense" data-testid="overall-expense" aria-label="Total expenses">
        <span class="chip-icon" aria-hidden="true">↓</span>
        <span class="chip-label">Expense</span>
        <span class="chip-value">
          {{ summary().expense | currency:'INR':'symbol':'1.2-2':'en-IN' }}
        </span>
      </div>

      <div class="stat-chip stat-investment chip-investment" data-testid="overall-investment" aria-label="Total investments">
        <span class="chip-icon" aria-hidden="true">💼</span>
        <span class="chip-label">Investment</span>
        <span class="chip-value">
          {{ summary().investment | currency:'INR':'symbol':'1.2-2':'en-IN' }}
        </span>
      </div>

      <div class="stat-chip stat-transfer chip-transfer" data-testid="overall-transfer" aria-label="Total transfers">
        <span class="chip-icon" aria-hidden="true">⇄</span>
        <span class="chip-label">Transfer</span>
        <span class="chip-value">
          {{ summary().transfer | currency:'INR':'symbol':'1.2-2':'en-IN' }}
        </span>
      </div>

      <!-- Account / Source multiselect filter -->
      <div class="account-filter" aria-label="Account filter">
        <label class="filter-label" for="account-source-filter">
          Accounts
          <span class="account-badge" data-testid="account-source-filter-badge">{{ selectedAccounts().length }}</span>
        </label>
        <select
          id="account-source-filter"
          data-testid="account-source-filter"
          class="account-select"
          multiple
          (change)="onAccountSelectChange($event)"
          [size]="accountSelectSize()">
          @for (account of availableAccounts(); track account) {
            <option
              [value]="account"
              [selected]="modelHasAccount(account)">
              {{ account }}
            </option>
          }
        </select>
      </div>

    </div>
  `,
  styles: [`
    .empty-state {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: #fefce8;
      border: 1px solid #fde68a;
      border-radius: 8px;
      color: #92400e;
      font-size: 0.875rem;
      margin-bottom: 8px;

      .empty-icon { font-size: 1.2rem; }
      p { margin: 0; }
    }

    .summary-bar {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      align-items: flex-start;
      padding: 12px 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      margin-bottom: 12px;
    }

    /* ── Stat chips ────────────────────────────────────────────────────────── */
    .stat-chip {
      flex: 1 1 140px;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;
      background: white;
      border-radius: 8px;
      padding: 10px 14px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.07);
      border-left: 4px solid #d1d5db;
      min-width: 120px;
    }

    .chip-icon {
      font-size: 1rem;
    }

    .chip-label {
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #6b7280;
    }

    .chip-value {
      font-size: 1.05rem;
      font-weight: 700;
    }

    .stat-income  { border-left-color: #10b981; .chip-value { color: #059669; } }
    .stat-expense { border-left-color: #ef4444; .chip-value { color: #dc2626; } }
    .stat-investment { border-left-color: #3b82f6; .chip-value { color: #1d4ed8; } }
    .stat-transfer   { border-left-color: #9ca3af; .chip-value { color: #6b7280; } }

    /* Colour classes used by tests */
    .chip-income     { color: #16a34a; }
    .chip-expense    { color: #dc2626; }
    .chip-investment { color: #2563eb; }
    .chip-transfer   { color: #64748b; }

    /* ── Account filter ────────────────────────────────────────────────────── */
    .account-filter {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-left: auto;
      min-width: 160px;
    }

    .filter-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8rem;
      font-weight: 600;
      color: #374151;
    }

    .account-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 20px;
      height: 20px;
      padding: 0 5px;
      background: #667eea;
      color: white;
      border-radius: 10px;
      font-size: 0.7rem;
      font-weight: 700;
    }

    .account-select {
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.875rem;
      color: #374151;
      background: white;
      cursor: pointer;
      padding: 2px;
      min-height: 36px;
      max-height: 120px;
      &:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 2px rgba(102,126,234,0.2); }

      option {
        padding: 4px 8px;
        &:checked { background: #eef2ff; color: #4f46e5; }
      }
    }

    /* ── Responsive ────────────────────────────────────────────────────────── */
    @media (max-width: 767px) {
      .summary-bar {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }
      .stat-chip { flex: none; }
      .account-filter {
        grid-column: 1 / -1;
        margin-left: 0;
      }
    }
  `],
})
export class OverallSummaryBarComponent implements OnInit {
  private state = inject(DashboardStateService);

  readonly summary              = this.state.overallSummary;
  readonly availableAccounts    = this.state.availableAccounts;
  readonly selectedAccounts     = this.state.selectedAccounts;
  readonly periodAccountFiltered = this.state.periodAccountFiltered;

  /** Local array model kept in sync with the service signal for multi-select rendering. */
  selectedAccountsModel: string[] = [];

  /** Show at most 4 rows but at least 2 in the native select. */
  readonly accountSelectSize = computed(() => {
    const count = this.availableAccounts().length;
    return Math.min(Math.max(count, 2), 4);
  });

  constructor() {
    // Keep local model in sync when service signal changes (e.g., on initial load)
    effect(() => {
      this.selectedAccountsModel = [...this.state.selectedAccounts()];
    });
  }

  ngOnInit(): void {
    // Ensure initial model matches service state (covers synchronous init case)
    this.selectedAccountsModel = [...this.state.selectedAccounts()];
  }

  /** Used by template [selected] binding to check whether an account is selected. */
  modelHasAccount(account: string): boolean {
    return this.selectedAccountsModel.includes(account);
  }

  onAccountSelectChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const selected = Array.from(select.selectedOptions).map(o => o.value);
    this.selectedAccountsModel = selected;
    this.state.selectedAccounts.set(selected);
  }
}
