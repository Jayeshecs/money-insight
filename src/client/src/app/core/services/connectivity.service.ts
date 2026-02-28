import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, pairwise } from 'rxjs/operators';

/**
 * ConnectivityService — online/offline detection + auto-sync trigger
 *
 * Detects connectivity transitions and automatically fires the sync queue
 * processor when the browser comes back online (with a 2 s debounce to
 * avoid racing during flaky reconnects).
 *
 * Reference: docs/design/05_GOOGLE_SHEETS_SYNC.md §4.2
 */
@Injectable({ providedIn: 'root' })
export class ConnectivityService {
  private readonly online$ = new BehaviorSubject<boolean>(navigator.onLine);

  constructor() {
    window.addEventListener('online', () => this.online$.next(true));
    window.addEventListener('offline', () => this.online$.next(false));
  }

  /** Observable of the current online state (emits on every change) */
  getOnlineStatus(): Observable<boolean> {
    return this.online$.asObservable().pipe(distinctUntilChanged());
  }

  /** Returns the current synchronous online state */
  isOnline(): boolean {
    return this.online$.getValue();
  }

  /**
   * Subscribes to online transitions and calls the provided callback after a
   * 2 s debounce. The caller is responsible for unsubscribing.
   *
   * @param callback  Function to call when connectivity is restored
   * @returns Subscription that the caller should unsubscribe from on destroy
   */
  onReconnect(callback: () => void) {
    return this.online$
      .pipe(
        distinctUntilChanged(),
        pairwise(),                                    // emit [prev, curr] pairs
        filter(([prev, curr]) => !prev && curr),       // only offline → online transitions
        debounceTime(2000)
      )
      .subscribe(() => callback());
  }
}
