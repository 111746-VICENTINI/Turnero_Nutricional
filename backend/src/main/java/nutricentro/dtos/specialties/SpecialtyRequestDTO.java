package nutricentro.dtos.specialties;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SpecialtyRequestDTO {

    @NotBlank(message = "El nombre de la especialidad es obligatoria")
    @NotNull(message = "El nombre de la especialidad es obligatoria")
    private String name;
    private String description;
    private Boolean isActive;
}
