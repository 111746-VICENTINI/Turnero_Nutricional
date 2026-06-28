package nutricentro.dtos.appointments;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import nutricentro.enums.AppointmentStatus;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AppointmentUpdateDTO {
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate date;
    private LocalTime time;
    private AppointmentStatus status;
    private String reason;
    private Long patientId;
    private Long professionalId;
    private Long secretaryId;
}
