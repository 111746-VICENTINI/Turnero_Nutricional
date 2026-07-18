package nutricentro.services;

import nutricentro.enums.AppointmentModality;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/** Calcula y valida la disponibilidad de turnos de un profesional. */
public interface AppointmentAvailabilityService {

    /** Obtiene los horarios disponibles del profesional para una fecha. */
    List<LocalTime> getAvailableSlots(Long professionalId,
                                      LocalDate date,
                                      AppointmentModality modality,
                                      String locationKey,
                                      Integer durationMinutes);

    /** Valida que un turno pueda asignarse sin conflictos. */
    void validateAvailability(AppointmentAvailabilityCriteria criteria);
}
