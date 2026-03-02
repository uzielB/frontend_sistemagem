import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import { map } from 'rxjs/operators';

// ==================== INTERFACES (EXISTENTES) ====================

export interface Program {
  id: number;
  nombre: string;
  codigo: string;
  modalidad: string;
  duracionSemestres: number;
  estaActivo: boolean;
  totalMaterias?: number;
}

export interface ProgramDetail extends Program {
  materias: Materia[];
}

export interface Materia {
  id: number;
  programaId: number;
  nombre: string;
  codigo: string;
  semestre: number;
  creditos: number;
  estaActivo: boolean;
  tieneTemario?: boolean;
  totalArchivos?: number;
  temario?: Temario;
}

export interface Temario {
  id: number;
  materiaId: number;
  periodoEscolarId: number;
  nombreArchivo: string;
  nombreOriginal: string;
  rutaArchivo: string;
  tamanoMb: number;
  titulo: string;
  descripcion: string;
  subidoPor: number;
  fechaSubida: Date;
  estaActivo: boolean;
}

export interface ArchivoTemarioBase {
  id: number;
  materiaId: number;
  periodoEscolarId: number;
  titulo: string;
  descripcion: string;
  archivoPdf: string;
  nombreOriginal: string;
  tamanoMb: number;
  orden: number;
  tipo: string;
  subidoPor: number;
  fechaSubida: Date;
  estaActivo: boolean;
}

export interface UploadArchivoTemarioBaseRequest {
  materiaId: number;
  periodoEscolarId: number;
  titulo: string;
  descripcion?: string;
  tipo?: string;
  orden?: number;
}

export interface MateriaCreationResult {
  materiaId: number;
  materiaNombre: string;
  materiaCodigo: string;
  archivoId: number;
  created: boolean;
  reactivated: boolean;
}

export interface BatchUploadResult {
  success: MateriaCreationResult[];
  errors: { filename: string; error: string; }[];
  total: number;
  created: number;
  existing: number;
  reactivated: number;
  failed: number;
}

export interface ProgramaStats {
  totalMaterias: number;
  materiasPorSemestre: { [semestre: number]: number };
  materiasConTemario: number;
}

export interface LessonPlanAdmin {
  id: number;
  temarioId: number;
  docenteId: number;
  asignacionId?: number;
  nombreArchivo: string;
  nombreOriginal: string;
  rutaArchivo: string;
  tamanoMb: number;
  titulo: string;
  descripcion: string;
  fechaSubida: string;
  estatus: string;
  revisadoPor?: number;
  fechaRevision?: string;
  observaciones?: string;
  version: number;
  syllabus?: {
    id: number;
    materiaId: number;
    titulo: string;
    subject?: {
      id: number;
      nombre: string;
      codigo: string;
      semestre: number;
    };
  };
  teacher?: {
    id: number;
    numeroEmpleado: string;
    usuario?: {
      id: number;
      nombre: string;
      apellidoPaterno: string;
      apellidoMaterno: string;
      correo: string;
    };
  };
  reviewer?: {
    id: number;
    nombre: string;
    apellidoPaterno: string;
  };
}

export interface ReviewLessonPlanRequest {
  estatus: 'APROBADA' | 'RECHAZADA' | 'CON_OBSERVACIONES' | 'EN_REVISION';
  observaciones?: string;
}

// ==================== NUEVAS INTERFACES DOCENTES ====================

export interface DocenteAdmin {
  id: number;
  numeroEmpleado: string;
  departamento: string;
  especialidad: string;
  areaGradoAcademico: string;
  estaActivo: boolean;
  haCompletadoFormulario: boolean;
  haSubidoDocumentos: boolean;
  haProporcionadoDatosBancarios?: boolean;
  fechaCreacion: string;
  totalMateriasAsignadas: number;
  usuario: {
    id: number;
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    correo: string;
    curp: string;
    telefono: string;
    estaActivo: boolean;
  } | null;
}

export interface MateriaAsignadaGrupo {
  programaId: number;
  programaNombre: string;
  programaCodigo: string;
  materias: MateriaAsignada[];
}

export interface MateriaAsignada {
  asignacionId: number;
  materiaId: number;
  nombre: string;
  codigo: string;
  semestre: number;
  creditos: number;
  fechaAsignacion: string;
}

export interface AsignarMateriasResult {
  asignadas: number;
  duplicadas: number;
  total: number;
}

// ==================== SERVICE ====================

@Injectable({
  providedIn: 'root'
})
export class AdminDocentesService {

  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // ==================== PROGRAMAS (EXISTENTE) ====================

  getProgramas(filters?: { modalidad?: string; estaActivo?: boolean }): Observable<Program[]> {
    const url = `${this.apiUrl}/admin/programs`;
    let params = new HttpParams();
    if (filters?.modalidad) params = params.set('modalidad', filters.modalidad);
    if (filters?.estaActivo !== undefined) params = params.set('estaActivo', filters.estaActivo.toString());
    return this.http.get<Program[]>(url, { headers: this.getHeaders(), params });
  }

  getProgramaDetail(programaId: number): Observable<ProgramDetail> {
    return this.http.get<ProgramDetail>(`${this.apiUrl}/admin/programs/${programaId}`, { headers: this.getHeaders() });
  }

  getMateriasByPrograma(programaId: number, filters?: { semestre?: number; tieneTemario?: boolean }): Observable<Materia[]> {
    const url = `${this.apiUrl}/admin/programs/${programaId}/materias`;
    let params = new HttpParams();
    if (filters?.semestre) params = params.set('semestre', filters.semestre.toString());
    if (filters?.tieneTemario !== undefined) params = params.set('tieneTemario', filters.tieneTemario.toString());
    return this.http.get<Materia[]>(url, { headers: this.getHeaders(), params });
  }

  // ==================== TEMARIOS BASE (EXISTENTE) ====================

  uploadArchivoTemarioBase(file: File, data: UploadArchivoTemarioBaseRequest): Observable<ArchivoTemarioBase> {
    const url = `${this.apiUrl}/admin/temarios-base`;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('materiaId', data.materiaId.toString());
    formData.append('periodoEscolarId', data.periodoEscolarId.toString());
    formData.append('titulo', data.titulo);
    if (data.descripcion) formData.append('descripcion', data.descripcion);
    if (data.tipo) formData.append('tipo', data.tipo);
    if (data.orden) formData.append('orden', data.orden.toString());
    const token = this.authService.getToken();
    return this.http.post<ArchivoTemarioBase>(url, formData, {
      headers: new HttpHeaders({ 'Authorization': `Bearer ${token}` })
    });
  }

  getArchivosTemariosBase(materiaId: number, periodoEscolarId: number): Observable<ArchivoTemarioBase[]> {
    const url = `${this.apiUrl}/admin/syllabuses/materia/${materiaId}?periodoEscolarId=${periodoEscolarId}`;
    return this.http.get<ArchivoTemarioBase[]>(url, { headers: this.getHeaders() }).pipe(
      map(archivos => archivos.map(archivo => ({
        ...archivo,
        archivoPdf: archivo.archivoPdf.startsWith('http')
          ? archivo.archivoPdf
          : `${this.apiUrl.replace('/api', '')}/${archivo.archivoPdf}`
      })))
    );
  }

  deleteArchivoTemarioBase(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/admin/temarios-base/${id}`, { headers: this.getHeaders() });
  }


  clearTodasLasMaterias(docenteId: number): Observable<{ planeacionesEliminadas: number; materiasEliminadas: number }> {
    return this.http.delete<{ planeacionesEliminadas: number; materiasEliminadas: number }>(
      `${this.apiUrl}/admin/docentes/${docenteId}/materias/todas`,
      { headers: this.getHeaders() }
    );
  }

  // ==================== CARGA MASIVA (EXISTENTE) ====================

  uploadMateriasMasivas(programaId: number, periodoEscolarId: number, files: File[]): Observable<BatchUploadResult> {
    const url = `${this.apiUrl}/admin/materias-masivas/programa/${programaId}`;
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    formData.append('periodoEscolarId', periodoEscolarId.toString());
    const token = this.authService.getToken();
    return this.http.post<BatchUploadResult>(url, formData, {
      headers: new HttpHeaders({ 'Authorization': `Bearer ${token}` })
    });
  }

  getProgramaStats(programaId: number): Observable<ProgramaStats> {
    return this.http.get<ProgramaStats>(`${this.apiUrl}/admin/materias-masivas/programa/${programaId}/stats`, { headers: this.getHeaders() });
  }

  deleteMateria(materiaId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/admin/materias-masivas/materia/${materiaId}`, { headers: this.getHeaders() });
  }

  // ==================== PLANEACIONES (EXISTENTE) ====================

  getAllLessonPlans(): Observable<LessonPlanAdmin[]> {
    return this.http.get<LessonPlanAdmin[]>(`${this.apiUrl}/admin/syllabuses/lesson-plans`, { headers: this.getHeaders() });
  }

  reviewLessonPlan(id: number, review: ReviewLessonPlanRequest): Observable<LessonPlanAdmin> {
    return this.http.post<LessonPlanAdmin>(`${this.apiUrl}/admin/syllabuses/lesson-plans/${id}/review`, review, { headers: this.getHeaders() });
  }

  getLessonPlanPdfUrl(rutaArchivo: string): string {
    if (!rutaArchivo) return '';
    if (rutaArchivo.startsWith('http')) return rutaArchivo;
    return `http://localhost:3000/${rutaArchivo.replace(/\\/g, '/')}`;
  }

  // ==================== NUEVOS: GESTIÓN DE DOCENTES ====================

  /** GET /admin/docentes — lista todos los docentes */
  getDocentes(): Observable<DocenteAdmin[]> {
    return this.http.get<DocenteAdmin[]>(`${this.apiUrl}/admin/docentes`, { headers: this.getHeaders() });
  }

  /** GET /admin/docentes/:id — detalle de un docente */
  getDocenteById(id: number): Observable<DocenteAdmin> {
    return this.http.get<DocenteAdmin>(`${this.apiUrl}/admin/docentes/${id}`, { headers: this.getHeaders() });
  }

  /** GET /admin/docentes/:id/materias — materias asignadas agrupadas por carrera */
  getMateriasAsignadas(docenteId: number): Observable<MateriaAsignadaGrupo[]> {
    return this.http.get<MateriaAsignadaGrupo[]>(`${this.apiUrl}/admin/docentes/${docenteId}/materias`, { headers: this.getHeaders() });
  }

  /** GET /admin/docentes/:id/materias-ids — solo IDs asignados */
  getMateriasIdsAsignadas(docenteId: number): Observable<number[]> {
    return this.http.get<number[]>(`${this.apiUrl}/admin/docentes/${docenteId}/materias-ids`, { headers: this.getHeaders() });
  }

  /** POST /admin/docentes/:id/materias — asignar bloque de materias */
  asignarMaterias(docenteId: number, materiaIds: number[]): Observable<AsignarMateriasResult> {
    return this.http.post<AsignarMateriasResult>(
      `${this.apiUrl}/admin/docentes/${docenteId}/materias`,
      { materiaIds },
      { headers: this.getHeaders() }
    );
  }

  /** DELETE /admin/docentes/:docenteId/materias/:materiaId — quitar una materia */
  desasignarMateria(docenteId: number, materiaId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/admin/docentes/${docenteId}/materias/${materiaId}`, { headers: this.getHeaders() });
  }

  // ==================== HELPER ====================

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }


 getDisponibilidadDocente(docenteId: number): Observable<any> {
  return this.http.get<any>(
    `${this.apiUrl}/admin/docentes/${docenteId}/disponibilidad`,
    { headers: this.getHeaders() }
  );
}

marcarDisponibilidadRevisada(docenteId: number): Observable<any> {
  return this.http.patch<any>(
    `${this.apiUrl}/admin/docentes/${docenteId}/disponibilidad/revisar`,
    {},
    { headers: this.getHeaders() }
  );
}

}