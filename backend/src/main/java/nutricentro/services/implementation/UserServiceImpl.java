package nutricentro.services.implementation;

import jakarta.persistence.EntityNotFoundException;
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

	private UserResponseDTO toResponse(UserEntity user) {
		Set<String> roles = user.getRoles().stream()
				.map(RoleEntity::getName)
				.collect(Collectors.toSet());

		return new UserResponseDTO(user.getId(), user.getUsername(), user.getEmail(), user.getIsActive(), roles);
	}
}
