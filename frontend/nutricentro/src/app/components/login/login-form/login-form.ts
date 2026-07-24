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
      text: 'NutriCentro es un sistema de gestión para consultorios nutricionales. Su uso está reservado a usuarios autorizados, de acuerdo con el rol asignado y las funciones habilitadas para tareas administrativas, de secretaría o de atención profesional.'
    },
    {
      title: '2. Información confidencial',
      text: 'El sistema puede contener datos personales, turnos, agenda, historia clínica, antropometrías, resultados de laboratorio, consultas, archivos clínicos, planes alimentarios y otra información sensible de pacientes.' +
        ' Toda informacion consultada, cargada o modificada debe tratarse de manera confidencial y utilizarse únicamente para la prestación del servicio correspondiente.'
    },
    {
      title: '3. Protección de datos personales',
      text: 'NutriCentro asume el compromiso de proteger la privacidad y confidencialidad de los datos personales almacenados en el sistema, especialmente la información clínica y de salud. ' +
        'Los datos serán utilizados únicamente para la gestión de turnos, atención nutricional, seguimiento profesional, administración del consultorio y demás finalidades necesarias para el funcionamiento del servicio.'
    },
    {
      title: '4. Derechos del titular de los datos',
      text: 'Conforme a la Ley N.º 25.326 de Protección de los Datos Personales de la República Argentina, el usuario tiene derecho a decidir o autorizar de forma libre,' +
        ' previa, expresa e informada la recolección, uso y tratamiento de sus datos personales. Asimismo, tiene derecho a conocer qué información posee el sistema sobre su persona, acceder a ella, solicitar su actualización, rectificación, supresión cuando corresponda y controlar el tratamiento que se realiza de dicha información.'
    },
    {
      title: '5. Supresión de datos personales',
      text: 'NutriCentro pone a disposición de sus usuarios un mecanismo para solicitar la eliminación de los datos personales almacenados cuando dejen de utilizar la aplicación, independientemente de su desinstalación. ' +
        'La solicitud será gestionada conforme a la normativa vigente, las obligaciones legales de conservación de la información y las necesidades derivadas de la atención profesional registrada.'
    },
    {
      title: '6. Comunicaciones relacionadas con la atención',
      text: 'El sistema podrá contactar al usuario únicamente para comunicaciones necesarias relacionadas con turnos, recordatorios, cambios de agenda o información requerida para la atención. ' +
        'Estas comunicaciones podrán realizarse por correo electrónico, WhatsApp u otros medios informados, sin fines comerciales.'
    },
    {
      title: '7. Responsabilidad del usuario',
      text: 'Cada usuario es responsable por la veracidad, pertinencia y actualización de la información que registra, consulta o modifica. ' +
        'Las credenciales de acceso son personales e intransferibles, y el usuario debe evitar accesos indebidos, uso no autorizado o divulgación de información protegida..'
    },
    {
      title: '8. Aceptación',
      text: 'Al aceptar estos Términos y Condiciones, el usuario declara haberlos leído y comprendido, y se compromete a utilizar NutriCentro respetando la confidencialidad,' +
        ' la protección de datos personales, el secreto profesional y la normativa vigente aplicable.'
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
