package nutricentro.dtos.professionals;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import nutricentro.enums.GenderType;
import nutricentro.enums.PersonStatus;

import java.time.LocalDate;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ProfessionalRequestDTO {
    @NotBlank(message = "El nombre es obligatorio")
    @NotNull(message = "El nombre es obligatorio")
    private String firstName;

    @NotBlank(message = "El apellido es obligatorio")
    @NotNull(message = "El apellido es obligatorio")
    private String lastName;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate birthDate;

    @NotNull(message = "El dni es obligatorio")
    private Integer document;

    @NotEmpty(message = "La especialidad es obligatoria")
    private List<Long> specialtyIds;

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
