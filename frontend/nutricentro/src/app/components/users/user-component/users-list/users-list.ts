import { Component, inject, OnInit } from '@angular/core';
import {Router} from '@angular/router';
import { Button } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { UserResponseDTO } from '../../../../core/models/login-model';
import { UserService } from '../services/user-service';
import { TableGeneric } from '../../../../shared/components/table-generic/table-generic';
import {
  TableActionConfig,
  TableColumnConfig,
  TableFilterConfig,
} from '../../../../shared/components/table-generic/model/table-model';
import {TableState} from '../../../../core/models/paginacion-general';
import {PERSON_STATUS_OPTIONS} from '../../../../shared/constants/person-status';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [TableModule, Button, TagModule, ConfirmDialogModule, TableGeneric],
  templateUrl: './users-list.html',
  styleUrl: './users-list.css',
})
export class UsersList implements OnInit {
  users: UserResponseDTO[] = [];
  totalRecords = 0;

  private userService = inject(UserService);
  private router = inject(Router);

  columns: TableColumnConfig<UserResponseDTO>[] = [
    { field: 'username', header: 'Usuario' },
    { field: 'email', header: 'Email' },
    {
      field: 'isActive',
      header: 'Activo',
      type: 'boolean',
      alignCenter: true,
      width: '7rem',
    },
    {
      field: 'roles',
      header: 'Roles',
      type: 'custom',
      sortable: false,
      formatFn: (roles: string[]) =>
      {
        if (!roles || roles.length === 0) return '-';
        return roles
          .map(role => this.roleTranslations[role.toUpperCase()] || role)
          .join(', ');
      },
    },
  ];

  actions: TableActionConfig<UserResponseDTO>[] = [
    { field: 'view', label: 'Ver', icon: 'pi pi-eye', severity: 'secondary' },
    { field: 'edit', label: 'Editar', icon: 'pi pi-pencil', severity: 'info' },
    { field: 'delete', label: 'Eliminar', icon: 'pi pi-trash', severity: 'danger' },
  ];

  filterConfigs: TableFilterConfig[] = [
    {
      field: 'isActive',
      label: 'Estado',
      placeholder: 'Todos',
      options: [
        { label: 'Todos', value: null },
        ...PERSON_STATUS_OPTIONS
      ]
    },
    {
      field: 'roles',
      label: 'Rol',
      placeholder: 'Todos',
      options: [
        { label: 'Todos', value: null },
        { label: 'Administrador', value: 'ADMIN' },
        { label: 'Secretaria', value: 'SECRETARY' },
        { label: 'Profesional', value: 'PROFESSIONAL' }
      ]
    }
  ];

  filters: {
    search?: string;
    role?: string;
    isActive?: boolean;
    sortBy?: string;
    direction?: 'asc' | 'desc';
  } = {
    search: '',
    sortBy: 'username',
    direction: 'asc'
  };

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(page = 0, size = 10): void {
    this.userService.searchUsers({
      ...this.filters,
      page,
      size
    })
      .subscribe({
        next: response => {
          if (!response) {
            this.users = [];
            this.totalRecords = 0;
            return;
          }
          this.users = response.content ?? [];
          this.totalRecords = response.totalElements ?? 0;
        }
      });
  }

  deleteUser(user: UserResponseDTO): void {
    this.userService.deleteUser(Number(user.id)).subscribe({
      next: () => this.loadUsers(),
    });
  }

  createUser(): void {
    this.router.navigate(['/users/create']);
  }

  viewUser(user: UserResponseDTO): void {
    this.router.navigate(['/users', user.id]);
  }

  editUser(user: UserResponseDTO): void {
    this.router.navigate(['/users', user.id, 'edit']);
  }

  onTableChange(event: TableState): void {
    const filters = event.filters ?? {};

    this.filters = {
      search: event.search,
      role: this.normalizeRoleFilter(filters['roles']),
      isActive: filters['isActive'],
      sortBy: this.mapSortField(event.sortField),
      direction: event.sortOrder === -1 ? 'desc' : 'asc'
    };
    const page = Math.floor(event.first / event.rows);

    this.loadUsers(page, event.rows);
  }

  private roleTranslations: Record<string, string> = {
    'ADMIN': 'Administrador',
    'SECRETARY': 'Secretaria',
    'PROFESSIONAL': 'Profesional'
  };

  private normalizeRoleFilter(value: any): string | undefined {
    if (!value) {
      return undefined;
    }

    const normalized = String(value).toUpperCase();
    const match = Object.entries(this.roleTranslations)
      .find(([role, label]) => role.includes(normalized) || label.toUpperCase().includes(normalized));

    return match?.[0] ?? normalized;
  }

  private mapSortField(field: string | undefined): string {
    const allowedFields = ['username', 'email', 'isActive'];
    return field && allowedFields.includes(field) ? field : 'username';
  }
}
