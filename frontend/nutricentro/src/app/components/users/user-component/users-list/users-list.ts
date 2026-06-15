import { Component, inject, OnInit } from '@angular/core';
import {Router, RouterOutlet} from '@angular/router';
import { Button } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { UserResponseDTO } from '../../../../core/model/login-model';
import { UserService } from '../../../../core/services/user-service';
import { TableGeneric } from '../../../../shared/components/table-generic/table-generic';
import {
  TableActionConfig,
  TableColumnConfig,
} from '../../../../shared/components/table-generic/model/table-model';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [TableModule, Button, TagModule, ConfirmDialogModule, TableGeneric],
  templateUrl: './users-list.html',
  styleUrl: './users-list.css',
})
export class UsersList implements OnInit {
  users: UserResponseDTO[] = [];

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
      formatFn: (roles: string[]) => roles?.join(', ') || '-',
    },
  ];

  actions: TableActionConfig<UserResponseDTO>[] = [
    { field: 'view', label: 'Ver', icon: 'pi pi-eye', severity: 'secondary' },
    { field: 'edit', label: 'Editar', icon: 'pi pi-pencil', severity: 'info' },
    { field: 'delete', label: 'Eliminar', icon: 'pi pi-trash', severity: 'danger' },
  ];

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (users) => (this.users = users),
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
}
