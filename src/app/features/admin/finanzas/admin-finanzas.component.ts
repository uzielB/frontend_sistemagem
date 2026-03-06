import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { environment } from '../../../../environments/environment';
import { NuevoPagoModalComponent } from './nuevo-pago-modal/nuevo-pago-modal.component';
import Swal from 'sweetalert2';

interface Estudiante {
  id: number;
  matricula?: string;
  semestre_actual?: number;
  modalidad?: string;
  estatus?: string;
  usuario?: { nombre?: string; apellido_paterno?: string; apellido_materno?: string; curp?: string; correo?: string; };
  programa?: { nombre?: string; codigo?: string; };
}

interface Pago {
  id: number;
  numero_parcialidad?: number;
  monto_original: number;
  monto_descuento: number;
  monto_final: number;
  fecha_vencimiento: string;
  fecha_pago: string | null;
  estatus: 'PENDIENTE' | 'PAGADO' | 'VENCIDO' | 'CANCELADO';
  concepto?: { nombre?: string; codigo?: string; };
  estudiante?: Estudiante;
  beca_porcentaje?: number;
  metodo_pago?: string;
}

// ── Agrupación por alumno ──────────────────────────────
interface AlumnoPagos {
  estudiante?: Estudiante;
  pagos: Pago[];
  totalPagos: number;
  pagados: number;
  pendientes: number;
  vencidos: number;
  totalOriginal: number;
  totalDescuento: number;
  totalFinal: number;
  totalPagado: number;
  saldo: number;
  becaPorcentaje: number;
  expandido: boolean;
}

interface EstadoFinanciero {
  id: number;
  total_semestre: number;
  porcentaje_beca_aplicado: number;
  numero_pagos: number;
  monto_por_pago: number;
  total_descuento: number;
  total_pagado: number;
  saldo: number;
  estudiante?: Estudiante;
  periodo_escolar?: { nombre?: string; codigo?: string; };
}

@Component({
  selector: 'app-admin-finanzas',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatTooltipModule, NuevoPagoModalComponent],
  templateUrl: './admin-finanzas.component.html',
  styleUrls: ['./admin-finanzas.component.css']
})
export class AdminFinanzasComponent implements OnInit {

  vistaActiva: 'pagos' | 'estados' = 'pagos';
  mostrarNuevoPago = false;

  pagos: Pago[] = [];
  estadosFinancieros: EstadoFinanciero[] = [];

  // Lista agrupada por alumno
  alumnosPagos: AlumnoPagos[] = [];
  alumnosFiltrados: AlumnoPagos[] = [];

  filtroEstatus = 'TODOS';
  filtroBusqueda = '';

  cargando = false;
  error = '';

  stats = { total: 0, pendientes: 0, pagados: 0, vencidos: 0, recaudado: 0, porRecaudar: 0 };

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarPagos();
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

  cargarPagos(): void {
    this.cargando = true;
    this.http.get<any>(`${this.apiUrl}/finanzas/pagos`, { headers: this.getHeaders() }).subscribe({
      next: (res) => {
        const lista: Pago[] = Array.isArray(res) ? res : (res.data ?? res.pagos ?? []);
        this.pagos = lista;
        this.agruparPorAlumno();
        this.aplicarFiltros();
        this.calcularStats();
        this.cargando = false;
      },
      error: () => { this.cargando = false; this.error = 'Error al cargar pagos'; }
    });
  }

  // ── Agrupa los pagos por estudiante_id ─────────────────
  agruparPorAlumno(): void {
    const mapa = new Map<number, AlumnoPagos>();

    for (const pago of this.pagos) {
      const id = pago.estudiante?.id;
      if (id == null) continue;

      if (!mapa.has(id)) {
        mapa.set(id, {
          estudiante: pago.estudiante!,
          pagos: [],
          totalPagos: 0, pagados: 0, pendientes: 0, vencidos: 0,
          totalOriginal: 0, totalDescuento: 0, totalFinal: 0,
          totalPagado: 0, saldo: 0,
          becaPorcentaje: pago.beca_porcentaje ?? 0,
          expandido: false,
        });
      }

      const grupo = mapa.get(id)!;
      grupo.pagos.push(pago);
    }

    // Calcular stats por alumno
    mapa.forEach(grupo => {
      grupo.pagos.sort((a, b) => (a.numero_parcialidad ?? 0) - (b.numero_parcialidad ?? 0));
      grupo.totalPagos   = grupo.pagos.length;
      grupo.pagados      = grupo.pagos.filter(p => p.estatus === 'PAGADO').length;
      grupo.pendientes   = grupo.pagos.filter(p => p.estatus === 'PENDIENTE').length;
      grupo.vencidos     = grupo.pagos.filter(p => p.estatus === 'VENCIDO').length;
      grupo.totalOriginal  = grupo.pagos.reduce((s, p) => s + Number(p.monto_original), 0);
      grupo.totalDescuento = grupo.pagos.reduce((s, p) => s + Number(p.monto_descuento), 0);
      grupo.totalFinal     = grupo.pagos.reduce((s, p) => s + Number(p.monto_final), 0);
      grupo.totalPagado    = grupo.pagos.filter(p => p.estatus === 'PAGADO').reduce((s, p) => s + Number(p.monto_final), 0);
      grupo.saldo          = grupo.totalFinal - grupo.totalPagado;
      // Tomar beca del primer pago con descuento
      const conBeca = grupo.pagos.find(p => p.beca_porcentaje && p.beca_porcentaje > 0);
      if (conBeca) grupo.becaPorcentaje = conBeca.beca_porcentaje ?? 0;
    });

    this.alumnosPagos = Array.from(mapa.values());
  }

  aplicarFiltros(): void {
    let lista = [...this.alumnosPagos];

    // Filtro por estatus: muestra alumno si tiene al menos un pago en ese estatus
    if (this.filtroEstatus !== 'TODOS') {
      lista = lista.filter(a => a.pagos.some(p => p.estatus === this.filtroEstatus));
    }

    if (this.filtroBusqueda.trim()) {
      const q = this.filtroBusqueda.toLowerCase();
      lista = lista.filter(a =>
        a.estudiante?.matricula?.toLowerCase().includes(q) ||
        a.estudiante?.usuario?.nombre?.toLowerCase().includes(q) ||
        a.estudiante?.usuario?.apellido_paterno?.toLowerCase().includes(q) ||
        a.estudiante?.programa?.nombre?.toLowerCase().includes(q)
      );
    }

    this.alumnosFiltrados = lista;
  }

  calcularStats(): void {
    this.stats.total       = this.pagos.length;
    this.stats.pendientes  = this.pagos.filter(p => p.estatus === 'PENDIENTE').length;
    this.stats.pagados     = this.pagos.filter(p => p.estatus === 'PAGADO').length;
    this.stats.vencidos    = this.pagos.filter(p => p.estatus === 'VENCIDO').length;
    this.stats.recaudado   = this.pagos.filter(p => p.estatus === 'PAGADO').reduce((s, p) => s + Number(p.monto_final), 0);
    this.stats.porRecaudar = this.pagos.filter(p => p.estatus === 'PENDIENTE').reduce((s, p) => s + Number(p.monto_final), 0);
  }

  toggleExpandir(alumno: AlumnoPagos): void {
    alumno.expandido = !alumno.expandido;
  }

  // ── Cambiar estatus de un pago individual ──────────────
  cambiarEstatus(pago: Pago, nuevoEstatus: string, alumno: AlumnoPagos, event: Event): void {
    event.stopPropagation(); // evita que cierre/abra la fila

    Swal.fire({
      title: `Marcar como ${nuevoEstatus}`,
      text: `¿Confirmas cambiar la parcialidad #${pago.numero_parcialidad}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#1a237e',
      cancelButtonColor: '#999',
      confirmButtonText: 'Confirmar',
      cancelButtonText: 'Cancelar',
    }).then(res => {
      if (!res.isConfirmed) return;

      this.http.post(
        `${this.apiUrl}/finanzas/pagos/${pago.id}/registrar`,
        { metodoPago: nuevoEstatus === 'PAGADO' ? 'MANUAL' : nuevoEstatus },
        { headers: this.getHeaders() }
      ).subscribe({
        next: () => {
          pago.estatus = nuevoEstatus as any;
          if (nuevoEstatus === 'PAGADO') pago.fecha_pago = new Date().toISOString();
          // Recalcular stats del alumno
          alumno.pagados    = alumno.pagos.filter(p => p.estatus === 'PAGADO').length;
          alumno.pendientes = alumno.pagos.filter(p => p.estatus === 'PENDIENTE').length;
          alumno.vencidos   = alumno.pagos.filter(p => p.estatus === 'VENCIDO').length;
          alumno.totalPagado = alumno.pagos.filter(p => p.estatus === 'PAGADO').reduce((s, p) => s + Number(p.monto_final), 0);
          alumno.saldo = alumno.totalFinal - alumno.totalPagado;
          this.calcularStats();
          Swal.fire({ icon: 'success', title: 'Actualizado', timer: 1500, showConfirmButton: false });
        },
        error: (err) => {
          Swal.fire({ icon: 'error', title: 'Error', text: err?.error?.message || 'No se pudo actualizar' });
        }
      });
    });
  }


  generarRecargo(pago: Pago, alumno: AlumnoPagos, event: Event): void {
  event.stopPropagation();

  const becaPct     = alumno.becaPorcentaje;
  const montoRecargo = Number((pago.monto_final * becaPct / 100).toFixed(2));

  Swal.fire({
    title: '⚠️ Generar recargo por vencimiento',
    html: `
      <p>El pago de <strong>${pago.concepto?.nombre}</strong> venció el 
         <strong>${new Date(pago.fecha_vencimiento).toLocaleDateString('es-MX')}</strong></p>
      <br>
      <table style="width:100%;text-align:left;font-size:0.9rem">
        <tr><td>Monto original del pago:</td><td><b>$${pago.monto_final.toFixed(2)}</b></td></tr>
        <tr><td>Recargo (${becaPct}% beca aplicada):</td>
            <td style="color:#dc2626"><b>+$${montoRecargo.toFixed(2)}</b></td></tr>
        <tr style="border-top:1px solid #eee">
          <td><b>Total recargo a cobrar:</b></td>
          <td><b>$${montoRecargo.toFixed(2)}</b></td>
        </tr>
      </table>
    `,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#dc2626',
    confirmButtonText: 'Generar recargo',
    cancelButtonText: 'Cancelar',
  }).then(res => {
    if (!res.isConfirmed) return;

    const payload = {
      pagos: [{
        estudiante_id:     alumno.estudiante?.id,
        concepto_id:       pago.concepto ? null : null, // recargo sin concepto específico
        monto_original:    montoRecargo,
        monto_descuento:   0,
        monto_final:       montoRecargo,
        fecha_vencimiento: new Date().toISOString().split('T')[0], // vence hoy
        numero_parcialidad: 1,
      }]
    };

    this.http.post(
      `${this.apiUrl}/finanzas/pagos/bulk`,
      payload,
      { headers: this.getHeaders() }
    ).subscribe({
      next: () => {
        Swal.fire({ icon: 'success', title: 'Recargo generado', timer: 1800, showConfirmButton: false });
        this.cargarPagos(); // recargar para ver el nuevo pago
      },
      error: (err) => {
        Swal.fire({ icon: 'error', title: 'Error', text: err?.error?.message || 'No se pudo generar el recargo' });
      }
    });
  });
}



  cargarEstadosFinancieros(): void {
    this.estadosFinancieros = [];
  }

  // ── Helpers ────────────────────────────────────────────
  getNombre(est: any): string {
    if (!est?.usuario) return '—';
    return `${est.usuario.nombre ?? ''} ${est.usuario.apellido_paterno ?? ''} ${est.usuario.apellido_materno ?? ''}`.trim();
  }

  formatMoney(n: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);
  }

  getEstatusConfig(estatus: string): { color: string; bg: string; icon: string } {
    const map: any = {
      PENDIENTE: { color: '#92400e', bg: '#fef3c7', icon: '⏳' },
      PAGADO:    { color: '#065f46', bg: '#d1fae5', icon: '✅' },
      VENCIDO:   { color: '#991b1b', bg: '#fee2e2', icon: '⚠️' },
      CANCELADO: { color: '#374151', bg: '#e5e7eb', icon: '🚫' },
    };
    return map[estatus] ?? { color: '#555', bg: '#eee', icon: '•' };
  }

  esVencido(fecha: string): boolean {
    return new Date(fecha) < new Date();
  }

  getProgresoAlumno(alumno: AlumnoPagos): number {
    if (alumno.totalFinal === 0) return 0;
    return Math.round((alumno.totalPagado / alumno.totalFinal) * 100);
  }

  onBusqueda(): void { this.aplicarFiltros(); }
  onFiltroEstatus(): void { this.aplicarFiltros(); }
  cambiarVista(v: 'pagos' | 'estados'): void { this.vistaActiva = v; }
}