import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ConnectivityService } from './connectivity.service';

describe('ConnectivityService', () => {
  let service: ConnectivityService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ConnectivityService] });
    service = TestBed.inject(ConnectivityService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('isOnline: should return true when navigator.onLine is true', () => {
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    // Re-create to pick up onLine value
    const svc = new ConnectivityService();
    expect(svc.isOnline()).toBeTrue();
  });

  it('should emit true when the online event fires', (done) => {
    const svc = new ConnectivityService();
    let received: boolean | undefined;
    svc.getOnlineStatus().subscribe(v => (received = v));

    window.dispatchEvent(new Event('online'));
    setTimeout(() => {
      expect(received).toBeTrue();
      done();
    }, 50);
  });

  it('should emit false when the offline event fires', (done) => {
    const svc = new ConnectivityService();
    let received: boolean | undefined;
    svc.getOnlineStatus().subscribe(v => (received = v));

    window.dispatchEvent(new Event('offline'));
    setTimeout(() => {
      expect(received).toBeFalse();
      done();
    }, 50);
  });

  it('onReconnect: should invoke callback after online event + debounce', fakeAsync(() => {
    const svc = new ConnectivityService();
    const callback = jasmine.createSpy('callback');

    // Set initial state to offline so we can simulate a reconnect
    window.dispatchEvent(new Event('offline'));
    tick(10);

    svc.onReconnect(callback);

    window.dispatchEvent(new Event('online'));
    tick(2000); // debounceTime(2000)

    expect(callback).toHaveBeenCalledTimes(1);
  }));

  it('onReconnect: should not invoke callback when already online (no state change)', fakeAsync(() => {
    // Create fresh service with onLine=true
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    const svc = new ConnectivityService();
    const callback = jasmine.createSpy('callback');

    svc.onReconnect(callback);

    // Fire online again without going offline first — distinctUntilChanged should prevent duplicate
    window.dispatchEvent(new Event('online'));
    tick(2000);

    expect(callback).toHaveBeenCalledTimes(0);
  }));
});
