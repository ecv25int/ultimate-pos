import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { of } from 'rxjs';
import { Auth } from '../auth/auth';
import { UserRole } from '../enums/user-role.enum';

export function roleGuard(allowedRoles: UserRole[]): CanActivateFn {
  return () => {
    const authService = inject(Auth);
    const router = inject(Router);

    const user = authService.getCurrentUser();

    if (!user) {
      router.navigate(['/auth/login']);
      return false;
    }

    if (allowedRoles.includes(user.userType as UserRole)) {
      return true;
    }

    router.navigate(['/dashboard']);
    return false;
  };
}
