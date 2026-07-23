import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { AuthResponseDTO } from '../../../core/models/login-model';
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
    CheckboxModule,
    DialogModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './login-form.html',
  styleUrl: './login-form.css',
})
export class LoginForm {
  forgotPasswordDialog = false;
  termsDialog = false;
  termsAccepted = false;
  loginTermsAccepted = true;
  acceptingTerms = false;
  termsDialogMode: 'required' | 'read' = 'read';
  recoveryEmail = '';
  loading = false;
  readonly termsSections = [
    {
      title: '1. Alcance y uso autorizado',
      text: 'Nutri Centro es una herramienta de gestión profesional para consultorios nutricionales.' +
        ' Su uso esta reservado exclusivamente a usuarios autorizados por la institucion, de acuerdo con el rol asignado: administración, secretaria o profesional.'
    },
    {
      title: '2. Información confidencial',
      text: 'El sistema puede contener datos personales, turnos, agenda, historia clínica, antropometrías, resultados de laboratorio, consultas, archivos clínicos, planes alimentarios y otra información sensible de pacientes.' +
        ' Toda informacion consultada o cargada debe tratarse como confidencial.'
    },
    {
      title: '3. Responsabilidad del usuario',
      text: 'Cada usuario es responsable por la veracidad, pertinencia y actualización de la información que registra, modifica o consulta. El acceso a datos clínicos debe responder a una finalidad profesional legítima vinculada con la atención, administración o seguimiento del paciente.'
    },
    {
      title: '4. Credenciales y sesiones',
      text: 'Las credenciales son personales e intransferibles. Está prohibido compartir usuario, contraseña, tokens de acceso o sesiones abiertas. En equipos compartidos o de uso público, el usuario debe cerrar sesión al finalizar y evitar que terceros visualicen información protegida.'
    },
    {
      title: '5. Acceso según roles',
      text: 'Las funciones y datos disponibles dependen de los permisos configurados para cada rol. Intentar acceder, divulgar, extraer o modificar información fuera de las responsabilidades asignadas constituye un uso indebido del sistema.'
    },
    {
      title: '6. Protección de datos y normativa aplicable',
      text: 'El usuario se compromete a utilizar el sistema respetando la normativa de privacidad, protección de datos personales, secreto profesional y confidencialidad aplicable. ' +
        'La información clínica debe emplearse unicamente para fines asistenciales, administrativos o profesionales autorizados.'
    },
    {
      title: '7. Uso adecuado del sistema',
      text: 'No se permite utilizar el sistema para acciones que comprometan su seguridad, disponibilidad, integridad de datos o trazabilidad. Cualquier error, acceso indebido, pérdida de confidencialidad o sospecha de incidente debe informarse a la administración responsable.'
    },
    {
      title: '8. Aceptación',
      text: 'Al aceptar estos términos, el usuario declara haberlos leído y comprendido, y se compromete a cumplirlos durante todo el uso del sistema Nutri Centro.'
    }
  ];

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
      next: (response) => {
        this.loading = false;
        if (this.mustAcceptTerms(response)) {
          this.termsAccepted = false;
          this.termsDialogMode = 'required';
          this.termsDialog = true;
          return;
        }

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

  acceptTerms(): void {
    if (!this.termsAccepted || this.acceptingTerms) {
      return;
    }

    this.acceptingTerms = true;
    this.authService.acceptTerms().subscribe({
      next: () => {
        this.acceptingTerms = false;
        this.termsDialog = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Términos aceptados',
          detail: 'Ya podes ingresar al sistema.',
        });
      },
      error: () => {
        this.acceptingTerms = false;
        this.messageService.add({
          severity: 'error',
          summary: 'No se pudo guardar',
          detail: 'Intenta aceptar los términos nuevamente.',
        });
      },
    });
  }

  cancelTermsAcceptance(): void {
    this.termsDialog = false;
    this.termsAccepted = false;
    this.authService.cancelPendingTermsAcceptance();
  }

  openTermsReadOnly(): void {
    this.termsDialogMode = 'read';
    this.termsAccepted = true;
    this.termsDialog = true;
  }

  closeTermsReadOnly(): void {
    this.termsDialog = false;
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
  private mustAcceptTerms(response: AuthResponseDTO): boolean {
    return response.user?.acceptedTerms === false;
  }

  get isTermsAcceptanceRequired(): boolean {
    return this.termsDialogMode === 'required';
  }
}
