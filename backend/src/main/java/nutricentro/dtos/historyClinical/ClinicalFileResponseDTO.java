package nutricentro.dtos.historyClinical;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ClinicalFileResponseDTO {
    private Long id;
    private String originalName;
    private String contentType;
    private Long size;
    private String type;
    private String comment;
    private LocalDate date;
    private String professional;
    private Boolean previewable;
    private Long consultationId;
    private Date consultationDate;
    private String consultationStatus;
    private String consultationReason;
    private String consultationProfessionalName;
    private String consultationObservations;
}
