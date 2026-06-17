package nutricentro.services;

import nutricentro.dtos.users.RegisterRequestDTO;
import nutricentro.dtos.users.UpdateUserDTO;
import nutricentro.dtos.users.UserResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface UserService {
	UserResponseDTO createUser(RegisterRequestDTO request);
	List<UserResponseDTO> findAll();
	UserResponseDTO findById(Long id);
	UserResponseDTO update(Long id, UpdateUserDTO request);
	void delete(Long id);
	Page<UserResponseDTO> searchUsers(String search, String role,	Boolean isActive, Pageable pageable);
}
