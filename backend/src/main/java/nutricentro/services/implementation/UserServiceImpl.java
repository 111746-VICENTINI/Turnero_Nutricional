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
import nutricentro.services.AuthService;
import nutricentro.services.RoleService;
import nutricentro.services.UserService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final RoleService roleService;
	private final AuthService authService;

	@Override
	@Transactional
	public UserResponseDTO createUser(RegisterRequestDTO request) {
		String normalizedEmail = normalizeEmail(request.getEmail());
		String normalizedUsername = normalizeUsername(request.getUsername());

		if (userRepository.existsByUsernameIgnoreCase(normalizedUsername)) {
			throw new ApiException("Ya existe un usuario con ese username",
									HttpStatus.CONFLICT.value());
		}
		if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
			throw new ApiException("Ya existe un usuario con ese email",
									HttpStatus.CONFLICT.value());
		}

		Set<RoleEntity> roles = roleService.resolveRoles(request.getRoles());

		UserEntity user = new UserEntity();
		user.setUsername(normalizedUsername);
		user.setEmail(normalizedEmail);
		user.setPasswordHash(passwordEncoder.encode(generateUnrecoverablePassword()));
		user.setPasswordConfigured(false);
		user.setAcceptedTerms(false);
		user.setAcceptedTermsAt(null);
		user.setRoles(roles);
		user.setIsActive(true);

		UserEntity saved = userRepository.save(user);
		authService.sendCreatePasswordInvitation(saved);
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
	@Transactional
	public UserResponseDTO update(Long id, UpdateUserDTO request) {
		UserEntity user = userRepository.findById(id)
				.orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));

		String normalizedUsername = normalizeUsername(request.getUsername());
		String normalizedEmail = normalizeEmail(request.getEmail());
		if (userRepository.existsByUsernameIgnoreCaseAndIdNot(normalizedUsername, id)) {
			throw new ApiException("Ya existe un usuario con ese username",
					HttpStatus.CONFLICT.value());
		}
		if (userRepository.existsByEmailIgnoreCaseAndIdNot(normalizedEmail, id)) {
			throw new ApiException("Ya existe un usuario con ese email",
					HttpStatus.CONFLICT.value());
		}

		boolean pendingEmailChanged = !isPasswordConfigured(user)
				&& !normalizedEmail.equalsIgnoreCase(user.getEmail());

		Set<RoleEntity> roles = roleService.resolveRoles(request.getRoles());
		validateAdminContinuity(user, request.getIsActive(), roles);

		user.setUsername(normalizedUsername);
		user.setEmail(normalizedEmail);
		user.setIsActive(request.getIsActive());
		user.setRoles(roles);

		UserEntity saved = userRepository.save(user);
		if (pendingEmailChanged) {
			authService.invalidateCreatePasswordInvitations(saved.getId());
		}

		return toResponse(saved);
	}

	@Override
	@Transactional
	public UserResponseDTO resendInvitation(Long id) {
		UserEntity user = userRepository.findById(id)
				.orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));

		if (!Boolean.TRUE.equals(user.getIsActive())) {
			throw new ApiException("El usuario esta inactivo",
					HttpStatus.CONFLICT.value());
		}
		if (isPasswordConfigured(user)) {
			throw new ApiException("El usuario ya configuro su contraseña",
					HttpStatus.CONFLICT.value());
		}

		authService.sendCreatePasswordInvitation(user);
		return toResponse(user);
	}

	@Override
	public void delete(Long id) {
		UserEntity user = userRepository.findById(id)
				.orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));

		validateAdminContinuity(user, false, user.getRoles());

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

		return new UserResponseDTO(user.getId(), user.getUsername(), user.getEmail(), user.getIsActive(),
				isPasswordConfigured(user), isTermsAccepted(user), user.getAcceptedTermsAt(), roles);
	}

	private String generateUnrecoverablePassword() {
		byte[] randomBytes = new byte[32];
		new SecureRandom().nextBytes(randomBytes);
		return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
	}

	private Boolean isPasswordConfigured(UserEntity user) {
		return user.getPasswordConfigured() == null || Boolean.TRUE.equals(user.getPasswordConfigured());
	}

	private Boolean isTermsAccepted(UserEntity user) {
		return user.getAcceptedTerms() == null || Boolean.TRUE.equals(user.getAcceptedTerms());
	}

	private void validateAdminContinuity(UserEntity user, Boolean requestedActive, Set<RoleEntity> requestedRoles) {
		if (!isActiveAdmin(user)) {
			return;
		}

		boolean willRemainActiveAdmin = Boolean.TRUE.equals(requestedActive) && hasAdminRole(requestedRoles);
		if (willRemainActiveAdmin) {
			return;
		}

		if (isAuthenticatedUser(user)) {
			throw new ApiException("No podes quitar tu propio acceso de administrador",
					HttpStatus.CONFLICT.value());
		}

		if (userRepository.countActiveAdminsExcluding(user.getId()) == 0) {
			throw new ApiException("Debe existir al menos un administrador activo",
					HttpStatus.CONFLICT.value());
		}
	}

	private boolean isActiveAdmin(UserEntity user) {
		return Boolean.TRUE.equals(user.getIsActive()) && hasAdminRole(user.getRoles());
	}

	private boolean hasAdminRole(Set<RoleEntity> roles) {
		return roles != null && roles.stream()
				.anyMatch(role -> role != null && "ADMIN".equalsIgnoreCase(role.getName()));
	}

	private boolean isAuthenticatedUser(UserEntity user) {
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		return authentication != null
				&& authentication.isAuthenticated()
				&& user.getUsername() != null
				&& user.getUsername().equalsIgnoreCase(authentication.getName());
	}

	private String normalizeEmail(String email) {
		return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
	}

	private String normalizeUsername(String username) {
		return username == null ? null : username.trim();
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
