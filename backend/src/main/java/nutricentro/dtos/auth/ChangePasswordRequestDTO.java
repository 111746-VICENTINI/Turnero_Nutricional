package nutricentro.dtos.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ChangePasswordRequestDTO {
    @NotBlank(message = "La contraseña actual es obligatoria")
    private String currentPassword;

    @NotBlank(message = "La nueva contraseña es obligatoria")
    private String newPassword;

    @NotBlank(message = "La confirmacion es obligatoria")
    private String confirmPassword;
}
