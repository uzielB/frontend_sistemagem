import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// ── Interfaces ──────────────────────────────────────────────
export interface Preinscripcion {
  id: number;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  curp: string;
  fechaNacimiento: string;
  estadoNacimiento: string;
  estado: string;
  domicilio: string;
  telefonoCelular: string;
  correoElectronico?: string;
  nombreTutor: string;
  telefonoTutor: string;
  escuelaProcedencia: string;
  direccionEscuelaProcedencia: string;
  estadoEscuela: string;
  promedio: number;
  carreraInteres: string;
  modalidad: string;
  trabajaActualmente?: boolean;
  nombreEmpresa?: string;
  estatus: 'PENDIENTE' | 'EN_REVISION' | 'ACEPTADA' | 'RECHAZADA' | 'INSCRITA';
  revisadoPor?: number;
  createdAt?: string;
}

export interface PreinscripcionStats {
  pendientes: number;
  enRevision: number;
  aceptadas: number;
  rechazadas: number;
  inscritas: number;
  total: number;
}

export interface InscribirPayload {
  programaId: number;
  periodoEscolarId: number;
  semestre?: number;
  numeroPagos: number;
  becaPromocionPorcentaje?: number;
  becaCondicionPorcentaje?: number;
  becaCondicionTipo?: string;
}

export interface Programa {
  id: number;
  nombre: string;
  codigo: string;
  modalidad: string;
  duracionSemestres: number;
  estaActivo: boolean;
}

export interface PeriodoEscolar {
  id: number;
  nombre: string;
  codigo: string;
  fechaInicio: string;
  fechaFin: string;
  esActual: boolean;
  estaActivo: boolean;
}

@Injectable({ providedIn: 'root' })
export class PreinscripcionesService {

  private apiUrl     = `${environment.apiUrl}/preinscripciones`;
  private adminUrl   = `${environment.apiUrl}/admin/preinscripciones`;
  private catalogUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ── PÚBLICO: formulario de preinscripción ────────────────
  crearPreinscripcion(datos: any): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<any>(this.apiUrl, datos, { headers });
  }

  // ── ADMIN: listado y estadísticas ────────────────────────
  getAll(estatus?: string): Observable<Preinscripcion[]> {
    let params = new HttpParams();
    if (estatus) params = params.set('estatus', estatus);
    return this.http.get<Preinscripcion[]>(this.adminUrl, { params });
  }

  getStats(): Observable<PreinscripcionStats> {
    return this.http.get<PreinscripcionStats>(`${this.adminUrl}/stats`);
  }

  getOne(id: number): Observable<Preinscripcion> {
    return this.http.get<Preinscripcion>(`${this.adminUrl}/${id}`);
  }

  cambiarEstatus(id: number, estatus: string, observaciones?: string): Observable<any> {
    return this.http.patch(`${this.adminUrl}/${id}/estatus`, { estatus, observaciones });
  }

  inscribir(id: number, payload: InscribirPayload): Observable<any> {
    return this.http.post(`${this.adminUrl}/${id}/inscribir`, payload);
  }

  // ── CATÁLOGOS ─────────────────────────────────────────────
  getProgramas(): Observable<Programa[]> {
    return this.http.get<Programa[]>(`${this.catalogUrl}/programs`);
  }

  getPeriodos(): Observable<PeriodoEscolar[]> {
    return this.http.get<PeriodoEscolar[]>(`${this.catalogUrl}/school-periods`);
  }
}