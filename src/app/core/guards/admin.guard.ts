import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.loading()) {
    await new Promise<void>(resolve => {
      const interval = setInterval(() => {
        if (!auth.loading()) { clearInterval(interval); resolve(); }
      }, 50);
    });
  }

  if (auth.isAdmin()) return true;
  if (!auth.isAuthenticated()) return router.createUrlTree(['/auth/login']);
  return router.createUrlTree(['/client/dashboard']);
};
