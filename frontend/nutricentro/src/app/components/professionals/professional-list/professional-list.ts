import {Component, inject} from '@angular/core';
import {Button} from 'primeng/button';
import {TableGeneric} from '../../../shared/components/table-generic/table-generic';
import {MessageService} from 'primeng/api';
import {Router} from '@angular/router';
import {TableActionConfig, TableColumnConfig} from '../../../shared/components/table-generic/model/table-model';
import {ProfessionalResponseDTO} from '../models/professional-model';
import {ProfessionalService} from '../services/professional-service';
import {Toast} from 'primeng/toast';
import {TableState} from '../../../core/model/paginacion-general';

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
  private messageService = inject(MessageService);
  private router = inject(Router);

  columns: TableColumnConfig<ProfessionalResponseDTO>[] = [
    { field: 'lastName', header: 'Apellido' },
    { field: 'firstName', header: 'Nombre' },
    { field: 'specialty', header: 'Especialidad' },
    { field: 'email', header: 'Email' },
    { field: 'status', header: 'Activo' }
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
  } = {
    search: ''
  };

  ngOnInit(): void {
    this.loadProfessionals();
  }

  loadProfessionals(page = 0, size = 10): void {
    this.professionalService.searchProfessionals({
      ...this.filters,
      page,
      size
    })
      .subscribe({
      next: (response) => {
          this.professionals = response.content;
          this.totalRecords = response.totalElements;
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
        this.messageService.add({ severity: 'success', summary: 'Exito', detail: 'Profesional eliminado' });
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el profesional' })
    })
  }

  editProfessional(professional: ProfessionalResponseDTO){
    this.router.navigate(['/professional', professional.id ,'edit']);
  }

  onTableChange(event: TableState): void {
    if (event.search !== undefined) {
      this.filters.search = event.search;
    }

    const page = Math.floor(event.first / event.rows);

    this.loadProfessionals(page, event.rows);
  }
}
