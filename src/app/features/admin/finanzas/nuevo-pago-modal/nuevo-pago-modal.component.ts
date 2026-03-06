// UBICACIÓN: src/app/features/admin/finanzas/nuevo-pago-modal/nuevo-pago-modal.component.ts
import { Component, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { FinanzasService } from '../../../../core/services/finanzas.service';
import Swal from 'sweetalert2';

interface ConceptoPago {
  id: number;
  nombre: string;
  codigo: string;
  descripcion: string;
  monto_default?: number;
  montoDefault?: number;
  es_recurrente?: boolean;
  esRecurrente?: boolean;
  esta_activo?: boolean;
  estaActivo?: boolean;
}

interface AlumnoInscrito {
  id: number;
  matricula?: string;
  programa_id?: number;
  usuario?: {
    nombre?: string;
    apellido_paterno?: string;
    apellido_materno?: string;
    curp?: string;
    correo?: string;
  };
  programa?: { nombre?: string; codigo?: string; };
  estado_financiero?: {
    porcentaje_beca_aplicado: number;
    saldo: number;
    total_semestre: number;
  };
  beca_porcentaje?: number;
  seleccionado?: boolean;
}

interface PagoPreview {
  alumno: AlumnoInscrito;
  monto_original: number;
  monto_descuento: number;
  monto_final: number;
  beca_pct: number;
}

@Component({
  selector: 'app-nuevo-pago-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nuevo-pago-modal.component.html',
  styleUrls: ['./nuevo-pago-modal.component.css']
})
export class NuevoPagoModalComponent implements OnInit {
  @Output() cerrar        = new EventEmitter<void>();
  @Output() pagosCreados  = new EventEmitter<void>();

  private http = inject(HttpClient);
  private finanzasService = inject(FinanzasService);
  private api  = environment.apiUrl;

  // ── Paso actual del wizard ──────────────────────────
  paso: 1 | 2 | 3 = 1;

  // ── Catálogos ───────────────────────────────────────
  conceptos:  ConceptoPago[]   = [];
  alumnos:    AlumnoInscrito[] = [];
  alumnosFiltrados: AlumnoInscrito[] = [];

  // ── Selecciones ─────────────────────────────────────
  conceptoSeleccionado: ConceptoPago | null = null;
  busqueda      = '';
  filtroBeca    = 'TODOS';

  // ── Preview de pagos ────────────────────────────────
  previews: PagoPreview[] = [];

  // ── Estado ──────────────────────────────────────────
  cargandoAlumnos  = false;
  cargandoConceptos = false;
  enviando         = false;
  error            = '';

  // Fecha de vencimiento para todos los pagos
  fechaVencimiento = '';

  ngOnInit(): void {
    this.cargarConceptos();
    this.cargarAlumnos();
    // Default fecha: 30 días desde hoy
    const d = new Date();
    d.setDate(d.getDate() + 30);
    this.fechaVencimiento = d.toISOString().split('T')[0];
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token')
               || localStorage.getItem('access_token')
               || localStorage.getItem('auth_token')
               || (() => {
                    for (let i = 0; i < localStorage.length; i++) {
                      const k = localStorage.key(i)!;
                      const v = localStorage.getItem(k)!;
                      if (v?.startsWith('eyJ')) return v;
                    }
                    return null;
                  })();
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  cargarConceptos(): void {
    this.finanzasService.getConceptosPago().subscribe({
      next: (res: any) => {
        const lista = Array.isArray(res) ? res : (res.data ?? []);

        // ✅ FIX: Normalizar camelCase → snake_case que llega de TypeORM
        this.conceptos = lista.map((c: any) => ({
          ...c,
          monto_default: Number(c.monto_default ?? c.montoDefault ?? 0),
          es_recurrente: c.es_recurrente ?? c.esRecurrente ?? false,
          esta_activo: c.esta_activo ?? c.estaActivo ?? true,
        }));
      },
      error: (err: unknown) => console.error('Error cargando conceptos', err)
    });
  }

cargarAlumnos(): void {
  this.cargandoAlumnos = true;

  // ✅ Usar directamente el endpoint correcto
  this.http.get<any>(
    `${this.api}/finanzas/estudiantes`,
    { headers: this.getHeaders() }
  ).subscribe({
    next: (res: any) => {
      const lista = Array.isArray(res) ? res : (res.data ?? []);
      let alumnos = lista.map((e: any) => ({ ...e, seleccionado: false }));

      // Si el concepto es INSCRIPCIÓN, filtrar los que ya la tienen
      if (this.conceptoSeleccionado?.codigo === 'INS') {
        this.http.get<any>(
          `${this.api}/finanzas/pagos`,
          { headers: this.getHeaders() }
        ).subscribe({
          next: (pagosRes: any) => {
            const pagos = Array.isArray(pagosRes) ? pagosRes : (pagosRes.data ?? []);
            const idsConInscripcion = new Set(
              pagos
                .filter((p: any) => p.concepto?.codigo === 'INS')
                .map((p: any) => p.estudiante?.id)
            );
            this.alumnos = alumnos.filter((a: any) => !idsConInscripcion.has(a.id));
            this.alumnosFiltrados = [...this.alumnos];
            this.cargandoAlumnos = false;
          },
          error: () => {
            // Si falla la verificación, mostrar todos
            this.alumnos = alumnos;
            this.alumnosFiltrados = [...alumnos];
            this.cargandoAlumnos = false;
          }
        });
      } else {
        this.alumnos = alumnos;
        this.alumnosFiltrados = [...alumnos];
        this.cargandoAlumnos = false;
      }
    },
    error: (err) => {
      console.error('Error cargando alumnos:', err);
      this.cargandoAlumnos = false;
    }
  });
}

  seleccionarConcepto(c: ConceptoPago): void {
    this.conceptoSeleccionado = c;
  }

  irPaso2(): void {
    if (!this.conceptoSeleccionado) return;
    this.paso = 2;
    this.aplicarFiltroAlumnos();
  }

  aplicarFiltroAlumnos(): void {
    let lista = [...this.alumnos];

    // Si es inscripción, solo mostrar alumnos de nuevo ingreso
    // (semestre_actual === 1 o los que vengan de prospectos)
    if (this.conceptoSeleccionado?.codigo === 'INS') {
      lista = lista.filter(a => !a.programa_id || true); // todos por ahora
    }

    if (this.busqueda.trim()) {
      const b = this.busqueda.toLowerCase();
      lista = lista.filter(a =>
        `${a.usuario?.nombre} ${a.usuario?.apellido_paterno} ${a.usuario?.apellido_materno}`
          .toLowerCase().includes(b) ||
        a.matricula?.toLowerCase().includes(b) ||
        a.usuario?.curp?.toLowerCase().includes(b)
      );
    }

    if (this.filtroBeca !== 'TODOS') {
      const pct = Number(this.filtroBeca);
      lista = lista.filter(a => (a.beca_porcentaje ?? 0) === pct);
    }

    this.alumnosFiltrados = lista;
  }

  toggleAlumno(alumno: AlumnoInscrito): void {
    alumno.seleccionado = !alumno.seleccionado;
  }

  toggleTodos(): void {
    const todosSeleccionados = this.alumnosFiltrados.every(a => a.seleccionado);
    this.alumnosFiltrados.forEach(a => a.seleccionado = !todosSeleccionados);
  }

  get todosSeleccionados(): boolean {
    return this.alumnosFiltrados.length > 0 && this.alumnosFiltrados.every(a => a.seleccionado);
  }

  get alumnosSeleccionados(): AlumnoInscrito[] {
    return this.alumnos.filter(a => a.seleccionado);
  }

  irPaso3(): void {
    if (this.alumnosSeleccionados.length === 0) return;
    this.generarPreviews();
    this.paso = 3;
  }

  generarPreviews(): void {
    const montoBase = Number(
      this.conceptoSeleccionado?.monto_default ??
      this.conceptoSeleccionado?.montoDefault ?? 0
    );

    const esColegiatura = this.conceptoSeleccionado?.codigo === 'COLEGIATURA';

    this.previews = this.alumnosSeleccionados.map(alumno => {
      const porcBeca = esColegiatura ? Number(alumno.beca_porcentaje ?? 0) : 0;
      const descuento = montoBase * (porcBeca / 100);
      const montoFinal = montoBase - descuento;

      return {
        alumno: alumno,
        beca_pct: porcBeca,
        monto_original: montoBase,
        monto_descuento: descuento,
        monto_final: montoFinal,
      };
    });
  }

  // Donde calculas el precio mostrado en la lista de alumnos (→ $X.XX)
  getPrecioAlumno(alumno: any): number {
    const monto = Number(this.conceptoSeleccionado?.monto_default ?? 0);
    const esColegiatura = this.conceptoSeleccionado?.codigo === 'COLEGIATURA';
    const beca = esColegiatura ? Number(alumno.beca_porcentaje ?? 0) : 0;
    return monto - (monto * beca / 100);
  }

 crearPagos(): void {
  if (!this.conceptoSeleccionado || !this.fechaVencimiento) return;

  this.enviando = true;
  this.error    = '';

  const pagos = this.previews.map(p => ({
    estudiante_id:     p.alumno?.id,
    concepto_id:       this.conceptoSeleccionado!.id,
    monto_original:    p.monto_original,
    monto_descuento:   p.monto_descuento,
    monto_final:       p.monto_final,
    fecha_vencimiento: this.fechaVencimiento,
    numero_parcialidad: 1,
  }));

  console.log('📤 Payload pagos/bulk:', JSON.stringify(pagos, null, 2)); // ← debug

  this.http.post(
    `${this.api}/finanzas/pagos/bulk`,
    { pagos },
    { headers: this.getHeaders() }
  ).subscribe({
    next: () => {
      this.enviando = false;
      Swal.fire({
        icon: 'success',
        title: '¡Pagos Generados!',
        text: `Se crearon ${pagos.length} formato(s) de pago correctamente.`,
        confirmButtonColor: '#1a237e',
      }).then(() => {
        this.pagosCreados.emit();
        this.cerrar.emit();
      });
    },
    error: (err) => {
      this.enviando = false;
      console.error('❌ Error completo:', err); // ← ver detalle
      this.error = err?.error?.message ?? 'Error al crear los pagos.';
    }
  });
}
  // ── Helpers ─────────────────────────────────────────
  getNombre(a: AlumnoInscrito): string {
    if (!a.usuario) return '—';
    return `${a.usuario.nombre} ${a.usuario.apellido_paterno} ${a.usuario.apellido_materno || ''}`.trim();
  }

  formatMoney(n: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);
  }

  get totalMonto(): number {
    return this.previews.reduce((s, p) => s + p.monto_final, 0);
  }

  get totalDescuento(): number {
    return this.previews.reduce((s, p) => s + p.monto_descuento, 0);
  }

  volver(): void {
    if (this.paso === 2) this.paso = 1;
    else if (this.paso === 3) this.paso = 2;
  }
}