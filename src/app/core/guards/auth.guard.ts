import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  
  const token = localStorage.getItem('jwt_token');
  const role = localStorage.getItem('user_role');

  // If token exists and user is NOT a student, allow access
  if (token) {
    if (role === 'STUDENT') {
      // Clear session to force fresh login if they try to switch accounts
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_role');
      
      // Navigate to login
      router.navigate(['/login']);
      // A toast could be triggered here via a service, but for a guard this basic redirect is fine.
      return false;
    }
    return true;
  }

  // Not logged in, redirect to login page
  router.navigate(['/login']);
  return false;
};
