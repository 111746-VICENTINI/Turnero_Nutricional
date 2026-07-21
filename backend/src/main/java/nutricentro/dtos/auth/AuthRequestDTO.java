package nutricentro.dtos.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Email;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuthRequestDTO {

    @NotNull(message = "El email es obligatorio")
    @NotBlank(message = "El email es obligatorio")
    @Email(message = "El formato del email no es valido")
    private String email;

    @NotNull(message = "La contraseña es obligatoria")
    @NotBlank(message = "La contraseña es obligatoria")
    private String password;
}
