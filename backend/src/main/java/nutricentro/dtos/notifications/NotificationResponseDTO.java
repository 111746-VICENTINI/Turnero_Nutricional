package nutricentro.dtos.notifications;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import nutricentro.enums.NotificationPriority;
import nutricentro.enums.NotificationType;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class NotificationResponseDTO {
    private String key;
    private NotificationType type;
    private String title;
    private String message;
    private String icon;
    private NotificationPriority priority;
    private boolean read;
    private Long patientId;
    private String patientFullName;
    private Long professionalId;
    private String professionalFullName;
    private LocalDate lastConsultationDate;
    private Long daysSinceLastConsultation;
    private Long monthsSinceLastConsultation;
    private String actionRoute;
}
