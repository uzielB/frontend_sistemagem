import { HttpInterceptorFn } from '@angular/common/http';

/**
 * UBICACIÓN: src/app/core/interceptors/auth.interceptor.ts
 *
 * Agrega el token JWT a todas las peticiones HTTP automáticamente.
 * Busca el token en las claves más comunes de localStorage.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const token = getToken();

  // Si no hay token o es una ruta pública, pasar sin modificar
  if (!token) return next(req);

  // Clonar la petición agregando el header de autorización
  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(authReq);
};

/**
 * Busca el JWT en localStorage probando las claves más comunes
 * y como fallback busca cualquier valor que parezca un JWT (empieza con 'eyJ')
 */
function getToken(): string {
  // Claves comunes usadas en proyectos NestJS + Angular
  const clavesComunes = [
    'token',
    'auth_token',
    'access_token',
    'accessToken',
    'authToken',
    'jwt_token',
    'jwtToken',
    'gem_token',
  ];

  for (const clave of clavesComunes) {
    const val = localStorage.getItem(clave);
    if (val && val.startsWith('eyJ')) return val;
  }

  // Fallback: buscar cualquier JWT en localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    const val = localStorage.getItem(key) || '';
    if (val.startsWith('eyJ')) return val;
  }

  return '';
}