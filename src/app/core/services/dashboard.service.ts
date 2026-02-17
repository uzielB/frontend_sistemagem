import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';

// ==================== INTERFACES ====================

export interface UsuariosMetrics {
  totalUsuarios: number;
  usuariosPorRol: {
    superAdmin: number;
    admin: number;
    docente: number;
    alumno: number;
  };
  usuariosActivos: number;
  usuariosInactivos: number;
  nuevosEsteMes: number;
}

export interface DocentesMetrics {
  totalDocentes: number;
  docentesActivos: number;
  docentesInactivos: number;
  docentesConFormularioCompleto: number;
  docentesConDocumentosCompletos: number;
  docentesConDatosBancarios: number;
}

export interface EstudiantesMetrics {
  totalEstudiantes: number;
  estudiantesPorEstatus: {
    activos: number;
    bajaTemporal: number;
    egresados: number;
  };
  estudiantesPorPrograma: Array<{
    programaNombre: string;
    cantidad: number;
  }>;
  nuevosEsteMes: number;
}

export interface AcademicoMetrics {
  totalProgramas: number;
  programasActivos: number;
  totalMaterias: number;
  materiasActivas: number;
  totalGrupos: number;
  gruposActivos: number;
  periodoActual: {
    id: number;
    nombre: string;
    codigo: string;
    fechaInicio: Date;
    fechaFin: Date;
  } | null;
}

export interface AsignacionesMetrics {
  totalAsignaciones: number;
  asignacionesActivas: number;
  asignacionesSinModuloHorario: number;
  asignacionesPorSistema: {
    escolarizado: number;
    sabatino: number;
  };
  docentesConAsignaciones: number;
  gruposCubiertos: number;
}

export interface Alertas {
  documentosDocentesPendientes: number;
  planeacionesPendientesRevision: number;
  disponibilidadPendienteRevision: number;
  asignacionesSinModulo: number;
  docentesSinFormulario: number;
  docentesSinDocumentos: number;
  estudiantesSinDocumentos: number;
}

export interface DashboardData {
  usuarios: UsuariosMetrics;
  docentes: DocentesMetrics;
  estudiantes: EstudiantesMetrics;
  academico: AcademicoMetrics;
  asignaciones: AsignacionesMetrics;
  alertas: Alertas;
  generadoEn: Date;
}

// ==================== SERVICE ====================

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  
  private apiUrl = `${environment.apiUrl}/dashboard`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Obtener todas las métricas del dashboard
   * GET /dashboard
   */
  getDashboardMetrics(): Observable<DashboardData> {
    const url = this.apiUrl;
    
    if (environment.enableDebugLogs) {
      console.log('📊 [DASHBOARD SERVICE] Obteniendo métricas:', url);
    }

    return this.http.get<DashboardData>(url, {
      headers: this.getHeaders()
    }).pipe(
      tap(response => {
        if (environment.enableDebugLogs) {
          console.log('✅ [DASHBOARD SERVICE] Métricas obtenidas:', response);
        }
      })
    );
  }

  /**
   * Obtener métricas filtradas por periodo
   * GET /dashboard?periodoEscolarId=1
   */
  getDashboardMetricsByPeriod(periodoId: number): Observable<DashboardData> {
    const url = `${this.apiUrl}?periodoEscolarId=${periodoId}`;
    
    if (environment.enableDebugLogs) {
      console.log('📊 [DASHBOARD SERVICE] Obteniendo métricas del periodo:', periodoId);
    }

    return this.http.get<DashboardData>(url, {
      headers: this.getHeaders()
    }).pipe(
      tap(response => {
        if (environment.enableDebugLogs) {
          console.log('✅ [DASHBOARD SERVICE] Métricas del periodo obtenidas:', response);
        }
      })
    );
  }

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