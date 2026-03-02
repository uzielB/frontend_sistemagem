import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import Swal from 'sweetalert2';

import {
  SyllabusesService,
  Syllabus,
  LessonPlan,
  CreateLessonPlanDto
} from '../../../../../core/services/syllabuses.service';

interface Temario {
  id: number;
  materia: string;
  codigoMateria: string;
  semestre: number;
  programa: string;
  nombreArchivo: string;
  fechaSubida: string;
  tamano: number;
  estado?: string;
  rutaArchivo?: string;
}

interface Planeacion {
  id: number;
  temarioId: number;
  materia: string;
  codigoMateria: string;
  programa: string;
  nombreArchivo: string;
  fechaSubida: string;
  estatus: string;
  estatusEnum: string;
  version: number;
  observaciones?: string;
  descripcion?: string;
}

@Component({
  selector: 'app-syllabus',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCardModule, MatButtonModule,
    MatIconModule, MatProgressBarModule, MatProgressSpinnerModule,
    MatSelectModule, MatFormFieldModule, MatChipsModule, MatInputModule, MatTooltipModule
  ],
  templateUrl: './syllabus.component.html',
  styleUrls: ['./syllabus.component.css']
})
export class SyllabusComponent implements OnInit {

  successMessage = '';
  errorMessage = '';
  isLoading = false;
  isUploading = false;

  materiaControl = new FormControl('TODOS');
  semestreControl = new FormControl('TODOS');

  temarios: Temario[] = [];
  materias: string[] = [];
  semestres: string[] = ['TODOS','1','2','3','4','5','6','7','8','9'];
  planeaciones: Planeacion[] = [];
  syllabuses: Syllabus[] = [];
  lessonPlans: LessonPlan[] = [];

  constructor(private syllabusesService: SyllabusesService) {}

  ngOnInit(): void { this.loadData(); }

  // ============================================
  // CARGA DE DATOS
  // ============================================

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.syllabusesService.getMySyllabuses().subscribe({
      next: (syllabuses) => {
        this.syllabuses = syllabuses;
        this.transformSyllabusesToUI();
        this.loadMyLessonPlans();
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Error al cargar temarios.';
        this.isLoading = false;
      }
    });
  }

  loadMyLessonPlans(): void {
    this.syllabusesService.getMyLessonPlans().subscribe({
      next: (lessonPlans) => {
        this.lessonPlans = lessonPlans;
        this.transformLessonPlansToUI();
      },
      error: () => {}
    });
  }

  transformSyllabusesToUI(): void {
    this.temarios = this.syllabuses.map(s => ({
      id: s.id,
      materia: s.subject?.nombre || s.titulo || 'Sin título',
      codigoMateria: s.subject?.codigo || '',
      semestre: s.subject?.semestre || 0,
      programa: s.subject?.programa?.nombre || 'Sin carrera',
      nombreArchivo: s.nombreOriginal,
      fechaSubida: s.fechaSubida,
      tamano: s.tamanoMb,
      estado: 'Disponible',
      rutaArchivo: s.rutaArchivo || s.archivoPdf
    }));
    const set = new Set(this.temarios.map(t => t.programa).filter(p => p && p !== 'Sin carrera').sort());
    this.materias = [...Array.from(set)];
  }

  transformLessonPlansToUI(): void {
    this.planeaciones = this.lessonPlans.map(p => ({
      id: p.id,
      temarioId: p.temarioId,
      materia: p.syllabus?.subject?.nombre || p.syllabus?.titulo || 'Sin título',
      codigoMateria: p.syllabus?.subject?.codigo || '',
      programa: p.syllabus?.subject?.programa?.nombre || '',
      nombreArchivo: p.nombreOriginal,
      fechaSubida: p.fechaSubida,
      estatus: this.getStatusText(p.estatus),
      estatusEnum: p.estatus,
      version: p.version,
      observaciones: p.observaciones,
      descripcion: p.descripcion
    }));
  }

  get temariosFiltrados(): Temario[] {
    let f = this.temarios;
    const c = this.materiaControl.value;
    if (c && c !== 'TODOS') f = f.filter(t => t.programa === c);
    const s = this.semestreControl.value;
    if (s && s !== 'TODOS') f = f.filter(t => t.semestre === parseInt(s));
    return f;
  }

  viewTemario(temario: Temario): void {
    if (!temario.rutaArchivo) {
      Swal.fire({ icon: 'error', title: 'Archivo no disponible', text: 'Este temario no tiene un archivo asociado.', confirmButtonColor: '#d32f2f' });
      return;
    }
    window.open(`http://localhost:3000/${temario.rutaArchivo.replace(/\\/g, '/')}`, '_blank');
  }

  // ============================================
  // MODAL PLANEACIONES
  // ============================================

  verPlaneaciones(temario: Temario): void {
    const planeacionesDelTemario = this.planeaciones
      .filter(p => p.temarioId === temario.id)
      .sort((a, b) => b.version - a.version);
    this.mostrarModalPlaneaciones(temario, planeacionesDelTemario);
  }

  private mostrarModalPlaneaciones(temario: Temario, planeaciones: Planeacion[]): void {
    const cfg: { [k: string]: { bg: string; color: string; icon: string; label: string } } = {
      'APROBADA':           { bg: '#e8f5e9', color: '#2e7d32', icon: '✅', label: 'Aprobada' },
      'PENDIENTE_REVISION': { bg: '#fff3e0', color: '#e65100', icon: '⏳', label: 'Pendiente' },
      'RECHAZADA':          { bg: '#ffebee', color: '#c62828', icon: '❌', label: 'Rechazada' },
      'EN_REVISION':        { bg: '#e3f2fd', color: '#1565c0', icon: '🔍', label: 'En Revisión' },
      'CON_OBSERVACIONES':  { bg: '#fce4ec', color: '#880e4f', icon: '💬', label: 'Con Observaciones' }
    };

    const ultima = planeaciones[0] || null;
    const puedeResubir = ultima &&
      (ultima.estatusEnum === 'RECHAZADA' || ultima.estatusEnum === 'CON_OBSERVACIONES');

    const filas = planeaciones.length > 0
      ? planeaciones.map(p => {
          const c = cfg[p.estatusEnum] || cfg['PENDIENTE_REVISION'];
          const esUltimaConProblema = p.id === ultima?.id && puedeResubir;
          return `
            <tr style="border-bottom:1px solid #f0f0f0;">
              <td style="padding:0.75rem 0.6rem; font-size:0.85rem; color:#555; white-space:nowrap;">
                ${this.formatDate(p.fechaSubida)}
              </td>
              <td style="padding:0.75rem 0.6rem;">
                <span style="background:${c.bg};color:${c.color};padding:0.25rem 0.6rem;
                  border-radius:12px;font-size:0.78rem;font-weight:600;white-space:nowrap;">
                  ${c.icon} ${c.label}
                </span>
              </td>
              <td style="padding:0.75rem 0.6rem;font-size:0.82rem;color:#777;text-align:center;">v${p.version}</td>
              <td style="padding:0.75rem 0.6rem;">
                <div style="display:flex;gap:0.4rem;flex-wrap:wrap;">
                  <button onclick="document.dispatchEvent(new CustomEvent('swal-ver-obs',{detail:${p.id}}))"
                    style="background:none;border:1px solid #888;color:#555;padding:0.25rem 0.6rem;
                      border-radius:6px;cursor:pointer;font-size:0.78rem;">
                    ${p.observaciones ? '💬 Ver notas' : 'ℹ️ Detalles'}
                  </button>
                  ${esUltimaConProblema ? `
                    <button onclick="document.dispatchEvent(new CustomEvent('swal-resubir',{detail:${p.id}}))"
                      style="background:#d32f2f;border:none;color:white;padding:0.25rem 0.7rem;
                        border-radius:6px;cursor:pointer;font-size:0.78rem;font-weight:600;">
                      📤 Re-subir
                    </button>
                  ` : ''}
                </div>
              </td>
            </tr>`;
        }).join('')
      : `<tr><td colspan="4" style="padding:2.5rem;text-align:center;color:#999;font-size:0.9rem;">
           Aún no has subido ninguna planeación para esta materia
         </td></tr>`;

    const onVerObs = (e: Event) => {
      const id = (e as CustomEvent).detail;
      const p = this.planeaciones.find(x => x.id === id);
      if (p) { Swal.close(); setTimeout(() => this.verObservaciones(p, temario, planeaciones), 300); }
    };
    const onResubir = (e: Event) => {
      const id = (e as CustomEvent).detail;
      const p = this.planeaciones.find(x => x.id === id);
      if (p) { Swal.close(); setTimeout(() => this.resubirPlaneacion(temario, p, planeaciones), 300); }
    };

    document.addEventListener('swal-ver-obs', onVerObs);
    document.addEventListener('swal-resubir', onResubir);

    Swal.fire({
      title: `📋 Planeaciones — ${temario.codigoMateria}`,
      html: `
        <div style="text-align:left;">
          <div style="background:#f5f5f5;border-radius:8px;padding:0.6rem 1rem;margin-bottom:1rem;">
            <p style="margin:0;font-size:0.85rem;color:#555;">
              <strong>${temario.materia}</strong> · Semestre ${temario.semestre} · ${temario.programa}
            </p>
            ${puedeResubir ? `
              <p style="margin:0.4rem 0 0;font-size:0.8rem;color:#c62828;font-weight:500;">
                ⚠️ Tu última versión necesita correcciones — usa "Re-subir" para enviar una versión corregida
              </p>` : ''}
          </div>
          <div style="overflow-x:auto;border-radius:8px;border:1px solid #e0e0e0;max-height:55vh;overflow-y:auto;">
            <table style="width:100%;border-collapse:collapse;font-size:0.88rem;">
              <thead style="position:sticky;top:0;">
                <tr style="background:#d32f2f;color:white;">
                  <th style="padding:0.65rem 0.6rem;text-align:left;font-weight:600;">Fecha</th>
                  <th style="padding:0.65rem 0.6rem;text-align:left;font-weight:600;">Estatus</th>
                  <th style="padding:0.65rem 0.6rem;text-align:center;font-weight:600;">Ver.</th>
                  <th style="padding:0.65rem 0.6rem;text-align:left;font-weight:600;">Acciones</th>
                </tr>
              </thead>
              <tbody>${filas}</tbody>
            </table>
          </div>
          <div style="margin-top:1rem;text-align:center;">
            <button id="btn-nueva-planeacion" style="background:#d32f2f;color:white;border:none;
              padding:0.6rem 1.5rem;border-radius:8px;cursor:pointer;font-size:0.9rem;font-weight:600;">
              📤 Subir nueva planeación
            </button>
          </div>
        </div>`,
      showConfirmButton: false,
      showCloseButton: true,
      width: '620px',
      didOpen: () => {
        document.getElementById('btn-nueva-planeacion')?.addEventListener('click', () => {
          Swal.close();
          setTimeout(() => this.uploadPlaneacion(temario), 300);
        });
      },
      willClose: () => {
        document.removeEventListener('swal-ver-obs', onVerObs);
        document.removeEventListener('swal-resubir', onResubir);
      }
    });
  }

  // ============================================
  // RE-SUBIR PLANEACIÓN
  // Muestra observaciones → luego modal de subida con modalidad pre-seleccionada
  // ============================================

  private resubirPlaneacion(temario: Temario, planeacionAnterior: Planeacion, todas: Planeacion[]): void {
    const modalidadAnterior = planeacionAnterior.descripcion?.includes('[SABATINO]') ? 'SABATINO'
      : planeacionAnterior.descripcion?.includes('[ESCOLARIZADO]') ? 'ESCOLARIZADO' : null;
    const esRechazada = planeacionAnterior.estatusEnum === 'RECHAZADA';

    Swal.fire({
      title: esRechazada ? '❌ Planeación Rechazada' : '💬 Con Observaciones',
      html: `
        <div style="text-align:left;">
          <div style="background:#f5f5f5;border-radius:8px;padding:0.75rem 1rem;margin-bottom:1rem;">
            <p style="margin:0;font-size:0.85rem;color:#555;">
              Versión anterior: <strong>v${planeacionAnterior.version}</strong>
              · ${this.formatDate(planeacionAnterior.fechaSubida)}
            </p>
          </div>
          ${planeacionAnterior.observaciones ? `
            <p style="font-weight:600;color:#333;margin:0 0 0.5rem;">
              ${esRechazada ? 'Motivo del rechazo:' : 'Observaciones del revisor:'}
            </p>
            <div style="background:${esRechazada ? '#ffebee' : '#fce4ec'};
              border-left:4px solid ${esRechazada ? '#c62828' : '#880e4f'};
              border-radius:4px;padding:0.75rem 1rem;color:#333;font-size:0.9rem;line-height:1.5;">
              ${planeacionAnterior.observaciones}
            </div>
          ` : `<p style="color:#999;font-style:italic;font-size:0.9rem;">El revisor no dejó comentarios adicionales.</p>`}
          <p style="margin:1rem 0 0;color:#555;font-size:0.9rem;">
            Haz clic en <strong>"Corregir y Re-subir"</strong> para enviar una versión corregida.
          </p>
        </div>`,
      showCancelButton: true,
      confirmButtonText: '📤 Corregir y Re-subir',
      cancelButtonText: 'Volver',
      confirmButtonColor: '#d32f2f',
      width: '500px'
    }).then((result) => {
      if (result.isConfirmed) {
        this.uploadPlaneacion(temario, modalidadAnterior, planeacionAnterior.version + 1);
      } else {
        this.mostrarModalPlaneaciones(temario, todas);
      }
    });
  }

  // ============================================
  // SUBIR / RE-SUBIR PLANEACIÓN
  // ============================================

  uploadPlaneacion(temario: Temario, modalidadPreseleccionada?: string | null, nuevaVersion?: number): void {
    const eBorder = modalidadPreseleccionada === 'ESCOLARIZADO' ? '#d32f2f' : '#e0e0e0';
    const sBorder = modalidadPreseleccionada === 'SABATINO'     ? '#d32f2f' : '#e0e0e0';
    const eChecked = modalidadPreseleccionada === 'ESCOLARIZADO' ? 'checked' : '';
    const sChecked = modalidadPreseleccionada === 'SABATINO'     ? 'checked' : '';
    const esResubida = !!modalidadPreseleccionada;

    Swal.fire({
      title: esResubida ? `📤 Re-subir — v${nuevaVersion || ''}` : 'Subir Planeación',
      html: `
        <div style="text-align:left;padding:0 0.5rem;">
          <div style="background:#f5f5f5;border-radius:8px;padding:0.75rem 1rem;margin-bottom:1rem;">
            <p style="margin:0;font-size:0.85rem;color:#666;">Temario base:</p>
            <p style="margin:0.25rem 0 0;font-weight:600;color:#333;">${temario.codigoMateria} — ${temario.materia}</p>
            <p style="margin:0.25rem 0 0;font-size:0.8rem;color:#888;">Semestre ${temario.semestre} · ${temario.programa}</p>
          </div>
          ${esResubida ? `
            <div style="background:#fff3e0;border-left:4px solid #e65100;border-radius:4px;
              padding:0.6rem 0.9rem;margin-bottom:1rem;font-size:0.85rem;color:#555;">
              ⚠️ Estás enviando una versión corregida. Asegúrate de haber aplicado las correcciones.
            </div>` : ''}

          <label style="display:block;margin-bottom:0.4rem;font-weight:500;font-size:0.9rem;">
            Título <span style="color:#999;font-weight:400;">(opcional)</span>
          </label>
          <input id="swal-titulo" class="swal2-input"
            style="margin:0 0 1rem;width:100%;box-sizing:border-box;"
            placeholder="Ej: Planeación ${temario.codigoMateria} - Grupo A">

          <label style="display:block;margin-bottom:0.4rem;font-weight:500;font-size:0.9rem;">
            Modalidad <span style="color:#d32f2f;">*</span>
          </label>
          <div style="display:flex;gap:0.75rem;margin-bottom:0.5rem;">
            <label id="label-escolarizado" style="flex:1;display:flex;align-items:center;gap:0.5rem;
              border:2px solid ${eBorder};border-radius:8px;padding:0.6rem 0.8rem;cursor:pointer;"
              onclick="document.getElementById('mod-escolarizado').checked=true;
                document.getElementById('label-escolarizado').style.borderColor='#d32f2f';
                document.getElementById('label-sabatino').style.borderColor='#e0e0e0';">
              <input type="radio" id="mod-escolarizado" name="modalidad" value="ESCOLARIZADO"
                style="accent-color:#d32f2f;" ${eChecked}> 🎓 Escolarizado
            </label>
            <label id="label-sabatino" style="flex:1;display:flex;align-items:center;gap:0.5rem;
              border:2px solid ${sBorder};border-radius:8px;padding:0.6rem 0.8rem;cursor:pointer;"
              onclick="document.getElementById('mod-sabatino').checked=true;
                document.getElementById('label-sabatino').style.borderColor='#d32f2f';
                document.getElementById('label-escolarizado').style.borderColor='#e0e0e0';">
              <input type="radio" id="mod-sabatino" name="modalidad" value="SABATINO"
                style="accent-color:#d32f2f;" ${sChecked}> 📅 Sabatino
            </label>
          </div>
          <p id="swal-modalidad-error" style="color:#d32f2f;font-size:0.8rem;margin:0 0 0.75rem;display:none;">
            ⚠️ Debes seleccionar una modalidad
          </p>

          <label style="display:block;margin-bottom:0.4rem;font-weight:500;font-size:0.9rem;">
            Archivo PDF <span style="color:#d32f2f;">*</span>
          </label>
          <div id="swal-dropzone" style="border:2px dashed #d32f2f;border-radius:8px;padding:1.5rem;
            text-align:center;cursor:pointer;background:#fff5f5;"
            onclick="document.getElementById('swal-file').click()">
            <div style="color:#d32f2f;font-size:2rem;">📄</div>
            <p id="swal-file-label" style="margin:0.5rem 0 0;color:#666;font-size:0.9rem;">
              Haz clic para seleccionar tu planeación en PDF<br>
              <span style="font-size:0.8rem;color:#999;">Máximo 10MB</span>
            </p>
          </div>
          <input type="file" id="swal-file" accept=".pdf" style="display:none"
            onchange="const f=this.files[0];if(f){
              document.getElementById('swal-file-label').innerHTML='<strong style=color:#2e7d32>'+f.name+'</strong><br><span style=font-size:0.8rem;color:#666>'+(f.size/1024/1024).toFixed(2)+' MB</span>';
              document.getElementById('swal-dropzone').style.background='#f1f8e9';
              document.getElementById('swal-dropzone').style.borderColor='#4caf50';}">
          <p id="swal-file-error" style="color:#d32f2f;font-size:0.8rem;margin:0.5rem 0 0;display:none;">
            ⚠️ Debes seleccionar un archivo PDF
          </p>
        </div>`,
      showCancelButton: true,
      confirmButtonText: esResubida ? '📤 Enviar versión corregida' : 'Subir Planeación',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d32f2f',
      width: '500px',
      preConfirm: () => {
        const fileInput = document.getElementById('swal-file') as HTMLInputElement;
        const tituloInput = document.getElementById('swal-titulo') as HTMLInputElement;
        const modalidadInput = document.querySelector('input[name="modalidad"]:checked') as HTMLInputElement;
        const errorFile = document.getElementById('swal-file-error')!;
        const errorMod = document.getElementById('swal-modalidad-error')!;
        if (!modalidadInput) { errorMod.style.display = 'block'; return false; }
        errorMod.style.display = 'none';
        if (!fileInput.files || fileInput.files.length === 0) { errorFile.style.display = 'block'; return false; }
        errorFile.style.display = 'none';
        const file = fileInput.files[0];
        if (file.size > 10 * 1024 * 1024) { Swal.showValidationMessage('El archivo no debe superar los 10MB'); return false; }
        if (file.type !== 'application/pdf') { Swal.showValidationMessage('Solo se permiten archivos PDF'); return false; }
        return { file, titulo: tituloInput.value.trim() || `Planeación ${temario.codigoMateria}`, modalidad: modalidadInput.value };
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        this.performUpload(temario, result.value.file, result.value.titulo, result.value.modalidad);
      }
    });
  }

  private performUpload(temario: Temario, file: File, titulo: string, modalidad: string): void {
    this.isUploading = true;
    Swal.fire({
      title: 'Subiendo planeación...',
      html: `<p style="color:#666">${file.name}</p>
        <p style="font-size:0.85rem;color:#999;">Modalidad: <strong>${modalidad === 'ESCOLARIZADO' ? '🎓 Escolarizado' : '📅 Sabatino'}</strong></p>`,
      allowOutsideClick: false, allowEscapeKey: false,
      didOpen: () => Swal.showLoading()
    });

    const data: CreateLessonPlanDto = {
      temarioId: temario.id,
      titulo,
      descripcion: `[${modalidad}] Planeación para ${temario.codigoMateria} - ${temario.materia}`
    };

    this.syllabusesService.uploadLessonPlan(file, data).subscribe({
      next: () => {
        this.isUploading = false;
        Swal.fire({
          icon: 'success',
          title: '¡Planeación enviada!',
          html: `<p>Tu planeación para <strong>${temario.codigoMateria}</strong> fue enviada exitosamente.</p>
            <p style="color:#666;font-size:0.9rem;">Modalidad: ${modalidad === 'ESCOLARIZADO' ? '🎓 Escolarizado' : '📅 Sabatino'}</p>
            <p style="color:#666;font-size:0.9rem;">El administrador la revisará pronto.</p>`,
          confirmButtonColor: '#d32f2f'
        });
        this.loadMyLessonPlans();
      },
      error: (error) => {
        this.isUploading = false;
        Swal.fire({ icon: 'error', title: 'Error al subir', text: error.error?.message || 'Ocurrió un error.', confirmButtonColor: '#d32f2f' });
      }
    });
  }

  // ============================================
  // VER OBSERVACIONES
  // ============================================

  verObservaciones(planeacion: Planeacion, temario?: Temario, todas?: Planeacion[]): void {
    const iconMap: { [k: string]: string } = {
      'APROBADA':'✅','RECHAZADA':'❌','CON_OBSERVACIONES':'💬','EN_REVISION':'🔍','PENDIENTE_REVISION':'⏳'
    };
    const puedeResubir = planeacion.estatusEnum === 'RECHAZADA' || planeacion.estatusEnum === 'CON_OBSERVACIONES';

    Swal.fire({
      title: `${iconMap[planeacion.estatusEnum] || '📋'} ${planeacion.estatus}`,
      html: `
        <div style="text-align:left;">
          <p><strong>Materia:</strong> ${planeacion.codigoMateria} — ${planeacion.materia}</p>
          <p><strong>Versión:</strong> v${planeacion.version}</p>
          <p><strong>Archivo:</strong> ${planeacion.nombreArchivo}</p>
          <p><strong>Fecha:</strong> ${this.formatDate(planeacion.fechaSubida)}</p>
          ${planeacion.observaciones ? `
            <hr>
            <p><strong>Notas del revisor:</strong></p>
            <div style="background:#f5f5f5;border-radius:8px;padding:0.75rem;margin-top:0.5rem;">
              <p style="margin:0;color:#333;">${planeacion.observaciones}</p>
            </div>` : `<p style="color:#999;font-style:italic;">Sin observaciones del revisor aún.</p>`}
        </div>`,
      showCancelButton: !!(temario && todas),
      confirmButtonText: puedeResubir ? '📤 Corregir y Re-subir' : 'Cerrar',
      cancelButtonText: 'Volver',
      confirmButtonColor: '#d32f2f'
    }).then((result) => {
      if (result.isConfirmed && puedeResubir && temario && todas) {
        this.resubirPlaneacion(temario, planeacion, todas);
      } else if ((result.isDismissed || !puedeResubir) && temario && todas) {
        this.mostrarModalPlaneaciones(temario, todas);
      }
    });
  }

  // ============================================
  // HELPERS
  // ============================================

  formatDate(fechaISO: string): string {
    if (!fechaISO) return '';
    return new Date(fechaISO).toLocaleDateString('es-MX', { year:'numeric', month:'short', day:'numeric' });
  }

  getStatusText(estatus: string): string {
    const map: { [k: string]: string } = {
      'PENDIENTE_REVISION':'Pendiente de Revisión','EN_REVISION':'En Revisión',
      'APROBADA':'Aprobada','RECHAZADA':'Rechazada','CON_OBSERVACIONES':'Con Observaciones'
    };
    return map[estatus] || estatus;
  }

  getEstatusClass(e: string): string {
    const m: { [k: string]: string } = { 'APROBADA':'status-approved','PENDIENTE_REVISION':'status-pending','RECHAZADA':'status-rejected','EN_REVISION':'status-reviewing','CON_OBSERVACIONES':'status-observations' };
    return m[e] || 'status-pending';
  }

  getEstatusIcon(e: string): string {
    const m: { [k: string]: string } = { 'APROBADA':'check_circle','PENDIENTE_REVISION':'hourglass_empty','RECHAZADA':'cancel','EN_REVISION':'search','CON_OBSERVACIONES':'chat_bubble' };
    return m[e] || 'help';
  }

  countPlaneaciones(temarioId: number): number {
    return this.planeaciones.filter(p => p.temarioId === temarioId).length;
  }

  getUltimoEstatus(temarioId: number): string | null {
    const planes = this.planeaciones.filter(p => p.temarioId === temarioId);
    if (planes.length === 0) return null;
    return planes.sort((a, b) => b.version - a.version)[0].estatusEnum;
  }
}