import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { AuthService } from '../../../core/services/auth.service';
import { User, UserRole, getFullName, getInitials, getRoleLabel } from '../../../core/models/user.model';
import { Subscription } from 'rxjs';

// Interface para items del menú
interface NavItem {
  label: string;
  route?: string;
  icon?: string;
  isButton?: boolean;
  action?: () => void;
  roles?: UserRole[];
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit, OnDestroy {
  // Estado de autenticación
  currentUser: User | null = null;
  userRole: UserRole = UserRole.GUEST;
  
  // Helpers para el template
  UserRole = UserRole;
  
  // Estado del menú móvil
  isMobileMenuOpen = false;
  
  // Items del menú
  navItems: NavItem[] = [];
  
  // Subscripción
  private authSubscription?: Subscription;

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.updateAuthState();
    this.loadNavItems();
    
    this.authSubscription = this.authService.getAuthState().subscribe(state => {
      this.currentUser = state.user;
      this.userRole = state.user?.rol || UserRole.GUEST;
      this.loadNavItems();
    });
  }

  ngOnDestroy(): void {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  /**
   * Actualiza el estado de autenticación
   */
  private updateAuthState(): void {
    this.currentUser = this.authService.getUser();
    this.userRole = this.authService.getUserRole();
  }

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return this.authService.isUserAuthenticated();
  }

  /**
   * Carga los items del menú según autenticación
   */
  private loadNavItems(): void {
    if (!this.isAuthenticated()) {
      // Menú para usuarios NO autenticados (con scroll a secciones)
      this.navItems = [
        { 
          label: 'Inicio', 
          icon: 'home', 
          action: () => this.scrollToTop()
        },
        { 
          label: 'Nosotros', 
          icon: 'info', 
          action: () => this.scrollToSection('nosotros')
        },
        { 
          label: 'Oferta Académica', 
          icon: 'school', 
          action: () => this.scrollToSection('oferta-educativa')  // ← ID correcto del HTML
        },
        { 
          label: 'Contacto', 
          icon: 'contact_mail', 
          action: () => this.scrollToSection('contacto')
        },
        { 
          label: 'Iniciar Sesión', 
          route: '/login', 
          icon: 'login', 
          isButton: true 
        }
      ];
    } else {
      // Menú para usuarios autenticados
      this.navItems = this.getAuthenticatedNavItems();
    }
  }

  /**
   * Obtiene items para usuarios autenticados
   */
  private getAuthenticatedNavItems(): NavItem[] {
    const baseItems: NavItem[] = [
      { label: 'Dashboard', route: this.getDashboardRoute(), icon: 'dashboard' }
    ];

    switch (this.userRole) {
      case UserRole.SUPER_ADMIN:
      case UserRole.ADMIN:
        return [
          ...baseItems,
          { label: 'Usuarios', route: '/admin/usuarios', icon: 'people' },
          { label: 'Docentes', route: '/admin/docentes', icon: 'person' },
          { label: 'Alumnos', route: '/admin/alumnos', icon: 'school' },
          { label: 'Finanzas', route: '/admin/finanzas', icon: 'payments' },
          { label: 'Reportes', route: '/admin/reportes', icon: 'analytics' },
          { label: 'Cerrar Sesión', icon: 'logout', isButton: true, action: () => this.logout() }
        ];

      case UserRole.DOCENTE:
        return [
          ...baseItems,
          { label: 'Mis Grupos', route: '/docente/mis-grupos', icon: 'groups' },
          { label: 'Calificaciones', route: '/docente/calificaciones', icon: 'grade' },
          { label: 'Asistencias', route: '/docente/asistencias', icon: 'fact_check' },
          { label: 'Perfil', route: '/docente/perfil', icon: 'account_circle' },
          { label: 'Cerrar Sesión', icon: 'logout', isButton: true, action: () => this.logout() }
        ];

      case UserRole.ALUMNO:
        return [
          ...baseItems,
          { label: 'Mis Materias', route: '/alumno/materias', icon: 'book' },
          { label: 'Calificaciones', route: '/alumno/calificaciones', icon: 'grade' },
          { label: 'Pagos', route: '/alumno/finanzas', icon: 'payments' },
          { label: 'Documentos', route: '/alumno/documentos', icon: 'description' },
          { label: 'Cerrar Sesión', icon: 'logout', isButton: true, action: () => this.logout() }
        ];

      default:
        return [
          { label: 'Cerrar Sesión', icon: 'logout', isButton: true, action: () => this.logout() }
        ];
    }
  }

  /**
   * Obtiene la ruta del dashboard según el rol
   */
  getDashboardRoute(): string {
    switch (this.userRole) {
      case UserRole.SUPER_ADMIN:
      case UserRole.ADMIN:
        return '/admin/dashboard';
      case UserRole.DOCENTE:
        return '/docente/dashboard';
      case UserRole.ALUMNO:
        return '/alumno/dashboard';
      default:
        return '/';
    }
  }

  /**
   * Maneja el click en un item del menú
   */
  onNavItemClick(item: NavItem): void {
    if (item.action) {
      item.action();
      this.closeMobileMenu();
      return;
    }

    if (item.route) {
      this.router.navigate([item.route]);
      this.closeMobileMenu();
    }
  }

  /**
   * Hace scroll al inicio de la página (hero section)
   */
  scrollToTop(): void {
    this.closeMobileMenu();

    // Si no estamos en la página principal, navegar primero
    if (this.router.url !== '/' && this.router.url !== '/home') {
      this.router.navigate(['/']).then(() => {
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 300);
      });
    } else {
      // Ya estamos en home, hacer scroll al top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  /**
   * Hace scroll suave a una sección de la página
   */
  scrollToSection(sectionId: string): void {
    this.closeMobileMenu();

    // Si no estamos en la página principal, navegar primero
    if (this.router.url !== '/' && this.router.url !== '/home') {
      this.router.navigate(['/']).then(() => {
        // Esperar a que cargue la página y luego hacer scroll
        setTimeout(() => {
          this.performScroll(sectionId);
        }, 300);
      });
    } else {
      // Ya estamos en home, hacer scroll directamente
      this.performScroll(sectionId);
    }
  }

  /**
   * Ejecuta el scroll suave al elemento
   */
  private performScroll(sectionId: string): void {
    const element = document.getElementById(sectionId);
    
    if (element) {
      // Obtener la altura del navbar para ajustar el scroll
      const navbar = document.querySelector('.navbar');
      const navbarHeight = navbar ? navbar.clientHeight : 0;
      
      // Calcular posición con offset para el navbar fijo
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navbarHeight - 20; // 20px adicional de padding
      
      // Scroll suave
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    } else {
      console.warn(`⚠️ Sección "${sectionId}" no encontrada en el DOM`);
    }
  }

  /**
   * Toggle del menú móvil
   */
  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  /**
   * Cierra el menú móvil
   */
  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  /**
   * Cerrar sesión
   */
  logout(): void {
    this.authService.logout();
    this.closeMobileMenu();
  }

  /**
   * Obtiene el nombre completo del usuario
   */
  getUserFullName(): string {
    if (!this.currentUser) return '';
    return getFullName(this.currentUser);
  }

  /**
   * Obtiene las iniciales del usuario
   */
  getUserInitials(): string {
    if (!this.currentUser) return '';
    return getInitials(this.currentUser);
  }

  /**
   * Obtiene la etiqueta del rol actual
   */
  getRoleLabel(): string {
    return getRoleLabel(this.userRole);
  }

  /**
   * Verifica si el usuario tiene un rol específico
   */
  hasRole(role: UserRole): boolean {
    return this.userRole === role;
  }

  /**
   * Verifica si el usuario es admin
   */
  isAdmin(): boolean {
    return this.userRole === UserRole.SUPER_ADMIN || this.userRole === UserRole.ADMIN;
  }

  /**
   * Navegar al perfil del usuario
   */
  goToProfile(): void {
    switch (this.userRole) {
      case UserRole.SUPER_ADMIN:
      case UserRole.ADMIN:
        this.router.navigate(['/admin/profile']);
        break;
      case UserRole.DOCENTE:
        this.router.navigate(['/docente/profile']);
        break;
      case UserRole.ALUMNO:
        this.router.navigate(['/alumno/profile']);
        break;
      default:
        this.router.navigate(['/']);
    }
  }

  /**
   * Navegar al dashboard correspondiente
   */
  goToDashboard(): void {
    this.router.navigate([this.getDashboardRoute()]);
  }
}