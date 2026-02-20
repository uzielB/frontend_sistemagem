import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface InscripcionEstudiante {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
  curp: string;
  fechaNacimiento: string;
  correo?: string;
  telefonoCelular?: string;
  programaId: number;
  modalidad: 'ESCOLARIZADO' | 'SABATINO';
  semestreActual: number;
  periodoEscolarId: number;
  grupoId?: number;
  escuelaProcedencia?: string;
  promedioBachillerato?: number;
  nombreTutor?: string;
  telefonoTutor?: string;
  configuracionFinanciera: {
    totalSemestre: number;
    porcentajeBeca: number;
    numeroPagos: number;
    fechasVencimiento: string[];
    periodoEscolarId: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class EstudiantesService {
  
  // ✅ CAMBIAR LA RUTA:
  private apiUrl = `${environment.apiUrl}/admin/estudiantes`;  // ← ACTUALIZAR

  constructor(private http: HttpClient) {}

  inscribirEstudiante(datos: InscripcionEstudiante): Observable<any> {
    console.log('📤 EstudiantesService.inscribirEstudiante()');
    console.log('Datos completos:', datos);

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<any>(
      `${this.apiUrl}/inscribir`,  // ← ENDPOINT: /api/admin/estudiantes/inscribir
      datos,
      { headers }
    ).pipe(
      map(response => {
        console.log('✅ Estudiante inscrito:', response);
        return response;
      }),
      catchError(error => {
        console.error('❌ Error al inscribir estudiante:', error);
        throw error;
      })
    );
  }

  obtenerEstudiantes(): Observable<any[]> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any>(
      this.apiUrl,
      { headers }
    ).pipe(
      map(response => response.data || [])
    );
  }

  obtenerEstudiante(id: number): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<any>(
      `${this.apiUrl}/${id}`,
      { headers }
    ).pipe(
      map(response => response.data)
    );
  }
}