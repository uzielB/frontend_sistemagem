import { Routes } from '@angular/router';

export const TEACHERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/dashboard/dashboard.component')
      .then(m => m.TeacherDashboardComponent)
  },
  {
    path: 'asistencias',
    loadComponent: () => import('./pages/attendance/attendance.component')
      .then(m => m.AttendanceComponent)
  },
  {
    path: 'cambiar-contrasena',
    loadComponent: () => import('./pages/change-password/change-password.component')
      .then(m => m.ChangePasswordComponent)
  },
  {
    path: 'calificaciones',
    loadComponent: () => import('./pages/grades/grades.component')
      .then(m => m.GradesComponent)
  },
  {
    path: 'gestion-grupal',
    loadComponent: () => import('./pages/group-management/group-management.component')
      .then(m => m.GroupManagementComponent)
  },
];