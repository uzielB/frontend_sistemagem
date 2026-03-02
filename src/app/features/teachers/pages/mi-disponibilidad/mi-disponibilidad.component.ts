import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import Swal from 'sweetalert2';
import { AuthService } from '../../../../core/services/auth.service';
import { environment } from '../../../../../environments/environment';

interface ModuloHorario {
  id: number;
  sistema: string;
  numeroModulo: number;
  horaInicio: string;
  horaFin: string;
  diasSemana: string;
  descripcion: string;
}

/**
 * UBICACIÓN:
 * src/app/features/teachers/pages/mi-disponibilidad/mi-disponibilidad.component.ts
 */
@Component({
  selector: 'app-mi-disponibilidad',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './mi-disponibilidad.component.html',
  styleUrls: ['./mi-disponibilidad.component.css'],
})
export class MiDisponibilidadComponent implements OnInit {

  // ── Stepper ───────────────────────────────────────────────
  pasoActual = 1;
  totalPasos = 3;

  // ── Catálogo ──────────────────────────────────────────────
  modulosEscolarizado: ModuloHorario[] = [];
  modulosSabatino: ModuloHorario[] = [];
  periodoActual: { id: number; nombre: string; codigo: string } | null = null;

  // ── Selecciones ───────────────────────────────────────────
  sistemasSeleccionados: string[] = [];
  modulosEscSeleccionados: number[] = [];
  modulosSabSeleccionados: number[] = [];
  modulosMaximos = 2;
  disponibilidadProximoPeriodo = false;

  // ── Estado previo ─────────────────────────────────────────
  disponibilidadExistente: any = null;
  yaEnvio = false;

  // ── Carga ─────────────────────────────────────────────────
  isLoadingCatalogo = false;
  isGuardando = false;

  // ── Helper: headers con JWT desde AuthService ─────────────
  private get headers(): HttpHeaders {
    // Intenta obtener el token desde AuthService primero
    // Si no, busca en las claves comunes de localStorage
    const token = this.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    });
  }

  private getToken(): string {
    // 1. Intentar desde AuthService si tiene método getToken
    try {
      const t = (this.auth as any).getToken?.();
      if (t) return t;
    } catch {}

    // 2. Buscar en claves comunes de localStorage
    const claves = ['auth_token', 'token', 'access_token', 'jwt_token', 'authToken', 'accessToken'];
    for (const clave of claves) {
      const val = localStorage.getItem(clave);
      if (val && val.startsWith('ey')) return val; // los JWT siempre empiezan con 'ey'
    }

    // 3. Buscar cualquier valor en localStorage que parezca JWT
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      const val = localStorage.getItem(key);
      if (val && val.startsWith('eyJ')) return val;
    }

    return '';
  }

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.cargarCatalogo();
    this.cargarDisponibilidadExistente();
  }

  // ── CARGA ─────────────────────────────────────────────────

  cargarCatalogo(): void {
    this.isLoadingCatalogo = true;

    // schedule-modules es público (sin auth), no necesita headers
    this.http.get<any>(`${environment.apiUrl}/schedule-modules`).subscribe({
      next: (res) => {
        this.modulosEscolarizado = res.escolarizado || [];
        this.modulosSabatino     = res.sabatino     || [];
        this.isLoadingCatalogo   = false;
        console.log('✅ Módulos cargados:', this.modulosEscolarizado.length, 'esc /', this.modulosSabatino.length, 'sab');
      },
      error: (err) => {
        console.error('❌ Error cargando módulos:', err);
        this.isLoadingCatalogo = false;
        // Fallback: usar módulos fijos si el backend falla
        this.usarModulosFallback();
      }
    });

    this.http.get<any>(`${environment.apiUrl}/schedule-modules/periodo-actual`).subscribe({
      next: (res) => { this.periodoActual = res; },
      error: () => {}
    });
  }

  /** Fallback con módulos hardcoded si el endpoint falla */
  private usarModulosFallback(): void {
    this.modulosEscolarizado = [
      { id: 1, sistema: 'ESCOLARIZADO', numeroModulo: 1, horaInicio: '08:00', horaFin: '09:30', diasSemana: 'Lunes,Martes,Miercoles,Jueves', descripcion: 'Módulo 1 – 8:00 a 9:30' },
      { id: 2, sistema: 'ESCOLARIZADO', numeroModulo: 2, horaInicio: '10:00', horaFin: '11:30', diasSemana: 'Lunes,Martes,Miercoles,Jueves', descripcion: 'Módulo 2 – 10:00 a 11:30' },
      { id: 3, sistema: 'ESCOLARIZADO', numeroModulo: 3, horaInicio: '12:00', horaFin: '13:30', diasSemana: 'Lunes,Martes,Miercoles,Jueves', descripcion: 'Módulo 3 – 12:00 a 13:30' },
      { id: 4, sistema: 'ESCOLARIZADO', numeroModulo: 4, horaInicio: '13:30', horaFin: '15:00', diasSemana: 'Lunes,Martes,Miercoles,Jueves', descripcion: 'Módulo 4 – 13:30 a 15:00' },
    ];
    this.modulosSabatino = [
      { id: 5, sistema: 'SABATINO', numeroModulo: 1, horaInicio: '08:00', horaFin: '11:30', diasSemana: 'Sabado', descripcion: 'Módulo 1 – 8:00 a 11:30' },
      { id: 6, sistema: 'SABATINO', numeroModulo: 2, horaInicio: '11:30', horaFin: '14:30', diasSemana: 'Sabado', descripcion: 'Módulo 2 – 11:30 a 14:30' },
      { id: 7, sistema: 'SABATINO', numeroModulo: 3, horaInicio: '14:30', horaFin: '17:30', diasSemana: 'Sabado', descripcion: 'Módulo 3 – 14:30 a 17:30 (solo Trabajo Social)' },
    ];
    console.log('⚠️ Usando módulos hardcoded (fallback)');
  }

  cargarDisponibilidadExistente(): void {
    this.http.get<any>(
      `${environment.apiUrl}/teachers/mi-disponibilidad`,
      { headers: this.headers }
    ).subscribe({
      next: (disp) => {
        if (disp) {
          this.disponibilidadExistente        = disp;
          this.yaEnvio                        = true;
          this.sistemasSeleccionados          = disp.sistemasDisponibles       || [];
          this.modulosEscSeleccionados        = disp.modulosEscolarizado       || [];
          this.modulosSabSeleccionados        = disp.modulosSabatino           || [];
          this.modulosMaximos                 = disp.modulosMaximosSemana      || 2;
          this.disponibilidadProximoPeriodo   = disp.disponibilidadProximoPeriodo || false;
        }
      },
      error: () => {}
    });
  }

  // ── PASO 1: Modalidad ─────────────────────────────────────

  toggleSistema(sistema: string): void {
    const idx = this.sistemasSeleccionados.indexOf(sistema);
    if (idx === -1) this.sistemasSeleccionados.push(sistema);
    else            this.sistemasSeleccionados.splice(idx, 1);
  }

  isSistemaSelected(s: string): boolean { return this.sistemasSeleccionados.includes(s); }
  tieneEscolarizado(): boolean { return this.sistemasSeleccionados.includes('ESCOLARIZADO'); }
  tieneSabatino(): boolean     { return this.sistemasSeleccionados.includes('SABATINO'); }

  // ── PASO 2: Módulos ───────────────────────────────────────

  toggleModuloEsc(id: number): void {
    const idx = this.modulosEscSeleccionados.indexOf(id);
    if (idx === -1) this.modulosEscSeleccionados.push(id);
    else            this.modulosEscSeleccionados.splice(idx, 1);
  }

  toggleModuloSab(id: number): void {
    const idx = this.modulosSabSeleccionados.indexOf(id);
    if (idx === -1) this.modulosSabSeleccionados.push(id);
    else            this.modulosSabSeleccionados.splice(idx, 1);
  }

  isModuloEscSelected(id: number): boolean { return this.modulosEscSeleccionados.includes(id); }
  isModuloSabSelected(id: number): boolean { return this.modulosSabSeleccionados.includes(id); }

  // ── NAVEGACIÓN ────────────────────────────────────────────

  siguientePaso(): void {
    if (!this.validarPasoActual()) return;
    if (this.pasoActual < this.totalPasos) this.pasoActual++;
  }

  anteriorPaso(): void {
    if (this.pasoActual > 1) this.pasoActual--;
  }

  validarPasoActual(): boolean {
    if (this.pasoActual === 1 && !this.sistemasSeleccionados.length) {
      Swal.fire({ icon: 'warning', title: 'Selecciona al menos una modalidad', confirmButtonColor: '#d32f2f' });
      return false;
    }
    if (this.pasoActual === 2) {
      if (this.tieneEscolarizado() && !this.modulosEscSeleccionados.length) {
        Swal.fire({ icon: 'warning', title: 'Selecciona al menos un módulo escolarizado', confirmButtonColor: '#d32f2f' });
        return false;
      }
      if (this.tieneSabatino() && !this.modulosSabSeleccionados.length) {
        Swal.fire({ icon: 'warning', title: 'Selecciona al menos un módulo sabatino', confirmButtonColor: '#d32f2f' });
        return false;
      }
    }
    return true;
  }

  // ── ENVIAR ────────────────────────────────────────────────

  enviarDisponibilidad(): void {
    const payload = {
      periodoEscolarId:             this.periodoActual?.id || null,
      sistemasDisponibles:          this.sistemasSeleccionados,
      modulosEscolarizado:          this.tieneEscolarizado() ? this.modulosEscSeleccionados : [],
      modulosSabatino:              this.tieneSabatino()     ? this.modulosSabSeleccionados : [],
      modulosMaximosSemana:         this.modulosMaximos,
      disponibilidadProximoPeriodo: this.disponibilidadProximoPeriodo,
    };

    this.isGuardando = true;
    this.http.post<any>(
      `${environment.apiUrl}/teachers/mi-disponibilidad`,
      payload,
      { headers: this.headers }
    ).subscribe({
      next: () => {
        this.isGuardando = false;
        Swal.fire({
          icon: 'success',
          title: '¡Disponibilidad registrada!',
          html: `<p>Tu disponibilidad ha sido enviada al administrador.</p>
                 <p style="color:#888;font-size:0.9rem;">Te notificaremos cuando te asignen tu carga académica.</p>`,
          confirmButtonColor: '#d32f2f',
          confirmButtonText: 'Entendido',
        }).then(() => {
          this.yaEnvio = true;
          this.cargarDisponibilidadExistente();
          this.pasoActual = 1;
        });
      },
      error: (err) => {
        this.isGuardando = false;
        console.error('Error guardando disponibilidad:', err);
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo guardar. Intenta de nuevo.', confirmButtonColor: '#d32f2f' });
      }
    });
  }

  // ── HELPERS ───────────────────────────────────────────────

  editarDisponibilidad(): void { this.yaEnvio = false; this.pasoActual = 1; }

  getEstatusLabel(estatus: string): string {
    const map: any = {
      PENDIENTE: '⏳ Pendiente de revisión',
      REVISADA:  '✅ Revisada por el administrador',
      ASIGNADA:  '🎓 Ya tienes asignación de clases',
    };
    return map[estatus] || estatus;
  }

  volver(): void { this.router.navigate(['/teachers/dashboard']); }

  get progresoWidth(): string {
    return `${((this.pasoActual - 1) / (this.totalPasos - 1)) * 100}%`;
  }
}