import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../../core/services/auth.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent implements OnInit {
  changePasswordForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  incorrectCurrentPassword = false; // 🆕 Nueva variable
  
  hideCurrentPassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {
    this.changePasswordForm = this.fb.group({
      contrasenaActual: ['', [Validators.required, Validators.minLength(6)]],
      nuevaContrasena: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)
      ]],
      confirmarContrasena: ['', [Validators.required]]
    }, { validators: this.passwordsMatchValidator });
  }

  ngOnInit(): void {
    if (!this.authService.isUserAuthenticated()) {
      this.router.navigate(['/auth/login']);
    }

    // 🆕 Limpiar el error de contraseña incorrecta cuando el usuario empiece a escribir
    this.changePasswordForm.get('contrasenaActual')?.valueChanges.subscribe(() => {
      this.incorrectCurrentPassword = false;
      this.errorMessage = '';
    });
  }

  passwordsMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const newPassword = group.get('nuevaContrasena')?.value;
    const confirmPassword = group.get('confirmarContrasena')?.value;
    if (!newPassword || !confirmPassword) return null;
    return newPassword === confirmPassword ? null : { passwordsMismatch: true };
  }

  // Mostrar advertencia de contraseñas que no coinciden
  showPasswordMismatchWarning(): boolean {
    const newPass = this.changePasswordForm.get('nuevaContrasena');
    const confirmPass = this.changePasswordForm.get('confirmarContrasena');
    
    if (!newPass || !confirmPass) return false;
    
    const bothHaveValues = newPass.value && confirmPass.value;
    const eitherTouched = newPass.touched || confirmPass.touched;
    const passwordsDontMatch = this.changePasswordForm.hasError('passwordsMismatch');
    
    return bothHaveValues && eitherTouched && passwordsDontMatch;
  }

  // 🆕 Mostrar advertencia de contraseña actual incorrecta
  showIncorrectCurrentPasswordWarning(): boolean {
    return this.incorrectCurrentPassword;
  }

  onSubmit(): void {
    if (this.changePasswordForm.invalid) {
      Object.keys(this.changePasswordForm.controls).forEach(key => {
        this.changePasswordForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.incorrectCurrentPassword = false; // 🆕 Resetear antes de enviar

    const { contrasenaActual, nuevaContrasena, confirmarContrasena } = this.changePasswordForm.value;
    const token = this.authService.getToken();
    const url = `${environment.apiUrl}/auth/change-password`;

    this.http.patch(url, {
      contrasenaActual,
      nuevaContrasena,
      confirmarContrasena
    }, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (response: any) => {
        console.log('✅ Contraseña cambiada:', response);
        this.isLoading = false;
        this.successMessage = '¡Contraseña actualizada exitosamente!';
        this.changePasswordForm.reset();
        this.incorrectCurrentPassword = false; // 🆕 Resetear
        setTimeout(() => this.router.navigate(['/teachers']), 2000);
      },
      error: (error: any) => {
        console.error('❌ Error:', error);
        this.isLoading = false;
        
        if (error.status === 401) {
          // 🆕 Activar bandera de contraseña incorrecta
          this.incorrectCurrentPassword = true;
          this.errorMessage = 'La contraseña actual es incorrecta';
        } else if (error.error?.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'Error al cambiar la contraseña';
        }
      }
    });
  }

  getCurrentPasswordError(): string {
    const control = this.changePasswordForm.get('contrasenaActual');
    if (control?.hasError('required')) return 'La contraseña actual es obligatoria';
    if (control?.hasError('minlength')) return 'Mínimo 6 caracteres';
    return '';
  }

  getNewPasswordError(): string {
    const control = this.changePasswordForm.get('nuevaContrasena');
    if (control?.hasError('required')) return 'La nueva contraseña es obligatoria';
    if (control?.hasError('minlength')) return 'Mínimo 8 caracteres';
    if (control?.hasError('pattern')) return 'Debe contener mayúsculas, minúsculas y números';
    return '';
  }

  getConfirmPasswordError(): string {
    const confirm = this.changePasswordForm.get('confirmarContrasena');
    const newPass = this.changePasswordForm.get('nuevaContrasena');

    if (!confirm || !newPass) return '';

    if (confirm.hasError('required') && confirm.touched) {
      return 'Confirma tu nueva contraseña';
    }

    if (
      this.changePasswordForm.hasError('passwordsMismatch') &&
      (confirm.dirty || newPass.dirty)
    ) {
      return 'Las contraseñas no coinciden';
    }

    return '';
  }

  cancel(): void {
    this.router.navigate(['/teachers']);
  }
}