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
import { AdminLayoutComponent } from './shared/components/admin-layout/admin-layout.component';
import { ProgramasListComponent } from './features/admin/docentes/programas-list/programas-list.component';
import { MateriasListComponent } from './features/admin/docentes/materias-list/materias-list.component';
import { DocenteListComponent }   from './features/admin/docentes/docentes-list/docente-list.component';
import { DocenteDetailComponent } from './features/admin/docentes/docente-detail/docente-detail.component';

export const routes: Routes = [
  // ── PÚBLICAS ──
  { path: '',          component: HomeComponent,     canActivate: [publicGuard] },
  { path: 'login',     component: LoginComponent },
  { path: 'home',      redirectTo: '', pathMatch: 'full' },
  { path: 'mantenimiento', component: MaintenanceComponent },

  // ── ADMIN ──
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [authGuard, roleGuard([UserRole.SUPER_ADMIN, UserRole.ADMIN])],
    children: [
      { path: '',          redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'finanzas',  component: AdminFinanzasComponent },
      // ── Docentes ── (3 rutas ordenadas: más específicas primero)
      {
        // Lista de docentes con botón "Asignar Materias"
        path: 'docentes',
        component: DocenteListComponent
      },
      {
        // Detalle de un docente: perfil + materias asignadas
        // ⚠️ IMPORTANTE: esta ruta debe ir ANTES de 'docentes/temarios'
        path: 'docentes/:id',
        component: DocenteDetailComponent
      },
      {
        // Gestión de temarios por carrera (anterior pantalla de docentes)
        path: 'docentes/temarios',
        component: ProgramasListComponent
      },
      {
        // Materias de una carrera (temarios)
        path: 'docentes/temarios/:id/materias',
        component: MateriasListComponent
      },
    ]
  },

  // ── DOCENTE ──
  {
    path: 'teachers/mi-disponibilidad',
    loadComponent: () => import('./features/teachers/pages/mi-disponibilidad/mi-disponibilidad.component')
      .then(m => m.MiDisponibilidadComponent),
    canActivate: [authGuard]
  },
  {
    path: 'teachers',
    loadChildren: () => import('./features/teachers/teachers.routes').then(m => m.TEACHERS_ROUTES),
    canActivate: [authGuard]
  },

  // ── ALUMNO ──
  {
    path: 'alumno',
    canActivate: [authGuard, roleGuard([UserRole.ALUMNO])],
    children: [
      { path: '',        redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'finanzas', component: AlumnoFinanzasComponent },
    ]
  },

  { path: '**', redirectTo: '' }
];