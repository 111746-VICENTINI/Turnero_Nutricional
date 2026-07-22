import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth-service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
      ],
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('sends password recovery with email only', () => {
    service.requestPasswordReset('user@test.com').subscribe(response => {
      expect(response.message).toContain('correo');
    });

    const request = httpMock.expectOne('/api/v1/auth/password/forgot');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ email: 'user@test.com' });
    request.flush({ message: 'Si el correo esta registrado, recibiras instrucciones.' });
  });

  it('stores backend roles after login by email', () => {
    service.login({ email: 'user@test.com', password: 'Password1' }).subscribe();

    const request = httpMock.expectOne('/api/v1/auth/login');
    expect(request.request.body).toEqual({ email: 'user@test.com', password: 'Password1' });
    request.flush({
      token: 'header.eyJleHAiOjk5OTk5OTk5OTl9.signature',
      tokenType: 'Bearer',
      user: {
        id: 1,
        username: 'nutricentro_admin_test',
        email: 'user@test.com',
        isActive: true,
        passwordConfigured: true,
        acceptedTerms: true,
        acceptedTermsAt: '2026-07-22T10:00:00',
        roles: ['ADMIN'],
      },
    });

    expect(localStorage.getItem('auth_token')).toBe('header.eyJleHAiOjk5OTk5OTk5OTl9.signature');
    expect(service.getUserRoles()).toEqual(['ADMIN']);
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('keeps pending terms login out of storage until terms are accepted', () => {
    service.login({ email: 'user@test.com', password: 'Password1' }).subscribe();

    const loginRequest = httpMock.expectOne('/api/v1/auth/login');
    loginRequest.flush({
      token: 'header.eyJleHAiOjk5OTk5OTk5OTl9.signature',
      tokenType: 'Bearer',
      user: {
        id: 1,
        username: 'professional',
        email: 'user@test.com',
        isActive: true,
        passwordConfigured: true,
        acceptedTerms: false,
        acceptedTermsAt: null,
        roles: ['PROFESSIONAL'],
      },
    });

    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(router.navigate).not.toHaveBeenCalled();

    service.acceptTerms().subscribe();

    const acceptRequest = httpMock.expectOne('/api/v1/auth/terms/accept');
    expect(acceptRequest.request.method).toBe('POST');
    expect(acceptRequest.request.headers.get('Authorization'))
      .toBe('Bearer header.eyJleHAiOjk5OTk5OTk5OTl9.signature');
    acceptRequest.flush({
      id: 1,
      username: 'professional',
      email: 'user@test.com',
      isActive: true,
      passwordConfigured: true,
      acceptedTerms: true,
      acceptedTermsAt: '2026-07-22T10:00:00',
      roles: ['PROFESSIONAL'],
    });

    expect(localStorage.getItem('auth_token')).toBe('header.eyJleHAiOjk5OTk5OTk5OTl9.signature');
    expect(service.getUserRoles()).toEqual(['PROFESSIONAL']);
    expect(router.navigate).toHaveBeenCalledWith(['/mi-dia']);
  });

  it('creates initial password without storing temporary token', () => {
    service.createPassword('invite-token', 'Password1', 'Password1').subscribe();

    const request = httpMock.expectOne('/api/v1/auth/password/create');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      token: 'invite-token',
      newPassword: 'Password1',
      confirmPassword: 'Password1',
    });
    request.flush(null);
    expect(localStorage.getItem('invite-token')).toBeNull();
  });

  it('resets password with token and confirmation', () => {
    service.resetPassword('reset-token', 'Password1', 'Password1').subscribe();

    const request = httpMock.expectOne('/api/v1/auth/password/reset');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      token: 'reset-token',
      newPassword: 'Password1',
      confirmPassword: 'Password1',
    });
    request.flush(null);
  });

  it('changes password with current password only for authenticated user', () => {
    service.changePassword('OldPassword1', 'Password1', 'Password1').subscribe();

    const request = httpMock.expectOne('/api/v1/auth/password/change');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      currentPassword: 'OldPassword1',
      newPassword: 'Password1',
      confirmPassword: 'Password1',
    });
    request.flush(null);
  });

  it('clears storage on logout', () => {
    localStorage.setItem('auth_token', 'token');
    localStorage.setItem('auth_user', JSON.stringify({ roles: ['ADMIN'] }));

    service.logout();

    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('auth_user')).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('removes expired tokens when checking login state', () => {
    localStorage.setItem('auth_token', 'header.eyJleHAiOjF9.signature');
    localStorage.setItem('auth_user', JSON.stringify({ roles: ['ADMIN'] }));

    expect(service.isLoggedIn()).toBeFalse();
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('auth_user')).toBeNull();
  });
});
