import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { 
  User, 
  UserRole, 
  LoginCredentials, 
  LoginResponse,
  AuthState 
} from '../models/user.model';

/**
 * Servicio de Autenticación
 * Maneja login, logout, persistencia de sesión y verificación de autenticación
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  
  // URL base del API
  private apiUrl = environment.apiUrl;
  
  // Claves de localStorage
  private readonly TOKEN_KEY = 'gem_auth_token';
  private readonly USER_KEY = 'gem_user_data';
  
  // Estado de autenticación (observable)
  private authState$ = new BehaviorSubject<AuthState>({
    isAuthenticated: false,
    user: null,
    token: undefined
  });

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Al iniciar el servicio, verificar si hay sesión guardada
    this.checkStoredAuth();
  }

  /**
   * Login REAL - Conecta con el backend NestJS
   * POST /api/auth/login
   */
  /**
 * Login REAL - Conecta con el backend NestJS
 * POST /api/auth/login
 */
/**
 * Login REAL - Conecta con el backend NestJS
 * POST /api/auth/login
 */


/**
 * Login REAL - Conecta con el backend NestJS
 * POST /api/auth/login
 */
login(curp: string, contrasena: string): Observable<LoginResponse> {
  const url = `${this.apiUrl}/auth/login`;
  const credentials: LoginCredentials = { curp, contrasena };
  
  if (environment.enableDebugLogs) {
    console.log('🔐 [AUTH SERVICE] Intentando login:', { curp, url });
  }

  return this.http.post<any>(url, credentials).pipe(
    tap(response => {
      if (environment.enableDebugLogs) {
        console.log('✅ [AUTH SERVICE] Respuesta completa del backend:', response);
        console.log('📦 [AUTH SERVICE] Keys en response:', Object.keys(response));
        
        if (response.data) {
          console.log('📦 [AUTH SERVICE] Keys en response.data:', Object.keys(response.data));
          console.log('📦 [AUTH SERVICE] response.data completo:', response.data);
          
          if (response.data.user) {
            console.log('👤 [AUTH SERVICE] response.data.user encontrado:', response.data.user);
          }
          
          if (response.data.access_token) {
            console.log('🔑 [AUTH SERVICE] Token encontrado en response.data.access_token');
          }
        }
      }
    }),
    map(response => {
      // ⚠️ ESTRUCTURA CORRECTA DEL BACKEND:
      // {
      //   message: "Inicio de sesión exitoso",
      //   data: {
      //     access_token: "...",
      //     user: { id, curp, nombre, apellidoPaterno, ... }
      //   }
      // }
      
      let user: User;
      let token: string;
      
      // El backend siempre responde con response.data
      if (response.data) {
        
        // Caso 1: Usuario en response.data.user (✅ ESTRUCTURA ACTUAL)
        if (response.data.user && typeof response.data.user === 'object') {
          if (environment.enableDebugLogs) {
            console.log('✅ [AUTH SERVICE] Usuario encontrado en response.data.user');
          }
          
          const backendUser = response.data.user;
          
          user = {
            id: backendUser.id,
            curp: backendUser.curp,
            correo: backendUser.correo,
            rol: backendUser.rol,
            nombre: backendUser.nombre,
            apellido_paterno: backendUser.apellidoPaterno,
            apellido_materno: backendUser.apellidoMaterno,
            telefono: backendUser.telefono,
            esta_activo: true, // Si hizo login, está activo
            debe_cambiar_contrasena: backendUser.debeCambiarContrasena || false
          };
          
          token = response.data.access_token || response.data.token;
        }
        // Caso 2: Usuario directamente en response.data
        else if (response.data.id && response.data.curp) {
          if (environment.enableDebugLogs) {
            console.log('✅ [AUTH SERVICE] Usuario encontrado en response.data');
          }
          
          user = {
            id: response.data.id,
            curp: response.data.curp,
            correo: response.data.correo,
            rol: response.data.rol,
            nombre: response.data.nombre,
            apellido_paterno: response.data.apellidoPaterno || response.data.apellido_paterno,
            apellido_materno: response.data.apellidoMaterno || response.data.apellido_materno,
            telefono: response.data.telefono,
            esta_activo: true,
            debe_cambiar_contrasena: response.data.debeCambiarContrasena || response.data.debe_cambiar_contrasena || false
          };
          
          token = response.data.access_token || response.data.token || response.token;
        }
        else {
          console.error('❌ [AUTH SERVICE] Estructura de response.data no reconocida');
          console.error('📦 response.data:', response.data);
          throw new Error('Respuesta del servidor inválida');
        }
      }
      // Caso 3: Usuario en response.user (por si cambia el backend)
      else if (response.user && typeof response.user === 'object') {
        if (environment.enableDebugLogs) {
          console.log('✅ [AUTH SERVICE] Usuario encontrado en response.user');
        }
        
        user = {
          id: response.user.id,
          curp: response.user.curp,
          correo: response.user.correo,
          rol: response.user.rol,
          nombre: response.user.nombre,
          apellido_paterno: response.user.apellidoPaterno || response.user.apellido_paterno,
          apellido_materno: response.user.apellidoMaterno || response.user.apellido_materno,
          telefono: response.user.telefono,
          esta_activo: true,
          debe_cambiar_contrasena: response.user.debeCambiarContrasena || response.user.debe_cambiar_contrasena || false
        };
        
        token = response.access_token || response.token;
      }
      else {
        console.error('❌ [AUTH SERVICE] No se pudo extraer usuario de la respuesta');
        console.error('📦 Response completo:', response);
        throw new Error('Respuesta del servidor inválida');
      }

      if (environment.enableDebugLogs) {
        console.log('👤 [AUTH SERVICE] Usuario extraído:', user);
        console.log('🔑 [AUTH SERVICE] Token extraído:', token ? token.substring(0, 20) + '...' : 'No encontrado');
      }

      // Validar que tengamos los datos mínimos
      if (!user || !user.id || !user.curp || !user.rol) {
        console.error('❌ [AUTH SERVICE] Datos de usuario incompletos:', user);
        throw new Error('Datos de usuario inválidos');
      }

      if (!token) {
        console.error('❌ [AUTH SERVICE] Token no encontrado en la respuesta');
        throw new Error('Token de autenticación no encontrado');
      }

      // Guardar datos de autenticación
      this.saveAuthData(user, token);

      // Transformar a LoginResponse
      const loginResponse: LoginResponse = {
        success: true,
        user: user,
        token: token,
        message: response.message || 'Inicio de sesión exitoso'
      };

      return loginResponse;
    }),
    catchError(error => {
      if (environment.enableDebugLogs) {
        console.error('❌ [AUTH SERVICE] Error en login:', error);
      }
      return throwError(() => error);
    })
  );
}

  /**
   * Login DEMO - Para desarrollo sin backend
   * Simula un login exitoso con usuarios de prueba
   */
  loginDemo(curp: string, contrasena: string): Observable<LoginResponse> {
    if (environment.enableDebugLogs) {
      console.log('🧪 [AUTH SERVICE] Login DEMO:', { curp });
    }

    // Simular delay de red (500ms)
    return of(null).pipe(
      map(() => {
        // Usuarios DEMO que coinciden con los seeders del backend
        const demoUsers: { [key: string]: User } = {
          'SUPE800101HDFXXX01': {
            id: 1,
            curp: 'SUPE800101HDFXXX01',
            correo: 'superadmin@gem.edu.mx',
            rol: UserRole.SUPER_ADMIN,
            nombre: 'Super',
            apellido_paterno: 'Administrador',
            apellido_materno: 'GEM',
            esta_activo: true,
            debe_cambiar_contrasena: false
          },
          'ADMI850101HDFXXX02': {
            id: 2,
            curp: 'ADMI850101HDFXXX02',
            correo: 'admin@gem.edu.mx',
            rol: UserRole.ADMIN,
            nombre: 'Administrador',
            apellido_paterno: 'General',
            apellido_materno: 'GEM',
            esta_activo: true,
            debe_cambiar_contrasena: false
          },
          'DOCE900101HDFXXX03': {
            id: 3,
            curp: 'DOCE900101HDFXXX03',
            correo: 'docente@gem.edu.mx',
            rol: UserRole.DOCENTE,
            nombre: 'María',
            apellido_paterno: 'González',
            apellido_materno: 'López',
            esta_activo: true,
            debe_cambiar_contrasena: false
          },
          'ALUM050101HDFXXX04': {
            id: 4,
            curp: 'ALUM050101HDFXXX04',
            correo: 'alumno@gem.edu.mx',
            rol: UserRole.ALUMNO,
            nombre: 'Estudiante',
            apellido_paterno: 'Ejemplo',
            apellido_materno: 'Demo',
            esta_activo: true,
            debe_cambiar_contrasena: false
          }
        };

        // Buscar usuario por CURP
        const user = demoUsers[curp.toUpperCase()];

        if (!user) {
          // Si no está en la lista, crear usuario genérico
          const genericUser: User = {
            id: 999,
            curp: curp.toUpperCase(),
            correo: 'usuario@gem.edu.mx',
            rol: UserRole.ALUMNO,
            nombre: 'Usuario',
            apellido_paterno: 'Demo',
            esta_activo: true,
            debe_cambiar_contrasena: false
          };

          const response: LoginResponse = {
            success: true,
            user: genericUser,
            token: 'demo_token_' + Date.now(),
            message: 'Login demo exitoso'
          };

          this.saveAuthData(response.user, response.token);
          return response;
        }

        // Usuario encontrado
        const response: LoginResponse = {
          success: true,
          user: user,
          token: 'demo_token_' + Date.now(),
          message: 'Login demo exitoso'
        };

        this.saveAuthData(response.user, response.token);
        return response;
      })
    );
  }

  // ========================
  // MÉTODOS PÚBLICOS - LOGOUT
  // ========================

  /**
   * Cerrar sesión
   * Limpia localStorage y redirige al login
   */
  logout(): void {
    if (environment.enableDebugLogs) {
      console.log('🚪 [AUTH SERVICE] Cerrando sesión');
    }

    this.clearAuthData();
    this.router.navigate(['/auth/login']);
  }

  // ========================
  // MÉTODOS PÚBLICOS - VERIFICACIÓN
  // ========================

  /**
   * Verifica si el usuario está autenticado
   */
  isUserAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getUser();
    
    const isAuthenticated = !!(token && user && user.esta_activo);
    
    if (environment.enableDebugLogs) {
      console.log('🔍 [AUTH SERVICE] isUserAuthenticated:', isAuthenticated);
    }
    
    return isAuthenticated;
  }

  /**
   * Obtiene el rol del usuario actual
   */
  getUserRole(): UserRole {
    const user = this.getUser();
    return user?.rol || UserRole.GUEST;
  }

  /**
   * Obtiene el usuario actual
   */
  getUser(): User | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    
    if (!userJson) {
      return null;
    }

    try {
      return JSON.parse(userJson) as User;
    } catch (error) {
      console.error('Error al parsear usuario desde localStorage:', error);
      return null;
    }
  }

  /**
   * Obtiene el token JWT actual
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Obtiene el estado de autenticación como observable
   */
  getAuthState(): Observable<AuthState> {
    return this.authState$.asObservable();
  }

  /**
   * Verifica si el usuario tiene un rol específico
   */
  hasRole(role: UserRole): boolean {
    return this.getUserRole() === role;
  }

  /**
   * Verifica si el usuario tiene alguno de los roles especificados
   */
  hasAnyRole(roles: UserRole[]): boolean {
    const userRole = this.getUserRole();
    return roles.includes(userRole);
  }

  // ========================
  // MÉTODOS PRIVADOS
  // ========================

  /**
   * Guarda los datos de autenticación en localStorage
   */
  private saveAuthData(user: User, token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    
    // Actualizar el estado observable
    this.authState$.next({
      isAuthenticated: true,
      user: user,
      token: token
    });

    if (environment.enableDebugLogs) {
      console.log('💾 [AUTH SERVICE] Datos guardados en localStorage');
    }
  }

  /**
   * Limpia los datos de autenticación de localStorage
   */
  private clearAuthData(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    
    // Actualizar el estado observable
    this.authState$.next({
      isAuthenticated: false,
      user: null,
      token: undefined
    });

    if (environment.enableDebugLogs) {
      console.log('🗑️ [AUTH SERVICE] Datos limpiados de localStorage');
    }
  }

  /**
   * Verifica si hay sesión guardada al iniciar el servicio
   */
  private checkStoredAuth(): void {
    const token = this.getToken();
    const user = this.getUser();
    
    if (token && user) {
      // Hay sesión guardada, actualizar estado
      this.authState$.next({
        isAuthenticated: true,
        user: user,
        token: token
      });

      if (environment.enableDebugLogs) {
        console.log('✅ [AUTH SERVICE] Sesión restaurada desde localStorage');
      }
    } else {
      if (environment.enableDebugLogs) {
        console.log('ℹ️ [AUTH SERVICE] No hay sesión guardada');
      }
    }
  }
}