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

  // Datos de demostración
  asignaciones: Asignacion[] = [
    { id: 1, sistema: 'ESCOLARIZADO', grupo: '1A', materia: 'Anatomía Humana' },
    { id: 2, sistema: 'ESCOLARIZADO', grupo: '2B', materia: 'Fisiología' },
    { id: 3, sistema: 'SABATINO', grupo: '3S', materia: 'Biomecánica' }
  ];

  alumnos: Alumno[] = [
    { id: 1, matricula: '2021001', nombreCompleto: 'Juan Carlos Pérez García', estado: 'ASISTIO', porcentajeAsistencia: 92 },
    { id: 2, matricula: '2021002', nombreCompleto: 'María Fernanda García López', estado: 'ASISTIO', porcentajeAsistencia: 88 },
    { id: 3, matricula: '2021003', nombreCompleto: 'Carlos Alberto López Martínez', estado: 'RETARDO', porcentajeAsistencia: 95 },
    { id: 4, matricula: '2021004', nombreCompleto: 'Ana Patricia Rodríguez Sánchez', estado: 'ASISTIO', porcentajeAsistencia: 98 },
    { id: 5, matricula: '2021005', nombreCompleto: 'Pedro Antonio Hernández Torres', estado: 'FALTO', porcentajeAsistencia: 65 },
    { id: 6, matricula: '2021006', nombreCompleto: 'Laura Isabel Martínez Flores', estado: 'ASISTIO', porcentajeAsistencia: 90 },
    { id: 7, matricula: '2021007', nombreCompleto: 'Roberto Daniel González Ruiz', estado: 'ASISTIO', porcentajeAsistencia: 85 },
    { id: 8, matricula: '2021008', nombreCompleto: 'Sofía Guadalupe Ramírez Cruz', estado: 'ASISTIO', porcentajeAsistencia: 94 }
  ];

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
    private router: Router
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
    this.loadFilters();
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
   * Aplicar filtros
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

    // TODO: Cargar alumnos filtrados desde el backend
  }

  /**
   * Cambiar fecha
   */
  onDateChange(event: any): void {
    this.selectedDate = event.value;
    this.applyFilters();
  }

  /**
   * Guardar asistencias
   */
  saveAttendance(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const asistencias = this.alumnosFormArray.value;
    console.log('💾 Guardando asistencias:', {
      fecha: this.selectedDate,
      asistencias
    });

    // Simulación de guardado
    setTimeout(() => {
      this.isLoading = false;
      this.successMessage = '✅ Asistencias guardadas exitosamente';
      this.hasChanges = false;

      setTimeout(() => {
        this.successMessage = '';
      }, 3000);
    }, 1500);

    /*
    // Código real para el backend:
    const token = this.authService.getToken();
    const url = `${environment.apiUrl}/asistencias`;

    this.http.post(url, {
      fecha: this.selectedDate,
      asistencias
    }, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (response: any) => {
        console.log('✅ Asistencias guardadas:', response);
        this.isLoading = false;
        this.successMessage = 'Asistencias guardadas exitosamente';
        this.hasChanges = false;
      },
      error: (error: any) => {
        console.error('❌ Error al guardar:', error);
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Error al guardar asistencias';
      }
    });
    */
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
}