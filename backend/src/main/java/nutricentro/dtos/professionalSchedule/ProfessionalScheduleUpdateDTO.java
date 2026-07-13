package nutricentro.dtos.professionalSchedule;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import nutricentro.enums.AppointmentModality;
import nutricentro.enums.PersonStatus;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ProfessionalScheduleUpdateDTO {
    private LocalTime startTime;
    private LocalTime endTime;
    private Integer slotDurationMinutes;
    private Integer bufferMinutes;
    private Integer maxDailyAppointments;
    private AppointmentModality modality;
    private String locationKey;
    private List<ProfessionalScheduleBreakRequestDTO> breaks;
    private DayOfWeek dayOfWeek;
    private PersonStatus status;
}
