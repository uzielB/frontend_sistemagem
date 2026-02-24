import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';
import { map } from 'rxjs/operators';
// ==================== INTERFACES EXISTENTES ====================

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

// ==================== NUEVAS INTERFACES PARA CARGA MASIVA ====================

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
  errors: {
    filename: string;
    error: string;
  }[];
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

  // ==================== PROGRAMAS ====================

  getProgramas(filters?: { modalidad?: string; estaActivo?: boolean }): Observable<Program[]> {
    const url = `${this.apiUrl}/admin/programs`;
    let params = new HttpParams();
    if (filters?.modalidad) params = params.set('modalidad', filters.modalidad);
    if (filters?.estaActivo !== undefined) params = params.set('estaActivo', filters.estaActivo.toString());

    return this.http.get<Program[]>(url, {
      headers: this.getHeaders(),
      params: params
    });
  }

  getProgramaDetail(programaId: number): Observable<ProgramDetail> {
    const url = `${this.apiUrl}/admin/programs/${programaId}`;
    return this.http.get<ProgramDetail>(url, {
      headers: this.getHeaders()
    });
  }

  getMateriasByPrograma(programaId: number, filters?: { semestre?: number; tieneTemario?: boolean }): Observable<Materia[]> {
    const url = `${this.apiUrl}/admin/programs/${programaId}/materias`;
    let params = new HttpParams();
    if (filters?.semestre) params = params.set('semestre', filters.semestre.toString());
    if (filters?.tieneTemario !== undefined) params = params.set('tieneTemario', filters.tieneTemario.toString());

    return this.http.get<Materia[]>(url, {
      headers: this.getHeaders(),
      params: params
    });
  }

  // ==================== TEMARIOS BASE ====================

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
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<ArchivoTemarioBase>(url, formData, { headers });
  }

getArchivosTemariosBase(materiaId: number, periodoEscolarId: number): Observable<ArchivoTemarioBase[]> {
  const url = `${this.apiUrl}/admin/syllabuses/materia/${materiaId}?periodoEscolarId=${periodoEscolarId}`;
  
  return this.http.get<ArchivoTemarioBase[]>(url, {
    headers: this.getHeaders()
  }).pipe(
    map((archivos) => {
      return archivos.map(archivo => ({
        ...archivo,
        archivoPdf: archivo.archivoPdf.startsWith('http') 
          ? archivo.archivoPdf 
          : `${this.apiUrl.replace('/api', '')}/${archivo.archivoPdf}`
      }));
    })
  );
}

  countArchivosTemariosBase(materiaId: number, periodoId?: number): Observable<{ count: number }> {
    const url = `${this.apiUrl}/admin/temarios-base/materia/${materiaId}/count`;
    
    let params = new HttpParams();
    if (periodoId) params = params.set('periodoId', periodoId.toString());

    return this.http.get<{ count: number }>(url, {
      headers: this.getHeaders(),
      params: params
    });
  }

  updateArchivoTemarioBase(
    id: number, 
    updates: { titulo?: string; descripcion?: string; orden?: number; tipo?: string; estaActivo?: boolean }
  ): Observable<ArchivoTemarioBase> {
    const url = `${this.apiUrl}/admin/temarios-base/${id}`;
    return this.http.put<ArchivoTemarioBase>(url, updates, {
      headers: this.getHeaders()
    });
  }

  deleteArchivoTemarioBase(id: number): Observable<{ message: string }> {
    const url = `${this.apiUrl}/admin/temarios-base/${id}`;
    return this.http.delete<{ message: string }>(url, {
      headers: this.getHeaders()
    });
  }

  replaceArchivoTemarioBase(id: number, file: File): Observable<ArchivoTemarioBase> {
    const url = `${this.apiUrl}/admin/temarios-base/${id}/reemplazar`;
    
    const formData = new FormData();
    formData.append('file', file);

    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<ArchivoTemarioBase>(url, formData, { headers });
  }

  reorderArchivosTemariosBase(
    materiaId: number, 
    periodoId: number, 
    ordenNuevo: { id: number; orden: number }[]
  ): Observable<{ message: string }> {
    const url = `${this.apiUrl}/admin/temarios-base/materia/${materiaId}/reordenar`;
    
    return this.http.post<{ message: string }>(url, {
      periodoId,
      ordenNuevo
    }, {
      headers: this.getHeaders()
    });
  }

  // ==================== CARGA MASIVA (NUEVO) ====================

  /**
   * Subir múltiples PDFs y crear materias automáticamente
   * POST /admin/materias-masivas/programa/:programaId
   */
  uploadMateriasMasivas(
    programaId: number,
    periodoEscolarId: number,
    files: File[]
  ): Observable<BatchUploadResult> {
    const url = `${this.apiUrl}/admin/materias-masivas/programa/${programaId}`;
    
    const formData = new FormData();
    
    // Agregar todos los archivos
    files.forEach(file => {
      formData.append('files', file);
    });
    
    // Agregar periodo
    formData.append('periodoEscolarId', periodoEscolarId.toString());

    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<BatchUploadResult>(url, formData, { headers });
  }

  /**
   * Obtener estadísticas de un programa
   * GET /admin/materias-masivas/programa/:programaId/stats
   */
  getProgramaStats(programaId: number): Observable<ProgramaStats> {
    const url = `${this.apiUrl}/admin/materias-masivas/programa/${programaId}/stats`;
    
    return this.http.get<ProgramaStats>(url, {
      headers: this.getHeaders()
    });
  }

  deleteMateria(materiaId: number): Observable<{ message: string }> {
  const url = `${this.apiUrl}/admin/materias-masivas/materia/${materiaId}`;
  return this.http.delete<{ message: string }>(url, {
    headers: this.getHeaders()
  });
}

  // ==================== HELPERS ====================

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }
}