import {inject, Injectable, signal} from '@angular/core';
import {Router} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {Observable, tap} from 'rxjs';
import {AuthRequestDTO, AuthResponseDTO, UserResponseDTO} from '../model/login-model';
import {environment} from '../../enviroment/enviroment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  public errorMsg: string | null = null;
  private router = inject(Router);
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/v1/auth`;
  private tokenKey = 'auth_token';
  private userKey = 'auth_user';
  // private firstLoginToken = 'first_login_token';
  // private firstLoginTokenCamelCase = 'firstLoginToken';
  private sessionExpiredMessage = signal<string | null>(null);
  private rolesSignal = signal<string[]>(this.getUserRoles());
  public roles = this.rolesSignal.asReadonly();


  constructor() {
    this.rolesSignal.set(this.getUserRoles());
  }


  login(credentials: AuthRequestDTO): Observable<AuthResponseDTO> {
    const url = `${this.apiUrl}/login`;

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
      this.router.navigate(['/history']);
      return;
    }

    this.logout();
  }

  // /**
  //  * Maneja la redirección después del inicio de sesión según si es el primer inicio de sesión del usuario.
  //  * @param response - La respuesta de inicio de sesión que contiene los detalles del usuario y el token.
  //  */
  // private handlePostLoginRedirect(response: AuthResponseDTO): void {
  //   if (response.firstLoginToken) {
  //     this.router.navigate(['/password-reset'], {
  //       queryParams: { first: true, firstLoginToken: response.firstLoginToken }
  //     });
  //   } else {
  //     this.redirectToDashboard();
  //   }
  // }

  /**
   * Elimina el token y el usuario de localStorage y navega al inicio de sesión
   */
  logout(expiredMessage: string | null = null): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);

    this.rolesSignal.set([]);

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
    return !!this.getToken();
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


  /**
   * Sends a password recovery email.
   * @param email - The user's email address.
   */
  requestPasswordReset(email: string): Observable<void> {
    const url = `${this.apiUrl}/internal/forgot-password`;
    return this.http.post<void>(url, { email });
  }

}
