package nutricentro.dtos.users;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UpdateUserDTO {
    @NotBlank(message = "Username is required")
    @NotNull(message = "Username is required")
    private String username;
    private String email;
    private Boolean isActive;
    private Set<String> roles;
}
