import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="bottom-nav" data-testid="bottom-nav" aria-label="Mobile navigation">
      <a routerLink="/dashboard" routerLinkActive="active"
         class="nav-item" data-testid="bottom-nav-dashboard">
        <span class="nav-icon">📊</span>
        <span class="nav-label">Dashboard</span>
      </a>
      <a routerLink="/transactions" routerLinkActive="active"
         class="nav-item" data-testid="bottom-nav-transactions">
        <span class="nav-icon">📋</span>
        <span class="nav-label">Transactions</span>
      </a>
      <a routerLink="/import" routerLinkActive="active"
         class="nav-item" data-testid="bottom-nav-import">
        <span class="nav-icon">⬆️</span>
        <span class="nav-label">Import</span>
      </a>
      <a routerLink="/settings" routerLinkActive="active"
         class="nav-item" data-testid="bottom-nav-settings">
        <span class="nav-icon">⚙️</span>
        <span class="nav-label">Settings</span>
      </a>
    </nav>
  `,
  styles: [`
    :host {
      display: none; /* hidden by default; shown only on mobile via global CSS */
    }

    @media (max-width: 767px) {
      :host { display: block; }
    }

    .bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 60px;
      background: white;
      border-top: 1px solid #e5e7eb;
      display: flex;
      z-index: 500;
      box-shadow: 0 -2px 8px rgba(0,0,0,0.08);
    }

    .nav-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      color: #6b7280;
      min-height: 44px;
      min-width: 44px;
      gap: 2px;
      transition: color 0.15s;

      &:hover, &.active {
        color: #667eea;
      }
    }

    .nav-icon {
      font-size: 1.2rem;
      line-height: 1;
    }

    .nav-label {
      font-size: 0.65rem;
      font-weight: 500;
    }
  `],
})
export class BottomNavComponent {}
