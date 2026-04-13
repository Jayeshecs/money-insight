import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'mi_show_ads';

@Injectable({ providedIn: 'root' })
export class UserPreferencesService {
  showAds = signal<boolean>(localStorage.getItem(STORAGE_KEY) === 'true');

  setShowAds(value: boolean): void {
    this.showAds.set(value);
    localStorage.setItem(STORAGE_KEY, String(value));
  }
}
