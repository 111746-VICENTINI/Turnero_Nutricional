import {CommonModule} from '@angular/common';
import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet} from '@angular/router';
import {filter, interval, Subject, takeUntil} from 'rxjs';
import {ConfirmationService} from 'primeng/api';
import {AvatarModule} from 'primeng/avatar';
import {ButtonModule} from 'primeng/button';
import {ConfirmDialogModule} from 'primeng/confirmdialog';
import {Popover} from 'primeng/popover';
import {RippleModule} from 'primeng/ripple';
import {StyleClassModule} from 'primeng/styleclass';
import {AuthService} from '../../core/services/auth-service';
import {NotificationResponseDTO} from '../../core/models/notification-model';
import {NotificationService} from '../../core/services/notification-service';
import {NotificationsPanel} from '../../shared/components/notifications/notifications-panel';
import {NavigationItem} from './drawer-model';

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
    ConfirmDialogModule,
    Popover,
    RippleModule,
    StyleClassModule,
    NotificationsPanel
  ],
  templateUrl: './drawer.html',
  styleUrl: './drawer.css',
  providers: [ConfirmationService],
})
export class Drawer implements OnInit, OnDestroy {
  sidebarExpanded = false;
  sidebarVisible = true;

  private readonly authService = inject(AuthService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly notificationService = inject(NotificationService);
  readonly router = inject(Router);
  readonly roles = this.authService.roles;
  readonly actualUser = this.authService.getCurrentUser();
  notifications: NotificationResponseDTO[] = [];
  notificationsLoading = false;
  unreadNotificationsCount = 0;
  private readonly destroy$ = new Subject<void>();

  readonly navigationItems: NavigationItem[] = [
    {label: 'Inicio', icon: 'pi pi-chart-line', route: '/dashboard', roles: ['ADMIN']},
    {label: 'Agenda', icon: 'pi pi-calendar-clock', route: '/agenda', roles: ['ADMIN', 'SECRETARY']},
    {label: 'Mi Día', icon: 'pi pi-sun', route: '/mi-dia', roles: ['PROFESSIONAL']},
    {label: 'Pacientes', icon: 'pi pi-user', route: '/patient', roles: ['ADMIN', 'SECRETARY', 'PROFESSIONAL']},
    {label: 'Profesionales', icon: 'pi pi-id-card', route: '/professional', roles: ['ADMIN']},
    {label: 'Disponibilidad', icon: 'pi pi-calendar-plus', route: '/availability', roles: ['ADMIN', 'PROFESSIONAL']},
    {label: 'Usuarios', icon: 'pi pi-users', route: '/users', roles: ['ADMIN']},
    {label: 'Cuenta', icon: 'pi pi-key', route: '/change-password', roles: ['ADMIN', 'SECRETARY', 'PROFESSIONAL']},
    {label: 'Configuración', icon: 'pi pi-cog', route: '/specialty', roles: ['ADMIN']}
  ];

  ngOnInit(): void {
    if (this.canSeeNotifications) {
      this.loadNotifications();
      interval(60000)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => this.refreshNotificationsSummary());
    }

    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.sidebarExpanded = false;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get visibleNavigationItems(): NavigationItem[] {
    return this.navigationItems.filter(item => item.roles.some(role => this.roles().includes(role)));
  }

  get canSeeNotifications(): boolean {
    return this.roles().some(role => ['ADMIN', 'PROFESSIONAL'].includes(role));
  }

  get notificationBadgeLabel(): string {
    return this.unreadNotificationsCount > 9 ? '9+' : String(this.unreadNotificationsCount);
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
    this.confirmationService.confirm({
      message: '¿Está seguro que desea cerrar sesión?',
      header: 'Cerrar sesión',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Cerrar sesión',
      rejectLabel: 'Volver',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.sidebarExpanded = false;
        this.authService.logout();
      }
    });
  }

  toggleNotifications(event: Event, popover: Popover): void {
    popover.toggle(event);
    this.loadNotifications();
  }

  loadNotifications(): void {
    if (!this.canSeeNotifications || this.notificationsLoading) {
      return;
    }

    this.notificationsLoading = true;
    this.notificationService.getNotifications().subscribe({
      next: (notifications) => {
        this.notifications = notifications;
        this.syncUnreadCountFromList();
        this.notificationsLoading = false;
      },
      error: () => {
        this.notifications = [];
        this.unreadNotificationsCount = 0;
        this.notificationsLoading = false;
      }
    });
  }

  refreshNotificationsSummary(): void {
    if (!this.canSeeNotifications) {
      return;
    }

    this.notificationService.getSummary().subscribe({
      next: (summary) => this.unreadNotificationsCount = summary.unreadCount,
    });
  }

  markAsRead(notification: NotificationResponseDTO): void {
    if (notification.read) {
      return;
    }

    this.notificationService.markAsRead(notification.key).subscribe({
      next: () => {
        notification.read = true;
        this.syncUnreadCountFromList();
      }
    });
  }

  markAllAsRead(): void {
    if (!this.unreadNotificationsCount) {
      return;
    }

    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications = this.notifications.map(notification => ({
          ...notification,
          read: true
        }));
        this.unreadNotificationsCount = 0;
      }
    });
  }

  openPatient(notification: NotificationResponseDTO, popover: Popover): void {
    this.markAsRead(notification);
    popover.hide();
    this.router.navigate([notification.actionRoute || `/medical-history/${notification.patientId}`]);
  }

  getFullName(): string {
    return `${this.actualUser?.username ?? 'usuario'}`;
  }

  private syncUnreadCountFromList(): void {
    this.unreadNotificationsCount = this.notifications.filter(notification => !notification.read).length;
  }
}
