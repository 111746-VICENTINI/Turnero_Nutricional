import {Component, inject} from '@angular/core';
import {AuthService} from '../../../core/services/auth-service';

@Component({
  selector: 'app-list-patients',
  standalone: true,
  imports: [],
  templateUrl: './list-patients.html',
  styleUrl: './list-patients.css',
})
export class ListPatients {
  authService = inject(AuthService);
  roles = this.authService.roles;

  isAdmin() {
    return this.roles().includes('ADMIN');
  }
}
