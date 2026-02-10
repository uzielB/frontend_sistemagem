import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';

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

@Component({
  selector: 'app-schedule',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule
  ],
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.css']
})
export class ScheduleComponent implements OnInit {
  
  dias: string[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  modulos: { numero: number; hora: string }[] = [
    { numero: 1, hora: '08:00 - 09:30' },
    { numero: 2, hora: '10:00 - 11:30' },
    { numero: 3, hora: '12:00 - 13:30' },
    { numero: 4, hora: '13:30 - 15:00' }
  ];

  // Datos de demostración
  horarios: HorarioClase[] = [
    {
      dia: 'Lunes',
      modulo: 1,
      horaInicio: '08:00',
      horaFin: '09:30',
      materia: 'Anatomía Humana',
      grupo: '1A',
      aula: 'A-101',
      sistema: 'ESCOLARIZADO'
    },
    {
      dia: 'Lunes',
      modulo: 3,
      horaInicio: '12:00',
      horaFin: '13:30',
      materia: 'Fisiología',
      grupo: '2B',
      aula: 'A-203',
      sistema: 'ESCOLARIZADO'
    },
    {
      dia: 'Martes',
      modulo: 2,
      horaInicio: '10:00',
      horaFin: '11:30',
      materia: 'Anatomía Humana',
      grupo: '1A',
      aula: 'A-101',
      sistema: 'ESCOLARIZADO'
    },
    {
      dia: 'Miércoles',
      modulo: 1,
      horaInicio: '08:00',
      horaFin: '09:30',
      materia: 'Fisiología',
      grupo: '2B',
      aula: 'A-203',
      sistema: 'ESCOLARIZADO'
    },
    {
      dia: 'Jueves',
      modulo: 4,
      horaInicio: '13:30',
      horaFin: '15:00',
      materia: 'Anatomía Humana',
      grupo: '1A',
      aula: 'A-101',
      sistema: 'ESCOLARIZADO'
    },
    {
      dia: 'Sábado',
      modulo: 1,
      horaInicio: '08:00',
      horaFin: '11:30',
      materia: 'Biomecánica',
      grupo: '3S',
      aula: 'B-105',
      sistema: 'SABATINO'
    },
    {
      dia: 'Sábado',
      modulo: 2,
      horaInicio: '11:30',
      horaFin: '14:30',
      materia: 'Biomecánica',
      grupo: '3S',
      aula: 'B-105',
      sistema: 'SABATINO'
    }
  ];

  horariosPorDia: Map<string, HorarioClase[]> = new Map();

  ngOnInit(): void {
    this.organizarHorarios();
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
}