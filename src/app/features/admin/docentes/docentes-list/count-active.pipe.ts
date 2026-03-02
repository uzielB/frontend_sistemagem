import { Pipe, PipeTransform } from '@angular/core';
import { DocenteAdmin } from '../admin-docentes.service';

@Pipe({ name: 'countActive', standalone: true })
export class CountActivePipe implements PipeTransform {
  transform(docentes: DocenteAdmin[]): number {
    return docentes?.filter(d => d.estaActivo).length ?? 0;
  }
}