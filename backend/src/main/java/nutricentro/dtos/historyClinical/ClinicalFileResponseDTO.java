package nutricentro.dtos.historyClinical;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

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
}
