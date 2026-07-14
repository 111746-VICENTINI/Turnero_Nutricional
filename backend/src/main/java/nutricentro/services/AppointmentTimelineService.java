package nutricentro.services;

import nutricentro.dtos.appointments.AppointmentTimelineEventResponseDTO;
import nutricentro.entities.AppointmentEntity;
import nutricentro.enums.AppointmentEventType;

import java.util.List;

/** Registra y consulta el historial funcional de un turno. */
public interface AppointmentTimelineService {

    /** Registra la creación de un turno. */
    void recordCreation(AppointmentEntity appointment);

    /** Registra los cambios relevantes entre dos versiones del turno. */
    void recordChanges(AppointmentSnapshot previous, AppointmentEntity current);

    /** Registra el resultado del mensaje inicial de WhatsApp. */
    void recordWhatsAppMessageResult(AppointmentEntity appointment, boolean sent, String observations);

    /** Registra el resultado del recordatorio de WhatsApp. */
    void recordWhatsAppReminderResult(AppointmentEntity appointment, boolean sent, String observations);

    /** Registra una respuesta recibida desde WhatsApp. */
    void recordWhatsAppResponse(AppointmentEntity appointment, AppointmentEventType eventType, String response);

    /** Obtiene el timeline cronológico de un turno. */
    List<AppointmentTimelineEventResponseDTO> getTimeline(Long appointmentId);
}
