import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const role = localStorage.getItem('user_role');

  if (role === 'ADMIN') {
    return true;
  }

  // Not an admin, redirect to dashboard
  router.navigate(['/dashboard']);
  return false;
};
