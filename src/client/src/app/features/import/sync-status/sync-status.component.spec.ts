import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SyncStatusComponent } from './sync-status.component';
import { SyncService } from '../../../core/services/sync.service';
import { AuthService } from '../../../core/services/auth.service';
import { BehaviorSubject } from 'rxjs';
import { SyncStatus } from '../../../core/models/sync-models';

describe('SyncStatusComponent', () => {
  let component: SyncStatusComponent;
  let fixture: ComponentFixture<SyncStatusComponent>;
  let syncStatus$: BehaviorSubject<SyncStatus>;
  let syncServiceSpy: jasmine.SpyObj<SyncService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    syncStatus$ = new BehaviorSubject<SyncStatus>({ state: 'idle', message: '' });

    syncServiceSpy = jasmine.createSpyObj<SyncService>('SyncService', [
      'getSyncStatus',
      'processSyncQueue',
    ]);
    syncServiceSpy.getSyncStatus.and.returnValue(syncStatus$.asObservable());
    syncServiceSpy.processSyncQueue.and.returnValue(Promise.resolve());

    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['initiateLogin']);

    await TestBed.configureTestingModule({
      imports: [SyncStatusComponent],
      providers: [
        { provide: SyncService, useValue: syncServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SyncStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should NOT render the bar in idle state', () => {
    syncStatus$.next({ state: 'idle', message: '' });
    fixture.detectChanges();
    const bar = fixture.nativeElement.querySelector('.sync-status-bar');
    expect(bar).toBeNull();
  });

  it('should show spinner and message in syncing state', () => {
    syncStatus$.next({ state: 'syncing', message: 'Syncing to Google Sheets…' });
    fixture.detectChanges();
    const bar = fixture.nativeElement.querySelector('.sync-status-bar--syncing');
    const spinner = fixture.nativeElement.querySelector('.sync-spinner');
    const msg = fixture.nativeElement.querySelector('.sync-message');
    expect(bar).not.toBeNull();
    expect(spinner).not.toBeNull();
    expect(msg.textContent).toContain('Syncing to Google Sheets');
  });

  it('should show success icon and message in success state', () => {
    syncStatus$.next({ state: 'success', message: 'Synced to Google Sheets ✓' });
    fixture.detectChanges();
    const bar = fixture.nativeElement.querySelector('.sync-status-bar--success');
    const icon = fixture.nativeElement.querySelector('.sync-icon--success');
    expect(bar).not.toBeNull();
    expect(icon).not.toBeNull();
  });

  it('should show Retry button in failed state', () => {
    syncStatus$.next({ state: 'failed', message: 'Sync failed' });
    fixture.detectChanges();
    const bar = fixture.nativeElement.querySelector('.sync-status-bar--failed');
    const retryBtn = fixture.nativeElement.querySelector('.sync-btn--retry');
    expect(bar).not.toBeNull();
    expect(retryBtn).not.toBeNull();
    expect(retryBtn.textContent.trim()).toBe('Retry Sync');
  });

  it('should call processSyncQueue when Retry button is clicked', () => {
    syncStatus$.next({ state: 'failed', message: 'Sync failed' });
    fixture.detectChanges();
    const retryBtn = fixture.nativeElement.querySelector('.sync-btn--retry');
    retryBtn.click();
    expect(syncServiceSpy.processSyncQueue).toHaveBeenCalled();
  });

  it('should show Retry button in queued state', () => {
    syncStatus$.next({ state: 'queued', message: 'Sync queued' });
    fixture.detectChanges();
    const retryBtn = fixture.nativeElement.querySelector('.sync-btn--retry');
    expect(retryBtn).not.toBeNull();
  });

  it('should show Reconnect button in auth_error state', () => {
    syncStatus$.next({ state: 'auth_error', message: 'Please re-authenticate.' });
    fixture.detectChanges();
    const reconnectBtn = fixture.nativeElement.querySelector('.sync-btn--reconnect');
    expect(reconnectBtn).not.toBeNull();
    expect(reconnectBtn.textContent).toContain('Reconnect');
  });

  it('should call initiateLogin when Reconnect button is clicked', () => {
    syncStatus$.next({ state: 'auth_error', message: 'Auth error' });
    fixture.detectChanges();
    const reconnectBtn = fixture.nativeElement.querySelector('.sync-btn--reconnect');
    reconnectBtn.click();
    expect(authServiceSpy.initiateLogin).toHaveBeenCalled();
  });

  it('should show hourglass icon in queued state', () => {
    syncStatus$.next({ state: 'queued', message: 'Waiting for network' });
    fixture.detectChanges();
    const icon = fixture.nativeElement.querySelector('.sync-icon--info');
    expect(icon).not.toBeNull();
    expect(icon.textContent).toBe('⏳');
  });

  it('should unsubscribe on destroy', () => {
    const unsubSpy = jasmine.createSpy('unsubscribe');
    (component as any).sub = { unsubscribe: unsubSpy };
    component.ngOnDestroy();
    expect(unsubSpy).toHaveBeenCalledTimes(1);
  });
});
