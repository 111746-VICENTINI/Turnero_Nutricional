package nutricentro.services.implementation;

import lombok.RequiredArgsConstructor;
import nutricentro.dtos.roles.RoleRequestDTO;
import nutricentro.dtos.roles.RoleResponseDTO;
import nutricentro.entities.RoleEntity;
import nutricentro.repositories.RoleRepository;
import nutricentro.services.RoleService;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoleServiceImpl implements RoleService {

	private final RoleRepository roleRepository;

	@Override
	public RoleResponseDTO createRole(RoleRequestDTO request) {
		if (roleRepository.existsByNameIgnoreCase(request.getName())) {
			throw new IllegalArgumentException("El rol ya existe");
		}

		RoleEntity role = new RoleEntity();
		role.setName(request.getName().toUpperCase());
		role.setDescription(request.getDescription());
		role.setHierarchy(request.getHierarchy());

		RoleEntity saved = roleRepository.save(role);
		return toResponse(saved);
	}

	@Override
	public List<RoleResponseDTO> findAll() {
		return roleRepository.findAll().stream()
				.map(this::toResponse)
				.collect(Collectors.toList());
	}

	@Override
	public Set<RoleEntity> resolveRoles(Set<String> roles) {
		if (roles == null || roles.isEmpty()) {
			RoleEntity defaultRole = roleRepository.findByNameIgnoreCase("PROFESSIONAL")
					.orElseThrow(() ->
							new IllegalArgumentException("Profesional no se encontro"));

			return Set.of(defaultRole);
		}

		return roles.stream()
				.filter(StringUtils::hasText)
				.map(roleName ->
						roleRepository.findByNameIgnoreCase(roleName)
								.orElseThrow(() ->
										new IllegalArgumentException("Rol no encontrado: " + roleName)))
				.collect(Collectors.toSet());
	}

	private RoleResponseDTO toResponse(RoleEntity role) {
		return new RoleResponseDTO(role.getId(), role.getName(), role.getDescription(), role.getHierarchy());
	}
}
