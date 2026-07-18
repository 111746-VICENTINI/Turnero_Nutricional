package nutricentro.services.implementation;

import nutricentro.enums.AppointmentStatus;
import nutricentro.exception.ApiException;
import nutricentro.services.AppointmentStateMachine;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Collection;
import java.util.Collections;
import java.util.EnumMap;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
/** Implementa la tabla de transiciones válidas de los turnos. */
public class AppointmentStateMachineImpl implements AppointmentStateMachine {

    private static final Set<AppointmentStatus> CREATION_STATUSES = Collections.unmodifiableSet(EnumSet.of(
            AppointmentStatus.PENDING,
            AppointmentStatus.CONFIRMED
    ));
    private static final Set<AppointmentStatus> TERMINAL_STATUSES = Collections.unmodifiableSet(EnumSet.of(
            AppointmentStatus.COMPLETED,
            AppointmentStatus.CANCELED,
            AppointmentStatus.REJECTED,
            AppointmentStatus.ABSENT
    ));
    private static final Set<AppointmentStatus> ACTIVE_STATUSES = Collections.unmodifiableSet(EnumSet.of(
            AppointmentStatus.PENDING,
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.RESCHEDULED,
            AppointmentStatus.PATIENT_PRESENT
    ));
    private static final List<AppointmentStatus> NON_BLOCKING_STATUSES = List.of(
            AppointmentStatus.CANCELED,
            AppointmentStatus.REJECTED,
            AppointmentStatus.ABSENT
    );
    private static final Map<AppointmentStatus, Set<AppointmentStatus>> ALLOWED_TRANSITIONS = buildTransitions();

    @Override
    /** Resuelve el estado inicial permitido para crear turnos. */
    public AppointmentStatus resolveCreationStatus(AppointmentStatus requestedStatus) {
        AppointmentStatus status = requestedStatus != null ? requestedStatus : AppointmentStatus.PENDING;
        if (!CREATION_STATUSES.contains(status)) {
            throw new ApiException(
                    "Un turno nuevo solo puede crearse como PENDIENTE o CONFIRMADO",
                    HttpStatus.BAD_REQUEST.value()
            );
        }
        return status;
    }

    @Override
    /** Resuelve el estado final de una actualización de turno. */
    public AppointmentStatus resolveUpdateStatus(AppointmentStatus currentStatus,
                                                 AppointmentStatus requestedStatus,
                                                 boolean scheduleChanged,
                                                 LocalDate currentDate,
                                                 LocalTime currentTime) {
        if (currentStatus == AppointmentStatus.ABSENT && requestedStatus == AppointmentStatus.PATIENT_PRESENT) {
            validateTransition(currentStatus, requestedStatus, currentDate, currentTime);
            return requestedStatus;
        }

        if (isTerminal(currentStatus)) {
            throw new ApiException(
                    "No se puede modificar un turno finalizado, cancelado, rechazado o ausente",
                    HttpStatus.CONFLICT.value()
            );
        }

        AppointmentStatus targetStatus = requestedStatus != null ? requestedStatus : currentStatus;
        if (scheduleChanged) {
            validateReschedule(targetStatus);
            targetStatus = AppointmentStatus.RESCHEDULED;
        }

        validateTransition(currentStatus, targetStatus, currentDate, currentTime);
        return targetStatus;
    }

    @Override
    /** Valida la cancelación de un turno. */
    public void validateCancellation(AppointmentStatus currentStatus, LocalDate date, LocalTime time) {
        if (currentStatus == AppointmentStatus.COMPLETED
                || currentStatus == AppointmentStatus.REJECTED
                || currentStatus == AppointmentStatus.ABSENT) {
            throw new ApiException(
                    "No se puede cancelar un turno finalizado, rechazado o ausente",
                    HttpStatus.CONFLICT.value()
            );
        }
        validateTransition(currentStatus, AppointmentStatus.CANCELED, date, time);
    }

    @Override
    /** Valida una transición entre estados del turno. */
    public void validateTransition(AppointmentStatus currentStatus,
                                   AppointmentStatus targetStatus,
                                   LocalDate date,
                                   LocalTime time) {
        if (currentStatus == targetStatus) {
            validateTemporalRules(targetStatus, date, time);
            return;
        }

        Set<AppointmentStatus> allowedTargets = ALLOWED_TRANSITIONS.getOrDefault(currentStatus, Set.of());
        if (!allowedTargets.contains(targetStatus)) {
            throw new ApiException(
                    "Transición de estado inválida: " + currentStatus + " -> " + targetStatus,
                    HttpStatus.CONFLICT.value()
            );
        }

        validateTemporalRules(targetStatus, date, time);
    }

    @Override
    /** Indica si un estado sigue ocupando la agenda. */
    public boolean isActive(AppointmentStatus status) {
        return ACTIVE_STATUSES.contains(status);
    }

    @Override
    /** Indica si un estado ya no admite cambios. */
    public boolean isTerminal(AppointmentStatus status) {
        return TERMINAL_STATUSES.contains(status);
    }

    @Override
    /** Devuelve estados que no bloquean nuevos turnos. */
    public Collection<AppointmentStatus> getNonBlockingStatuses() {
        return NON_BLOCKING_STATUSES;
    }

    private void validateReschedule(AppointmentStatus requestedStatus) {
        if (isTerminal(requestedStatus)) {
            throw new ApiException(
                    "No se puede reprogramar y finalizar/cancelar el turno en la misma operación",
                    HttpStatus.BAD_REQUEST.value()
            );
        }
    }

    private void validateTemporalRules(AppointmentStatus targetStatus, LocalDate date, LocalTime time) {
        LocalDateTime appointmentDateTime = LocalDateTime.of(date, time);
        if (targetStatus == AppointmentStatus.CANCELED && !appointmentDateTime.isAfter(LocalDateTime.now())) {
            throw new ApiException(
                    "No se puede cancelar un turno que ya ocurrió",
                    HttpStatus.BAD_REQUEST.value()
            );
        }
        if (targetStatus == AppointmentStatus.COMPLETED && appointmentDateTime.isAfter(LocalDateTime.now())) {
            throw new ApiException(
                    "No se puede completar un turno que todavía no ocurrió",
                    HttpStatus.BAD_REQUEST.value()
            );
        }
        if (targetStatus == AppointmentStatus.PATIENT_PRESENT && date.isAfter(LocalDate.now())) {
            throw new ApiException(
                    "No se puede marcar presente a un paciente antes del día del turno",
                    HttpStatus.BAD_REQUEST.value()
            );
        }
        if (targetStatus == AppointmentStatus.ABSENT && appointmentDateTime.isAfter(LocalDateTime.now())) {
            throw new ApiException(
                    "No se puede marcar ausente un turno que todavía no ocurrió",
                    HttpStatus.BAD_REQUEST.value()
            );
        }
    }

    private static Map<AppointmentStatus, Set<AppointmentStatus>> buildTransitions() {
        EnumMap<AppointmentStatus, Set<AppointmentStatus>> transitions = new EnumMap<>(AppointmentStatus.class);
        transitions.put(AppointmentStatus.PENDING, EnumSet.of(
                AppointmentStatus.CONFIRMED,
                AppointmentStatus.CANCELED,
                AppointmentStatus.REJECTED,
                AppointmentStatus.RESCHEDULED,
                AppointmentStatus.ABSENT
        ));
        transitions.put(AppointmentStatus.CONFIRMED, EnumSet.of(
                AppointmentStatus.PATIENT_PRESENT,
                AppointmentStatus.CANCELED,
                AppointmentStatus.REJECTED,
                AppointmentStatus.RESCHEDULED,
                AppointmentStatus.ABSENT
        ));
        transitions.put(AppointmentStatus.RESCHEDULED, EnumSet.of(
                AppointmentStatus.CONFIRMED,
                AppointmentStatus.PATIENT_PRESENT,
                AppointmentStatus.CANCELED,
                AppointmentStatus.REJECTED,
                AppointmentStatus.ABSENT
        ));
        transitions.put(AppointmentStatus.PATIENT_PRESENT, EnumSet.of(
                AppointmentStatus.COMPLETED,
                AppointmentStatus.CANCELED
        ));
        transitions.put(AppointmentStatus.COMPLETED, EnumSet.noneOf(AppointmentStatus.class));
        transitions.put(AppointmentStatus.CANCELED, EnumSet.noneOf(AppointmentStatus.class));
        transitions.put(AppointmentStatus.REJECTED, EnumSet.noneOf(AppointmentStatus.class));
        transitions.put(AppointmentStatus.ABSENT, EnumSet.of(
                AppointmentStatus.PATIENT_PRESENT
        ));

        transitions.replaceAll((status, allowedStatuses) -> Collections.unmodifiableSet(allowedStatuses));
        return Collections.unmodifiableMap(transitions);
    }
}
