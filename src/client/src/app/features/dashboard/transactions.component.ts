import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Transaction {
  date: string;
  description: string;
  amount: number;
  account: string;
  transaction_type: string;
}

interface TransactionBatch {
  source_parser: string;
  transactions: Transaction[];
  parse_duration_ms: number;
}

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="transactions-container">
      <div class="transactions-header">
        <h1>Parsed Transactions</h1>
        <p class="parser-info" *ngIf="batch()">
          Parsed by <strong>{{ batch()!.source_parser }}</strong> 
          in {{ batch()!.parse_duration_ms }}ms
        </p>
      </div>

      <div class="transactions-list" *ngIf="transactions().length > 0">
        <div class="transaction-card" *ngFor="let txn of transactions()">
          <div class="transaction-date">{{ txn.date }}</div>
          <div class="transaction-description">{{ txn.description }}</div>
          <div class="transaction-amount" [class.credit]="txn.amount > 0" [class.debit]="txn.amount < 0">
            {{ txn.amount | number:'1.2-2' }}
          </div>
        </div>
      </div>

      <div class="no-data" *ngIf="transactions().length === 0">
        <p>No transactions found. Please upload a statement.</p>
        <button (click)="goBack()">Upload Statement</button>
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

      .parser-info {
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

      .transaction-description {
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

      button {
        padding: 0.75rem 2rem;
        background-color: #667eea;
        color: white;
        border: none;
        border-radius: 8px;
        font-weight: 500;
        cursor: pointer;
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
  batch = signal<TransactionBatch | null>(null);

  ngOnInit() {
    const data = sessionStorage.getItem('parsedTransactions');
    if (data) {
      const parsedBatch: TransactionBatch = JSON.parse(data);
      this.batch.set(parsedBatch);
      this.transactions.set(parsedBatch.transactions);
    }
  }

  goBack() {
    window.location.href = '/import';
  }
}
