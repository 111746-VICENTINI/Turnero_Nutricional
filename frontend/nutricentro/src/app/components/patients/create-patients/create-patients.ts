import { Component, OnInit, inject } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { FormGeneric } from '../../../shared/components/form-generic/form-generic';
import { GenericFormField } from '../../../shared/components/form-generic/model/form-model';
import {PatientRequestDTO, PatientResponseDTO, PatientUpdateDTO} from '../models/patient-model';
import { PatientService } from '../services/patient-service';
import {Gender_Options} from '../../../shared/enums/genders';
import {PERSON_STATUS_OPTIONS} from '../../../shared/enums/person-status';
import {toIsoLocalDate} from '../../../shared/utils/date-utils';

type UserFormMode = 'create' | 'view' | 'edit';

@Component({
  selector: 'app-patients',
  standalone: true,
  imports: [ButtonModule, ToastModule, FormGeneric],
  providers: [MessageService],
  templateUrl: './create-patients.html',
  styleUrl: './create-patients.css',
})
export class CreatePatients implements OnInit {
  selectedPatient: PatientResponseDTO | null = null;
  mode: UserFormMode = 'create';
  patientId?: number;
  isFormEditable = true;
  saving = false;
  fields: GenericFormField[] = [];
  initialValues: Record<string, any> = {};

  private patientService = inject(PatientService);
  private messageService = inject(MessageService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const routePath = this.route.snapshot.routeConfig?.path || '';

    if (id) {
      this.mode = routePath.endsWith('/edit') ? 'edit' : 'view';
      this.patientId = Number(id);
      this.isFormEditable = this.mode === 'edit';
      this.loadPatients(this.patientId);
    }

    this.buildFields();
  }

  private buildFields(): void {
    this.fields = [
      {
        name: 'firstName',
        label: 'Nombre',
        type: 'text',
        required: true,
        minLength: 3,
        maxLength: 100,
        autocomplete: 'firstName',
        pattern: /^[A-Za-zÁÉÍÓÚáéíóúÑñ' ]+$/
      },
      {
        name: 'lastName',
        label: 'Apellido',
        type: 'text',
        required: true,
        minLength: 3,
        maxLength: 100,
        autocomplete: 'lastName',
        pattern: /^[A-Za-zÁÉÍÓÚáéíóúÑñ' ]+$/
      },
      {
        name: 'document',
        label: 'Documento',
        type: 'numeric',
        required: true,
        pattern: /^[0-9]{7,8}$/,
        placeholder: '12345678',
        autocomplete: 'document'
      },
      {
        name: 'birthDate',
        label: 'Fecha de nacimiento',
        type: 'date',
        required: true,
        autocomplete: 'birthDate'
      },
      {
        name: 'email',
        label: 'Email',
        type: 'email',
        placeholder: 'ejemplo@correo.com',
        required: false,
        autocomplete: 'email'
      },
      {
        name: 'mobile',
        label: 'Número de teléfono',
        type: 'numeric',
        placeholder: '+5493525345678',
        pattern: /^\+?[0-9\s\-]{6,20}$/,
        required: false,
        autocomplete: 'mobile'
      },
      {
        name: 'gender',
        label: 'Género',
        type: 'select',
        placeholder: 'Seleccione un género',
        options: Gender_Options,
        required: false,
        autocomplete: 'gender'
      }
    ];

    if (this.mode !== 'create') {
      this.fields.push({
        name: 'status',
        label: 'Estado',
        type: 'select',
        options: PERSON_STATUS_OPTIONS
      });
    }
  }

  get pageTitle(): string {
    if (this.mode === 'create') {
      return 'Crear paciente';
    }

    return this.mode === 'view' ? 'Ver paciente' : 'Editar paciente';
  }

  get submitLabel(): string {
    return this.mode === 'create' ? 'Crear' : 'Actualizar';
  }

  loadPatients(id: number): void {
    this.patientService.getByIdPatient(id).subscribe({
      next: (patients) => {
        this.selectedPatient = patients;
        this.initialValues = {
          firstName: patients.firstName,
          lastName: patients.lastName,
          age: patients.age,
          status: patients.status,
          email: patients.email,
          mobile: patients.mobile,
          gender: patients.gender,
          address: patients.address,
          birthDate: patients.birthDate,
          document: patients.document
        };
      },
      error: () => {
        this.showError('No se pudieron cargar los pacientes.');
      },
    });
  }

  savePatient(formData: Record<string, any>): void {
    this.saving = true;
    const birthDate = toIsoLocalDate(formData['birthDate']);

    if (this.mode !== 'create') {
      const request: PatientUpdateDTO = {
        firstName: formData['firstName'],
        lastName: formData['lastName'],
        status: formData['status'],
        email: formData['email'],
        mobile: formData['mobile'],
        gender: formData['gender'],
        address: formData['address'],
        birthDate,
        document: formData['document']
      };

      this.patientService.updatePatient(this.patientId!, request).subscribe({
        next: () => {
          this.saving = false;
          this.showSuccess('Paciente actualizado correctamente.');
          this.goBack();
        },
        error: (error) => {
          this.saving = false;
          this.showError(this.errorMessage(error, 'No se pudo actualizar el paciente.'));
        },
      });

      return;
    }

    const request: PatientRequestDTO = {
      firstName: formData['firstName'],
      lastName: formData['lastName'],
      status: formData['status'],
      email: formData['email'],
      mobile: formData['mobile'],
      gender: formData['gender'],
      address: formData['address'],
      birthDate,
      document: formData['document']
    };

    this.patientService.createPatient(request).subscribe({
      next: () => {
        this.saving = false;
        this.showSuccess('Paciente creado correctamente.');
        this.goBack();
      },
      error: (error) => {
        this.saving = false;
        this.showError(this.errorMessage(error, 'No se pudo crear el paciente.'));
      },
    });

  }

  cancel(): void {
    if (this.mode === 'create') {
      this.goBack();
      return;
    }

    this.initialValues = {
      firstName: this.selectedPatient?.firstName,
      lastName: this.selectedPatient?.lastName,
      age: this.selectedPatient?.age,
      status: this.selectedPatient?.status,
      email: this.selectedPatient?.email,
      mobile: this.selectedPatient?.mobile,
      gender: this.selectedPatient?.gender,
      address: this.selectedPatient?.address,
      birthDate: this.selectedPatient?.birthDate
    };

    this.mode = 'view';
    this.isFormEditable = false;
    this.buildFields();
  }

  goBack(): void {
    this.router.navigate(['/patient']);
  }

  private showSuccess(detail: string): void {
    this.messageService.add({ severity: 'success', summary: 'Listo', detail });
  }

  private showError(detail: string): void {
    this.messageService.add({ severity: 'error', summary: 'Error', detail });
  }

  private errorMessage(error: unknown, fallback: string): string {
    const response = error as {error?: {message?: string} | string; message?: string};
    const backendMessage = response?.error && typeof response.error === 'object'
      ? response.error.message
      : undefined;
    if (backendMessage) {
      return backendMessage;
    }
    if (typeof response?.error === 'string') {
      return response.error;
    }
    return response?.message || fallback;
  }

  editModePatient(): void {
    this.mode = 'edit';
    this.isFormEditable = true;
  }

  goToHistory(): void {
    this.router.navigate(['/medical-history', this.patientId]);
  }
}
