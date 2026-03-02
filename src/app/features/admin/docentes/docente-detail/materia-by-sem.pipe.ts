import { Pipe, PipeTransform } from '@angular/core';
import { MateriaAsignada } from '../admin-docentes.service';

/**
 * Pipe para filtrar materias por semestre en el template de docente-detail.
 *
 * UBICACIÓN: src/app/features/admin/docentes/docente-detail/materias-by-sem.pipe.ts
 *
 * USO en HTML:
 *   <ng-container *ngFor="let sem of [1,2,3,4,5,6,7,8,9,10]">
 *     <ng-container *ngIf="grupo.materias | materiasBySem:sem as mats">
 *       <ng-container *ngIf="mats.length > 0">...</ng-container>
 *     </ng-container>
 *   </ng-container>
 *
 * AGREGAR al imports[] del DocenteDetailComponent:
 *   import { MateriasBySemPipe } from './materias-by-sem.pipe';
 *   imports: [ ..., MateriasBySemPipe ]
 */
@Pipe({
  name: 'materiasBySem',
  standalone: true,
  pure: true,
})
export class MateriasBySemPipe implements PipeTransform {
  transform(materias: MateriaAsignada[], semestre: number): MateriaAsignada[] {
    if (!materias) return [];
    return materias.filter(m => m.semestre === semestre);
  }
}

// ── También necesitas este pipe en docente-list.html ──────────────────────
// El pipe `countActive` no existe en Angular Material. Reemplaza en el HTML:
//
//   ANTES: {{ docentes | countActive }}
//   DESPUÉS: {{ docentes.length }}
//
// O crea este pipe en:
// src/app/features/admin/docentes/docentes-list/count-active.pipe.ts

@Pipe({
  name: 'countActive',
  standalone: true,
  pure: true,
})
export class CountActivePipe implements PipeTransform {
  transform(docentes: any[]): number {
    if (!docentes) return 0;
    return docentes.filter(d => d.estaActivo).length;
  }
}