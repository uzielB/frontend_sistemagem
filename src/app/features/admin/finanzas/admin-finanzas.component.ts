import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { FormsModule } from '@angular/forms'; 
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { FinanzasService } from '../../../core/services/finanzas.service';
import { 
  Pago, 
  ConceptoPago, 
  EstatusPago, 
  CrearPagoDTO,
  ActualizarPagoDTO 
} from '../../../core/models/finanzas.models';

@Component({
  selector: 'app-admin-finanzas',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    FormsModule,    
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule,
    MatCardModule
  ],
  templateUrl: './admin-finanzas.component.html',
  styleUrls: ['./admin-finanzas.component.css']
})
export class AdminFinanzasComponent implements OnInit {
  
  // Datos
  pagos: Pago[] = [];
  conceptos: ConceptoPago[] = [];
  estudiantes: any[] = [];
  
  // Tabla
  displayedColumns: string[] = [
    'estudiante',
    'concepto',
    'monto_original',
    'descuento',
    'monto_final',
    'fecha_vencimiento',
    'estatus',
    'acciones'
  ];
  
  // Filtros
  filtroEstatus: EstatusPago | 'TODOS' = 'TODOS';
  estatusOptions = [
    { value: 'TODOS', label: 'Todos' },
    { value: EstatusPago.PENDIENTE, label: 'Pendientes' },
    { value: EstatusPago.PAGADO, label: 'Pagados' },
    { value: EstatusPago.VENCIDO, label: 'Vencidos' }
  ];
  
  // Estado
  isLoading = false;
  modoEdicion = false;
  pagoSeleccionado: Pago | null = null;
  mostrarFormulario = false;
  
  // Formulario
  pagoForm: FormGroup;
  
  // Modo DEMO (cambiar a false cuando backend esté listo)
  isDemoMode = true;

  constructor(
    private finanzasService: FinanzasService,
    private fb: FormBuilder,
    private dialog: MatDialog
  ) {
    this.pagoForm = this.fb.group({
      estudiante_id: ['', Validators.required],
      concepto_id: ['', Validators.required],
      monto_original: [0, [Validators.required, Validators.min(0)]],
      monto_descuento: [0, [Validators.min(0)]],
      monto_final: [{ value: 0, disabled: true }],
      fecha_vencimiento: ['', Validators.required],
      estatus: [EstatusPago.PENDIENTE, Validators.required],
      comentarios: ['']
    });
    
    // Calcular monto final automáticamente
    this.pagoForm.get('monto_original')?.valueChanges.subscribe(() => this.calcularMontoFinal());
    this.pagoForm.get('monto_descuento')?.valueChanges.subscribe(() => this.calcularMontoFinal());
  }

  ngOnInit(): void {
    this.cargarDatos();
  }

  /**
   * Cargar todos los datos necesarios
   */
  cargarDatos(): void {
    this.isLoading = true;
    
    // Cargar conceptos
    const conceptos$ = this.isDemoMode 
      ? this.finanzasService.getConceptosPagoMock()
      : this.finanzasService.getConceptosPago();
    
    conceptos$.subscribe({
      next: (data) => {
        this.conceptos = data;
      },
      error: (err) => console.error('Error al cargar conceptos:', err)
    });
    
    // Cargar pagos
    this.cargarPagos();
    
    // Cargar estudiantes (para dropdown)
    if (!this.isDemoMode) {
      this.finanzasService.getEstudiantesActivos().subscribe({
        next: (data) => {
          this.estudiantes = data;
        },
        error: (err) => console.error('Error al cargar estudiantes:', err)
      });
    } else {
      // Mock de estudiantes para DEMO
      this.estudiantes = [
        { id: 1, nombre: 'Juan', apellido_paterno: 'Pérez', apellido_materno: 'García', matricula: '2025001' },
        { id: 2, nombre: 'María', apellido_paterno: 'López', apellido_materno: 'Hernández', matricula: '2025002' },
        { id: 3, nombre: 'Carlos', apellido_paterno: 'Martínez', apellido_materno: 'Sánchez', matricula: '2025003' }
      ];
    }
  }

  /**
   * Cargar pagos con filtros opcionales
   */
  cargarPagos(): void {
    this.isLoading = true;
    
    const pagos$ = this.isDemoMode
      ? this.finanzasService.getPagosMock()
      : this.finanzasService.getPagos();
    
    pagos$.subscribe({
      next: (data) => {
        this.pagos = data;
        this.aplicarFiltros();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar pagos:', err);
        this.isLoading = false;
      }
    });
  }

  /**
   * Aplicar filtros a la tabla
   */
  aplicarFiltros(): void {
    if (this.filtroEstatus === 'TODOS') {
      return;
    }
    
    this.pagos = this.pagos.filter(pago => pago.estatus === this.filtroEstatus);
  }

  /**
   * Cambiar filtro de estatus
   */
  onFiltroChange(): void {
    this.cargarPagos();
  }

  /**
   * Mostrar formulario para nuevo pago
   */
  nuevoPago(): void {
    this.modoEdicion = false;
    this.pagoSeleccionado = null;
    this.pagoForm.reset({
      estatus: EstatusPago.PENDIENTE,
      monto_descuento: 0
    });
    this.mostrarFormulario = true;
  }

  /**
   * Editar un pago existente
   */
  editarPago(pago: Pago): void {
    this.modoEdicion = true;
    this.pagoSeleccionado = pago;
    
    this.pagoForm.patchValue({
      estudiante_id: pago.estudiante_id,
      concepto_id: pago.concepto_id,
      monto_original: pago.monto_original,
      monto_descuento: pago.monto_descuento,
      fecha_vencimiento: pago.fecha_vencimiento,
      estatus: pago.estatus,
      comentarios: pago.comentarios || ''
    });
    
    this.mostrarFormulario = true;
  }

  /**
   * Guardar pago (crear o actualizar)
   */
  guardarPago(): void {
    if (this.pagoForm.invalid) {
      Object.keys(this.pagoForm.controls).forEach(key => {
        this.pagoForm.get(key)?.markAsTouched();
      });
      return;
    }
    
    this.isLoading = true;
    
    const formData = this.pagoForm.getRawValue();
    
    // Calcular monto final
    const montoFinal = formData.monto_original - formData.monto_descuento;
    
    if (this.modoEdicion && this.pagoSeleccionado) {
      // Actualizar
      const updateData: ActualizarPagoDTO = {
        monto_original: formData.monto_original,
        monto_descuento: formData.monto_descuento,
        monto_final: montoFinal,
        fecha_vencimiento: formData.fecha_vencimiento,
        estatus: formData.estatus,
        comentarios: formData.comentarios
      };
      
      this.finanzasService.actualizarPago(this.pagoSeleccionado.id!, updateData).subscribe({
        next: () => {
          this.cargarPagos();
          this.cancelar();
          alert('Pago actualizado exitosamente');
        },
        error: (err) => {
          console.error('Error al actualizar pago:', err);
          alert('Error al actualizar el pago');
          this.isLoading = false;
        }
      });
    } else {
      // Crear nuevo
      const nuevoPago: CrearPagoDTO = {
        estudiante_id: formData.estudiante_id,
        concepto_id: formData.concepto_id,
        monto_original: formData.monto_original,
        monto_descuento: formData.monto_descuento,
        monto_final: montoFinal,
        fecha_vencimiento: formData.fecha_vencimiento,
        estatus: formData.estatus,
        comentarios: formData.comentarios
      };
      
      this.finanzasService.crearPago(nuevoPago).subscribe({
        next: () => {
          this.cargarPagos();
          this.cancelar();
          alert('Pago creado exitosamente');
        },
        error: (err) => {
          console.error('Error al crear pago:', err);
          alert('Error al crear el pago');
          this.isLoading = false;
        }
      });
    }
  }

  /**
   * Eliminar un pago
   */
  eliminarPago(pago: Pago): void {
    if (!confirm(`¿Estás seguro de eliminar el pago de ${pago.estudiante?.nombre}?`)) {
      return;
    }
    
    this.isLoading = true;
    
    this.finanzasService.eliminarPago(pago.id!).subscribe({
      next: (success) => {
        if (success) {
          this.cargarPagos();
          alert('Pago eliminado exitosamente');
        }
      },
      error: (err) => {
        console.error('Error al eliminar pago:', err);
        alert('Error al eliminar el pago');
        this.isLoading = false;
      }
    });
  }

  /**
   * Cancelar edición
   */
  cancelar(): void {
    this.mostrarFormulario = false;
    this.modoEdicion = false;
    this.pagoSeleccionado = null;
    this.pagoForm.reset();
    this.isLoading = false;
  }

  /**
   * Calcular monto final automáticamente
   */
  calcularMontoFinal(): void {
    const montoOriginal = this.pagoForm.get('monto_original')?.value || 0;
    const descuento = this.pagoForm.get('monto_descuento')?.value || 0;
    const montoFinal = Math.max(0, montoOriginal - descuento);
    
    this.pagoForm.get('monto_final')?.setValue(montoFinal);
  }

  /**
   * Al seleccionar un concepto, prellenar el monto
   */
  onConceptoChange(): void {
    const conceptoId = this.pagoForm.get('concepto_id')?.value;
    const concepto = this.conceptos.find(c => c.id === conceptoId);
    
    if (concepto) {
      this.pagoForm.patchValue({
        monto_original: concepto.monto_default
      });
    }
  }

  /**
   * Al seleccionar un estudiante, buscar su beca y aplicar descuento
   */
  onEstudianteChange(): void {
    const estudianteId = this.pagoForm.get('estudiante_id')?.value;
    
    if (!estudianteId) return;
    
    // Buscar beca del estudiante
    this.finanzasService.getBecaEstudiante(estudianteId).subscribe({
      next: (beca) => {
        if (beca && beca.estatus === 'ACTIVA') {
          const montoOriginal = this.pagoForm.get('monto_original')?.value || 0;
          const descuento = (montoOriginal * beca.porcentaje) / 100;
          
          this.pagoForm.patchValue({
            monto_descuento: descuento
          });
          
          alert(`Beca aplicada: ${beca.porcentaje}% de descuento`);
        }
      },
      error: (err) => console.error('Error al buscar beca:', err)
    });
  }

  /**
   * Formatear moneda
   */
  formatCurrency(amount: number): string {
    return this.finanzasService.formatearMoneda(amount);
  }

  /**
   * Obtener clase CSS del estatus
   */
  getEstatusClass(estatus: EstatusPago): string {
    return this.finanzasService.getEstatusClass(estatus);
  }

  /**
   * Obtener nombre completo del estudiante
   */
  getNombreEstudiante(estudiante: any): string {
    if (!estudiante) return '';
    return `${estudiante.nombre} ${estudiante.apellido_paterno} ${estudiante.apellido_materno || ''}`.trim();
  }
}