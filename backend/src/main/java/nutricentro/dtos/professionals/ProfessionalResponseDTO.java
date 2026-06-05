package nutricentro.dtos.professionals;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import nutricentro.enums.GenderType;
import nutricentro.enums.PersonStatus;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ProfessionalResponseDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private Integer age;
    private String mobile;
    private GenderType gender;
    private String email;
    private String state;
    private PersonStatus status;

}
