import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { CategoryTree, WidgetSelection } from '../../../../core/models/data-models';

const WIDGET_ICONS: Record<string, string> = {
  expense: '↓',
  investment: '💼',
  income: '↑',
  transfer: '⇄',
};

const WIDGET_LABELS: Record<string, string> = {
  expense: 'Expenses',
  investment: 'Investment',
  income: 'Income',
  transfer: 'Transfer',
};

@Component({
  selector: 'app-analytical-widget',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  template: `
    <div [attr.data-testid]="'widget-' + type" class="analytical-widget">
      <!-- Header -->
      <div class="widget-header">
        <span class="widget-icon">{{ icon }}</span>
        <span class="widget-label">{{ label }}</span>
        <button
          class="auto-toggle-btn"
          [class.auto-on]="isAutoOn"
          data-testid="widget-auto-toggle"
          [attr.aria-checked]="isAutoOn"
          role="switch"
          (click)="onAutoToggle()">
          Auto
        </button>
      </div>

      <!-- Empty state -->
      @if (data.length === 0) {
        <div class="empty-state" data-testid="widget-empty-state">
          No transactions in this period.
        </div>
      } @else {
        <!-- Tree table -->
        <table class="widget-tree-table">
          <tbody>
            @for (node of data; track node.category) {
              <!-- Level 1: category row -->
              <tr
                class="category-row"
                data-testid="widget-row-category"
                [attr.aria-selected]="isSelected(node.category)"
                (click)="onCategoryClick(node.category)">
                <td class="chevron-cell">
                  <span class="chevron" [class.expanded]="isExpanded(node.category)">
                    {{ isExpanded(node.category) ? '∨' : '›' }}
                  </span>
                </td>
                <td class="name-cell category-name">{{ node.category }}</td>
                <td class="amount-cell">
                  {{ node.total | currency:'INR':'symbol':'1.2-2':'en-IN' }}
                </td>
              </tr>
              <!-- Level 2: sub-category rows -->
              @if (isExpanded(node.category)) {
                @for (sub of node.subCategories; track sub.name) {
                  <tr
                    class="subcategory-row"
                    data-testid="widget-row-subcategory"
                    [attr.aria-selected]="isSubSelected(node.category, sub.name)"
                    (click)="onSubCategoryClick(node.category, sub.name)">
                    <td class="chevron-cell"></td>
                    <td class="name-cell subcategory-name">{{ sub.name }}</td>
                    <td class="amount-cell">
                      {{ sub.total | currency:'INR':'symbol':'1.2-2':'en-IN' }}
                    </td>
                  </tr>
                }
              }
            }
          </tbody>
        </table>
      }
    </div>
  `,
  styles: [`
    .analytical-widget {
      background: white;
      border-radius: 10px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
      overflow: hidden;
    }

    .widget-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
    }

    .widget-icon {
      font-size: 1.1rem;
    }

    .widget-label {
      flex: 1;
      font-size: 0.875rem;
      font-weight: 600;
      color: #1e293b;
    }

    .auto-toggle-btn {
      padding: 0.2rem 0.6rem;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      background: white;
      color: #64748b;
      font-size: 0.75rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;

      &.auto-on {
        background: #667eea;
        color: white;
        border-color: #667eea;
      }

      &:hover:not(.auto-on) {
        border-color: #667eea;
        color: #667eea;
      }
    }

    .empty-state {
      padding: 2rem 1rem;
      text-align: center;
      color: #94a3b8;
      font-size: 0.875rem;
    }

    .widget-tree-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8rem;
    }

    .category-row {
      cursor: pointer;
      transition: background 0.1s;

      &:hover { background: #f1f5f9; }
      &[aria-selected="true"] { background: #eef2ff; }
    }

    .subcategory-row {
      cursor: pointer;
      background: #fafafa;
      transition: background 0.1s;

      &:hover { background: #f1f5f9; }
      &[aria-selected="true"] { background: #eef2ff; }
    }

    .chevron-cell {
      width: 28px;
      padding: 0.4rem 0 0.4rem 0.75rem;
      color: #94a3b8;
      font-size: 0.9rem;
    }

    .chevron {
      display: inline-block;
      transition: transform 0.15s;
    }

    .name-cell {
      padding: 0.4rem 0.5rem;
      color: #374151;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 140px;
    }

    .category-name {
      font-weight: 600;
      color: #1e293b;
    }

    .subcategory-name {
      padding-left: 1.5rem;
      color: #64748b;
    }

    .amount-cell {
      padding: 0.4rem 0.75rem 0.4rem 0.25rem;
      text-align: right;
      font-weight: 500;
      color: #374151;
      white-space: nowrap;
    }

    tr:not(:last-child) td {
      border-bottom: 1px solid #f3f4f6;
    }
  `]
})
export class AnalyticalWidgetComponent {
  @Input() type!: 'expense' | 'investment' | 'income' | 'transfer';
  @Input() data: CategoryTree[] = [];
  @Input() isAutoOn = false;
  @Output() autoToggled = new EventEmitter<boolean>();
  @Output() rowSelected = new EventEmitter<WidgetSelection>();

  private expandedCategories = signal<Set<string>>(new Set());
  private selectedRow = signal<WidgetSelection | null>(null);

  get icon(): string { return WIDGET_ICONS[this.type] ?? ''; }
  get label(): string { return WIDGET_LABELS[this.type] ?? this.type; }

  isExpanded(cat: string): boolean {
    return this.expandedCategories().has(cat);
  }

  isSelected(cat: string): boolean {
    const sel = this.selectedRow();
    return !!sel && sel.category === cat && !sel.subCategory;
  }

  isSubSelected(cat: string, sub: string): boolean {
    const sel = this.selectedRow();
    return !!sel && sel.category === cat && sel.subCategory === sub;
  }

  toggleCategory(cat: string): void {
    const current = new Set(this.expandedCategories());
    if (current.has(cat)) {
      current.delete(cat);
    } else {
      current.add(cat);
    }
    this.expandedCategories.set(current);
  }

  selectCategory(cat: string): void {
    const sel: WidgetSelection = { type: this.type.toUpperCase() as any, category: cat };
    this.selectedRow.set(sel);
    this.rowSelected.emit(sel);
  }

  selectSubCategory(cat: string, sub: string): void {
    const sel: WidgetSelection = { type: this.type.toUpperCase() as any, category: cat, subCategory: sub };
    this.selectedRow.set(sel);
    this.rowSelected.emit(sel);
  }

  onCategoryClick(cat: string): void {
    this.toggleCategory(cat);
    this.selectCategory(cat);
  }

  onSubCategoryClick(cat: string, sub: string): void {
    this.selectSubCategory(cat, sub);
  }

  onAutoToggle(): void {
    this.autoToggled.emit(!this.isAutoOn);
  }
}
