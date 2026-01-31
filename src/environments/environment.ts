/**
 * Configuración de Ambiente de DESARROLLO
 */
export const environment = {
  production: false,
  
  // URL del backend local (NestJS corriendo en localhost:3000)
  apiUrl: 'http://localhost:3000/api',
  
  // Configuraciones adicionales
  appName: 'Sistema Académico GEM',
  version: '1.0.0',
  
  // Tiempo de expiración de sesión (en milisegundos)
  // 24 horas = 24 * 60 * 60 * 1000 = 86400000
  sessionTimeout: 86400000,
  
  // Habilitar logs de desarrollo
  enableDebugLogs: true,
  
  // Modo demo para desarrollo sin backend
  enableDemoMode: false, // Cambiar a true si quieres probar sin backend
};