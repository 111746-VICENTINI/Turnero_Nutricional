import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { authInterceptor } from './auth-interceptor';
import { AuthService } from '../services/auth-service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: jasmine.createSpyObj<Router>('Router', ['navigate']) },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('adds bearer token to protected requests', () => {
    localStorage.setItem('auth_token', 'jwt-token');

    http.get('/api/v1/user').subscribe();

    const request = httpMock.expectOne('/api/v1/user');
    expect(request.request.headers.get('Authorization')).toBe('Bearer jwt-token');
    request.flush({});
  });

  it('does not add bearer token to public auth token requests', () => {
    localStorage.setItem('auth_token', 'jwt-token');

    http.post('/api/v1/auth/password/create', { token: 'temporary-token' }).subscribe();

    const request = httpMock.expectOne('/api/v1/auth/password/create');
    expect(request.request.headers.has('Authorization')).toBeFalse();
    request.flush({});
  });
});
