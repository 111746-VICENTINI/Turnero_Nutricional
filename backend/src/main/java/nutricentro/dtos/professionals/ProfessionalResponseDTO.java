package nutricentro.dtos.professionals;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import nutricentro.dtos.specialties.SpecialtyOnlyNameDTO;
import nutricentro.enums.GenderType;
import nutricentro.enums.PersonStatus;

import java.time.LocalDate;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ProfessionalResponseDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private Integer age;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate birthDate;
    private String mobile;
    private GenderType gender;
    private String email;
    private String state;
    private Integer document;
    private String tuition;
    private String registration;
    private PersonStatus status;
    private List<SpecialtyOnlyNameDTO> specialties;
}
