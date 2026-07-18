package nutricentro.services;

import nutricentro.dtos.appointments.AppointmentRequestDTO;
import nutricentro.dtos.appointments.AppointmentResponseDTO;
import nutricentro.dtos.appointments.AppointmentUpdateDTO;
import nutricentro.enums.AppointmentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
/** Gestiona el ciclo de vida de los turnos. */
public interface AppointmentService {
    /** Crea un turno validando disponibilidad y estado inicial. */
    AppointmentResponseDTO createAppointment(AppointmentRequestDTO dto);

    /** Obtiene un turno por identificador. */
    AppointmentResponseDTO getAppointmentById(Long id);

    /** Actualiza datos y estado de un turno existente. */
    AppointmentResponseDTO updateAppointment(Long id, AppointmentUpdateDTO dto);

    /** Cancela lógicamente un turno existente. */
    void deleteAppointment(Long id);

    /** Lista turnos por estado. */
    List<AppointmentResponseDTO> getAppointmentsByStatus(AppointmentStatus status);

    /** Busca turnos aplicando filtros y paginación. */
    Page<AppointmentResponseDTO> searchAppointments(
            AppointmentStatus status,
            LocalDate dateFrom,
            LocalDate dateTo,
            Long patientId,
            Long professionalId,
            Long secretaryId,
            String search,
            Pageable pageable
    );

    /** Procesa una respuesta de texto recibida desde WhatsApp. */
    void handleWhatsAppTextReply(String phone, String text);

    /** Envía recordatorios pendientes según la configuración vigente. */
    void sendDueAppointmentReminders();
}
