import {Component, inject, OnInit} from '@angular/core';
import { AvatarModule } from 'primeng/avatar';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { StyleClassModule } from 'primeng/styleclass';
import {NavigationEnd, Router, RouterLink, RouterOutlet} from '@angular/router';
import {AuthService} from '../../core/services/auth-service';
import {CommonModule} from '@angular/common';
import {filter} from 'rxjs';

@Component({
  selector: 'app-drawer',
  standalone: true,
  imports: [CommonModule, RouterOutlet, AvatarModule,
    RouterLink, ButtonModule, RippleModule, StyleClassModule],
  templateUrl: './drawer.html',
  styleUrl: './drawer.css',
})
export class Drawer implements OnInit{
  sidebarExpanded = true;
  sidebarPinned = false;
  openedMenu: string | null = null;

  authService = inject(AuthService);
  router = inject(Router);
  roles = this.authService.roles;
  actualUser = this.authService.getCurrentUser();

  isAdmin() { return this.roles().includes('ADMIN'); }
  isSecretary() { return this.roles().includes('SECRETARY'); }
  isProfessional() { return this.roles().includes('PROFESSIONAL'); }

  ngOnInit() {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        if (!this.sidebarPinned) {
          this.sidebarExpanded = false;
        }
      });
  }

  toggleSidebar(): void {
    this.sidebarPinned = !this.sidebarPinned;
    this.sidebarExpanded = this.sidebarPinned;
  }

  toggleMenu(menu: string): void {
    this.openedMenu =
      this.openedMenu === menu
        ? null
        : menu;
  }

  logout() {
    this.sidebarExpanded = false;
    this.authService.logout();
  }

  getFullName():string {
    return `${this.actualUser?.username}`;
  }
}
