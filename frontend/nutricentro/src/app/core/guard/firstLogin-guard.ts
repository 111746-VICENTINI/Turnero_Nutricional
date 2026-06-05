import {CanActivateFn, Router} from '@angular/router';
import {inject} from '@angular/core';
import {AuthService} from '../services/auth-service';

export const firstLoginGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.getUser();
  const firstLoginToken = localStorage.getItem('first_login_token') || localStorage.getItem('firstLoginToken');

  if (user?.isActive || firstLoginToken) {
    router.navigate(['/password-reset'], { queryParams: { first: true } });
    return false;
  }

  return true;
};
