import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../../core/services/auth.service';
import { UserRole, isValidCURP } from '../../../../core/models/user.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  hidePassword = true;
  
  // Modo DEMO para desarrollo sin backend
  isDemoMode = true; // ← Cambiar a false cuando el backend esté listo

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      curp: ['', [
        Validators.required,
        Validators.minLength(18),
        Validators.maxLength(18),
        this.curpValidator
      ]],
      contrasena: ['', [
        Validators.required,
        Validators.minLength(6)
      ]]
    });
  }

  ngOnInit(): void {
    // Si el usuario ya está autenticado, redirigir a su dashboard
    if (this.authService.isUserAuthenticated()) {
      this.redirectToRoleDashboard(this.authService.getUserRole());
    }
  }

  /**
   * Validador personalizado para CURP
   */
  curpValidator(control: any): { [key: string]: any } | null {
    if (!control.value) return null;
    
    const curp = control.value.toUpperCase();
    return isValidCURP(curp) ? null : { 'invalidCurp': true };
  }

  /**
   * Convertir CURP a mayúsculas mientras se escribe
   */
  onCurpInput(event: any): void {
    const input = event.target;
    input.value = input.value.toUpperCase();
    this.loginForm.patchValue({ curp: input.value });
  }

  /**
   * Submit del formulario de login
   */
  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      const { curp, contrasena } = this.loginForm.value;
      
      // Usar login DEMO o real según configuración
      const loginObservable = this.isDemoMode 
        ? this.authService.loginDemo(curp, contrasena)
        : this.authService.login(curp, contrasena);
      
      loginObservable.subscribe({
        next: (response:any) => {
          this.isLoading = false;
          
          if (response.success && response.user) {
            // Verificar si debe cambiar contraseña
            if (response.user.debe_cambiar_contrasena) {
              this.router.navigate(['/auth/change-password']);
              return;
            }
            
            // Redirigir según el rol
            this.redirectToRoleDashboard(response.user.rol);
          }
        },
        error: (error:any) => {
          this.isLoading = false;
          console.error('Error en login:', error);
          
          // Manejar diferentes tipos de errores
          if (error.status === 401) {
            this.errorMessage = 'CURP o contraseña incorrectos';
          } else if (error.status === 403) {
            this.errorMessage = 'Usuario inactivo. Contacta al administrador';
          } else if (error.error?.message) {
            this.errorMessage = error.error.message;
          } else {
            this.errorMessage = 'Error al iniciar sesión. Intenta de nuevo';
          }
        }
      });
    } else {
      // Marcar todos los campos como tocados para mostrar errores
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
    }
  }

  /**
   * Redirigir al dashboard según el rol del usuario
   */
  private redirectToRoleDashboard(role: UserRole): void {
    switch (role) {
      case UserRole.SUPER_ADMIN:
      case UserRole.ADMIN:
        this.router.navigate(['/admin/dashboard']);
        break;
      case UserRole.DOCENTE:
        this.router.navigate(['/docente/dashboard']);
        break;
      case UserRole.ALUMNO:
        this.router.navigate(['/alumno/dashboard']);
        break;
      default:
        this.router.navigate(['/']);
    }
  }

  /**
   * Obtener mensaje de error para campo CURP
   */
  getCurpErrorMessage(): string {
    const control = this.loginForm.get('curp');
    
    if (control?.hasError('required')) {
      return 'La CURP es obligatoria';
    }
    
    if (control?.hasError('minlength') || control?.hasError('maxlength')) {
      return 'La CURP debe tener exactamente 18 caracteres';
    }
    
    if (control?.hasError('invalidCurp')) {
      return 'CURP inválida. Formato: AAAA######HAAAAA##';
    }
    
    return '';
  }

  /**
   * Obtener mensaje de error para contraseña
   */
  getPasswordErrorMessage(): string {
    const control = this.loginForm.get('contrasena');
    
    if (control?.hasError('required')) {
      return 'La contraseña es obligatoria';
    }
    
    if (control?.hasError('minlength')) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }
    
    return '';
  }

  /**
   * Toggle visibilidad de contraseña
   */
  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }
}