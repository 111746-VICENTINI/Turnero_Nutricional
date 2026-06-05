package nutricentro.services;

import nutricentro.dtos.roles.RoleRequestDTO;
import nutricentro.dtos.roles.RoleResponseDTO;
import nutricentro.entities.RoleEntity;

import java.util.List;
import java.util.Set;

public interface RoleService {
	RoleResponseDTO createRole(RoleRequestDTO request);
	List<RoleResponseDTO> findAll();
	Set<RoleEntity> resolveRoles(Set<String> roles);
}
