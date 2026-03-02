import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
// ✅ CORRECCIÓN 1: Importar AuthService para obtener el token JWT
import { AuthService } from './auth.service';

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
  archivoPdf: string; 
  uploadedBy?: {
    id: number;
    nombre: string;
    apellidoPaterno: string;
  };
  subject?: {
    id: number;
    nombre: string;
    codigo: string;
    semestre: number;
    programa?: {
      id: number;
      nombre: string;
      codigo: string;
    };
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
  asignacionId?: number;
  titulo?: string;
  descripcion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SyllabusesService {
  private apiUrl = `${environment.apiUrl}/teachers/syllabuses`;

  constructor(
    private http: HttpClient,
    // ✅ CORRECCIÓN 2: Inyectar AuthService para poder leer el token
    private authService: AuthService
  ) {}

  // ✅ CORRECCIÓN 3: Método getHeaders() igual que en teachers.service.ts
  // Sin esto, todas las peticiones llegaban sin Authorization header → 401 Unauthorized
  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // ============================================
  // SYLLABUSES (TEMARIOS)
  // ============================================

  getMySyllabuses(): Observable<Syllabus[]> {
    // ✅ CORRECCIÓN 4: Agregar headers con token en todas las peticiones
    return this.http.get<Syllabus[]>(`${this.apiUrl}`, {
      headers: this.getHeaders()
    });
  }

  getSyllabus(id: number): Observable<Syllabus> {
    return this.http.get<Syllabus>(`${this.apiUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }

    viewSyllabus(rutaArchivo: string): void {
  const cleanPath = rutaArchivo.replace(/\\/g, '/');
  const url = `http://localhost:3000/${cleanPath}`;
  window.open(url, '_blank');
}
  
  // ============================================
  // LESSON PLANS (PLANEACIONES)
  // ============================================

  getMyLessonPlans(): Observable<LessonPlan[]> {
    return this.http.get<LessonPlan[]>(`${this.apiUrl}/lesson-plans`, {
      headers: this.getHeaders()
    });
  }

  getLessonPlan(id: number): Observable<LessonPlan> {
    return this.http.get<LessonPlan>(`${this.apiUrl}/lesson-plans/${id}`, {
      headers: this.getHeaders()
    });
  }

  uploadLessonPlan(file: File, data: CreateLessonPlanDto): Observable<LessonPlan> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('temarioId', data.temarioId.toString());
    if (data.asignacionId) formData.append('asignacionId', data.asignacionId.toString());
    if (data.titulo) formData.append('titulo', data.titulo);
    if (data.descripcion) formData.append('descripcion', data.descripcion);

    const token = this.authService.getToken();
    return this.http.post<LessonPlan>(`${this.apiUrl}/lesson-plans`, formData, {
      // ✅ Para FormData NO incluir Content-Type, el browser lo pone automáticamente con boundary
      headers: new HttpHeaders({ 'Authorization': `Bearer ${token}` })
    });
  }

  downloadLessonPlan(id: number): Observable<Blob> {
    const token = this.authService.getToken();
    return this.http.get(`${this.apiUrl}/lesson-plans/${id}/download`, {
      responseType: 'blob',
      headers: new HttpHeaders({ 'Authorization': `Bearer ${token}` })
    });
  }

  // ============================================
  // HELPERS
  // ============================================

  downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

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