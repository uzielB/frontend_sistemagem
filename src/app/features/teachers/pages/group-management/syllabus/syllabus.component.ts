import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

interface Temario {
  id: number;
  materia: string;
  nombreArchivo: string;
  fechaSubida: Date;
  tamano: string; // en MB
  url: string;
}

@Component({
  selector: 'app-syllabus',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule
  ],
  templateUrl: './syllabus.component.html',
  styleUrls: ['./syllabus.component.css']
})
export class SyllabusComponent implements OnInit {
  
  isUploading = false;
  uploadProgress = 0;
  errorMessage = '';
  successMessage = '';

  materiaControl = new FormControl('TODAS');

  // Datos de demostración
  temarios: Temario[] = [
    {
      id: 1,
      materia: 'Anatomía Humana',
      nombreArchivo: 'Temario_Anatomia_Humana_2025.pdf',
      fechaSubida: new Date('2025-01-15'),
      tamano: '2.3',
      url: '#'
    },
    {
      id: 2,
      materia: 'Fisiología',
      nombreArchivo: 'Temario_Fisiologia_Enero2025.pdf',
      fechaSubida: new Date('2025-01-18'),
      tamano: '1.8',
      url: '#'
    },
    {
      id: 3,
      materia: 'Biomecánica',
      nombreArchivo: 'Temario_Biomecanica_Sabatino.pdf',
      fechaSubida: new Date('2025-01-20'),
      tamano: '3.1',
      url: '#'
    }
  ];

  temariosFiltrados: Temario[] = [];
  materias: string[] = ['TODAS', 'Anatomía Humana', 'Fisiología', 'Biomecánica'];

  ngOnInit(): void {
    this.temariosFiltrados = [...this.temarios];
    this.materiaControl.valueChanges.subscribe(() => this.applyFilter());
  }

  /**
   * Aplicar filtro por materia
   */
  applyFilter(): void {
    const materia = this.materiaControl.value;
    if (materia === 'TODAS') {
      this.temariosFiltrados = [...this.temarios];
    } else {
      this.temariosFiltrados = this.temarios.filter(t => t.materia === materia);
    }
  }

  /**
   * Manejar selección de archivo
   */
  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    
    if (!file) return;

    // Validar que sea PDF
    if (file.type !== 'application/pdf') {
      this.errorMessage = 'Solo se permiten archivos PDF';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    // Validar tamaño (máx 10MB)
    if (file.size > 10 * 1024 * 1024) {
      this.errorMessage = 'El archivo no debe superar 10MB';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    this.uploadFile(file);
  }

  /**
   * Subir archivo (simulado)
   */
  uploadFile(file: File): void {
    this.isUploading = true;
    this.uploadProgress = 0;
    this.errorMessage = '';
    this.successMessage = '';

    console.log('📤 Subiendo archivo:', file.name);

    // Simular progreso de subida
    const interval = setInterval(() => {
      this.uploadProgress += 10;
      
      if (this.uploadProgress >= 100) {
        clearInterval(interval);
        
        // Simular archivo subido
        const nuevoTemario: Temario = {
          id: this.temarios.length + 1,
          materia: 'Anatomía Humana', // En producción, el usuario selecciona
          nombreArchivo: file.name,
          fechaSubida: new Date(),
          tamano: (file.size / (1024 * 1024)).toFixed(1),
          url: '#'
        };

        this.temarios.unshift(nuevoTemario);
        this.applyFilter();

        this.isUploading = false;
        this.successMessage = '✅ Temario subido exitosamente';
        
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      }
    }, 200);

    /* Código real para backend:
    const formData = new FormData();
    formData.append('file', file);
    formData.append('materia_id', this.selectedMateria);

    this.http.post(`${environment.apiUrl}/temarios/upload`, formData, {
      headers: { Authorization: `Bearer ${this.authService.getToken()}` },
      reportProgress: true,
      observe: 'events'
    }).subscribe({
      next: (event: any) => {
        if (event.type === HttpEventType.UploadProgress) {
          this.uploadProgress = Math.round(100 * event.loaded / event.total);
        } else if (event.type === HttpEventType.Response) {
          this.isUploading = false;
          this.successMessage = 'Temario subido exitosamente';
          this.loadTemarios();
        }
      },
      error: (error: any) => {
        this.isUploading = false;
        this.errorMessage = error.error?.message || 'Error al subir el archivo';
      }
    });
    */
  }

  /**
   * Descargar temario (simulado)
   */
  downloadTemario(temario: Temario): void {
    console.log('📥 Descargando:', temario.nombreArchivo);
    alert(`Descargando: ${temario.nombreArchivo}\n\nEn producción, esto descargará el archivo PDF desde el servidor.`);
    
    // En producción:
    // window.open(temario.url, '_blank');
  }

  /**
   * Eliminar temario (simulado)
   */
  deleteTemario(temario: Temario): void {
    const confirmDelete = confirm(`¿Estás seguro de eliminar el temario "${temario.nombreArchivo}"?`);
    
    if (!confirmDelete) return;

    console.log('🗑️ Eliminando:', temario.nombreArchivo);
    
    // Eliminar de la lista
    const index = this.temarios.findIndex(t => t.id === temario.id);
    if (index > -1) {
      this.temarios.splice(index, 1);
      this.applyFilter();
      this.successMessage = 'Temario eliminado exitosamente';
      setTimeout(() => this.successMessage = '', 3000);
    }

    /* Código real para backend:
    this.http.delete(`${environment.apiUrl}/temarios/${temario.id}`, {
      headers: { Authorization: `Bearer ${this.authService.getToken()}` }
    }).subscribe({
      next: () => {
        this.successMessage = 'Temario eliminado';
        this.loadTemarios();
      },
      error: (error) => {
        this.errorMessage = 'Error al eliminar';
      }
    });
    */
  }

  /**
   * Formatear fecha
   */
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }
}