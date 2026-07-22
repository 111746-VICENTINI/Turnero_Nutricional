package nutricentro.services.implementation;

import lombok.RequiredArgsConstructor;
import nutricentro.config.AuthProperties;
import nutricentro.config.EmailProperties;
import nutricentro.dtos.auth.AuthRequestDTO;
import nutricentro.dtos.auth.AuthResponseDTO;
import nutricentro.dtos.auth.ChangePasswordRequestDTO;
import nutricentro.dtos.auth.CreatePasswordRequestDTO;
import nutricentro.dtos.auth.PasswordResetConfirmDTO;
import nutricentro.dtos.auth.PasswordResetRequestDTO;
import nutricentro.dtos.auth.PasswordResetResponseDTO;
import nutricentro.dtos.email.EmailRequestDTO;
import nutricentro.dtos.users.UserResponseDTO;
import nutricentro.entities.RoleEntity;
import nutricentro.entities.TokenEntity;
import nutricentro.entities.UserEntity;
import nutricentro.enums.TokenType;
import nutricentro.repositories.TokenRepository;
import nutricentro.repositories.UserRepository;
import nutricentro.services.AuthService;
import nutricentro.services.JwtService;
import nutricentro.services.PasswordPolicyService;
import nutricentro.services.email.EmailService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private static final int TOKEN_BYTES = 32;
    private static final String GENERIC_RESET_MESSAGE =
            "Si el correo esta registrado, recibiras instrucciones para restablecer tu contraseña.";

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final TokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final PasswordPolicyService passwordPolicyService;
    private final EmailService emailService;
    private final EmailProperties emailProperties;
    private final AuthProperties authProperties;

    @Override
    public AuthResponseDTO login(AuthRequestDTO request) {
        String email = normalizeEmail(request.getEmail());
        UserEntity user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(this::invalidCredentials);

        if (!canLogin(user)) {
            throw invalidCredentials();
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(user.getUsername(), request.getPassword())
            );
        } catch (BadCredentialsException | DisabledException exception) {
            throw invalidCredentials();
        }

        String token = jwtService.generateToken(user);
        return new AuthResponseDTO(token, "Bearer", toUserResponse(user));
    }

    @Override
    @Transactional
    public PasswordResetResponseDTO requestPasswordReset(PasswordResetRequestDTO request) {
        String email = normalizeEmail(request.getEmail());
        UserEntity user = userRepository.findByEmailIgnoreCase(email).orElse(null);

        if (user == null || !canLogin(user)) {
            return genericResetResponse();
        }

        TokenIssue tokenIssue = issueToken(user, TokenType.PASSWORD_RESET,
                authProperties.passwordResetTokenExpirationMinutes());

        try {
            sendPasswordResetEmail(user, tokenIssue.rawToken());
        } catch (RuntimeException exception) {
            markTokenUsed(tokenIssue.entity());
        }

        return genericResetResponse();
    }

    @Override
    @Transactional
    public void resetPassword(PasswordResetConfirmDTO request) {
        passwordPolicyService.validate(request.getNewPassword(), request.getConfirmPassword());
        TokenEntity token = consumeToken(request.getToken(), TokenType.PASSWORD_RESET);
        UserEntity user = token.getUser();

        if (!canLogin(user)) {
            throw new IllegalArgumentException("Token invalido o vencido");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setPasswordConfigured(true);
        userRepository.save(user);
        invalidateTemporaryTokens(user.getId());
    }

    @Override
    @Transactional
    public void createPassword(CreatePasswordRequestDTO request) {
        passwordPolicyService.validate(request.getNewPassword(), request.getConfirmPassword());
        TokenEntity token = consumeToken(request.getToken(), TokenType.FIRST_LOGIN);
        UserEntity user = token.getUser();

        if (!Boolean.TRUE.equals(user.getIsActive()) || Boolean.TRUE.equals(user.getPasswordConfigured())) {
            throw new IllegalArgumentException("Token invalido o vencido");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setPasswordConfigured(true);
        userRepository.save(user);
        invalidateTemporaryTokens(user.getId());
    }

    @Override
    @Transactional
    public void changePassword(ChangePasswordRequestDTO request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getName())) {
            throw new IllegalArgumentException("Usuario no autenticado");
        }

        UserEntity user = userRepository.findByUsernameIgnoreCase(authentication.getName())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no autenticado"));

        if (!canLogin(user)) {
            throw new IllegalArgumentException("Usuario no habilitado");
        }
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("La contraseña actual no es correcta");
        }
        if (passwordEncoder.matches(request.getNewPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("La nueva contraseña debe ser diferente");
        }

        passwordPolicyService.validate(request.getNewPassword(), request.getConfirmPassword());
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setPasswordConfigured(true);
        userRepository.save(user);
        invalidateTemporaryTokens(user.getId());
    }

    @Override
    @Transactional
    public void sendCreatePasswordInvitation(UserEntity user) {
        if (!Boolean.TRUE.equals(user.getIsActive())
                || Boolean.TRUE.equals(user.getPasswordConfigured())
                || !StringUtils.hasText(user.getEmail())) {
            throw new IllegalArgumentException("El usuario no tiene una invitacion pendiente");
        }
        TokenIssue tokenIssue = issueToken(user, TokenType.FIRST_LOGIN,
                authProperties.firstLoginTokenExpirationMinutes());
        sendCreatePasswordEmail(user, tokenIssue.rawToken());
    }

    @Override
    @Transactional
    public void invalidateCreatePasswordInvitations(Long userId) {
        tokenRepository.invalidateActiveTokens(userId, TokenType.FIRST_LOGIN, LocalDateTime.now());
    }

    private TokenIssue issueToken(UserEntity user, TokenType tokenType, long expirationMinutes) {
        tokenRepository.invalidateActiveTokens(user.getId(), tokenType, LocalDateTime.now());

        String rawToken = generateRawToken();
        TokenEntity token = TokenEntity.builder()
                .user(user)
                .token(hashToken(rawToken))
                .tokenType(tokenType)
                .expiresAt(LocalDateTime.now().plusMinutes(expirationMinutes))
                .isUsed(false)
                .build();

        return new TokenIssue(rawToken, tokenRepository.save(token));
    }

    private TokenEntity consumeToken(String rawToken, TokenType tokenType) {
        TokenEntity token = tokenRepository.findByTokenAndTokenType(hashToken(rawToken), tokenType)
                .orElseThrow(() -> new IllegalArgumentException("Token invalido o vencido"));

        LocalDateTime expiresAt = token.getExpiresAt();
        if (Boolean.TRUE.equals(token.getIsUsed())
                || !Boolean.TRUE.equals(token.getIsActive())
                || expiresAt == null
                || !expiresAt.isAfter(LocalDateTime.now())) {
            throw new IllegalArgumentException("Token invalido o vencido");
        }

        markTokenUsed(token);
        return token;
    }

    private void markTokenUsed(TokenEntity token) {
        token.setIsUsed(true);
        token.setUsedAt(LocalDateTime.now());
        tokenRepository.save(token);
    }

    private void invalidateTemporaryTokens(Long userId) {
        tokenRepository.invalidateActiveTokens(userId, TokenType.FIRST_LOGIN, LocalDateTime.now());
        tokenRepository.invalidateActiveTokens(userId, TokenType.PASSWORD_RESET, LocalDateTime.now());
    }

    private void sendCreatePasswordEmail(UserEntity user, String token) {
        String link = buildFrontendLink("/create-password", token);
        String expirationText = formatDuration(authProperties.firstLoginTokenExpirationMinutes());
        String html = """
                <p style="margin:0 0 14px;">¡Hola!</p>
                <p style="margin:0 0 18px;">Se creó una cuenta para vos en NutriCentro.</p>
                <p style="margin:0 0 18px;">Para activar tu acceso, hacé clic en el siguiente botón y creá tu contraseña.</p>
                <p style="margin:24px 0;">
                  <a href="%s" style="background:#0f766e;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:6px;font-weight:700;display:inline-block;">Crear contraseña</a>
                </p>
                <p style="margin:0 0 14px;">Este enlace estará disponible durante %s y solo podrá utilizarse una vez.</p>
                <p style="margin:0;">Si no esperabas este correo, simplemente ignoralo.</p>
                """.formatted(link, expirationText);

        emailService.send(EmailRequestDTO.builder()
                .to(List.of(user.getEmail()))
                .subject("Activá tu cuenta")
                .htmlMessage(html)
                .build());
    }

    private void sendPasswordResetEmail(UserEntity user, String token) {
        String link = buildFrontendLink("/reset-password", token);
        String expirationText = formatDuration(authProperties.passwordResetTokenExpirationMinutes());
        String html = """
                <p style="margin:0 0 14px;">¡Hola!</p>
                <p style="margin:0 0 18px;">Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
                <p style="margin:0 0 18px;">Para continuar, hacé clic en el siguiente botón.</p>
                <p style="margin:24px 0;">
                  <a href="%s" style="background:#0f766e;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:6px;font-weight:700;display:inline-block;">Restablecer contraseña</a>
                </p>
                <p style="margin:0 0 14px;">Este enlace estará disponible durante %s y solo podrá utilizarse una vez.</p>
                <p style="margin:0;">Si no solicitaste este cambio, simplemente ignorá este correo.</p>
                """.formatted(link, expirationText);

        emailService.send(EmailRequestDTO.builder()
                .to(List.of(user.getEmail()))
                .subject("Restablecé tu contraseña de NutriCentro")
                .htmlMessage(html)
                .build());
    }

    private String formatDuration(long minutes) {
        if (minutes % 1_440 == 0) {
            long days = minutes / 1_440;
            return days == 1 ? "1 día" : days + " días";
        }
        if (minutes % 60 == 0) {
            long hours = minutes / 60;
            return hours == 1 ? "1 hora" : hours + " horas";
        }
        return minutes == 1 ? "1 minuto" : minutes + " minutos";
    }

    private String buildFrontendLink(String path, String token) {
        String frontendUrl = emailProperties.frontendUrl();
        if (!StringUtils.hasText(frontendUrl)) {
            throw new IllegalStateException("Falta configurar email.frontend-url");
        }
        String normalizedBase = frontendUrl.endsWith("/")
                ? frontendUrl.substring(0, frontendUrl.length() - 1)
                : frontendUrl;
        String encodedToken = URLEncoder.encode(token, StandardCharsets.UTF_8);
        return normalizedBase + path + "?token=" + encodedToken;
    }

    private String generateRawToken() {
        byte[] randomBytes = new byte[TOKEN_BYTES];
        new SecureRandom().nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }

    private String hashToken(String rawToken) {
        if (!StringUtils.hasText(rawToken)) {
            throw new IllegalArgumentException("Token invalido o vencido");
        }
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(rawToken.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(digest.length * 2);
            for (byte item : digest) {
                hex.append(String.format("%02x", item));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("No se pudo calcular el hash del token", exception);
        }
    }

    private String normalizeEmail(String email) {
        if (!StringUtils.hasText(email)) {
            throw invalidCredentials();
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private boolean canLogin(UserEntity user) {
        return Boolean.TRUE.equals(user.getIsActive())
                && (user.getPasswordConfigured() == null || Boolean.TRUE.equals(user.getPasswordConfigured()));
    }

    private BadCredentialsException invalidCredentials() {
        return new BadCredentialsException("Credenciales invalidas");
    }

    private PasswordResetResponseDTO genericResetResponse() {
        return new PasswordResetResponseDTO(GENERIC_RESET_MESSAGE);
    }

    private UserResponseDTO toUserResponse(UserEntity user) {
        return new UserResponseDTO(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getIsActive(),
                user.getPasswordConfigured() == null || Boolean.TRUE.equals(user.getPasswordConfigured()),
                user.getRoles().stream()
                        .map(RoleEntity::getName)
                        .collect(Collectors.toSet()));
    }

    private record TokenIssue(String rawToken, TokenEntity entity) {
    }
}
