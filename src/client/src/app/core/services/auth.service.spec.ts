import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { IndexedDbService } from './indexeddb.service';

const flushPromises = (): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, 0));

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let dbSpy: jasmine.SpyObj<IndexedDbService>;

  beforeEach(() => {
    dbSpy = jasmine.createSpyObj<IndexedDbService>('IndexedDbService', [
      'getSetting',
      'setSetting',
    ]);
    dbSpy.getSetting.and.returnValue(Promise.resolve(undefined));
    dbSpy.setSetting.and.returnValue(Promise.resolve('refreshToken'));

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: IndexedDbService, useValue: dbSpy },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should be unauthenticated initially when no stored refresh token', async () => {
    // Wait for restoreSessionFromStorage
    await new Promise(r => setTimeout(r, 50));
    expect(service.isAuthenticated).toBeFalse();
  });

  it('should be authenticated when a stored refresh token exists', async () => {
    dbSpy.getSetting.and.returnValue(
      Promise.resolve({ key: 'refreshToken', value: 'stored-token', settingType: 'STRING', updatedAt: '' })
    );
    // Re-create service with the new stub
    const freshService = new AuthService(
      TestBed.inject(HttpClientTestingModule as any),
      dbSpy
    );
    await new Promise(r => setTimeout(r, 50));
    expect(freshService.isAuthenticated).toBeTrue();
  });

  it('should throw on state mismatch in handleCallback', async () => {
    sessionStorage.setItem('oauth_state', 'correct_state');
    await expectAsync(
      service.handleCallback('some-code', 'wrong_state')
    ).toBeRejectedWithError(/state mismatch/i);
  });

  it('should store tokens and set isAuthenticated on successful handleCallback', async () => {
    sessionStorage.setItem('oauth_state', 'test_state');
    sessionStorage.setItem('pkce_verifier', 'test_verifier');

    const callbackPromise = service.handleCallback('auth-code', 'test_state');

    await flushPromises();

    const req = httpMock.expectOne('https://oauth2.googleapis.com/token');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toContain('code=auth-code');
    expect(req.request.body).toContain('code_verifier=test_verifier');
    expect(req.request.body).toContain('client_secret=');
    req.flush({ access_token: 'at', refresh_token: 'rt', expires_in: 3600, token_type: 'Bearer' });

    await callbackPromise;

    expect(dbSpy.setSetting).toHaveBeenCalledWith(
      jasmine.objectContaining({ key: 'refreshToken', value: 'rt' })
    );
    expect(service.isAuthenticated).toBeTrue();
  });

  it('getToken should refresh when access token is missing', async () => {
    dbSpy.getSetting.and.returnValue(
      Promise.resolve({ key: 'refreshToken', value: 'rt', settingType: 'STRING', updatedAt: '' })
    );

    const tokenPromise = service.getToken();

    // Wait for getSetting() to resolve so the HTTP refresh request is queued
    await flushPromises();

    const req = httpMock.expectOne('https://oauth2.googleapis.com/token');
    expect(req.request.body).toContain('refresh_token=rt');
    expect(req.request.body).toContain('client_secret=');
    req.flush({ access_token: 'new-at', refresh_token: 'rt', expires_in: 3600, token_type: 'Bearer' });

    const token = await tokenPromise;
    expect(token).toBe('new-at');
  });

  it('getToken should throw AUTH_ERROR when no refresh token', async () => {
    dbSpy.getSetting.and.returnValue(Promise.resolve(undefined));
    await expectAsync(service.getToken()).toBeRejectedWithError(/AUTH_ERROR/);
  });

  it('logout should clear tokens and set isAuthenticated to false', async () => {
    sessionStorage.setItem('oauth_state', 'st');
    service['accessToken'] = 'at';
    await service.logout();
    expect(service.isAuthenticated).toBeFalse();
    expect(dbSpy.setSetting).toHaveBeenCalledWith(
      jasmine.objectContaining({ key: 'refreshToken', value: null })
    );
  });
});
