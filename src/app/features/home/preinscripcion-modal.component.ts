import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-preinscripcion-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './preinscripcion-modal.component.html',
  styleUrls: ['./preinscripcion-modal.component.css']
})
export class PreinscripcionModalComponent {
  preinscripcionForm: FormGroup;
  
  // Catálogos (puedes editarlos según tus necesidades)
  carreras = [
    'Arquitectura e Imagen',
    'Trabajo Social',
    'Ciencias de la Educación',
    'Derecho',
    'Diseño Gráfico y Mercadotecnia Publicitaria',
    'Fisioterapia',
    'Psicopedagogía'
  ];

  modalidades = [
    'Escolarizado',
    'Sabatino'
  ];

  campus = [
    'Campus Oaxaca Centro',
    'Campus Oaxaca Norte',
    'Campus Oaxaca Sur'
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<PreinscripcionModalComponent>
  ) {
    // Formulario con validaciones básicas
    this.preinscripcionForm = this.fb.group({
      // Datos Personales
      nombres: ['', [Validators.required, Validators.minLength(2)]],
      apellidoPaterno: ['', [Validators.required, Validators.minLength(2)]],
      apellidoMaterno: ['', [Validators.required, Validators.minLength(2)]],
      fechaNacimiento: ['', Validators.required],
      curp: ['', [Validators.required, Validators.pattern(/^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d$/)]],
      
      // Contacto
      telefono: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      email: ['', [Validators.required, Validators.email]],
      
      // Interés Académico
      carreraInteres: ['', Validators.required],
      modalidad: ['', Validators.required],
      campusPreferido: ['', Validators.required],
      
      // Procedencia
      escuelaProcedencia: ['', Validators.required],
      promedioGeneral: ['', [Validators.required, Validators.min(6.0), Validators.max(10.0)]]
    });
  }

  // Cerrar modal
  cerrarModal(): void {
    this.dialogRef.close();
  }

  // Enviar formulario
  onSubmit(): void {
    if (this.preinscripcionForm.valid) {
      const datosPreinscripcion = this.preinscripcionForm.value;
      
      // TODO: Aquí conectarás con tu servicio de backend
      console.log('Datos de preinscripción:', datosPreinscripcion);
      
      // Cerrar modal después de enviar
      this.dialogRef.close(datosPreinscripcion);
      
      // TODO: Mostrar mensaje de éxito con SweetAlert2
      // Swal.fire('¡Éxito!', 'Tu preinscripción ha sido registrada', 'success');
    } else {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.preinscripcionForm.controls).forEach(key => {
        this.preinscripcionForm.get(key)?.markAsTouched();
      });
    }
  }

  // Helpers para mostrar errores
  getErrorMessage(fieldName: string): string {
    const control = this.preinscripcionForm.get(fieldName);
    
    if (control?.hasError('required')) {
      return 'Este campo es obligatorio';
    }
    
    if (control?.hasError('email')) {
      return 'Ingresa un correo electrónico válido';
    }
    
    if (control?.hasError('pattern')) {
      if (fieldName === 'curp') {
        return 'CURP inválido (18 caracteres)';
      }
      if (fieldName === 'telefono') {
        return 'Teléfono inválido (10 dígitos)';
      }
    }
    
    if (control?.hasError('minLength')) {
      return 'Mínimo 2 caracteres';
    }
    
    if (control?.hasError('min') || control?.hasError('max')) {
      return 'Promedio entre 6.0 y 10.0';
    }
    
    return '';
  }
}