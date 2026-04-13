import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar navbar-expand-lg"
         data-testid="app-header"
         aria-label="Main navigation"
         style="background-color: #1976d2;">
      <div class="container-fluid">

        <!-- Brand -->
        <a class="navbar-brand text-white fw-bold d-flex align-items-center gap-2"
           routerLink="/dashboard"
           data-testid="header-app-title">
          <span class="material-icons">account_balance</span>
          MoneyInsight
        </a>

        <!-- Hamburger button (visible at < lg) -->
        <button
          class="navbar-toggler border-0"
          type="button"
          data-testid="header-hamburger-btn"
          aria-label="Toggle navigation"
          [attr.aria-expanded]="menuOpen()"
          aria-controls="header-mobile-menu"
          (click)="toggleMenu()">
          <span class="material-icons text-white">{{ menuOpen() ? 'close' : 'menu' }}</span>
        </button>

        <!-- Collapsible nav content -->
        <div class="navbar-collapse"
             id="header-mobile-menu"
             data-testid="header-mobile-menu"
             [class.collapse]="!menuOpen()"
             [class.show]="menuOpen()">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item">
              <a class="nav-link text-white"
                 routerLink="/dashboard"
                 routerLinkActive="active"
                 data-testid="header-nav-dashboard">Dashboard</a>
            </li>
            <li class="nav-item">
              <a class="nav-link text-white"
                 routerLink="/transactions"
                 routerLinkActive="active"
                 data-testid="header-nav-transactions">Transactions</a>
            </li>
            <li class="nav-item">
              <a class="nav-link text-white"
                 routerLink="/import"
                 routerLinkActive="active"
                 data-testid="header-nav-import">Import</a>
            </li>
            <li class="nav-item">
              <a class="nav-link text-white"
                 routerLink="/settings"
                 routerLinkActive="active"
                 data-testid="header-nav-settings">Settings</a>
            </li>
          </ul>

          <!-- Mobile divider -->
          <hr class="d-lg-none border-white opacity-25 my-1">

          <!-- User info block -->
          <div class="d-flex align-items-center gap-2 py-1" data-testid="header-user-info">
            @if (authService.isAuthenticated) {
              <span class="badge bg-success rounded-pill d-flex align-items-center gap-1"
                    data-testid="header-drive-status">
                <span class="material-icons" style="font-size:0.8rem;line-height:1;">check_circle</span>
                Connected
              </span>
              <button class="btn btn-sm btn-outline-light"
                      data-testid="header-sign-out-btn"
                      (click)="signOut()">Sign Out</button>
            } @else {
              <span class="badge bg-danger rounded-pill d-flex align-items-center gap-1"
                    data-testid="header-drive-status">
                <span class="material-icons" style="font-size:0.8rem;line-height:1;">cloud_off</span>
                Offline
              </span>
            }
          </div>
        </div>

      </div>
    </nav>
  `,
  styles: [`
    .navbar-brand:hover { opacity: 0.9; text-decoration: none; }

    .nav-link.active {
      font-weight: 600;
      text-decoration: underline;
      opacity: 1 !important;
    }

    .nav-link { opacity: 0.85; }
    .nav-link:hover { opacity: 1; }

    /* Mobile menu background */
    @media (max-width: 991px) {
      .navbar-collapse.show {
        background-color: #1565c0;
        padding: 0.5rem 1rem;
        border-radius: 0 0 8px 8px;
      }
    }
  `]
})
export class AppHeaderComponent {
  readonly authService = inject(AuthService);
  readonly menuOpen = signal(false);

  toggleMenu(): void {
    this.menuOpen.update(v => !v);
  }

  signOut(): void {
    this.authService.logout();
    this.menuOpen.set(false);
  }
}
