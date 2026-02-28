import { Component, ChangeDetectorRef, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { SyncService } from '../../../core/services/sync.service';
import { AuthService } from '../../../core/services/auth.service';
import { SyncStatus } from '../../../core/models/sync-models';

/**
 * SyncStatusComponent — displays the real-time sync state bar.
 *
 * States and their UI:
 * - idle        → hidden
 * - syncing     → spinner + "Syncing to Google Sheets…"
 * - success     → tick + "Synced to Google Sheets ✓"   (auto-dismisses after 4 s)
 * - failed      → warning + error message + "Retry" button
 * - queued      → info + "Sync queued — will retry when online"
 * - auth_error  → error + "Please re-authenticate." + "Reconnect" CTA
 *
 * Usage: Add <app-sync-status> to the import screen template.
 *
 * Reference: docs/design/05_GOOGLE_SHEETS_SYNC.md §2.2 (TC3, TC4, TC5)
 */
@Component({
  selector: 'app-sync-status',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      [class]="'sync-status-bar sync-status-bar--' + status.state"
      [attr.data-testid]="'sync-status-bar-' + status.state"
      *ngIf="status && status.state !== 'idle'"
      role="status"
      [attr.aria-live]="status.state === 'syncing' ? 'polite' : 'assertive'"
    >
      <!-- Spinner for syncing -->
      <span
        *ngIf="status.state === 'syncing'"
        class="sync-spinner"
        aria-hidden="true"
      ></span>

      <!-- Icon for success -->
      <span
        *ngIf="status.state === 'success'"
        class="sync-icon sync-icon--success"
        aria-hidden="true"
      >✓</span>

      <!-- Icon for failed / auth_error -->
      <span
        *ngIf="status.state === 'failed' || status.state === 'auth_error'"
        class="sync-icon sync-icon--error"
        aria-hidden="true"
      >⚠</span>

      <!-- Icon for queued -->
      <span
        *ngIf="status.state === 'queued'"
        class="sync-icon sync-icon--info"
        aria-hidden="true"
      >⏳</span>

      <!-- Message text -->
      <span class="sync-message">{{ status.message }}</span>

      <!-- Retry button (failed or queued) -->
      <button
        *ngIf="status.state === 'failed' || status.state === 'queued'"
        class="sync-btn sync-btn--retry"
        (click)="onRetry()"
        type="button"
      >
        Retry Sync
      </button>

      <!-- Re-authenticate CTA (auth_error) -->
      <button
        *ngIf="status.state === 'auth_error'"
        class="sync-btn sync-btn--reconnect"
        (click)="onReconnect()"
        type="button"
      >
        Reconnect Google Sheets
      </button>
    </div>
  `,
  styles: [`
    .sync-status-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      margin: 8px 0;
      transition: all 0.2s ease;
    }

    .sync-status-bar--syncing {
      background: #e8f4fd;
      color: #1a73e8;
      border: 1px solid #aecbfa;
    }

    .sync-status-bar--success {
      background: #e6f4ea;
      color: #137333;
      border: 1px solid #a8d5b5;
    }

    .sync-status-bar--failed {
      background: #fce8e6;
      color: #c5221f;
      border: 1px solid #f5c6c5;
    }

    .sync-status-bar--queued {
      background: #fef7e0;
      color: #b06000;
      border: 1px solid #fde293;
    }

    .sync-status-bar--auth_error {
      background: #fce8e6;
      color: #c5221f;
      border: 1px solid #f5c6c5;
    }

    .sync-spinner {
      width: 14px;
      height: 14px;
      border: 2px solid currentColor;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      flex-shrink: 0;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .sync-icon {
      font-size: 16px;
      flex-shrink: 0;
    }

    .sync-message {
      flex: 1;
    }

    .sync-btn {
      padding: 4px 12px;
      border-radius: 4px;
      border: none;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
      white-space: nowrap;
    }

    .sync-btn--retry {
      background: #1a73e8;
      color: #fff;
    }

    .sync-btn--retry:hover {
      background: #1557b0;
    }

    .sync-btn--reconnect {
      background: #c5221f;
      color: #fff;
    }

    .sync-btn--reconnect:hover {
      background: #a50e0e;
    }
  `],
})
export class SyncStatusComponent implements OnInit, OnDestroy {
  status: SyncStatus | null = null;

  private sub: Subscription | null = null;

  constructor(
    private readonly syncService: SyncService,
    private readonly authService: AuthService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.sub = this.syncService.getSyncStatus().subscribe(status => {
      this.status = status;
      // markForCheck() ensures the view updates even when this subscription
      // fires outside Angular’s zone (e.g. from IDB callbacks).
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  onRetry(): void {
    this.syncService.processSyncQueue();
  }

  onReconnect(): void {
    this.authService.initiateLogin();
  }
}
