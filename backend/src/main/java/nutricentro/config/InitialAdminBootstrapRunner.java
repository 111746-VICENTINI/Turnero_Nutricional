package nutricentro.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nutricentro.entities.RoleEntity;
import nutricentro.entities.UserEntity;
import nutricentro.repositories.RoleRepository;
import nutricentro.repositories.UserRepository;
import nutricentro.services.AuthService;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.Locale;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.initial-admins", name = "enabled", havingValue = "true")
public class InitialAdminBootstrapRunner implements ApplicationRunner {

    private static final String ADMIN_ROLE = "ADMIN";

    private final InitialAdminsProperties properties;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthService authService;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!properties.enabled()) {
            return;
        }

        if (userRepository.countAdmins() > 0) {
            log.info("Bootstrap de administradores omitido porque ya existe al menos un usuario ADMIN");
            return;
        }

        String primaryEmail = requiredEmail(properties.primaryEmail(), "INITIAL_ADMIN_PRIMARY_EMAIL");
        String secondaryEmail = optionalEmail(properties.secondaryEmail());
        if (StringUtils.hasText(secondaryEmail) && primaryEmail.equals(secondaryEmail)) {
            throw new IllegalStateException("Los emails de administradores iniciales no pueden repetirse");
        }

        RoleEntity adminRole = roleRepository.findByNameIgnoreCase(ADMIN_ROLE)
                .orElseGet(() -> roleRepository.save(buildAdminRole()));

        createPendingAdmin(primaryEmail, adminRole);
        if (StringUtils.hasText(secondaryEmail)) {
            createPendingAdmin(secondaryEmail, adminRole);
        }
    }

    private UserEntity createPendingAdmin(String email, RoleEntity adminRole) {
        UserEntity user = new UserEntity();
        user.setUsername(generateUsername(email, null));
        user.setEmail(email);
        user.setPasswordHash(generateTechnicalPasswordHash());
        user.setPasswordConfigured(false);
        user.setIsActive(true);
        user.getRoles().add(adminRole);

        UserEntity saved = userRepository.save(user);
        sendInitialInvitation(saved);
        return saved;
    }

    private void sendInitialInvitation(UserEntity user) {
        authService.sendCreatePasswordInvitation(user);
    }

    private String generateUsername(String email, Long currentUserId) {
        String localPart = email.substring(0, email.indexOf('@'));
        String sanitized = localPart.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "_")
                .replaceAll("^_+|_+$", "");
        if (!StringUtils.hasText(sanitized)) {
            sanitized = "user";
        }
        return generateUniqueUsername("initial_admin_" + sanitized, currentUserId);
    }

    private String generateUniqueUsername(String base, Long currentUserId) {
        String candidate = base;
        int suffix = 2;
        while (usernameExistsForAnotherUser(candidate, currentUserId)) {
            candidate = base + "_" + suffix++;
        }
        return candidate;
    }

    private boolean usernameExistsForAnotherUser(String username, Long currentUserId) {
        return currentUserId == null
                ? userRepository.existsByUsernameIgnoreCase(username)
                : userRepository.existsByUsernameIgnoreCaseAndIdNot(username, currentUserId);
    }

    private String generateTechnicalPasswordHash() {
        byte[] randomBytes = new byte[32];
        new SecureRandom().nextBytes(randomBytes);
        return passwordEncoder.encode(Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes));
    }

    private String requiredEmail(String value, String envName) {
        if (!StringUtils.hasText(value)) {
            throw new IllegalStateException(envName + " debe estar configurado cuando app.initial-admins.enabled=true");
        }
        return value.trim().toLowerCase(Locale.ROOT);
    }

    private String optionalEmail(String value) {
        if (!StringUtils.hasText(value)) {
            return "";
        }
        return value.trim().toLowerCase(Locale.ROOT);
    }

    private RoleEntity buildAdminRole() {
        RoleEntity role = new RoleEntity();
        role.setName(ADMIN_ROLE);
        role.setDescription("Administrador del sistema");
        role.setHierarchy(0);
        return role;
    }
}
