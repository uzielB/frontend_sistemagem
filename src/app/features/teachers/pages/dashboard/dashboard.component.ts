import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip'; 
import { AuthService } from '../../../../core/services/auth.service';
import { User, getFullName } from '../../../../core/models/user.model';
@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class TeacherDashboardComponent implements OnInit {
  currentUser: User | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getUser();
    
    if (this.currentUser) {
      console.log('👤 [TEACHER DASHBOARD] Usuario cargado:', this.currentUser);
    } else {
      console.error('❌ [TEACHER DASHBOARD] No se pudo cargar el usuario');
      this.router.navigate(['/auth/login']);
    }
  }

  getUserName(): string {
    if (!this.currentUser) return 'Docente';
    return getFullName(this.currentUser);
  }

  /**
   * Obtiene las iniciales del nombre del usuario
   */
  getInitials(): string {
    if (!this.currentUser) return 'D';
    
    const nombre = this.currentUser.nombre?.charAt(0) || '';
    const apellido = this.currentUser.apellido_paterno?.charAt(0) || '';
    
    return (nombre + apellido).toUpperCase() || 'D';
  }

  logout(): void {
    this.authService.logout();
  }

  navigateTo(route: string): void {
  this.router.navigate([route]);
}
}