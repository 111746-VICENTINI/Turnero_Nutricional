package nutricentro.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.initial-admins")
public record InitialAdminsProperties(boolean enabled,
                                      String primaryEmail,
                                      String secondaryEmail) {
}
