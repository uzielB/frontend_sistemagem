import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';

/**
 * UBICACIÓN: src/app/core/interceptors/auth.interceptor.ts
 *
 * Agrega el token JWT a todas las peticiones HTTP automáticamente.
 * Busca en las claves más comunes de localStorage.
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const token = getToken();

  // Si no hay token o es una petición pública, continuar sin modificar
  if (!token) {
    return next(req);
  }

  // Clonar la petición agregando el header Authorization
  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(authReq);
};

/**
 * Busca el token JWT en localStorage probando las claves más comunes.
 * También hace un fallback escaneando todas las keys que contengan un JWT.
 */
function getToken(): string | null {
  // Claves comunes — ajusta si usas una diferente
  const claves = [
    'token',
    'auth_token',
    'access_token',
    'authToken',
    'jwt',
    'jwt_token',
    'gem_token',
    'bearerToken',
  ];

  for (const clave of claves) {
    const valor = localStorage.getItem(clave);
    if (valor) return valor;
  }

  // Fallback: escanear todas las keys buscando un JWT (empieza con "eyJ")
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const valor = localStorage.getItem(key);
      if (valor && valor.startsWith('eyJ')) return valor;
    }
  }

  return null;
}