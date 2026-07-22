import { Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import {
  RegisterRequestDTO,
  RoleResponseDTO,
  UpdateUserDTO,
  UserResponseDTO,
} from '../../../../core/models/login-model';
import { RoleService } from '../../../../core/services/role-service';
import { UserService } from '../services/user-service';
import { GenericFormField } from '../../../../shared/components/form-generic/model/form-model';
import { FormGeneric } from '../../../../shared/components/form-generic/form-generic';
import { ROLE_LABELS } from '../../../../shared/enums/roles';
import { USER_STATUS_OPTIONS } from '../../../../shared/enums/user-status';

type UserFormMode = 'create' | 'view' | 'edit';

@Component({
  selector: 'app-create-user',
  standalone: true,
  imports: [ReactiveFormsModule, InputTextModule, ButtonModule, ToastModule, FormGeneric],
  templateUrl: './create-user.html',
  styleUrl: './create-user.css',
})
export class CreateUser implements OnInit {
  roles: RoleResponseDTO[] = [];
  selectedUser: UserResponseDTO | null = null;
  mode: UserFormMode = 'create';
  userId?: number;
  saving = false;
  isFormEditable = true;
  fields: GenericFormField[] = [];
  initialValues: Record<string, any> = {};

  private userService = inject(UserService);
  private roleService = inject(RoleService);
  private messageService = inject(MessageService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const routePath = this.route.snapshot.routeConfig?.path || '';

    if (id) {
      this.mode = routePath.endsWith('/edit') ? 'edit' : 'view';
      this.userId = Number(id);
      this.isFormEditable = this.mode === 'edit';
      this.loadUser(this.userId);
    }

    this.loadRoles();
  }

  private buildFields(): void {
    this.fields = [
      {
        name: 'username',
        label: 'Usuario',
        type: 'text',
        required: true,
        autocomplete: 'username',
        minLength: 3,
        maxLength: 100,
        pattern: /^[A-Za-zÁÉÍÓÚáéíóúÑñ' ]+$/,
        placeholder: 'Nombre de usuario'
      },
      {
        name: 'email',
        label: 'Email',
        type: 'email',
        required: true,
        autocomplete: 'email',
        placeholder: 'ejemplo@gmail.com',
        pattern: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.(com|com\.ar|org|net|edu|gov|es)$/i
      }
    ];

    if (this.mode !== 'create') {
      this.fields.push({
        name: 'isActive',
        label: 'Estado del usuario',
        type: 'select',
        options: USER_STATUS_OPTIONS
      });
    }

    this.fields.push({
      name: 'roles',
      label: 'Roles',
      type: 'multiselect',
      placeholder: 'Seleccione un rol',
      required: true,
      options: this.roles.map(role => ({
        label: ROLE_LABELS[role.name] ?? role.name,
        value: role.name
      }))
    });
  }

  get pageTitle(): string {
    return this.mode === 'create' ? 'Nuevo usuario' : this.mode === 'view' ? 'Ver usuario' : 'Editar usuario';
  }

  get submitLabel(): string {
    return this.mode === 'create' ? 'Crear' : 'Actualizar';
  }

  loadRoles(): void {
    this.roleService.getRoles().subscribe({
      next: (roles) => {
        this.roles = roles;
        this.buildFields();
      },
      error: () => this.showError('No se pudieron cargar los roles.'),
    });
  }

  loadUser(id: number): void {
    this.userService.getUserById(id).subscribe({
      next: (user) => {
        this.selectedUser = user;

        this.initialValues = {
          username: user.username,
          email: user.email,
          isActive: user.isActive,
          roles: [...user.roles],
        };
      },
      error: () => this.showError('No se pudo cargar el usuario.'),
    });
  }

  save(formData: Record<string, any>): void {
    this.saving = true;

    if (this.mode !== 'create') {
      const request: UpdateUserDTO = {
        username: formData['username'],
        email: formData['email'],
        isActive: formData['isActive'],
        roles: formData['roles'],
      };

      this.userService.updateUser(this.userId!, request).subscribe({
        next: () => {
          this.saving = false;
          this.showSuccess('Usuario actualizado correctamente.');
          this.goBack();
        },
        error: () => {
          this.saving = false;
          this.showError('No se pudo actualizar el usuario.');
        },
      });

      return;
    }

    const request: RegisterRequestDTO = {
      username: formData['username'],
      email: formData['email'],
      roles: formData['roles'],
    };

    this.userService.createUser(request).subscribe({
      next: () => {
        this.saving = false;
        this.showSuccess('Usuario creado correctamente. Se envió la invitación para crear contraseña.');
        this.goBack();
      },
      error: () => {
        this.saving = false;
        this.showError('No se pudo crear el usuario.');
      },
    });
  }

  cancel(): void {
    if (this.mode === 'create') {
      this.goBack();
      return;
    }

    this.initialValues = {
      username: this.selectedUser?.username,
      email: this.selectedUser?.email,
      isActive: this.selectedUser?.isActive,
      roles: [...(this.selectedUser?.roles || [])]
    };

    this.mode = 'view';
    this.isFormEditable = false;
    this.buildFields();
  }

  goBack(): void {
    this.router.navigate(['/users']);
  }

  editModeUser(): void {
    this.mode = 'edit';
    this.isFormEditable = true;
    this.buildFields();
  }

  private showSuccess(detail: string): void {
    this.messageService.add({ severity: 'success', summary: 'Listo', detail });
  }

  private showError(detail: string): void {
    this.messageService.add({ severity: 'error', summary: 'Error', detail });
  }
}
