package nutricentro.services;

import nutricentro.dtos.notifications.NotificationResponseDTO;
import nutricentro.dtos.notifications.NotificationSummaryDTO;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public interface NotificationService {
    List<NotificationResponseDTO> getNotifications();
    NotificationSummaryDTO getSummary();
    void markAsRead(String notificationKey);
    void markAllAsRead();
}
