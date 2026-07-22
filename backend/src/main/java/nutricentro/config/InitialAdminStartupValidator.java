package nutricentro.config;

import lombok.RequiredArgsConstructor;
import nutricentro.repositories.UserRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class InitialAdminStartupValidator implements ApplicationRunner {

    private final InitialAdminsProperties properties;
    private final UserRepository userRepository;

    @Value("${app.initial-admins.require-admin-on-startup:true}")
    private boolean requireAdminOnStartup;

    @Override
    public void run(ApplicationArguments args) {
        if (!requireAdminOnStartup || properties.enabled() || userRepository.countAdmins() > 0) {
            return;
        }

        throw new IllegalStateException("""
                No existe ningun usuario ADMIN y el bootstrap inicial esta deshabilitado.
                Configure INITIAL_ADMINS_ENABLED=true, INITIAL_ADMIN_PRIMARY_EMAIL y las credenciales Gmail API
                para crear los administradores iniciales con token FIRST_LOGIN, o restaure una base con un ADMIN valido.
                """);
    }
}
