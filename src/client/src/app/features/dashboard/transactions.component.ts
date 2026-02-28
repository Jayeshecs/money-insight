import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Transaction } from '../../core/models/data-models';
import { DashboardStateService } from '../../core/services/dashboard-state.service';
import { IndexedDbService } from '../../core/services/indexeddb.service';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="transactions-container">
      <div class="transactions-header">
        <h1>Parsed Transactions</h1>
        <p class="count-info" *ngIf="transactions().length > 0">
          Showing <strong>{{ transactions().length }}</strong> transactions
        </p>
      </div>

      <div class="transactions-list" data-testid="transaction-list" *ngIf="transactions().length > 0">
        <div class="transaction-card" data-testid="transaction-row" *ngFor="let txn of transactions()">
          <div class="transaction-date">{{ txn.date }}</div>
          <div class="transaction-narration">{{ txn.narration }}</div>
          <div class="transaction-amount" [class.credit]="txn.creditIndicator === 'Yes'" [class.debit]="txn.creditIndicator !== 'Yes'">
            {{ txn.amount | number:'1.2-2' }}
          </div>
        </div>
      </div>

      <div class="no-data" *ngIf="transactions().length === 0">
        <p>No transactions found. Please upload a statement.</p>
        <a routerLink="/import">Upload Statement</a>
      </div>
    </div>
  `,
  styles: [`
    .transactions-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .transactions-header {
      margin-bottom: 2rem;

      h1 {
        font-size: 2rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
      }

      .count-info {
        color: #6b7280;
        font-size: 0.875rem;
      }
    }

    .transactions-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .transaction-card {
      display: grid;
      grid-template-columns: 120px 1fr 150px;
      gap: 1rem;
      padding: 1rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      align-items: center;

      .transaction-date {
        font-size: 0.875rem;
        color: #6b7280;
      }

      .transaction-narration {
        font-weight: 500;
      }

      .transaction-amount {
        text-align: right;
        font-weight: 600;
        font-size: 1.125rem;

        &.credit {
          color: #10b981;
        }

        &.debit {
          color: #ef4444;
        }
      }
    }

    .no-data {
      text-align: center;
      padding: 4rem 2rem;

      p {
        color: #6b7280;
        margin-bottom: 1.5rem;
      }

      a {
        display: inline-block;
        padding: 0.75rem 2rem;
        background-color: #667eea;
        color: white;
        border-radius: 8px;
        font-weight: 500;
        text-decoration: none;
        transition: background-color 0.2s;

        &:hover {
          background-color: #5568d3;
        }
      }
    }

    @media (max-width: 640px) {
      .transaction-card {
        grid-template-columns: 1fr;
        gap: 0.5rem;

        .transaction-amount {
          text-align: left;
        }
      }
    }
  `]
})
export class TransactionsComponent implements OnInit {
  transactions = signal<Transaction[]>([]);

  constructor(
    private dashboardStateService: DashboardStateService,
    private indexedDbService: IndexedDbService
  ) {}

  async ngOnInit(): Promise<void> {
    if (this.dashboardStateService.transactions().length > 0) {
      this.transactions.set(this.dashboardStateService.transactions());
    } else {
      const txns = await this.indexedDbService.getAllTransactions();
      this.transactions.set(txns);
    }
  }
}
