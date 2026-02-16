import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';

// ✅ IMPORTAR TeachersService
import {
  TeachersService,
  TeacherAssignment
} from '../../../../../core/services/teachers.service';

interface HorarioClase {
  dia: string;
  modulo: number;
  horaInicio: string;
  horaFin: string;
  materia: string;
  grupo: string;
  aula: string;
  sistema: string;
}

interface ModuloHorario {
  numero: number;
  hora: string;
}

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatButtonModule
  ],
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.css']
})
export class ScheduleComponent implements OnInit {
  
  // Días de la semana
  dias: string[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  
  // Módulos horarios (se cargarán dinámicamente según el sistema)
  modulos: ModuloHorario[] = [];
  
  // Módulos ESCOLARIZADO (Lunes a Jueves)
  modulosEscolarizado: ModuloHorario[] = [
    { numero: 1, hora: '08:00 - 09:30' },
    { numero: 2, hora: '10:00 - 11:30' },
    { numero: 3, hora: '12:00 - 13:30' },
    { numero: 4, hora: '13:30 - 15:00' }
  ];

  // Módulos SABATINO (Sábados)
  modulosSabatino: ModuloHorario[] = [
    { numero: 1, hora: '08:00 - 11:30' },
    { numero: 2, hora: '11:30 - 14:30' },
    { numero: 3, hora: '14:30 - 17:30' }
  ];

  // Datos desde el backend
  horarios: HorarioClase[] = [];
  asignaciones: TeacherAssignment[] = [];
  horariosPorDia: Map<string, HorarioClase[]> = new Map();

  // Control de carga
  isLoading = false;
  errorMessage = '';

  constructor(
    private teachersService: TeachersService
  ) {}

  ngOnInit(): void {
    this.loadSchedule();
  }

  /**
   * ✅ Cargar horarios desde el backend
   */
  loadSchedule(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.horarios = [];

    this.teachersService.getMyAssignments().subscribe({
      next: (response: any) => {
        this.asignaciones = response.asignaciones;

        if (this.asignaciones.length === 0) {
          this.errorMessage = 'No tienes asignaciones registradas en este periodo.';
          this.isLoading = false;
          return;
        }

        // Transformar asignaciones a formato de horario
        this.transformAssignmentsToSchedule();
        
        // Detectar sistemas y configurar módulos
        this.configurarModulos();
        
        // Organizar horarios por día
        this.organizarHorarios();
        
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('❌ Error al cargar horarios:', error);
        this.errorMessage = 'Error al cargar tus horarios. Verifica tu conexión.';
        this.isLoading = false;
      }
    });
  }

  /**
   * ✅ Transformar asignaciones del backend a formato de horario
   */
  transformAssignmentsToSchedule(): void {
    this.horarios = [];

    this.asignaciones.forEach(asignacion => {
      // El campo 'horario' es JSONB y puede contener: {"dias": ["Lunes", "Miércoles"]}
      // O puede que los días vengan en el módulo horario
      
      const dias = this.getDiasFromAssignment(asignacion);
      const modulo = asignacion.moduloNumero || 1;
      const horaInicio = asignacion.moduloHoraInicio || '08:00';
      const horaFin = asignacion.moduloHoraFin || '09:30';
      const sistema = asignacion.moduloSistema || 'ESCOLARIZADO';

      // Crear un horario por cada día
      dias.forEach(dia => {
        this.horarios.push({
          dia,
          modulo,
          horaInicio,
          horaFin,
          materia: asignacion.materia,
          grupo: asignacion.grupo,
          aula: asignacion.aula || 'Por asignar',
          sistema
        });
      });
    });
  }

  /**
   * Extraer días de la asignación
   */
  getDiasFromAssignment(asignacion: any): string[] {
    // Opción 1: El campo 'horario' tiene la info
    if (asignacion.horario && asignacion.horario.dias) {
      return asignacion.horario.dias;
    }

    // Opción 2: Determinar por el sistema
    const sistema = asignacion.moduloSistema || 'ESCOLARIZADO';
    
    if (sistema === 'SABATINO') {
      return ['Sábado'];
    }

    // Opción 3: Por defecto, ESCOLARIZADO se imparte Lunes a Jueves
    // Pero podría estar especificado en dias_semana del módulo
    if (asignacion.moduloDiasSemana) {
      // Parsear "Lunes a Jueves" → ["Lunes", "Martes", "Miércoles", "Jueves"]
      if (asignacion.moduloDiasSemana.includes('Lunes a Jueves')) {
        return ['Lunes', 'Martes', 'Miércoles', 'Jueves'];
      }
    }

    // Por defecto: un día aleatorio (esto no debería pasar en producción)
    return ['Lunes'];
  }

  /**
   * Configurar módulos según los sistemas presentes
   */
  configurarModulos(): void {
    const tieneSabatino = this.horarios.some(h => h.sistema === 'SABATINO');
    const tieneEscolarizado = this.horarios.some(h => h.sistema === 'ESCOLARIZADO');

    // Si tiene ambos, mostrar hasta módulo 4
    if (tieneEscolarizado && tieneSabatino) {
      this.modulos = this.modulosEscolarizado;
    } else if (tieneSabatino) {
      this.modulos = this.modulosSabatino;
    } else {
      this.modulos = this.modulosEscolarizado;
    }
  }

  /**
   * Organizar horarios por día
   */
  organizarHorarios(): void {
    this.dias.forEach(dia => {
      const clases = this.horarios.filter(h => h.dia === dia);
      this.horariosPorDia.set(dia, clases);
    });
  }

  /**
   * Obtener clase para un día y módulo específico
   */
  getClase(dia: string, modulo: number): HorarioClase | null {
    const clasesDelDia = this.horariosPorDia.get(dia) || [];
    return clasesDelDia.find(c => c.modulo === modulo) || null;
  }

  /**
   * Verificar si hay clase en un slot
   */
  hasClase(dia: string, modulo: number): boolean {
    return this.getClase(dia, modulo) !== null;
  }

  /**
   * Obtener clase CSS según el sistema
   */
  getSistemaClass(sistema: string): string {
    return sistema === 'ESCOLARIZADO' ? 'escolarizado' : 'sabatino';
  }

  /**
   * Contar total de horas semanales
   */
  getTotalHoras(): number {
    return this.horarios.reduce((total, clase) => {
      const inicio = this.parseHora(clase.horaInicio);
      const fin = this.parseHora(clase.horaFin);
      return total + (fin - inicio) / 60; // Horas
    }, 0);
  }

  /**
   * Convertir hora a minutos
   */
  parseHora(hora: string): number {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
  }

  /**
   * Obtener materias únicas
   */
  getMateriasUnicas(): string[] {
    const materias = new Set(this.horarios.map(h => h.materia));
    return Array.from(materias);
  }

  /**
   * Recargar horarios
   */
  reloadSchedule(): void {
    this.loadSchedule();
  }
}