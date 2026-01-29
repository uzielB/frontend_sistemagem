import { Routes } from '@angular/router';
import { MaintenanceComponent } from './shared/components/maintenance/maintenance.component';
import { HomeComponent } from './features/home/home.component';
import { LoginComponent } from './features/auth/components/login/login.component';
import { AdminFinanzasComponent } from './features/admin/finanzas/admin-finanzas.component';
import { AlumnoFinanzasComponent } from './features/alumno/finanzas/alumno-finanzas.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  { path: 'login', component: LoginComponent },
  { path: 'home', component: HomeComponent },
  { path: 'mantenimiento', component: MaintenanceComponent },
  
  // Admin - Finanzas (sin guards temporalmente)
  { 
    path: 'admin/finanzas', 
    component: AdminFinanzasComponent
  },
  
  // Alumno - Finanzas (sin guards temporalmente)
  { 
    path: 'alumno/finanzas', 
    component: AlumnoFinanzasComponent
  },
  
  {
    path: '**',
    redirectTo: ''
  }
];