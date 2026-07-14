package nutricentro.controllers;

import lombok.RequiredArgsConstructor;
import nutricentro.dtos.notifications.NotificationResponseDTO;
import nutricentro.dtos.notifications.NotificationSummaryDTO;
import nutricentro.services.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@CrossOrigin(origins = "${app.cors.allowed-origins:*}")
@PreAuthorize("hasAnyRole('ADMIN', 'PROFESSIONAL')")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<NotificationResponseDTO>> getNotifications() {
        return ResponseEntity.ok(notificationService.getNotifications());
    }

    @GetMapping("/summary")
    public ResponseEntity<NotificationSummaryDTO> getSummary() {
        return ResponseEntity.ok(notificationService.getSummary());
    }

    @PatchMapping("/{notificationKey}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable String notificationKey) {
        notificationService.markAsRead(notificationKey);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead() {
        notificationService.markAllAsRead();
        return ResponseEntity.noContent().build();
    }
}
