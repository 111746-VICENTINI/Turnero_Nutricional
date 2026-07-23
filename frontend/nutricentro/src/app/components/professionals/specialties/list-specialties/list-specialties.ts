import {Component, inject} from '@angular/core';
import {Button} from 'primeng/button';
import {TableGeneric} from '../../../../shared/components/table-generic/table-generic';
import {Toast} from 'primeng/toast';
import {MessageService} from 'primeng/api';
import {Router} from '@angular/router';
import {TableActionConfig, TableColumnConfig} from '../../../../shared/components/table-generic/model/table-model';
import {TableState} from '../../../../core/models/paginacion-general';
import {SpecialtyResponseDTO} from '../models/specialty-model';
import {SpecialtyService} from '../services/specialty-service';

@Component({
  selector: 'app-list-specialties',
  imports: [
    Button,
    TableGeneric,
    Toast
  ],
  templateUrl: './list-specialties.html',
  styleUrl: './list-specialties.css',
})
export class ListSpecialties {
  specialties: SpecialtyResponseDTO[] = [];
  totalRecords = 0;

  private specialtyService = inject(SpecialtyService);
  private messageService = inject(MessageService);
  private router = inject(Router);

  columns: TableColumnConfig<SpecialtyResponseDTO>[] = [
    { field: 'name', header: 'Nombre' },
    { field: 'description', header: 'Descripción' },
    { field: 'isActive', header: 'Activo', type: 'boolean', alignCenter: true, }
  ];

  actions: TableActionConfig<SpecialtyResponseDTO>[] = [
    { field: 'view', label: 'Ver', icon: 'pi pi-eye', severity: 'secondary' },
    { field: 'edit', label: 'Editar', icon: 'pi pi-pencil', severity: 'info' },
    { field: 'delete', label: 'Eliminar', icon: 'pi pi-trash', severity: 'danger' },
  ];

  filters: {
    search?: string;
    name?: string;
    active?: string;
  } = {
    search: ''
  };

  ngOnInit(): void {
    this.loadSpecialties();
  }

  loadSpecialties(page = 0, size = 10): void {
    this.specialtyService.searchSpecialties({
      ...this.filters,
      page,
      size
    })
      .subscribe({
        next: (response) => {
          this.specialties = response.content;
          this.totalRecords = response.totalElements;
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las especialidades' })
      });
  }

  createSpecialty(): void {
    this.router.navigate(['/specialty/create']);
  }

  viewSpecialty(specialty: SpecialtyResponseDTO): void {
    this.router.navigate(['/specialty', specialty.id]);
  }

  deleteSpecialty(specialty: SpecialtyResponseDTO): void {
    this.specialtyService.deleteSpecialty(Number(specialty.id)).subscribe({
      next: () =>
      {
        this.loadSpecialties();
        this.messageService.add({ severity: 'success', summary: 'Éxito', detail: 'Especialidad eliminada' });
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la especialidad' })
    })
  }

  editSpecialty(specialty: SpecialtyResponseDTO){
    this.router.navigate(['/specialty', specialty.id ,'edit']);
  }

  onTableChange(event: TableState): void {
    if (event.search !== undefined) {
      this.filters.search = event.search;
    }

    const page = Math.floor(event.first / event.rows);

    this.loadSpecialties(page, event.rows);
  }
}
