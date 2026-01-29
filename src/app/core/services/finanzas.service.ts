import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { 
  Pago, 
  ConceptoPago, 
  CrearPagoDTO, 
  ActualizarPagoDTO, 
  ConceptoPagoResponse,
  PagoResponse,
  EstatusPago,
  MetodoPago,
  Beca
} from '../models/finanzas.models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FinanzasService {
  
  private apiUrl = `${environment.apiUrl}/finanzas`;
  
  constructor(private http: HttpClient) {}

  /**
   * Obtener headers con token de autenticación
   */
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('gem_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // ==========================================
  // CONCEPTOS DE PAGO
  // ==========================================

  /**
   * Obtener todos los conceptos de pago activos
   */
    getConceptosPago(): Observable<ConceptoPago[]> {
    return this.http.get<ConceptoPagoResponse>(`${this.apiUrl}/conceptos`, {
    headers: this.getHeaders()
    }).pipe(
        map(response => response.data || []),
        catchError(this.handleError<ConceptoPago[]>('getConceptosPago', []))
    );
    }

  // ==========================================
  // PAGOS - ADMIN (CRUD COMPLETO)
  // ==========================================

  /**
   * Obtener todos los pagos (Admin)
   * Puede filtrar por estudiante, estatus, fecha, etc.
   */
  getPagos(params?: {
    estudiante_id?: number;
    estatus?: EstatusPago;
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Observable<Pago[]> {
    let url = `${this.apiUrl}/pagos`;
    
    // Construir query params
    const queryParams = new URLSearchParams();
    if (params?.estudiante_id) queryParams.append('estudiante_id', params.estudiante_id.toString());
    if (params?.estatus) queryParams.append('estatus', params.estatus);
    if (params?.fecha_desde) queryParams.append('fecha_desde', params.fecha_desde);
    if (params?.fecha_hasta) queryParams.append('fecha_hasta', params.fecha_hasta);
    
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }

    return this.http.get<PagoResponse>(url, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.data as Pago[] || []),
      catchError(this.handleError<Pago[]>('getPagos', []))
    );
  }

  /**
   * Obtener un pago por ID
   */
  getPagoById(id: number): Observable<Pago | null> {
    return this.http.get<PagoResponse>(`${this.apiUrl}/pagos/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.data as Pago || null),
      catchError(this.handleError<Pago | null>('getPagoById', null))
    );
  }

  /**
   * Crear un nuevo pago (Admin)
   */
  crearPago(pago: CrearPagoDTO): Observable<Pago | null> {
    return this.http.post<PagoResponse>(`${this.apiUrl}/pagos`, pago, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.data as Pago || null),
      catchError(this.handleError<Pago | null>('crearPago', null))
    );
  }

  /**
   * Actualizar un pago existente (Admin)
   */
  actualizarPago(id: number, pago: ActualizarPagoDTO): Observable<Pago | null> {
    return this.http.put<PagoResponse>(`${this.apiUrl}/pagos/${id}`, pago, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.data as Pago || null),
      catchError(this.handleError<Pago | null>('actualizarPago', null))
    );
  }

  /**
   * Eliminar un pago (Admin)
   */
  eliminarPago(id: number): Observable<boolean> {
    return this.http.delete<PagoResponse>(`${this.apiUrl}/pagos/${id}`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.success || false),
      catchError(this.handleError<boolean>('eliminarPago', false))
    );
  }

  // ==========================================
  // PAGOS - ALUMNO (SOLO LECTURA)
  // ==========================================

  /**
   * Obtener pagos del alumno autenticado
   */
  getMisPagos(): Observable<Pago[]> {
    return this.http.get<PagoResponse>(`${this.apiUrl}/mis-pagos`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.data as Pago[] || []),
      catchError(this.handleError<Pago[]>('getMisPagos', []))
    );
  }

  /**
   * Obtener pagos pendientes del alumno
   */
  getMisPagosPendientes(): Observable<Pago[]> {
    return this.http.get<PagoResponse>(`${this.apiUrl}/mis-pagos?estatus=PENDIENTE`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.data as Pago[] || []),
      catchError(this.handleError<Pago[]>('getMisPagosPendientes', []))
    );
  }

  // ==========================================
  // BECAS
  // ==========================================

  /**
   * Obtener beca activa de un estudiante
   */
  getBecaEstudiante(estudianteId: number): Observable<Beca | null> {
    return this.http.get<{ success: boolean; data?: Beca }>(
      `${this.apiUrl}/becas/estudiante/${estudianteId}`,
      { headers: this.getHeaders() }
    ).pipe(
      map(response => response.data || null),
      catchError(this.handleError<Beca | null>('getBecaEstudiante', null))
    );
  }

  /**
   * Calcular monto con descuento de beca
   */
  calcularMontoConBeca(montoOriginal: number, porcentajeBeca: number): number {
    const descuento = (montoOriginal * porcentajeBeca) / 100;
    return montoOriginal - descuento;
  }

  // ==========================================
  // ESTUDIANTES (para dropdown)
  // ==========================================

  /**
   * Obtener lista de estudiantes activos (para el dropdown del admin)
   */
  getEstudiantesActivos(): Observable<any[]> {
    return this.http.get<any>(`${environment.apiUrl}/estudiantes?activos=true`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.data || []),
      catchError(this.handleError<any[]>('getEstudiantesActivos', []))
    );
  }

  // ==========================================
  // UTILIDADES
  // ==========================================

  /**
   * Verificar si un pago está vencido
   */
  esPagoVencido(pago: Pago): boolean {
    if (pago.estatus === EstatusPago.PAGADO) return false;
    
    const hoy = new Date();
    const fechaVencimiento = new Date(pago.fecha_vencimiento);
    
    return hoy > fechaVencimiento;
  }

  /**
   * Obtener clase CSS según el estatus del pago
   */
  getEstatusClass(estatus: EstatusPago): string {
    const classes: Record<EstatusPago, string> = {
      [EstatusPago.PAGADO]: 'estatus-pagado',
      [EstatusPago.PENDIENTE]: 'estatus-pendiente',
      [EstatusPago.VENCIDO]: 'estatus-vencido',
      [EstatusPago.CANCELADO]: 'estatus-cancelado'
    };
    return classes[estatus] || '';
  }

  /**
   * Formatear monto como moneda
   */
  formatearMoneda(monto: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(monto);
  }

  /**
   * Manejo de errores
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      return of(result as T);
    };
  }

  // ==========================================
  // DATOS MOCK PARA DESARROLLO (Eliminar cuando backend esté listo)
  // ==========================================

  /**
   * Obtener pagos MOCK (para desarrollo sin backend)
   */
  getPagosMock(): Observable<Pago[]> {
    const pagosMock: Pago[] = [
      {
        id: 1,
        estudiante_id: 1,
        concepto_id: 3,
        monto_original: 3500,
        monto_descuento: 875,
        monto_final: 2625,
        fecha_vencimiento: '2025-02-05',
        estatus: EstatusPago.PENDIENTE,
        concepto: {
          id: 3,
          nombre: 'Colegiatura',
          codigo: 'COL',
          descripcion: 'Pago mensual de colegiatura',
          monto_default: 3500,
          es_recurrente: true,
          esta_activo: true
        },
        estudiante: {
          nombre: 'Juan',
          apellido_paterno: 'Pérez',
          apellido_materno: 'García',
          matricula: '2025001'
        }
      },
      {
        id: 2,
        estudiante_id: 1,
        concepto_id: 1,
        monto_original: 5000,
        monto_descuento: 0,
        monto_final: 5000,
        fecha_vencimiento: '2025-01-15',
        fecha_pago: '2025-01-10',
        estatus: EstatusPago.PAGADO,
        metodo_pago: MetodoPago.TRANSFERENCIA,
        concepto: {
          id: 1,
          nombre: 'Inscripción',
          codigo: 'INS',
          monto_default: 5000,
          es_recurrente: false,
          esta_activo: true
        },
        estudiante: {
          nombre: 'Juan',
          apellido_paterno: 'Pérez',
          apellido_materno: 'García',
          matricula: '2025001'
        }
      }
    ];

    return of(pagosMock);
  }

  /**
   * Obtener conceptos MOCK
   */
  getConceptosPagoMock(): Observable<ConceptoPago[]> {
    const conceptosMock: ConceptoPago[] = [
      {
        id: 1,
        nombre: 'Inscripción',
        codigo: 'INS',
        descripcion: 'Pago de inscripción para nuevo ingreso',
        monto_default: 5000.00,
        es_recurrente: false,
        esta_activo: true
      },
      {
        id: 2,
        nombre: 'Reinscripción',
        codigo: 'REIN',
        descripcion: 'Pago de reinscripción semestral',
        monto_default: 4000.00,
        es_recurrente: false,
        esta_activo: true
      },
      {
        id: 3,
        nombre: 'Colegiatura',
        codigo: 'COL',
        descripcion: 'Pago mensual de colegiatura',
        monto_default: 3500.00,
        es_recurrente: true,
        esta_activo: true
      },
      {
        id: 4,
        nombre: 'Examen Extraordinario',
        codigo: 'EXT',
        descripcion: 'Pago por examen extraordinario',
        monto_default: 800.00,
        es_recurrente: false,
        esta_activo: true
      }
    ];

    return of(conceptosMock);
  }
}