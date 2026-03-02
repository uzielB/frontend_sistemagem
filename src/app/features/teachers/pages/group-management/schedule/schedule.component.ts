import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { TeachersService, TeacherAssignment } from '../../../../../core/services/teachers.service';

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
    MatTableModule, MatCardModule, MatIconModule,
    MatChipsModule, MatProgressSpinnerModule, MatButtonModule,
  ],
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.css']
})
export class ScheduleComponent implements OnInit {

  dias: string[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  modulos: ModuloHorario[] = [];

  modulosEscolarizado: ModuloHorario[] = [
    { numero: 1, hora: '08:00 - 09:30' },
    { numero: 2, hora: '10:00 - 11:30' },
    { numero: 3, hora: '12:00 - 13:30' },
    { numero: 4, hora: '13:30 - 15:00' },
  ];

  modulosSabatino: ModuloHorario[] = [
    { numero: 1, hora: '08:00 - 11:30' },
    { numero: 2, hora: '11:30 - 14:30' },
    { numero: 3, hora: '14:30 - 17:30' },
  ];

  horarios: HorarioClase[] = [];
  asignaciones: TeacherAssignment[] = [];
  horariosPorDia: Map<string, HorarioClase[]> = new Map();

  isLoading = false;
  errorMessage = '';
  sinAsignaciones = false;   // ✅ nuevo flag

  constructor(
    private teachersService: TeachersService,
    private router: Router,                    // ✅ nuevo
  ) {}

  ngOnInit(): void { this.loadSchedule(); }

  loadSchedule(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.sinAsignaciones = false;
    this.horarios = [];

    this.teachersService.getMyAssignments().subscribe({
      next: (response: any) => {
        this.asignaciones = response.asignaciones || [];

        if (this.asignaciones.length === 0) {
          this.sinAsignaciones = true;   // ✅ usa el estado especial
          this.isLoading = false;
          return;
        }

        this.transformAssignmentsToSchedule();
        this.configurarModulos();
        this.organizarHorarios();
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Error al cargar tus horarios. Verifica tu conexión.';
        this.isLoading = false;
      }
    });
  }

  // ✅ Navega al formulario de disponibilidad
  irADisponibilidad(): void {
    this.router.navigate(['/teachers/mi-disponibilidad']);
  }

  transformAssignmentsToSchedule(): void {
    this.horarios = [];
    this.asignaciones.forEach(asignacion => {
      const dias = this.getDiasFromAssignment(asignacion);
      const modulo = asignacion.moduloNumero || 1;
      const horaInicio = asignacion.moduloHoraInicio || '08:00';
      const horaFin    = asignacion.moduloHoraFin    || '09:30';
      const sistema    = asignacion.moduloSistema    || 'ESCOLARIZADO';

      dias.forEach(dia => {
        this.horarios.push({
          dia, modulo, horaInicio, horaFin,
          materia: asignacion.materia,
          grupo:   asignacion.grupo,
          aula:    asignacion.aula || 'Por asignar',
          sistema,
        });
      });
    });
  }

  getDiasFromAssignment(asignacion: any): string[] {
    if (asignacion.horario?.dias) return asignacion.horario.dias;

    const sistema = asignacion.moduloSistema || 'ESCOLARIZADO';
    if (sistema === 'SABATINO') return ['Sábado'];

    if (asignacion.moduloDiasSemana?.includes('Lunes a Jueves')) {
      return ['Lunes', 'Martes', 'Miércoles', 'Jueves'];
    }
    // Parsear "Lunes,Martes,Miercoles,Jueves" del campo dias_semana del módulo
    if (asignacion.moduloDiasSemana) {
      return asignacion.moduloDiasSemana.split(',').map((d: string) => d.trim()
        .replace('Miercoles', 'Miércoles'));
    }
    return ['Lunes'];
  }

  configurarModulos(): void {
    const tieneSab = this.horarios.some(h => h.sistema === 'SABATINO');
    const tieneEsc = this.horarios.some(h => h.sistema === 'ESCOLARIZADO');
    this.modulos = (tieneSab && !tieneEsc) ? this.modulosSabatino : this.modulosEscolarizado;
  }

  organizarHorarios(): void {
    this.dias.forEach(dia => {
      this.horariosPorDia.set(dia, this.horarios.filter(h => h.dia === dia));
    });
  }

  getClase(dia: string, modulo: number): HorarioClase | null {
    return (this.horariosPorDia.get(dia) || []).find(c => c.modulo === modulo) || null;
  }

  hasClase(dia: string, modulo: number): boolean { return !!this.getClase(dia, modulo); }

  getSistemaClass(sistema: string): string {
    return sistema === 'ESCOLARIZADO' ? 'escolarizado' : 'sabatino';
  }

  getTotalHoras(): number {
    return this.horarios.reduce((total, clase) => {
      return total + (this.parseHora(clase.horaFin) - this.parseHora(clase.horaInicio)) / 60;
    }, 0);
  }

  parseHora(hora: string): number {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
  }

  getMateriasUnicas(): string[] {
    return Array.from(new Set(this.horarios.map(h => h.materia)));
  }

  reloadSchedule(): void { this.loadSchedule(); }
}