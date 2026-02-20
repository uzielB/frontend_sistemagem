import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PreinscripcionesService {
  
  private apiUrl = `${environment.apiUrl}/preinscripciones`;

  constructor(private http: HttpClient) {}

  // ✅ CLAVE: Debe retornar Observable<any> y hacer return
  crearPreinscripcion(datos: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<any>(this.apiUrl, datos, { headers });
  }
}