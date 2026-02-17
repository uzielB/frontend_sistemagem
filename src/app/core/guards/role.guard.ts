// src/app/core/guards/role.guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

export function roleGuard(allowedRoles: UserRole[]): CanActivateFn {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);
    
    const currentRole = authService.getUserRole();
    
    if (allowedRoles.includes(currentRole)) {
      return true;
    }
    
    console.warn(`Acceso denegado. Rol actual: ${currentRole}, Roles permitidos: ${allowedRoles}`);
    
    switch (currentRole) {
      case UserRole.ADMIN:
      case UserRole.SUPER_ADMIN:
        router.navigate(['/admin/dashboard']);
        break;
      case UserRole.DOCENTE:
        router.navigate(['/docente/dashboard']);
        break;
      case UserRole.ALUMNO:
        router.navigate(['/alumno/dashboard']);
        break;
      default:
        router.navigate(['/login']);
    }
    
    return false;
  };
}