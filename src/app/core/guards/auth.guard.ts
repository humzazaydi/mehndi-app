import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Wait for initialization
  if (auth.loading()) {
    await new Promise<void>(resolve => {
      const interval = setInterval(() => {
        if (!auth.loading()) { clearInterval(interval); resolve(); }
      }, 50);
    });
  }

  if (auth.isAuthenticated()) return true;
  return router.createUrlTree(['/auth/login']);
};
