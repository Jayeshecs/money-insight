import { Injectable } from '@angular/core';
import { Transaction, ConfidenceLevel, TransactionStatus } from '../models/data-models';

@Injectable({
  providedIn: 'root'
})
export class TransactionUtilsService {

  /**
   * Get confidence badge class for UI styling
   */
  getConfidenceBadgeClass(level: ConfidenceLevel): string {
    switch (level) {
      case 'HIGH':
        return 'badge-success';
      case 'MEDIUM':
        return 'badge-warning';
      case 'LOW':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  }

  /**
   * Get status badge class for UI styling
   */
  getStatusBadgeClass(status: TransactionStatus): string {
    switch (status) {
      case 'APPROVED':
        return 'badge-success';
      case 'PENDING':
        return 'badge-warning';
      case 'FLAGGED':
        return 'badge-danger';
      case 'SYNCED':
        return 'badge-info';
      default:
        return 'badge-secondary';
    }
  }

  /**
   * Format amount with currency symbol
   */
  formatAmount(amount: number, currency: string = 'INR'): string {
    const symbol = currency === 'INR' ? '₹' : '$';
    const formatted = Math.abs(amount).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    return amount < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
  }

  /**
   * Get transaction type label (Debit/Credit)
   */
  getTransactionTypeLabel(amount: number): string {
    return amount < 0 ? 'Debit' : 'Credit';
  }

  /**
   * Get transaction type class for UI styling
   */
  getTransactionTypeClass(amount: number): string {
    return amount < 0 ? 'text-danger' : 'text-success';
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  /**
   * Check if transaction needs review (low confidence or pending)
   */
  needsReview(transaction: Transaction): boolean {
    return transaction.confidenceLevel === 'LOW' || 
           transaction.status === 'PENDING' ||
           transaction.status === 'FLAGGED';
  }

  /**
   * Get category icon (you can expand this with actual icon mappings)
   */
  getCategoryIcon(category: string): string {
    const iconMap: Record<string, string> = {
      'Food': '🍔',
      'Transportation': '🚗',
      'Shopping': '🛍️',
      'Entertainment': '🎬',
      'Healthcare': '🏥',
      'Utilities': '💡',
      'Income': '💰',
      'Subscriptions': '📱',
      'Cash Withdrawal': '🏧',
      'Uncategorized': '❓'
    };
    
    return iconMap[category] || '📊';
  }

  /**
   * Calculate summary statistics for transactions
   */
  calculateSummary(transactions: Transaction[]): {
    totalIncome: number;
    totalExpense: number;
    netFlow: number;
    transactionCount: number;
    pendingCount: number;
    lowConfidenceCount: number;
  } {
    let totalIncome = 0;
    let totalExpense = 0;
    let pendingCount = 0;
    let lowConfidenceCount = 0;

    transactions.forEach(txn => {
      if (txn.amount > 0) {
        totalIncome += txn.amount;
      } else {
        totalExpense += Math.abs(txn.amount);
      }

      if (txn.status === 'PENDING') {
        pendingCount++;
      }

      if (txn.confidenceLevel === 'LOW') {
        lowConfidenceCount++;
      }
    });

    return {
      totalIncome,
      totalExpense,
      netFlow: totalIncome - totalExpense,
      transactionCount: transactions.length,
      pendingCount,
      lowConfidenceCount
    };
  }

  /**
   * Group transactions by category
   */
  groupByCategory(transactions: Transaction[]): Map<string, Transaction[]> {
    const grouped = new Map<string, Transaction[]>();
    
    transactions.forEach(txn => {
      const key = txn.category;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(txn);
    });
    
    return grouped;
  }

  /**
   * Group transactions by month
   */
  groupByMonth(transactions: Transaction[]): Map<string, Transaction[]> {
    const grouped = new Map<string, Transaction[]>();
    
    transactions.forEach(txn => {
      const date = new Date(txn.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!grouped.has(monthKey)) {
        grouped.set(monthKey, []);
      }
      grouped.get(monthKey)!.push(txn);
    });
    
    return grouped;
  }

  /**
   * Sort transactions by date (descending by default)
   */
  sortByDate(transactions: Transaction[], ascending: boolean = false): Transaction[] {
    return [...transactions].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return ascending ? dateA - dateB : dateB - dateA;
    });
  }

  /**
   * Filter transactions by date range
   */
  filterByDateRange(
    transactions: Transaction[], 
    startDate: string, 
    endDate: string
  ): Transaction[] {
    return transactions.filter(txn => 
      txn.date >= startDate && txn.date <= endDate
    );
  }

  /**
   * Filter transactions by search term (searches description and category)
   */
  searchTransactions(transactions: Transaction[], searchTerm: string): Transaction[] {
    const term = searchTerm.toLowerCase();
    return transactions.filter(txn =>
      txn.description.toLowerCase().includes(term) ||
      txn.category.toLowerCase().includes(term) ||
      (txn.subCategory && txn.subCategory.toLowerCase().includes(term))
    );
  }
}
