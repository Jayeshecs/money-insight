import { Component } from '@angular/core';

@Component({
  selector: 'app-settings',
  standalone: true,
  template: `
    <div class="settings-container">
      <div class="settings-placeholder" data-testid="settings-placeholder">
        <span class="settings-icon">⚙️</span>
        <h1>Settings</h1>
        <p>Settings — Coming Soon</p>
      </div>
    </div>
  `,
  styles: [`
    .settings-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: #f9fafb;
    }

    .settings-placeholder {
      text-align: center;
      padding: 4rem 2rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
      max-width: 360px;
      width: 100%;
    }

    .settings-icon { font-size: 3rem; display: block; margin-bottom: 1rem; }

    h1 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 0.5rem;
    }

    p {
      color: #6b7280;
      font-size: 1rem;
    }
  `],
})
export class SettingsComponent {}
