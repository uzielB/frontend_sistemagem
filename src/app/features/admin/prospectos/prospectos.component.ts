import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  PreinscripcionesService,
  Preinscripcion,
  PreinscripcionStats
} from '../../../core/services/preinscripciones.service';
import { InscribirModalComponent } from './inscribir-modal/inscribir-modal.component';

@Component({
  selector: 'app-prospectos',
  standalone: true,
  imports: [CommonModule, FormsModule, InscribirModalComponent],
  templateUrl: './prospectos.component.html',
  styleUrls: ['./prospectos.component.css']
})
export class ProspectosComponent implements OnInit {
  private svc = inject(PreinscripcionesService);

  // Datos
  todos: Preinscripcion[] = [];
  filtrados: Preinscripcion[] = [];
  stats: PreinscripcionStats | null = null;
  carreras: string[] = [];

  // Filtros
  tabActiva: 'PENDIENTES' | 'ATENDIDOS' = 'PENDIENTES';
  busqueda = '';
  carreraFiltro = '';

  // Paginación
  pagina = 1;
  porPagina = 20;

  // Estado UI
  cargando = false;
  prospectoSeleccionado: Preinscripcion | null = null;
  mostrarModal = false;

  ngOnInit(): void {
    this.cargarTodo();
  }

  cargarTodo(): void {
    this.cargando = true;
    this.svc.getAll().subscribe({
      next: data => {
        this.todos = data;
        this.extraerCarreras();
        this.aplicarFiltros();
        this.cargando = false;
      },
      error: () => { this.cargando = false; }
    });

    this.svc.getStats().subscribe({
      next: s => this.stats = s,
      error: () => {}
    });
  }

  private extraerCarreras(): void {
    const set = new Set(this.todos.map(p => p.carreraInteres).filter(Boolean));
    this.carreras = Array.from(set).sort();
  }

  aplicarFiltros(): void {
    const esPendiente = (p: Preinscripcion) =>
      p.estatus === 'PENDIENTE' || p.estatus === 'EN_REVISION';
    const esAtendido = (p: Preinscripcion) =>
      p.estatus === 'ACEPTADA' || p.estatus === 'RECHAZADA' || p.estatus === 'INSCRITA';

    let resultado = this.todos.filter(p =>
      this.tabActiva === 'PENDIENTES' ? esPendiente(p) : esAtendido(p)
    );

    if (this.busqueda.trim()) {
      const b = this.busqueda.toLowerCase();
      resultado = resultado.filter(p =>
        `${p.nombre} ${p.apellidoPaterno} ${p.apellidoMaterno}`.toLowerCase().includes(b) ||
        p.curp?.toLowerCase().includes(b) ||
        p.telefonoCelular?.includes(b)
      );
    }

    if (this.carreraFiltro) {
      resultado = resultado.filter(p => p.carreraInteres === this.carreraFiltro);
    }

    this.filtrados = resultado;
    this.pagina = 1;
  }

  cambiarTab(tab: 'PENDIENTES' | 'ATENDIDOS'): void {
    this.tabActiva = tab;
    this.aplicarFiltros();
  }

  get paginados(): Preinscripcion[] {
    const inicio = (this.pagina - 1) * this.porPagina;
    return this.filtrados.slice(inicio, inicio + this.porPagina);
  }

  get totalPaginas(): number {
    return Math.ceil(this.filtrados.length / this.porPagina);
  }

  get totalPendientes(): number {
    return this.todos.filter(p => p.estatus === 'PENDIENTE' || p.estatus === 'EN_REVISION').length;
  }

  get totalAtendidos(): number {
    return this.todos.filter(p => p.estatus === 'ACEPTADA' || p.estatus === 'RECHAZADA' || p.estatus === 'INSCRITA').length;
  }

  nombreCompleto(p: Preinscripcion): string {
    return `${p.nombre} ${p.apellidoPaterno} ${p.apellidoMaterno}`.trim();
  }

  formatFecha(fecha?: string): string {
    if (!fecha) return '—';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  etiquetaEstatus(estatus: string): string {
    const map: Record<string, string> = {
      PENDIENTE: 'Pendiente',
      EN_REVISION: 'En revisión',
      ACEPTADA: 'Aceptada',
      RECHAZADA: 'Rechazada',
      INSCRITA: 'Inscrita',
    };
    return map[estatus] || estatus;
  }

  claseEstatus(estatus: string): string {
    const map: Record<string, string> = {
      PENDIENTE: 'badge-pendiente',
      EN_REVISION: 'badge-revision',
      ACEPTADA: 'badge-aceptada',
      RECHAZADA: 'badge-rechazada',
      INSCRITA: 'badge-inscrita',
    };
    return map[estatus] || '';
  }

  abrirInscribir(p: Preinscripcion): void {
    this.prospectoSeleccionado = p;
    this.mostrarModal = true;
  }

  alCerrarModal(): void {
    this.mostrarModal = false;
    this.prospectoSeleccionado = null;
  }

  alInscritoExitoso(resultado: any): void {
    setTimeout(() => {
      this.alCerrarModal();
      this.cargarTodo();
    }, 2500);
  }

  limpiarFiltros(): void {
    this.busqueda = '';
    this.carreraFiltro = '';
    this.aplicarFiltros();
  }
}