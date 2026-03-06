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

  todos: Preinscripcion[]       = [];
  filtrados: Preinscripcion[]   = [];
  stats: PreinscripcionStats | null = null;
  carreras: string[]            = [];

  // Tabs: PENDIENTES | INSCRITOS
  tabActiva: 'PENDIENTES' | 'INSCRITOS' = 'PENDIENTES';
  busqueda     = '';
  carreraFiltro = '';

  pagina    = 1;
  porPagina = 20;

  cargando              = false;
  prospectoSeleccionado: Preinscripcion | null = null;
  mostrarModal          = false;

  // Vista de inscritos desde card stat
  verInscritos = false;

  ngOnInit(): void { this.cargarTodo(); }

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
    const esInscrito = (p: Preinscripcion) =>
      p.estatus === 'INSCRITA' || p.estatus === 'INSCRITO' as any;

    let resultado = this.todos.filter(p =>
      this.tabActiva === 'PENDIENTES' ? esPendiente(p) : esInscrito(p)
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
    this.pagina    = 1;
  }

  cambiarTab(tab: 'PENDIENTES' | 'INSCRITOS'): void {
    this.tabActiva   = tab;
    this.verInscritos = false;
    this.aplicarFiltros();
  }

  // Click en card de Inscritos → ir directo a tab inscritos
  irAInscritos(): void {
    this.tabActiva    = 'INSCRITOS';
    this.verInscritos = true;
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
    return this.todos.filter(p =>
      p.estatus === 'PENDIENTE' || p.estatus === 'EN_REVISION'
    ).length;
  }

  get totalInscritos(): number {
    return this.todos.filter(p =>
      p.estatus === 'INSCRITA' || p.estatus === 'INSCRITO' as any
    ).length;
  }

  get totalRechazados(): number {
    return this.todos.filter(p => p.estatus === 'RECHAZADA').length;
  }

  nombreCompleto(p: Preinscripcion): string {
    return `${p.nombre} ${p.apellidoPaterno} ${p.apellidoMaterno || ''}`.trim();
  }

  formatFecha(fecha?: string): string {
    if (!fecha) return '—';
    return new Date(fecha).toLocaleDateString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  etiquetaEstatus(estatus: string): string {
    const map: Record<string, string> = {
      PENDIENTE:   'Pendiente',
      EN_REVISION: 'En revisión',
      ACEPTADA:    'Aceptada',
      RECHAZADA:   'Rechazada',
      INSCRITA:    'Inscrito',
      INSCRITO:    'Inscrito',
    };
    return map[estatus] || estatus;
  }

  claseEstatus(estatus: string): string {
    const map: Record<string, string> = {
      PENDIENTE:   'badge-pendiente',
      EN_REVISION: 'badge-revision',
      ACEPTADA:    'badge-aceptada',
      RECHAZADA:   'badge-rechazada',
      INSCRITA:    'badge-inscrita',
      INSCRITO:    'badge-inscrita',
    };
    return map[estatus] || '';
  }

  abrirInscribir(p: Preinscripcion): void {
    this.prospectoSeleccionado = p;
    this.mostrarModal = true;
  }

  alCerrarModal(): void {
    this.mostrarModal          = false;
    this.prospectoSeleccionado = null;
  }

  alInscritoExitoso(resultado: any): void {
    this.cargarTodo(); 
  }

  limpiarFiltros(): void {
    this.busqueda      = '';
    this.carreraFiltro = '';
    this.aplicarFiltros();
  }
}