import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-attendance-table',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatIconModule],
  template: `
    <div style="padding: 2rem;">
      <mat-card>
        <h2>🔨 Capturar Asistencias</h2>
        <p>Este módulo está en construcción</p>
        <p><a routerLink="/teachers">← Volver al dashboard</a></p>
      </mat-card>
    </div>
  `
})
export class AttendanceTableComponent {}