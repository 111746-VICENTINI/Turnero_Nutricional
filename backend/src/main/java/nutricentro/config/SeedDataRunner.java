package nutricentro.config;

import nutricentro.entities.RoleEntity;
import nutricentro.entities.UserEntity;
import nutricentro.repositories.RoleRepository;
import nutricentro.repositories.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
public class SeedDataRunner implements CommandLineRunner {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public SeedDataRunner(RoleRepository roleRepository, UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        RoleEntity adminRole = roleRepository.findByNameIgnoreCase("ADMIN")
                .orElseGet(() -> roleRepository.save(buildRole("ADMIN", "Administrador del sistema", 0)));
        RoleEntity secretaryRole = roleRepository.findByNameIgnoreCase("SECRETARY")
                .orElseGet(() -> roleRepository.save(buildRole("SECRETARY", "Secretaria", 1)));
        RoleEntity professionalRole = roleRepository.findByNameIgnoreCase("PROFESSIONAL")
                .orElseGet(() -> roleRepository.save(buildRole("PROFESSIONAL", "Profesional", 2)));

        userRepository.findByUsernameIgnoreCase("admin").ifPresent(admin -> {
            if (!Boolean.TRUE.equals(admin.getIsActive())) {
                admin.setIsActive(true);
                userRepository.save(admin);
            }
        });

        if (userRepository.count() == 0) {
            UserEntity admin = new UserEntity();
            admin.setUsername("admin");
            admin.setEmail("admin@admin");
            admin.setPasswordHash(passwordEncoder.encode("admin123"));
            admin.setIsActive(true);
            admin.setRoles(Set.of(adminRole));
            userRepository.save(admin);
        }
    }

    private RoleEntity buildRole(String name, String description, int hierarchy) {
        RoleEntity role = new RoleEntity();
        role.setName(name);
        role.setDescription(description);
        role.setHierarchy(hierarchy);
        return role;
    }
}

