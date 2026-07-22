import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '../../../core/services/auth-service';
import { emailValidator, isValidEmail } from '../../../shared/utils/email-validation';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    DialogModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './login-form.html',
  styleUrl: './login-form.css',
})
export class LoginForm {
  forgotPasswordDialog = false;
  recoveryEmail = '';
  loading = false;

  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);

  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, emailValidator()]],
    password: ['', Validators.required],
  });

  login(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;

    this.authService.login(this.loginForm.getRawValue()).subscribe({
      next: () => {
        this.loading = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Bienvenido',
          detail: 'Inicio de sesión exitoso',
        });
      },
      error: (error) => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudo ingresar',
          detail: this.resolveLoginErrorMessage(error),
        });
      },
    });
  }

  openRecovery(): void {
    this.forgotPasswordDialog = true;
  }

  sendRecovery(): void {
    if (!this.recoveryEmail) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campo requerido',
        detail: 'Ingresa tu correo electronico.',
      });
      return;
    }

    if (!isValidEmail(this.recoveryEmail)) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Email invalido',
        detail: 'Ingresa un email valido.',
      });
      return;
    }

    this.authService.requestPasswordReset(this.recoveryEmail.trim()).subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'info',
          summary: 'Solicitud enviada',
          detail: response.message,
        });

        this.forgotPasswordDialog = false;
        this.recoveryEmail = '';
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo enviar la solicitud de recuperación.',
        });
      },
    });
  }

  private resolveLoginErrorMessage(error: any): string {
    const message = error?.error?.message;
    if (error?.status === 403 && message) {
      return message;
    }
    if (error?.status === 400 && message) {
      return message;
    }
    if (error?.status === 401) {
      return 'El email o la contraseña no son correctos.';
    }
    return message || 'No se pudo iniciar sesión. Intentá nuevamente.';
  }
}
