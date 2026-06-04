package nutricentro.services;

import nutricentro.dtos.authDTO.AuthRequestDTO;
import nutricentro.dtos.authDTO.AuthResponseDTO;
import nutricentro.dtos.authDTO.PasswordResetConfirmDTO;
import nutricentro.dtos.authDTO.PasswordResetRequestDTO;
import nutricentro.dtos.authDTO.PasswordResetResponseDTO;

public interface AuthService {
    AuthResponseDTO login(AuthRequestDTO request);

    PasswordResetResponseDTO requestPasswordReset(PasswordResetRequestDTO request);

    void resetPassword(PasswordResetConfirmDTO request);
}
