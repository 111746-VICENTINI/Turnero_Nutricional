import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
} from '../../../../core/model/login-model';
import { RoleService } from '../../../../core/services/role-service';
import { UserService } from '../../../../core/services/user-service';

type UserFormMode = 'create' | 'view' | 'edit';
type UserFormControlName = 'username' | 'email' | 'password' | 'isActive' | 'roles';

@Component({
  selector: 'app-create-user',
  standalone: true,
  imports: [ReactiveFormsModule, InputTextModule, ButtonModule, ToastModule],
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

  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private roleService = inject(RoleService);
  private messageService = inject(MessageService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    isActive: [true],
    roles: [[] as string[], Validators.required],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const routePath = this.route.snapshot.routeConfig?.path || '';

    if (id) {
      this.mode = routePath.endsWith('/edit') ? 'edit' : 'view';
      this.userId = Number(id);
      this.isFormEditable = false;
      this.loadUser(this.userId);
    }

    this.configureFormState();
    this.loadRoles();
  }

  get pageTitle(): string {
    if (this.mode === 'create') {
      return 'Nuevo usuario';
    }

    return this.mode === 'view' ? 'Ver usuario' : 'Editar usuario';
  }

  get submitLabel(): string {
    return this.mode === 'create' ? 'Crear' : 'Actualizar';
  }

  get showEditButton(): boolean {
    return this.mode !== 'create' && !this.isFormEditable;
  }

  get showFormActions(): boolean {
    return this.mode === 'create' || this.isFormEditable;
  }

  loadRoles(): void {
    this.roleService.getRoles().subscribe({
      next: (roles) => (this.roles = roles),
      error: () => this.showError('No se pudieron cargar los roles.'),
    });
  }

  loadUser(id: number): void {
    this.userService.getUserById(id).subscribe({
      next: (user) => {
        this.selectedUser = user;
        this.form.patchValue({
          username: user.username,
          email: user.email,
          password: '',
          isActive: user.isActive,
          roles: [...user.roles],
        });
        this.configureFormState();
      },
      error: () => this.showError('No se pudo cargar el usuario.'),
    });
  }

  enableEditing(): void {
    this.mode = 'edit';
    this.isFormEditable = true;
    this.configureFormState();
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    const formData = this.form.getRawValue();

    if (this.mode !== 'create') {
      const request: UpdateUserDTO = {
        username: formData.username,
        email: formData.email,
        isActive: formData.isActive,
        roles: formData.roles,
      };

      this.userService.updateUser(this.userId!, request).subscribe({
        next: () => {
          this.saving = false;
          this.showSuccess('Usuario actualizado correctamente.');
          this.router.navigate(['/users']);
        },
        error: () => {
          this.saving = false;
          this.showError('No se pudo actualizar el usuario.');
        },
      });

      return;
    }

    const request: RegisterRequestDTO = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
      roles: formData.roles,
    };

    this.userService.createUser(request).subscribe({
      next: () => {
        this.saving = false;
        this.showSuccess('Usuario creado correctamente.');
        this.router.navigate(['/users']);
      },
      error: () => {
        this.saving = false;
        this.showError('No se pudo crear el usuario.');
      },
    });
  }

  cancel(): void {
    if (this.mode === 'create') {
      this.router.navigate(['/users']);
      return;
    }

    if (this.selectedUser) {
      this.form.patchValue({
        username: this.selectedUser.username,
        email: this.selectedUser.email,
        password: '',
        isActive: this.selectedUser.isActive,
        roles: [...this.selectedUser.roles],
      });
    }

    this.isFormEditable = false;
    this.configureFormState();
  }

  goBack(): void {
    this.router.navigate(['/users']);
  }

  hasRole(roleName: string): boolean {
    return this.form.controls.roles.value.includes(roleName);
  }

  toggleRole(roleName: string, event: Event): void {
    if (!this.isFormEditable) {
      return;
    }

    const checked = (event.target as HTMLInputElement).checked;
    const currentRoles = this.form.controls.roles.value;
    const roles = checked
      ? [...currentRoles, roleName]
      : currentRoles.filter((role) => role !== roleName);

    this.form.controls.roles.setValue(roles);
    this.form.controls.roles.markAsTouched();
  }

  isInvalid(fieldName: UserFormControlName): boolean {
    const control = this.form.controls[fieldName];
    return control.invalid && (control.dirty || control.touched);
  }

  private configureFormState(): void {
    const passwordControl = this.form.controls.password;

    if (this.mode === 'create') {
      passwordControl.setValidators(Validators.required);
    } else {
      passwordControl.clearValidators();
      passwordControl.setValue('');
      passwordControl.disable({ emitEvent: false });
    }

    passwordControl.updateValueAndValidity({ emitEvent: false });

    if (this.isFormEditable) {
      this.form.enable({ emitEvent: false });

      if (this.mode !== 'create') {
        passwordControl.disable({ emitEvent: false });
      }

      return;
    }

    this.form.disable({ emitEvent: false });
  }

  private showSuccess(detail: string): void {
    this.messageService.add({ severity: 'success', summary: 'Listo', detail });
  }

  private showError(detail: string): void {
    this.messageService.add({ severity: 'error', summary: 'Error', detail });
  }
}
