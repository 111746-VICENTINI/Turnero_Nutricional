package nutricentro.dtos.professionalSchedule;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ProfessionalScheduleBreakResponseDTO {
    private Long id;
    private LocalTime startTime;
    private LocalTime endTime;
}
