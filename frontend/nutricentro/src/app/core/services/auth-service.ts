import {inject, Injectable, signal} from '@angular/core';
import {Router} from '@angular/router';
import {HttpClient} from '@angular/common/http';
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
  private sessionExpiredMessage = signal<string | null>(null);
  private rolesSignal = signal<string[]>(this.getUserRoles());
  public roles = this.rolesSignal.asReadonly();

  constructor() {
    this.rolesSignal.set(this.getUserRoles());
  }

  login(credentials: AuthRequestDTO): Observable<AuthResponseDTO> {
    const url = `${this.apiUrl}/login`;
    this.clearSession();

    return this.http.post<AuthResponseDTO>(url, credentials).pipe(
      tap(response => {

        localStorage.setItem(
          this.tokenKey,
          response.token
        );

        localStorage.setItem(
          this.userKey,
          JSON.stringify(response.user)
        );

        this.rolesSignal.set(response.user?.roles ?? []);

        this.redirectToDashboard();
      })
    );
  }

  getCurrentUser(): UserResponseDTO | null {

    const user = localStorage.getItem(this.userKey);

    if (!user) {
      return null;
    }

    return JSON.parse(user);
  }

  redirectToDashboard(): void {
    const roles = this.getUserRoles();

    if (roles.includes('ADMIN')) {
      this.router.navigate(['/dashboard']);
      return;
    }
    if (roles.includes('SECRETARY')) {
      this.router.navigate(['/agenda']);
      return;
    }
    if (roles.includes('PROFESSIONAL')) {
      this.router.navigate(['/agenda']);
      return;
    }

    this.logout();
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
    const user = localStorage.getItem(this.userKey);
    return user ? JSON.parse(user) : null;
  }

  /**
   * Actualiza el objeto de usuario en localStorage
   * @param user - Datos de usuario actualizados
   */
  updateUserInStorage(user: UserResponseDTO): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  getUserRoles(): string[] {
    const user = this.getCurrentUser();
    return user?.roles ?? [];
  }

  private clearSession(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.rolesSignal.set([]);
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
  requestPasswordReset(email: string): Observable<void> {
    const url = `${this.apiUrl}/password/forgot`;
    return this.http.post<void>(url, { usernameOrEmail: email });
  }

}
