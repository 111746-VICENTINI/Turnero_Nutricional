package nutricentro.dtos.followup;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import nutricentro.enums.FollowUpStatus;
import nutricentro.enums.NotificationPriority;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PatientFollowUpStatusDTO {
    private Long patientId;
    private String patientFullName;
    private Long professionalId;
    private String professionalFullName;
    private LocalDate lastConsultationDate;
    private Long daysSinceLastConsultation;
    private Long monthsSinceLastConsultation;
    private FollowUpStatus status;
    private NotificationPriority priority;
    private String label;
    private String recommendation;
}
