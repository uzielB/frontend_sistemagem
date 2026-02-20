import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../../core/services/auth.service';
import { User, UserRole } from '../../../core/models/user.model';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  roles: UserRole[]; // Qué roles pueden ver esta opción
}

@Component({
  selector: 'app-admin-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule
  ],
  templateUrl: './admin-sidebar.component.html',
  styleUrls: ['./admin-sidebar.component.css']
})
export class AdminSidebarComponent implements OnInit {

  user: User | null = null;
  currentRoute: string = '';

  // Menú completo con permisos por rol
  menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'dashboard',
      route: '/admin/dashboard',
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN]
    },
    {
      label: 'Finanzas',
      icon: 'attach_money',
      route: '/admin/finanzas',
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN]
    },
    {
      label: 'Académico',
      icon: 'school',
      route: '/admin/academico',
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN]
    },
    {
      label: 'Vinculación',
      icon: 'link',
      route: '/admin/vinculacion',
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN]
    },
    {
      label: 'Reportes',
      icon: 'assessment',
      route: '/admin/reportes',
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN]
    },
    {
      label: 'Usuarios',
      icon: 'people',
      route: '/admin/usuarios',
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN]
    },
    {
      label: 'Docentes',
      icon: 'badge',
      route: '/admin/docentes',
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN]
    },
    {
      label: 'Alumnos',
      icon: 'groups',
      route: '/admin/alumnos',
      roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN]
    },
    {
      label: 'Programas',
      icon: 'menu_book',
      route: '/admin/programas',
      roles: [UserRole.SUPER_ADMIN] // Solo SuperAdmin
    },
    {
      label: 'Configuración',
      icon: 'settings',
      route: '/admin/configuracion',
      roles: [UserRole.SUPER_ADMIN] // Solo SuperAdmin
    }
  ];

  // Menú filtrado según el rol del usuario
  visibleMenuItems: MenuItem[] = [];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.filterMenuByRole();
    this.updateCurrentRoute();
  }

  /**
   * Cargar datos del usuario actual
   */
  loadUserData(): void {
    this.user = this.authService.getUser();
  }

  /**
   * Filtrar menú según el rol del usuario
   */
  filterMenuByRole(): void {
    const userRole = this.authService.getUserRole();
    
    this.visibleMenuItems = this.menuItems.filter(item => 
      item.roles.includes(userRole)
    );
  }

  /**
   * Actualizar ruta actual
   */
  updateCurrentRoute(): void {
    this.currentRoute = this.router.url;
  }

  /**
   * Navegar a una ruta
   */
  navigateTo(route: string): void {
    this.router.navigate([route]).then(() => {
      this.updateCurrentRoute();
    });
  }

  /**
   * Verificar si una ruta está activa
   */
  isRouteActive(route: string): boolean {
    return this.currentRoute.startsWith(route);
  }

  /**
   * Obtener nombre completo del usuario
   */
  getUserFullName(): string {
    if (!this.user) return 'Usuario';
    
    return `${this.user.nombre} ${this.user.apellido_paterno || ''} ${this.user.apellido_materno || ''}`.trim();
  }

  /**
   * Obtener iniciales del usuario
   */
  getUserInitials(): string {
    if (!this.user) return 'U';
    
    const firstInitial = this.user.nombre?.charAt(0) || '';
    const lastInitial = this.user.apellido_paterno?.charAt(0) || '';
    
    return `${firstInitial}${lastInitial}`.toUpperCase();
  }

  /**
   * Obtener texto del rol
   */
  getRoleText(): string {
    const role = this.authService.getUserRole();
    
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return 'Super Administrador';
      case UserRole.ADMIN:
        return 'Administrador';
      default:
        return 'Usuario';
    }
  }

  /**
   * Cerrar sesión
   */
  logout(): void {
    this.authService.logout();
  }
}