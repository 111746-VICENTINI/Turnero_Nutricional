import { CanActivateFn } from '@angular/router';
import {AuthService} from '../services/auth-service';
import {inject} from '@angular/core';
import {Router} from '@angular/router';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const userRoles = authService.getUserRoles();
  const requiredRoles = route.data['roles'] as string[];

  const hasAccess = requiredRoles.some(role =>
    userRoles.includes(role)
  );

  if (!hasAccess) {
    router.navigate(['/unauthorized']);
    return false;
  }

  return true;
};
