import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { SheetsService } from '../../../core/services/sheets.service';

/**
 * AuthCallbackComponent — handles the Google OAuth 2.0 callback redirect.
 *
 * Mounted at /auth/callback.
 * Reads `code` and `state` from the URL query params, exchanges them for
 * tokens via AuthService, ensures the Google Sheet exists, then redirects
 * the user to /import.
 *
 * Reference: docs/design/05_GOOGLE_SHEETS_SYNC.md §1.1
 */
@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="auth-callback">
      <div class="auth-callback__card">
        <ng-container *ngIf="state === 'loading'">
          <div class="auth-callback__spinner" aria-hidden="true"></div>
          <p>Connecting to Google Sheets…</p>
        </ng-container>

        <ng-container *ngIf="state === 'error'">
          <p class="auth-callback__error">⚠ {{ errorMessage }}</p>
          <button (click)="retryLogin()" type="button" class="auth-callback__btn">
            Try Again
          </button>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .auth-callback {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: #f8f9fa;
    }

    .auth-callback__card {
      background: #fff;
      border-radius: 12px;
      padding: 40px 48px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
      text-align: center;
      font-size: 15px;
      color: #3c4043;
      min-width: 280px;
    }

    .auth-callback__spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #e8eaed;
      border-top-color: #1a73e8;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 20px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .auth-callback__error {
      color: #c5221f;
      margin-bottom: 16px;
    }

    .auth-callback__btn {
      background: #1a73e8;
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: 10px 24px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
    }

    .auth-callback__btn:hover {
      background: #1557b0;
    }
  `],
})
export class AuthCallbackComponent implements OnInit {
  state: 'loading' | 'error' = 'loading';
  errorMessage = '';

  constructor(
    private readonly authService: AuthService,
    private readonly sheetsService: SheetsService,
    private readonly router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error');

    if (error) {
      this.state = 'error';
      this.errorMessage = error === 'access_denied'
        ? 'Access was denied. Please try logging in again.'
        : `Authentication error: ${error}`;
      return;
    }

    if (!code || !state) {
      this.state = 'error';
      this.errorMessage = 'Missing authorization parameters. Please try logging in again.';
      return;
    }

    try {
      await this.authService.handleCallback(code, state);
      await this.sheetsService.ensureSheetExists();
      await this.router.navigate(['/import']);
    } catch (err: unknown) {
      this.state = 'error';
      this.errorMessage = err instanceof Error
        ? err.message
        : 'An unexpected error occurred. Please try again.';
    }
  }

  retryLogin(): void {
    this.authService.initiateLogin();
  }
}
