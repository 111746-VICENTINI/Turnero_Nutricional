import {CanActivateFn, Router} from '@angular/router';
import {inject} from '@angular/core';

export const firstLoginGuard: CanActivateFn = () => {
  const router = inject(Router);

  const firstLoginToken = localStorage.getItem('first_login_token') || localStorage.getItem('firstLoginToken');

  if (firstLoginToken) {
    localStorage.removeItem('first_login_token');
    localStorage.removeItem('firstLoginToken');
    router.navigate(['/create-password'], { queryParams: { token: firstLoginToken } });
    return false;
  }

  return true;
};
