import {inject, Injectable, signal} from '@angular/core';
import {Router} from '@angular/router';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable, tap} from 'rxjs';
import {AuthRequestDTO, AuthResponseDTO, UserResponseDTO} from '../models/login-model';
import {environment} from '../../enviroment/enviroment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private router = inject(Router);
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private tokenKey = 'auth_token';
  private userKey = 'auth_user';
  private pendingTermsToken: string | null = null;
  private sessionExpiredMessage = signal<string | null>(null);
  private userSignal = signal<UserResponseDTO | null>(this.readUserFromStorage());
  private rolesSignal = signal<string[]>(this.userSignal()?.roles ?? []);
  public currentUser = this.userSignal.asReadonly();
  public roles = this.rolesSignal.asReadonly();

  constructor() {
    this.rolesSignal.set(this.getUserRoles());
  }

  login(credentials: AuthRequestDTO): Observable<AuthResponseDTO> {
    const url = `${this.apiUrl}/login`;
    this.clearSession();

    return this.http.post<AuthResponseDTO>(url, credentials).pipe(
      tap(response => {
        this.pendingTermsToken = null;

        if (!this.hasAcceptedTerms(response.user)) {
          this.pendingTermsToken = response.token;
          return;
        }

        this.storeSession(response.token, response.user);
        this.redirectToWorkspace();
      })
    );
  }

  acceptTerms(): Observable<UserResponseDTO> {
    const url = `${this.apiUrl}/terms/accept`;
    const token = this.pendingTermsToken ?? this.getToken();
    const options = token
      ? { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) }
      : {};

    return this.http.post<UserResponseDTO>(url, null, options).pipe(
      tap(user => {
        if (token) {
          this.storeSession(token, user);
        } else {
          this.updateUserInStorage(user);
        }
        this.pendingTermsToken = null;
        this.redirectToWorkspace();
      })
    );
  }

  cancelPendingTermsAcceptance(): void {
    this.pendingTermsToken = null;
    this.logout();
  }

  getCurrentUser(): UserResponseDTO | null {
    return this.userSignal();
  }

  redirectToWorkspace(): void {
    this.router.navigate([this.getHomePath()]);
  }

  getHomePath(): string {
    const roles = this.getUserRoles();

    if (roles.includes('ADMIN')) {
      return '/dashboard';
    }
    if (roles.includes('SECRETARY')) {
      return '/agenda';
    }
    if (roles.includes('PROFESSIONAL')) {
      return '/mi-dia';
    }

    this.logout();
    return '/login';
  }

  /**
   * Elimina el token y el usuario de localStorage y navega al inicio de sesión
   */
  logout(expiredMessage: string | null = null): void {
    this.clearSession();

    if (expiredMessage) {
      this.sessionExpiredMessage.set(expiredMessage);
    }

    this.router.navigate(['/login']);
  }

  /**
   * Verifica si el usuario ha iniciado sesión comprobando la presencia de un token en localStorage
   * @returns true si existe un token, false de lo contrario
   */
  isLoggedIn(): boolean {
    const token = this.getToken();

    if (!token) {
      return false;
    }

    if (this.isTokenExpired(token)) {
      this.clearSession();
      return false;
    }

    return true;
  }

  /**
   * Devuelve el token almacenado en localStorage
   */
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Devuelve el objeto de usuario almacenado en localStorage, o null si no se encuentra
   */
  getUser(): UserResponseDTO | null {
    return this.getCurrentUser();
  }

  /**
   * Actualiza el objeto de usuario en localStorage
   * @param user - Datos de usuario actualizados
   */
  updateUserInStorage(user: UserResponseDTO): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.userSignal.set(user);
    this.rolesSignal.set(user.roles ?? []);
  }

  getUserRoles(): string[] {
    const user = this.getCurrentUser();
    return user?.roles ?? [];
  }

  private clearSession(): void {
    this.pendingTermsToken = null;
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.userSignal.set(null);
    this.rolesSignal.set([]);
  }

  private storeSession(token: string, user: UserResponseDTO): void {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
    this.rolesSignal.set(user?.roles ?? []);
    this.userSignal.set(user ?? null);
  }

  private hasAcceptedTerms(user: UserResponseDTO | null | undefined): boolean {
    return user?.acceptedTerms !== false;
  }

  private readUserFromStorage(): UserResponseDTO | null {
    const user = localStorage.getItem(this.userKey);
    return user ? JSON.parse(user) : null;
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1])) as { exp?: number };
      return !!payload.exp && payload.exp * 1000 <= Date.now();
    } catch {
      return true;
    }
  }

  /**
   * Sends a password recovery email.
   * @param email - The user's email address.
   */
  requestPasswordReset(email: string): Observable<{ message: string }> {
    const url = `${this.apiUrl}/password/forgot`;
    return this.http.post<{ message: string }>(url, { email });
  }

  createPassword(token: string, newPassword: string, confirmPassword: string): Observable<void> {
    const url = `${this.apiUrl}/password/create`;
    return this.http.post<void>(url, { token, newPassword, confirmPassword });
  }

  resetPassword(token: string, newPassword: string, confirmPassword: string): Observable<void> {
    const url = `${this.apiUrl}/password/reset`;
    return this.http.post<void>(url, { token, newPassword, confirmPassword });
  }

  changePassword(currentPassword: string, newPassword: string, confirmPassword: string): Observable<void> {
    const url = `${this.apiUrl}/password/change`;
    return this.http.post<void>(url, { currentPassword, newPassword, confirmPassword });
  }

}
