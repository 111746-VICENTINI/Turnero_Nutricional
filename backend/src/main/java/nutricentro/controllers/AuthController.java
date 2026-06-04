package nutricentro.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import nutricentro.dtos.authDTO.AuthRequestDTO;
import nutricentro.dtos.authDTO.AuthResponseDTO;
import nutricentro.dtos.authDTO.PasswordResetConfirmDTO;
import nutricentro.dtos.authDTO.PasswordResetRequestDTO;
import nutricentro.dtos.authDTO.PasswordResetResponseDTO;
import nutricentro.services.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@CrossOrigin("*")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@Valid @RequestBody AuthRequestDTO request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/password/forgot")
    public ResponseEntity<PasswordResetResponseDTO> forgotPassword(
            @Valid @RequestBody PasswordResetRequestDTO request) {
        return ResponseEntity.ok(authService.requestPasswordReset(request));
    }

    @PostMapping("/password/reset")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody PasswordResetConfirmDTO request) {
        authService.resetPassword(request);
        return ResponseEntity.noContent().build();
    }
}
