package nutricentro.dtos.historyClinical;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import nutricentro.dtos.anthropometry.AntropometryResponseDTO;
import nutricentro.dtos.consultations.ConsultationResponseDTO;
import nutricentro.dtos.laboratory.LaboratoryResponseDTO;
import nutricentro.dtos.patients.PatientResponseDTO;

import java.util.Date;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class MedicalHistoryResponseDTO {
    private Long id;
    private Date consultationDate;
    private String consultationReason;
    private String observations;
    private Long patientId;
    private PatientResponseDTO patient;
    private Long professionalId;
    private NutritionalDataDTO nutritionalData;
    private ClinicalDataDTO clinicalData;
    private List<LaboratoryResponseDTO> laboratories;
    private List<AntropometryResponseDTO> anthropometries;
    private List<ConsultationResponseDTO> consultations;
    private List<FoodPlanResponseDTO> foodPlans;
    private List<ClinicalFileResponseDTO> files;
}
