package nutricentro.services;

import nutricentro.dtos.users.RegisterRequestDTO;
import nutricentro.dtos.users.UpdateUserDTO;
import nutricentro.dtos.users.UserResponseDTO;

import java.util.List;

public interface UserService {
	UserResponseDTO createUser(RegisterRequestDTO request);
	List<UserResponseDTO> findAll();
	UserResponseDTO findById(Long id);
	UserResponseDTO update(Long id, UpdateUserDTO request);
	void delete(Long id);
}
