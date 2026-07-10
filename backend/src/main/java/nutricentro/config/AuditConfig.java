package nutricentro.config;

import lombok.RequiredArgsConstructor;
import nutricentro.repositories.UserRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;

@Configuration
@RequiredArgsConstructor
public class AuditConfig {

    private final UserRepository userRepository;

    @Bean
    public AuditorAware<Long> auditorProvider() {
        return () -> {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return Optional.empty();
            }

            String username = authentication.getName();
            return userRepository.findByUsernameIgnoreCase(username)
                    .map(user -> user.getId());
        };
    }
}
