package nutricentro.services.implementation;

import lombok.RequiredArgsConstructor;
import nutricentro.dtos.followup.PatientFollowUpStatusDTO;
import nutricentro.dtos.notifications.NotificationResponseDTO;
import nutricentro.dtos.notifications.NotificationSummaryDTO;
import nutricentro.entities.NotificationReadEntity;
import nutricentro.enums.FollowUpStatus;
import nutricentro.enums.NotificationType;
import nutricentro.repositories.NotificationReadRepository;
import nutricentro.services.CurrentUserContext;
import nutricentro.services.CurrentUserProvider;
import nutricentro.services.NotificationService;
import nutricentro.services.PatientFollowUpService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private static final String PATIENT_INACTIVITY_PREFIX = "PATIENT_INACTIVITY";

    private final PatientFollowUpService patientFollowUpService;
    private final NotificationReadRepository notificationReadRepository;
    private final CurrentUserProvider currentUserProvider;

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponseDTO> getNotifications() {
        CurrentUserContext currentUser = currentUserProvider.getCurrentUser();
        List<NotificationResponseDTO> generated = generatePatientInactivityNotifications();
        Set<String> readKeys = readKeys(currentUser.userId(), generated);

        generated.forEach(notification -> notification.setRead(readKeys.contains(notification.getKey())));
        return generated;
    }

    @Override
    @Transactional(readOnly = true)
    public NotificationSummaryDTO getSummary() {
        long unreadCount = getNotifications().stream()
                .filter(notification -> !notification.isRead())
                .count();
        return NotificationSummaryDTO.builder()
                .unreadCount(unreadCount)
                .build();
    }

    @Override
    @Transactional
    public void markAsRead(String notificationKey) {
        CurrentUserContext currentUser = currentUserProvider.getCurrentUser();
        notificationReadRepository.findByRecipientUserIdAndNotificationKey(currentUser.userId(), notificationKey)
                .orElseGet(() -> notificationReadRepository.save(newRead(currentUser.userId(), notificationKey)));
    }

    @Override
    @Transactional
    public void markAllAsRead() {
        CurrentUserContext currentUser = currentUserProvider.getCurrentUser();
        getNotifications().stream()
                .filter(notification -> !notification.isRead())
                .map(NotificationResponseDTO::getKey)
                .forEach(key -> notificationReadRepository
                        .findByRecipientUserIdAndNotificationKey(currentUser.userId(), key)
                        .orElseGet(() -> notificationReadRepository.save(newRead(currentUser.userId(), key))));
    }

    private List<NotificationResponseDTO> generatePatientInactivityNotifications() {
        List<PatientFollowUpStatusDTO> inactivePatients = patientFollowUpService.getInactivePatientsForCurrentUser();
        return inactivePatients.stream()
                .map(this::toNotification)
                .toList();
    }

    private NotificationResponseDTO toNotification(PatientFollowUpStatusDTO status) {
        String threshold = thresholdKey(status.getStatus());
        return NotificationResponseDTO.builder()
                .key(PATIENT_INACTIVITY_PREFIX + ":" + status.getPatientId() + ":" + status.getProfessionalId() + ":" + threshold)
                .type(NotificationType.PATIENT_INACTIVITY)
                .title("Seguimiento de paciente")
                .message(buildMessage(status))
                .icon("pi pi-bell")
                .priority(status.getPriority())
                .patientId(status.getPatientId())
                .patientFullName(status.getPatientFullName())
                .professionalId(status.getProfessionalId())
                .professionalFullName(status.getProfessionalFullName())
                .lastConsultationDate(status.getLastConsultationDate())
                .daysSinceLastConsultation(status.getDaysSinceLastConsultation())
                .monthsSinceLastConsultation(status.getMonthsSinceLastConsultation())
                .actionRoute("/medical-history/" + status.getPatientId())
                .build();
    }

    private String buildMessage(PatientFollowUpStatusDTO status) {
        if (status.getStatus() == FollowUpStatus.OVER_ONE_YEAR) {
            return "Paciente " + status.getPatientFullName() + " lleva mas de 1 año sin controles.";
        }
        if (status.getMonthsSinceLastConsultation() != null && status.getMonthsSinceLastConsultation() > 0) {
            return "Paciente " + status.getPatientFullName() + " no realiza un control hace "
                    + status.getMonthsSinceLastConsultation() + " meses.";
        }
        return "Paciente " + status.getPatientFullName() + " no realiza un control hace "
                + status.getDaysSinceLastConsultation() + " dias.";
    }

    private String thresholdKey(FollowUpStatus status) {
        return switch (status) {
            case OVER_ONE_YEAR -> "OVER_ONE_YEAR";
            case OVER_SIX_MONTHS -> "OVER_SIX_MONTHS";
            case OVER_THREE_MONTHS -> "OVER_THREE_MONTHS";
            default -> "ACTIVE";
        };
    }

    private Set<String> readKeys(Long userId, List<NotificationResponseDTO> notifications) {
        if (userId == null || notifications.isEmpty()) {
            return Set.of();
        }

        List<String> keys = notifications.stream()
                .map(NotificationResponseDTO::getKey)
                .toList();
        return new HashSet<>(notificationReadRepository
                .findByRecipientUserIdAndNotificationKeyIn(userId, keys)
                .stream()
                .map(NotificationReadEntity::getNotificationKey)
                .toList());
    }

    private NotificationReadEntity newRead(Long userId, String notificationKey) {
        NotificationReadEntity read = new NotificationReadEntity();
        read.setRecipientUserId(userId);
        read.setNotificationKey(notificationKey);
        read.setType(NotificationType.PATIENT_INACTIVITY);
        read.setReadAt(LocalDateTime.now());
        return read;
    }
}
