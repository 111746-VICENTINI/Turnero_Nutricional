package nutricentro.services.implementation;

import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.criteria.Join;
import lombok.RequiredArgsConstructor;
import nutricentro.dtos.users.RegisterRequestDTO;
import nutricentro.dtos.users.UpdateUserDTO;
import nutricentro.dtos.users.UserResponseDTO;
import nutricentro.entities.RoleEntity;
import nutricentro.entities.UserEntity;
import nutricentro.exception.ApiException;
import nutricentro.repositories.UserRepository;
import nutricentro.services.RoleService;
import nutricentro.services.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final RoleService roleService;

	@Override
	public UserResponseDTO createUser(RegisterRequestDTO request) {
		if (userRepository.existsByUsernameIgnoreCase(request.getUsername())) {
			throw new ApiException("Ya existe un usuario con ese username",
									HttpStatus.CONFLICT.value());
		}
		if (userRepository.existsByEmailIgnoreCase(request.getEmail())) {
			throw new ApiException("Ya existe un usuario con ese email",
									HttpStatus.CONFLICT.value());
		}

		Set<RoleEntity> roles = roleService.resolveRoles(request.getRoles());

		UserEntity user = new UserEntity();
		user.setUsername(request.getUsername());
		user.setEmail(request.getEmail());
		user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
		user.setRoles(roles);
		user.setIsActive(true);

		UserEntity saved = userRepository.save(user);
		return toResponse(saved);
	}

	@Override
	public List<UserResponseDTO> findAll() {
		return userRepository.findAll().stream()
				.map(this::toResponse)
				.collect(Collectors.toList());
	}

	@Override
	public UserResponseDTO findById(Long id) {
		UserEntity user = userRepository.findById(id)
				.orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado con id: " + id));
		return toResponse(user);
	}

	@Override
	public UserResponseDTO update(Long id, UpdateUserDTO request) {
		UserEntity user = userRepository.findById(id)
				.orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));

		user.setUsername(request.getUsername());
		user.setEmail(request.getEmail());
		user.setIsActive(request.getIsActive());

		Set<RoleEntity> roles = roleService.resolveRoles(request.getRoles());
		user.setRoles(roles);

		return toResponse(userRepository.save(user));
	}

	@Override
	public void delete(Long id) {
		UserEntity user = userRepository.findById(id)
				.orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));

		user.setIsActive(false);
		userRepository.save(user);
	}

	@Override
	public Page<UserResponseDTO> searchUsers(String search, String role, Boolean isActive, Pageable pageable) {
		Specification<UserEntity> spec = Specification.allOf(
				bySearch(search),
				byRole(role),
				byActive(isActive)
		);

		return userRepository.findAll(spec, pageable).map(this::toResponse);
	}

	private UserResponseDTO toResponse(UserEntity user) {
		Set<String> roles = user.getRoles().stream()
				.map(RoleEntity::getName)
				.collect(Collectors.toSet());

		return new UserResponseDTO(user.getId(), user.getUsername(), user.getEmail(), user.getIsActive(), roles);
	}

	public static Specification<UserEntity> bySearch(String search) {
		return (root, query, cb) -> {
			if (search == null || search.isBlank()) {
				return cb.conjunction();
			}

			String pattern = "%" + search.toLowerCase() + "%";

			return cb.or(
					cb.like(cb.lower(root.get("username")), pattern),
					cb.like(cb.lower(root.get("email")), pattern)
			);
		};
	}

	public static Specification<UserEntity> byRole(String role) {
		return (root, query, cb) -> {
			if (role == null || role.isBlank()) {
				return cb.conjunction();
			}

			Join<UserEntity, RoleEntity> roles =
					root.join("roles");

			return cb.equal(
					cb.upper(roles.get("name")),
					role.toUpperCase()
			);
		};
	}

	public static Specification<UserEntity> byActive(Boolean active) {
		if (active == null) {
			return (root, query, cb) -> cb.conjunction();
		}

		return (root, query, cb) ->
				cb.equal(root.get("isActive"), active);
	}
}
