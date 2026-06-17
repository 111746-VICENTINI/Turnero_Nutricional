import { Component, OnInit, inject } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { FormGeneric } from '../../shared/components/form-generic/form-generic';
import { GenericFormField } from '../../shared/components/form-generic/model/form-model';
import {PatientRequestDTO, PatientResponseDTO, PatientUpdateDTO} from './models/patient-model';
import { PatientService } from './services/patient-service';

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
        autocomplete: 'firstName'
      },
      {
        name: 'lastName',
        label: 'Apellido',
        type: 'text',
        required: true,
        autocomplete: 'lastName'
      },
      {
        name: 'document',
        label: 'Documento',
        type: 'number',
        required: true,
        minLength: 7,
        maxLength: 8,
        autocomplete: 'document'
      },
      {
        name: 'email',
        label: 'Email',
        type: 'email',
        pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
        required: false,
        autocomplete: 'email'
      },
      {
        name: 'mobile',
        label: 'Número de teléfono',
        type: 'number',
        minLength: 6,
        maxLength: 20,
        required: false,
        autocomplete: 'mobile'
      },
      {
        name: 'birthDate',
        label: 'Fecha de cumpleaños',
        type: 'date',
        required: true,
        autocomplete: 'birthDate'
      },
      {
        name: 'gender',
        label: 'Género',
        type: 'select',
        options: this.gender,
        required: false,
        autocomplete: 'gender'
      }
    ];

    if (this.mode !== 'create') {
      this.fields.push({
        name: 'status',
        label: 'Paciente activo',
        type: 'checkbox'
      });
    }
  }

  gender = [
    { label: 'Femenino', value: 'FEMALE' },
    { label: 'Masculino', value: 'MALE' },
    { label: 'No binario', value: 'NON_BINARY' },
    { label: 'Prefiero no decirlo', value: 'PREFER_NOT_TO_SAY' }
  ];

  get pageTitle(): string {
    if (this.mode === 'create') {
      return 'Nuevo paciente';
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
    console.log('gender recibido:', formData['gender']);
    console.log(typeof formData['gender']);
    const birthDate = new Date(formData['birthDate'])
      .toISOString()
      .split('T')[0];

    // const gender = formData['gender'] ? String(formData['gender'])
    //     .toUpperCase() : null;

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
        error: () => {
          this.saving = false;
          this.showError('No se pudo actualizar el paciente.');
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
      error: () => {
        this.saving = false;
        this.showError('No se pudo crear el paciente.');
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
      address: this.selectedPatient?.address
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

  editModePatient(): void {
    this.mode = 'edit';
    this.isFormEditable = true;
  }
}
