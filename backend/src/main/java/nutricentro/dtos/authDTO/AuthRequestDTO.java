package nutricentro.dtos.authDTO;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuthRequestDTO {

    @NotNull(message = "El username es obligatorio")
    @NotBlank(message = "El username es obligatorio")
    private String username;

    @NotNull(message = "El username es obligatorio")
    @NotBlank(message = "El username es obligatorio")
    private String password;
}
