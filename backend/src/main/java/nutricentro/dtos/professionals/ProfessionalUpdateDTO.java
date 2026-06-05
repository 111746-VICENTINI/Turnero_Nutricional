package nutricentro.dtos.professionals;

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
public class ProfessionalUpdateDTO {

    @NotBlank(message = "El nombre es obligatorio")
    @NotNull(message = "El nombre es obligatorio")
    private String firstName;

    @NotBlank(message = "El apellido es obligatorio")
    @NotNull(message = "El apellido es obligatorio")
    private String lastName;

    @NotNull(message = "La fecha de nacimiento es obligatoria")
    private LocalDate birthDate;

    @NotNull(message = "El dni es obligatorio")
    private Integer document;

    @NotBlank(message = "La especialidad es obligatoria")
    @NotNull(message = "La especialidad es obligatoria")
    private String specialty;

    @NotBlank(message = "La matricula es obligatoria")
    @NotNull(message = "La matricula es obligatoria")
    private String tuition;

    @Email(message = "El formato email no es válido")
    private String email;

    private String mobile;
    private GenderType gender;
    private String registration;
    private PersonStatus status;
}
