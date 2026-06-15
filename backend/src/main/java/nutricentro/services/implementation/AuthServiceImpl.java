package nutricentro.services.implementation;

import lombok.RequiredArgsConstructor;
import nutricentro.dtos.auth.AuthRequestDTO;
import nutricentro.dtos.auth.AuthResponseDTO;
import nutricentro.dtos.auth.PasswordResetConfirmDTO;
import nutricentro.dtos.auth.PasswordResetRequestDTO;
import nutricentro.dtos.auth.PasswordResetResponseDTO;
import nutricentro.dtos.users.UserResponseDTO;
import nutricentro.entities.PasswordResetTokenEntity;
import nutricentro.entities.RoleEntity;
import nutricentro.entities.UserEntity;
import nutricentro.repositories.PasswordResetTokenRepository;
import nutricentro.repositories.UserRepository;
import nutricentro.services.AuthService;
import nutricentro.services.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private static final int RESET_TOKEN_BYTES = 32;
    private static final long RESET_TOKEN_EXPIRATION_MINUTES = 30;

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Override
    public AuthResponseDTO login(AuthRequestDTO request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        UserEntity user = userRepository.findByUsernameIgnoreCase(request.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("credenciales invalidas"));

        String token = jwtService.generateToken(user);

        UserResponseDTO userResponse = new UserResponseDTO(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getIsActive(),
                user.getRoles().stream()
                        .map(RoleEntity::getName)
                        .collect(Collectors.toSet()));

        return new AuthResponseDTO(token, "Bearer", userResponse);
    }

    @Override
    @Transactional
    public PasswordResetResponseDTO requestPasswordReset(PasswordResetRequestDTO request) {
        if (!StringUtils.hasText(request.getUsernameOrEmail())) {
            throw new IllegalArgumentException("Username or email is required");
        }

        UserEntity user = userRepository.findByUsernameIgnoreCase(request.getUsernameOrEmail())
                .or(() -> userRepository.findByEmailIgnoreCase(request.getUsernameOrEmail()))
                .orElse(null);

        if (user == null) {
            return new PasswordResetResponseDTO("If the account exists, a reset token was created.", null);
        }

        String token = generateResetToken();
        PasswordResetTokenEntity resetToken = new PasswordResetTokenEntity();
        resetToken.setUser(user);
        resetToken.setToken(token);
        resetToken.setExpiresAt(LocalDateTime.now().plusMinutes(RESET_TOKEN_EXPIRATION_MINUTES));
        resetToken.setUsed(false);
        passwordResetTokenRepository.save(resetToken);

        return new PasswordResetResponseDTO("Reset token created. Replace this response with email delivery.", token);
    }

    @Override
    @Transactional
    public void resetPassword(PasswordResetConfirmDTO request) {
        PasswordResetTokenEntity token = passwordResetTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new IllegalArgumentException("Invalid reset token"));

        if (token.isUsed()) {
            throw new IllegalArgumentException("Reset token already used");
        }

        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("Reset token expired");
        }

        UserEntity user = token.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        token.setUsed(true);
        token.setUsedAt(LocalDateTime.now());
        passwordResetTokenRepository.save(token);
    }

    private String generateResetToken() {
        byte[] randomBytes = new byte[RESET_TOKEN_BYTES];
        new SecureRandom().nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }
}


