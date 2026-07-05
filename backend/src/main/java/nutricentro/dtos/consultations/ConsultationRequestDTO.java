package nutricentro.dtos.consultations;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ConsultationRequestDTO {
    private Date date;
    private Long professionalId;
    private String reason;
    private String diagnosis;
    private String treatment;
    private String goal;
    private String observations;
    private String nextConsultation;
}
