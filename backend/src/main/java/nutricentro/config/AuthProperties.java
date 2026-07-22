package nutricentro.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.auth")
public record AuthProperties(long firstLoginTokenExpirationMinutes,
                             long passwordResetTokenExpirationMinutes) {

    public AuthProperties {
        validateRange(firstLoginTokenExpirationMinutes, "FIRST_LOGIN_TOKEN_EXPIRATION_MINUTES", 1, 10_080);
        validateRange(passwordResetTokenExpirationMinutes, "PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES", 1, 1_440);
    }

    private static void validateRange(long value, String name, long min, long max) {
        if (value < min || value > max) {
            throw new IllegalStateException(name + " debe estar entre " + min + " y " + max + " minutos");
        }
    }
}
