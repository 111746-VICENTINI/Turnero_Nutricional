package nutricentro.dtos.availability;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
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
public class ProfessionalAvailabilityExceptionRequestDTO {
    private Long professionalId;

    @NotNull
    private LocalDate date;

    @NotNull
    private AvailabilityExceptionType type;

    @Min(15)
    private Integer slotDurationMinutes;

    @Min(0)
    private Integer bufferMinutes;

    @Min(1)
    private Integer maxDailyAppointments;

    private Boolean appliesToAllProfessionals;
    private LocalTime startTime;
    private LocalTime endTime;
    private AppointmentModality modality;
    private String locationKey;
    private String reason;
    private PersonStatus status;
}
