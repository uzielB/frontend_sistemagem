import { Routes } from '@angular/router';

export const TEACHERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/dashboard/dashboard.component')
      .then(m => m.TeacherDashboardComponent)
  },
  {
    path: 'calificaciones',
    loadComponent: () => import('./components/grade-form/grade-form.component')
      .then(m => m.GradeFormComponent)
  },
  {
    path: 'asistencias',
    loadComponent: () => import('./components/attendance-table/attendance-table.component')
      .then(m => m.AttendanceTableComponent)
  },
  {
    path: 'cambiar-contrasena',
    loadComponent: () => import('./pages/change-password/change-password.component')
      .then(m => m.ChangePasswordComponent)
  }
];