// Modelo de Usuario y Tipos de Roles - ACTUALIZADO CON BD

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  DOCENTE = 'DOCENTE',
  ALUMNO = 'ALUMNO',
  GUEST = 'GUEST'  // Para usuarios no autenticados
}

export interface User {
  id: number;
  curp: string;  // ← CAMPO PRINCIPAL DE LOGIN (18 caracteres)
  correo?: string;
  rol: UserRole;
  nombre: string;
  apellido_paterno: string;
  apellido_materno?: string;
  telefono?: string;
  esta_activo: boolean;
  debe_cambiar_contrasena: boolean;
  ultimo_acceso?: Date;
  fecha_creacion?: Date;
  fecha_actualizacion?: Date;
  
  // Campos adicionales según el rol
  foto?: string;  // URL de la foto del usuario
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token?: string;
}

export interface LoginCredentials {
  curp: string;  // ← LOGIN CON CURP
  contrasena: string;
}

export interface LoginResponse {
  success: boolean;
  user: User;
  token: string;
  message?: string;
}

// Helper para validar formato CURP
export function isValidCURP(curp: string): boolean {
  // CURP debe tener exactamente 18 caracteres
  // Formato: LLLLNNNNNNHLLLLNNN (letras y números)
  const curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d$/;
  return curpRegex.test(curp);
}

// Helper para obtener nombre completo
export function getFullName(user: User): string {
  return `${user.nombre} ${user.apellido_paterno} ${user.apellido_materno || ''}`.trim();
}

// Helper para obtener iniciales
export function getInitials(user: User): string {
  const firstInitial = user.nombre.charAt(0).toUpperCase();
  const lastInitial = user.apellido_paterno.charAt(0).toUpperCase();
  return `${firstInitial}${lastInitial}`;
}

// Helper para obtener etiqueta del rol
export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    [UserRole.SUPER_ADMIN]: 'Super Administrador',
    [UserRole.ADMIN]: 'Administrador',
    [UserRole.DOCENTE]: 'Docente',
    [UserRole.ALUMNO]: 'Alumno',
    [UserRole.GUEST]: 'Invitado'
  };
  return labels[role] || 'Usuario';
}