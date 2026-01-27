import { Routes } from '@angular/router';
import { MaintenanceComponent } from './shared/components/maintenance/maintenance.component';
import { HomeComponent } from './features/home/home.component';
import { LoginComponent } from './features/auth/components/login/login.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent
  },
  { path: 'login', component: LoginComponent },
  { path: 'home', component: HomeComponent },
  { path: 'mantenimiento', component: MaintenanceComponent },
  {
    path: '**',
    redirectTo: ''
  }
];
