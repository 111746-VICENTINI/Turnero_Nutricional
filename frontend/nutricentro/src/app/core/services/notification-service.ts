import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../enviroment/enviroment';
import { NotificationResponseDTO, NotificationSummaryDTO } from '../models/notification-model';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/notifications`;

  getNotifications() {
    return this.http.get<NotificationResponseDTO[]>(this.apiUrl);
  }

  getSummary() {
    return this.http.get<NotificationSummaryDTO>(`${this.apiUrl}/summary`);
  }

  markAsRead(notificationKey: string) {
    return this.http.patch<void>(`${this.apiUrl}/${encodeURIComponent(notificationKey)}/read`, {});
  }

  markAllAsRead() {
    return this.http.patch<void>(`${this.apiUrl}/read-all`, {});
  }
}
