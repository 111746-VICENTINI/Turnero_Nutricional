package nutricentro.services;

import nutricentro.dtos.auth.AuthRequestDTO;
import nutricentro.dtos.auth.AuthResponseDTO;
import nutricentro.dtos.auth.PasswordResetConfirmDTO;
import nutricentro.dtos.auth.PasswordResetRequestDTO;
import nutricentro.dtos.auth.PasswordResetResponseDTO;
import org.springframework.stereotype.Service;

@Service
public interface AuthService {
    AuthResponseDTO login(AuthRequestDTO request);

    PasswordResetResponseDTO requestPasswordReset(PasswordResetRequestDTO request);

    void resetPassword(PasswordResetConfirmDTO request);
}
