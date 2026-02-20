import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { AdminDocentesService, Materia, ArchivoTemarioBase } from '../admin-docentes.service';

interface DialogData {
  materia: Materia;
  programaNombre: string;
  periodoId: number;
}

@Component({
  selector: 'app-gestionar-temarios-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatListModule,
    MatDividerModule,
    MatTooltipModule,
    MatChipsModule
  ],
  templateUrl: './gestionar-temarios-modal.component.html',
  styleUrls: ['./gestionar-temarios-modal.component.css']
})
export class GestionarTemariosModalComponent implements OnInit {

  archivos: ArchivoTemarioBase[] = [];
  isLoading = false;
  isUploading = false;
  uploadProgress = 0;
  errorMessage = '';
  successMessage = '';

  // Formulario de subida
  selectedFile: File | null = null;
  fileName = '';
  fileSize = '';
  titulo = '';
  descripcion = '';
  tipo = 'GENERAL';

  constructor(
    public dialogRef: MatDialogRef<GestionarTemariosModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private adminDocentesService: AdminDocentesService
  ) {}

  ngOnInit(): void {
    this.loadArchivos();
  }

  /**
   * Cargar lista de archivos
   */
  loadArchivos(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.adminDocentesService.getArchivosTemariosBase(this.data.materia.id, this.data.periodoId).subscribe({
      next: (archivos) => {
        this.archivos = archivos;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar archivos:', error);
        this.errorMessage = 'Error al cargar los archivos';
        this.isLoading = false;
      }
    });
  }

  /**
   * Manejar selección de archivo
   */
  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    
    if (file) {
      // Validar que sea PDF
      if (file.type !== 'application/pdf') {
        this.errorMessage = 'Solo se permiten archivos PDF';
        return;
      }

      // Validar tamaño (máx 10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        this.errorMessage = 'El archivo no debe superar los 10MB';
        return;
      }

      this.selectedFile = file;
      this.fileName = file.name;
      this.fileSize = this.formatFileSize(file.size);
      this.titulo = file.name.replace('.pdf', '');
      this.errorMessage = '';
    }
  }

  /**
   * Subir archivo
   */
  uploadArchivo(): void {
    if (!this.selectedFile || !this.titulo) {
      this.errorMessage = 'Por favor selecciona un archivo y proporciona un título';
      return;
    }

    this.isUploading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.uploadProgress = 0;

    const uploadData = {
      materiaId: this.data.materia.id,
      periodoEscolarId: this.data.periodoId,
      titulo: this.titulo,
      descripcion: this.descripcion,
      tipo: this.tipo
    };

    // Simular progreso
    const progressInterval = setInterval(() => {
      if (this.uploadProgress < 90) {
        this.uploadProgress += 10;
      }
    }, 200);

    this.adminDocentesService.uploadArchivoTemarioBase(this.selectedFile, uploadData).subscribe({
      next: (response) => {
        clearInterval(progressInterval);
        this.uploadProgress = 100;
        this.isUploading = false;
        this.successMessage = 'Archivo subido exitosamente';
        
        // Limpiar formulario
        this.selectedFile = null;
        this.fileName = '';
        this.fileSize = '';
        this.titulo = '';
        this.descripcion = '';
        
        // Recargar lista
        this.loadArchivos();

        // Limpiar mensaje después de 2 segundos
        setTimeout(() => {
          this.successMessage = '';
        }, 2000);
      },
      error: (error) => {
        clearInterval(progressInterval);
        this.isUploading = false;
        this.uploadProgress = 0;
        console.error('Error al subir archivo:', error);
        
        if (error.error?.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'Error al subir el archivo';
        }
      }
    });
  }

  /**
   * Eliminar archivo
   */
  deleteArchivo(archivo: ArchivoTemarioBase): void {
    if (!confirm(`¿Eliminar el archivo "${archivo.titulo}"?`)) {
      return;
    }

    this.adminDocentesService.deleteArchivoTemarioBase(archivo.id).subscribe({
      next: () => {
        this.successMessage = 'Archivo eliminado correctamente';
        this.loadArchivos();
        
        setTimeout(() => {
          this.successMessage = '';
        }, 2000);
      },
      error: (error) => {
        console.error('Error al eliminar archivo:', error);
        this.errorMessage = 'Error al eliminar el archivo';
      }
    });
  }

  /**
   * Ver/Descargar PDF
   */
  verPDF(archivo: ArchivoTemarioBase): void {
    const apiUrl = 'http://localhost:3000'; // Cambiar en producción
    const pdfUrl = `${apiUrl}/${archivo.archivoPdf}`;
    window.open(pdfUrl, '_blank');
  }

  /**
   * Cerrar modal
   */
  close(): void {
    this.dialogRef.close(this.archivos.length > 0 ? 'updated' : null);
  }

  /**
   * Formatear tamaño de archivo
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}