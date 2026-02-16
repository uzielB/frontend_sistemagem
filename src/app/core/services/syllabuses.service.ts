import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';


export interface Syllabus {
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
  fechaSubida: string;
  estaActivo: boolean;
  uploadedBy?: {
    id: number;
    nombre: string;
    apellidoPaterno: string;
  };
}

export interface LessonPlan {
  id: number;
  temarioId: number;
  docenteId: number;
  asignacionId: number;
  nombreArchivo: string;
  nombreOriginal: string;
  rutaArchivo: string;
  tamanoMb: number;
  titulo: string;
  descripcion: string;
  fechaSubida: string;
  estatus: 'PENDIENTE_REVISION' | 'EN_REVISION' | 'APROBADA' | 'RECHAZADA' | 'CON_OBSERVACIONES';
  version: number;
  revisadoPor?: number;
  fechaRevision?: string;
  observaciones?: string;
  syllabus?: Syllabus;
  reviewer?: {
    id: number;
    nombre: string;
    apellidoPaterno: string;
  };
}

export interface CreateLessonPlanDto {
  temarioId: number;
  asignacionId: number;
  titulo?: string;
  descripcion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SyllabusesService {
  private apiUrl = `${environment.apiUrl}/teachers/syllabuses`;

  constructor(private http: HttpClient) {}

  // ============================================
  // SYLLABUSES (TEMARIOS)
  // ============================================

  /**
   * Obtener temarios de las materias asignadas al docente
   */
  getMySyllabuses(): Observable<Syllabus[]> {
    return this.http.get<Syllabus[]>(`${this.apiUrl}/syllabuses`);
  }

  /**
   * Obtener un temario por ID
   */
  getSyllabus(id: number): Observable<Syllabus> {
    return this.http.get<Syllabus>(`${this.apiUrl}/syllabuses/${id}`);
  }

  /**
   * Descargar temario (devuelve blob para descarga)
   */
  downloadSyllabus(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/syllabuses/${id}/download`, {
      responseType: 'blob'
    });
  }

  // ============================================
  // LESSON PLANS (PLANEACIONES)
  // ============================================

  /**
   * Obtener mis planeaciones
   */
  getMyLessonPlans(): Observable<LessonPlan[]> {
    return this.http.get<LessonPlan[]>(`${this.apiUrl}/lesson-plans`);
  }

  /**
   * Obtener una planeación por ID
   */
  getLessonPlan(id: number): Observable<LessonPlan> {
    return this.http.get<LessonPlan>(`${this.apiUrl}/lesson-plans/${id}`);
  }

  /**
   * Subir planeación (con archivo PDF)
   */
  uploadLessonPlan(file: File, data: CreateLessonPlanDto): Observable<LessonPlan> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('temarioId', data.temarioId.toString());
    formData.append('asignacionId', data.asignacionId.toString());
    
    if (data.titulo) {
      formData.append('titulo', data.titulo);
    }
    
    if (data.descripcion) {
      formData.append('descripcion', data.descripcion);
    }

    return this.http.post<LessonPlan>(`${this.apiUrl}/lesson-plans`, formData);
  }

  /**
   * Descargar planeación (devuelve blob para descarga)
   */
  downloadLessonPlan(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/lesson-plans/${id}/download`, {
      responseType: 'blob'
    });
  }

  // ============================================
  // HELPERS
  // ============================================

  /**
   * Helper para descargar archivo desde blob
   */
  downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Obtener clase CSS según el estatus de la planeación
   */
  getStatusClass(estatus: string): string {
    const statusMap: { [key: string]: string } = {
      'PENDIENTE_REVISION': 'status-pending',
      'EN_REVISION': 'status-reviewing',
      'APROBADA': 'status-approved',
      'RECHAZADA': 'status-rejected',
      'CON_OBSERVACIONES': 'status-observations'
    };
    return statusMap[estatus] || 'status-pending';
  }

  /**
   * Obtener texto legible del estatus
   */
  getStatusText(estatus: string): string {
    const statusMap: { [key: string]: string } = {
      'PENDIENTE_REVISION': 'Pendiente de Revisión',
      'EN_REVISION': 'En Revisión',
      'APROBADA': 'Aprobada',
      'RECHAZADA': 'Rechazada',
      'CON_OBSERVACIONES': 'Con Observaciones'
    };
    return statusMap[estatus] || estatus;
  }
}