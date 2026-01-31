/**
 * Configuración de Ambiente de PRODUCCIÓN
 */
export const environment = {
  production: true,
  
  // URL del backend en producción (AWS)
  // 🔴 IMPORTANTE: Reemplazar con la URL real de tu servidor AWS cuando esté listo
  apiUrl: 'https://api-gem.tu-dominio.com/api',
  
  // Configuraciones adicionales
  appName: 'Sistema Académico GEM',
  version: '1.0.0',
  
  // Tiempo de expiración de sesión (en milisegundos) 24 horas = 86400000 ms
  sessionTimeout: 86400000,
  
  // Deshabilitar logs en producción
  enableDebugLogs: false,
  
  // Deshabilitar modo demo en producción
  enableDemoMode: false,
};