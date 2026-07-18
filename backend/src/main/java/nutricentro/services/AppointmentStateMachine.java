package nutricentro.services;

import nutricentro.enums.AppointmentStatus;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;

/** Centraliza las reglas de transición de estados de turnos. */
public interface AppointmentStateMachine {

    /** Resuelve y valida el estado permitido para un turno nuevo. */
    AppointmentStatus resolveCreationStatus(AppointmentStatus requestedStatus);

    /** Resuelve y valida el estado resultante de una actualización. */
    AppointmentStatus resolveUpdateStatus(AppointmentStatus currentStatus,
                                          AppointmentStatus requestedStatus,
                                          boolean scheduleChanged,
                                          LocalDate currentDate,
                                          LocalTime currentTime);

    /** Valida si un turno puede cancelarse. */
    void validateCancellation(AppointmentStatus currentStatus, LocalDate date, LocalTime time);

    /** Valida una transición explícita entre estados. */
    void validateTransition(AppointmentStatus currentStatus,
                            AppointmentStatus targetStatus,
                            LocalDate date,
                            LocalTime time);

    /** Indica si el estado mantiene al turno activo para la agenda. */
    boolean isActive(AppointmentStatus status);

    /** Indica si el estado finaliza el ciclo de vida del turno. */
    boolean isTerminal(AppointmentStatus status);

    /** Obtiene estados que no bloquean disponibilidad futura. */
    Collection<AppointmentStatus> getNonBlockingStatuses();
}
