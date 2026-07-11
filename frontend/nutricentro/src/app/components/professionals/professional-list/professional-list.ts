import {Component, inject} from '@angular/core';
import {Button} from 'primeng/button';
import {TableGeneric} from '../../../shared/components/table-generic/table-generic';
import {MessageService} from 'primeng/api';
import {Router} from '@angular/router';
import {TableActionConfig, TableColumnConfig, TableFilterConfig} from '../../../shared/components/table-generic/model/table-model';
import {ProfessionalResponseDTO} from '../models/professional-model';
import {ProfessionalService} from '../services/professional-service';
import {Toast} from 'primeng/toast';
import {TableState} from '../../../core/models/paginacion-general';
import {SpecialtyOnlyNameDTO} from '../specialties/models/specialty-model';
import {Gender_Options} from '../../../shared/constants/genders';
import {PERSON_STATUS_LABELS, PERSON_STATUS_OPTIONS, PersonStatus} from '../../../shared/constants/person-status';
import {getLabel} from '../../../shared/utils/utils-enum';
import {SpecialtyService} from '../specialties/services/specialty-service';

@Component({
  selector: 'app-professional-list',
  standalone: true,
  imports: [
    Button,
    TableGeneric,
    Toast
  ],
  templateUrl: './professional-list.html',
  styleUrl: './professional-list.css',
})
export class ProfessionalList {
  professionals: ProfessionalResponseDTO[] = [];
  totalRecords = 0;

  private professionalService = inject(ProfessionalService);
  private specialtyService = inject(SpecialtyService);
  private messageService = inject(MessageService);
  private router = inject(Router);

  columns: TableColumnConfig<ProfessionalResponseDTO>[] = [
    { field: 'lastName', header: 'Apellido' },
    { field: 'firstName', header: 'Nombre' },
    { field: 'specialties', header: 'Especialidad', type: 'custom', sortable: false,
      formatFn: value => (value as SpecialtyOnlyNameDTO[]).map(s => s.name).join(', ') },
    { field: 'email', header: 'Email' },
    { field: 'status', header: 'Activo', type: 'custom', alignCenter: true,
      formatFn: value => getLabel(value as PersonStatus, PERSON_STATUS_LABELS),
      tagSeverityFn: value => value === PersonStatus.ACTIVE ? 'success' : 'danger' }
  ];

  actions: TableActionConfig<ProfessionalResponseDTO>[] = [
    { field: 'view', label: 'Ver', icon: 'pi pi-eye', severity: 'secondary' },
    { field: 'edit', label: 'Editar', icon: 'pi pi-pencil', severity: 'info' },
    { field: 'delete', label: 'Eliminar', icon: 'pi pi-trash', severity: 'danger' },
  ];

  filters: {
    search?: string;
    gender?: string;
    status?: string;
    specialtyId?: number;
    sortBy?: string;
    direction?: 'asc' | 'desc';
  } = {
    search: '',
    sortBy: 'lastName',
    direction: 'asc'
  };

  filterConfigs: TableFilterConfig[] = [
    {
      field: 'status',
      label: 'Estado',
      placeholder: 'Todos',
      options: [
        { label: 'Todos', value: null },
        ...PERSON_STATUS_OPTIONS
      ]
    },
    {
      field: 'gender',
      label: 'Género',
      placeholder: 'Todos',
      options: [
        { label: 'Todos', value: null },
        ...Gender_Options
      ]
    },
    {
      field: 'specialtyId',
      label: 'Especialidad',
      placeholder: 'Todas',
      options: [{ label: 'Todas', value: null }]
    }
  ];

  ngOnInit(): void {
    this.loadSpecialtyFilters();
    this.loadProfessionals();
  }

  loadSpecialtyFilters(): void {
    this.specialtyService.getAllSpecialties().subscribe({
      next: (specialties) => {
        this.filterConfigs = this.filterConfigs.map((filter) =>
          filter.field === 'specialtyId'
            ? {
              ...filter,
              options: [
                { label: 'Todas', value: null },
                ...specialties.map((specialty) => ({
                  label: specialty.name,
                  value: specialty.id
                }))
              ]
            }
            : filter
        );
      }
    });
  }

  loadProfessionals(page = 0, size = 10): void {
    this.professionalService.searchProfessionals({
      ...this.filters,
      page,
      size
    })
      .subscribe({
      next: (response) => {
        if (!response) {
          this.professionals = [];
          this.totalRecords = 0;
          return;
        }

        this.professionals = (response.content ?? []).map(p => ({
          ...p,
          specialty: p.specialties?.map(s => s.name).join(', ')
        }));

        this.totalRecords = response.totalElements ?? 0;
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los profesionales' })
    });
  }

  createProfessional(): void {
    this.router.navigate(['/professional/create']);
  }

  viewProfessional(professional: ProfessionalResponseDTO): void {
    this.router.navigate(['/professional', professional.id]);
  }

  deleteProfessional(professional: ProfessionalResponseDTO): void {
    this.professionalService.deleteProfessional(Number(professional.id)).subscribe({
      next: () =>
      {
        this.loadProfessionals();
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Profesional eliminado' });
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el profesional' })
    })
  }

  editProfessional(professional: ProfessionalResponseDTO){
    this.router.navigate(['/professional', professional.id ,'edit']);
  }

  onTableChange(event: TableState): void {
    const filters = event.filters ?? {};

    this.filters = {
      search: event.search,
      gender: filters['gender'],
      status: filters['status'],
      specialtyId: filters['specialtyId'],
      sortBy: this.mapSortField(event.sortField),
      direction: event.sortOrder === -1 ? 'desc' : 'asc'
    };

    const page = Math.floor(event.first / event.rows);

    this.loadProfessionals(page, event.rows);
  }

  private mapSortField(field: string | undefined): string {
    const allowedFields = ['lastName', 'firstName', 'email', 'status', 'gender', 'document', 'birthDate'];
    return field && allowedFields.includes(field) ? field : 'lastName';
  }
}
