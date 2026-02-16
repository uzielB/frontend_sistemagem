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
    MatChipsModule
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
   * ✅ Cargar asignaciones del docente
   */
  loadAssignments(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.teachersService.getMyAssignments().subscribe({
      next: (response: any) => {
        this.asignaciones = response.asignaciones;

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
        this.errorMessage = 'Error al cargar asignaciones. Usando datos de demostración.';
        this.isLoading = false;
        
        // Fallback a datos mock
        this.useMockData();
        this.setupFilters();
      }
    });
  }

  /**
   * ✅ Cargar todos los alumnos de todas las asignaciones
   */
  loadAllStudents(): void {
    const alumnosMap = new Map<number, Alumno>();

    let asignacionesCompletadas = 0;
    const totalAsignaciones = this.asignaciones.length;

    if (totalAsignaciones === 0) {
      this.errorMessage = 'No tienes asignaciones registradas.';
      this.isLoading = false;
      return;
    }

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
              this.errorMessage = 'No se encontraron alumnos asignados.';
            }
          }
        },
        error: (error: any) => {
          console.error('❌ Error al cargar alumnos:', error);
          asignacionesCompletadas++;

          if (asignacionesCompletadas === totalAsignaciones) {
            this.isLoading = false;
            if (this.alumnos.length === 0) {
              this.errorMessage = 'Error al cargar alumnos. Usando datos de demostración.';
              this.useMockData();
              this.setupFilters();
            }
          }
        }
      });
    });
  }

  /**
   * ✅ Fallback: Usar datos mock si el backend falla
   */
  private useMockData(): void {
    this.alumnos = [
      {
        id: 1,
        matricula: '2021001',
        nombreCompleto: 'Juan Carlos Pérez García',
        programa: 'Licenciatura en Fisioterapia',
        grupo: '1A',
        correo: 'juan.perez@gem.edu.mx',
        telefono: '951-123-4567',
        estatus: 'ACTIVO'
      },
      {
        id: 2,
        matricula: '2021002',
        nombreCompleto: 'María Fernanda García López',
        programa: 'Licenciatura en Fisioterapia',
        grupo: '1A',
        correo: 'maria.garcia@gem.edu.mx',
        telefono: '951-234-5678',
        estatus: 'ACTIVO'
      },
      {
        id: 3,
        matricula: '2021003',
        nombreCompleto: 'Carlos Alberto López Martínez',
        programa: 'Licenciatura en Fisioterapia',
        grupo: '1A',
        correo: 'carlos.lopez@gem.edu.mx',
        telefono: '951-345-6789',
        estatus: 'ACTIVO'
      },
      {
        id: 4,
        matricula: '2021004',
        nombreCompleto: 'Ana Patricia Rodríguez Sánchez',
        programa: 'Licenciatura en Fisioterapia',
        grupo: '1A',
        correo: 'ana.rodriguez@gem.edu.mx',
        telefono: '951-456-7890',
        estatus: 'ACTIVO'
      },
      {
        id: 5,
        matricula: '2021005',
        nombreCompleto: 'Pedro Antonio Hernández Torres',
        programa: 'Licenciatura en Fisioterapia',
        grupo: '2B',
        correo: 'pedro.hernandez@gem.edu.mx',
        telefono: '951-567-8901',
        estatus: 'ACTIVO'
      }
    ];

    this.alumnosFiltrados = [...this.alumnos];
    this.grupos = ['TODOS', '1A', '2B'];
    this.materias = ['TODOS', 'Anatomía Humana', 'Fisiología'];
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
   * Aplicar filtros
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

    this.alumnosFiltrados = filtered;
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
   * Exportar lista (simulado)
   */
  exportToExcel(): void {
    console.log('📊 Exportando a Excel...', this.alumnosFiltrados);
    alert('Función de exportación en desarrollo. Se exportarían ' + this.alumnosFiltrados.length + ' alumnos.');
  }

  /**
   * Exportar a PDF (simulado)
   */
  exportToPDF(): void {
    console.log('📄 Exportando a PDF...', this.alumnosFiltrados);
    alert('Función de exportación en desarrollo. Se exportarían ' + this.alumnosFiltrados.length + ' alumnos.');
  }
}