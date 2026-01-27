import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { User, UserRole, AuthState, LoginCredentials, LoginResponse, isValidCURP } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  
  // Estado de autenticación usando BehaviorSubject para observabilidad
  private authStateSubject = new BehaviorSubject<AuthState>({
    isAuthenticated: false,
    user: null,
    token: undefined
  });

  // Observable público del estado de autenticación
  public authState$: Observable<AuthState> = this.authStateSubject.asObservable();

  // Signals para el usuario actual (Angular 18)
  public currentUser = signal<User | null>(null);
  public isAuthenticated = signal<boolean>(false);
  public userRole = signal<UserRole>(UserRole.GUEST);

  constructor(
    private router: Router,
    private http: HttpClient
  ) {
    this.loadAuthStateFromStorage();
  }

  /**
   * Cargar estado de autenticación desde localStorage
   */
  private loadAuthStateFromStorage(): void {
    const storedUser = localStorage.getItem('gem_user');
    const storedToken = localStorage.getItem('gem_token');

    if (storedUser && storedToken) {
      try {
        const user: User = JSON.parse(storedUser);
        this.setAuthState(user, storedToken);
      } catch (error) {
        console.error('Error al cargar usuario desde localStorage:', error);
        this.clearAuthState();
      }
    }
  }

  /**
   * Establecer el estado de autenticación
   */
  private setAuthState(user: User, token: string): void {
    this.currentUser.set(user);
    this.isAuthenticated.set(true);
    this.userRole.set(user.rol);

    this.authStateSubject.next({
      isAuthenticated: true,
      user: user,
      token: token
    });
  }

  /**
   * Limpiar el estado de autenticación
   */
  private clearAuthState(): void {
    localStorage.removeItem('gem_user');
    localStorage.removeItem('gem_token');
    
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.userRole.set(UserRole.GUEST);
    
    this.authStateSubject.next({
      isAuthenticated: false,
      user: null,
      token: undefined
    });
  }

  /**
   * Login del usuario con CURP y contraseña
   * Conecta con el backend real de PostgreSQL
   */
  login(curp: string, contrasena: string): Observable<LoginResponse> {
    // Validar formato de CURP
    if (!isValidCURP(curp.toUpperCase())) {
      return throwError(() => new Error('CURP inválido. Debe tener 18 caracteres.'));
    }

    // Validar contraseña
    if (!contrasena || contrasena.length < 6) {
      return throwError(() => new Error('La contraseña debe tener al menos 6 caracteres.'));
    }

    const credentials: LoginCredentials = {
      curp: curp.toUpperCase(),
      contrasena: contrasena
    };

    // Petición HTTP real a tu backend
    return this.http.post<LoginResponse>(
      `${environment.apiUrl}/auth/login`,
      credentials,
      {
        headers: new HttpHeaders({
          'Content-Type': 'application/json'
        })
      }
    ).pipe(
      tap((response: LoginResponse) => {
        if (response.success && response.user && response.token) {
          // Guardar en localStorage
          localStorage.setItem('gem_user', JSON.stringify(response.user));
          localStorage.setItem('gem_token', response.token);
          
          // Actualizar estado
          this.setAuthState(response.user, response.token);
        }
      }),
      catchError(error => {
        console.error('Error en login:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Login simulado para desarrollo (SIN BACKEND)
   * TODO: ELIMINAR cuando el backend esté listo
   */
  loginDemo(curp: string, contrasena: string): Observable<LoginResponse> {
    return new Observable(observer => {
      setTimeout(() => {
        // Validar CURP
        if (!isValidCURP(curp.toUpperCase())) {
          observer.error(new Error('CURP inválido'));
          return;
        }

        // Validar contraseña
        if (contrasena.length < 6) {
          observer.error(new Error('Contraseña muy corta'));
          return;
        }

        // Determinar rol según CURP (DEMO)
        let rol: UserRole = UserRole.ALUMNO;
        if (curp.startsWith('SUPE')) rol = UserRole.SUPER_ADMIN;
        else if (curp.startsWith('ADMI')) rol = UserRole.ADMIN;
        else if (curp.startsWith('DOCE')) rol = UserRole.DOCENTE;
        else if (curp.startsWith('ALUM')) rol = UserRole.ALUMNO;

        const mockUser: User = {
          id: 1,
          curp: curp.toUpperCase(),
          correo: `${curp.toLowerCase()}@gem.edu.mx`,
          rol: rol,
          nombre: 'Usuario',
          apellido_paterno: 'Demo',
          apellido_materno: 'Prueba',
          esta_activo: true,
          debe_cambiar_contrasena: false
        };
        
        const mockToken = `jwt-token-${Date.now()}`;
        
        // Guardar en localStorage
        localStorage.setItem('gem_user', JSON.stringify(mockUser));
        localStorage.setItem('gem_token', mockToken);
        
        // Actualizar estado
        this.setAuthState(mockUser, mockToken);
        
        observer.next({ 
          success: true, 
          user: mockUser, 
          token: mockToken,
          message: 'Login exitoso (MODO DEMO)'
        });
        observer.complete();
      }, 1000);
    });
  }

  /**
   * Logout del usuario
   */
  logout(): void {
    // TODO: Opcional - notificar al backend sobre el logout
    // this.http.post(`${environment.apiUrl}/auth/logout`, {}).subscribe();
    
    // Limpiar estado local
    this.clearAuthState();
    
    // Redirigir al home
    this.router.navigate(['/']);
  }

  /**
   * Verificar si el usuario debe cambiar su contraseña
   */
  shouldChangePassword(): boolean {
    const user = this.currentUser();
    return user ? user.debe_cambiar_contrasena : false;
  }

  /**
   * Cambiar contraseña del usuario
   */
  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    const user = this.currentUser();
    if (!user) {
      return throwError(() => new Error('Usuario no autenticado'));
    }

    return this.http.post(
      `${environment.apiUrl}/auth/change-password`,
      {
        curp: user.curp,
        contrasena_actual: currentPassword,
        contrasena_nueva: newPassword
      },
      { headers: this.getAuthHeaders() }
    ).pipe(
      tap(() => {
        // Actualizar flag en usuario local
        if (user) {
          user.debe_cambiar_contrasena = false;
          localStorage.setItem('gem_user', JSON.stringify(user));
          this.currentUser.set(user);
        }
      })
    );
  }

  /**
   * Obtener headers con token de autenticación
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Obtener el usuario actual
   */
  getCurrentUser(): User | null {
    return this.currentUser();
  }

  /**
   * Verificar si el usuario está autenticado
   */
  isUserAuthenticated(): boolean {
    return this.isAuthenticated();
  }

  /**
   * Obtener el rol del usuario actual
   */
  getUserRole(): UserRole {
    return this.userRole();
  }

  /**
   * Verificar si el usuario tiene un rol específico
   */
  hasRole(role: UserRole): boolean {
    return this.userRole() === role;
  }

  /**
   * Verificar si el usuario tiene alguno de los roles especificados
   */
  hasAnyRole(roles: UserRole[]): boolean {
    return roles.includes(this.userRole());
  }

  /**
   * Verificar si es administrador (SUPER_ADMIN o ADMIN)
   */
  isAdmin(): boolean {
    return this.hasAnyRole([UserRole.SUPER_ADMIN, UserRole.ADMIN]);
  }

  /**
   * Obtener el token de autenticación
   */
  getToken(): string | null {
    return localStorage.getItem('gem_token');
  }

  /**
   * Refrescar el token (si el backend lo soporta)
   */
  refreshToken(): Observable<any> {
    const token = this.getToken();
    if (!token) {
      return throwError(() => new Error('No hay token para refrescar'));
    }

    return this.http.post(`${environment.apiUrl}/auth/refresh`, { token }).pipe(
      tap((response: any) => {
        if (response.token) {
          localStorage.setItem('gem_token', response.token);
        }
      })
    );
  }
}