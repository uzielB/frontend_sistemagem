import { Routes } from '@angular/router';
import { MaintenanceComponent } from './shared/components/maintenance/maintenance.component';
import { HomeComponent } from './features/home/home.component';
import { LoginComponent } from './features/auth/components/login/login.component';
import { AdminFinanzasComponent } from './features/admin/finanzas/admin-finanzas.component';
import { AlumnoFinanzasComponent } from './features/alumno/finanzas/alumno-finanzas.component';
import { publicGuard } from './core/guards/public.guard';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
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
  
  { 
    path: 'teachers', 
    loadChildren: () => import('./features/teachers/teachers.routes').then(m => m.TEACHERS_ROUTES),
    canActivate: [authGuard]
  },
  
  { 
    path: 'admin/finanzas', 
    component: AdminFinanzasComponent
  },
  
  { 
    path: 'alumno/finanzas', 
    component: AlumnoFinanzasComponent
  },
  
  {
    path: '**',
    redirectTo: ''
  }
];