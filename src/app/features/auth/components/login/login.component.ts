import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../../core/services/auth.service';
import { UserRole, isValidCURP, User } from '../../../../core/models/user.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
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
  hidePassword = false;
  
  isDemoMode = false;

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
    if (this.authService.isUserAuthenticated()) {
      const user = this.authService.getUser();
      if (user) {
        console.log('🎯 Redirigiendo usuario autenticado según rol:', user.rol);
        this.redirectToRoleDashboard(user); 
      }
    }
  }

  curpValidator(control: any): { [key: string]: any } | null {
    if (!control.value) return null;
    const curp = control.value.toUpperCase();
    return isValidCURP(curp) ? null : { 'invalidCurp': true };
  }

  onCurpInput(event: any): void {
    const input = event.target;
    input.value = input.value.toUpperCase();
    this.loginForm.patchValue({ curp: input.value });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      const { curp, contrasena } = this.loginForm.value;
      
      const loginObservable = this.isDemoMode 
        ? this.authService.loginDemo(curp, contrasena)
        : this.authService.login(curp, contrasena);
      
      loginObservable.subscribe({
        next: (response: any) => {
          console.log('✅ Login response completo:', response);
          this.isLoading = false;
          
          // Obtener usuario del servicio (que ya lo guardó)
          const user = this.authService.getUser();
          
          if (user) {
            console.log('👤 Usuario obtenido:', user);
            
            // Verificar si debe cambiar contraseña
            // if (user.debe_cambiar_contrasena) {
            //   console.log('🔄 Usuario debe cambiar contraseña');
            //   this.router.navigate(['/auth/change-password']);
            //   return;
            // }
            
            // ⚠️ REDIRECCIÓN FORZADA PARA DOCENTES
            if (user.rol === UserRole.DOCENTE) {
              console.log('🔥 FORZANDO redirección a /teachers');
              
              // Usar setTimeout para asegurar que el cambio de detección termine
              setTimeout(() => {
                this.router.navigateByUrl('/teachers', { replaceUrl: true }).then(success => {
                  console.log('✅ Navegación resultado:', success);
                  console.log('📍 URL actual después de navegación:', this.router.url);
                  
                  if (!success) {
                    console.error('❌ Navegación falló, intentando window.location...');
                    window.location.href = '/teachers';
                  }
                });
              }, 100);
            } else {
              // Para otros roles, usar el método normal
              console.log('🎯 Redirigiendo según rol:', user.rol);
              this.redirectToRoleDashboard(user);
            }
          } else {
            console.error('❌ No se pudo obtener el usuario después del login');
            this.errorMessage = 'Error al procesar la sesión';
          }
        },
        error: (error: any) => {
          this.isLoading = false;
          console.error('❌ Error en login:', error);
          
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
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
    }
  }

  private redirectToRoleDashboard(user: User): void {
    let targetRoute = '/';

    console.log('🚀 Redirigiendo según rol:', user.rol);

    switch (user.rol) {
      case UserRole.SUPER_ADMIN:
        targetRoute = '/admin/dashboard';
        break;
      case UserRole.ADMIN:
        targetRoute = '/admin/dashboard';
        break;
      case UserRole.DOCENTE:
        targetRoute = '/teachers';  
        break;
      case UserRole.ALUMNO:
        targetRoute = '/alumno/dashboard';
        break;
      default:
        targetRoute = '/';
        break;
    }

    console.log('📍 Navegando a:', targetRoute);

    // Navegación forzada
    this.router.navigate([targetRoute], { replaceUrl: true }).then(success => {
      if (success) {
        console.log('✅ Navegación exitosa a:', targetRoute);
      } else {
        console.error('❌ Navegación falló a:', targetRoute);
      }
    });
  }

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

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }
}