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

  // Datos de demostración
  alumnos: Alumno[] = [
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
    },
    {
      id: 6,
      matricula: '2021006',
      nombreCompleto: 'Laura Isabel Martínez Flores',
      programa: 'Licenciatura en Fisioterapia',
      grupo: '2B',
      correo: 'laura.martinez@gem.edu.mx',
      telefono: '951-678-9012',
      estatus: 'ACTIVO'
    },
    {
      id: 7,
      matricula: '2021007',
      nombreCompleto: 'Roberto Daniel González Ruiz',
      programa: 'Licenciatura en Fisioterapia',
      grupo: '2B',
      correo: 'roberto.gonzalez@gem.edu.mx',
      telefono: '951-789-0123',
      estatus: 'BAJA_TEMPORAL'
    },
    {
      id: 8,
      matricula: '2021008',
      nombreCompleto: 'Sofía Guadalupe Ramírez Cruz',
      programa: 'Licenciatura en Fisioterapia',
      grupo: '2B',
      correo: 'sofia.ramirez@gem.edu.mx',
      telefono: '951-890-1234',
      estatus: 'ACTIVO'
    },
    {
      id: 9,
      matricula: '2020015',
      nombreCompleto: 'Diego Fernando Morales Vega',
      programa: 'Licenciatura en Fisioterapia',
      grupo: '3S',
      correo: 'diego.morales@gem.edu.mx',
      telefono: '951-901-2345',
      estatus: 'ACTIVO'
    },
    {
      id: 10,
      matricula: '2020016',
      nombreCompleto: 'Gabriela Monserrat Silva Ortiz',
      programa: 'Licenciatura en Fisioterapia',
      grupo: '3S',
      correo: 'gabriela.silva@gem.edu.mx',
      telefono: '951-012-3456',
      estatus: 'ACTIVO'
    }
  ];

  alumnosFiltrados: Alumno[] = [];
  
  grupos: string[] = ['TODOS', '1A', '2B', '3S'];
  materias: string[] = ['TODOS', 'Anatomía Humana', 'Fisiología', 'Biomecánica'];

  ngOnInit(): void {
    this.alumnosFiltrados = [...this.alumnos];
    this.setupFilters();
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