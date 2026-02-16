import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const TEACHERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/dashboard/dashboard.component')
      .then(m => m.TeacherDashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'asistencias',
    loadComponent: () => import('./pages/attendance/attendance.component')
      .then(m => m.AttendanceComponent),
    canActivate: [authGuard]
  },
  {
    path: 'cambiar-contrasena',
    loadComponent: () => import('./pages/change-password/change-password.component')
      .then(m => m.ChangePasswordComponent),
    canActivate: [authGuard]
  },
  {
    path: 'calificaciones',
    loadComponent: () => import('./pages/grades/grades.component')
      .then(m => m.GradesComponent),
    canActivate: [authGuard]
  },
  {
    path: 'gestion-grupal',
    loadComponent: () => import('./pages/group-management/group-management.component')
      .then(m => m.GroupManagementComponent),
    canActivate: [authGuard]
  },
];