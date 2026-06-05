package nutricentro.dtos.professionals;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import nutricentro.enums.GenderType;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ProfessionalRequestDTO {
    private String firstName;
    private String lastName;
    private Integer age;
    private Integer document;
    private String specialty;
    private String tuition;
    private String mobile;
    private GenderType gender;
    private String email;
    private String registration;
    private String state;
}
