// Modelos para el Módulo de Finanzas

export interface ConceptoPago {
  id: number;
  nombre: string;
  codigo: string;
  descripcion?: string;
  monto_default: number;
  es_recurrente: boolean;
  aplica_semestre?: number;
  esta_activo: boolean;
  fecha_creacion?: Date;
  fecha_actualizacion?: Date;
}

export enum EstatusPago {
  PENDIENTE = 'PENDIENTE',
  PAGADO = 'PAGADO',
  VENCIDO = 'VENCIDO',
  CANCELADO = 'CANCELADO'
}

export enum MetodoPago {
  EFECTIVO = 'EFECTIVO',
  TRANSFERENCIA = 'TRANSFERENCIA',
  TARJETA = 'TARJETA',
  REFERENCIA = 'REFERENCIA'
}

export interface Pago {
  id?: number;
  estudiante_id: number;
  concepto_id: number;
  periodo_escolar_id?: number;
  
  // Montos
  monto_original: number;
  monto_descuento: number;
  monto_final: number;
  
  // Fechas
  fecha_vencimiento: Date | string;
  fecha_pago?: Date | string;
  
  // Estado y método
  estatus: EstatusPago;
  metodo_pago?: MetodoPago;
  referencia_pago?: string;
  
  // Metadatos
  comentarios?: string;
  creado_por?: number;
  fecha_creacion?: Date;
  fecha_actualizacion?: Date;
  
  // Relaciones (para mostrar en la UI)
  concepto?: ConceptoPago;
  estudiante?: {
    nombre: string;
    apellido_paterno: string;
    apellido_materno?: string;
    matricula: string;
  };
}

export interface Beca {
  id: number;
  estudiante_id: number;
  tipo_beca: string;
  porcentaje: number;
  fecha_inicio: Date;
  fecha_fin: Date;
  periodo_aplica?: number;
  estatus: string;
  justificacion: string;
}

export interface EstadoFinanciero {
  id: number;
  estudiante_id: number;
  periodo_escolar_id?: number;
  total_adeudo: number;
  total_pagado: number;
  total_descuento: number;
  saldo: number;
  fecha_ultimo_pago?: Date;
}

// DTO para crear un nuevo pago
export interface CrearPagoDTO {
  estudiante_id: number;
  concepto_id: number;
  monto_original: number;
  monto_descuento: number;
  monto_final: number;
  fecha_vencimiento: Date | string;
  estatus: EstatusPago;
  comentarios?: string;
}

// DTO para actualizar un pago
export interface ActualizarPagoDTO {
  monto_original?: number;
  monto_descuento?: number;
  monto_final?: number;
  fecha_vencimiento?: Date | string;
  fecha_pago?: Date | string;
  estatus?: EstatusPago;
  metodo_pago?: MetodoPago;
  referencia_pago?: string;
  comentarios?: string;
}

// Respuesta del backend
export interface PagoResponse {
  success: boolean;
  data?: Pago | Pago[];
  message?: string;
  total?: number;
}

// Respuesta específica para conceptos
export interface ConceptoPagoResponse {
  success: boolean;
  data?: ConceptoPago[];
  message?: string;
}