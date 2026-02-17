import { Routes } from '@angular/router';
import { MaintenanceComponent } from './shared/components/maintenance/maintenance.component';
import { HomeComponent } from './features/home/home.component';
import { LoginComponent } from './features/auth/components/login/login.component';
import { AdminFinanzasComponent } from './features/admin/finanzas/admin-finanzas.component';
import { AlumnoFinanzasComponent } from './features/alumno/finanzas/alumno-finanzas.component';
import { DashboardComponent } from './features/admin/dashboard/dashboard.component';
import { publicGuard } from './core/guards/public.guard';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { UserRole } from './core/models/user.model';

export const routes: Routes = [
  // ===== RUTAS PÚBLICAS =====
  {
    path: '',
    component: HomeComponent,
    canActivate: [publicGuard]
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'home',
    redirectTo: '',
    pathMatch: 'full'
  },
  {
    path: 'mantenimiento',
    component: MaintenanceComponent
  },

  // ===== RUTAS ADMIN / SUPER ADMIN =====
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard([UserRole.SUPER_ADMIN, UserRole.ADMIN])],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: DashboardComponent
      },
      {
        path: 'finanzas',
        component: AdminFinanzasComponent
      },
      // Agrega aquí futuras rutas admin:
      // { path: 'usuarios', component: UsuariosComponent },
      // { path: 'docentes', component: DocentesComponent },
      // { path: 'programas', component: ProgramasComponent },
    ]
  },

  // ===== RUTAS DOCENTE =====
  {
    path: 'teachers',
    loadChildren: () => import('./features/teachers/teachers.routes').then(m => m.TEACHERS_ROUTES),
    canActivate: [authGuard]
  },

  // ===== RUTAS ALUMNO =====
  {
    path: 'alumno',
    canActivate: [authGuard, roleGuard([UserRole.ALUMNO])],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'finanzas',
        component: AlumnoFinanzasComponent
      },
      // Agrega aquí futuras rutas alumno:
      // { path: 'dashboard', component: AlumnoDashboardComponent },
    ]
  },

  {
    path: '**',
    redirectTo: ''
  }
];