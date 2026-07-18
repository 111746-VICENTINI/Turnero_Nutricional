import {Component, inject, OnInit} from '@angular/core';
import {Button} from "primeng/button";
import {FormGeneric} from "../../../../shared/components/form-generic/form-generic";
import {GenericFormField} from '../../../../shared/components/form-generic/model/form-model';
import {MessageService} from 'primeng/api';
import {ActivatedRoute, Router} from '@angular/router';
import {SpecialtyRequestDTO, SpecialtyResponseDTO, SpecialtyUpdateDTO} from '../models/specialty-model';
import {SpecialtyService} from '../services/specialty-service';

type UserFormMode = 'create' | 'view' | 'edit';

@Component({
  selector: 'app-create-specialty',
    imports: [
        Button,
        FormGeneric
    ],
  templateUrl: './create-specialty.html',
  styleUrl: './create-specialty.css',
})
export class CreateSpecialty implements OnInit {
  selectedSpecialty: SpecialtyResponseDTO | null = null;
  mode: UserFormMode = 'create';
  specialtyId?: number;
  isFormEditable = true;
  saving = false;
  fields: GenericFormField[] = [];
  initialValues: Record<string, any> = {};

  private specialtyService = inject(SpecialtyService);
  private messageService = inject(MessageService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const routePath = this.route.snapshot.routeConfig?.path || '';

    if (id) {
      this.mode = routePath.endsWith('/edit') ? 'edit' : 'view';
      this.specialtyId = Number(id);
      this.isFormEditable = this.mode === 'edit';
      this.loadSpecialty(this.specialtyId);
    }

    this.buildFields();
  }

  private buildFields(): void {
    this.fields = [
      {
        name: 'name',
        label: 'Nombre',
        type: 'text',
        required: true,
        autocomplete: 'name'
      },
      {
        name: 'description',
        label: 'Descripción',
        type: 'text',
        required: false,
        autocomplete: 'description'
      }
    ];

    if (this.mode !== 'create') {
      this.fields.push({
        name: 'isActive',
        label: 'Estado',
        type: 'select',
        options: [
          { label: 'Activo', value: true },
          { label: 'Inactivo', value: false }
        ]
      });
    }
  }

  get pageTitle(): string {
    if (this.mode === 'create') {
      return 'Nueva especialidad';
    }

    return this.mode === 'view' ? 'Ver especialidad' : 'Editar especialidad';
  }

  get submitLabel(): string {
    return this.mode === 'create' ? 'Crear' : 'Actualizar';
  }

  private loadSpecialty(id:number): void {
    this.specialtyService.getByIdSpecialty(id).subscribe({
      next: specialty => {
        this.selectedSpecialty = specialty;

        this.initialValues = {
          name: specialty.name,
          description: specialty.description,
          isActive: specialty.isActive
        };
      },
      error: () => {
        this.showError('No se pudo cargar la especialidad');
      }
    });
  }

  saveSpecialty(formData: Record<string, any>): void {
    this.saving = true;

    if (this.mode !== 'create') {
      const request: SpecialtyUpdateDTO = {
        name: formData['name'],
        description: formData['description'],
        isActive: formData['isActive']
      };

      this.specialtyService.updateSpecialty(this.specialtyId!, request).subscribe({
        next: () => {
          this.saving = false;
          this.showSuccess('Especialidad actualizada correctamente.');
          this.goBack();
        },
        error: () => {
          this.saving = false;
          this.showError('No se pudo actualizar la especialidad.');
        },
      });

      return;
    }

    const request: SpecialtyRequestDTO = {
      name: formData['name'],
      description: formData['description'],
      isActive: formData['isActive']
    };

    this.specialtyService.createSpecialty(request).subscribe({
      next: () => {
        this.saving = false;
        this.showSuccess('Especialidad creada correctamente.');
        this.goBack();
      },
      error: () => {
        this.saving = false;
        this.showError('No se pudo crear la especialidad.');
      },
    });

  }

  cancel(): void {
    if (this.mode === 'create') {
      this.goBack();
      return;
    }

    this.initialValues = {
      name: this.selectedSpecialty?.name,
      description: this.selectedSpecialty?.description,
      isActive: this.selectedSpecialty?.isActive
    };

    this.mode = 'view';
    this.isFormEditable = false;
    this.buildFields();
  }

  goBack(): void {
    this.router.navigate(['/specialty']);
  }

  private showSuccess(detail: string): void {
    this.messageService.add({ severity: 'success', summary: 'Listo', detail });
  }

  private showError(detail: string): void {
    this.messageService.add({ severity: 'error', summary: 'Error', detail });
  }

  editModeUser(): void {
    this.mode = 'edit';
    this.isFormEditable = true;
    this.buildFields();
  }

}
