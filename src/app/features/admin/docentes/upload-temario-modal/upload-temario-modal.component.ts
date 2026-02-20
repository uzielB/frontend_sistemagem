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
import { AdminDocentesService, Materia } from '../admin-docentes.service';

interface DialogData {
  materia: Materia;
  programaNombre: string;
}

@Component({
  selector: 'app-upload-temario-modal',
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
    MatProgressBarModule
  ],
  templateUrl: './upload-temario-modal.component.html',
  styleUrls: ['./upload-temario-modal.component.css']
})
export class UploadTemarioModalComponent implements OnInit {

  selectedFile: File | null = null;
  fileName = '';
  fileSize = '';
  
  titulo = '';
  descripcion = '';
  periodoEscolarId = 1; // Por defecto periodo actual

  isUploading = false;
  uploadProgress = 0;
  errorMessage = '';
  successMessage = '';

  constructor(
    public dialogRef: MatDialogRef<UploadTemarioModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private adminDocentesService: AdminDocentesService
  ) {}

  ngOnInit(): void {
    // Título por defecto es el nombre de la materia
    this.titulo = `Temario ${this.data.materia.nombre}`;
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
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        this.errorMessage = 'El archivo no debe superar los 10MB';
        return;
      }

      this.selectedFile = file;
      this.fileName = file.name;
      this.fileSize = this.formatFileSize(file.size);
      this.errorMessage = '';
    }
  }

  /**
   * Subir temario
   */
  uploadTemario(): void {
    if (!this.selectedFile) {
      this.errorMessage = 'Por favor selecciona un archivo PDF';
      return;
    }

    this.isUploading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.uploadProgress = 0;

    const uploadData = {
      materiaId: this.data.materia.id,
      periodoEscolarId: this.periodoEscolarId,
      titulo: this.titulo,
      descripcion: this.descripcion
    };

    // Simular progreso
    const progressInterval = setInterval(() => {
      if (this.uploadProgress < 90) {
        this.uploadProgress += 10;
      }
    }, 200);

    this.adminDocentesService.uploadTemario(this.selectedFile, uploadData).subscribe({
      next: (response) => {
        clearInterval(progressInterval);
        this.uploadProgress = 100;
        this.isUploading = false;
        this.successMessage = 'Temario subido exitosamente';
        
        // Cerrar modal después de 1.5 segundos
        setTimeout(() => {
          this.dialogRef.close('uploaded');
        }, 1500);
      },
      error: (error) => {
        clearInterval(progressInterval);
        this.isUploading = false;
        this.uploadProgress = 0;
        console.error('Error al subir temario:', error);
        
        if (error.error?.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'Error al subir el temario. Por favor, intenta de nuevo.';
        }
      }
    });
  }

  /**
   * Cancelar y cerrar
   */
  cancel(): void {
    this.dialogRef.close();
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