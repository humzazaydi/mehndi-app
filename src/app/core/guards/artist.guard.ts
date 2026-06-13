import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const artistGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Wait for auth initialization
  if (auth.loading()) {
    await new Promise<void>(resolve => {
      const interval = setInterval(() => {
        if (!auth.loading()) { clearInterval(interval); resolve(); }
      }, 50);
    });
  }

  if (auth.isArtist()) return true;
  if (!auth.isAuthenticated()) return router.createUrlTree(['/auth/login']);
  if (auth.isAdmin()) return router.createUrlTree(['/admin/dashboard']);
  if (auth.isConesManager()) return router.createUrlTree(['/cones-manager/dashboard']);
  return router.createUrlTree(['/client/dashboard']);
};
