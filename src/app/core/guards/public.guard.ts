import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';


export const publicGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si el usuario está autenticado, redirigir a su dashboard
  if (authService.isUserAuthenticated()) {
    const role = authService.getUserRole();

    switch (role) {
      case UserRole.SUPER_ADMIN:
      case UserRole.ADMIN:
        router.navigate(['/admin/dashboard']);
        return false;
      case UserRole.DOCENTE:
        router.navigate(['/teachers']);
        return false;
      case UserRole.ALUMNO:
        router.navigate(['/alumno/dashboard']);
        return false;
      default:
        return true;
    }
  }

  return true;
};