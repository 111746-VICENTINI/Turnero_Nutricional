package nutricentro.services;

import nutricentro.entities.UserEntity;
import org.springframework.security.core.userdetails.UserDetails;

public interface JwtService {
	String generateToken(UserEntity user);

	String extractUsername(String token);

	boolean isTokenValid(String token, UserDetails userDetails);
}
