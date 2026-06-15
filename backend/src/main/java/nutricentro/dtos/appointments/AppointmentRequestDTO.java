package nutricentro.dtos.appointments;

import jakarta.validation.constraints.NotNull;
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
public class AppointmentRequestDTO {
    @NotNull(message = "La fecha del turno es obligatoria")
    private LocalDate date;

    @NotNull(message = "La hora del turno es obligatoria")
    private LocalTime time;

    private AppointmentStatus status;
    private String reason;

    @NotNull(message = "El paciente es obligatorio")
    private Long patientId;

    @NotNull(message = "El profesional es obligatorio")
    private Long professionalId;

    private Long secretaryId;
}
