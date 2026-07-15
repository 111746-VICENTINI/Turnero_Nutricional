package nutricentro.services.email.implementation;

import nutricentro.services.email.EmailTemplateService;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class EmailTemplateServiceImpl implements EmailTemplateService {

    @Override
    public String renderGenericEmail(String title, String messageHtml) {
        String safeTitle = escapeHtml(StringUtils.hasText(title) ? title : "Comunicacion de NutriCentro");
        String body = StringUtils.hasText(messageHtml) ? messageHtml : "";

        return """
                <!doctype html>
                <html lang="es">
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                  <title>%s</title>
                </head>
                <body style="margin:0;padding:0;background:#f4f7f5;font-family:Arial,Helvetica,sans-serif;color:#10201d;">
                  <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="background:#f4f7f5;margin:0;padding:24px 0;">
                    <tr>
                      <td align="center" style="padding:0 12px;">
                        <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border:1px solid #dbe4ea;border-radius:8px;overflow:hidden;">
                          <tr>
                            <td style="background:#2f6f63;padding:24px 28px;color:#ffffff;">
                              <div style="font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">NutriCentro</div>
                              <h1 style="margin:8px 0 0;font-size:24px;line-height:1.25;font-weight:800;">%s</h1>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:28px;font-size:15px;line-height:1.65;">
                              %s
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:18px 28px;background:#fbfdfc;border-top:1px solid #e5ece8;color:#66736f;font-size:12px;line-height:1.5;">
                              Este mensaje fue enviado desde el sistema NutriCentro. Si recibiste este correo por error, podes responder a este mensaje para avisarnos.
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(safeTitle, safeTitle, body);
    }

    @Override
    public String toPlainText(String html, String fallback) {
        if (StringUtils.hasText(fallback)) {
            return fallback;
        }
        if (!StringUtils.hasText(html)) {
            return "";
        }
        return html
                .replaceAll("(?i)<br\\s*/?>", "\n")
                .replaceAll("(?i)</p>", "\n\n")
                .replaceAll("<[^>]+>", "")
                .replace("&nbsp;", " ")
                .replace("&amp;", "&")
                .replace("&lt;", "<")
                .replace("&gt;", ">")
                .replace("&quot;", "\"")
                .trim();
    }

    public String paragraphsFromPlainText(String text) {
        if (!StringUtils.hasText(text)) {
            return "";
        }
        String[] lines = text.trim().split("\\R{2,}");
        StringBuilder html = new StringBuilder();
        for (String line : lines) {
            if (!StringUtils.hasText(line)) {
                continue;
            }
            html.append("<p style=\"margin:0 0 14px;\">")
                    .append(escapeHtml(line).replace("\n", "<br>"))
                    .append("</p>");
        }
        return html.toString();
    }

    private String escapeHtml(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
