import {HttpInterceptorFn} from '@angular/common/http';
import {inject} from '@angular/core';
import {AuthService} from '../services/auth-service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  const isPublicAuthRequest =
    req.url.includes('/v1/auth/login') ||
    req.url.includes('/v1/auth/password/forgot') ||
    req.url.includes('/v1/auth/password/reset');

  if (isPublicAuthRequest) {
    return next(req);
  }

  if (token) {
    const clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(clonedRequest);
  }

  return next(req);
};
