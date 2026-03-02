import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import Swal from 'sweetalert2';
import {
  AdminDocentesService,
  DocenteAdmin,
  MateriaAsignadaGrupo,
  MateriaAsignada,
  Program,
  Materia,
  LessonPlanAdmin,
} from '../admin-docentes.service';
import { MateriasBySemPipe } from './materia-by-sem.pipe';

// ✅ Ya NO se importa HttpClient ni HttpClientModule
//    Las llamadas de disponibilidad pasan por AdminDocentesService
//    que usa el auth interceptor automáticamente → no más 401

@Component({
  selector: 'app-docente-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatTabsModule,
    MateriasBySemPipe,
  ],
  templateUrl: './docente-detail.component.html',
  styleUrls: ['./docente-detail.component.css']
})
export class DocenteDetailComponent implements OnInit {

  docenteId!: number;
  docente: DocenteAdmin | null = null;
  grupos: MateriaAsignadaGrupo[] = [];
  programas: Program[] = [];
  todasLasPlaneaciones: LessonPlanAdmin[] = [];

  // ── Disponibilidad ─────────────────────────────
  disponibilidad: any = null;
  isLoadingDisp = false;

  // ── Estado general ─────────────────────────────
  isLoadingDocente  = false;
  isLoadingMaterias = false;
  errorDocente  = '';
  errorMaterias = '';

  gruposExpanded: { [programaId: number]: boolean } = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private svc: AdminDocentesService,
  ) {}

  ngOnInit(): void {
    this.docenteId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadDocente();
    this.loadMaterias();
    this.loadPlaneaciones();
    this.loadDisponibilidad();
    this.svc.getProgramas({ estaActivo: true }).subscribe({
      next: (ps) => { this.programas = ps; },
      error: () => {}
    });
  }

  // ═══════════════════════════════════════════════
  // CARGA
  // ═══════════════════════════════════════════════

  loadDocente(): void {
    this.isLoadingDocente = true;
    this.svc.getDocenteById(this.docenteId).subscribe({
      next:  (d) => { this.docente = d; this.isLoadingDocente = false; },
      error: () => { this.errorDocente = 'No se pudo cargar la información del docente.'; this.isLoadingDocente = false; }
    });
  }

  loadMaterias(): void {
    this.isLoadingMaterias = true;
    this.svc.getMateriasAsignadas(this.docenteId).subscribe({
      next: (g) => {
        this.grupos = g;
        for (const gr of g) this.gruposExpanded[gr.programaId] = true;
        this.isLoadingMaterias = false;
      },
      error: () => { this.errorMaterias = 'Error al cargar materias asignadas.'; this.isLoadingMaterias = false; }
    });
  }

  loadPlaneaciones(): void {
    this.svc.getAllLessonPlans().subscribe({
      next:  (pl) => { this.todasLasPlaneaciones = pl.filter(p => p.docenteId === this.docenteId); },
      error: () => {}
    });
  }

  // ═══════════════════════════════════════════════
  // DISPONIBILIDAD
  // ✅ Usa svc en lugar de HttpClient directo
  //    → pasa por auth interceptor → token automático
  // ═══════════════════════════════════════════════

  loadDisponibilidad(): void {
    this.isLoadingDisp = true;
    this.svc.getDisponibilidadDocente(this.docenteId).subscribe({
      next:  (d) => { this.disponibilidad = d; this.isLoadingDisp = false; },
      error: ()  => { this.isLoadingDisp = false; }
    });
  }

  marcarRevisada(): void {
    Swal.fire({
      title: '¿Marcar como revisada?',
      text: 'Se actualizará el estatus de la disponibilidad de este docente.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#2e7d32',
      confirmButtonText: 'Sí, marcar',
      cancelButtonText: 'Cancelar',
    }).then(result => {
      if (!result.isConfirmed) return;
      this.svc.marcarDisponibilidadRevisada(this.docenteId).subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Marcada como revisada', confirmButtonColor: '#d32f2f', timer: 1500 });
          this.loadDisponibilidad();
        },
        error: () => Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo actualizar el estatus.', confirmButtonColor: '#d32f2f' })
      });
    });
  }

  getModuloLabel(m: any): string {
    const inicio = String(m.horaInicio || '').substring(0, 5);
    const fin    = String(m.horaFin    || '').substring(0, 5);
    return `Módulo ${m.numeroModulo} · ${inicio} – ${fin}`;
  }

  // ═══════════════════════════════════════════════
  // TOGGLE GRUPO
  // ═══════════════════════════════════════════════

  toggleGrupo(programaId: number): void {
    this.gruposExpanded[programaId] = !this.gruposExpanded[programaId];
  }

  // ═══════════════════════════════════════════════
  // PLANEACIONES
  // ═══════════════════════════════════════════════

  getPlaneacionesDeMateria(materiaId: number): LessonPlanAdmin[] {
    return this.todasLasPlaneaciones.filter(p => p.syllabus?.materiaId === materiaId);
  }

  getEstatusLatest(materiaId: number): string | null {
    const plans = this.getPlaneacionesDeMateria(materiaId);
    if (!plans.length) return null;
    return plans.reduce((best, p) => p.version > best.version ? p : best, plans[0]).estatus;
  }

  verPlaneacionesDeMateria(materia: MateriaAsignada): void {
    this.mostrarModalPlaneaciones(materia, this.getPlaneacionesDeMateria(materia.materiaId));
  }

  private mostrarModalPlaneaciones(materia: MateriaAsignada, planeaciones: LessonPlanAdmin[]): void {
    const estatusConfig: { [key: string]: { bg: string; color: string; icon: string; label: string } } = {
      'APROBADA':           { bg: '#e8f5e9', color: '#2e7d32', icon: '✅', label: 'Aprobada' },
      'PENDIENTE_REVISION': { bg: '#fff3e0', color: '#e65100', icon: '⏳', label: 'Pendiente' },
      'RECHAZADA':          { bg: '#ffebee', color: '#c62828', icon: '❌', label: 'Rechazada' },
      'EN_REVISION':        { bg: '#e3f2fd', color: '#1565c0', icon: '🔍', label: 'En Revisión' },
      'CON_OBSERVACIONES':  { bg: '#fce4ec', color: '#880e4f', icon: '💬', label: 'Con Observaciones' },
    };

    const getModalidad = (desc: string) => {
      if (!desc) return '';
      if (desc.includes('[ESCOLARIZADO]')) return '🎓 Escolarizado';
      if (desc.includes('[SABATINO]'))     return '📅 Sabatino';
      return '';
    };

    const grupos = new Map<number, LessonPlanAdmin[]>();
    for (const p of planeaciones) {
      if (!grupos.has(p.docenteId)) grupos.set(p.docenteId, []);
      grupos.get(p.docenteId)!.push(p);
    }
    grupos.forEach(g => g.sort((a, b) => b.version - a.version));

    const filas = grupos.size > 0
      ? Array.from(grupos.entries()).map(([did, versiones]) => {
          const latest    = versiones[0];
          const hayMas    = versiones.length > 1;
          const cfg       = estatusConfig[latest.estatus] || estatusConfig['PENDIENTE_REVISION'];
          const modalidad = getModalidad(latest.descripcion);
          const fecha     = new Date(latest.fechaSubida).toLocaleDateString('es-MX', { year:'numeric', month:'short', day:'numeric' });

          const correccionBadge = latest.version > 1
            ? `<span style="background:#e3f2fd;color:#1565c0;padding:0.1rem 0.4rem;border-radius:8px;font-size:0.72rem;font-weight:600;margin-left:0.4rem;">✏️ v${latest.version} corregida</span>`
            : '';

          const botonesAccion = latest.estatus === 'APROBADA'
            ? `<button onclick="document.dispatchEvent(new CustomEvent('dd-ver-pdf',{detail:${latest.id}}))"
                style="background:#1565c0;color:white;border:none;padding:0.25rem 0.5rem;border-radius:5px;cursor:pointer;font-size:0.75rem;">📄 Ver PDF</button>
               <span style="font-size:0.75rem;color:#2e7d32;font-style:italic;align-self:center;">✔ Aprobada</span>`
            : `<button onclick="document.dispatchEvent(new CustomEvent('dd-ver-pdf',{detail:${latest.id}}))"
                style="background:#1565c0;color:white;border:none;padding:0.25rem 0.5rem;border-radius:5px;cursor:pointer;font-size:0.75rem;">📄 Ver PDF</button>
               <button onclick="document.dispatchEvent(new CustomEvent('dd-aprobar',{detail:${latest.id}}))"
                style="background:#2e7d32;color:white;border:none;padding:0.25rem 0.5rem;border-radius:5px;cursor:pointer;font-size:0.75rem;">✅ Aprobar</button>
               <button onclick="document.dispatchEvent(new CustomEvent('dd-obs',{detail:${latest.id}}))"
                style="background:#880e4f;color:white;border:none;padding:0.25rem 0.5rem;border-radius:5px;cursor:pointer;font-size:0.75rem;">💬 Obs.</button>
               <button onclick="document.dispatchEvent(new CustomEvent('dd-rechazar',{detail:${latest.id}}))"
                style="background:#c62828;color:white;border:none;padding:0.25rem 0.5rem;border-radius:5px;cursor:pointer;font-size:0.75rem;">❌ Rechazar</button>`;

          return `
            <tr id="row-${latest.id}">
              <td style="padding:0.75rem 0.6rem;">
                <div style="font-size:0.85rem;color:#333;">v${latest.version}${correccionBadge}</div>
                ${modalidad ? `<div style="font-size:0.75rem;color:#777;margin-top:0.2rem;">${modalidad}</div>` : ''}
                ${hayMas ? `<button onclick="
                    const rows=document.querySelectorAll('.hist-${did}');
                    const btn=this;
                    rows.forEach(r=>r.style.display=r.style.display==='none'?'table-row':'none');
                    btn.textContent=rows[0].style.display==='none'?'🕓 Ver historial (${versiones.length-1})':'▲ Ocultar';
                  " style="background:none;border:none;color:#1565c0;font-size:0.75rem;cursor:pointer;text-decoration:underline;padding:0;margin-top:0.25rem;">
                    🕓 Ver historial (${versiones.length-1})
                  </button>` : ''}
              </td>
              <td style="padding:0.75rem 0.6rem;font-size:0.8rem;color:#666;white-space:nowrap;">${fecha}</td>
              <td style="padding:0.75rem 0.6rem;">
                <span style="background:${cfg.bg};color:${cfg.color};padding:0.2rem 0.55rem;border-radius:12px;font-size:0.75rem;font-weight:600;">
                  ${cfg.icon} ${cfg.label}
                </span>
              </td>
              <td style="padding:0.75rem 0.6rem;">
                <div style="display:flex;gap:0.35rem;flex-wrap:wrap;align-items:center;">${botonesAccion}</div>
              </td>
            </tr>
            ${versiones.slice(1).map(v => {
              const vc = estatusConfig[v.estatus] || estatusConfig['PENDIENTE_REVISION'];
              const vf = new Date(v.fechaSubida).toLocaleDateString('es-MX', { year:'numeric', month:'short', day:'numeric' });
              return `<tr class="hist-${did}" style="display:none;background:#fafafa;">
                <td style="padding:0.5rem 0.6rem 0.5rem 2rem;font-size:0.8rem;color:#999;">└ v${v.version} · ${vf}</td>
                <td></td>
                <td style="padding:0.5rem 0.6rem;">
                  <span style="background:${vc.bg};color:${vc.color};padding:0.15rem 0.5rem;border-radius:10px;font-size:0.72rem;font-weight:600;">${vc.icon} ${vc.label}</span>
                </td>
                <td style="padding:0.5rem 0.6rem;">
                  <button onclick="document.dispatchEvent(new CustomEvent('dd-ver-pdf',{detail:${v.id}}))"
                    style="background:none;border:1px solid #ccc;color:#777;padding:0.2rem 0.5rem;border-radius:5px;cursor:pointer;font-size:0.72rem;">📄 PDF v${v.version}</button>
                </td>
              </tr>`;
            }).join('')}`;
        }).join('')
      : `<tr><td colspan="4" style="padding:3rem;text-align:center;color:#999;">📭 Sin planeaciones para esta materia</td></tr>`;

    const onPdf      = (e: Event) => { const id = (e as CustomEvent).detail; const p = planeaciones.find(x => x.id === id); if (p) window.open(this.svc.getLessonPlanPdfUrl(p.rutaArchivo), '_blank'); };
    const onAprobar  = (e: Event) => { const id = (e as CustomEvent).detail; this.revisarPlaneacion(id, 'APROBADA',          materia, planeaciones); };
    const onObs      = (e: Event) => { const id = (e as CustomEvent).detail; this.revisarPlaneacion(id, 'CON_OBSERVACIONES', materia, planeaciones); };
    const onRechazar = (e: Event) => { const id = (e as CustomEvent).detail; this.revisarPlaneacion(id, 'RECHAZADA',         materia, planeaciones); };

    document.addEventListener('dd-ver-pdf',  onPdf);
    document.addEventListener('dd-aprobar',  onAprobar);
    document.addEventListener('dd-obs',      onObs);
    document.addEventListener('dd-rechazar', onRechazar);

    Swal.fire({
      title: `📋 Planeaciones — ${materia.codigo}`,
      html: `
        <div style="text-align:left;">
          <div style="background:#f5f5f5;border-radius:8px;padding:0.6rem 1rem;margin-bottom:1rem;">
            <span style="font-weight:600;color:#333;">${materia.nombre}</span>
            &nbsp;·&nbsp;
            <span style="color:#666;font-size:0.9rem;">Semestre ${materia.semestre}</span>
          </div>
          <div style="border-radius:8px;border:1px solid #e0e0e0;overflow:hidden;max-height:55vh;overflow-y:auto;">
            <table style="width:100%;border-collapse:collapse;font-size:0.88rem;">
              <thead>
                <tr style="background:#d32f2f;color:white;position:sticky;top:0;">
                  <th style="padding:0.65rem;text-align:left;">Versión</th>
                  <th style="padding:0.65rem;text-align:left;white-space:nowrap;">Fecha</th>
                  <th style="padding:0.65rem;text-align:left;">Estatus</th>
                  <th style="padding:0.65rem;text-align:left;">Acciones</th>
                </tr>
              </thead>
              <tbody>${filas}</tbody>
            </table>
          </div>
        </div>`,
      showConfirmButton: false,
      showCloseButton: true,
      width: '680px',
      willClose: () => {
        document.removeEventListener('dd-ver-pdf',  onPdf);
        document.removeEventListener('dd-aprobar',  onAprobar);
        document.removeEventListener('dd-obs',      onObs);
        document.removeEventListener('dd-rechazar', onRechazar);
      }
    });
  }

  private revisarPlaneacion(
    planId: number,
    accion: 'APROBADA' | 'RECHAZADA' | 'CON_OBSERVACIONES',
    materia: MateriaAsignada,
    planeaciones: LessonPlanAdmin[]
  ): void {
    const config: { [k: string]: { titulo: string; color: string; icon: string; showObs: boolean; confirmText: string } } = {
      'APROBADA':          { titulo: 'Aprobar Planeación',    color: '#2e7d32', icon: '✅', showObs: false, confirmText: 'Sí, Aprobar' },
      'RECHAZADA':         { titulo: 'Rechazar Planeación',   color: '#c62828', icon: '❌', showObs: true,  confirmText: 'Rechazar' },
      'CON_OBSERVACIONES': { titulo: 'Agregar Observaciones', color: '#880e4f', icon: '💬', showObs: true,  confirmText: 'Guardar' },
    };
    const cfg  = config[accion];
    const plan = planeaciones.find(p => p.id === planId);
    if (!plan) return;

    Swal.close();
    setTimeout(() => {
      Swal.fire({
        title: `${cfg.icon} ${cfg.titulo}`,
        html: `
          <div style="text-align:left;">
            <div style="background:#f5f5f5;border-radius:8px;padding:0.75rem 1rem;margin-bottom:1rem;">
              <p style="margin:0;font-size:0.85rem;color:#555;">${materia.codigo} — ${materia.nombre}</p>
            </div>
            ${cfg.showObs ? `
              <label style="display:block;font-weight:500;font-size:0.9rem;margin-bottom:0.4rem;">
                ${accion === 'RECHAZADA' ? 'Motivo del rechazo <span style="color:#d32f2f">*</span>' : 'Observaciones <span style="color:#999">(opcional)</span>'}
              </label>
              <textarea id="swal-obs" style="width:100%;min-height:90px;border:1px solid #ddd;border-radius:8px;padding:0.75rem;font-size:0.9rem;font-family:inherit;resize:vertical;box-sizing:border-box;"
                placeholder="${accion === 'RECHAZADA' ? 'Explica el motivo...' : 'Escribe observaciones...'}"></textarea>
              <p id="swal-obs-error" style="color:#d32f2f;font-size:0.8rem;margin:0.3rem 0 0;display:none;">⚠️ Debes indicar el motivo</p>
            ` : `<p style="color:#555;text-align:center;">¿Confirmas que esta planeación cumple con los requisitos?</p>`}
          </div>`,
        showCancelButton: true,
        confirmButtonText: cfg.confirmText,
        cancelButtonText: 'Cancelar',
        confirmButtonColor: cfg.color,
        width: '460px',
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
      }).then(result => {
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
    materia: MateriaAsignada,
    planeacionesAnteriores: LessonPlanAdmin[]
  ): void {
    Swal.fire({ title: 'Guardando...', allowOutsideClick: false, allowEscapeKey: false, didOpen: () => Swal.showLoading() });

    this.svc.reviewLessonPlan(planId, { estatus, observaciones }).subscribe({
      next: () => {
        const idx = this.todasLasPlaneaciones.findIndex(p => p.id === planId);
        if (idx !== -1) this.todasLasPlaneaciones[idx] = { ...this.todasLasPlaneaciones[idx], estatus, observaciones };
        const idxL = planeacionesAnteriores.findIndex(p => p.id === planId);
        if (idxL !== -1) planeacionesAnteriores[idxL] = { ...planeacionesAnteriores[idxL], estatus, observaciones };

        const iconMap:  any = { 'APROBADA': 'success', 'RECHAZADA': 'warning', 'CON_OBSERVACIONES': 'info' };
        const labelMap: any = { 'APROBADA': 'Planeación aprobada', 'RECHAZADA': 'Planeación rechazada', 'CON_OBSERVACIONES': 'Observaciones guardadas' };

        Swal.fire({ icon: iconMap[estatus], title: labelMap[estatus], confirmButtonColor: '#d32f2f', timer: 2000, timerProgressBar: true })
          .then(() => this.mostrarModalPlaneaciones(materia, planeacionesAnteriores));
      },
      error: (err) => {
        Swal.fire({ icon: 'error', title: 'Error', text: err.error?.message || 'No se pudo guardar.', confirmButtonColor: '#d32f2f' })
          .then(() => this.mostrarModalPlaneaciones(materia, planeacionesAnteriores));
      }
    });
  }

  // ═══════════════════════════════════════════════
  // QUITAR MATERIA
  // ═══════════════════════════════════════════════

  quitarMateria(materiaId: number, nombreMateria: string): void {
    Swal.fire({
      title: '¿Quitar materia?',
      html: `<p>Se quitará <strong>${nombreMateria}</strong> de este docente.</p>
             <p style="color:#888;font-size:0.85rem;">El docente ya no podrá planear esta materia.</p>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, quitar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d32f2f',
    }).then(result => {
      if (!result.isConfirmed) return;
      Swal.fire({ title: 'Quitando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      this.svc.desasignarMateria(this.docenteId, materiaId).subscribe({
        next:  () => { Swal.fire({ icon: 'success', title: 'Materia quitada', timer: 1500, showConfirmButton: false }); this.loadMaterias(); },
        error: ()  => Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo quitar la materia.', confirmButtonColor: '#d32f2f' })
      });
    });
  }

  // ═══════════════════════════════════════════════
  // AGREGAR MATERIAS (modal 2 pasos)
  // ═══════════════════════════════════════════════

  async agregarMaterias(): Promise<void> {
    if (!this.docente || this.programas.length === 0) return;

    let idsYaAsignados: number[] = [];
    try { idsYaAsignados = await this.svc.getMateriasIdsAsignadas(this.docenteId).toPromise() || []; } catch {}

    const carrerasHtml = this.programas.map(p => `
      <label style="display:flex;align-items:center;gap:0.6rem;padding:0.6rem 0.75rem;border-radius:8px;
        border:1.5px solid #e0e0e0;cursor:pointer;margin-bottom:0.5rem;background:white;"
        onmouseenter="this.style.borderColor='#d32f2f'"
        onmouseleave="this.style.borderColor=this.querySelector('input').checked?'#d32f2f':'#e0e0e0'">
        <input type="checkbox" value="${p.id}" style="accent-color:#d32f2f;width:16px;height:16px;"
          onchange="this.closest('label').style.borderColor=this.checked?'#d32f2f':'#e0e0e0'">
        <div>
          <div style="font-weight:600;font-size:0.9rem;color:#333;">${p.nombre}</div>
          <div style="font-size:0.78rem;color:#888;">${p.codigo}</div>
        </div>
      </label>`).join('');

    const { isConfirmed, value: pids } = await Swal.fire({
      title: '➕ Agregar Materias — Paso 1',
      html: `<div style="text-align:left;">
        <p style="font-size:0.9rem;color:#555;margin-bottom:0.75rem;">Selecciona las carreras:</p>
        <div style="max-height:320px;overflow-y:auto;">${carrerasHtml}</div>
      </div>`,
      showCancelButton: true,
      confirmButtonText: 'Siguiente →',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d32f2f',
      width: '500px',
      preConfirm: () => {
        const ids = Array.from(document.querySelectorAll<HTMLInputElement>('input[type=checkbox]:checked')).map(c => Number(c.value));
        if (!ids.length) { Swal.showValidationMessage('Selecciona al menos una carrera'); return false; }
        return ids;
      }
    });

    if (!isConfirmed || !pids) return;

    Swal.fire({ title: 'Cargando materias...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    const resultados = await Promise.all((pids as number[]).map(pid => this.svc.getProgramaDetail(pid).toPromise().catch(() => null)));
    Swal.close();

    const gruposCarreras = resultados.filter(r => r !== null) as any[];

    const programasHtml = gruposCarreras.map(g => {
      const semestres = new Map<number, Materia[]>();
      for (const m of g.materias || []) {
        if (!semestres.has(m.semestre)) semestres.set(m.semestre, []);
        semestres.get(m.semestre)!.push(m);
      }
      const semsHtml = Array.from(semestres.entries()).sort(([a],[b]) => a - b).map(([sem, mats]) => `
        <div style="margin-bottom:0.5rem;">
          <span style="background:#ffebee;color:#d32f2f;padding:0.1rem 0.5rem;border-radius:10px;font-size:0.75rem;font-weight:700;">Sem ${sem}</span>
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:0.3rem;margin-top:0.3rem;">
            ${mats.map((m: Materia) => {
              const ya = idsYaAsignados.includes(m.id);
              return `<label style="display:flex;align-items:center;gap:0.35rem;padding:0.35rem 0.5rem;border-radius:6px;border:1px solid ${ya?'#c8e6c9':'#e0e0e0'};background:${ya?'#f1f8e9':'white'};cursor:pointer;font-size:0.78rem;">
                <input type="checkbox" class="mat-check" value="${m.id}" ${ya?'checked':''} style="accent-color:#d32f2f;">
                <div><div style="font-weight:600;color:#333;">${m.codigo}</div><div style="color:#777;font-size:0.72rem;">${m.nombre}</div></div>
              </label>`;
            }).join('')}
          </div>
        </div>`).join('');

      return `<div style="margin-bottom:0.75rem;border:1.5px solid #e0e0e0;border-radius:10px;overflow:hidden;">
        <div style="background:#d32f2f;color:white;padding:0.5rem 0.75rem;font-weight:700;font-size:0.85rem;">${g.nombre} <span style="opacity:0.8;font-size:0.75rem;">${g.codigo}</span></div>
        <div style="padding:0.75rem;">${semsHtml}</div>
      </div>`;
    }).join('');

    const { isConfirmed: ok, value: selectedIds } = await Swal.fire({
      title: '➕ Agregar Materias — Paso 2',
      html: `<div style="text-align:left;"><div style="max-height:400px;overflow-y:auto;">${programasHtml}</div></div>`,
      showCancelButton: true,
      confirmButtonText: '💾 Guardar',
      cancelButtonText: '← Volver',
      confirmButtonColor: '#d32f2f',
      width: '640px',
      preConfirm: () => Array.from(document.querySelectorAll<HTMLInputElement>('.mat-check:checked')).map(c => Number(c.value))
    });

    if (!ok) { this.agregarMaterias(); return; }
    if (!selectedIds?.length) { Swal.fire({ icon: 'info', title: 'Sin cambios', confirmButtonColor: '#d32f2f' }); return; }

    Swal.fire({ title: 'Guardando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    this.svc.asignarMaterias(this.docenteId, selectedIds as number[]).subscribe({
      next: (res) => {
        Swal.fire({
          icon: 'success', title: '¡Guardado!',
          html: `✅ Asignadas: <strong>${res.asignadas}</strong>${res.duplicadas > 0 ? `<br>🔁 Ya tenía: <strong>${res.duplicadas}</strong>` : ''}`,
          confirmButtonColor: '#d32f2f', timer: 2500, timerProgressBar: true
        }).then(() => { this.loadMaterias(); this.loadPlaneaciones(); });
      },
      error: () => Swal.fire({ icon: 'error', title: 'Error', confirmButtonColor: '#d32f2f' })
    });
  }

  // ═══════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════

  getNombreCompleto(): string {
    if (!this.docente?.usuario) return `Docente #${this.docenteId}`;
    const u = this.docente.usuario;
    return `${u.nombre} ${u.apellidoPaterno} ${u.apellidoMaterno || ''}`.trim();
  }

  getInicial(): string  { return (this.docente?.usuario?.nombre?.[0] || '?').toUpperCase(); }
  getTotalMaterias(): number { return this.grupos.reduce((s, g) => s + g.materias.length, 0); }
  goBack(): void { this.router.navigate(['/admin/docentes']); }
}