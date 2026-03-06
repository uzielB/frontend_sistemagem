import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder, FormGroup, Validators, ReactiveFormsModule,
  AbstractControl, ValidationErrors
} from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatStepperModule } from '@angular/material/stepper';
import { PreinscripcionesService, Programa } from '../../core/services/preinscripciones.service';
import Swal from 'sweetalert2';

// ── Validador promedio 0.0–10.0, máx 1 decimal ──────────
function promedioValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value && control.value !== 0) return null;
  const val = parseFloat(String(control.value).replace(',', '.'));
  if (isNaN(val) || val < 0 || val > 10) return { promedio: true };
  const partes = String(control.value).split('.');
  if (partes[1] && partes[1].length > 1) return { promedio: true };
  return null;
}

@Component({
  selector: 'app-preinscripcion-modal',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatIconModule,
    MatDatepickerModule, MatNativeDateModule,
    MatCheckboxModule, MatStepperModule,
  ],
  templateUrl: './preinscripcion-modal.component.html',
  styleUrls: ['./preinscripcion-modal.component.css']
})
export class PreinscripcionModalComponent implements OnInit {

  preinscripcionForm!: FormGroup;
  enviando = false;
  cargandoCarreras = false;
  pasoActual = 0;

  programas: Programa[] = [];
  nombresCarreras: string[] = [];

  // ── Datepicker ─────────────────────────────────────────
  readonly fechaInicio = (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 18); return d; })();
  readonly fechaMaxima = (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 15); return d; })();
  readonly fechaMinima = (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 80); return d; })();

  readonly modalidades = ['ESCOLARIZADO', 'SABATINO'];
  readonly estados = [
    'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche',
    'Chiapas', 'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima', 'Durango',
    'Estado de México', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'Michoacán',
    'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro',
    'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco',
    'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'
  ];

  // Pasos del formulario con sus campos
  readonly PASOS = [
    { titulo: 'Datos Personales', icono: 'person', campos: ['nombres', 'apellidoPaterno', 'apellidoMaterno', 'correoElectronico', 'fechaNacimiento', 'curp', 'estadoNacimiento', 'estadoResidencia'] },
    { titulo: 'Contacto', icono: 'phone', campos: ['telefono', 'telefonoCasa', 'domicilio', 'nombreTutor', 'telefonoTutor'] },
    { titulo: 'Académico', icono: 'school', campos: ['carreraInteres', 'modalidad', 'escuelaProcedencia', 'direccionEscuela', 'estadoEscuela', 'promedioGeneral'] },
    { titulo: 'Laboral', icono: 'work', campos: ['trabajaActualmente', 'nombreEmpresa', 'domicilioEmpresa'] },
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<PreinscripcionModalComponent>,
    private svc: PreinscripcionesService
  ) { }

  ngOnInit(): void {
    this.buildForm();
    this.cargarCarreras();
  }

  private buildForm(): void {
    this.preinscripcionForm = this.fb.group({
      nombres: ['', [Validators.required, Validators.minLength(2)]],
      apellidoPaterno: ['', [Validators.required, Validators.minLength(2)]],
      apellidoMaterno: ['', [Validators.required, Validators.minLength(2)]],
      fechaNacimiento: [null, Validators.required],
      curp: ['', [Validators.required, Validators.pattern(/^[A-Z0-9]{18}$/)]],
      estadoNacimiento: ['', Validators.required],
      correoElectronico: ['', [Validators.email]],
      estadoResidencia: ['', Validators.required],
      telefono: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      telefonoCasa: [''],
      domicilio: ['', Validators.required],
      nombreTutor: ['', Validators.required],
      telefonoTutor: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      carreraInteres: ['', Validators.required],
      modalidad: ['', Validators.required],
      escuelaProcedencia: ['', Validators.required],
      direccionEscuela: ['', Validators.required],
      estadoEscuela: ['', Validators.required],
      promedioGeneral: ['', [Validators.required, promedioValidator]],
      trabajaActualmente: [false],
      nombreEmpresa: [''],
      domicilioEmpresa: [''],
    });
  }

  private cargarCarreras(): void {
    this.cargandoCarreras = true;
    this.svc.getProgramas().subscribe({
      next: (p) => {
        this.programas = p.filter(x => x.estaActivo);
        this.nombresCarreras = this.programas.map(x => x.nombre);
        this.cargandoCarreras = false;
      },
      error: () => {
        this.nombresCarreras = [
          'Licenciatura en Arquitectura e Imagen', 'Licenciatura en Trabajo Social',
          'Licenciatura en Ciencias de la Educación', 'Licenciatura en Derecho',
          'Licenciatura en Diseño Gráfico y Mercadotecnia Publicitaria',
          'Licenciatura en Fisioterapia', 'Licenciatura en Psicopedagogía',
        ];
        this.cargandoCarreras = false;
      }
    });
  }

  // ── Navegación por pasos ───────────────────────────────

  get totalPasos(): number { return this.PASOS.length; }
  get progreso(): number { return ((this.pasoActual + 1) / this.totalPasos) * 100; }

  pasoValido(indice: number): boolean {
    const campos = this.PASOS[indice].campos;
    return campos.every(c => {
      const ctrl = this.preinscripcionForm.get(c);
      return ctrl ? ctrl.valid : true;
    });
  }

  avanzar(): void {
    const campos = this.PASOS[this.pasoActual].campos;
    campos.forEach(c => this.preinscripcionForm.get(c)?.markAsTouched());
    if (this.pasoValido(this.pasoActual)) this.pasoActual++;
  }

  retroceder(): void {
    if (this.pasoActual > 0) this.pasoActual--;
  }

  // ── Helpers ────────────────────────────────────────────

  cerrarModal(): void { this.dialogRef.close(); }

  convertirMayusculas(event: any): void {
    const i = event.target, s = i.selectionStart, e = i.selectionEnd;
    i.value = i.value.toUpperCase();
    this.preinscripcionForm.get('curp')?.setValue(i.value, { emitEvent: false });
    i.setSelectionRange(s, e);
  }

  sanitizarPromedio(event: KeyboardEvent): void {
    const permitidos = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.', ',',
      'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
    if (!permitidos.includes(event.key)) { event.preventDefault(); return; }
    const input = event.target as HTMLInputElement;
    if ((event.key === '.' || event.key === ',') &&
      (input.value.includes('.') || input.value.includes(','))) {
      event.preventDefault();
    }
  }

  sanitizarPromedioInput(event: any): void {
    let val = event.target.value.replace(',', '.').replace(/[^0-9.]/g, '');
    const partes = val.split('.');
    if (partes.length > 2) val = partes[0] + '.' + partes[1];
    if (partes[1] !== undefined) val = partes[0] + '.' + partes[1].substring(0, 1);
    if (!isNaN(parseFloat(val)) && parseFloat(val) > 10) val = '10';
    event.target.value = val;
    this.preinscripcionForm.get('promedioGeneral')?.setValue(val, { emitEvent: true });
  }

  private formatearFecha(fecha: Date | null): string {
    if (!fecha) return '';
    return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
  }

  getError(campo: string): string {
    const ctrl = this.preinscripcionForm.get(campo);
    if (!ctrl?.touched || ctrl.valid) return '';
    if (ctrl.hasError('required')) return 'Campo obligatorio';
    if (ctrl.hasError('minlength')) return 'Mínimo 2 caracteres';
    if (ctrl.hasError('email')) return 'Correo electrónico inválido';
    if (ctrl.hasError('promedio')) return 'Valor entre 0.0 y 10.0';
    if (ctrl.hasError('pattern')) {
      if (ctrl.hasError('pattern')) {
        if (campo === 'curp') return 'CURP inválido (debe tener 18 caracteres)';
        return 'Formato inválido (10 dígitos)';
        }
    }
    return '';
  }





  soloNumerosFecha(event: KeyboardEvent): void {
    const permitidos = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
      'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
    if (!permitidos.includes(event.key)) event.preventDefault();
  }

  formatearFechaInput(event: any): void {
    let val = event.target.value.replace(/\D/g, '');
    if (val.length > 8) val = val.substring(0, 8);

    if (val.length >= 5) {
      val = val.substring(0, 2) + '/' + val.substring(2, 4) + '/' + val.substring(4);
    } else if (val.length >= 3) {
      val = val.substring(0, 2) + '/' + val.substring(2);
    }

    event.target.value = val;

    if (val.length === 10) {
      const [dia, mes, anio] = val.split('/').map(Number);
      const fecha = new Date(anio, mes - 1, dia);
      if (!isNaN(fecha.getTime()) && fecha <= this.fechaMaxima && fecha >= this.fechaMinima) {
        this.preinscripcionForm.get('fechaNacimiento')?.setValue(fecha);
        this.preinscripcionForm.get('fechaNacimiento')?.markAsTouched();
      }
    } else {
      this.preinscripcionForm.get('fechaNacimiento')?.setValue(null);
    }
  }

  // Cuando selecciona del calendario, sincroniza el texto visible
  alSeleccionarFecha(fecha: Date | null, inputRef: HTMLInputElement): void {
  if (!fecha) return;
  const d = String(fecha.getDate()).padStart(2,'0');
  const m = String(fecha.getMonth()+1).padStart(2,'0');
  const y = fecha.getFullYear();
  inputRef.value = `${d}/${m}/${y}`;
  this.preinscripcionForm.get('fechaNacimiento')?.setValue(fecha);
}






  // ── Enviar ─────────────────────────────────────────────

  onSubmit(): void {
    this.preinscripcionForm.markAllAsTouched();
    if (this.preinscripcionForm.invalid) {
      // Ir al primer paso con error
      for (let i = 0; i < this.PASOS.length; i++) {
        if (!this.pasoValido(i)) { this.pasoActual = i; break; }
      }
      return;
    }

    this.enviando = true;
    const v = this.preinscripcionForm.value;
    const prog = this.programas.find(p => p.nombre === v.carreraInteres);

    const payload = {
      carreraInteres: v.carreraInteres,
      modalidad: v.modalidad, nombre: v.nombres,
      apellidoPaterno: v.apellidoPaterno, apellidoMaterno: v.apellidoMaterno,
      curp: v.curp.toUpperCase(), fechaNacimiento: this.formatearFecha(v.fechaNacimiento),
      estadoNacimiento: v.estadoNacimiento, estado: v.estadoResidencia,
      domicilio: v.domicilio, telefonoCelular: v.telefono,
      correoElectronico: v.correoElectronico || null,
      nombreTutor: v.nombreTutor, telefonoTutor: v.telefonoTutor,
      escuelaProcedencia: v.escuelaProcedencia,
      direccionEscuelaProcedencia: v.direccionEscuela,
      estadoEscuela: v.estadoEscuela,
      promedio: parseFloat(String(v.promedioGeneral).replace(',', '.')),
      trabajaActualmente: v.trabajaActualmente ?? false,
      nombreEmpresa: v.nombreEmpresa || null,
      domicilioEmpresa: v.domicilioEmpresa || null,
    };

    this.svc.crearPreinscripcion(payload).subscribe({
      next: (res: any) => {
        this.enviando = false;
        Swal.fire({
          icon: 'success', title: '¡Solicitud Registrada!',
          html: `<p>Hemos recibido tu preinscripción.</p>
                 <p><strong>Carrera:</strong> ${payload.carreraInteres}</p>
                 <small style="color:#888">Nos pondremos en contacto contigo pronto.</small>`,
          confirmButtonColor: '#9b1c1c', confirmButtonText: 'Entendido'
        }).then(() => this.dialogRef.close(res));
      },



      error: (err: any) => {
        this.enviando = false;
        let msg = 'Error al procesar la solicitud';
        if (err.status === 409) msg = 'Ya existe una solicitud con este CURP';
        else if (err.error?.message) msg = Array.isArray(err.error.message)
          ? err.error.message.join(', ') : err.error.message;
        Swal.fire({ icon: 'error', title: 'Error', text: msg, confirmButtonColor: '#9b1c1c' });
      }
    });
  }
}