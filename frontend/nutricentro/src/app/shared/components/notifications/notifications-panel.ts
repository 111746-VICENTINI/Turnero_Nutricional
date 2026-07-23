import {CommonModule} from '@angular/common';
import {Component, EventEmitter, Input, Output} from '@angular/core';
import {NotificationResponseDTO} from '../../../core/models/notification-model';
import {NotificationPriority} from '../../../core/models/follow-up-model';

@Component({
  selector: 'app-notifications-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications-panel.html',
  styleUrl: './notifications-panel.css'
})
export class NotificationsPanel {
  @Input() notifications: NotificationResponseDTO[] = [];
  @Input() loading = false;
  @Input() unreadCount = 0;

  @Output() markAllAsRead = new EventEmitter<void>();
  @Output() markAsRead = new EventEmitter<NotificationResponseDTO>();
  @Output() openPatient = new EventEmitter<NotificationResponseDTO>();

  priorityClass(priority: NotificationPriority): string {
    return `priority-${priority.toLowerCase()}`;
  }

  priorityLabel(priority: NotificationPriority): string {
    const labels: Record<NotificationPriority, string> = {
      LOW: 'Baja',
      MEDIUM: 'Media',
      HIGH: 'Alta',
      CRITICAL: 'Crítica'
    };
    return labels[priority];
  }

  inactivityText(notification: NotificationResponseDTO): string {
    const months = notification.monthsSinceLastConsultation ?? 0;
    if (months >= 12) {
      return 'Más de 1 año';
    }
    if (months > 0) {
      return `${months} meses`;
    }
    const days = notification.daysSinceLastConsultation ?? 0;
    return `${days} días`;
  }

  formatDate(value: string | null | undefined): string {
    if (!value) {
      return '-';
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? value
      : new Intl.DateTimeFormat('es-AR').format(date);
  }
}
