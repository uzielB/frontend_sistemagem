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
import Swal from 'sweetalert2';

// ✅ IMPORTAR SERVICIO
import { 
  SyllabusesService, 
  Syllabus, 
  LessonPlan,
  CreateLessonPlanDto
} from '../../../../../core/services/syllabuses.service';

interface Temario {
  id: number;
  materia: string;
  nombreArchivo: string;
  fechaSubida: string;
  tamano: number;
  estado?: string;
}

interface Planeacion {
  id: number;
  temarioId: number;
  materia: string;
  nombreArchivo: string;
  fechaSubida: string;
  estatus: string;
  version: number;
  observaciones?: string;
}

@Component({
  selector: 'app-syllabus',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule,
    MatChipsModule,
    MatInputModule
  ],
  templateUrl: './syllabus.component.html',
  styleUrls: ['./syllabus.component.css']
})
export class SyllabusComponent implements OnInit {
  
  // ============================================
  // PROPIEDADES
  // ============================================
  
  // Mensajes
  successMessage: string = '';
  errorMessage: string = '';
  
  // Control de carga
  isUploading: boolean = false;
  uploadProgress: number = 0;
  
  // Archivo seleccionado para PLANEACIÓN
  selectedFile: File | null = null;
  
  // Temario seleccionado para subir planeación
  temarioSeleccionadoId: number | null = null;
  
  // Formulario de filtro
  materiaControl = new FormControl('TODOS');
  
  // Datos de TEMARIOS (solo lectura)
  temarios: Temario[] = [];
  materias: string[] = ['TODOS'];
  
  // Datos de PLANEACIONES (subidas por el docente)
  planeaciones: Planeacion[] = [];
  
  // Datos del backend
  syllabuses: Syllabus[] = [];
  lessonPlans: LessonPlan[] = [];

  constructor(
    private syllabusesService: SyllabusesService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  // ============================================
  // CARGAR DATOS DESDE BACKEND
  // ============================================

  /**
   * ✅ Cargar temarios (solo lectura) y planeaciones
   */
  loadData(): void {
    this.errorMessage = '';

    // Cargar TEMARIOS (subidos por Admin)
    this.syllabusesService.getMySyllabuses().subscribe({
      next: (syllabuses) => {
        this.syllabuses = syllabuses;
        this.transformSyllabusesToUI();
        
        // Cargar PLANEACIONES (subidas por el docente)
        this.loadMyLessonPlans();
      },
      error: (error) => {
        console.error('❌ Error al cargar temarios:', error);
        this.errorMessage = 'Error al cargar temarios. Usando datos de demostración.';
        

      }
    });
  }

  /**
   * ✅ Cargar mis planeaciones
   */
  loadMyLessonPlans(): void {
    this.syllabusesService.getMyLessonPlans().subscribe({
      next: (lessonPlans) => {
        this.lessonPlans = lessonPlans;
        this.transformLessonPlansToUI();
        
        this.successMessage = 'Datos cargados exitosamente';
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('❌ Error al cargar planeaciones:', error);
        // Las planeaciones son opcionales
      }
    });
  }

  /**
   * Transformar temarios a formato UI
   */
transformSyllabusesToUI(): void {
  this.temarios = this.syllabuses.map(s => ({
    id: s.id,
    materia: s.titulo || 'Sin título',
    nombreArchivo: s.nombreOriginal,
    fechaSubida: s.fechaSubida,
    tamano: s.tamanoMb,
    estado: 'Disponible',
    programa: s.subject?.programa?.nombre || 'Sin carrera'  // ✅ NUEVO
  }));

  // ✅ Filtro por CARRERAS en lugar de materias individuales
  const programasSet = new Set(
    this.temarios
      .map(t => (t as any).programa)
      .filter(p => p && p !== 'Sin carrera')
  );
  this.materias = ['TODOS', ...Array.from(programasSet)];
}



  /**
   * Transformar planeaciones a formato UI
   */
  transformLessonPlansToUI(): void {
    this.planeaciones = this.lessonPlans.map(p => ({
      id: p.id,
      temarioId: p.temarioId,
      materia: p.syllabus?.titulo || 'Sin título',
      nombreArchivo: p.nombreOriginal,
      fechaSubida: p.fechaSubida,
      estatus: this.getStatusTextFromEnum(p.estatus),
      version: p.version,
      observaciones: p.observaciones
    }));
  }


  // ============================================
  // DESCARGAR TEMARIOS (Solo lectura)
  // ============================================

  /**
   * ✅ Descargar temario (PDF del Admin)
   */
  downloadTemario(temario: Temario): void {
    this.syllabusesService.downloadSyllabus(temario.id).subscribe({
      next: (blob) => {
        this.syllabusesService.downloadFile(blob, temario.nombreArchivo);
        
        Swal.fire({
          icon: 'success',
          title: 'Descargando...',
          text: `Descargando ${temario.nombreArchivo}`,
          timer: 2000,
          showConfirmButton: false
        });
      },
      error: (error) => {
        console.error('❌ Error al descargar temario:', error);
        
        Swal.fire({
          icon: 'error',
          title: 'Error al descargar',
          text: 'No se pudo descargar el temario.',
          confirmButtonColor: '#1976d2'
        });
      }
    });
  }

  // ============================================
  // SUBIR PLANEACIÓN (Basada en temario)
  // ============================================

  /**
   * ✅ Seleccionar archivo para PLANEACIÓN
   */
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    
    if (file) {
      // Validar que sea PDF
      if (file.type !== 'application/pdf') {
        Swal.fire({
          icon: 'error',
          title: 'Archivo inválido',
          text: 'Solo se permiten archivos PDF',
          confirmButtonColor: '#1976d2'
        });
        return;
      }

      // Validar tamaño (10MB máximo)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        Swal.fire({
          icon: 'error',
          title: 'Archivo muy grande',
          text: 'El archivo no debe superar los 10MB',
          confirmButtonColor: '#1976d2'
        });
        return;
      }

      this.selectedFile = file;
      console.log('✅ Archivo de planeación seleccionado:', file.name);
    }
  }

  /**
   * ✅ Subir planeación basada en un temario
   */
  uploadPlaneacion(temarioId: number, materia: string): void {
    if (!this.selectedFile) {
      Swal.fire({
        icon: 'warning',
        title: 'Selecciona un archivo',
        text: 'Debes seleccionar un archivo PDF para subir tu planeación',
        confirmButtonColor: '#1976d2'
      });
      return;
    }

    // Pedir confirmación
    Swal.fire({
      title: 'Subir Planeación',
      html: `
        <p>¿Deseas subir tu planeación para <strong>${materia}</strong>?</p>
        <p class="text-muted">Archivo: ${this.selectedFile.name}</p>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, subir',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#1976d2'
    }).then((result) => {
      if (result.isConfirmed) {
        this.performUploadPlaneacion(temarioId, materia);
      }
    });
  }

  /**
   * ✅ Realizar subida de planeación al backend
   */
  performUploadPlaneacion(temarioId: number, materia: string): void {
    if (!this.selectedFile) return;

    this.isUploading = true;
    this.uploadProgress = 0;

    const asignacionId = 1; // TODO: Obtener del contexto real

    const data: CreateLessonPlanDto = {
      temarioId,
      asignacionId,
      titulo: `Planeación ${materia}`,
      descripcion: `Planeación para ${materia}`
    };

    // Simular progreso
    const progressInterval = setInterval(() => {
      if (this.uploadProgress < 90) {
        this.uploadProgress += 10;
      }
    }, 200);

    this.syllabusesService.uploadLessonPlan(this.selectedFile, data).subscribe({
      next: (lessonPlan) => {
        clearInterval(progressInterval);
        this.uploadProgress = 100;

        setTimeout(() => {
          this.isUploading = false;
          this.uploadProgress = 0;
          this.selectedFile = null;

          Swal.fire({
            icon: 'success',
            title: '¡Planeación subida!',
            text: 'Tu planeación ha sido subida exitosamente y está pendiente de revisión.',
            confirmButtonColor: '#1976d2'
          });

          // Recargar planeaciones
          this.loadMyLessonPlans();
        }, 500);
      },
      error: (error) => {
        clearInterval(progressInterval);
        this.isUploading = false;
        this.uploadProgress = 0;

        console.error('❌ Error al subir planeación:', error);

        Swal.fire({
          icon: 'error',
          title: 'Error al subir',
          text: error.error?.message || 'Ocurrió un error al subir la planeación.',
          confirmButtonColor: '#1976d2'
        });
      }
    });
  }

  // ============================================
  // PLANEACIONES - Ver y descargar
  // ============================================

  /**
   * ✅ Descargar mi planeación
   */
  downloadPlaneacion(planeacion: Planeacion): void {
    this.syllabusesService.downloadLessonPlan(planeacion.id).subscribe({
      next: (blob) => {
        this.syllabusesService.downloadFile(blob, planeacion.nombreArchivo);
        
        Swal.fire({
          icon: 'success',
          title: 'Descargando...',
          text: `Descargando ${planeacion.nombreArchivo}`,
          timer: 2000,
          showConfirmButton: false
        });
      },
      error: (error) => {
        console.error('❌ Error al descargar planeación:', error);
        
        Swal.fire({
          icon: 'error',
          title: 'Error al descargar',
          text: 'No se pudo descargar la planeación.',
          confirmButtonColor: '#1976d2'
        });
      }
    });
  }

  /**
   * ✅ Ver observaciones de la planeación
   */
  verObservaciones(planeacion: Planeacion): void {
    if (!planeacion.observaciones) {
      Swal.fire({
        icon: 'info',
        title: 'Sin observaciones',
        text: 'Esta planeación no tiene observaciones.',
        confirmButtonColor: '#1976d2'
      });
      return;
    }

    Swal.fire({
      icon: 'info',
      title: 'Observaciones',
      html: `
        <div style="text-align: left;">
          <p><strong>Estatus:</strong> ${planeacion.estatus}</p>
          <p><strong>Versión:</strong> ${planeacion.version}</p>
          <hr>
          <p>${planeacion.observaciones}</p>
        </div>
      `,
      confirmButtonColor: '#1976d2'
    });
  }

  // ============================================
  // FILTROS Y HELPERS
  // ============================================

  /**
   * Obtener temarios filtrados
   */
get temariosFiltrados(): Temario[] {
  const seleccionado = this.materiaControl.value;
  if (seleccionado === 'TODOS') return this.temarios;
  return this.temarios.filter(t => (t as any).programa === seleccionado);
}

  /**
   * Formatear fecha
   */
  formatDate(fechaISO: string): string {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Obtener texto de estatus desde enum
   */
  getStatusTextFromEnum(estatus: string): string {
    const statusMap: { [key: string]: string } = {
      'PENDIENTE_REVISION': 'Pendiente de Revisión',
      'EN_REVISION': 'En Revisión',
      'APROBADA': 'Aprobada',
      'RECHAZADA': 'Rechazada',
      'CON_OBSERVACIONES': 'Con Observaciones'
    };
    return statusMap[estatus] || estatus;
  }

  /**
   * Obtener clase CSS según estatus
   */
  getEstatusClass(estatus: string): string {
    const statusMap: { [key: string]: string } = {
      'Aprobada': 'status-approved',
      'Pendiente de Revisión': 'status-pending',
      'Rechazada': 'status-rejected',
      'En Revisión': 'status-reviewing',
      'Con Observaciones': 'status-observations'
    };
    return statusMap[estatus] || 'status-pending';
  }

  // NOTA: deleteTemario NO existe aquí porque el docente NO puede eliminar temarios
  // Solo puede VER y DESCARGAR temarios
  // Y puede SUBIR planeaciones
}