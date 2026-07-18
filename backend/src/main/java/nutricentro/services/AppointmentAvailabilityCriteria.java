package nutricentro.services;

import nutricentro.enums.AppointmentModality;

import java.time.LocalDate;
import java.time.LocalTime;

/** Agrupa los datos necesarios para validar disponibilidad de un turno. */
public record AppointmentAvailabilityCriteria(
        Long appointmentId,
        Long professionalId,
        Long patientId,
        LocalDate date,
        LocalTime time,
        Integer durationMinutes,
        AppointmentModality modality,
        String locationKey
) {
}
