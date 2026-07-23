import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '../../../core/services/auth-service';

@Component({
  selector: 'app-create-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, PasswordModule, ButtonModule, ToastModule],
  providers: [MessageService],
  templateUrl: './create-password.html',
  styleUrl: './create-password.css',
})
export class CreatePassword {
  loading = false;
  completed = false;
  private readonly token = inject(ActivatedRoute).snapshot.queryParamMap.get('token') ?? '';
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);

  form = this.fb.nonNullable.group({
    newPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(100)]],
    confirmPassword: ['', [Validators.required]],
  });

  constructor() {
    if (this.token && typeof window !== 'undefined') {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  submit(): void {
    if (!this.token) {
      this.showError('El enlace no es válido o está incompleto.');
      return;
    }
    if (this.form.invalid || !this.passwordsMatch) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.loading = true;
    this.authService.createPassword(this.token, value.newPassword, value.confirmPassword).subscribe({
      next: () => {
        this.loading = false;
        this.completed = true;
        this.messageService.add({ severity: 'success', summary: 'Listo', detail: 'Tu contraseña fue creada.' });
      },
      error: (error) => {
        this.loading = false;
        this.showError(error?.error?.message || 'No se pudo crear la contraseña.');
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  get passwordsMatch(): boolean {
    const value = this.form.getRawValue();
    return value.newPassword === value.confirmPassword;
  }

  private showError(detail: string): void {
    this.messageService.add({ severity: 'error', summary: 'Error', detail });
  }
}
