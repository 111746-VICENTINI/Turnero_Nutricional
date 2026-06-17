import {Component, inject} from '@angular/core';
import {Button} from 'primeng/button';
import {TableModule} from 'primeng/table';
import {TableGeneric} from '../../../shared/components/table-generic/table-generic';
import {PatientResponseDTO} from '../models/patient-model';
import {PatientService} from '../services/patient-service';
import {MessageService} from 'primeng/api';
import {Router} from '@angular/router';
import {TableActionConfig, TableColumnConfig} from '../../../shared/components/table-generic/model/table-model';
import {TableState} from '../../../core/model/paginacion-general';

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
  private messageService = inject(MessageService);
  private router = inject(Router);

  columns: TableColumnConfig<PatientResponseDTO>[] = [
    { field: 'lastName', header: 'Apellido' },
    { field: 'firstName', header: 'Nombre' },
    { field: 'age', header: 'Edad' },
    { field: 'email', header: 'Email' },
    { field: 'status', header: 'Activo', type: 'boolean', alignCenter: true, }
  ];

  actions: TableActionConfig<PatientResponseDTO>[] = [
    { field: 'view', label: 'Ver', icon: 'pi pi-eye', severity: 'secondary' },
    { field: 'edit', label: 'Editar', icon: 'pi pi-pencil', severity: 'info' },
    { field: 'delete', label: 'Eliminar', icon: 'pi pi-trash', severity: 'danger' },
  ];

  filters: {
    search?: string;
    gender?: string;
    status?: string;
  } = {
    search: ''
  };

  ngOnInit(): void {
    this.loadPatients();
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
    if (event.search !== undefined) {
      this.filters.search = event.search;
    }

    const page = Math.floor(event.first / event.rows);

    this.loadPatients(page, event.rows);
  }
}
