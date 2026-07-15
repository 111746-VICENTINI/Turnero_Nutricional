package nutricentro.providers.email;

import java.util.List;

public record ProviderEmailRequest(
        String from,
        List<String> to,
        List<String> cc,
        List<String> bcc,
        String subject,
        String html,
        String text,
        String replyTo,
        List<ProviderEmailAttachment> attachments
) {
}
