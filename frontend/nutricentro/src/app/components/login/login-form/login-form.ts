import {Component, inject} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import {AuthService} from '../../../core/services/auth-service';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    CardModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    DividerModule,
    DialogModule,
    ToastModule
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
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  login() {
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
          detail: 'Inicio de sesion exitoso'
        });
      },
      error: (err) => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Credenciales incorrectas o problemas de conexion'
        });
        console.error('Login error:', err);
      }
    });
  }

  openRecovery() {
    this.forgotPasswordDialog = true;
  }

  sendRecovery() {
    if (!this.recoveryEmail) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campo requerido',
        detail: 'Ingresa tu correo electrónico'
      });
      return;
    }

    this.messageService.add({
      severity: 'info',
      summary: 'Correo enviado',
      detail: 'Revisa tu email para recuperar tu contraseña'
    });

    this.forgotPasswordDialog = false;
    this.recoveryEmail = '';
  }
}
