import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import Swal from 'sweetalert2';
import { 
  AdminDocentesService, 
  Materia, 
  ArchivoTemarioBase,
  LessonPlanAdmin
} from '../admin-docentes.service';

type FiltroPlan = 'TODAS' | 'CON_PLANEACION' | 'SIN_PLANEACION';
type FiltroEstatus = 'TODOS' | 'APROBADA' | 'RECHAZADA' | 'PENDIENTE_REVISION' | 'CON_OBSERVACIONES' | 'EN_REVISION';

@Component({
  selector: 'app-materias-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatBadgeModule
  ],
  templateUrl: './materias-list.component.html',
  styleUrls: ['./materias-list.component.css']
})
export class MateriasListComponent implements OnInit {

  programaId: number = 0;
  programaNombre: string = '';
  programaCodigo: string = '';

  materias: Materia[] = [];
  materiasConArchivos: (Materia & { archivoTemario?: ArchivoTemarioBase })[] = [];
  todasLasPlaneaciones: LessonPlanAdmin[] = [];

  // Filtros
  filtroPlaneacion: FiltroPlan = 'TODAS';
  filtroEstatus: FiltroEstatus = 'TODOS';

  isLoading = false;
  errorMessage = '';

  displayedColumns: string[] = ['semestre', 'codigo', 'nombre', 'temario', 'planeacion', 'acciones'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private adminDocentesService: AdminDocentesService
  ) {}

  ngOnInit(): void {
    this.programaId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadProgramaDetail();
    this.loadTodasLasPlaneaciones();
  }

  // ============================================
  // CARGA DE DATOS
  // ============================================

  loadProgramaDetail(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.adminDocentesService.getProgramaDetail(this.programaId).subscribe({
      next: (data) => {
        this.programaNombre = data.nombre;
        this.programaCodigo = data.codigo;
        this.materias = data.materias;
        this.loadArchivosTemario();
      },
      error: () => {
        this.errorMessage = 'Error al cargar las materias';
        this.isLoading = false;
      }
    });
  }

  loadArchivosTemario(): void {
    const periodoEscolarId = 5;
    const requests = this.materias.map(materia =>
      this.adminDocentesService.getArchivosTemariosBase(materia.id, periodoEscolarId)
        .toPromise().then(archivos => archivos || []).catch(() => [])
    );
    Promise.all(requests).then(results => {
      this.materiasConArchivos = this.materias.map((materia, index) => {
        const archivos = results[index] || [];
        return { ...materia, archivoTemario: archivos.length > 0 ? archivos[0] : undefined };
      });
      this.isLoading = false;
    }).catch(() => {
      this.materiasConArchivos = this.materias.map(m => ({ ...m }));
      this.isLoading = false;
    });
  }

  loadTodasLasPlaneaciones(): void {
    this.adminDocentesService.getAllLessonPlans().subscribe({
      next: (planeaciones) => { this.todasLasPlaneaciones = planeaciones; },
      error: () => {}
    });
  }

  // ============================================
  // FILTROS
  // ============================================

  /** Planeaciones de una materia (la más reciente por docente) */
  getPlaneacionesDeMateria(materiaId: number): LessonPlanAdmin[] {
    const todas = this.todasLasPlaneaciones.filter(p => p.syllabus?.materiaId === materiaId);
    // Agrupar por docente → tomar solo la más reciente
    const grupos = new Map<number, LessonPlanAdmin>();
    for (const p of todas) {
      const existing = grupos.get(p.docenteId);
      if (!existing || p.version > existing.version) grupos.set(p.docenteId, p);
    }
    return Array.from(grupos.values());
  }

  /** Resumen de estatus de una materia para mostrar en la tabla */
  getResumenEstatus(materiaId: number): { aprobadas: number; pendientes: number; rechazadas: number; conObs: number; total: number } {
    const plans = this.getPlaneacionesDeMateria(materiaId);
    return {
      total:     plans.length,
      aprobadas: plans.filter(p => p.estatus === 'APROBADA').length,
      pendientes: plans.filter(p => p.estatus === 'PENDIENTE_REVISION' || p.estatus === 'EN_REVISION').length,
      rechazadas: plans.filter(p => p.estatus === 'RECHAZADA').length,
      conObs:    plans.filter(p => p.estatus === 'CON_OBSERVACIONES').length,
    };
  }

  /** Lista filtrada según los filtros activos */
  get materiasFiltradasPorFiltro(): (Materia & { archivoTemario?: ArchivoTemarioBase })[] {
    return this.materiasConArchivos.filter(materia => {
      const plans = this.getPlaneacionesDeMateria(materia.id);
      const tienePlaneacion = plans.length > 0;

      // Filtro 1: con/sin planeación
      if (this.filtroPlaneacion === 'CON_PLANEACION' && !tienePlaneacion) return false;
      if (this.filtroPlaneacion === 'SIN_PLANEACION' && tienePlaneacion) return false;

      // Filtro 2: estatus (solo aplica si hay planeaciones)
      if (this.filtroEstatus !== 'TODOS' && tienePlaneacion) {
        const tieneEsteEstatus = plans.some(p => p.estatus === this.filtroEstatus);
        if (!tieneEsteEstatus) return false;
      }

      return true;
    });
  }

  // Contadores para los badges de filtro
  get countConPlaneacion(): number {
    return this.materiasConArchivos.filter(m => this.getPlaneacionesDeMateria(m.id).length > 0).length;
  }
  get countSinPlaneacion(): number {
    return this.materiasConArchivos.filter(m => this.getPlaneacionesDeMateria(m.id).length === 0).length;
  }
  get countAprobadas(): number {
    return this.materiasConArchivos.filter(m => this.getPlaneacionesDeMateria(m.id).some(p => p.estatus === 'APROBADA')).length;
  }
  get countPendientes(): number {
    return this.materiasConArchivos.filter(m => this.getPlaneacionesDeMateria(m.id).some(p => p.estatus === 'PENDIENTE_REVISION' || p.estatus === 'EN_REVISION')).length;
  }
  get countRechazadas(): number {
    return this.materiasConArchivos.filter(m => this.getPlaneacionesDeMateria(m.id).some(p => p.estatus === 'RECHAZADA')).length;
  }
  get countConObs(): number {
    return this.materiasConArchivos.filter(m => this.getPlaneacionesDeMateria(m.id).some(p => p.estatus === 'CON_OBSERVACIONES')).length;
  }

  setFiltroPlan(f: FiltroPlan): void {
    this.filtroPlaneacion = f;
    // Si se selecciona "Sin Planeación", el filtro de estatus no aplica
    if (f === 'SIN_PLANEACION') this.filtroEstatus = 'TODOS';
  }

  setFiltroEstatus(f: FiltroEstatus): void {
    this.filtroEstatus = f;
    // Si se filtra por estatus, implica que hay planeación
    if (f !== 'TODOS') this.filtroPlaneacion = 'CON_PLANEACION';
  }

  resetFiltros(): void {
    this.filtroPlaneacion = 'TODAS';
    this.filtroEstatus = 'TODOS';
  }

  get hayFiltrosActivos(): boolean {
    return this.filtroPlaneacion !== 'TODAS' || this.filtroEstatus !== 'TODOS';
  }

  // ============================================
  // VER TEMARIO
  // ============================================

  verTemario(materia: Materia & { archivoTemario?: ArchivoTemarioBase }): void {
    if (!materia.archivoTemario) {
      Swal.fire({ icon: 'warning', title: 'Sin temario', text: 'Esta materia no tiene temario subido.', confirmButtonColor: '#d32f2f' });
      return;
    }
    let pdfUrl = materia.archivoTemario.archivoPdf;
    if (!pdfUrl.startsWith('http')) {
      pdfUrl = `http://localhost:3000/${pdfUrl.replace(/\\/g, '/')}`;
    }
    window.open(pdfUrl, '_blank');
  }

  // ============================================
  // VER PLANEACIONES
  // ============================================

  verPlaneaciones(materia: Materia): void {
    const planeaciones = this.todasLasPlaneaciones.filter(p => p.syllabus?.materiaId === materia.id);
    this.mostrarModalPlaneaciones(materia, planeaciones);
  }

  private mostrarModalPlaneaciones(materia: Materia, planeaciones: LessonPlanAdmin[]): void {
    const estatusConfig: { [key: string]: { bg: string; color: string; icon: string; label: string } } = {
      'APROBADA':           { bg: '#e8f5e9', color: '#2e7d32', icon: '✅', label: 'Aprobada' },
      'PENDIENTE_REVISION': { bg: '#fff3e0', color: '#e65100', icon: '⏳', label: 'Pendiente' },
      'RECHAZADA':          { bg: '#ffebee', color: '#c62828', icon: '❌', label: 'Rechazada' },
      'EN_REVISION':        { bg: '#e3f2fd', color: '#1565c0', icon: '🔍', label: 'En Revisión' },
      'CON_OBSERVACIONES':  { bg: '#fce4ec', color: '#880e4f', icon: '💬', label: 'Con Observaciones' }
    };

    const getModalidad = (descripcion: string): string => {
      if (!descripcion) return '';
      if (descripcion.includes('[ESCOLARIZADO]')) return '🎓 Escolarizado';
      if (descripcion.includes('[SABATINO]'))     return '📅 Sabatino';
      return '';
    };

    const getNombreDocente = (p: LessonPlanAdmin): string => {
      if (!p.teacher?.usuario) return `Docente #${p.docenteId}`;
      const u = p.teacher.usuario;
      return `${u.nombre} ${u.apellidoPaterno} ${u.apellidoMaterno || ''}`.trim();
    };

    const gruposPorDocente = new Map<number, LessonPlanAdmin[]>();
    for (const p of planeaciones) {
      if (!gruposPorDocente.has(p.docenteId)) gruposPorDocente.set(p.docenteId, []);
      gruposPorDocente.get(p.docenteId)!.push(p);
    }
    gruposPorDocente.forEach(grupo => grupo.sort((a, b) => b.version - a.version));

    const filas = gruposPorDocente.size > 0
      ? Array.from(gruposPorDocente.entries()).map(([docenteId, versiones]) => {
          const latest    = versiones[0];
          const hayMas    = versiones.length > 1;
          const cfg       = estatusConfig[latest.estatus] || estatusConfig['PENDIENTE_REVISION'];
          const docente   = getNombreDocente(latest);
          const modalidad = getModalidad(latest.descripcion);
          const fecha     = new Date(latest.fechaSubida).toLocaleDateString('es-MX', {
            year: 'numeric', month: 'short', day: 'numeric'
          });

          const correccionBadge = latest.version > 1
            ? `<span style="background:#e3f2fd;color:#1565c0;padding:0.1rem 0.4rem;
                border-radius:8px;font-size:0.72rem;font-weight:600;margin-left:0.4rem;">
                ✏️ v${latest.version} corregida
              </span>`
            : '';

          const botonesAccion = latest.estatus === 'APROBADA'
            ? `<button onclick="document.dispatchEvent(new CustomEvent('admin-ver-pdf',{detail:${latest.id}}))"
                  style="background:#1565c0;color:white;border:none;padding:0.25rem 0.5rem;
                    border-radius:5px;cursor:pointer;font-size:0.75rem;">
                  📄 Ver PDF
                </button>
                <span style="font-size:0.75rem;color:#2e7d32;font-style:italic;align-self:center;padding:0 0.25rem;">
                  ✔ Aprobada
                </span>`
            : `<button onclick="document.dispatchEvent(new CustomEvent('admin-ver-pdf',{detail:${latest.id}}))"
                  style="background:#1565c0;color:white;border:none;padding:0.25rem 0.5rem;
                    border-radius:5px;cursor:pointer;font-size:0.75rem;">
                  📄 Ver PDF
                </button>
                <button onclick="document.dispatchEvent(new CustomEvent('admin-aprobar',{detail:${latest.id}}))"
                  style="background:#2e7d32;color:white;border:none;padding:0.25rem 0.5rem;
                    border-radius:5px;cursor:pointer;font-size:0.75rem;">
                  ✅ Aprobar
                </button>
                <button onclick="document.dispatchEvent(new CustomEvent('admin-observaciones',{detail:${latest.id}}))"
                  style="background:#880e4f;color:white;border:none;padding:0.25rem 0.5rem;
                    border-radius:5px;cursor:pointer;font-size:0.75rem;">
                  💬 Obs.
                </button>
                <button onclick="document.dispatchEvent(new CustomEvent('admin-rechazar',{detail:${latest.id}}))"
                  style="background:#c62828;color:white;border:none;padding:0.25rem 0.5rem;
                    border-radius:5px;cursor:pointer;font-size:0.75rem;">
                  ❌ Rechazar
                </button>`;

          return `
            <tr style="border-bottom:${hayMas ? 'none' : '1px solid #f0f0f0'};" id="row-plan-${latest.id}">
              <td style="padding:0.75rem 0.6rem;">
                <div style="font-weight:600;font-size:0.85rem;color:#333;">
                  ${docente}${correccionBadge}
                </div>
                ${modalidad ? `<div style="font-size:0.75rem;color:#777;margin-top:0.2rem;">${modalidad}</div>` : ''}
                ${hayMas ? `
                  <button onclick="
                    const rows = document.querySelectorAll('.hist-${docenteId}');
                    const btn = this;
                    rows.forEach(r => r.style.display = r.style.display === 'none' ? 'table-row' : 'none');
                    btn.textContent = rows[0].style.display === 'none' ? '🕓 Ver historial (${versiones.length - 1})' : '▲ Ocultar historial';
                  " style="background:none;border:none;color:#1565c0;font-size:0.75rem;
                    cursor:pointer;padding:0.1rem 0;margin-top:0.25rem;text-decoration:underline;">
                    🕓 Ver historial (${versiones.length - 1})
                  </button>` : ''}
              </td>
              <td style="padding:0.75rem 0.6rem;font-size:0.8rem;color:#666;white-space:nowrap;">${fecha}</td>
              <td style="padding:0.75rem 0.6rem;">
                <span style="background:${cfg.bg};color:${cfg.color};padding:0.2rem 0.55rem;
                  border-radius:12px;font-size:0.75rem;font-weight:600;white-space:nowrap;">
                  ${cfg.icon} ${cfg.label}
                </span>
              </td>
              <td style="padding:0.75rem 0.6rem;">
                <div style="display:flex;gap:0.35rem;flex-wrap:wrap;align-items:center;">
                  ${botonesAccion}
                </div>
              </td>
            </tr>
            ${versiones.slice(1).map((v) => {
              const vc = estatusConfig[v.estatus] || estatusConfig['PENDIENTE_REVISION'];
              const vf = new Date(v.fechaSubida).toLocaleDateString('es-MX', { year:'numeric', month:'short', day:'numeric' });
              return `
                <tr class="hist-${docenteId}" style="display:none;background:#fafafa;border-bottom:1px solid #f5f5f5;">
                  <td style="padding:0.5rem 0.6rem 0.5rem 2rem;font-size:0.8rem;color:#999;">└ v${v.version} · ${vf}</td>
                  <td style="padding:0.5rem 0.6rem;"></td>
                  <td style="padding:0.5rem 0.6rem;">
                    <span style="background:${vc.bg};color:${vc.color};padding:0.15rem 0.5rem;
                      border-radius:10px;font-size:0.72rem;font-weight:600;">
                      ${vc.icon} ${vc.label}
                    </span>
                  </td>
                  <td style="padding:0.5rem 0.6rem;">
                    <button onclick="document.dispatchEvent(new CustomEvent('admin-ver-pdf',{detail:${v.id}}))"
                      style="background:none;border:1px solid #ccc;color:#777;padding:0.2rem 0.5rem;
                        border-radius:5px;cursor:pointer;font-size:0.72rem;">
                      📄 PDF v${v.version}
                    </button>
                  </td>
                </tr>`;
            }).join('')}
          `;
        }).join('')
      : `<tr><td colspan="4" style="padding:3rem;text-align:center;color:#999;font-size:0.9rem;">
           📭 Ningún docente ha subido planeaciones para esta materia aún
         </td></tr>`;

    const onVerPdf        = (e: Event) => {
      const id = (e as CustomEvent).detail;
      const p = planeaciones.find(x => x.id === id);
      if (p) window.open(this.adminDocentesService.getLessonPlanPdfUrl(p.rutaArchivo), '_blank');
    };
    const onAprobar       = (e: Event) => { const id = (e as CustomEvent).detail; this.revisarPlaneacion(id, 'APROBADA',          materia, planeaciones); };
    const onRechazar      = (e: Event) => { const id = (e as CustomEvent).detail; this.revisarPlaneacion(id, 'RECHAZADA',         materia, planeaciones); };
    const onObservaciones = (e: Event) => { const id = (e as CustomEvent).detail; this.revisarPlaneacion(id, 'CON_OBSERVACIONES', materia, planeaciones); };

    document.addEventListener('admin-ver-pdf',      onVerPdf);
    document.addEventListener('admin-aprobar',       onAprobar);
    document.addEventListener('admin-rechazar',      onRechazar);
    document.addEventListener('admin-observaciones', onObservaciones);

    const pendienteCount = Array.from(gruposPorDocente.values())
      .filter(vs => vs[0].estatus === 'PENDIENTE_REVISION').length;

    Swal.fire({
      title: `📋 Planeaciones — ${materia.codigo}`,
      html: `
        <div style="text-align:left;">
          <div style="background:#f5f5f5;border-radius:8px;padding:0.6rem 1rem;margin-bottom:1rem;">
            <span style="font-weight:600;color:#333;">${materia.nombre}</span>
            &nbsp;·&nbsp;
            <span style="color:#666;font-size:0.9rem;">Semestre ${materia.semestre}</span>
            ${pendienteCount > 0 ? `
              &nbsp;·&nbsp;
              <span style="background:#fff3e0;color:#e65100;padding:0.15rem 0.5rem;
                border-radius:10px;font-size:0.8rem;font-weight:600;">
                ⏳ ${pendienteCount} pendiente(s)
              </span>` : ''}
          </div>
          <div style="overflow-x:auto;border-radius:8px;border:1px solid #e0e0e0;max-height:60vh;overflow-y:auto;">
            <table style="width:100%;border-collapse:collapse;font-size:0.88rem;">
              <thead style="position:sticky;top:0;">
                <tr style="background:#d32f2f;color:white;">
                  <th style="padding:0.65rem 0.6rem;text-align:left;font-weight:600;">Docente</th>
                  <th style="padding:0.65rem 0.6rem;text-align:left;font-weight:600;white-space:nowrap;">Fecha</th>
                  <th style="padding:0.65rem 0.6rem;text-align:left;font-weight:600;">Estatus</th>
                  <th style="padding:0.65rem 0.6rem;text-align:left;font-weight:600;">Acciones</th>
                </tr>
              </thead>
              <tbody>${filas}</tbody>
            </table>
          </div>
        </div>`,
      showConfirmButton: false,
      showCloseButton: true,
      width: '750px',
      willClose: () => {
        document.removeEventListener('admin-ver-pdf',      onVerPdf);
        document.removeEventListener('admin-aprobar',       onAprobar);
        document.removeEventListener('admin-rechazar',      onRechazar);
        document.removeEventListener('admin-observaciones', onObservaciones);
      }
    });
  }

  // ============================================
  // REVISAR PLANEACIÓN
  // ============================================

  private revisarPlaneacion(
    planId: number,
    accion: 'APROBADA' | 'RECHAZADA' | 'CON_OBSERVACIONES',
    materia: Materia,
    planeaciones: LessonPlanAdmin[]
  ): void {
    const config: { [key: string]: { titulo: string; color: string; icon: string; showObs: boolean; confirmText: string } } = {
      'APROBADA':          { titulo: 'Aprobar Planeación',    color: '#2e7d32', icon: '✅', showObs: false, confirmText: 'Sí, Aprobar' },
      'RECHAZADA':         { titulo: 'Rechazar Planeación',   color: '#c62828', icon: '❌', showObs: true,  confirmText: 'Rechazar' },
      'CON_OBSERVACIONES': { titulo: 'Agregar Observaciones', color: '#880e4f', icon: '💬', showObs: true,  confirmText: 'Guardar' }
    };

    const cfg = config[accion];
    const plan = planeaciones.find(p => p.id === planId);
    if (!plan) return;

    Swal.close();

    setTimeout(() => {
      Swal.fire({
        title: `${cfg.icon} ${cfg.titulo}`,
        html: `
          <div style="text-align:left;">
            <div style="background:#f5f5f5; border-radius:8px; padding:0.75rem 1rem; margin-bottom:1rem;">
              <p style="margin:0; font-size:0.85rem; color:#555;">Planeación de:</p>
              <p style="margin:0.25rem 0 0; font-weight:600; color:#333;">
                ${plan.teacher?.usuario?.nombre || 'Docente'} ${plan.teacher?.usuario?.apellidoPaterno || ''}
              </p>
              <p style="margin:0.15rem 0 0; font-size:0.8rem; color:#777;">
                ${materia.codigo} — ${materia.nombre}
              </p>
            </div>
            ${cfg.showObs ? `
              <label style="display:block; font-weight:500; font-size:0.9rem; margin-bottom:0.4rem;">
                ${accion === 'RECHAZADA' ? 'Motivo del rechazo' : 'Observaciones para el docente'}
                ${accion === 'RECHAZADA' ? '<span style="color:#d32f2f;">*</span>' : '<span style="color:#999;">(opcional)</span>'}
              </label>
              <textarea id="swal-obs" style="width:100%;min-height:100px;border:1px solid #ddd;
                border-radius:8px;padding:0.75rem;font-size:0.9rem;font-family:inherit;
                resize:vertical;box-sizing:border-box;"
                placeholder="${accion === 'RECHAZADA' ? 'Explica el motivo del rechazo...' : 'Escribe las observaciones...'}"
              ></textarea>
              <p id="swal-obs-error" style="color:#d32f2f;font-size:0.8rem;margin:0.3rem 0 0;display:none;">
                ⚠️ Debes indicar el motivo del rechazo
              </p>
            ` : `
              <p style="color:#555;font-size:0.95rem;text-align:center;padding:0.5rem;">
                ¿Confirmas que esta planeación cumple con los requisitos?
              </p>
            `}
          </div>`,
        showCancelButton: true,
        confirmButtonText: cfg.confirmText,
        cancelButtonText: 'Cancelar',
        confirmButtonColor: cfg.color,
        width: '480px',
        preConfirm: () => {
          if (cfg.showObs) {
            const obs = (document.getElementById('swal-obs') as HTMLTextAreaElement)?.value?.trim();
            if (accion === 'RECHAZADA' && !obs) {
              (document.getElementById('swal-obs-error') as HTMLElement).style.display = 'block';
              return false;
            }
            return { observaciones: obs };
          }
          return { observaciones: '' };
        }
      }).then((result) => {
        if (result.isConfirmed) {
          this.ejecutarRevision(planId, accion, result.value?.observaciones || '', materia, planeaciones);
        } else {
          this.mostrarModalPlaneaciones(materia, planeaciones);
        }
      });
    }, 300);
  }

  private ejecutarRevision(
    planId: number,
    estatus: 'APROBADA' | 'RECHAZADA' | 'CON_OBSERVACIONES',
    observaciones: string,
    materia: Materia,
    planeacionesAnteriores: LessonPlanAdmin[]
  ): void {
    Swal.fire({ title: 'Guardando...', allowOutsideClick: false, allowEscapeKey: false, didOpen: () => Swal.showLoading() });

    this.adminDocentesService.reviewLessonPlan(planId, { estatus, observaciones }).subscribe({
      next: () => {
        const idx = this.todasLasPlaneaciones.findIndex(p => p.id === planId);
        if (idx !== -1) this.todasLasPlaneaciones[idx] = { ...this.todasLasPlaneaciones[idx], estatus, observaciones };
        const idxLocal = planeacionesAnteriores.findIndex(p => p.id === planId);
        if (idxLocal !== -1) planeacionesAnteriores[idxLocal] = { ...planeacionesAnteriores[idxLocal], estatus, observaciones };

        const iconMap: { [key: string]: 'success' | 'info' | 'warning' } = { 'APROBADA':'success','RECHAZADA':'warning','CON_OBSERVACIONES':'info' };
        const labelMap: { [key: string]: string } = { 'APROBADA':'Planeación aprobada','RECHAZADA':'Planeación rechazada','CON_OBSERVACIONES':'Observaciones guardadas' };

        Swal.fire({
          icon: iconMap[estatus] || 'success',
          title: labelMap[estatus],
          text: 'El docente podrá ver el resultado en su panel.',
          confirmButtonColor: '#d32f2f',
          timer: 2500, timerProgressBar: true
        }).then(() => this.mostrarModalPlaneaciones(materia, planeacionesAnteriores));
      },
      error: (error) => {
        Swal.fire({ icon: 'error', title: 'Error', text: error.error?.message || 'No se pudo guardar la revisión.', confirmButtonColor: '#d32f2f' })
          .then(() => this.mostrarModalPlaneaciones(materia, planeacionesAnteriores));
      }
    });
  }

  // ============================================
  // ELIMINAR MATERIA
  // ============================================

  deleteMateria(materia: Materia): void {
    Swal.fire({
      title: '¿Eliminar materia?',
      html: `<p>Estás a punto de eliminar <strong>${materia.nombre}</strong></p>
        <p style="color:#d32f2f;font-size:0.9rem;">Esta acción también eliminará sus temarios.</p>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d32f2f'
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.adminDocentesService.deleteMateria(materia.id).subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Eliminada', timer: 1500, showConfirmButton: false });
          this.loadProgramaDetail();
        },
        error: () => Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo eliminar la materia.' })
      });
    });
  }

  goBack(): void { this.router.navigate(['/admin/docentes']); }
}