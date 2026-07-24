package nutricentro.config;

import nutricentro.entities.RoleEntity;
import nutricentro.repositories.RoleRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SeedDataRunnerTest {

    @Test
    void createsAllRequiredRolesWhenDatabaseIsEmpty() {
        RoleRepository roleRepository = mock(RoleRepository.class);
        when(roleRepository.findByNameIgnoreCase(any())).thenReturn(Optional.empty());
        when(roleRepository.save(any(RoleEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        new SeedDataRunner(roleRepository).run();

        ArgumentCaptor<RoleEntity> captor = ArgumentCaptor.forClass(RoleEntity.class);
        verify(roleRepository, org.mockito.Mockito.times(3)).save(captor.capture());

        assertThat(captor.getAllValues())
                .extracting(RoleEntity::getName)
                .containsExactly("ADMIN", "PROFESSIONAL", "SECRETARY");
        assertThat(captor.getAllValues())
                .extracting(RoleEntity::getDescription)
                .containsExactly("Administrador del sistema", "Profesional", "Secretaria");
    }

    @Test
    void doesNotDuplicateExistingRoles() {
        RoleRepository roleRepository = mock(RoleRepository.class);
        when(roleRepository.findByNameIgnoreCase("ADMIN")).thenReturn(Optional.of(role("ADMIN")));
        when(roleRepository.findByNameIgnoreCase("PROFESSIONAL")).thenReturn(Optional.of(role("PROFESSIONAL")));
        when(roleRepository.findByNameIgnoreCase("SECRETARY")).thenReturn(Optional.of(role("SECRETARY")));

        new SeedDataRunner(roleRepository).run();

        verify(roleRepository, never()).save(any(RoleEntity.class));
    }

    private RoleEntity role(String name) {
        RoleEntity role = new RoleEntity();
        role.setName(name);
        role.setDescription(name);
        return role;
    }
}
