import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../../core/services/auth.service';
import { environment } from '../../../../../environments/environment';

interface Asignacion {
  id: number;
  materia: string;
  grupo: string;
  sistema: string;
}

interface Alumno {
  matricula: string;
  nombreCompleto: string;
  p1: number | null;
  p2: number | null;
  p3: number | null;
  total: number;
}

@Component({
  selector: 'app-grades',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule
  ],
  templateUrl: './grades.component.html',
  styleUrls: ['./grades.component.css']
})
export class GradesComponent implements OnInit {
  gradesForm: FormGroup;
  
  sistemas: string[] = ['TODOS', 'Escolarizado', 'Sabatino'];
  grupos: string[] = ['TODOS', 'A', 'B', 'C', 'D'];
  materias: string[] = ['TODOS', 'Matemáticas', 'Física', 'Química', 'Historia'];
  
  asignaciones: Asignacion[] = [];
  selectedAsignacion: Asignacion | null = null;
  
  selectedSistema = 'TODOS';
  selectedGrupo = 'TODOS';
  selectedMateria = 'TODOS';
  
  displayedColumns: string[] = ['numero', 'matricula', 'nombreCompleto', 'p1', 'p2', 'p3', 'total'];
  
  isLoading = false;
  isLoadingAssignments = false;
  isLoadingStudents = false;
  errorMessage = '';
  successMessage = '';
  hasChanges = false;

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
      asignacionId: [''],
      alumnos: this.fb.array([])
    });
  }

  ngOnInit(): void {
    if (!this.authService.isUserAuthenticated()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.loadAsignaciones();

    // Detectar cambios en el formulario
    this.gradesForm.valueChanges.subscribe(() => {
      this.hasChanges = true;
    });
  }

  get alumnosFormArray(): FormArray {
    return this.gradesForm.get('alumnos') as FormArray;
  }

  loadAsignaciones(): void {
    this.isLoadingAssignments = true;
    this.errorMessage = '';
    
    const token = this.authService.getToken();
    const url = `${environment.apiUrl}/teachers/asignaciones`;

    this.http.get<Asignacion[]>(url, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (response) => {
        console.log('✅ Asignaciones cargadas:', response);
        this.asignaciones = response;
        this.isLoadingAssignments = false;
      },
      error: (error) => {
        console.error('❌ Error al cargar asignaciones:', error);
        this.errorMessage = 'Error al cargar tus asignaciones. Verifica tu conexión.';
        this.isLoadingAssignments = false;
      }
    });
  }

  applyFilters(): void {
    this.selectedSistema = this.gradesForm.get('sistema')?.value;
    this.selectedGrupo = this.gradesForm.get('grupo')?.value;
    this.selectedMateria = this.gradesForm.get('materia')?.value;
    
    console.log('Filtros aplicados:', {
      sistema: this.selectedSistema,
      grupo: this.selectedGrupo,
      materia: this.selectedMateria
    });
  }

  onAsignacionChange(event: any): void {
    const asignacionId = event.value;
    this.selectedAsignacion = this.asignaciones.find(a => a.id === asignacionId) || null;
    
    if (this.selectedAsignacion) {
      console.log('Asignación seleccionada:', this.selectedAsignacion);
      this.loadAlumnos(asignacionId);
    }
  }

  loadAlumnos(asignacionId: number): void {
    this.isLoadingStudents = true;
    this.errorMessage = '';
    
    const token = this.authService.getToken();
    const url = `${environment.apiUrl}/teachers/calificaciones/${asignacionId}`;

    this.http.get<Alumno[]>(url, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (alumnos) => {
        console.log('✅ Alumnos cargados:', alumnos);
        this.alumnosFormArray.clear();
        
        alumnos.forEach(alumno => {
          this.alumnosFormArray.push(this.createAlumnoFormGroup(alumno));
        });
        
        this.isLoadingStudents = false;
        this.hasChanges = false;
      },
      error: (error) => {
        console.error('❌ Error al cargar alumnos:', error);
        this.errorMessage = 'Error al cargar la lista de alumnos.';
        this.isLoadingStudents = false;
      }
    });
  }

  createAlumnoFormGroup(alumno: Alumno) {
    const group = this.fb.group({
      matricula: [alumno.matricula],
      nombreCompleto: [alumno.nombreCompleto],
      p1: [alumno.p1, [Validators.min(0), Validators.max(100)]],
      p2: [alumno.p2, [Validators.min(0), Validators.max(100)]],
      p3: [alumno.p3, [Validators.min(0), Validators.max(100)]],
      total: [alumno.total]
    });

    // Calcular total cuando cambien los parciales
    group.valueChanges.subscribe(() => {
      this.calculateTotal(group);
    });

    return group;
  }

  calculateTotal(group: FormGroup): void {
    const p1 = group.get('p1')?.value || 0;
    const p2 = group.get('p2')?.value || 0;
    const p3 = group.get('p3')?.value || 0;
    
    const total = (p1 * 0.3) + (p2 * 0.3) + (p3 * 0.4);
    
    group.patchValue({ total: Math.round(total * 10) / 10 }, { emitEvent: false });
  }

  validateGrade(event: any, index: number, parcial: string): void {
    const value = event.target.value;
    const numValue = parseFloat(value);
    
    if (isNaN(numValue) || numValue < 0 || numValue > 100) {
      const control = this.alumnosFormArray.at(index).get(parcial);
      control?.setValue(null);
      control?.markAsTouched();
    }
  }

  // 🆕 MÉTODO AGREGADO: Obtiene la clase CSS según el promedio
  getPromedioClass(promedio: number | null | undefined): string {
    if (!promedio && promedio !== 0) return '';
    
    if (promedio >= 80) {
      return 'promedio-alto';  // Verde
    } else if (promedio >= 70) {
      return 'promedio-medio'; // Amarillo
    } else {
      return 'promedio-bajo';  // Rojo
    }
  }

  // 🆕 MÉTODO AGREGADO: Obtiene el resumen de calificaciones del grupo
  getResumenCalificaciones(): { aprobados: number, reprobados: number, promedioGrupo: number } {
    if (!this.alumnosFormArray || this.alumnosFormArray.length === 0) {
      return { aprobados: 0, reprobados: 0, promedioGrupo: 0 };
    }

    let aprobados = 0;
    let reprobados = 0;
    let sumaPromedios = 0;
    let alumnosConCalificacion = 0;

    this.alumnosFormArray.controls.forEach(control => {
      const promedio = control.get('total')?.value;
      
      if (promedio !== null && promedio !== undefined && promedio > 0) {
        sumaPromedios += promedio;
        alumnosConCalificacion++;
        
        if (promedio >= 70) {
          aprobados++;
        } else {
          reprobados++;
        }
      }
    });

    const promedioGrupo = alumnosConCalificacion > 0 
      ? sumaPromedios / alumnosConCalificacion 
      : 0;

    return {
      aprobados,
      reprobados,
      promedioGrupo: Math.round(promedioGrupo * 10) / 10 // Redondear a 1 decimal
    };
  }

  saveGrades(): void {
    if (this.gradesForm.invalid || !this.selectedAsignacion) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const calificaciones = this.alumnosFormArray.value.map((alumno: any) => ({
      matricula: alumno.matricula,
      p1: alumno.p1,
      p2: alumno.p2,
      p3: alumno.p3,
      total: alumno.total
    }));

    const token = this.authService.getToken();
    const url = `${environment.apiUrl}/teachers/calificaciones/${this.selectedAsignacion.id}`;

    this.http.post(url, { calificaciones }, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (response) => {
        console.log('✅ Calificaciones guardadas:', response);
        this.isLoading = false;
        this.hasChanges = false;
        this.successMessage = '¡Calificaciones guardadas exitosamente!';
        
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        console.error('❌ Error al guardar calificaciones:', error);
        this.isLoading = false;
        this.errorMessage = 'Error al guardar las calificaciones. Intenta nuevamente.';
      }
    });
  }

  cancel(): void {
    if (this.hasChanges) {
      const confirmLeave = confirm('Tienes cambios sin guardar. ¿Estás seguro de que deseas salir?');
      if (!confirmLeave) {
        return;
      }
    }
    this.router.navigate(['/teachers']);
  }
}