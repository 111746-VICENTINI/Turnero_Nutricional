package nutricentro.services;

import nutricentro.dtos.auth.AuthRequestDTO;
import nutricentro.dtos.auth.AuthResponseDTO;
import nutricentro.dtos.auth.ChangePasswordRequestDTO;
import nutricentro.dtos.auth.CreatePasswordRequestDTO;
import nutricentro.dtos.auth.PasswordResetConfirmDTO;
import nutricentro.dtos.auth.PasswordResetRequestDTO;
import nutricentro.dtos.auth.PasswordResetResponseDTO;
import nutricentro.dtos.users.UserResponseDTO;
import nutricentro.entities.UserEntity;
import org.springframework.stereotype.Service;

@Service
public interface AuthService {
    AuthResponseDTO login(AuthRequestDTO request);
    PasswordResetResponseDTO requestPasswordReset(PasswordResetRequestDTO request);

    void resetPassword(PasswordResetConfirmDTO request);
    void createPassword(CreatePasswordRequestDTO request);
    void changePassword(ChangePasswordRequestDTO request);
    UserResponseDTO acceptTerms();
    void sendCreatePasswordInvitation(UserEntity user);
    void invalidateCreatePasswordInvitations(Long userId);
}
