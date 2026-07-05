package nutricentro.dtos.historyClinical;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class MedicalHistoryRequestDTO {
    private Long patientId;
    private Long professionalId;
    private Date consultationDate;
    private String consultationReason;
    private String observations;
}
