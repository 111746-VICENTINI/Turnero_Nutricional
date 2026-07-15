package nutricentro.services.email.implementation;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import nutricentro.config.EmailProperties;
import nutricentro.dtos.email.AttachmentDTO;
import nutricentro.dtos.email.EmailRequestDTO;
import nutricentro.dtos.email.EmailResponseDTO;
import nutricentro.entities.AntropometryEntity;
import nutricentro.entities.ClinicalFileEntity;
import nutricentro.entities.EmailLogEntity;
import nutricentro.entities.FoodPlanEntity;
import nutricentro.entities.LaboratoryEntity;
import nutricentro.entities.PatientEntity;
import nutricentro.enums.EmailStatus;
import nutricentro.exception.EmailException;
import nutricentro.providers.email.EmailProvider;
import nutricentro.providers.email.ProviderEmailAttachment;
import nutricentro.providers.email.ProviderEmailRequest;
import nutricentro.providers.email.ProviderEmailResponse;
import nutricentro.repositories.AntropometryRepository;
import nutricentro.repositories.ClinicalFileRepository;
import nutricentro.repositories.EmailLogRepository;
import nutricentro.repositories.FoodPlanRepository;
import nutricentro.repositories.LaboratoryRepository;
import nutricentro.repositories.MedicalHistoryRepository;
import nutricentro.repositories.PatientRepository;
import nutricentro.services.CurrentUserContext;
import nutricentro.services.CurrentUserProvider;
import nutricentro.services.email.EmailService;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Comparator;
import java.util.Date;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private static final String TEXT_CONTENT_TYPE = "text/plain";
    private static final String DATE_PATTERN = "dd/MM/yyyy";

    private final EmailProvider emailProvider;
    private final EmailTemplateServiceImpl emailTemplateService;
    private final EmailProperties emailProperties;
    private final EmailLogRepository emailLogRepository;
    private final CurrentUserProvider currentUserProvider;
    private final PatientRepository patientRepository;
    private final MedicalHistoryRepository medicalHistoryRepository;
    private final FoodPlanRepository foodPlanRepository;
    private final AntropometryRepository antropometryRepository;
    private final LaboratoryRepository laboratoryRepository;
    private final ClinicalFileRepository clinicalFileRepository;

    @Override
    public EmailResponseDTO send(EmailRequestDTO request) {
        List<String> recipients = cleanAddresses(request.getTo());
        if (recipients.isEmpty()) {
            throw new EmailException("Debe indicar al menos un destinatario");
        }
        if (!StringUtils.hasText(request.getHtmlMessage()) && !StringUtils.hasText(request.getTextMessage())) {
            throw new EmailException("Debe indicar un mensaje");
        }

        PatientEntity patient = resolvePatient(request.getPatientId());
        validatePatientEmail(patient);

        CurrentUserContext currentUser = currentUserProvider.getCurrentUser();
        EmailLogEntity audit = createPendingAudit(request, recipients, currentUser);
        emailLogRepository.save(audit);

        try {
            List<ProviderEmailAttachment> attachments = buildAttachments(request);
            validateAttachmentLimit(attachments);

            String htmlBody = buildHtmlBody(request);
            String textBody = emailTemplateService.toPlainText(htmlBody, request.getTextMessage());
            ProviderEmailResponse providerResponse = emailProvider.send(new ProviderEmailRequest(
                    formatFrom(request.getFromName()),
                    recipients,
                    cleanAddresses(request.getCc()),
                    cleanAddresses(request.getBcc()),
                    request.getSubject().trim(),
                    htmlBody,
                    textBody,
                    normalizeNullable(request.getReplyTo()),
                    attachments
            ));

            audit.setStatus(EmailStatus.SENT);
            audit.setMessageId(providerResponse.messageId());
            audit.setSentAt(LocalDateTime.now());
            emailLogRepository.save(audit);

            return toResponse(audit);
        } catch (Exception exception) {
            audit.setStatus(EmailStatus.FAILED);
            audit.setErrorMessage(exception.getMessage());
            emailLogRepository.save(audit);

            if (exception instanceof EmailException emailException) {
                throw emailException;
            }
            throw new EmailException("No se pudo enviar el email", exception);
        }
    }

    private EmailLogEntity createPendingAudit(EmailRequestDTO request,
                                              List<String> recipients,
                                              CurrentUserContext currentUser) {
        EmailLogEntity audit = new EmailLogEntity();
        audit.setRequestedAt(LocalDateTime.now());
        audit.setSenderUserId(currentUser.userId());
        audit.setSenderUsername(currentUser.username());
        audit.setPatientId(request.getPatientId());
        audit.setRecipients(String.join(",", recipients));
        audit.setCc(String.join(",", cleanAddresses(request.getCc())));
        audit.setBcc(String.join(",", cleanAddresses(request.getBcc())));
        audit.setSubject(request.getSubject().trim());
        audit.setProvider(emailProvider.providerName());
        audit.setStatus(EmailStatus.PENDING);
        return audit;
    }

    private PatientEntity resolvePatient(Long patientId) {
        if (patientId == null) {
            return null;
        }
        return patientRepository.findById(patientId)
                .orElseThrow(() -> new EntityNotFoundException("Paciente no encontrado"));
    }

    private void validatePatientEmail(PatientEntity patient) {
        if (patient != null && !StringUtils.hasText(patient.getEmail())) {
            throw new EmailException("El paciente no tiene email cargado");
        }
    }

    private String buildHtmlBody(EmailRequestDTO request) {
        String content = StringUtils.hasText(request.getHtmlMessage())
                ? request.getHtmlMessage()
                : emailTemplateService.paragraphsFromPlainText(request.getTextMessage());
        return emailTemplateService.renderGenericEmail(request.getSubject(), content);
    }

    private String formatFrom(String requestFromName) {
        String fromAddress = emailProperties.gmail() != null ? emailProperties.gmail().user() : null;
        if (!StringUtils.hasText(fromAddress)) {
            throw new EmailException("Falta configurar GMAIL_USER");
        }
        String fromName = StringUtils.hasText(requestFromName)
                ? requestFromName.trim()
                : normalizeNullable(emailProperties.fromName());
        return StringUtils.hasText(fromName)
                ? fromName + " <" + fromAddress.trim() + ">"
                : fromAddress.trim();
    }

    private List<ProviderEmailAttachment> buildAttachments(EmailRequestDTO request) {
        List<ProviderEmailAttachment> attachments = new ArrayList<>();

        if (request.getAttachments() != null) {
            request.getAttachments().stream()
                    .map(this::toProviderAttachment)
                    .filter(Objects::nonNull)
                    .forEach(attachments::add);
        }

        if (request.getHistoryId() != null) {
            Long historyId = request.getHistoryId();
            if (!medicalHistoryRepository.existsById(historyId)) {
                throw new EntityNotFoundException("Historia clinica no encontrada");
            }
            if (Boolean.TRUE.equals(request.getIncludeFoodPlan())) {
                buildFoodPlanAttachment(historyId).stream().findFirst().ifPresent(attachments::add);
            }
            if (Boolean.TRUE.equals(request.getIncludeAnthropometry())) {
                buildAnthropometryAttachment(historyId).stream().findFirst().ifPresent(attachments::add);
            }
            if (Boolean.TRUE.equals(request.getIncludeLaboratories())) {
                buildLaboratoryAttachment(historyId).stream().findFirst().ifPresent(attachments::add);
            }
            if (Boolean.TRUE.equals(request.getIncludeClinicalFiles())) {
                clinicalFileRepository.findByMedicalHistoryIdOrderByFileDateDescIdDesc(historyId).stream()
                        .map(this::toClinicalFileAttachment)
                        .forEach(attachments::add);
            }
        }

        return attachments;
    }

    private ProviderEmailAttachment toProviderAttachment(AttachmentDTO attachment) {
        if (attachment == null || !StringUtils.hasText(attachment.getFilename())
                || !StringUtils.hasText(attachment.getContentBase64())) {
            return null;
        }
        long size = attachment.getSizeBytes() != null
                ? attachment.getSizeBytes()
                : estimateBase64Size(attachment.getContentBase64());
        return new ProviderEmailAttachment(
                attachment.getFilename(),
                normalizeNullable(attachment.getContentType()),
                attachment.getContentBase64(),
                size
        );
    }

    private List<ProviderEmailAttachment> buildFoodPlanAttachment(Long historyId) {
        return foodPlanRepository.findByMedicalHistoryIdOrderByStartDateDesc(historyId).stream()
                .sorted(Comparator.comparing(FoodPlanEntity::getActive, Comparator.nullsLast(Comparator.reverseOrder())))
                .findFirst()
                .map(plan -> List.of(textAttachment("plan-alimentario.txt", formatFoodPlan(plan))))
                .orElseGet(List::of);
    }

    private String formatFoodPlan(FoodPlanEntity plan) {
        return """
                Plan alimentario
                Titulo: %s
                Descripcion: %s
                Menu: %s
                Observaciones: %s
                Kcal: %s
                Proteinas: %s
                Carbohidratos: %s
                Grasas: %s
                """.formatted(
                fallback(plan.getTitle()),
                fallback(plan.getDescription()),
                fallback(plan.getMenu()),
                fallback(plan.getObservations()),
                fallback(plan.getTotalCalories()),
                fallback(plan.getTotalProtein()),
                fallback(plan.getTotalCarbohydrates()),
                fallback(plan.getTotalFat())
        );
    }

    private List<ProviderEmailAttachment> buildAnthropometryAttachment(Long historyId) {
        return antropometryRepository.findByMedicalHistoryIdOrderByDateDesc(historyId).stream()
                .findFirst()
                .map(item -> List.of(textAttachment("antropometria.txt", formatAnthropometry(item))))
                .orElseGet(List::of);
    }

    private String formatAnthropometry(AntropometryEntity item) {
        return """
                Antropometria
                Fecha: %s
                Peso: %s
                Altura: %s
                IMC: %s
                Grasa corporal: %s
                Masa muscular: %s
                Observaciones: %s
                """.formatted(
                formatDate(item.getDate()),
                fallback(item.getWeight()),
                fallback(item.getHeight()),
                fallback(item.getBmi()),
                fallback(item.getBodyFatPercentage()),
                fallback(item.getMuscleMass()),
                fallback(item.getObservations())
        );
    }

    private List<ProviderEmailAttachment> buildLaboratoryAttachment(Long historyId) {
        List<LaboratoryEntity> laboratories = laboratoryRepository.findByMedicalHistoryIdOrderByDateDesc(historyId);
        if (laboratories.isEmpty()) {
            return List.of();
        }
        String content = laboratories.stream()
                .map(this::formatLaboratory)
                .collect(Collectors.joining("\n------------------------------\n"));
        return List.of(textAttachment("laboratorios.txt", content));
    }

    private String formatLaboratory(LaboratoryEntity item) {
        return """
                Laboratorio
                Fecha: %s
                Glucosa: %s
                Colesterol: %s
                HDL: %s
                LDL: %s
                Trigliceridos: %s
                Vitamina D: %s
                Vitamina B12: %s
                Observaciones: %s
                """.formatted(
                formatDate(item.getDate()),
                fallback(item.getGlucose()),
                fallback(item.getCholesterol()),
                fallback(item.getHdl()),
                fallback(item.getLdl()),
                fallback(item.getTriglycerides()),
                fallback(item.getVitaminD()),
                fallback(item.getVitaminB12()),
                fallback(item.getObservations())
        );
    }

    private ProviderEmailAttachment toClinicalFileAttachment(ClinicalFileEntity file) {
        String content = Base64.getEncoder().encodeToString(file.getContent());
        return new ProviderEmailAttachment(
                sanitizeFilename(file.getOriginalName()),
                file.getContentType(),
                content,
                file.getSize() != null ? file.getSize() : file.getContent().length
        );
    }

    private ProviderEmailAttachment textAttachment(String filename, String content) {
        byte[] bytes = content.getBytes(StandardCharsets.UTF_8);
        return new ProviderEmailAttachment(
                filename,
                TEXT_CONTENT_TYPE,
                Base64.getEncoder().encodeToString(bytes),
                bytes.length
        );
    }

    private void validateAttachmentLimit(List<ProviderEmailAttachment> attachments) {
        long max = emailProperties.attachments() != null
                ? emailProperties.attachments().maxTotalBytes()
                : 25_000_000L;
        long total = attachments.stream().mapToLong(ProviderEmailAttachment::sizeBytes).sum();
        if (total > max) {
            throw new EmailException("Los adjuntos superan el tamano permitido");
        }
    }

    private List<String> cleanAddresses(List<String> addresses) {
        if (addresses == null) {
            return List.of();
        }
        return addresses.stream()
                .filter(StringUtils::hasText)
                .map(String::trim)
                .distinct()
                .toList();
    }

    private String normalizeNullable(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private String sanitizeFilename(String filename) {
        if (!StringUtils.hasText(filename)) {
            return "archivo";
        }
        return filename.replaceAll("[\\\\/:*?\"<>|]", "_");
    }

    private long estimateBase64Size(String base64) {
        String normalized = base64.replaceAll("\\s", "");
        return Math.max(0, (normalized.length() * 3L) / 4L);
    }

    private String fallback(Object value) {
        if (value == null) {
            return "-";
        }
        String text = String.valueOf(value);
        return StringUtils.hasText(text) ? text.trim() : "-";
    }

    private String formatDate(Date date) {
        return date == null ? "-" : new SimpleDateFormat(DATE_PATTERN).format(date);
    }

    private EmailResponseDTO toResponse(EmailLogEntity audit) {
        return EmailResponseDTO.builder()
                .auditId(audit.getId())
                .status(audit.getStatus())
                .provider(audit.getProvider())
                .messageId(audit.getMessageId())
                .errorMessage(audit.getErrorMessage())
                .sentAt(audit.getSentAt())
                .build();
    }
}
