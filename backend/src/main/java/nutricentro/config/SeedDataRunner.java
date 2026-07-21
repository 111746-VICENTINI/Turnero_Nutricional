package nutricentro.config;

import nutricentro.entities.RoleEntity;
import nutricentro.repositories.RoleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile({"dev", "test"})
public class SeedDataRunner implements CommandLineRunner {

    private final RoleRepository roleRepository;

    public SeedDataRunner(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    @Override
    public void run(String... args) {
        roleRepository.findByNameIgnoreCase("ADMIN")
                .orElseGet(() -> roleRepository.save(buildRole("ADMIN", "Administrador del sistema", 0)));
        roleRepository.findByNameIgnoreCase("SECRETARY")
                .orElseGet(() -> roleRepository.save(buildRole("SECRETARY", "Secretaria", 1)));
        roleRepository.findByNameIgnoreCase("PROFESSIONAL")
                .orElseGet(() -> roleRepository.save(buildRole("PROFESSIONAL", "Profesional", 2)));
    }

    private RoleEntity buildRole(String name, String description, int hierarchy) {
        RoleEntity role = new RoleEntity();
        role.setName(name);
        role.setDescription(description);
        role.setHierarchy(hierarchy);
        return role;
    }
}

