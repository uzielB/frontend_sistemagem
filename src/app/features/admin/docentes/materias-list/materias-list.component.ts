import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AdminDocentesService, Materia, ArchivoTemarioBase } from '../admin-docentes.service';

@Component({
  selector: 'app-materias-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './materias-list.component.html',
  styleUrls: ['./materias-list.component.css']
})
export class MateriasListComponent implements OnInit {

  programaId: number = 0;
  programaNombre: string = '';
  programaCodigo: string = '';

  materias: Materia[] = [];
  materiasConArchivos: (Materia & { archivoTemario?: ArchivoTemarioBase })[] = [];
  
  isLoading = false;
  errorMessage = '';

  displayedColumns: string[] = ['semestre', 'codigo', 'nombre', 'temario', 'acciones'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private adminDocentesService: AdminDocentesService
  ) {}

  ngOnInit(): void {
    this.programaId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadProgramaDetail();
  }

  /**
   * Cargar detalle del programa y sus materias
   */
  loadProgramaDetail(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.adminDocentesService.getProgramaDetail(this.programaId).subscribe({
      next: (data) => {
        console.log('📚 Programa cargado:', data);
        this.programaNombre = data.nombre;
        this.programaCodigo = data.codigo;
        this.materias = data.materias;
        
        // Cargar archivos de temario para cada materia
        this.loadArchivosTemario();
      },
      error: (error) => {
        console.error('❌ Error al cargar programa:', error);
        this.errorMessage = 'Error al cargar las materias';
        this.isLoading = false;
      }
    });
  }

  /**
   * ✅ CORREGIDO: Cargar archivos de temario base de cada materia
   */
  loadArchivosTemario(): void {
    const periodoEscolarId = 1; // ID del periodo actual (ajustar según tu lógica)
    
    // Crear array de promesas para cargar archivos de todas las materias
    const requests = this.materias.map(materia => {
      console.log(`📄 Cargando archivos de materia ${materia.codigo} (ID: ${materia.id})`);
      
      return this.adminDocentesService
        .getArchivosTemariosBase(materia.id, periodoEscolarId)
        .toPromise()
        .then(archivos => {
          console.log(`✅ Archivos encontrados para ${materia.codigo}:`, archivos);
          return archivos || [];
        })
        .catch(error => {
          console.warn(`⚠️ No se encontraron archivos para ${materia.codigo}:`, error);
          return [];
        });
    });

    // Esperar a que todas las peticiones terminen
    Promise.all(requests).then(results => {
      console.log('📦 Resultados completos de archivos:', results);
      
      // Combinar materias con sus archivos
      this.materiasConArchivos = this.materias.map((materia, index) => {
        const archivos = results[index] || [];
        const archivoTemario = archivos.length > 0 ? archivos[0] : undefined;
        
        console.log(`🔗 Materia ${materia.codigo}:`, {
          tieneArchivo: !!archivoTemario,
          archivo: archivoTemario
        });
        
        return {
          ...materia,
          archivoTemario
        };
      });
      
      console.log('✨ Materias con archivos cargadas:', this.materiasConArchivos);
      this.isLoading = false;
    }).catch(error => {
      console.error('❌ Error al cargar archivos:', error);
      
      // Si falla, al menos mostrar las materias sin archivos
      this.materiasConArchivos = this.materias.map(m => ({ ...m }));
      this.isLoading = false;
    });
  }

  /**
   * ✅ Ver PDF del temario oficial
   */
  verTemario(materia: Materia & { archivoTemario?: ArchivoTemarioBase }): void {
    if (!materia.archivoTemario) {
      alert('Esta materia no tiene temario subido');
      return;
    }

    console.log('👁️ Abriendo PDF:', materia.archivoTemario.archivoPdf);

    // Construir URL del PDF
    let pdfUrl = materia.archivoTemario.archivoPdf;
    
    // Si la ruta no incluye el dominio, agregarlo
    if (!pdfUrl.startsWith('http')) {
      pdfUrl = `http://localhost:3000/${pdfUrl}`;
    }

    console.log('🔗 URL final del PDF:', pdfUrl);

    // Abrir PDF en nueva pestaña
    window.open(pdfUrl, '_blank');
  }

  /**
   * ✅ Descargar PDF del temario
   */
  descargarTemario(materia: Materia & { archivoTemario?: ArchivoTemarioBase }): void {
    if (!materia.archivoTemario) {
      alert('Esta materia no tiene temario subido');
      return;
    }

    console.log('💾 Descargando PDF:', materia.archivoTemario.archivoPdf);

    // Construir URL del PDF
    let pdfUrl = materia.archivoTemario.archivoPdf;
    
    if (!pdfUrl.startsWith('http')) {
      pdfUrl = `http://localhost:3000/${pdfUrl}`;
    }

    // Crear enlace de descarga
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = materia.archivoTemario.nombreOriginal || `${materia.codigo}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Ver planeaciones de docentes (placeholder)
   */
  verPlaneaciones(materia: Materia): void {
    alert(`Función próximamente: Ver planeaciones de docentes para ${materia.nombre}`);
    // TODO: Implementar vista de planeaciones de docentes
  }

  /**
   * Eliminar materia
   */
  deleteMateria(materia: Materia): void {
    const confirmMessage = `¿Estás seguro de eliminar la materia "${materia.nombre}"?\n\nEsta acción eliminará:\n- La materia\n- Todos sus temarios\n\nEsta acción no se puede deshacer.`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    this.adminDocentesService.deleteMateria(materia.id).subscribe({
      next: (response) => {
        alert('✅ Materia eliminada correctamente');
        this.loadProgramaDetail();
      },
      error: (error) => {
        console.error('❌ Error al eliminar materia:', error);
        alert('❌ Error al eliminar la materia');
      }
    });
  }

  /**
   * Volver a la lista de programas
   */
  goBack(): void {
    this.router.navigate(['/admin/docentes/programas']);
  }
}