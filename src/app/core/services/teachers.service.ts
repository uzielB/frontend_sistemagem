import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

// ==================== INTERFACES ====================

export interface TeacherSchedule {
  id: number;
  dia: string;
  modulo: number;
  horaInicio: string;
  horaFin: string;
  materia: string;
  grupo: string;
  aula: string;
  sistema: string;
  materiaId: number;
  grupoId: number;
  asignacionId: number;
}

export interface TeacherAssignment {
  id: number;
  sistema: string;
  grupo: string;
  materia: string;
  aula: string;
  moduloHorario?: {
    numeroModulo: number;
    horaInicio: string;
    horaFin: string;
    diasSemana: string;
  };
  programa?: {
    id: number;
    nombre: string;
    codigo: string;
  };
  periodoEscolar?: {
    id: number;
    nombre: string;
    codigo: string;
  };
}

export interface MyAssignmentsResponse {
  asignaciones: TeacherAssignment[];
  totalAsignaciones: number;
  totalGrupos: number;
  totalAlumnos: number;
  totalHorasSemanales: number;
}

export interface Student {
  id: number;
  matricula: string;
  nombreCompleto: string;
  programa: string;
  grupo: string;
  correo: string;
  telefono: string;
  estatus: string;
  programaId: number;
  grupoId: number;
}

export enum GradeType {
  PARCIAL_1 = 'PARCIAL_1',
  PARCIAL_2 = 'PARCIAL_2',
  PARCIAL_3 = 'PARCIAL_3',
  FINAL = 'FINAL'
}

export interface SaveGradeDto {
  estudianteId: number;
  asignacionId: number;
  tipoCalificacion: GradeType;
  valorCalificacion: number;
  porcentaje?: number;
  comentarios?: string;
}

export interface Grade {
  id: number;
  estudianteId: number;
  asignacionId: number;
  tipoCalificacion: string;
  valorCalificacion: number;
  porcentaje: number;
  comentarios: string;
  fechaCalificacion: Date;
  estudiante?: {
    id: number;
    matricula: string;
    nombreCompleto: string;
  };
}

export enum AttendanceStatus {
  ASISTIO = 'ASISTIO',
  FALTO = 'FALTO',
  RETARDO = 'RETARDO'
}

export interface SaveAttendanceDto {
  estudianteId: number;
  asignacionId: number;
  fecha: string; // 'YYYY-MM-DD'
  estatus: AttendanceStatus;
  llegoTarde?: boolean;
  comentarios?: string;
}

export interface Attendance {
  id: number;
  estudianteId: number;
  asignacionId: number;
  fecha: Date;
  estatus: AttendanceStatus;
  llegoTarde: boolean;
  comentarios: string;
  estudiante?: {
    id: number;
    matricula: string;
    nombreCompleto: string;
    porcentajeAsistencia: number;
  };
}

export interface AttendancePercentage {
  porcentaje: number;
  asistencias: number;
  faltas: number;
  retardos: number;
  total: number;
}

// ==================== SERVICE ====================

/**
 * Servicio de Docentes
 * Maneja todas las operaciones del Portal de Docentes
 */
@Injectable({
  providedIn: 'root'
})
export class TeachersService {
  
  private apiUrl = `${environment.apiUrl}/teachers`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // ==================== HORARIOS Y LISTAS ====================

  /**
   * Obtener horarios del docente
   * GET /teachers/horarios
   */
  getSchedule(): Observable<TeacherSchedule[]> {
    const url = `${this.apiUrl}/horarios`;
    
    if (environment.enableDebugLogs) {
      console.log('📅 [TEACHERS SERVICE] Obteniendo horarios:', url);
    }

    return this.http.get<TeacherSchedule[]>(url, {
      headers: this.getHeaders()
    }).pipe(
      tap(response => {
        if (environment.enableDebugLogs) {
          console.log('✅ [TEACHERS SERVICE] Horarios obtenidos:', response);
        }
      })
    );
  }

  /**
   * Obtener mis asignaciones con estadísticas
   * GET /teachers/mis-asignaciones
   */
  getMyAssignments(): Observable<MyAssignmentsResponse> {
    const url = `${this.apiUrl}/mis-asignaciones`;
    
    if (environment.enableDebugLogs) {
      console.log('📊 [TEACHERS SERVICE] Obteniendo mis asignaciones:', url);
    }

    return this.http.get<MyAssignmentsResponse>(url, {
      headers: this.getHeaders()
    }).pipe(
      tap(response => {
        if (environment.enableDebugLogs) {
          console.log('✅ [TEACHERS SERVICE] Asignaciones obtenidas:', response);
        }
      })
    );
  }

  /**
   * Obtener lista de alumnos
   * GET /teachers/alumnos?grupoId=1&materiaId=2
   */
  getStudents(filters?: {
    grupoId?: number;
    materiaId?: number;
    asignacionId?: number;
    sistema?: string;
  }): Observable<Student[]> {
    const url = `${this.apiUrl}/alumnos`;
    
    let params = new HttpParams();
    if (filters?.grupoId) params = params.set('grupoId', filters.grupoId.toString());
    if (filters?.materiaId) params = params.set('materiaId', filters.materiaId.toString());
    if (filters?.asignacionId) params = params.set('asignacionId', filters.asignacionId.toString());
    if (filters?.sistema) params = params.set('sistema', filters.sistema);

    if (environment.enableDebugLogs) {
      console.log('👥 [TEACHERS SERVICE] Obteniendo alumnos:', { url, params: params.toString() });
    }

    return this.http.get<Student[]>(url, {
      headers: this.getHeaders(),
      params: params
    }).pipe(
      tap(response => {
        if (environment.enableDebugLogs) {
          console.log('✅ [TEACHERS SERVICE] Alumnos obtenidos:', response.length);
        }
      })
    );
  }

  // ==================== CALIFICACIONES ====================

  /**
   * Guardar calificación individual
   * POST /teachers/calificaciones
   */
  saveGrade(grade: SaveGradeDto): Observable<Grade> {
    const url = `${this.apiUrl}/calificaciones`;
    
    if (environment.enableDebugLogs) {
      console.log('💾 [TEACHERS SERVICE] Guardando calificación:', grade);
    }

    return this.http.post<Grade>(url, grade, {
      headers: this.getHeaders()
    }).pipe(
      tap(response => {
        if (environment.enableDebugLogs) {
          console.log('✅ [TEACHERS SERVICE] Calificación guardada:', response);
        }
      })
    );
  }

  /**
   * Guardar calificaciones masivas
   * POST /teachers/calificaciones/masivas
   */
  saveBulkGrades(grades: SaveGradeDto[]): Observable<{ guardadas: number; calificaciones: Grade[] }> {
    const url = `${this.apiUrl}/calificaciones/masivas`;
    
    if (environment.enableDebugLogs) {
      console.log('💾 [TEACHERS SERVICE] Guardando calificaciones masivas:', grades.length);
    }

    return this.http.post<{ guardadas: number; calificaciones: Grade[] }>(url, {
      calificaciones: grades
    }, {
      headers: this.getHeaders()
    }).pipe(
      tap(response => {
        if (environment.enableDebugLogs) {
          console.log('✅ [TEACHERS SERVICE] Calificaciones guardadas:', response.guardadas);
        }
      })
    );
  }

  /**
   * Obtener calificaciones
   * GET /teachers/calificaciones?asignacionId=1&tipoCalificacion=PARCIAL_1
   */
  getGrades(asignacionId: number, tipoCalificacion?: GradeType): Observable<Grade[]> {
    const url = `${this.apiUrl}/calificaciones`;
    
    let params = new HttpParams().set('asignacionId', asignacionId.toString());
    if (tipoCalificacion) {
      params = params.set('tipoCalificacion', tipoCalificacion);
    }

    if (environment.enableDebugLogs) {
      console.log('📋 [TEACHERS SERVICE] Obteniendo calificaciones:', { asignacionId, tipoCalificacion });
    }

    return this.http.get<Grade[]>(url, {
      headers: this.getHeaders(),
      params: params
    }).pipe(
      tap(response => {
        if (environment.enableDebugLogs) {
          console.log('✅ [TEACHERS SERVICE] Calificaciones obtenidas:', response.length);
        }
      })
    );
  }

  /**
   * Actualizar calificación
   * PUT /teachers/calificaciones/:id
   */
  updateGrade(id: number, updates: Partial<SaveGradeDto>): Observable<Grade> {
    const url = `${this.apiUrl}/calificaciones/${id}`;
    
    if (environment.enableDebugLogs) {
      console.log('🔄 [TEACHERS SERVICE] Actualizando calificación:', { id, updates });
    }

    return this.http.put<Grade>(url, updates, {
      headers: this.getHeaders()
    }).pipe(
      tap(response => {
        if (environment.enableDebugLogs) {
          console.log('✅ [TEACHERS SERVICE] Calificación actualizada:', response);
        }
      })
    );
  }

  /**
   * Eliminar calificación
   * DELETE /teachers/calificaciones/:id
   */
  deleteGrade(id: number): Observable<void> {
    const url = `${this.apiUrl}/calificaciones/${id}`;
    
    if (environment.enableDebugLogs) {
      console.log('🗑️ [TEACHERS SERVICE] Eliminando calificación:', id);
    }

    return this.http.delete<void>(url, {
      headers: this.getHeaders()
    }).pipe(
      tap(() => {
        if (environment.enableDebugLogs) {
          console.log('✅ [TEACHERS SERVICE] Calificación eliminada');
        }
      })
    );
  }

  // ==================== ASISTENCIAS ====================

  /**
   * Registrar asistencia individual
   * POST /teachers/asistencias
   */
  saveAttendance(attendance: SaveAttendanceDto): Observable<Attendance> {
    const url = `${this.apiUrl}/asistencias`;
    
    if (environment.enableDebugLogs) {
      console.log('💾 [TEACHERS SERVICE] Registrando asistencia:', attendance);
    }

    return this.http.post<Attendance>(url, attendance, {
      headers: this.getHeaders()
    }).pipe(
      tap(response => {
        if (environment.enableDebugLogs) {
          console.log('✅ [TEACHERS SERVICE] Asistencia registrada:', response);
        }
      })
    );
  }

  /**
   * Registrar asistencias masivas
   * POST /teachers/asistencias/masivas
   */
  saveBulkAttendances(
    fecha: string,
    asignacionId: number,
    asistencias: { estudianteId: number; estatus: AttendanceStatus; comentarios?: string }[]
  ): Observable<{ registradas: number; asistencias: Attendance[] }> {
    const url = `${this.apiUrl}/asistencias/masivas`;
    
    if (environment.enableDebugLogs) {
      console.log('💾 [TEACHERS SERVICE] Registrando asistencias masivas:', asistencias.length);
    }

    return this.http.post<{ registradas: number; asistencias: Attendance[] }>(url, {
      fecha,
      asignacionId,
      asistencias
    }, {
      headers: this.getHeaders()
    }).pipe(
      tap(response => {
        if (environment.enableDebugLogs) {
          console.log('✅ [TEACHERS SERVICE] Asistencias registradas:', response.registradas);
        }
      })
    );
  }

  /**
   * Obtener asistencias
   * GET /teachers/asistencias?asignacionId=1&fecha=2025-02-10
   */
  getAttendances(filters: {
    asignacionId: number;
    fecha?: string;
    fechaInicio?: string;
    fechaFin?: string;
  }): Observable<Attendance[]> {
    const url = `${this.apiUrl}/asistencias`;
    
    let params = new HttpParams().set('asignacionId', filters.asignacionId.toString());
    if (filters.fecha) params = params.set('fecha', filters.fecha);
    if (filters.fechaInicio) params = params.set('fechaInicio', filters.fechaInicio);
    if (filters.fechaFin) params = params.set('fechaFin', filters.fechaFin);

    if (environment.enableDebugLogs) {
      console.log('📋 [TEACHERS SERVICE] Obteniendo asistencias:', filters);
    }

    return this.http.get<Attendance[]>(url, {
      headers: this.getHeaders(),
      params: params
    }).pipe(
      tap(response => {
        if (environment.enableDebugLogs) {
          console.log('✅ [TEACHERS SERVICE] Asistencias obtenidas:', response.length);
        }
      })
    );
  }

  /**
   * Actualizar asistencia
   * PUT /teachers/asistencias/:id
   */
  updateAttendance(id: number, updates: Partial<SaveAttendanceDto>): Observable<Attendance> {
    const url = `${this.apiUrl}/asistencias/${id}`;
    
    if (environment.enableDebugLogs) {
      console.log('🔄 [TEACHERS SERVICE] Actualizando asistencia:', { id, updates });
    }

    return this.http.put<Attendance>(url, updates, {
      headers: this.getHeaders()
    }).pipe(
      tap(response => {
        if (environment.enableDebugLogs) {
          console.log('✅ [TEACHERS SERVICE] Asistencia actualizada:', response);
        }
      })
    );
  }

  /**
   * Eliminar asistencia
   * DELETE /teachers/asistencias/:id
   */
  deleteAttendance(id: number): Observable<void> {
    const url = `${this.apiUrl}/asistencias/${id}`;
    
    if (environment.enableDebugLogs) {
      console.log('🗑️ [TEACHERS SERVICE] Eliminando asistencia:', id);
    }

    return this.http.delete<void>(url, {
      headers: this.getHeaders()
    }).pipe(
      tap(() => {
        if (environment.enableDebugLogs) {
          console.log('✅ [TEACHERS SERVICE] Asistencia eliminada');
        }
      })
    );
  }

  /**
   * Calcular porcentaje de asistencia
   * GET /teachers/asistencias/porcentaje/:estudianteId/:asignacionId
   */
  getAttendancePercentage(estudianteId: number, asignacionId: number): Observable<AttendancePercentage> {
    const url = `${this.apiUrl}/asistencias/porcentaje/${estudianteId}/${asignacionId}`;
    
    if (environment.enableDebugLogs) {
      console.log('📊 [TEACHERS SERVICE] Calculando porcentaje de asistencia:', { estudianteId, asignacionId });
    }

    return this.http.get<AttendancePercentage>(url, {
      headers: this.getHeaders()
    }).pipe(
      tap(response => {
        if (environment.enableDebugLogs) {
          console.log('✅ [TEACHERS SERVICE] Porcentaje calculado:', response.porcentaje + '%');
        }
      })
    );
  }

  // ==================== HELPERS PRIVADOS ====================

  /**
   * Obtener headers con autenticación
   */
  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }
}