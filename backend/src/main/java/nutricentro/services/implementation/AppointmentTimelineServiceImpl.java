package nutricentro.services.implementation;

import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import nutricentro.dtos.appointments.AppointmentTimelineEventResponseDTO;
import nutricentro.entities.AppointmentEntity;
import nutricentro.entities.AppointmentTimelineEventEntity;
import nutricentro.enums.AppointmentEventType;
import nutricentro.enums.AppointmentStatus;
import nutricentro.repositories.AppointmentRepository;
import nutricentro.repositories.AppointmentTimelineEventRepository;
import nutricentro.services.AppointmentSnapshot;
import nutricentro.services.AppointmentTimelineService;
import nutricentro.services.CurrentUserContext;
import nutricentro.services.CurrentUserProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
/** Implementa el registro persistido del timeline funcional de turnos. */
public class AppointmentTimelineServiceImpl implements AppointmentTimelineService {

    private final AppointmentTimelineEventRepository timelineRepository;
    private final AppointmentRepository appointmentRepository;
    private final CurrentUserProvider currentUserProvider;
    private final EntityManager entityManager;

    @Override
    /** Registra el evento de creación del turno. */
    public void recordCreation(AppointmentEntity appointment) {
        saveEvent(
                appointment,
                AppointmentEventType.APPOINTMENT_CREATED,
                null,
                appointment.getStatus(),
                appointment.getReason(),
                "Turno creado"
        );
    }

    @Override
    /** Registra cambios importantes detectados en un turno. */
    public void recordChanges(AppointmentSnapshot previous, AppointmentEntity current) {
        List<AppointmentTimelineEventEntity> events = new ArrayList<>();
        CurrentUserContext user = currentUserProvider.getCurrentUser();

        if (!Objects.equals(previous.status(), current.getStatus())) {
            events.add(buildEvent(
                    current,
                    eventTypeForStatus(current.getStatus()),
                    previous.status(),
                    current.getStatus(),
                    current.getReason(),
                    "Estado actualizado: " + previous.status() + " -> " + current.getStatus(),
                    user
            ));
        }

        if (!Objects.equals(previous.professionalId(), current.getProfessional().getId())) {
            events.add(buildEvent(
                    current,
                    AppointmentEventType.PROFESSIONAL_CHANGED,
                    previous.status(),
                    current.getStatus(),
                    current.getReason(),
                    "Profesional actualizado: " + previous.professionalId()
                            + " -> " + current.getProfessional().getId(),
                    user
            ));
        }

        if (!Objects.equals(previous.date(), current.getDate())) {
            events.add(buildEvent(
                    current,
                    AppointmentEventType.DATE_CHANGED,
                    previous.status(),
                    current.getStatus(),
                    current.getReason(),
                    "Fecha actualizada: " + previous.date() + " -> " + current.getDate(),
                    user
            ));
        }

        if (!Objects.equals(previous.time(), current.getTime())) {
            events.add(buildEvent(
                    current,
                    AppointmentEventType.TIME_CHANGED,
                    previous.status(),
                    current.getStatus(),
                    current.getReason(),
                    "Horario actualizado: " + previous.time() + " -> " + current.getTime(),
                    user
            ));
        }

        if (isImportantGeneralUpdate(previous, current)) {
            events.add(buildEvent(
                    current,
                    AppointmentEventType.APPOINTMENT_UPDATED,
                    previous.status(),
                    current.getStatus(),
                    current.getReason(),
                    "Datos generales del turno actualizados",
                    user
            ));
        }

        if (!events.isEmpty()) {
            timelineRepository.saveAll(events);
        }
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    /** Registra el resultado del primer mensaje de WhatsApp. */
    public void recordWhatsAppMessageResult(AppointmentEntity appointment, boolean sent, String observations) {
        saveEvent(
                appointment,
                sent ? AppointmentEventType.WHATSAPP_MESSAGE_SENT : AppointmentEventType.WHATSAPP_MESSAGE_FAILED,
                appointment.getStatus(),
                appointment.getStatus(),
                appointment.getReason(),
                observations
        );
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    /** Registra el resultado del recordatorio por WhatsApp. */
    public void recordWhatsAppReminderResult(AppointmentEntity appointment, boolean sent, String observations) {
        saveEvent(
                appointment,
                sent ? AppointmentEventType.WHATSAPP_REMINDER_SENT : AppointmentEventType.WHATSAPP_REMINDER_FAILED,
                appointment.getStatus(),
                appointment.getStatus(),
                appointment.getReason(),
                observations
        );
    }

    @Override
    /** Registra una respuesta recibida por WhatsApp. */
    public void recordWhatsAppResponse(AppointmentEntity appointment, AppointmentEventType eventType, String response) {
        saveEvent(
                appointment,
                eventType,
                appointment.getStatus(),
                appointment.getStatus(),
                appointment.getReason(),
                "Respuesta WhatsApp recibida: " + response
        );
    }

    @Override
    @Transactional(readOnly = true)
    /** Obtiene los eventos del timeline en orden cronológico. */
    public List<AppointmentTimelineEventResponseDTO> getTimeline(Long appointmentId) {
        if (!appointmentRepository.existsById(appointmentId)) {
            throw new EntityNotFoundException("Turno no encontrado");
        }
        return timelineRepository.findByAppointmentIdOrderByOccurredAtAscIdAsc(appointmentId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private void saveEvent(AppointmentEntity appointment,
                           AppointmentEventType eventType,
                           AppointmentStatus previousStatus,
                           AppointmentStatus newStatus,
                           String reason,
                           String observations) {
        timelineRepository.save(buildEvent(
                appointment,
                eventType,
                previousStatus,
                newStatus,
                reason,
                observations,
                currentUserProvider.getCurrentUser()
        ));
    }

    private AppointmentTimelineEventEntity buildEvent(AppointmentEntity appointment,
                                                      AppointmentEventType eventType,
                                                      AppointmentStatus previousStatus,
                                                      AppointmentStatus newStatus,
                                                      String reason,
                                                      String observations,
                                                      CurrentUserContext user) {
        LocalDateTime occurredAt = LocalDateTime.now();
        boolean notificationRequested = requiresNotification(eventType);

        AppointmentTimelineEventEntity event = new AppointmentTimelineEventEntity();
        event.setAppointment(appointmentReference(appointment));
        event.setOccurredAt(occurredAt);
        event.setResponsibleUserId(user.userId());
        event.setResponsibleUsername(user.username());
        event.setResponsibleRole(user.role());
        event.setEventType(eventType);
        event.setPreviousStatus(previousStatus);
        event.setNewStatus(newStatus);
        event.setReason(reason);
        event.setObservations(observations);
        event.setNotificationRequested(notificationRequested);
        event.setNotificationRequestedAt(notificationRequested ? occurredAt : null);
        return event;
    }

    private AppointmentEntity appointmentReference(AppointmentEntity appointment) {
        if (appointment == null || appointment.getId() == null) {
            throw new IllegalArgumentException("El evento de timeline requiere un turno persistido");
        }
        return entityManager.getReference(AppointmentEntity.class, appointment.getId());
    }

    private boolean requiresNotification(AppointmentEventType eventType) {
        return switch (eventType) {
            case APPOINTMENT_CREATED,
                 APPOINTMENT_CONFIRMED,
                 APPOINTMENT_CANCELED,
                 APPOINTMENT_REJECTED,
                 APPOINTMENT_PATIENT_PRESENT,
                 APPOINTMENT_ABSENT,
                 APPOINTMENT_COMPLETED,
                 APPOINTMENT_RESCHEDULED,
                 STATUS_CHANGED -> true;
            default -> false;
        };
    }

    private AppointmentEventType eventTypeForStatus(AppointmentStatus status) {
        return switch (status) {
            case CONFIRMED -> AppointmentEventType.APPOINTMENT_CONFIRMED;
            case CANCELED -> AppointmentEventType.APPOINTMENT_CANCELED;
            case REJECTED -> AppointmentEventType.APPOINTMENT_REJECTED;
            case PATIENT_PRESENT -> AppointmentEventType.APPOINTMENT_PATIENT_PRESENT;
            case ABSENT -> AppointmentEventType.APPOINTMENT_ABSENT;
            case COMPLETED -> AppointmentEventType.APPOINTMENT_COMPLETED;
            case RESCHEDULED -> AppointmentEventType.APPOINTMENT_RESCHEDULED;
            default -> AppointmentEventType.STATUS_CHANGED;
        };
    }

    private boolean isImportantGeneralUpdate(AppointmentSnapshot previous, AppointmentEntity current) {
        Long currentPatientId = current.getPatient() != null ? current.getPatient().getId() : null;
        Long currentSecretaryId = current.getSecretary() != null ? current.getSecretary().getId() : null;
        return !Objects.equals(previous.reason(), current.getReason())
                || !Objects.equals(previous.patientId(), currentPatientId)
                || !Objects.equals(previous.secretaryId(), currentSecretaryId);
    }

    private AppointmentTimelineEventResponseDTO toResponse(AppointmentTimelineEventEntity event) {
        return AppointmentTimelineEventResponseDTO.builder()
                .id(event.getId())
                .appointmentId(event.getAppointment().getId())
                .occurredAt(event.getOccurredAt())
                .responsibleUserId(event.getResponsibleUserId())
                .responsibleUsername(event.getResponsibleUsername())
                .responsibleRole(event.getResponsibleRole())
                .eventType(event.getEventType())
                .previousStatus(event.getPreviousStatus())
                .newStatus(event.getNewStatus())
                .reason(event.getReason())
                .observations(event.getObservations())
                .notificationRequested(event.getNotificationRequested())
                .notificationRequestedAt(event.getNotificationRequestedAt())
                .build();
    }
}
