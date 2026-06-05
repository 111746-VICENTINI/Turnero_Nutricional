import {Component, inject} from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { RippleModule } from 'primeng/ripple';
import { StyleClassModule } from 'primeng/styleclass';
import {RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {AuthService} from '../../core/services/auth-service';
import {CommonModule} from '@angular/common';

@Component({
  selector: 'app-drawer',
  standalone: true,
  imports: [CommonModule, RouterOutlet, AvatarModule,
    RouterLink,
    RouterLinkActive,
    ButtonModule, DrawerModule, RippleModule, StyleClassModule],
  templateUrl: './drawer.html',
  styleUrl: './drawer.css',
})
export class Drawer {
  visible = false;

  authService = inject(AuthService);
  roles = this.authService.roles;

  isAdmin() { return this.roles().includes('ADMIN'); }
  isSecretary() { return this.roles().includes('SECRETARY'); }
  isProfessional() { return this.roles().includes('PROFESSIONAL'); }

  logout() {
    this.visible = false;
    this.authService.logout();
  }
}
