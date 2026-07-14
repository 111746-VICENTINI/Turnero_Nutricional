package nutricentro.dtos.availability;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import nutricentro.enums.AppointmentModality;
import nutricentro.enums.AvailabilityExceptionType;
import nutricentro.enums.PersonStatus;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ProfessionalAvailabilityExceptionResponseDTO {
    private Long id;
    private Long professionalId;
    private Boolean appliesToAllProfessionals;
    private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;
    private AvailabilityExceptionType type;
    private Integer slotDurationMinutes;
    private Integer bufferMinutes;
    private Integer maxDailyAppointments;
    private AppointmentModality modality;
    private String locationKey;
    private String reason;
    private PersonStatus status;
}
