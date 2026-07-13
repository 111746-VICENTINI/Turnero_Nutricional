package nutricentro.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.util.Optional;

@Configuration
@RequiredArgsConstructor
public class AuditConfig {

    @Bean
    public AuditorAware<Long> auditorProvider() {
        return () -> {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null
                    || !authentication.isAuthenticated()
                    || "anonymousUser".equals(authentication.getName())) {
                return Optional.empty();
            }

            if (authentication instanceof JwtAuthenticationToken jwtAuthentication) {
                Object userId = jwtAuthentication.getTokenAttributes().get("userId");
                return parseUserId(userId);
            }

            return Optional.empty();
        };
    }

    private Optional<Long> parseUserId(Object userId) {
        if (userId instanceof Number number) {
            return Optional.of(number.longValue());
        }
        if (userId instanceof String text && !text.isBlank()) {
            try {
                return Optional.of(Long.parseLong(text));
            } catch (NumberFormatException ignored) {
                return Optional.empty();
            }
        }
        return Optional.empty();
    }
}
