import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';

import {
  DashboardService,
  DashboardData,
  UsuariosMetrics,
  DocentesMetrics,
  EstudiantesMetrics,
  AcademicoMetrics,
  AsignacionesMetrics,
  Alertas
} from '../../../core/services/dashboard.service';

interface QuickAction {
  title: string;
  icon: string;
  route: string;
  color: string;
  description: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule,
    MatBadgeModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  // Datos del dashboard
  dashboardData: DashboardData | null = null;
  
  // Control de carga
  isLoading = false;
  errorMessage = '';

  // Accesos rápidos
  quickActions: QuickAction[] = [
    {
      title: 'Gestión de Usuarios',
      icon: 'people',
      route: '/admin/usuarios',
      color: 'primary',
      description: 'Administrar usuarios del sistema'
    },
    {
      title: 'Gestión de Docentes',
      icon: 'school',
      route: '/admin/docentes',
      color: 'accent',
      description: 'Administrar docentes'
    },
    {
      title: 'Programas Académicos',
      icon: 'menu_book',
      route: '/admin/programas',
      color: 'success',
      description: 'Gestionar programas y materias'
    },
    {
      title: 'Asignaciones',
      icon: 'assignment',
      route: '/admin/asignaciones',
      color: 'warn',
      description: 'Asignar docentes a materias'
    },
    {
      title: 'Grupos',
      icon: 'groups',
      route: '/admin/grupos',
      color: 'info',
      description: 'Administrar grupos'
    },
    {
      title: 'Reportes',
      icon: 'assessment',
      route: '/admin/reportes',
      color: 'secondary',
      description: 'Ver reportes e indicadores'
    }
  ];

  constructor(
    private dashboardService: DashboardService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  /**
   * Cargar métricas del dashboard
   */
  loadDashboard(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.dashboardService.getDashboardMetrics().subscribe({
      next: (data: DashboardData) => {
        this.dashboardData = data;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('❌ Error al cargar dashboard:', error);
        this.errorMessage = 'Error al cargar las métricas del sistema. Por favor, intenta de nuevo.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Recargar dashboard
   */
  reloadDashboard(): void {
    this.loadDashboard();
  }

  /**
   * Navegar a una acción rápida
   */
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  /**
   * Obtener total de alertas
   */
  getTotalAlertas(): number {
    if (!this.dashboardData) return 0;
    
    const alertas = this.dashboardData.alertas;
    return alertas.documentosDocentesPendientes +
           alertas.planeacionesPendientesRevision +
           alertas.disponibilidadPendienteRevision +
           alertas.asignacionesSinModulo +
           alertas.docentesSinFormulario +
           alertas.docentesSinDocumentos +
           alertas.estudiantesSinDocumentos;
  }

  /**
   * Obtener porcentaje de docentes completos
   */
  getPorcentajeDocentesCompletos(): number {
    if (!this.dashboardData || this.dashboardData.docentes.totalDocentes === 0) {
      return 0;
    }

    const total = this.dashboardData.docentes.totalDocentes;
    const completos = this.dashboardData.docentes.docentesConDocumentosCompletos;

    return Math.round((completos / total) * 100);
  }

  /**
   * Obtener porcentaje de asignaciones cubiertas
   */
  getPorcentajeAsignacionesCubiertas(): number {
    if (!this.dashboardData || this.dashboardData.asignaciones.totalAsignaciones === 0) {
      return 0;
    }

    const total = this.dashboardData.asignaciones.totalAsignaciones;
    const cubiertas = this.dashboardData.asignaciones.asignacionesActivas;

    return Math.round((cubiertas / total) * 100);
  }

  /**
   * Formatear fecha del periodo actual
   */
  formatPeriodoDates(): string {
    const periodo = this.dashboardData?.academico.periodoActual;
    if (!periodo) return 'No definido';

    const inicio = new Date(periodo.fechaInicio).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
    const fin = new Date(periodo.fechaFin).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });

    return `${inicio} - ${fin}`;
  }

  /**
   * Obtener clase CSS según el valor
   */
  getAlertClass(valor: number): string {
    if (valor === 0) return 'alert-success';
    if (valor < 5) return 'alert-warning';
    return 'alert-danger';
  }

  /**
   * Obtener top 3 programas con más estudiantes
   */
  getTop3Programas(): Array<{ programaNombre: string; cantidad: number }> {
    if (!this.dashboardData) return [];

    return this.dashboardData.estudiantes.estudiantesPorPrograma
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 3);
  }
}