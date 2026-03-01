import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-wrapper"
         *ngIf="toastService.state().visible"
         data-testid="category-saved-toast"
         role="status"
         aria-live="polite">
      <span class="toast-icon">✅</span>
      <span class="toast-message">{{ toastService.state().message }}</span>
    </div>
  `,
  styles: [`
    .toast-wrapper {
      position: fixed;
      bottom: 1.5rem;
      left: 50%;
      transform: translateX(-50%);
      background: #1f2937;
      color: white;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.25);
      z-index: 9999;
      animation: slideUp 0.2s ease-out;
    }

    .toast-icon { font-size: 1rem; }

    @keyframes slideUp {
      from { transform: translateX(-50%) translateY(10px); opacity: 0; }
      to   { transform: translateX(-50%) translateY(0); opacity: 1; }
    }
  `],
})
export class ToastComponent {
  toastService = inject(ToastService);
}
