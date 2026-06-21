package nutricentro.dtos.professionalSchedule;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import nutricentro.enums.PersonStatus;

import java.time.DayOfWeek;
import java.time.LocalTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ProfessionalScheduleRequestDTO {
    @NotNull
    private LocalTime startTime;

    @NotNull
    private LocalTime endTime;

    @NotNull
    @Min(15)
    private Integer slotDurationMinutes;

    @NotNull
    private DayOfWeek dayOfWeek;

    @NotNull
    private Long professionalId;

    private PersonStatus status;
}
