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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { PreinscripcionesService } from '../../core/services/preinscripciones.service';
import Swal from 'sweetalert2';

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
    MatNativeDateModule,
    MatCheckboxModule
  ],
  templateUrl: './preinscripcion-modal.component.html',
  styleUrls: ['./preinscripcion-modal.component.css']
})
export class PreinscripcionModalComponent {
  preinscripcionForm: FormGroup;
  enviando: boolean = false;
  
  // Fecha inicial para el datepicker (18 años atrás)
  fechaInicio: Date;
  
  // Catálogos
  carreras = [
    'Licenciatura en Arquitectura e Imagen',
    'Licenciatura en Trabajo Social',
    'Licenciatura en Ciencias de la Educación',
    'Licenciatura en Derecho',
    'Licenciatura en Diseño Gráfico y Mercadotecnia Publicitaria',
    'Licenciatura en Fisioterapia',
    'Licenciatura en Psicopedagogía'
  ];

  modalidades = [
    'ESCOLARIZADO',
    'SABATINO'
  ];

  estados = [
    'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche',
    'Chiapas', 'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima',
    'Durango', 'Estado de México', 'Guanajuato', 'Guerrero', 'Hidalgo',
    'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca',
    'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa',
    'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<PreinscripcionModalComponent>,
    private preinscripcionesService: PreinscripcionesService
  ) {
    // Calcular fecha de inicio (18 años atrás desde hoy)
    this.fechaInicio = new Date();
    this.fechaInicio.setFullYear(this.fechaInicio.getFullYear() - 18);

    this.preinscripcionForm = this.fb.group({
      // Datos Personales
      nombres: ['', [Validators.required, Validators.minLength(2)]],
      apellidoPaterno: ['', [Validators.required, Validators.minLength(2)]],
      apellidoMaterno: ['', [Validators.required, Validators.minLength(2)]],
      fechaNacimiento: ['', Validators.required],
      curp: ['', [Validators.required, Validators.pattern(/^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d$/)]],
      estadoNacimiento: ['', Validators.required],
      estadoResidencia: ['', Validators.required],
      
      // Contacto
      telefono: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      telefonoCasa: [''],
      domicilio: ['', Validators.required],
      
      // Tutor
      nombreTutor: ['', Validators.required],
      telefonoTutor: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      
      // Interés Académico
      carreraInteres: ['', Validators.required],
      modalidad: ['', Validators.required],
      
      // Procedencia
      escuelaProcedencia: ['', Validators.required],
      direccionEscuela: ['', Validators.required],
      estadoEscuela: ['', Validators.required],
      promedioGeneral: ['', [Validators.required, Validators.min(6.0), Validators.max(10.0)]],
      
      // Laboral (opcional)
      trabajaActualmente: [false],
      nombreEmpresa: [''],
      domicilioEmpresa: ['']
    });
  }

  cerrarModal(): void {
    this.dialogRef.close();
  }

  /**
   * Convertir CURP a mayúsculas automáticamente
   */
  convertirMayusculas(event: any): void {
    const input = event.target;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    
    input.value = input.value.toUpperCase();
    this.preinscripcionForm.get('curp')?.setValue(input.value.toUpperCase(), { emitEvent: false });
    
    input.setSelectionRange(start, end);
  }

  onSubmit(): void {
    if (this.preinscripcionForm.invalid) {
      Object.keys(this.preinscripcionForm.controls).forEach(key => {
        this.preinscripcionForm.get(key)?.markAsTouched();
      });
      
      Swal.fire({
        icon: 'warning',
        title: 'Formulario Incompleto',
        text: 'Por favor, completa todos los campos requeridos',
        confirmButtonColor: '#e3201b'
      });
      
      return;
    }

    this.enviando = true;

    // Mapear datos del formulario al formato del backend
    const datosPreinscripcion = {
      // Interés Académico
      carreraInteres: this.preinscripcionForm.value.carreraInteres,
      modalidad: this.preinscripcionForm.value.modalidad,

      // Datos Personales
      nombre: this.preinscripcionForm.value.nombres,
      apellidoPaterno: this.preinscripcionForm.value.apellidoPaterno,
      apellidoMaterno: this.preinscripcionForm.value.apellidoMaterno,
      curp: this.preinscripcionForm.value.curp.toUpperCase(),
      fechaNacimiento: this.formatearFecha(this.preinscripcionForm.value.fechaNacimiento),
      estadoNacimiento: this.preinscripcionForm.value.estadoNacimiento,
      estado: this.preinscripcionForm.value.estadoResidencia,
      domicilio: this.preinscripcionForm.value.domicilio,

      // Contacto
      telefonoCelular: this.preinscripcionForm.value.telefono,

      // Tutor
      nombreTutor: this.preinscripcionForm.value.nombreTutor,
      telefonoTutor: this.preinscripcionForm.value.telefonoTutor,

      // Procedencia
      escuelaProcedencia: this.preinscripcionForm.value.escuelaProcedencia,
      direccionEscuelaProcedencia: this.preinscripcionForm.value.direccionEscuela,
      estadoEscuela: this.preinscripcionForm.value.estadoEscuela,
      promedio: parseFloat(this.preinscripcionForm.value.promedioGeneral),

      // Laboral
      trabajaActualmente: this.preinscripcionForm.value.trabajaActualmente,
      nombreEmpresa: this.preinscripcionForm.value.nombreEmpresa || null,
      domicilioEmpresa: this.preinscripcionForm.value.domicilioEmpresa || null
    };

    console.log('📤 Enviando preinscripción:', datosPreinscripcion);

    // Enviar al backend
    this.preinscripcionesService.crearPreinscripcion(datosPreinscripcion).subscribe({
      next: (response: any) => {
        console.log('✅ Preinscripción creada:', response);
        
        this.enviando = false;
        
        Swal.fire({
          icon: 'success',
          title: '¡Preinscripción Exitosa!',
          html: `
            <p>Tu preinscripción ha sido registrada correctamente.</p>
            <p><strong>CURP:</strong> ${datosPreinscripcion.curp}</p>
            <p><strong>Carrera:</strong> ${datosPreinscripcion.carreraInteres}</p>
            <p>En breve nos pondremos en contacto contigo.</p>
          `,
          confirmButtonColor: '#e3201b',
          confirmButtonText: 'Aceptar'
        }).then(() => {
          this.dialogRef.close(response);
        });
      },
      error: (error: any) => {
        console.error('❌ Error al crear preinscripción:', error);
        
        this.enviando = false;

        let mensajeError = 'Ocurrió un error al procesar tu preinscripción';
        
        if (error.status === 409) {
          mensajeError = 'Ya existe una preinscripción con este CURP';
        } else if (error.error?.message) {
          mensajeError = error.error.message;
        }

        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: mensajeError,
          confirmButtonColor: '#e3201b'
        });
      }
    });
  }

  /**
   * Formatear fecha para enviar al backend (YYYY-MM-DD)
   */
  private formatearFecha(fecha: Date): string {
    if (!fecha) return '';
    
    const d = new Date(fecha);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }

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
      if (fieldName === 'telefono' || fieldName === 'telefonoTutor') {
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