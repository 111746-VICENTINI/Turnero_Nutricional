package nutricentro.services;

import nutricentro.entities.AppointmentEntity;
import nutricentro.enums.AppointmentStatus;

import java.time.LocalDate;
import java.time.LocalTime;

/** Captura el estado previo de un turno para comparar cambios. */
public record AppointmentSnapshot(Long appointmentId,
                                  AppointmentStatus status,
                                  LocalDate date,
                                  LocalTime time,
                                  Long professionalId,
                                  Long patientId,
                                  Long secretaryId,
                                  String reason) {

    /** Crea una captura a partir de la entidad de turno actual. */
    public static AppointmentSnapshot from(AppointmentEntity appointment) {
        return new AppointmentSnapshot(
                appointment.getId(),
                appointment.getStatus(),
                appointment.getDate(),
                appointment.getTime(),
                appointment.getProfessional() != null ? appointment.getProfessional().getId() : null,
                appointment.getPatient() != null ? appointment.getPatient().getId() : null,
                appointment.getSecretary() != null ? appointment.getSecretary().getId() : null,
                appointment.getReason()
        );
    }
}
