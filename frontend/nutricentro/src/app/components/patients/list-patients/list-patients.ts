import {Component, inject} from '@angular/core';
import {Button} from 'primeng/button';
import {TableModule} from 'primeng/table';
import {TableGeneric} from '../../../shared/components/table-generic/table-generic';
import {PatientResponseDTO} from '../models/patient-model';
import {PatientService} from '../services/patient-service';
import {MessageService} from 'primeng/api';
import {Router} from '@angular/router';
import {TableActionConfig, TableColumnConfig, TableFilterConfig} from '../../../shared/components/table-generic/model/table-model';
import {TableState} from '../../../core/models/paginacion-general';
import {Gender_Options, GenderType} from '../../../shared/constants/genders';
import {PERSON_STATUS_LABELS, PERSON_STATUS_OPTIONS, PersonStatus} from '../../../shared/constants/person-status';
import {getLabel} from '../../../shared/utils/utils-enum';
import {ProfessionalService} from '../../professionals/services/professional-service';

@Component({
  selector: 'app-list-patients',
  standalone: true,
  imports: [
    Button,
    TableModule,
    TableGeneric
  ],
  templateUrl: './list-patients.html',
  styleUrl: './list-patients.css',
})
export class ListPatients {
  patients: PatientResponseDTO[] = [];
  totalRecords = 0;

  private patientService = inject(PatientService);
  private professionalService = inject(ProfessionalService);
  private messageService = inject(MessageService);
  private router = inject(Router);

  columns: TableColumnConfig<PatientResponseDTO>[] = [
    { field: 'lastName', header: 'Apellido' },
    { field: 'firstName', header: 'Nombre' },
    { field: 'age', header: 'Edad', sortable: false },
    { field: 'email', header: 'Email' },
    { field: 'status', header: 'Activo', type: 'custom', alignCenter: true,
      formatFn: value => getLabel(value as PersonStatus, PERSON_STATUS_LABELS),
      tagSeverityFn: value => value === PersonStatus.ACTIVE ? 'success' : 'danger' }
  ];

  actions: TableActionConfig<PatientResponseDTO>[] = [
    { field: 'view', label: 'Ver', icon: 'pi pi-eye', severity: 'secondary' },
    { field: 'history', label: 'Historial', icon: 'pi pi-book', severity: 'secondary' },
    { field: 'edit', label: 'Editar', icon: 'pi pi-pencil', severity: 'info' },
    { field: 'delete', label: 'Eliminar', icon: 'pi pi-trash', severity: 'danger' },
  ];

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
      field: 'professionalId',
      label: 'Profesional',
      placeholder: 'Todos',
      options: [{ label: 'Todos', value: null }]
    }
  ];

  filters: {
    search?: string;
    gender?: GenderType;
    status?: PersonStatus;
    professionalId?: number;
    sortBy?: string;
    direction?: 'asc' | 'desc';
  } = {
    search: '',
    sortBy: 'lastName',
    direction: 'asc'
  };

  ngOnInit(): void {
    this.loadProfessionalFilters();
    this.loadPatients();
  }

  loadProfessionalFilters(): void {
    this.professionalService.getAllProfessionals().subscribe({
      next: (professionals) => {
        this.filterConfigs = this.filterConfigs.map((filter) =>
          filter.field === 'professionalId'
            ? {
              ...filter,
              options: [
                { label: 'Todos', value: null },
                ...professionals.map((professional) => ({
                  label: `${professional.lastName}, ${professional.firstName}`,
                  value: professional.id
                }))
              ]
            }
            : filter
        );
      }
    });
  }

  loadPatients(page=0, size=10): void {
    this.patientService.searchPatients({
      ...this.filters,
      page,
      size
    }).subscribe({
      next: (response) => {
        this.patients = response.content;
        this.totalRecords = response.totalElements;
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los pacientes' })
    });
  }

  createPatient(): void {
    this.router.navigate(['/patient/create']);
  }

  viewPatient(patient: PatientResponseDTO): void {
    this.router.navigate(['/patient', patient.id]);
  }

  viewHistory(patient: PatientResponseDTO): void {
    this.router.navigate(['/medical-history', patient.id]);
  }

  deletePatient(patient: PatientResponseDTO): void {
    this.patientService.deletePatient(Number(patient.id)).subscribe({
      next: () =>
      {
        this.loadPatients();
        this.messageService.add({ severity: 'success', summary: 'Exito', detail: 'Paciente eliminado' });
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el paciente' })
    })
  }

  editPatient(patient: PatientResponseDTO){
    this.router.navigate(['/patient', patient.id ,'edit']);
  }

  onTableChange(event: TableState): void {
    const filters = event.filters ?? {};

    this.filters = {
      search: event.search,
      gender: filters['gender'],
      status: filters['status'],
      professionalId: filters['professionalId'],
      sortBy: this.mapSortField(event.sortField),
      direction: event.sortOrder === -1 ? 'desc' : 'asc'
    };

    const page = Math.floor(event.first / event.rows);

    this.loadPatients(page, event.rows);
  }

  private mapSortField(field: string | undefined): string {
    const allowedFields = ['lastName', 'firstName', 'email', 'document', 'birthDate', 'status', 'gender'];
    return field && allowedFields.includes(field) ? field : 'lastName';
  }
}
