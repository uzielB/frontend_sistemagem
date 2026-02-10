import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../../core/services/auth.service';
import { environment } from '../../../../../environments/environment';

interface Alumno {
  id: number;
  matricula: string;
  nombreCompleto: string;
  p1: number | null;
  p2: number | null;
  p3: number | null;
  total: number;
}

interface Asignacion {
  id: number;
  sistema: string;
  grupo: string;
  materia: string;
}

@Component({
  selector: 'app-grades',
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
    MatTooltipModule
  ],
  templateUrl: './grades.component.html',
  styleUrls: ['./grades.component.css']
})
export class GradesComponent implements OnInit {
  gradesForm: FormGroup;
  displayedColumns: string[] = ['matricula', 'nombreCompleto', 'p1', 'p2', 'p3', 'total'];
  
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  hasChanges = false;

  // Datos de demostración (mock data)
  asignaciones: Asignacion[] = [
    { id: 1, sistema: 'ESCOLARIZADO', grupo: '1A', materia: 'Anatomía Humana' },
    { id: 2, sistema: 'ESCOLARIZADO', grupo: '2B', materia: 'Fisiología' },
    { id: 3, sistema: 'SABATINO', grupo: '3S', materia: 'Biomecánica' }
  ];

  alumnos: Alumno[] = [
    { id: 1, matricula: '2021001', nombreCompleto: 'Juan Carlos Pérez García', p1: 85, p2: 90, p3: 88, total: 0 },
    { id: 2, matricula: '2021002', nombreCompleto: 'María Fernanda García López', p1: 92, p2: 88, p3: 95, total: 0 },
    { id: 3, matricula: '2021003', nombreCompleto: 'Carlos Alberto López Martínez', p1: 78, p2: 82, p3: 80, total: 0 },
    { id: 4, matricula: '2021004', nombreCompleto: 'Ana Patricia Rodríguez Sánchez', p1: 95, p2: 93, p3: 97, total: 0 },
    { id: 5, matricula: '2021005', nombreCompleto: 'Pedro Antonio Hernández Torres', p1: 70, p2: 75, p3: 72, total: 0 },
    { id: 6, matricula: '2021006', nombreCompleto: 'Laura Isabel Martínez Flores', p1: 88, p2: 85, p3: 90, total: 0 },
    { id: 7, matricula: '2021007', nombreCompleto: 'Roberto Daniel González Ruiz', p1: 82, p2: 80, p3: 85, total: 0 },
    { id: 8, matricula: '2021008', nombreCompleto: 'Sofía Guadalupe Ramírez Cruz', p1: 90, p2: 92, p3: 88, total: 0 }
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
    this.gradesForm = this.fb.group({
      sistema: ['TODOS'],
      grupo: ['TODOS'],
      materia: ['TODOS'],
      alumnos: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.loadFilters();
    this.initializeForm();
    this.calculateAllTotals();
  }

  /**
   * Cargar opciones de filtros
   */
  loadFilters(): void {
    // Extraer grupos únicos
    const gruposSet = new Set(this.asignaciones.map(a => a.grupo));
    this.grupos = ['TODOS', ...Array.from(gruposSet)];

    // Extraer materias únicas
    const materiasSet = new Set(this.asignaciones.map(a => a.materia));
    this.materias = ['TODOS', ...Array.from(materiasSet)];
  }

  /**
   * Inicializar formulario con alumnos
   */
  initializeForm(): void {
    const alumnosFormArray = this.gradesForm.get('alumnos') as FormArray;
    alumnosFormArray.clear();

    this.alumnos.forEach(alumno => {
      alumnosFormArray.push(this.fb.group({
        id: [alumno.id],
        matricula: [alumno.matricula],
        nombreCompleto: [alumno.nombreCompleto],
        p1: [alumno.p1, [Validators.min(0), Validators.max(100)]],
        p2: [alumno.p2, [Validators.min(0), Validators.max(100)]],
        p3: [alumno.p3, [Validators.min(0), Validators.max(100)]],
        total: [{ value: alumno.total, disabled: true }]
      }));
    });

    // Escuchar cambios en el formulario
    this.gradesForm.valueChanges.subscribe(() => {
      this.hasChanges = true;
    });
  }

  /**
   * Obtener FormArray de alumnos
   */
  get alumnosFormArray(): FormArray {
    return this.gradesForm.get('alumnos') as FormArray;
  }

  /**
   * Calcular promedio de un alumno específico
   */
  calculateTotal(index: number): void {
    const alumnoForm = this.alumnosFormArray.at(index) as FormGroup;
    const p1 = alumnoForm.get('p1')?.value || 0;
    const p2 = alumnoForm.get('p2')?.value || 0;
    const p3 = alumnoForm.get('p3')?.value || 0;

    const total = ((p1 + p2 + p3) / 3).toFixed(1);
    alumnoForm.get('total')?.setValue(parseFloat(total));
  }

  /**
   * Calcular promedio de todos los alumnos
   */
  calculateAllTotals(): void {
    for (let i = 0; i < this.alumnosFormArray.length; i++) {
      this.calculateTotal(i);
    }
  }

  /**
   * Validar que la calificación esté entre 0 y 100
   */
  validateGrade(event: any, index: number, field: string): void {
    const value = parseFloat(event.target.value);
    
    if (isNaN(value) || value < 0 || value > 100) {
      event.target.value = '';
      const alumnoForm = this.alumnosFormArray.at(index) as FormGroup;
      alumnoForm.get(field)?.setValue(null);
    } else {
      this.calculateTotal(index);
    }
  }

  /**
   * Aplicar filtros
   */
  applyFilters(): void {
    this.selectedSistema = this.gradesForm.get('sistema')?.value || 'TODOS';
    this.selectedGrupo = this.gradesForm.get('grupo')?.value || 'TODOS';
    this.selectedMateria = this.gradesForm.get('materia')?.value || 'TODOS';

    console.log('Filtros aplicados:', {
      sistema: this.selectedSistema,
      grupo: this.selectedGrupo,
      materia: this.selectedMateria
    });

    // TODO: Aquí se cargarían los alumnos filtrados desde el backend
    // this.loadAlumnos();
  }

  /**
   * Guardar calificaciones
   */
  saveGrades(): void {
    if (this.gradesForm.invalid) {
      this.errorMessage = 'Hay calificaciones inválidas. Verifica los valores (0-100).';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const calificaciones = this.alumnosFormArray.value;
    console.log('💾 Guardando calificaciones:', calificaciones);

    // TODO: Conectar con backend
    const token = this.authService.getToken();
    const url = `${environment.apiUrl}/calificaciones`;

    // Simulación de guardado
    setTimeout(() => {
      this.isLoading = false;
      this.successMessage = '✅ Calificaciones guardadas exitosamente';
      this.hasChanges = false;

      setTimeout(() => {
        this.successMessage = '';
      }, 3000);
    }, 1500);

    /*
    // Código real para el backend:
    this.http.post(url, { calificaciones }, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (response: any) => {
        console.log('✅ Calificaciones guardadas:', response);
        this.isLoading = false;
        this.successMessage = 'Calificaciones guardadas exitosamente';
        this.hasChanges = false;
      },
      error: (error: any) => {
        console.error('❌ Error al guardar:', error);
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Error al guardar calificaciones';
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

  /**
   * Limpiar mensajes
   */
  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
}