import {Component, inject, OnInit} from '@angular/core';
import {TableModule} from 'primeng/table';
import {UserResponseDTO} from '../../../../core/model/login-model';
import {UserService} from '../../../../core/services/user-service';
import {Button} from 'primeng/button';
import {TagModule} from 'primeng/tag';
import {ConfirmDialogModule} from 'primeng/confirmdialog';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [TableModule, Button, TagModule, ConfirmDialogModule],
  templateUrl: './users-list.html',
  styleUrl: './users-list.css',
})
export class UsersList implements OnInit {
  users: UserResponseDTO[] = [];

  private userService = inject(UserService);

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: users => this.users = users
    });
  }

  deleteUser(user: UserResponseDTO): void {
    if (!confirm(`¿Desactivar usuario ${user.username}?`)) {
      return;
    }

    this.userService.deleteUser(Number(user.id))
      .subscribe({
        next: () => this.loadUsers()
      });
  }
}
