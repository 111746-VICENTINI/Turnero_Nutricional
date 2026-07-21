package nutricentro.services.implementation;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import nutricentro.config.JwtProperties;
import nutricentro.entities.RoleEntity;
import nutricentro.entities.UserEntity;
import nutricentro.services.JwtService;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import javax.crypto.SecretKey;

@Service
@RequiredArgsConstructor
public class JwtServiceImpl implements JwtService {

    private final JwtProperties jwtProperties;

    @Override
    public String generateToken(UserEntity user) {
        Instant now = Instant.now();
        Instant expiration = now.plusMillis(jwtProperties.expiration());
        List<String> roles = user.getRoles().stream()
                .map(RoleEntity::getName)
                .toList();

        return Jwts.builder()
                .subject(user.getUsername())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiration))
                .claim("userId", user.getId())
                .claim("roles", roles)
                .signWith(getSigningKey(), Jwts.SIG.HS256)
                .compact();
    }

    @Override
    public String extractUsername(String token) {
        return extractAllClaims(token).getSubject();
    }

    @Override
    public boolean isTokenValid(String token, UserDetails userDetails) {
        String username = extractUsername(token);
        return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractAllClaims(token).getExpiration().before(new Date());
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(Keys.hmacShaKeyFor(getSecretBytes()))
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(getSecretBytes());
    }

    private byte[] getSecretBytes() {
        String secret = jwtProperties.secret();
        if (secret == null || secret.length() < 32) {
            throw new IllegalStateException("JWT secret must be at least 32 characters long");
        }
        return secret.getBytes(StandardCharsets.UTF_8);
    }
}


