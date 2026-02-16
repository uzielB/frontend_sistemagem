import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// ✅ IMPORTAR TeachersService
import {
  TeachersService,
  Student,
  TeacherAssignment
} from '../../../../../core/services/teachers.service';

interface Alumno {
  id: number;
  matricula: string;
  nombreCompleto: string;
  programa: string;
  grupo: string;
  correo: string;
  telefono: string;
  estatus: string;
}

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './student-list.component.html',
  styleUrls: ['./student-list.component.css']
})
export class StudentListComponent implements OnInit {
  
  displayedColumns: string[] = ['matricula', 'nombreCompleto', 'programa', 'grupo', 'correo', 'telefono', 'estatus'];
  
  searchControl = new FormControl('');
  grupoControl = new FormControl('TODOS');
  materiaControl = new FormControl('TODOS');

  // ✅ Datos desde el backend
  alumnos: Alumno[] = [];
  alumnosFiltrados: Alumno[] = [];
  asignaciones: TeacherAssignment[] = [];
  
  grupos: string[] = ['TODOS'];
  materias: string[] = ['TODOS'];

  isLoading = false;
  errorMessage = '';

  constructor(
    private teachersService: TeachersService
  ) {}

  ngOnInit(): void {
    this.loadAssignments();
  }

  /**
   * ✅ Cargar asignaciones del docente desde el backend
   */
  loadAssignments(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.alumnos = [];
    this.alumnosFiltrados = [];

    this.teachersService.getMyAssignments().subscribe({
      next: (response: any) => {
        this.asignaciones = response.asignaciones;

        if (this.asignaciones.length === 0) {
          this.errorMessage = 'No tienes asignaciones registradas en el sistema.';
          this.isLoading = false;
          return;
        }

        // Extraer grupos y materias únicas
        const gruposSet = new Set(this.asignaciones.map(a => a.grupo));
        this.grupos = ['TODOS', ...Array.from(gruposSet)];

        const materiasSet = new Set(this.asignaciones.map(a => a.materia));
        this.materias = ['TODOS', ...Array.from(materiasSet)];

        // Cargar todos los alumnos
        this.loadAllStudents();
      },
      error: (error: any) => {
        console.error('❌ Error al cargar asignaciones:', error);
        this.errorMessage = 'Error al conectar con el servidor. Verifica tu conexión e intenta de nuevo.';
        this.isLoading = false;
      }
    });
  }

  /**
   * ✅ Cargar todos los alumnos de todas las asignaciones desde el backend
   */
  loadAllStudents(): void {
    const alumnosMap = new Map<number, Alumno>();

    let asignacionesCompletadas = 0;
    const totalAsignaciones = this.asignaciones.length;

    // Cargar alumnos de cada asignación
    this.asignaciones.forEach(asignacion => {
      this.teachersService.getStudents({ asignacionId: asignacion.id }).subscribe({
        next: (students: Student[]) => {
          // Agregar alumnos al map (evita duplicados por ID)
          students.forEach(s => {
            if (!alumnosMap.has(s.id)) {
              alumnosMap.set(s.id, {
                id: s.id,
                matricula: s.matricula,
                nombreCompleto: s.nombreCompleto,
                programa: s.programa || 'N/A',
                grupo: s.grupo || 'N/A',
                correo: s.correo || 'N/A',
                telefono: s.telefono || 'N/A',
                estatus: s.estatus || 'ACTIVO'
              });
            }
          });

          asignacionesCompletadas++;

          // Si ya se cargaron todas las asignaciones
          if (asignacionesCompletadas === totalAsignaciones) {
            this.alumnos = Array.from(alumnosMap.values());
            this.alumnosFiltrados = [...this.alumnos];
            this.isLoading = false;
            this.setupFilters();

            if (this.alumnos.length === 0) {
              this.errorMessage = 'No hay alumnos asignados a tus grupos actualmente.';
            }
          }
        },
        error: (error: any) => {
          console.error('❌ Error al cargar alumnos de asignación:', asignacion.id, error);
          asignacionesCompletadas++;

          if (asignacionesCompletadas === totalAsignaciones) {
            this.isLoading = false;
            
            if (this.alumnos.length === 0) {
              this.errorMessage = 'Error al cargar la lista de alumnos. Intenta recargar la página.';
            }
          }
        }
      });
    });
  }

  /**
   * Configurar filtros reactivos
   */
  setupFilters(): void {
    this.searchControl.valueChanges.subscribe(() => this.applyFilters());
    this.grupoControl.valueChanges.subscribe(() => this.applyFilters());
    this.materiaControl.valueChanges.subscribe(() => this.applyFilters());
  }

  /**
   * Aplicar filtros a la lista de alumnos
   */
  applyFilters(): void {
    let filtered = [...this.alumnos];

    // Filtro de búsqueda
    const searchTerm = this.searchControl.value?.toLowerCase() || '';
    if (searchTerm) {
      filtered = filtered.filter(a =>
        a.nombreCompleto.toLowerCase().includes(searchTerm) ||
        a.matricula.toLowerCase().includes(searchTerm) ||
        a.correo.toLowerCase().includes(searchTerm)
      );
    }

    // Filtro de grupo
    const grupo = this.grupoControl.value;
    if (grupo && grupo !== 'TODOS') {
      filtered = filtered.filter(a => a.grupo === grupo);
    }

    // Filtro de materia (basado en asignaciones)
    const materia = this.materiaControl.value;
    if (materia && materia !== 'TODOS') {
      // Obtener IDs de grupos que tienen esta materia
      const gruposConMateria = this.asignaciones
        .filter(a => a.materia === materia)
        .map(a => a.grupo);
      
      filtered = filtered.filter(a => gruposConMateria.includes(a.grupo));
    }

    this.alumnosFiltrados = filtered;
  }

  /**
   * Recargar datos desde el backend
   */
  reloadData(): void {
    this.loadAssignments();
  }

  /**
   * Obtener clase CSS según el estatus
   */
  getEstatusClass(estatus: string): string {
    switch (estatus) {
      case 'ACTIVO': return 'estatus-activo';
      case 'BAJA_TEMPORAL': return 'estatus-baja';
      case 'EGRESADO': return 'estatus-egresado';
      default: return '';
    }
  }

  /**
   * Exportar lista a Excel (simulado)
   */
  exportToExcel(): void {
    if (this.alumnosFiltrados.length === 0) {
      alert('No hay alumnos para exportar.');
      return;
    }
    
    console.log('📊 Exportando a Excel...', this.alumnosFiltrados);
    alert(`Función de exportación en desarrollo. Se exportarían ${this.alumnosFiltrados.length} alumno(s).`);
  }

  /**
   * Exportar lista a PDF (simulado)
   */
  exportToPDF(): void {
    if (this.alumnosFiltrados.length === 0) {
      alert('No hay alumnos para exportar.');
      return;
    }
    
    console.log('📄 Exportando a PDF...', this.alumnosFiltrados);
    alert(`Función de exportación en desarrollo. Se exportarían ${this.alumnosFiltrados.length} alumno(s).`);
  }
}