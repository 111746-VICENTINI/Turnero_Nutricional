import {Component, inject, OnInit} from '@angular/core';
import {Button} from 'primeng/button';
import {FormGeneric} from '../../../shared/components/form-generic/form-generic';
import {Toast} from 'primeng/toast';
import {GenericFormField} from '../../../shared/components/form-generic/model/form-model';
import {MessageService} from 'primeng/api';
import {ActivatedRoute, Router} from '@angular/router';
import {ProfessionalRequestDTO, ProfessionalResponseDTO, ProfessionalUpdateDTO} from '../models/professional-model';
import {ProfessionalService} from '../services/professional-service';
import {SpecialtyService} from '../specialties/services/specialty-service';

type UserFormMode = 'create' | 'view' | 'edit';

@Component({
  selector: 'app-create-professionals',
  imports: [
    Button,
    FormGeneric,
    Toast
  ],
  templateUrl: './create-professionals.html',
  styleUrl: './create-professionals.css',
})
export class CreateProfessionals implements OnInit {
  selectedProfessional: ProfessionalResponseDTO | null = null;
  mode: UserFormMode = 'create';
  professionalId?: number;
  isFormEditable = true;
  saving = false;
  fields: GenericFormField[] = [];
  initialValues: Record<string, any> = {};

  private professionalService = inject(ProfessionalService);
  private specialtyService = inject(SpecialtyService);
  private messageService = inject(MessageService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  ngOnInit(): void {
    this.loadSpecialties();

    const id = this.route.snapshot.paramMap.get('id');
    const routePath = this.route.snapshot.routeConfig?.path || '';

    if (id) {
      this.mode = routePath.endsWith('/edit') ? 'edit' : 'view';
      this.professionalId = Number(id);
      this.isFormEditable = this.mode === 'edit';
      this.loadProfessional(this.professionalId);
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
        name: 'specialtyIds',
        label: 'Especialidad',
        type: 'multiselect',
        options: this.specialties,
        required: true,
        autocomplete: 'specialtyIds'
      },
      {
        name: 'tuition',
        label: 'Matrícula',
        type: 'text',
        required: true,
        autocomplete: 'tuition'
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
        label: 'Profesional activo',
        options: this.status,
        type: 'checkbox'
      });
    }
  }

  specialties : { label: string; value: number }[] = [];

  gender = [
    { label: 'Femenino', value: 'FEMALE' },
    { label: 'Masculino', value: 'MALE' },
    { label: 'No binario', value: 'NON_BINARY' },
    { label: 'Prefiero no decirlo', value: 'PREFER_NOT_TO_SAY' }
  ];

  status = [
    { label: 'Activo', value: 'ACTIVE' },
    { label: 'Inactivo', value: 'INACTIVE' }
  ]

  get pageTitle(): string {
    if (this.mode === 'create') {
      return 'Nuevo profesional';
    }

    return this.mode === 'view' ? 'Ver profesional' : 'Editar profesional';
  }

  get submitLabel(): string {
    return this.mode === 'create' ? 'Crear' : 'Actualizar';
  }

  loadProfessional(id: number): void {
    this.professionalService.getByIdProfessional(id).subscribe({
      next: (professionals) => {
        this.selectedProfessional = professionals;
        this.initialValues = {
          firstName: professionals.firstName,
          lastName: professionals.lastName,
          registration: professionals.registration,
          status: professionals.status,
          email: professionals.email,
          mobile: professionals.mobile,
          gender: professionals.gender,
          birthDate: professionals.birthDate,
          tuition: professionals.tuition,
          document: professionals.document,
          specialtyIds: professionals.specialties.map(s => s.id)
        };
      },
      error: () => {
        this.showError('No se pudieron cargar los profesionales.');
      }
    });
  }

  loadSpecialties(): void {
    this.specialtyService.getAllSpecialties().subscribe({
      next: (specialties) => {
        this.specialties = specialties
          .filter(s => s.isActive)
          .map(s => ({
            label: s.name,
            value: s.id
          }));

        this.buildFields();
      },
      error: () => {
        this.showError('No se pudieron cargar las especialidades.');
      }
    });
  }

  saveProfessional(formData: Record<string, any>): void {
    this.saving = true;

    const birthDate = new Date(formData['birthDate'])
      .toISOString()
      .split('T')[0];

    if (this.mode !== 'create') {
      const request: ProfessionalUpdateDTO = {
        firstName: formData['firstName'],
        lastName: formData['lastName'],
        status: formData['status'],
        email: formData['email'],
        mobile: formData['mobile'],
        gender: formData['gender'],
        registration: formData['registration'],
        specialtyIds: formData['specialtyIds'],
        tuition: formData['tuition'],
        birthDate,
        document: formData['document'],
      };

      this.professionalService.updateProfessional(this.professionalId!, request).subscribe({
        next: () => {
          this.saving = false;
          this.showSuccess('Profesional actualizado correctamente.');
          this.goBack();
        },
        error: () => {
          this.saving = false;
          this.showError('No se pudo actualizar el profesional.');
        },
      });

      return;
    }

    const request: ProfessionalRequestDTO = {
      firstName: formData['firstName'],
      lastName: formData['lastName'],
      status: formData['status'],
      email: formData['email'],
      mobile: formData['mobile'],
      gender: formData['gender'],
      birthDate,
      registration: formData['registration'],
      specialtyIds: formData['specialtyIds'],
      document: formData['document'],
      tuition: formData['tuition']
    };

    this.professionalService.createProfessional(request).subscribe({
      next: () => {
        this.saving = false;
        this.showSuccess('Profesional creado correctamente.');
        this.goBack();
      },
      error: () => {
        this.saving = false;
        this.showError('No se pudo crear el profesional.');
      },
    });

  }

  cancel(): void {
    if (this.mode === 'create') {
      this.goBack();
      return;
    }

    this.initialValues = {
      firstName: this.selectedProfessional?.firstName,
      lastName: this.selectedProfessional?.lastName,
      birthDate: this.selectedProfessional?.birthDate,
      status: this.selectedProfessional?.status,
      email: this.selectedProfessional?.email,
      mobile: this.selectedProfessional?.mobile,
      gender: this.selectedProfessional?.gender,
      registration: this.selectedProfessional?.registration,
      specialtyIds: this.selectedProfessional?.specialties.map(s => s.id)
    };

    this.mode = 'view';
    this.isFormEditable = false;
    this.buildFields();
  }

  goBack(): void {
    this.router.navigate(['/professional']);
  }

  private showSuccess(detail: string): void {
    this.messageService.add({ severity: 'success', summary: 'Listo', detail });
  }

  private showError(detail: string): void {
    this.messageService.add({ severity: 'error', summary: 'Error', detail });
  }

  editModeProfessional(): void {
    this.mode = 'edit';
    this.isFormEditable = true;
  }
}
