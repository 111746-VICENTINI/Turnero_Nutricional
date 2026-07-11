import {CommonModule} from '@angular/common';
import {Component, inject, OnInit} from '@angular/core';
import {NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {filter} from 'rxjs';
import {AvatarModule} from 'primeng/avatar';
import {ButtonModule} from 'primeng/button';
import {RippleModule} from 'primeng/ripple';
import {StyleClassModule} from 'primeng/styleclass';
import {AuthService} from '../../core/services/auth-service';

interface NavigationItem {
  label: string;
  icon: string;
  route: string;
  roles: string[];
}

@Component({
  selector: 'app-drawer',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    AvatarModule,
    RouterLink,
    RouterLinkActive,
    ButtonModule,
    RippleModule,
    StyleClassModule
  ],
  templateUrl: './drawer.html',
  styleUrl: './drawer.css',
})
export class Drawer implements OnInit {
  sidebarExpanded = false;
  sidebarVisible = true;

  private readonly authService = inject(AuthService);
  readonly router = inject(Router);
  readonly roles = this.authService.roles;
  readonly actualUser = this.authService.getCurrentUser();

  readonly navigationItems: NavigationItem[] = [
    {label: 'Inicio', icon: 'pi pi-chart-line', route: '/dashboard', roles: ['ADMIN']},
    {label: 'Agenda', icon: 'pi pi-calendar-clock', route: '/agenda', roles: ['ADMIN', 'SECRETARY']},
    {label: 'Mi Día', icon: 'pi pi-sun', route: '/mi-dia', roles: ['PROFESSIONAL']},
    {label: 'Pacientes', icon: 'pi pi-user', route: '/patient', roles: ['ADMIN', 'SECRETARY', 'PROFESSIONAL']},
    {label: 'Profesionales', icon: 'pi pi-id-card', route: '/professional', roles: ['ADMIN']},
    {label: 'Disponibilidad', icon: 'pi pi-calendar-plus', route: '/availability', roles: ['ADMIN', 'PROFESSIONAL']},
    {label: 'Usuarios', icon: 'pi pi-users', route: '/users', roles: ['ADMIN']},
    {label: 'Configuración', icon: 'pi pi-cog', route: '/specialty', roles: ['ADMIN']}
  ];

  ngOnInit(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.sidebarExpanded = false;
      });
  }

  get visibleNavigationItems(): NavigationItem[] {
    return this.navigationItems.filter(item => item.roles.some(role => this.roles().includes(role)));
  }

  get currentSection(): string {
    const url = this.router.url;
    const match = this.navigationItems
      .filter(item => url === item.route || url.startsWith(`${item.route}/`))
      .sort((first, second) => second.route.length - first.route.length)[0];

    return match?.label ?? 'Nutri Centro';
  }

  toggleSidebar(): void {
    this.sidebarVisible = !this.sidebarVisible;

    if (!this.sidebarVisible) {
      this.sidebarExpanded = false;
    }
  }

  logout(): void {
    this.sidebarExpanded = false;
    this.authService.logout();
  }

  getFullName(): string {
    return `${this.actualUser?.username ?? 'usuario'}`;
  }
}
