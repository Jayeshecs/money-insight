import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { BottomNavComponent } from './shared/components/bottom-nav/bottom-nav.component';
import { AdPlaceholderComponent } from './shared/components/ad-placeholder/ad-placeholder.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, BottomNavComponent, AdPlaceholderComponent],
  template: `
    <div class="app-container">
      <router-outlet></router-outlet>
    </div>

    <!-- Mobile bottom navigation — rendered only on mobile -->
    <app-bottom-nav *ngIf="isMobile()"></app-bottom-nav>

    <!-- Sticky footer ad (320×50) — rendered only on mobile -->
    <div class="sticky-footer-ad-wrapper" *ngIf="isMobile() && !adDismissed()">
      <app-ad-placeholder
        format="mobile-banner"
        placement="mobile-sticky-footer"
        context="shopping">
      </app-ad-placeholder>
      <button class="sticky-ad-close"
              data-testid="sticky-ad-close"
              (click)="dismissAd()"
              aria-label="Close advertisement">✕</button>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      width: 100%;
    }

    .sticky-footer-ad-wrapper {
      position: fixed;
      bottom: 60px;
      left: 0;
      width: 320px;
      z-index: 600;
    }

    .sticky-ad-close {
      position: absolute;
      top: -10px;
      right: -10px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: none;
      background: #1f2937;
      color: white;
      font-size: 0.7rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      min-width: 24px;
      min-height: 24px;
    }
  `],
})
export class AppComponent implements OnInit {
  title = 'MoneyInsight';

  private router = inject(Router);
  private breakpointObserver = inject(BreakpointObserver);

  isMobile = signal(false);
  adDismissed = signal(false);
  private dismissCount = signal(parseInt(sessionStorage.getItem('adDismissCount') ?? '0', 10));

  ngOnInit(): void {
    this.breakpointObserver
      .observe(['(max-width: 767px)'])
      .subscribe(result => this.isMobile.set(result.matches));
  }

  constructor() {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(() => {
      if (this.adDismissed()) {
        const count = this.dismissCount() + 1;
        this.dismissCount.set(count);
        sessionStorage.setItem('adDismissCount', count.toString());
        if (count >= 3) {
          this.adDismissed.set(false);
          this.dismissCount.set(0);
          sessionStorage.setItem('adDismissCount', '0');
        }
      }
    });
  }

  dismissAd(): void {
    this.adDismissed.set(true);
    this.dismissCount.set(0);
    sessionStorage.setItem('adDismissCount', '0');
  }
}
