package nutricentro.dtos.patients;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import nutricentro.enums.GenderType;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PatientRequestDTO {

    private String firstName;
    private String lastName;
    private Integer document;
    private String email;
    private String mobile;
    private String address;
//    private String birthDate;
    private Integer age;
    private GenderType gender;
}
