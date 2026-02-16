import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../../core/services/auth.service';
import { environment } from '../../../../../environments/environment';
// ✅ IMPORTAR TeachersService
import {
  TeachersService,
  TeacherAssignment,
  Student,
  AttendanceStatus,
  Attendance
} from '../../../../core/services/teachers.service';

type EstadoAsistencia = 'ASISTIO' | 'FALTO' | 'RETARDO' | null;

interface Alumno {
  id: number;
  matricula: string;
  nombreCompleto: string;
  estado: EstadoAsistencia;
  porcentajeAsistencia: number;
}

interface Asignacion {
  id: number;
  sistema: string;
  grupo: string;
  materia: string;
}

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonToggleModule
  ],
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.css']
})
export class AttendanceComponent implements OnInit {
  attendanceForm: FormGroup;
  displayedColumns: string[] = ['numero', 'matricula', 'nombreCompleto', 'estado', 'porcentaje'];
  
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  hasChanges = false;

  selectedDate: Date = new Date();
  maxDate: Date = new Date();

  // ✅ Datos desde el backend (ya no mock)
  asignaciones: Asignacion[] = [];
  alumnos: Alumno[] = [];
  asistenciasCargadas: Attendance[] = [];

  // ✅ Asignación seleccionada
  selectedAsignacion: TeacherAssignment | null = null;

  sistemas: string[] = ['TODOS', 'ESCOLARIZADO', 'SABATINO'];
  grupos: string[] = [];
  materias: string[] = [];

  selectedSistema = 'TODOS';
  selectedGrupo = 'TODOS';
  selectedMateria = 'TODOS';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private authService: AuthService,
    private router: Router,
    private teachersService: TeachersService // ✅ Inyectar servicio
  ) {
    this.attendanceForm = this.fb.group({
      fecha: [this.selectedDate],
      sistema: ['TODOS'],
      grupo: ['TODOS'],
      materia: ['TODOS'],
      alumnos: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.loadAssignments(); // ✅ Cargar desde backend
  }

  /**
   * ✅ NUEVO: Cargar asignaciones del docente desde el backend
   */
  loadAssignments(): void {
    this.teachersService.getMyAssignments().subscribe({
      next: (response: any) => {
        // Transformar a la estructura que usa tu HTML
        this.asignaciones = response.asignaciones.map((a: TeacherAssignment) => ({
          id: a.id,
          sistema: a.sistema,
          grupo: a.grupo,
          materia: a.materia
        }));

        this.loadFilters();

        if (this.asignaciones.length === 0) {
          this.errorMessage = 'No tienes asignaciones registradas en el sistema.';
        }
      },
      error: (error: any) => {
        console.error('❌ Error al cargar asignaciones:', error);
        this.errorMessage = 'Error al cargar tus asignaciones. Verifica tu conexión.';
        
        // Fallback a datos mock si falla
        this.useMockData();
        this.loadFilters();
      }
    });
  }

  /**
   * ✅ Fallback: Usar datos mock si el backend falla
   */
  private useMockData(): void {
    this.asignaciones = [
      { id: 1, sistema: 'ESCOLARIZADO', grupo: '1A', materia: 'Anatomía Humana' },
      { id: 2, sistema: 'ESCOLARIZADO', grupo: '2B', materia: 'Fisiología' },
      { id: 3, sistema: 'SABATINO', grupo: '3S', materia: 'Biomecánica' }
    ];

    this.alumnos = [
      { id: 1, matricula: '2021001', nombreCompleto: 'Juan Carlos Pérez García', estado: 'ASISTIO', porcentajeAsistencia: 92 },
      { id: 2, matricula: '2021002', nombreCompleto: 'María Fernanda García López', estado: 'ASISTIO', porcentajeAsistencia: 88 },
      { id: 3, matricula: '2021003', nombreCompleto: 'Carlos Alberto López Martínez', estado: 'RETARDO', porcentajeAsistencia: 95 },
      { id: 4, matricula: '2021004', nombreCompleto: 'Ana Patricia Rodríguez Sánchez', estado: 'ASISTIO', porcentajeAsistencia: 98 },
      { id: 5, matricula: '2021005', nombreCompleto: 'Pedro Antonio Hernández Torres', estado: 'FALTO', porcentajeAsistencia: 65 },
      { id: 6, matricula: '2021006', nombreCompleto: 'Laura Isabel Martínez Flores', estado: 'ASISTIO', porcentajeAsistencia: 90 },
      { id: 7, matricula: '2021007', nombreCompleto: 'Roberto Daniel González Ruiz', estado: 'ASISTIO', porcentajeAsistencia: 85 },
      { id: 8, matricula: '2021008', nombreCompleto: 'Sofía Guadalupe Ramírez Cruz', estado: 'ASISTIO', porcentajeAsistencia: 94 }
    ];

    this.initializeForm();
  }

  /**
   * Cargar opciones de filtros
   */
  loadFilters(): void {
    const gruposSet = new Set(this.asignaciones.map(a => a.grupo));
    this.grupos = ['TODOS', ...Array.from(gruposSet)];

    const materiasSet = new Set(this.asignaciones.map(a => a.materia));
    this.materias = ['TODOS', ...Array.from(materiasSet)];
  }

  /**
   * Inicializar formulario con alumnos
   */
  initializeForm(): void {
    const alumnosFormArray = this.attendanceForm.get('alumnos') as FormArray;
    alumnosFormArray.clear();

    this.alumnos.forEach(alumno => {
      alumnosFormArray.push(this.fb.group({
        id: [alumno.id],
        matricula: [alumno.matricula],
        nombreCompleto: [alumno.nombreCompleto],
        estado: [alumno.estado],
        porcentajeAsistencia: [alumno.porcentajeAsistencia]
      }));
    });

    // Escuchar cambios
    this.attendanceForm.valueChanges.subscribe(() => {
      this.hasChanges = true;
    });
  }

  /**
   * Obtener FormArray de alumnos
   */
  get alumnosFormArray(): FormArray {
    return this.attendanceForm.get('alumnos') as FormArray;
  }

  /**
   * Cambiar estado de asistencia de un alumno
   */
  setEstado(index: number, estado: EstadoAsistencia): void {
    const alumnoForm = this.alumnosFormArray.at(index) as FormGroup;
    alumnoForm.get('estado')?.setValue(estado);
    this.hasChanges = true;
  }

  /**
   * Obtener clase CSS según el estado
   */
  getEstadoClass(estado: EstadoAsistencia): string {
    switch (estado) {
      case 'ASISTIO': return 'estado-asistio';
      case 'FALTO': return 'estado-falto';
      case 'RETARDO': return 'estado-retardo';
      default: return 'estado-pendiente';
    }
  }

  /**
   * Obtener clase CSS según el porcentaje
   */
  getPorcentajeClass(porcentaje: number): string {
    if (porcentaje >= 90) return 'porcentaje-alto';
    if (porcentaje >= 70) return 'porcentaje-medio';
    return 'porcentaje-bajo';
  }

  /**
   * Calcular resumen de asistencias
   */
  getResumen(): { total: number; asistencias: number; faltas: number; retardos: number; pendientes: number } {
    const alumnos = this.alumnosFormArray.value;
    return {
      total: alumnos.length,
      asistencias: alumnos.filter((a: any) => a.estado === 'ASISTIO').length,
      faltas: alumnos.filter((a: any) => a.estado === 'FALTO').length,
      retardos: alumnos.filter((a: any) => a.estado === 'RETARDO').length,
      pendientes: alumnos.filter((a: any) => a.estado === null).length
    };
  }

  /**
   * ✅ ACTUALIZADO: Aplicar filtros y cargar alumnos del backend
   */
  applyFilters(): void {
    this.selectedSistema = this.attendanceForm.get('sistema')?.value || 'TODOS';
    this.selectedGrupo = this.attendanceForm.get('grupo')?.value || 'TODOS';
    this.selectedMateria = this.attendanceForm.get('materia')?.value || 'TODOS';

    console.log('Filtros aplicados:', {
      fecha: this.selectedDate,
      sistema: this.selectedSistema,
      grupo: this.selectedGrupo,
      materia: this.selectedMateria
    });

    // ✅ Buscar asignación que coincida con los filtros
    const asignacionFiltrada = this.asignaciones.find(a => {
      const coincideSistema = this.selectedSistema === 'TODOS' || a.sistema === this.selectedSistema;
      const coincideGrupo = this.selectedGrupo === 'TODOS' || a.grupo === this.selectedGrupo;
      const coincideMateria = this.selectedMateria === 'TODOS' || a.materia === this.selectedMateria;
      return coincideSistema && coincideGrupo && coincideMateria;
    });

    if (asignacionFiltrada) {
      this.loadStudents(asignacionFiltrada.id);
    } else {
      // Limpiar si no hay coincidencia
      this.alumnos = [];
      this.initializeForm();
    }
  }

  /**
   * ✅ NUEVO: Cargar alumnos desde el backend
   */
  private loadStudents(asignacionId: number): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.teachersService.getStudents({ asignacionId }).subscribe({
      next: (students: Student[]) => {
        // Transformar a la estructura que usa tu HTML
        this.alumnos = students.map(s => ({
          id: s.id,
          matricula: s.matricula,
          nombreCompleto: s.nombreCompleto,
          estado: null, // Se llenará con asistencias existentes
          porcentajeAsistencia: 0 // Se puede calcular desde el backend
        }));

        // Cargar asistencias de esta fecha
        this.loadAttendances(asignacionId);
      },
      error: (error: any) => {
        console.error('❌ Error al cargar alumnos:', error);
        this.errorMessage = 'Error al cargar la lista de alumnos.';
        this.isLoading = false;
      }
    });
  }

  /**
   * ✅ NUEVO: Cargar asistencias existentes de la fecha seleccionada
   */
  private loadAttendances(asignacionId: number): void {
    const fecha = this.formatDate(this.selectedDate);

    this.teachersService.getAttendances({ asignacionId, fecha }).subscribe({
      next: (asistencias: Attendance[]) => {
        this.asistenciasCargadas = asistencias;

        // Actualizar estados de alumnos con asistencias existentes
        this.alumnos.forEach(alumno => {
          const asistencia = asistencias.find(a => a.estudianteId === alumno.id);
          if (asistencia) {
            alumno.estado = asistencia.estatus as EstadoAsistencia;
          }
        });

        this.initializeForm();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('❌ Error al cargar asistencias:', error);
        // Aún así mostrar alumnos sin asistencias previas
        this.initializeForm();
        this.isLoading = false;
      }
    });
  }

  /**
   * Cambiar fecha
   */
  onDateChange(event: any): void {
    this.selectedDate = event.value;
    this.applyFilters();
  }

  /**
   * ✅ ACTUALIZADO: Guardar asistencias en el backend REAL
   */
  saveAttendance(): void {
    // Validar que tengamos una asignación seleccionada
    const asignacionActual = this.asignaciones.find(a => {
      const coincideSistema = this.selectedSistema === 'TODOS' || a.sistema === this.selectedSistema;
      const coincideGrupo = this.selectedGrupo === 'TODOS' || a.grupo === this.selectedGrupo;
      const coincideMateria = this.selectedMateria === 'TODOS' || a.materia === this.selectedMateria;
      return coincideSistema && coincideGrupo && coincideMateria;
    });

    if (!asignacionActual) {
      this.errorMessage = 'Selecciona una asignación válida primero.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const asistencias = this.alumnosFormArray.value
      .filter((a: any) => a.estado !== null) // Solo guardar los que tienen estado
      .map((a: any) => ({
        estudianteId: a.id,
        estatus: a.estado as AttendanceStatus,
        comentarios: undefined
      }));

    if (asistencias.length === 0) {
      this.errorMessage = 'No hay asistencias para guardar. Marca al menos un alumno.';
      this.isLoading = false;
      return;
    }

    const fecha = this.formatDate(this.selectedDate);

    console.log('💾 Guardando asistencias:', {
      fecha,
      asignacionId: asignacionActual.id,
      asistencias
    });

    // ✅ Llamada REAL al backend
    this.teachersService.saveBulkAttendances(fecha, asignacionActual.id, asistencias).subscribe({
      next: (response: any) => {
        console.log('✅ Asistencias guardadas:', response);
        this.isLoading = false;
        this.successMessage = `✅ ${response.registradas} asistencias guardadas exitosamente`;
        this.hasChanges = false;

        // Ocultar mensaje después de 3 segundos
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);

        // Recargar asistencias para actualizar porcentajes
        this.loadAttendances(asignacionActual.id);
      },
      error: (error: any) => {
        console.error('❌ Error al guardar:', error);
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Error al guardar asistencias';

        // Ocultar mensaje de error después de 5 segundos
        setTimeout(() => {
          this.errorMessage = '';
        }, 5000);
      }
    });
  }

  /**
   * Cancelar y volver al dashboard
   */
  cancel(): void {
    if (this.hasChanges) {
      const confirmCancel = confirm('Tienes cambios sin guardar. ¿Estás seguro de salir?');
      if (!confirmCancel) return;
    }
    this.router.navigate(['/teachers']);
  }

  /**
   * ✅ NUEVO: Formatear fecha a YYYY-MM-DD
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}