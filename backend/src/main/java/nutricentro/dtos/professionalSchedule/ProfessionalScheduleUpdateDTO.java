package nutricentro.dtos.professionalSchedule;

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
public class ProfessionalScheduleUpdateDTO {
    private LocalTime startTime;
    private LocalTime endTime;
    private Integer slotDurationMinutes;
    private DayOfWeek dayOfWeek;
    private PersonStatus status;
}
