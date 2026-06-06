package nutricentro.dtos.patients;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import nutricentro.enums.GenderType;
import nutricentro.enums.PersonStatus;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PatientRequestDTO {
    @NotBlank(message = "El nombre es obligatorio")
    @NotNull(message = "El nombre es obligatorio")
    private String firstName;

    @NotBlank(message = "El apellido es obligatorio")
    @NotNull(message = "El apellido es obligatorio")
    private String lastName;

    @NotNull(message = "El dni es obligatorio")
    private Integer document;

    @Email(message = "El formato email no es válido")
    private String email;

    @NotNull(message = "La fecha de nacimiento es obligatoria")
    private LocalDate birthDate;

    @NotNull(message = "El género es obligatorio")
    private GenderType gender;

    private PersonStatus status;

    private String mobile;
    private String address;
}
