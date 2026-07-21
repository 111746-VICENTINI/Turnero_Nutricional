package nutricentro.dtos.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PasswordResetRequestDTO {
    @NotBlank(message = "El email es obligatorio")
    @Email(message = "El formato del email no es valido")
    private String email;
}

