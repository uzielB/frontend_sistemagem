import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import Swal from 'sweetalert2';
import { AdminDocentesService, DocenteAdmin, Program, Materia } from '../admin-docentes.service';

/** UBICACIÓN: src/app/features/admin/docentes/docentes-list/docente-list.component.ts */
@Component({
  selector: 'app-docente-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatTooltipModule, MatChipsModule,
  ],
  templateUrl: './docente-list.component.html',
  styleUrls: ['./docente-list.component.css']
})
export class DocenteListComponent implements OnInit {

  docentes: DocenteAdmin[] = [];
  docentesFiltrados: DocenteAdmin[] = [];
  busqueda = '';
  isLoading = false;
  errorMessage = '';
  programas: Program[] = [];

  constructor(private svc: AdminDocentesService, private router: Router) {}

  ngOnInit(): void {
    this.loadDocentes();
    this.loadProgramas();
  }

  // ── CARGA ─────────────────────────────────────────────────

  loadDocentes(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.svc.getDocentes().subscribe({
      next: (data) => { this.docentes = data; this.filtrar(); this.isLoading = false; },
      error: () => { this.errorMessage = 'Error al cargar los docentes.'; this.isLoading = false; }
    });
  }

  loadProgramas(): void {
    this.svc.getProgramas({ estaActivo: true }).subscribe({ next: (ps) => { this.programas = ps; } });
  }

  // ── BÚSQUEDA ───────────────────────────────────────────────

  filtrar(): void {
    const q = this.busqueda.toLowerCase().trim();
    if (!q) { this.docentesFiltrados = [...this.docentes]; return; }
    this.docentesFiltrados = this.docentes.filter(d => {
      const nombre = `${d.usuario?.nombre} ${d.usuario?.apellidoPaterno} ${d.usuario?.apellidoMaterno}`.toLowerCase();
      return nombre.includes(q) || (d.usuario?.curp || '').toLowerCase().includes(q)
        || (d.numeroEmpleado || '').toLowerCase().includes(q)
        || (d.usuario?.correo || '').toLowerCase().includes(q);
    });
  }

  // ── NAVEGACIÓN ─────────────────────────────────────────────

  verDetalle(id: number): void {
    this.router.navigate(['/admin/docentes', id]);
  }

  // ── ASIGNAR MATERIAS — PASO 1 ──────────────────────────────

  async abrirModalAsignacion(docente: DocenteAdmin): Promise<void> {
    if (!this.programas.length) {
      Swal.fire({ icon: 'warning', title: 'Sin carreras', confirmButtonColor: '#d32f2f' });
      return;
    }

    let idsYaAsignados: number[] = [];
    try { idsYaAsignados = await this.svc.getMateriasIdsAsignadas(docente.id).toPromise() || []; } catch {}

    const carrerasHtml = this.programas.map(p => `
      <label style="display:flex;align-items:center;gap:0.6rem;padding:0.6rem 0.75rem;border-radius:8px;
        border:1.5px solid #e0e0e0;cursor:pointer;margin-bottom:0.5rem;background:white;"
        onmouseenter="this.style.borderColor='#d32f2f'"
        onmouseleave="this.style.borderColor=this.querySelector('input').checked?'#d32f2f':'#e0e0e0'">
        <input type="checkbox" value="${p.id}" style="accent-color:#d32f2f;width:16px;height:16px;"
          onchange="this.closest('label').style.borderColor=this.checked?'#d32f2f':'#e0e0e0'">
        <div>
          <div style="font-weight:600;font-size:0.9rem;color:#333;">${p.nombre}</div>
          <div style="font-size:0.78rem;color:#888;">${p.codigo} · ${p.duracionSemestres} semestres</div>
        </div>
      </label>`).join('');

    const nombre = `${docente.usuario?.nombre} ${docente.usuario?.apellidoPaterno}`;

    const { isConfirmed, value: pids } = await Swal.fire({
      title: '📚 Asignar Materias',
      html: `<div style="text-align:left;">
        <div style="background:#f5f5f5;border-radius:8px;padding:0.65rem 1rem;margin-bottom:1rem;">
          <span style="font-weight:600;color:#333;">👤 ${nombre}</span>
          <span style="color:#888;font-size:0.85rem;margin-left:0.5rem;">· ${docente.numeroEmpleado || ''}</span>
        </div>
        <p style="font-weight:500;font-size:0.9rem;color:#555;margin-bottom:0.75rem;">Paso 1 de 2 — Selecciona las carreras:</p>
        <div style="max-height:340px;overflow-y:auto;">${carrerasHtml}</div>
      </div>`,
      showCancelButton: true,
      confirmButtonText: 'Siguiente →',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d32f2f',
      width: '520px',
      preConfirm: () => {
        const ids = Array.from(document.querySelectorAll<HTMLInputElement>('input[type=checkbox]:checked')).map(c => Number(c.value));
        if (!ids.length) { Swal.showValidationMessage('Selecciona al menos una carrera'); return false; }
        return ids;
      }
    });

    if (!isConfirmed || !pids) return;
    await this.mostrarPaso2(docente, pids as number[], idsYaAsignados);
  }

  // ── ASIGNAR MATERIAS — PASO 2 ──────────────────────────────

  private async mostrarPaso2(docente: DocenteAdmin, programaIds: number[], idsYaAsignados: number[]): Promise<void> {
    Swal.fire({ title: 'Cargando materias...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    const resultados = await Promise.all(programaIds.map(pid => this.svc.getProgramaDetail(pid).toPromise().catch(() => null)));
    Swal.close();

    const grupos = resultados.filter(r => r !== null) as any[];

    const programasHtml = grupos.map(g => {
      const semMap = new Map<number, Materia[]>();
      for (const m of g.materias || []) { if (!semMap.has(m.semestre)) semMap.set(m.semestre, []); semMap.get(m.semestre)!.push(m); }

      const semsHtml = Array.from(semMap.entries()).sort(([a],[b]) => a-b).map(([sem, mats]) => `
        <div style="margin-bottom:0.5rem;">
          <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.4rem;">
            <span style="background:#ffebee;color:#d32f2f;padding:0.1rem 0.5rem;border-radius:10px;font-size:0.75rem;font-weight:700;">Sem ${sem}</span>
            <button onclick="const c=document.querySelectorAll('.mp${g.id}s${sem}');const a=[...c].every(x=>x.checked);c.forEach(x=>x.checked=!a);"
              style="background:none;border:none;color:#1565c0;font-size:0.72rem;cursor:pointer;text-decoration:underline;">Sel. semestre</button>
          </div>
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:0.3rem;">
            ${mats.map((m: Materia) => { const ya = idsYaAsignados.includes(m.id); return `
              <label style="display:flex;align-items:center;gap:0.4rem;padding:0.35rem 0.5rem;border-radius:6px;
                border:1px solid ${ya?'#c8e6c9':'#e0e0e0'};background:${ya?'#f1f8e9':'white'};cursor:pointer;font-size:0.78rem;">
                <input type="checkbox" class="mat-check mp${g.id} mp${g.id}s${sem}" value="${m.id}" ${ya?'checked':''} style="accent-color:#d32f2f;">
                <div><div style="font-weight:600;color:#333;">${m.codigo}</div><div style="color:#777;font-size:0.72rem;">${m.nombre}</div></div>
              </label>`;}).join('')}
          </div>
        </div>`).join('');

      return `<div style="margin-bottom:1rem;border:1.5px solid #e0e0e0;border-radius:10px;overflow:hidden;">
        <div style="background:#d32f2f;color:white;padding:0.5rem 0.75rem;display:flex;justify-content:space-between;align-items:center;">
          <span style="font-weight:700;font-size:0.85rem;">${g.nombre}</span>
          <span style="font-size:0.75rem;opacity:0.85;">${g.codigo}</span>
        </div>
        <div style="padding:0.75rem;">
          <button onclick="const c=document.querySelectorAll('.mp${g.id}');const a=[...c].every(x=>x.checked);c.forEach(x=>x.checked=!a);"
            style="background:#e3f2fd;color:#1565c0;border:none;border-radius:6px;padding:0.25rem 0.6rem;font-size:0.75rem;cursor:pointer;margin-bottom:0.6rem;">☑ Seleccionar todas</button>
          ${semsHtml}
        </div>
      </div>`;
    }).join('');

    const { isConfirmed, value: selectedIds } = await Swal.fire({
      title: '📚 Asignar Materias',
      html: `<div style="text-align:left;">
        <p style="font-weight:500;font-size:0.9rem;color:#555;margin-bottom:0.75rem;">Paso 2 de 2 — Selecciona las materias:</p>
        <div style="max-height:400px;overflow-y:auto;">${programasHtml}</div>
      </div>`,
      showCancelButton: true,
      confirmButtonText: '💾 Guardar asignación',
      cancelButtonText: '← Volver',
      confirmButtonColor: '#d32f2f',
      width: '640px',
      preConfirm: () => Array.from(document.querySelectorAll<HTMLInputElement>('.mat-check:checked')).map(c => Number(c.value))
    });

    if (!isConfirmed) { this.abrirModalAsignacion(docente); return; }
    if (!selectedIds?.length) { Swal.fire({ icon:'info', title:'Sin cambios', confirmButtonColor:'#d32f2f' }); return; }
    this.guardarAsignacion(docente, selectedIds as number[]);
  }

  private guardarAsignacion(docente: DocenteAdmin, materiaIds: number[]): void {
    Swal.fire({ title: 'Guardando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    this.svc.asignarMaterias(docente.id, materiaIds).subscribe({
      next: (res) => {
        Swal.fire({
          icon: 'success', title: '¡Asignación guardada!',
          html: `<div style="background:#e8f5e9;border-radius:8px;padding:0.75rem;font-size:0.9rem;">
            ✅ Asignadas: <strong>${res.asignadas}</strong>
            ${res.duplicadas > 0 ? `<br>🔁 Ya asignadas: <strong>${res.duplicadas}</strong>` : ''}
          </div>`,
          confirmButtonColor: '#d32f2f', confirmButtonText: 'Ver detalle',
          showCancelButton: true, cancelButtonText: 'Cerrar'
        }).then(r => { this.loadDocentes(); if (r.isConfirmed) this.verDetalle(docente.id); });
      },
      error: () => Swal.fire({ icon:'error', title:'Error', confirmButtonColor:'#d32f2f' })
    });
  }

  // ── ✅ NUEVO: LIMPIAR TODAS LAS MATERIAS ───────────────────

  // ── ✅ REEMPLAZAR el método limpiarMaterias en docente-list.component.ts ──
//
// Cambios:
//  1. El tipo de respuesta ahora es { planeacionesEliminadas, materiasEliminadas }
//  2. El SweetAlert de éxito muestra el detalle de qué se eliminó

  limpiarMaterias(docente: DocenteAdmin): void {
    const nombre = this.getNombreCompleto(docente);
    const total  = docente.totalMateriasAsignadas;

    Swal.fire({
      title: '¿Eliminar todas las materias?',
      html: `
        <div style="text-align:left;">
          <div style="background:#f5f5f5;border-radius:8px;padding:0.75rem 1rem;margin-bottom:1rem;">
            <span style="font-weight:600;color:#333;">👤 ${nombre}</span>
          </div>
          <div style="background:#ffebee;border:1.5px solid #ef9a9a;border-radius:8px;padding:0.85rem 1rem;font-size:0.9rem;color:#c62828;">
            <p style="margin:0;">⚠️ Se eliminarán permanentemente:</p>
            <ul style="margin:0.5rem 0 0 1.2rem;padding:0;">
              <li>Las <strong>${total} materia${total !== 1 ? 's' : ''}</strong> asignadas</li>
              <li>Todas las <strong>planeaciones</strong> que subió para esas materias</li>
            </ul>
            <p style="margin:0.5rem 0 0;font-size:0.82rem;opacity:0.85;">Podrás volver a asignar materias cuando lo necesites.</p>
          </div>
        </div>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '🗑️ Sí, eliminar todo',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#c62828',
      width: '460px',
    }).then(result => {
      if (!result.isConfirmed) return;

      Swal.fire({ title: 'Eliminando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

      this.svc.clearTodasLasMaterias(docente.id).subscribe({
        next: (res) => {
          Swal.fire({
            icon: 'success',
            title: 'Historial limpiado',
            html: `
              <p style="margin-bottom:0.75rem;">Se eliminó el historial de <strong>${nombre}</strong>:</p>
              <div style="background:#f5f5f5;border-radius:8px;padding:0.75rem 1rem;font-size:0.9rem;text-align:left;">
                <div>📚 Materias eliminadas: <strong>${res.materiasEliminadas}</strong></div>
                <div>📋 Planeaciones eliminadas: <strong>${res.planeacionesEliminadas}</strong></div>
              </div>
              <p style="margin-top:0.75rem;color:#888;font-size:0.85rem;">Ya puedes asignar nuevas materias.</p>`,
            confirmButtonColor: '#d32f2f',
            confirmButtonText: 'Asignar nuevas materias',
            showCancelButton: true,
            cancelButtonText: 'Cerrar'
          }).then(r => {
            this.loadDocentes();
            if (r.isConfirmed) this.abrirModalAsignacion({ ...docente, totalMateriasAsignadas: 0 });
          });
        },
        error: () => Swal.fire({
          icon: 'error', title: 'Error',
          text: 'No se pudo limpiar el historial.',
          confirmButtonColor: '#d32f2f'
        })
      });
    });
  }

  // ── HELPERS ────────────────────────────────────────────────

  getNombreCompleto(d: DocenteAdmin): string {
    if (!d.usuario) return `Docente #${d.id}`;
    return `${d.usuario.nombre} ${d.usuario.apellidoPaterno} ${d.usuario.apellidoMaterno || ''}`.trim();
  }

  getInicial(d: DocenteAdmin): string {
    return (d.usuario?.nombre?.[0] || '?').toUpperCase();
  }
}