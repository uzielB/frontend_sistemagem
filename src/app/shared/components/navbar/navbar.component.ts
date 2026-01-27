import { Component, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserRole, getFullName, getInitials, getRoleLabel } from '../../../core/models/user.model';

interface NavItem {
  label: string;
  route?: string;
  action?: () => void;
  icon?: string;
  isButton?: boolean;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {

  // 👇 solo declaradas
  isAuthenticated!: () => boolean;
  currentUser!: () => any;
  userRole!: () => UserRole;

  navItems: NavItem[] = [];
  isMobileMenuOpen = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    // ✅ aquí SÍ existe authService
    this.isAuthenticated = this.authService.isAuthenticated;
    this.currentUser = this.authService.currentUser;
    this.userRole = this.authService.userRole;

    // Effect reactivo
    effect(() => {
      const role = this.userRole();
      this.updateNavItems(role);
    });
  }

  ngOnInit(): void {
    this.updateNavItems(this.userRole());
  }

  private updateNavItems(role: UserRole): void {
    switch (role) {
      case UserRole.GUEST:
        this.navItems = this.getGuestNavItems();
        break;
      case UserRole.ALUMNO:
        this.navItems = this.getAlumnoNavItems();
        break;
      case UserRole.DOCENTE:
        this.navItems = this.getDocenteNavItems();
        break;
      case UserRole.ADMIN:
      case UserRole.SUPER_ADMIN:
        this.navItems = this.getAdminNavItems();
        break;
      default:
        this.navItems = this.getGuestNavItems();
    }
  }

  // === MENÚS ===

  private getGuestNavItems(): NavItem[] {
    return [
      { label: 'Oferta Educativa', action: () => this.scrollToSection('oferta-educativa') },
      { label: 'Nosotros', action: () => this.scrollToSection('nosotros') },
      { label: 'Contáctanos', action: () => this.scrollToSection('contacto') },
      { label: 'Iniciar Sesión', route: '/login', isButton: true }
    ];
  }

  private getAlumnoNavItems(): NavItem[] {
    return [
      { label: 'Inicio', route: '/alumno/dashboard' },
      { label: 'Pagos', route: '/alumno/pagos' },
      { label: 'Mi Perfil', route: '/alumno/perfil' },
      { label: 'Cerrar Sesión', action: () => this.logout(), isButton: true }
    ];
  }

  private getDocenteNavItems(): NavItem[] {
    return [
      { label: 'Inicio', route: '/docente/dashboard' },
      { label: 'Grupos', route: '/docente/grupos' },
      { label: 'Cerrar Sesión', action: () => this.logout(), isButton: true }
    ];
  }

  private getAdminNavItems(): NavItem[] {
    return [
      { label: 'Dashboard', route: '/admin/dashboard' },
      { label: 'Finanzas', route: '/admin/finanzas' },
      { label: 'Cerrar Sesión', action: () => this.logout(), isButton: true }
    ];
  }

  // === ACCIONES ===

  onNavItemClick(item: NavItem): void {
    this.closeMobileMenu();
    item.action ? item.action() : this.router.navigate([item.route]);
  }

  scrollToSection(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  logout(): void {
    this.authService.logout();
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  getUserInitials(): string {
    const user = this.currentUser();
    return user ? getInitials(user) : '';
  }

  getUserFullName(): string {
    const user = this.currentUser();
    return user ? getFullName(user) : '';
  }

  getRoleLabel(): string {
    return getRoleLabel(this.userRole());
  }
}
