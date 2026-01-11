import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ContentService } from '../../../core/services/content.service';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';
import { CtaButtonComponent } from '../cta-button/cta-button.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, ThemeToggleComponent, CtaButtonComponent],
  template: `
    <header class="header">
      <a href="#main" class="skip-link">Skip to main content</a>
      <div class="container">
        <div class="header-content">
          <a routerLink="/" class="logo" aria-label="Ventio Home">
            <img src="assets/images/ventio_icon.png" alt="Ventio Logo" class="logo-image">
            <span class="logo-text">{{ content.company.name }}</span>
          </a>

          <nav class="nav desktop-only" aria-label="Main navigation">
            <ul class="nav-list">
              <li *ngFor="let link of content.navigation.links">
                <a 
                  [routerLink]="link.route" 
                  routerLinkActive="active"
                  [routerLinkActiveOptions]="{ exact: link.route === '/' }"
                  class="nav-link">
                  {{ link.label }}
                </a>
              </li>
            </ul>
          </nav>

          <div class="header-actions">
            <app-theme-toggle></app-theme-toggle>
            <app-cta-button 
              class="desktop-only"
              [text]="content.home.hero.ctaPrimary"
              [href]="content.product.moneyInsightUrl"
              [external]="true"
              variant="primary"
              size="small">
            </app-cta-button>
            <button 
              class="mobile-menu-toggle mobile-only"
              [class.active]="mobileMenuOpen"
              (click)="toggleMobileMenu()"
              [attr.aria-expanded]="mobileMenuOpen"
              aria-label="Toggle menu">
              <span class="hamburger"></span>
            </button>
          </div>
        </div>

        <!-- Mobile Menu -->
        <div class="mobile-menu" [class.open]="mobileMenuOpen">
          <nav aria-label="Mobile navigation">
            <ul class="mobile-nav-list">
              <li *ngFor="let link of content.navigation.links">
                <a 
                  [routerLink]="link.route" 
                  routerLinkActive="active"
                  [routerLinkActiveOptions]="{ exact: link.route === '/' }"
                  class="mobile-nav-link"
                  (click)="closeMobileMenu()">
                  {{ link.label }}
                </a>
              </li>
              <li class="mobile-cta">
                <app-cta-button 
                  [text]="content.home.hero.ctaPrimary"
                  [href]="content.product.moneyInsightUrl"
                  [external]="true"
                  variant="primary"
                  size="medium">
                </app-cta-button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  `,
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  content: any;
  mobileMenuOpen = false;

  constructor(private contentService: ContentService) {
    this.content = this.contentService.getContent();
  }

  ngOnInit(): void {
    this.contentService.content$.subscribe(content => {
      this.content = content;
    });
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
    if (this.mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
    document.body.style.overflow = '';
  }
}
