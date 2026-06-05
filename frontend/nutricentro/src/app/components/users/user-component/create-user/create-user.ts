import {Component, EventEmitter, inject, OnInit, Output} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MultiSelectModule } from 'primeng/multiselect';
import { ButtonModule } from 'primeng/button';
import {UserService} from '../../../../core/services/user-service';
import {RoleService} from '../../../../core/services/role-service';
import {RoleResponseDTO} from '../../../../core/model/login-model';

@Component({
  selector: 'app-create-user',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    PasswordModule,
    MultiSelectModule,
    ButtonModule
  ],
  templateUrl: './create-user.html',
  styleUrl: './create-user.css',
})
export class CreateUser implements OnInit {
  @Output()
  userCreated = new EventEmitter<void>();
  roles: RoleResponseDTO[] = [];

  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private roleService = inject(RoleService);

  form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    roles: [[] as string[]]
  });

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.roleService.getRoles().subscribe({
      next: roles => this.roles = roles
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.userService.createUser(this.form.getRawValue())
      .subscribe({
        next: user => {
          console.log('Usuario creado', user);
          this.userCreated.emit();
          this.form.reset();
        },
        error: err => {
          console.error(err);
        }
      });
  }
}
