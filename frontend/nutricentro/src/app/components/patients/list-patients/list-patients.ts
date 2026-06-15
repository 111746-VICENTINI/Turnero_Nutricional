import {Component, inject} from '@angular/core';
import {Button} from 'primeng/button';
import {TableModule} from 'primeng/table';
import {TableGeneric} from '../../../shared/components/table-generic/table-generic';
import {PatientResponseDTO} from '../models/patient-model';
import {PatientService} from '../services/patient-service';
import {MessageService} from 'primeng/api';
import {Router} from '@angular/router';
import {TableActionConfig, TableColumnConfig} from '../../../shared/components/table-generic/model/table-model';

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

    private patientService = inject(PatientService);
    private messageService = inject(MessageService);
    private router = inject(Router);

  columns: TableColumnConfig<PatientResponseDTO>[] = [
    { field: 'lastName', header: 'Apellido' },
    { field: 'firstName', header: 'Nombre' },
    { field: 'age', header: 'Edad' },
    { field: 'email', header: 'Email' },
    { field: 'status', header: 'Activo' }
  ];

  actions: TableActionConfig<PatientResponseDTO>[] = [
    { field: 'view', label: 'Ver', icon: 'pi pi-eye', severity: 'secondary' },
    { field: 'edit', label: 'Editar', icon: 'pi pi-pencil', severity: 'info' },
    { field: 'delete', label: 'Eliminar', icon: 'pi pi-trash', severity: 'danger' },
  ];

  ngOnInit(): void {
    this.loadPatients();
  }

  loadPatients(): void {
    this.patientService.getAllPatients().subscribe({
      next: (patients) => this.patients = patients,
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
}
