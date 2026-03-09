import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * FabButtonComponent — Mobile Floating Action Button
 *
 * Reusable FAB for mobile-only actions (< 768 px breakpoint).
 * Positioned fixed bottom-right, above the bottom navigation bar.
 * Minimum tap target 44×44 px (WCAG 2.5.5).
 *
 * Usage:
 *   <app-fab-button
 *     label="Sync & Train"
 *     icon="🔄"
 *     [disabled]="syncing()"
 *     data-testid="sync-train-btn"
 *     (clicked)="syncAndTrain()">
 *   </app-fab-button>
 */
@Component({
  selector: 'app-fab-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      class="fab-btn"
      [attr.data-testid]="testId"
      [disabled]="disabled || null"
      (click)="handleClick()">
      @if (icon) {
        <span class="fab-icon" aria-hidden="true">{{ icon }}</span>
      }
      <span class="fab-label">{{ label }}</span>
    </button>
  `,
  styles: [`
    .fab-btn {
      position: fixed;
      bottom: 80px;
      right: 16px;
      min-width: 44px;
      min-height: 44px;
      z-index: 100;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 28px;
      padding: 0.75rem 1.25rem;
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: background 0.15s, box-shadow 0.15s, opacity 0.15s;
      touch-action: manipulation;
    }

    .fab-btn:hover:not(:disabled) {
      background: #5568d3;
      box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
    }

    .fab-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      pointer-events: none;
    }

    .fab-icon {
      font-size: 1rem;
      line-height: 1;
    }

    .fab-label {
      white-space: nowrap;
    }
  `],
})
export class FabButtonComponent {
  /** Button label text. */
  @Input() label = '';

  /** Optional emoji or text icon displayed before the label. */
  @Input() icon?: string;

  /** Disables the button and prevents click events. */
  @Input() disabled = false;

  /** Value for the `data-testid` attribute. Defaults to "fab-button". */
  @Input('data-testid') testId = 'fab-button';

  /** Emitted when the button is clicked (and not disabled). */
  @Output() clicked = new EventEmitter<void>();

  handleClick(): void {
    if (!this.disabled) {
      this.clicked.emit();
    }
  }
}
