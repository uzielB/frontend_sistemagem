// UBICACIÓN: src/app/features/admin/prospectos/inscribir-modal/inscribir-modal.component.ts
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
  @Output() cerrar          = new EventEmitter<void>();
  @Output() inscritoExitoso = new EventEmitter<any>();

  private fb  = inject(FormBuilder);
  private svc = inject(PreinscripcionesService);

  programas: Programa[]          = [];
  periodos: PeriodoEscolar[]     = [];
  programasFiltrados: Programa[] = [];
  cargando  = false;
  error     = '';
  exito     = false;
  resultadoInscripcion: any = null;
  form!: FormGroup;

  // ── Opciones de pago ────────────────────────────────────
  readonly NUMERO_PAGOS = [
    { label: '1 pago único', value: 1 },
    { label: '5 pagos',      value: 5 },
    { label: '6 pagos',      value: 6 },
  ];

  // Semestres del 1 al 10
  readonly SEMESTRES = Array.from({ length: 10 }, (_, i) => ({
    label: `${i + 1}° Semestre`,
    value: i + 1,
  }));

  // ── Lifecycle ───────────────────────────────────────────
  ngOnInit(): void {
    this.buildForm();
    this.cargarCatalogos();
    if (this.prospecto?.modalidad) {
      this.form.patchValue({ modalidad: this.prospecto.modalidad });
    }
  }

  // ── Form ────────────────────────────────────────────────
  private buildForm(): void {
    this.form = this.fb.group({
      periodoEscolarId:        [null, Validators.required],
      modalidad:               ['ESCOLARIZADO', Validators.required],
      programaId:              [null, Validators.required],
      semestre:                [1,    Validators.required],
      numeroPagos:             [null, Validators.required],
      becaPromocionPorcentaje: [0],
    });

    this.form.get('modalidad')!.valueChanges.subscribe(mod => {
      this.filtrarProgramas(mod);
      this.form.patchValue({ programaId: null });
    });
  }

  // ── Contador de beca ────────────────────────────────────
  sumarBeca(): void {
    const actual = Number(this.form.get('becaPromocionPorcentaje')?.value) || 0;
    if (actual < 30) this.form.patchValue({ becaPromocionPorcentaje: actual + 5 });
  }

  restarBeca(): void {
    const actual = Number(this.form.get('becaPromocionPorcentaje')?.value) || 0;
    if (actual > 0) this.form.patchValue({ becaPromocionPorcentaje: actual - 5 });
  }

  // ── Catálogos ───────────────────────────────────────────
  private cargarCatalogos(): void {
    this.svc.getProgramas().subscribe({
      next: (res: any) => {
        const lista = Array.isArray(res) ? res : (res.data ?? []);
        this.programas = lista.filter((p: any) => p.estaActivo);
        this.filtrarProgramas(this.form.value.modalidad);
        const match = this.programas.find((p: any) =>
          p.nombre.toLowerCase().includes(
            (this.prospecto?.carreraInteres || '').toLowerCase()
          )
        );
        if (match) this.form.patchValue({ programaId: match.id });
      },
      error: () => { this.programas = []; }
    });

    this.svc.getPeriodos().subscribe({
      next: (res: any) => {
        const lista = Array.isArray(res) ? res : (res.data ?? []);
        this.periodos = lista.filter((pe: any) => pe.estaActivo);
        const actual  = this.periodos.find((pe: any) => pe.esActual);
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

  // ── Helpers ─────────────────────────────────────────────
  get nombreCompleto(): string {
    if (!this.prospecto) return '';
    return `${this.prospecto.nombre} ${this.prospecto.apellidoPaterno} ${this.prospecto.apellidoMaterno || ''}`.trim();
  }

  isInvalid(campo: string): boolean {
    const ctrl = this.form.get(campo);
    return !!(ctrl?.invalid && ctrl?.touched);
  }

  // ── Submit ──────────────────────────────────────────────
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.cargando = true;
    this.error    = '';
    const v       = this.form.value;

    const payload: InscribirPayload = {
      programaId:              Number(v.programaId),
      periodoEscolarId:        Number(v.periodoEscolarId),
      semestre:                Number(v.semestre),
      numeroPagos:             Number(v.numeroPagos),
      becaPromocionPorcentaje: Number(v.becaPromocionPorcentaje) || 0,
    };

    this.svc.inscribir(this.prospecto.id, payload).subscribe({
      next: (res: any) => {
        // Backend puede devolver { data: {...} } o el objeto directo
        const resultado = res?.data ?? res;
        this.cargando             = false;
        this.exito                = true;
        this.resultadoInscripcion = resultado;
        this.inscritoExitoso.emit(resultado);
      },
      error: (err: any) => {
        this.cargando = false;
        const msg = err?.error?.message;
        this.error = Array.isArray(msg)
          ? msg.join(', ')
          : (msg ?? err?.message ?? 'Error al inscribir al alumno.');
      }
    });
  }
  cerrarExito(): void {
    this.inscritoExitoso.emit(this.resultadoInscripcion);
    this.cerrar.emit();
  }

}