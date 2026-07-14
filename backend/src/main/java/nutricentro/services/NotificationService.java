package nutricentro.services;

import nutricentro.dtos.notifications.NotificationResponseDTO;
import nutricentro.dtos.notifications.NotificationSummaryDTO;

import java.util.List;

public interface NotificationService {
    List<NotificationResponseDTO> getNotifications();
    NotificationSummaryDTO getSummary();
    void markAsRead(String notificationKey);
    void markAllAsRead();
}
