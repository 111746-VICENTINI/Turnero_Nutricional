package nutricentro.services.implementation;

import lombok.RequiredArgsConstructor;
import nutricentro.entities.UserEntity;
import nutricentro.repositories.UserRepository;
import nutricentro.services.CurrentUserContext;
import nutricentro.services.CurrentUserProvider;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class SpringSecurityCurrentUserProvider implements CurrentUserProvider {

    private static final String ROLE_PREFIX = "ROLE_";
    private final UserRepository userRepository;

    @Override
    public CurrentUserContext getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getName())) {
            return CurrentUserContext.system();
        }

        String username = authentication.getName();
        Long userId = resolveUserId(authentication, username);
        String role = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .map(this::normalizeRole)
                .sorted()
                .findFirst()
                .orElse("UNKNOWN");

        return new CurrentUserContext(userId, username, role);
    }

    private Long resolveUserId(Authentication authentication, String username) {
        if (authentication instanceof JwtAuthenticationToken jwtAuthentication) {
            Object userId = jwtAuthentication.getTokenAttributes().get("userId");
            Long parsedUserId = parseUserId(userId);
            if (parsedUserId != null) {
                return parsedUserId;
            }
        }

        return userRepository.findByUsernameIgnoreCase(username)
                .map(UserEntity::getId)
                .orElse(null);
    }

    private Long parseUserId(Object userId) {
        if (userId instanceof Number number) {
            return number.longValue();
        }
        if (userId instanceof String text && !text.isBlank()) {
            try {
                return Long.parseLong(text);
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }

    private String normalizeRole(String authority) {
        if (authority != null && authority.startsWith(ROLE_PREFIX)) {
            return authority.substring(ROLE_PREFIX.length());
        }
        return authority;
    }
}
