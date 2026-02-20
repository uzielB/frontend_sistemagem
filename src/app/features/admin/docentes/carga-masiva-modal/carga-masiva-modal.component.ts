import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { AdminDocentesService, Program, BatchUploadResult } from '../admin-docentes.service';

interface DialogData {
  programa: Program;
  periodoId: number;
}

@Component({
  selector: 'app-carga-masiva-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatListModule,
    MatDividerModule,
    MatChipsModule
  ],
  templateUrl: './carga-masiva-modal.component.html',
  styleUrls: ['./carga-masiva-modal.component.css']
})
export class CargaMasivaModalComponent implements OnInit {

  selectedFiles: File[] = [];
  isDragging = false;
  isUploading = false;
  uploadProgress = 0;
  result: BatchUploadResult | null = null;
  errorMessage = '';

  constructor(
    public dialogRef: MatDialogRef<CargaMasivaModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private adminDocentesService: AdminDocentesService
  ) {
    // ✅ AUMENTAR TAMAÑO DEL MODAL
    this.dialogRef.updateSize('95vw', '95vh');
  }

  ngOnInit(): void {}

  /**
   * Manejar selección de archivos
   */
  onFileSelected(event: any): void {
    const files: FileList = event.target.files;
    this.addFiles(Array.from(files));
  }

  /**
   * Drag over
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  /**
   * Drag leave
   */
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  /**
   * Drop files
   */
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (event.dataTransfer?.files) {
      const files = Array.from(event.dataTransfer.files);
      this.addFiles(files);
    }
  }

  /**
   * Agregar archivos validando
   */
  addFiles(files: File[]): void {
    this.errorMessage = '';

    // Filtrar solo PDFs
    const pdfFiles = files.filter(file => file.type === 'application/pdf');

    if (pdfFiles.length === 0) {
      this.errorMessage = 'Solo se permiten archivos PDF';
      return;
    }

    // Validar tamaño
    const oversized = pdfFiles.filter(file => file.size > 10 * 1024 * 1024);
    if (oversized.length > 0) {
      this.errorMessage = `${oversized.length} archivo(s) superan los 10MB`;
      return;
    }

    // Agregar archivos
    this.selectedFiles = [...this.selectedFiles, ...pdfFiles];
  }

  /**
   * Eliminar archivo de la lista
   */
  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }

  /**
   * Subir todos los archivos
   */
  uploadAll(): void {
    if (this.selectedFiles.length === 0) {
      this.errorMessage = 'No hay archivos seleccionados';
      return;
    }

    this.isUploading = true;
    this.errorMessage = '';
    this.uploadProgress = 0;
    this.result = null;

    // Simular progreso
    const progressInterval = setInterval(() => {
      if (this.uploadProgress < 90) {
        this.uploadProgress += 5;
      }
    }, 300);

    this.adminDocentesService.uploadMateriasMasivas(
      this.data.programa.id,
      this.data.periodoId,
      this.selectedFiles
    ).subscribe({
      next: (result) => {
        clearInterval(progressInterval);
        this.uploadProgress = 100;
        this.isUploading = false;
        this.result = result;
        
        // Limpiar archivos seleccionados
        this.selectedFiles = [];
      },
      error: (error) => {
        clearInterval(progressInterval);
        this.isUploading = false;
        this.uploadProgress = 0;
        console.error('Error al subir archivos:', error);
        
        if (error.error?.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'Error al subir los archivos. Verifica que el periodo escolar exista en la base de datos.';
        }
      }
    });
  }

  /**
   * Cerrar modal
   */
  close(): void {
    this.dialogRef.close(this.result ? 'uploaded' : null);
  }

  /**
   * Formatear tamaño de archivo
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}