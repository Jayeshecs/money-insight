import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-cta-button',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <a 
      *ngIf="link"
      [routerLink]="link"
      [class]="getButtonClasses()"
      [attr.aria-label]="ariaLabel || text">
      {{ text }}
    </a>
    <a 
      *ngIf="href"
      [href]="href"
      [target]="external ? '_blank' : '_self'"
      [rel]="external ? 'noopener noreferrer' : ''"
      [class]="getButtonClasses()"
      [attr.aria-label]="ariaLabel || text">
      {{ text }}
    </a>
    <button 
      *ngIf="!link && !href"
      [type]="type"
      [class]="getButtonClasses()"
      [disabled]="disabled"
      [attr.aria-label]="ariaLabel || text"
      (click)="handleClick()">
      {{ text }}
    </button>
  `,
  styles: [`
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      border-radius: 4px;
      border: 2px solid transparent;
      cursor: pointer;
      transition: all 150ms ease-in-out;
      text-decoration: none;
      font-family: 'Inter', sans-serif;
      white-space: nowrap;

      &:focus-visible {
        outline: 2px solid var(--color-primary);
        outline-offset: 2px;
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .btn-primary {
      background: var(--color-primary);
      color: var(--color-text-inverse);
      box-shadow: var(--shadow-md);

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: var(--shadow-lg);
      }

      &:active:not(:disabled) {
        transform: translateY(0);
      }
    }

    .btn-secondary {
      background: transparent;
      color: var(--color-primary);
      border-color: var(--color-primary);

      &:hover:not(:disabled) {
        background: var(--color-primary);
        color: var(--color-text-inverse);
      }
    }

    .btn-accent {
      background: var(--color-accent);
      color: var(--color-text-inverse);

      &:hover:not(:disabled) {
        transform: scale(1.05);
      }
    }

    .btn-small {
      padding: 8px 16px;
      font-size: 0.875rem;
    }

    .btn-medium {
      padding: 12px 24px;
      font-size: 1rem;
    }

    .btn-large {
      padding: 16px 32px;
      font-size: 1.125rem;
    }
  `]
})
export class CtaButtonComponent {
  @Input() text: string = 'Button';
  @Input() variant: 'primary' | 'secondary' | 'accent' = 'primary';
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() link?: string;
  @Input() href?: string;
  @Input() external: boolean = false;
  @Input() type: 'button' | 'submit' = 'button';
  @Input() disabled: boolean = false;
  @Input() ariaLabel?: string;

  getButtonClasses(): string {
    return `btn btn-${this.variant} btn-${this.size}`;
  }

  handleClick(): void {
    // Emit event or handle click logic
  }
}
