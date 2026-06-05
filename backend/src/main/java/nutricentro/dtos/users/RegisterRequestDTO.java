package nutricentro.dtos.users;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RegisterRequestDTO {
	@NotBlank(message = "Username is required")
	@NotNull(message = "Username is required")
	private String username;

	@Email(message = "Email format is invalid")
	private String email;

	@NotBlank(message = "La contraseña es requerida")
	@NotNull(message = "La contraseña es requerida")
	private String password;

	private Set<String> roles;
}
