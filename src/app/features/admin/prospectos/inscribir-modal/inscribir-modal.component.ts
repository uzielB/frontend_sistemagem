import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  PreinscripcionesService,
  Preinscripcion,
  Programa,
  PeriodoEscolar,
  InscribirPayload
} from '../../../../core/services/preinscripciones.service';

@Component({
  selector: 'app-inscribir-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './inscribir-modal.component.html',
  styleUrls: ['./inscribir-modal.component.css']
})
export class InscribirModalComponent implements OnInit {
  @Input() prospecto!: Preinscripcion;
  @Output() cerrar = new EventEmitter<void>();
  @Output() inscritoExitoso = new EventEmitter<any>();

  private fb = inject(FormBuilder);
  private svc = inject(PreinscripcionesService);

  programas: Programa[] = [];
  periodos: PeriodoEscolar[] = [];
  programasFiltrados: Programa[] = [];
  cargando = false;
  error = '';
  exito = false;
  resultadoInscripcion: any = null;
  form!: FormGroup;

  readonly BECAS_PORCENTAJE = [
    { label: 'Sin beca', value: 0 },
    { label: '10%', value: 10 },
    { label: '25%', value: 25 },
    { label: '50%', value: 50 },
    { label: '75%', value: 75 },
    { label: '100%', value: 100 },
  ];

  readonly BECAS_CONDICION = [
    { label: 'Sin beca por condición', value: '' },
    { label: 'Beca Académica', value: 'ACADEMICA' },
    { label: 'Beca Deportiva', value: 'DEPORTIVA' },
    { label: 'Beca Cultural', value: 'CULTURAL' },
    { label: 'Beca Socioeconómica', value: 'SOCIOECONOMICA' },
  ];

  readonly SEMESTRES = Array.from({ length: 10 }, (_, i) => ({
    label: `${i + 1}° Semestre`,
    value: i + 1
  }));

  readonly NUMERO_PAGOS = [1,2,3,4,5,6,7,8,9,10,11,12].map(n => ({
    label: `${n} pago${n > 1 ? 's' : ''}`,
    value: n
  }));

  ngOnInit(): void {
    this.buildForm();
    this.cargarCatalogos();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      periodoEscolarId: [null, Validators.required],
      modalidad: [this.prospecto?.modalidad || 'Escolarizado', Validators.required],
      programaId: [null, Validators.required],
      semestre: [1, Validators.required],
      numeroPagos: [null, Validators.required],
      becaPromocionPorcentaje: [0],
      becaCondicionPorcentaje: [0],
      becaCondicionTipo: [''],
    });

    this.form.get('modalidad')!.valueChanges.subscribe(mod => {
      this.filtrarProgramas(mod);
      this.form.patchValue({ programaId: null });
    });
  }

  private cargarCatalogos(): void {
    this.svc.getProgramas().subscribe({
      next: p => {
        this.programas = p.filter(prog => prog.estaActivo);
        this.filtrarProgramas(this.form.value.modalidad);
        // Pre-seleccionar carrera si coincide con la de interés
        const match = this.programas.find(prog =>
          prog.nombre.toLowerCase().includes((this.prospecto?.carreraInteres || '').toLowerCase())
        );
        if (match) this.form.patchValue({ programaId: match.id });
      },
      error: () => { this.programas = []; }
    });

    this.svc.getPeriodos().subscribe({
      next: p => {
        this.periodos = p.filter(pe => pe.estaActivo);
        const actual = this.periodos.find(pe => pe.esActual);
        if (actual) this.form.patchValue({ periodoEscolarId: actual.id });
      },
      error: () => { this.periodos = []; }
    });
  }

  private filtrarProgramas(modalidad: string): void {
    this.programasFiltrados = this.programas.filter(p =>
      p.modalidad?.toLowerCase() === modalidad?.toLowerCase()
    );
    if (this.programasFiltrados.length === 0) {
      this.programasFiltrados = this.programas;
    }
  }

  get nombreCompleto(): string {
    if (!this.prospecto) return '';
    return `${this.prospecto.nombre} ${this.prospecto.apellidoPaterno} ${this.prospecto.apellidoMaterno}`.trim();
  }

  isInvalid(campo: string): boolean {
    const ctrl = this.form.get(campo);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.cargando = true;
    this.error = '';
    const v = this.form.value;

    const payload: InscribirPayload = {
      programaId: Number(v.programaId),
      periodoEscolarId: Number(v.periodoEscolarId),
      semestre: Number(v.semestre),
      numeroPagos: Number(v.numeroPagos),
      becaPromocionPorcentaje: Number(v.becaPromocionPorcentaje),
      becaCondicionPorcentaje: Number(v.becaCondicionPorcentaje),
      becaCondicionTipo: v.becaCondicionTipo || undefined,
    };

    this.svc.inscribir(this.prospecto.id, payload).subscribe({
      next: resultado => {
        this.cargando = false;
        this.exito = true;
        this.resultadoInscripcion = resultado;
        this.inscritoExitoso.emit(resultado);
      },
      error: err => {
        this.cargando = false;
        this.error = err?.error?.message || 'Ocurrió un error al inscribir al alumno.';
      }
    });
  }
}