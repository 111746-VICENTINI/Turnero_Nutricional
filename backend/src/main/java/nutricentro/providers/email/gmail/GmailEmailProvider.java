package nutricentro.providers.email.gmail;

import com.fasterxml.jackson.databind.JsonNode;
import nutricentro.config.EmailProperties;
import nutricentro.exception.EmailException;
import nutricentro.providers.email.EmailProvider;
import nutricentro.providers.email.ProviderEmailAttachment;
import nutricentro.providers.email.ProviderEmailRequest;
import nutricentro.providers.email.ProviderEmailResponse;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class GmailEmailProvider implements EmailProvider {

    private static final String CRLF = "\r\n";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final RestClient gmailApiRestClient;
    private final RestClient googleOAuthRestClient;
    private final EmailProperties emailProperties;

    public GmailEmailProvider(@Qualifier("gmailApiRestClient") RestClient gmailApiRestClient,
                              @Qualifier("googleOAuthRestClient") RestClient googleOAuthRestClient,
                              EmailProperties emailProperties) {
        this.gmailApiRestClient = gmailApiRestClient;
        this.googleOAuthRestClient = googleOAuthRestClient;
        this.emailProperties = emailProperties;
    }

    @Override
    public String providerName() {
        return "GMAIL_API";
    }

    @Override
    public ProviderEmailResponse send(ProviderEmailRequest request) {
        validateConfiguration();

        try {
            String accessToken = requestAccessToken();
            String rawMessage = Base64.getUrlEncoder()
                    .withoutPadding()
                    .encodeToString(buildMimeMessage(request).getBytes(StandardCharsets.UTF_8));

            Map<String, String> payload = Map.of("raw", rawMessage);
            JsonNode response = gmailApiRestClient.post()
                    .uri("/gmail/v1/users/{userId}/messages/send", emailProperties.gmail().user())
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(JsonNode.class);

            String messageId = response != null && response.hasNonNull("id")
                    ? response.get("id").asText()
                    : null;

            return new ProviderEmailResponse(messageId);
        } catch (RestClientResponseException exception) {
            throw new EmailException("Gmail API respondio " + exception.getStatusCode() + ": "
                    + exception.getResponseBodyAsString(), exception);
        } catch (EmailException exception) {
            throw exception;
        } catch (Exception exception) {
            throw new EmailException("No se pudo enviar el email con Gmail API", exception);
        }
    }

    private String requestAccessToken() {
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("client_id", emailProperties.gmail().clientId());
        body.add("client_secret", emailProperties.gmail().clientSecret());
        body.add("refresh_token", emailProperties.gmail().refreshToken());
        body.add("grant_type", "refresh_token");

        JsonNode response = googleOAuthRestClient.post()
                .uri("/token")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(body)
                .retrieve()
                .body(JsonNode.class);

        if (response == null || !response.hasNonNull("access_token")) {
            throw new EmailException("Google OAuth no devolvio access token");
        }

        return response.get("access_token").asText();
    }

    private String buildMimeMessage(ProviderEmailRequest request) {
        StringBuilder message = new StringBuilder();
        appendHeader(message, "MIME-Version", "1.0");
        appendHeader(message, "From", request.from());
        appendHeader(message, "To", joinAddresses(request.to()));
        if (request.cc() != null && !request.cc().isEmpty()) {
            appendHeader(message, "Cc", joinAddresses(request.cc()));
        }
        if (request.bcc() != null && !request.bcc().isEmpty()) {
            appendHeader(message, "Bcc", joinAddresses(request.bcc()));
        }
        if (StringUtils.hasText(request.replyTo())) {
            appendHeader(message, "Reply-To", request.replyTo().trim());
        }
        appendHeader(message, "Subject", encodeHeader(request.subject()));

        List<ProviderEmailAttachment> attachments = request.attachments() == null
                ? List.of()
                : request.attachments().stream()
                .filter(attachment -> StringUtils.hasText(attachment.contentBase64()))
                .toList();

        if (attachments.isEmpty()) {
            appendAlternativePart(message, request);
            return message.toString();
        }

        String mixedBoundary = newBoundary("mixed");
        appendHeader(message, "Content-Type", "multipart/mixed; boundary=\"" + mixedBoundary + "\"");
        message.append(CRLF);

        message.append("--").append(mixedBoundary).append(CRLF);
        appendAlternativePart(message, request);

        for (ProviderEmailAttachment attachment : attachments) {
            appendAttachmentPart(message, mixedBoundary, attachment);
        }

        message.append("--").append(mixedBoundary).append("--").append(CRLF);
        return message.toString();
    }

    private void appendAlternativePart(StringBuilder message, ProviderEmailRequest request) {
        String alternativeBoundary = newBoundary("alternative");
        appendHeader(message, "Content-Type", "multipart/alternative; boundary=\"" + alternativeBoundary + "\"");
        message.append(CRLF);

        appendTextPart(message, alternativeBoundary, "text/plain", request.text());
        appendTextPart(message, alternativeBoundary, "text/html", request.html());

        message.append("--").append(alternativeBoundary).append("--").append(CRLF);
    }

    private void appendTextPart(StringBuilder message, String boundary, String contentType, String content) {
        message.append("--").append(boundary).append(CRLF);
        appendHeader(message, "Content-Type", contentType + "; charset=\"UTF-8\"");
        appendHeader(message, "Content-Transfer-Encoding", "base64");
        message.append(CRLF);
        message.append(toMimeBase64(StringUtils.hasText(content) ? content : "")).append(CRLF);
    }

    private void appendAttachmentPart(StringBuilder message,
                                      String mixedBoundary,
                                      ProviderEmailAttachment attachment) {
        String contentType = StringUtils.hasText(attachment.contentType())
                ? attachment.contentType()
                : MediaType.APPLICATION_OCTET_STREAM_VALUE;
        String filename = sanitizeFilename(attachment.filename());

        message.append("--").append(mixedBoundary).append(CRLF);
        appendHeader(message, "Content-Type", contentType + "; name=\"" + filename + "\"");
        appendHeader(message, "Content-Disposition", "attachment; filename=\"" + filename + "\"");
        appendHeader(message, "Content-Transfer-Encoding", "base64");
        message.append(CRLF);
        message.append(wrapBase64(attachment.contentBase64())).append(CRLF);
    }

    private void appendHeader(StringBuilder message, String name, String value) {
        if (StringUtils.hasText(value)) {
            message.append(name).append(": ").append(value).append(CRLF);
        }
    }

    private String joinAddresses(List<String> addresses) {
        if (addresses == null) {
            return "";
        }
        return addresses.stream()
                .filter(StringUtils::hasText)
                .map(String::trim)
                .collect(Collectors.joining(", "));
    }

    private String encodeHeader(String value) {
        String text = value == null ? "" : value;
        boolean asciiOnly = text.chars().allMatch(character -> character <= 127);
        if (asciiOnly) {
            return text;
        }
        return "=?UTF-8?B?" + Base64.getEncoder().encodeToString(text.getBytes(StandardCharsets.UTF_8)) + "?=";
    }

    private String toMimeBase64(String value) {
        return Base64.getMimeEncoder(76, CRLF.getBytes(StandardCharsets.UTF_8))
                .encodeToString(value.getBytes(StandardCharsets.UTF_8));
    }

    private String wrapBase64(String base64) {
        String normalized = base64.replaceAll("\\s", "");
        StringBuilder wrapped = new StringBuilder();
        for (int index = 0; index < normalized.length(); index += 76) {
            int end = Math.min(index + 76, normalized.length());
            wrapped.append(normalized, index, end).append(CRLF);
        }
        return wrapped.toString();
    }

    private String newBoundary(String type) {
        byte[] random = new byte[12];
        RANDOM.nextBytes(random);
        return "nutricentro-" + type + "-" + Base64.getUrlEncoder().withoutPadding().encodeToString(random);
    }

    private String sanitizeFilename(String filename) {
        if (!StringUtils.hasText(filename)) {
            return "archivo";
        }
        return filename.replaceAll("[\\\\/:*?\"<>|\\r\\n]", "_");
    }

    private void validateConfiguration() {
        if (emailProperties.gmail() == null) {
            throw new EmailException("Falta configurar Gmail API");
        }
        Map<String, String> required = new LinkedHashMap<>();
        required.put("GMAIL_CLIENT_ID", emailProperties.gmail().clientId());
        required.put("GMAIL_CLIENT_SECRET", emailProperties.gmail().clientSecret());
        required.put("GMAIL_REFRESH_TOKEN", emailProperties.gmail().refreshToken());
        required.put("GMAIL_USER", emailProperties.gmail().user());

        required.forEach((name, value) -> {
            if (!StringUtils.hasText(value)) {
                throw new EmailException("Falta configurar " + name);
            }
        });
    }
}
