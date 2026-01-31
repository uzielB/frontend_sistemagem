/**
 * Interface para tipado de ambientes
 */
export interface Environment {
  production: boolean;
  apiUrl: string;
  appName: string;
  version: string;
  sessionTimeout: number;
  enableDebugLogs: boolean;
  enableDemoMode: boolean;
}
