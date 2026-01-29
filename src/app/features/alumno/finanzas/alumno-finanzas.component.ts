import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { FinanzasService } from '../../../core/services/finanzas.service';
import { Pago, EstatusPago } from '../../../core/models/finanzas.models';

@Component({
  selector: 'app-alumno-finanzas',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatTabsModule,
    MatChipsModule,
    MatButtonModule
  ],
  templateUrl: './alumno-finanzas.component.html',
  styleUrls: ['./alumno-finanzas.component.css']
})
export class AlumnoFinanzasComponent implements OnInit {
  
  // Datos
  todosPagos: Pago[] = [];
  pagosPendientes: Pago[] = [];
  pagosPagados: Pago[] = [];
  pagosVencidos: Pago[] = [];
  
  // Resumen financiero
  totalAdeudo: number = 0;
  totalPagado: number = 0;
  totalDescuentos: number = 0;
  
  // Estado
  isLoading = false;
  
  // Modo DEMO (cambiar a false cuando backend esté listo)
  isDemoMode = true;

  constructor(private finanzasService: FinanzasService) {}

  ngOnInit(): void {
    this.cargarPagos();
  }

  /**
   * Cargar pagos del alumno autenticado
   */
  cargarPagos(): void {
    this.isLoading = true;
    
    const pagos$ = this.isDemoMode
      ? this.finanzasService.getPagosMock()
      : this.finanzasService.getMisPagos();
    
    pagos$.subscribe({
      next: (data) => {
        this.todosPagos = data;
        this.clasificarPagos();
        this.calcularResumen();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar pagos:', err);
        this.isLoading = false;
      }
    });
  }

  /**
   * Clasificar pagos por estatus
   */
  clasificarPagos(): void {
    this.pagosPendientes = this.todosPagos.filter(p => p.estatus === EstatusPago.PENDIENTE);
    this.pagosPagados = this.todosPagos.filter(p => p.estatus === EstatusPago.PAGADO);
    this.pagosVencidos = this.todosPagos.filter(p => p.estatus === EstatusPago.VENCIDO);
  }

  /**
   * Calcular resumen financiero
   */
  calcularResumen(): void {
    this.totalAdeudo = this.pagosPendientes.reduce((sum, p) => sum + p.monto_final, 0) +
                       this.pagosVencidos.reduce((sum, p) => sum + p.monto_final, 0);
    this.totalPagado = this.pagosPagados.reduce((sum, p) => sum + p.monto_final, 0);
    this.totalDescuentos = this.todosPagos.reduce((sum, p) => sum + p.monto_descuento, 0);
  }

  /**
   * Verificar si un pago está próximo a vencer (menos de 7 días)
   */
  esPagoProximoVencer(pago: Pago): boolean {
    if (pago.estatus === EstatusPago.PAGADO) return false;
    
    const hoy = new Date();
    const fechaVencimiento = new Date(pago.fecha_vencimiento);
    const diffTime = fechaVencimiento.getTime() - hoy.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 && diffDays <= 7;
  }

  /**
   * Obtener días restantes para vencer
   */
  getDiasRestantes(pago: Pago): number {
    const hoy = new Date();
    const fechaVencimiento = new Date(pago.fecha_vencimiento);
    const diffTime = fechaVencimiento.getTime() - hoy.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
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
   * Descargar orden de pago (placeholder - implementar después)
   */
  descargarOrdenPago(pago: Pago): void {
    alert(`Funcionalidad pendiente: Descargar orden de pago #${pago.id}`);
    // TODO: Implementar generación de PDF con orden de pago
  }

  /**
   * Ir a portal de pagos (placeholder - implementar después)
   */
  irAPortalPagos(): void {
    alert('Funcionalidad pendiente: Redirigir a portal de pagos en línea');
    // TODO: Redirigir a pasarela de pagos
  }
}