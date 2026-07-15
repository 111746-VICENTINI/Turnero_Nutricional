package nutricentro.services.email;

public interface EmailTemplateService {
    String renderGenericEmail(String title, String messageHtml);

    String toPlainText(String html, String fallback);
}
