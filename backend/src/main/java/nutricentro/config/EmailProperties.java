package nutricentro.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "email")
public record EmailProperties(String provider, String fromName, String frontendUrl, Gmail gmail, Attachments attachments) {
    public record Gmail(String clientId,String clientSecret, String refreshToken, String user, String apiBaseUrl, String tokenUrl) {
    }

    public record Attachments(long maxTotalBytes) {
    }
}
