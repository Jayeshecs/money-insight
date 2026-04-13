import { Component, inject } from '@angular/core';
import { UserPreferencesService } from '../../core/services/user-preferences.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  template: `
    <div class="settings-container">
      <div class="settings-content">
        <h1>Settings</h1>

        <section class="settings-section" data-testid="ad-preferences-section">
          <h2 class="section-title">Ad Preferences</h2>
          <div class="setting-row">
            <label class="setting-label" data-testid="show-ads-label" for="show-ads-toggle">
              Show ad placeholders
            </label>
            <input
              id="show-ads-toggle"
              type="checkbox"
              role="switch"
              data-testid="show-ads-toggle"
              [checked]="prefs.showAds()"
              [attr.aria-checked]="prefs.showAds()"
              (change)="onToggleAds($event)"
            />
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .settings-container {
      min-height: 100vh;
      background: #f9fafb;
      padding: 2rem 1rem;
    }

    .settings-content {
      max-width: 600px;
      margin: 0 auto;
    }

    h1 {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 2rem;
    }

    .settings-section {
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .section-title {
      font-size: 1rem;
      font-weight: 600;
      color: #374151;
      margin: 0 0 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #f3f4f6;
    }

    .setting-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }

    .setting-label {
      font-size: 0.9375rem;
      color: #374151;
      cursor: pointer;
    }

    input[type="checkbox"][role="switch"] {
      width: 2.75rem;
      height: 1.5rem;
      accent-color: #4f46e5;
      cursor: pointer;
      flex-shrink: 0;
    }
  `],
})
export class SettingsComponent {
  readonly prefs = inject(UserPreferencesService);

  onToggleAds(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.prefs.setShowAds(checked);
  }
}
