package nutricentro.dtos.professionalSchedule;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ProfessionalScheduleBreakRequestDTO {
    @NotNull
    private LocalTime startTime;

    @NotNull
    private LocalTime endTime;
}
