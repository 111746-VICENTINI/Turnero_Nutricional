package nutricentro.dtos.appointments;

import lombok.Builder;
import lombok.Data;
import nutricentro.enums.AppointmentEventType;
import nutricentro.enums.AppointmentStatus;

import java.time.LocalDateTime;

@Data
@Builder
public class AppointmentTimelineEventResponseDTO {
    private Long id;
    private Long appointmentId;
    private LocalDateTime occurredAt;
    private Long responsibleUserId;
    private String responsibleUsername;
    private String responsibleRole;
    private AppointmentEventType eventType;
    private AppointmentStatus previousStatus;
    private AppointmentStatus newStatus;
    private String reason;
    private String observations;
    private Boolean notificationRequested;
    private LocalDateTime notificationRequestedAt;
}
