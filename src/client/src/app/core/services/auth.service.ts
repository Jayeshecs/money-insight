import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IndexedDbService } from './indexeddb.service';
import { TokenResponse } from '../models/sync-models';

/**
 * AuthService - Google OAuth 2.0 Authorization Code + PKCE
 *
 * Pure SPA implementation - no backend proxy required.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
  private readonly googleClientId = environment.googleClientId;
  private readonly googleClientSecret = environment.googleClientSecret;

  private accessToken: string | null = null;
  private accessTokenExpiry: number | null = null;

  private readonly authState$ = new BehaviorSubject<boolean>(false);

  constructor(
    private readonly http: HttpClient,
    private readonly db: IndexedDbService
  ) {
    this.restoreSessionFromStorage();
  }

  get isAuthenticated$(): Observable<boolean> {
    return this.authState$.asObservable();
  }

  get isAuthenticated(): boolean {
    return this.authState$.getValue();
  }

  async initiateLogin(): Promise<void> {
    if (!this.googleClientId) {
      console.error('[AuthService] googleClientId is not configured in environment.ts.');
      return;
    }
    const state = this.generateRandomString(16);
    const codeVerifier = this.generateRandomString(32);
    const codeChallenge = await this.sha256Base64Url(codeVerifier);
    sessionStorage.setItem('oauth_state', state);
    sessionStorage.setItem('pkce_verifier', codeVerifier);
    const params = new URLSearchParams({
      client_id: this.googleClientId,
      redirect_uri: window.location.origin + '/auth/callback',
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email',
      access_type: 'offline',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      prompt: 'consent',
    });
    window.location.href = 'https://accounts.google.com/o/oauth2/v2/auth?' + params.toString();
  }

  async handleCallback(code: string, state: string): Promise<void> {
    const savedState = sessionStorage.getItem('oauth_state');
    const codeVerifier = sessionStorage.getItem('pkce_verifier');
    sessionStorage.removeItem('oauth_state');
    sessionStorage.removeItem('pkce_verifier');
    if (!savedState || savedState !== state) {
      throw new Error('OAuth state mismatch - possible CSRF attack. Please try logging in again.');
    }
    if (!codeVerifier) {
      throw new Error('PKCE verifier missing. Please try logging in again.');
    }
    const body = new URLSearchParams({
      code,
      client_id: this.googleClientId,
      client_secret: this.googleClientSecret,
      redirect_uri: window.location.origin + '/auth/callback',
      grant_type: 'authorization_code',
      code_verifier: codeVerifier,
    });
    const tokens = await firstValueFrom(
      this.http.post<TokenResponse>(
        this.GOOGLE_TOKEN_ENDPOINT,
        body.toString(),
        { headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' }) }
      )
    );
    if (!tokens) {
      throw new Error('No tokens received from Google');
    }
    await this.storeTokens(tokens);
    this.authState$.next(true);
  }

  async getToken(): Promise<string> {
    if (!this.accessToken || this.isTokenExpiringSoon()) {
      await this.refreshAccessToken();
    }
    if (!this.accessToken) {
      throw new Error('AUTH_ERROR: No valid access token. User must re-authenticate.');
    }
    return this.accessToken;
  }

  async logout(): Promise<void> {
    this.accessToken = null;
    this.accessTokenExpiry = null;
    await this.db.setSetting({
      key: 'refreshToken',
      value: null,
      settingType: 'STRING',
      updatedAt: new Date().toISOString(),
    });
    this.authState$.next(false);
  }

  private async storeTokens(tokens: TokenResponse): Promise<void> {
    this.accessToken = tokens.access_token;
    this.accessTokenExpiry = Date.now() + tokens.expires_in * 1000;
    if (tokens.refresh_token) {
      await this.db.setSetting({
        key: 'refreshToken',
        value: tokens.refresh_token,
        settingType: 'STRING',
        updatedAt: new Date().toISOString(),
      });
    }
  }

  private async refreshAccessToken(): Promise<void> {
    const setting = await this.db.getSetting('refreshToken');
    const refreshToken = setting?.value as string | null;
    if (!refreshToken) {
      this.authState$.next(false);
      throw new Error('AUTH_ERROR: No refresh token found. User must re-authenticate.');
    }
    try {
      const body = new URLSearchParams({
        refresh_token: refreshToken,
        client_id: this.googleClientId,
        client_secret: this.googleClientSecret,
        grant_type: 'refresh_token',
      });
      const tokens = await firstValueFrom(
        this.http.post<TokenResponse>(
          this.GOOGLE_TOKEN_ENDPOINT,
          body.toString(),
          { headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded' }) }
        )
      );
      if (!tokens) {
        throw new Error('Empty response from token endpoint');
      }
      this.accessToken = tokens.access_token;
      this.accessTokenExpiry = Date.now() + tokens.expires_in * 1000;
    } catch {
      this.accessToken = null;
      this.authState$.next(false);
      throw new Error('AUTH_ERROR: Token refresh failed. User must re-authenticate.');
    }
  }

  private isTokenExpiringSoon(): boolean {
    if (!this.accessTokenExpiry) {
      return true;
    }
    return Date.now() > this.accessTokenExpiry - 5 * 60 * 1000;
  }

  private async restoreSessionFromStorage(): Promise<void> {
    try {
      const setting = await this.db.getSetting('refreshToken');
      if (setting?.value) {
        this.authState$.next(true);
      }
    } catch {
      // IDB not available - silently ignore
    }
  }

  private generateRandomString(byteLength: number): string {
    const bytes = new Uint8Array(byteLength);
    crypto.getRandomValues(bytes);
    return this.base64UrlEncode(bytes);
  }

  private async sha256Base64Url(plain: string): Promise<string> {
    const data = new TextEncoder().encode(plain);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return this.base64UrlEncode(new Uint8Array(digest));
  }

  private base64UrlEncode(bytes: Uint8Array): string {
    return btoa(String.fromCharCode(...bytes))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  }
}
