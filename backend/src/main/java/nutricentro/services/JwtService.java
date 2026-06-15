package nutricentro.services;

import nutricentro.entities.UserEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

@Service
public interface JwtService {
	String generateToken(UserEntity user);

	String extractUsername(String token);

	boolean isTokenValid(String token, UserDetails userDetails);
}
