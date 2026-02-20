import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AdminDocentesService, Program } from '../admin-docentes.service';
import { CargaMasivaModalComponent } from '../carga-masiva-modal/carga-masiva-modal.component';

@Component({
  selector: 'app-programas-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatBadgeModule,
    MatDialogModule
  ],
  templateUrl: './programas-list.component.html',
  styleUrls: ['./programas-list.component.css']
})
export class ProgramasListComponent implements OnInit {

  programas: Program[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(
    private adminDocentesService: AdminDocentesService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadProgramas();
  }

  /**
   * Cargar programas (carreras)
   */
  loadProgramas(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.adminDocentesService.getProgramas({ estaActivo: true }).subscribe({
      next: (data) => {
        this.programas = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar programas:', error);
        this.errorMessage = 'Error al cargar las carreras. Por favor, intenta de nuevo.';
        this.isLoading = false;
      }
    });
  }

  /**
   * Ver materias de un programa
   */
  verMaterias(programaId: number): void {
    this.router.navigate(['/admin/docentes/programas', programaId, 'materias']);
  }

  /**
   * Abrir modal de carga masiva
   */
  subirMateriasMasivas(programa: Program): void {
    const dialogRef = this.dialog.open(CargaMasivaModalComponent, {
      width: '800px',
      maxHeight: '90vh',
      data: {
        programa: programa,
        periodoId: 1 // Por ahora fijo, idealmente obtener el actual
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'uploaded') {
        // Recargar programas para actualizar contadores
        this.loadProgramas();
      }
    });
  }

  /**
   * Obtener icono según modalidad
   */
  getModalidadIcon(modalidad: string): string {
    switch (modalidad.toUpperCase()) {
      case 'ESCOLARIZADO':
        return 'school';
      case 'SABATINO':
        return 'weekend';
      default:
        return 'book';
    }
  }

  /**
   * Obtener color según modalidad
   */
  getModalidadColor(modalidad: string): string {
    switch (modalidad.toUpperCase()) {
      case 'ESCOLARIZADO':
        return 'primary';
      case 'SABATINO':
        return 'accent';
      default:
        return 'warn';
    }
  }
}