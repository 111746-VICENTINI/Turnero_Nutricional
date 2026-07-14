package nutricentro.dtos.consultations;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import nutricentro.enums.ConsultationStatus;

import java.time.LocalTime;
import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ConsultationRequestDTO {
    private Date date;
    private LocalTime startTime;
    private LocalTime endTime;
    private ConsultationStatus status;
    private Long patientId;
    private Long appointmentId;
    private Long professionalId;
    private String reason;
    private String diagnosis;
    private String treatment;
    private String goal;
    private String evolution;
    private String observations;
    private String indications;
    private String nextConsultation;
}
