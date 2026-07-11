package nutricentro.controllers;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import nutricentro.services.AppointmentService;
import nutricentro.services.implementation.WhatsAppNotificationService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/whatsapp")
@RequiredArgsConstructor
/** Recibe verificaciones y mensajes entrantes del webhook oficial de Meta. */
public class WhatsAppWebhookController {

    private final AppointmentService appointmentService;
    private final WhatsAppNotificationService whatsAppNotificationService;

    @Value("${whatsapp.cloud-api.verify-token}")
    private String verifyToken;

    @GetMapping("/webhook")
    /** Verifica el webhook contra el token configurado para Meta. */
    public ResponseEntity<String> verifyWebhook(@RequestParam(name = "hub.mode", required = false) String mode,
                                                @RequestParam(name = "hub.verify_token", required = false) String token,
                                                @RequestParam(name = "hub.challenge", required = false) String challenge) {
        if ("subscribe".equals(mode) && verifyToken != null && verifyToken.equals(token)) {
            return ResponseEntity.ok(challenge);
        }
        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }

    @PostMapping("/webhook")
    /** Procesa mensajes de texto entrantes de WhatsApp. */
    public ResponseEntity<Void> receiveMessage(@RequestBody JsonNode payload) {
        JsonNode messages = payload.path("entry").path(0).path("changes").path(0).path("value").path("messages");
        if (!messages.isArray()) {
            return ResponseEntity.ok().build();
        }

        for (JsonNode message : messages) {
            if (!"text".equals(message.path("type").asText())) {
                continue;
            }

            String phone = message.path("from").asText(null);
            String text = message.path("text").path("body").asText(null);
            appointmentService.handleWhatsAppTextReply(phone, text);
        }

        return ResponseEntity.ok().build();
    }

    @GetMapping("/status")
    /** Informa el estado visible de la configuracion de WhatsApp. */
    public ResponseEntity<?> status() {
        return ResponseEntity.ok(whatsAppNotificationService.getConfigurationStatus());
    }

    @PostMapping("/test-connection")
    /** Prueba la conexion configurada con Meta Cloud API. */
    public ResponseEntity<?> testConnection() {
        return ResponseEntity.ok(whatsAppNotificationService.testConnection());
    }
}
