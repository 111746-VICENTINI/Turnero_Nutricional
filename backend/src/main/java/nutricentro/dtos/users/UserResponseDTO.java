package nutricentro.dtos.users;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserResponseDTO {
	private Long id;
	private String username;
	private String email;
	private Boolean isActive;
	private Boolean passwordConfigured;
	private Boolean acceptedTerms;
	private LocalDateTime acceptedTermsAt;
	private Set<String> roles;
}
