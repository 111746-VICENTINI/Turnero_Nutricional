package nutricentro.services.implementation;

import nutricentro.entities.AppointmentEntity;
import nutricentro.entities.AppointmentTimelineEventEntity;
import nutricentro.entities.ProfessionalEntity;
import nutricentro.entities.SpecialtyEntity;
import nutricentro.enums.AppointmentEventType;
import nutricentro.repositories.AppointmentTimelineEventRepository;
import nutricentro.services.AppointmentTimelineService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.Duration;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
/** Envía mensajes de turnos usando la API oficial de WhatsApp Cloud. */
public class WhatsAppNotificationService {

    private static final Logger log = LoggerFactory.getLogger(WhatsAppNotificationService.class);
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    private final RestClient restClient;
    private final AppointmentTimelineService appointmentTimelineService;
    private final AppointmentTimelineEventRepository timelineEventRepository;
    private final String apiVersion;
    private final String phoneNumberId;
    private final String accessToken;
    private final String appointmentCreatedTemplate;
    private final String appointmentReminderTemplate;
    private final String templateLanguage;
    private final String consultorioAddress;
    private final String consultorioPhone;
    private final String appointmentCost;

    @Autowired
    /** Construye el cliente HTTP configurado para WhatsApp Cloud API. */
    public WhatsAppNotificationService(AppointmentTimelineService appointmentTimelineService,
                                       AppointmentTimelineEventRepository timelineEventRepository,
                                       @Value("${whatsapp.cloud-api.base-url}") String baseUrl,
                                       @Value("${whatsapp.cloud-api.api-version}") String apiVersion,
                                       @Value("${whatsapp.cloud-api.phone-number-id}") String phoneNumberId,
                                       @Value("${whatsapp.cloud-api.access-token}") String accessToken,
                                       @Value("${whatsapp.cloud-api.appointment-created-template}") String appointmentCreatedTemplate,
                                       @Value("${whatsapp.cloud-api.appointment-reminder-template}") String appointmentReminderTemplate,
                                       @Value("${whatsapp.cloud-api.template-language}") String templateLanguage,
                                       @Value("${whatsapp.cloud-api.consultorio-address}") String consultorioAddress,
                                       @Value("${whatsapp.cloud-api.consultorio-phone}") String consultorioPhone,
                                       @Value("${whatsapp.cloud-api.appointment-cost}") String appointmentCost,
                                       @Value("${whatsapp.cloud-api.connect-timeout}") Duration connectTimeout,
                                       @Value("${whatsapp.cloud-api.read-timeout}") Duration readTimeout) {
        this(
                createRestClient(baseUrl, connectTimeout, readTimeout),
                appointmentTimelineService,
                timelineEventRepository,
                apiVersion,
                phoneNumberId,
                accessToken,
                appointmentCreatedTemplate,
                appointmentReminderTemplate,
                templateLanguage,
                consultorioAddress,
                consultorioPhone,
                appointmentCost
        );
    }

    WhatsAppNotificationService(RestClient restClient,
                                AppointmentTimelineService appointmentTimelineService,
                                AppointmentTimelineEventRepository timelineEventRepository,
                                String apiVersion,
                                String phoneNumberId,
                                String accessToken,
                                String appointmentCreatedTemplate,
                                String appointmentReminderTemplate,
                                String templateLanguage,
                                String consultorioAddress,
                                String consultorioPhone,
                                String appointmentCost) {
        this.restClient = restClient;
        this.appointmentTimelineService = appointmentTimelineService;
        this.timelineEventRepository = timelineEventRepository;
        this.apiVersion = apiVersion;
        this.phoneNumberId = phoneNumberId;
        this.accessToken = accessToken;
        this.appointmentCreatedTemplate = appointmentCreatedTemplate;
        this.appointmentReminderTemplate = appointmentReminderTemplate;
        this.templateLanguage = templateLanguage;
        this.consultorioAddress = consultorioAddress;
        this.consultorioPhone = consultorioPhone;
        this.appointmentCost = appointmentCost;
    }

    WhatsAppNotificationService(RestClient restClient,
                                AppointmentTimelineService appointmentTimelineService,
                                String apiVersion,
                                String phoneNumberId,
                                String accessToken,
                                String appointmentCreatedTemplate,
                                String appointmentReminderTemplate,
                                String templateLanguage,
                                String consultorioAddress,
                                String consultorioPhone,
                                String appointmentCost) {
        this(
                restClient,
                appointmentTimelineService,
                null,
                apiVersion,
                phoneNumberId,
                accessToken,
                appointmentCreatedTemplate,
                appointmentReminderTemplate,
                templateLanguage,
                consultorioAddress,
                consultorioPhone,
                appointmentCost
        );
    }

    /** Devuelve el estado visible de la configuracion de WhatsApp sin exponer credenciales. */
    public Map<String, Object> getConfigurationStatus() {
        boolean configured = isConfigured();
        return Map.of(
                "connected", configured,
                "phoneNumberId", valueOrFallback(phoneNumberId, "No configurado"),
                "lastSend", latestEventSummary(List.of(
                        AppointmentEventType.WHATSAPP_MESSAGE_SENT,
                        AppointmentEventType.WHATSAPP_REMINDER_SENT
                )),
                "lastError", latestEventSummary(List.of(
                        AppointmentEventType.WHATSAPP_MESSAGE_FAILED,
                        AppointmentEventType.WHATSAPP_REMINDER_FAILED
                ))
        );
    }

    /** Prueba la conexion con Meta Cloud API usando la configuracion actual. */
    public Map<String, Object> testConnection() {
        try {
            validateConfiguration();
            restClient.get()
                    .uri("/{apiVersion}/{phoneNumberId}", apiVersion, phoneNumberId)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                    .retrieve()
                    .toBodilessEntity();
            return Map.of("connected", true, "message", "Conexion verificada con Meta.");
        } catch (RestClientResponseException exception) {
            return Map.of(
                    "connected", false,
                    "message", "Meta respondio " + exception.getStatusCode()
            );
        } catch (Exception exception) {
            return Map.of(
                    "connected", false,
                    "message", valueOrFallback(exception.getMessage(), "No se pudo verificar la conexion")
            );
        }
    }

    /** Envía el mensaje inicial de creación del turno. */
    public void sendAppointmentCreatedMessage(AppointmentEntity appointment) {
        sendTemplateMessage(
                appointment,
                appointmentCreatedTemplate,
                buildAppointmentCreatedParameters(appointment),
                "Mensaje inicial de WhatsApp enviado al paciente",
                false
        );
    }

    /** Envía el recordatorio automático del turno. */
    public void sendAppointmentReminderMessage(AppointmentEntity appointment) {
        sendTemplateMessage(
                appointment,
                appointmentReminderTemplate,
                buildAppointmentReminderParameters(appointment),
                "Recordatorio de WhatsApp enviado al paciente",
                true
        );
    }

    private void sendTemplateMessage(AppointmentEntity appointment,
                                     String templateName,
                                     List<Map<String, String>> parameters,
                                     String successObservation,
                                     boolean reminder) {
        try {
            validateConfiguration(templateName);
            Map<String, Object> payload = buildTemplatePayload(appointment, templateName, parameters);
            String recipient = String.valueOf(payload.get("to"));
            log.info(
                    "Iniciando envio WhatsApp para turno {}. template={}, reminder={}, destinatario={}",
                    appointment.getId(),
                    templateName,
                    reminder,
                    maskPhone(recipient)
            );
            log.debug("Parametros WhatsApp para turno {} y template {}: {}", appointment.getId(), templateName, parameters);
            ResponseEntity<String> metaResponse = restClient.post()
                    .uri("/{apiVersion}/{phoneNumberId}/messages", apiVersion, phoneNumberId)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .toEntity(String.class);
            log.info(
                    "Meta acepto WhatsApp para turno {}. template={}, httpStatus={}, respuesta={}",
                    appointment.getId(),
                    templateName,
                    metaResponse.getStatusCode(),
                    valueOrFallback(metaResponse.getBody(), "sin cuerpo")
            );

            recordResult(
                    appointment,
                    true,
                    successObservation,
                    reminder
            );
        } catch (RestClientResponseException exception) {
            String error = "Meta respondio " + exception.getStatusCode() + ": " + exception.getResponseBodyAsString();
            log.warn("No se pudo enviar WhatsApp del turno {}. {}", appointment.getId(), error);
            recordResult(appointment, false, error, reminder);
        } catch (Exception exception) {
            String error = exception.getMessage() != null ? exception.getMessage() : exception.getClass().getSimpleName();
            log.warn("No se pudo enviar WhatsApp del turno {}. {}", appointment.getId(), error);
            recordResult(appointment, false, error, reminder);
        }
    }

    private Map<String, Object> buildTemplatePayload(AppointmentEntity appointment,
                                                     String templateName,
                                                     List<Map<String, String>> parameters) {
        return Map.of(
                "messaging_product", "whatsapp",
                "to", normalizePhoneNumber(appointment.getPatient().getMobile()),
                "type", "template",
                "template", Map.of(
                        "name", templateName,
                        "language", Map.of("code", templateLanguage),
                        "components", List.of(Map.of(
                                "type", "body",
                                "parameters", parameters
                        ))
                )
        );
    }

    private List<Map<String, String>> buildAppointmentCreatedParameters(AppointmentEntity appointment) {
        return List.of(
                textParameter(fullName(appointment.getPatient().getFirstName(), appointment.getPatient().getLastName())),
                textParameter(appointment.getDate().format(DATE_FORMATTER)),
                textParameter(appointment.getTime().format(TIME_FORMATTER)),
                textParameter(fullName(appointment.getProfessional().getFirstName(), appointment.getProfessional().getLastName())),
                textParameter(valueOrFallback(consultorioAddress, "A confirmar")),
                textParameter(appointmentCost(appointment)),
                textParameter(valueOrFallback(consultorioPhone, "A confirmar"))
        );
    }

    private List<Map<String, String>> buildAppointmentReminderParameters(AppointmentEntity appointment) {
        return List.of(
                textParameter(fullName(appointment.getPatient().getFirstName(), appointment.getPatient().getLastName())),
                textParameter(appointment.getDate().format(DATE_FORMATTER)),
                textParameter(appointment.getTime().format(TIME_FORMATTER)),
                textParameter(fullName(appointment.getProfessional().getFirstName(), appointment.getProfessional().getLastName())),
                textParameter(appointmentCost(appointment)),
                textParameter(valueOrFallback(consultorioAddress, "A confirmar")),
                textParameter("Responda SI para confirmar o NO para cancelar")
        );
    }

    private Map<String, String> textParameter(String value) {
        return Map.of("type", "text", "text", valueOrFallback(value, "-"));
    }

    static String normalizePhoneNumber(String phone) {
        String digits = phone == null ? "" : phone.replaceAll("[^0-9]", "");
        if (digits.isBlank()) {
            throw new IllegalArgumentException("El telefono movil del paciente es invalido para WhatsApp");
        }
        if (digits.startsWith("0")) {
            digits = digits.substring(1);
        }
        if (digits.startsWith("549")) {
            return validateWhatsAppPhoneNumber(digits);
        }
        if (digits.startsWith("54")) {
            return validateWhatsAppPhoneNumber("549" + digits.substring(2));
        }
        return validateWhatsAppPhoneNumber("549" + digits);
    }

    private static String validateWhatsAppPhoneNumber(String phoneNumber) {
        if (!phoneNumber.matches("549\\d{10}")) {
            throw new IllegalArgumentException("El telefono movil del paciente es invalido para WhatsApp. Debe corresponder a un numero argentino en formato E.164.");
        }
        return phoneNumber;
    }

    private String specialties(ProfessionalEntity professional) {
        if (professional.getSpecialties() == null || professional.getSpecialties().isEmpty()) {
            return "General";
        }
        return professional.getSpecialties().stream()
                .map(SpecialtyEntity::getName)
                .filter(Objects::nonNull)
                .collect(Collectors.joining(", "));
    }

    private String fullName(String firstName, String lastName) {
        return String.join(" ", valueOrFallback(firstName, ""), valueOrFallback(lastName, "")).trim();
    }

    private String valueOrFallback(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private String appointmentCost(AppointmentEntity appointment) {
        if (appointment.getAppliedFee() != null) {
            return formatAppointmentCost(valueOrFallback(appointment.getFeeCurrency(), "ARS"), appointment.getAppliedFee());
        }
        return formatConfiguredAppointmentCost(appointmentCost);
    }

    private String formatConfiguredAppointmentCost(String configuredCost) {
        String value = valueOrFallback(configuredCost, "A confirmar");
        String normalized = value
                .replace("$", "")
                .replace("ARS", "")
                .trim();
        try {
            return formatAppointmentCost("ARS", new BigDecimal(normalizeConfiguredAmount(normalized)));
        } catch (NumberFormatException exception) {
            return value;
        }
    }

    private String normalizeConfiguredAmount(String value) {
        if (value.contains(",")) {
            return value.replace(".", "").replace(",", ".");
        }
        if (value.matches("\\d{1,3}(\\.\\d{3})+")) {
            return value.replace(".", "");
        }
        return value;
    }

    private String formatAppointmentCost(String currency, BigDecimal amount) {
        DecimalFormatSymbols symbols = DecimalFormatSymbols.getInstance(Locale.forLanguageTag("es-AR"));
        DecimalFormat formatter = new DecimalFormat("#,##0.##", symbols);
        String formattedAmount = formatter.format(amount);
        if ("ARS".equalsIgnoreCase(currency)) {
            return "$" + formattedAmount;
        }
        return currency.trim().toUpperCase(Locale.ROOT) + " " + formattedAmount;
    }

    private void validateConfiguration() {
        validateConfiguration("-");
    }

    private void validateConfiguration(String templateName) {
        if (phoneNumberId == null || phoneNumberId.isBlank()) {
            throw new IllegalStateException("Falta configurar whatsapp.cloud-api.phone-number-id");
        }
        if (accessToken == null || accessToken.isBlank()) {
            throw new IllegalStateException("Falta configurar whatsapp.cloud-api.access-token");
        }
        if (templateName == null || templateName.isBlank()) {
            throw new IllegalStateException("Falta configurar el template de WhatsApp");
        }
        if (templateLanguage == null || templateLanguage.isBlank()) {
            throw new IllegalStateException("Falta configurar whatsapp.cloud-api.template-language");
        }
    }

    private boolean isConfigured() {
        return phoneNumberId != null && !phoneNumberId.isBlank()
                && accessToken != null && !accessToken.isBlank();
    }

    private String latestEventSummary(List<AppointmentEventType> eventTypes) {
        if (timelineEventRepository == null) {
            return "Sin registro";
        }
        return timelineEventRepository.findTopByEventTypeInOrderByOccurredAtDescIdDesc(eventTypes)
                .map(this::eventSummary)
                .orElse("Sin registro");
    }

    private String eventSummary(AppointmentTimelineEventEntity event) {
        return event.getOccurredAt() + " - " + valueOrFallback(event.getObservations(), event.getEventType().name());
    }

    private void recordResult(AppointmentEntity appointment, boolean sent, String observations, boolean reminder) {
        try {
            if (reminder) {
                appointmentTimelineService.recordWhatsAppReminderResult(appointment, sent, observations);
            } else {
                appointmentTimelineService.recordWhatsAppMessageResult(appointment, sent, observations);
            }
        } catch (Exception timelineException) {
            log.warn("No se pudo registrar el resultado de WhatsApp en el timeline del turno {}", appointment.getId());
        }
    }

    private static RestClient createRestClient(String baseUrl, Duration connectTimeout, Duration readTimeout) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(connectTimeout);
        requestFactory.setReadTimeout(readTimeout);

        return RestClient.builder()
                .baseUrl(baseUrl)
                .requestFactory(requestFactory)
                .build();
    }

    private String maskPhone(String phone) {
        if (phone == null || phone.length() <= 4) {
            return "****";
        }
        return "*".repeat(Math.max(0, phone.length() - 4)) + phone.substring(phone.length() - 4);
    }
}
