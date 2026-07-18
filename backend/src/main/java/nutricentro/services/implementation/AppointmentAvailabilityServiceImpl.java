package nutricentro.services.implementation;

import lombok.RequiredArgsConstructor;
import nutricentro.entities.AppointmentEntity;
import nutricentro.entities.ProfessionalAvailabilityExceptionEntity;
import nutricentro.entities.ProfessionalScheduleBreakEntity;
import nutricentro.entities.ProfessionalScheduleEntity;
import nutricentro.enums.AppointmentModality;
import nutricentro.enums.AvailabilityExceptionType;
import nutricentro.enums.PersonStatus;
import nutricentro.exception.ApiException;
import nutricentro.repositories.AppointmentRepository;
import nutricentro.repositories.ProfessionalAvailabilityExceptionRepository;
import nutricentro.repositories.ProfessionalScheduleBreakRepository;
import nutricentro.repositories.ProfessionalScheduleRepository;
import nutricentro.services.AppointmentAvailabilityCriteria;
import nutricentro.services.AppointmentAvailabilityService;
import nutricentro.services.AppointmentStateMachine;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
/** Implementa el cálculo de horarios disponibles y validación de conflictos. */
public class AppointmentAvailabilityServiceImpl implements AppointmentAvailabilityService {

    private final ProfessionalScheduleRepository scheduleRepository;
    private final ProfessionalScheduleBreakRepository scheduleBreakRepository;
    private final ProfessionalAvailabilityExceptionRepository availabilityExceptionRepository;
    private final AppointmentRepository appointmentRepository;
    private final AppointmentStateMachine appointmentStateMachine;

    @Override
    @Transactional(readOnly = true)
    /** Obtiene los slots disponibles para un profesional en una fecha. */
    public List<LocalTime> getAvailableSlots(Long professionalId,
                                             LocalDate date,
                                             AppointmentModality modality,
                                             String locationKey,
                                             Integer durationMinutes) {
        if (date == null || date.isBefore(LocalDate.now())) {
            return List.of();
        }

        AvailabilityContext context = buildContext(professionalId, date, modality, locationKey);
        if (context.blocks().isEmpty() || context.hasFullDayBlock()) {
            return List.of();
        }

        List<AppointmentEntity> appointments = findProfessionalAppointments(professionalId, date);
        int activeAppointments = appointments.size();
        List<LocalTime> slots = new ArrayList<>();

        for (AvailabilityBlock block : context.blocks()) {
            if (hasReachedDailyLimit(block, activeAppointments)) {
                continue;
            }

            int duration = resolveDuration(durationMinutes, block);
            int step = duration + Math.max(block.bufferMinutes(), 0);
            LocalTime current = block.startTime();

            while (!current.plusMinutes(duration).isAfter(block.endTime())) {
                if (isFutureSlot(date, current)
                        && isAlignedWithBlock(block, current, duration)
                        && isTimeRangeAvailable(current, duration, context, appointments, null)) {
                    slots.add(current);
                }
                current = current.plusMinutes(step);
            }
        }

        return slots.stream()
                .distinct()
                .sorted()
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    /** Valida que el turno solicitado respete disponibilidad y conflictos. */
    public void validateAvailability(AppointmentAvailabilityCriteria criteria) {
        if (criteria.date() == null || criteria.time() == null) {
            throw new ApiException("La fecha y hora del turno son obligatorias", HttpStatus.BAD_REQUEST.value());
        }
        if (!LocalDateTime.of(criteria.date(), criteria.time()).isAfter(LocalDateTime.now())) {
            throw new ApiException(
                    "La fecha y hora del turno deben ser futuras",
                    HttpStatus.BAD_REQUEST.value()
            );
        }

        AvailabilityContext context = buildContext(
                criteria.professionalId(),
                criteria.date(),
                criteria.modality(),
                criteria.locationKey()
        );
        if (context.hasFullDayBlock()) {
            throw new ApiException(
                    "No existen horarios disponibles para la fecha seleccionada.",
                    HttpStatus.BAD_REQUEST.value()
            );
        }

        AvailabilityBlock block = context.blocks().stream()
                .filter(candidate -> isSlotInBlock(candidate, criteria.time(), criteria.durationMinutes()))
                .findFirst()
                .orElseThrow(() -> new ApiException(
                        "No existen horarios disponibles para la fecha y horario seleccionados.",
                        HttpStatus.BAD_REQUEST.value()
                ));

        int duration = resolveDuration(criteria.durationMinutes(), block);
        List<AppointmentEntity> professionalAppointments = findProfessionalAppointments(criteria.professionalId(), criteria.date());
        if (hasReachedDailyLimit(block, professionalAppointments.size())) {
            throw new ApiException(
                    "El profesional alcanz\u00f3 el m\u00e1ximo diario de pacientes para esa fecha.",
                    HttpStatus.CONFLICT.value()
            );
        }
        if (!isTimeRangeAvailable(
                criteria.time(),
                duration,
                context,
                professionalAppointments,
                criteria.appointmentId()
        )) {
            throw new ApiException(
                    "Ya existe un turno para el profesional en ese horario.",
                    HttpStatus.CONFLICT.value()
            );
        }

        if (criteria.patientId() != null) {
            validatePatientAvailability(criteria, duration);
        }
    }

    private AvailabilityContext buildContext(Long professionalId,
                                             LocalDate date,
                                             AppointmentModality modality,
                                             String locationKey) {
        List<ProfessionalAvailabilityExceptionEntity> exceptions = availabilityExceptionRepository
                .findActiveForProfessionalAndDate(professionalId, date, PersonStatus.ACTIVE);

        boolean fullDayBlock = exceptions.stream().anyMatch(this::isFullDayBlock);
        List<ProfessionalAvailabilityExceptionEntity> specialHours = exceptions.stream()
                .filter(exception -> exception.getType() == AvailabilityExceptionType.SPECIAL_HOURS)
                .filter(exception -> exception.getStartTime() != null && exception.getEndTime() != null)
                .toList();

        List<AvailabilityBlock> blocks = specialHours.isEmpty()
                ? regularBlocks(professionalId, date, modality, locationKey)
                : specialHours.stream().map(this::toBlock).toList();

        List<AvailabilityBlock> filteredBlocks = blocks.stream()
                .filter(block -> supportsModality(block.modality(), modality))
                .filter(block -> supportsLocation(block.locationKey(), locationKey))
                .sorted(Comparator.comparing(AvailabilityBlock::startTime))
                .toList();

        List<TimeRange> recurringBreaks = recurringBreaks(filteredBlocks);
        List<TimeRange> exceptionBlocks = exceptions.stream()
                .filter(this::isTimedBlock)
                .map(exception -> new TimeRange(exception.getStartTime(), exception.getEndTime()))
                .toList();

        return new AvailabilityContext(filteredBlocks, recurringBreaks, exceptionBlocks, fullDayBlock);
    }

    private List<AvailabilityBlock> regularBlocks(Long professionalId,
                                                  LocalDate date,
                                                  AppointmentModality modality,
                                                  String locationKey) {
        return scheduleRepository.findByProfessionalIdAndDayOfWeekAndStatus(
                        professionalId,
                        date.getDayOfWeek(),
                        PersonStatus.ACTIVE
                ).stream()
                .map(this::toBlock)
                .filter(block -> supportsModality(block.modality(), modality))
                .filter(block -> supportsLocation(block.locationKey(), locationKey))
                .toList();
    }

    private List<TimeRange> recurringBreaks(List<AvailabilityBlock> blocks) {
        List<Long> scheduleIds = blocks.stream()
                .map(AvailabilityBlock::scheduleId)
                .filter(Objects::nonNull)
                .toList();
        if (scheduleIds.isEmpty()) {
            return List.of();
        }

        return scheduleBreakRepository.findByScheduleIdInAndStatus(scheduleIds, PersonStatus.ACTIVE)
                .stream()
                .map(this::toRange)
                .toList();
    }

    private void validatePatientAvailability(AppointmentAvailabilityCriteria criteria, int requestedDuration) {
        boolean patientConflict = appointmentRepository
                .findByPatientIdAndDateAndStatusNotIn(
                        criteria.patientId(),
                        criteria.date(),
                        appointmentStateMachine.getNonBlockingStatuses()
                )
                .stream()
                .filter(other -> !Objects.equals(other.getId(), criteria.appointmentId()))
                .anyMatch(other -> overlaps(criteria.time(), requestedDuration, other));
        if (patientConflict) {
            throw new ApiException(
                    "El paciente ya posee un turno en ese horario.",
                    HttpStatus.CONFLICT.value()
            );
        }
    }

    private boolean isTimeRangeAvailable(LocalTime start,
                                         int duration,
                                         AvailabilityContext context,
                                         List<AppointmentEntity> appointments,
                                         Long ignoredAppointmentId) {
        LocalTime end = start.plusMinutes(duration);
        boolean blockedByBreak = overlapsAny(start, end, context.recurringBreaks())
                || overlapsAny(start, end, context.exceptionBlocks());
        if (blockedByBreak) {
            return false;
        }

        return appointments.stream()
                .filter(other -> !Objects.equals(other.getId(), ignoredAppointmentId))
                .noneMatch(other -> overlaps(start, duration, other, context.blocks()));
    }

    private List<AppointmentEntity> findProfessionalAppointments(Long professionalId, LocalDate date) {
        return appointmentRepository.findByProfessionalIdAndDateAndStatusNotIn(
                professionalId,
                date,
                appointmentStateMachine.getNonBlockingStatuses()
        );
    }

    private boolean overlaps(LocalTime requestedStart, int requestedDuration, AppointmentEntity other) {
        int otherDuration = resolveAppointmentDuration(other, requestedDuration);
        return overlaps(requestedStart, requestedDuration, other.getTime(), otherDuration);
    }

    private boolean overlaps(LocalTime requestedStart,
                             int requestedDuration,
                             AppointmentEntity other,
                             List<AvailabilityBlock> blocks) {
        int otherDuration = resolveAppointmentDuration(other, blocks, requestedDuration);
        return overlaps(requestedStart, requestedDuration, other.getTime(), otherDuration);
    }

    private boolean overlaps(LocalTime requestedStart,
                             int requestedDuration,
                             LocalTime otherStart,
                             int otherDuration) {
        LocalTime requestedEnd = requestedStart.plusMinutes(requestedDuration);
        LocalTime otherEnd = otherStart.plusMinutes(otherDuration);
        return requestedStart.isBefore(otherEnd) && otherStart.isBefore(requestedEnd);
    }

    private int resolveAppointmentDuration(AppointmentEntity appointment, int fallbackDuration) {
        Integer durationByType = durationByFeeType(appointment.getFeeType());
        if (durationByType != null) {
            return durationByType;
        }
        return buildContext(appointment.getProfessional().getId(), appointment.getDate(), null, null).blocks().stream()
                .filter(block -> isSlotInBlock(block, appointment.getTime(), null))
                .map(this::resolveDuration)
                .findFirst()
                .orElse(fallbackDuration);
    }

    private int resolveAppointmentDuration(AppointmentEntity appointment,
                                           List<AvailabilityBlock> blocks,
                                           int fallbackDuration) {
        Integer durationByType = durationByFeeType(appointment.getFeeType());
        if (durationByType != null) {
            return durationByType;
        }
        return blocks.stream()
                .filter(block -> isSlotInBlock(block, appointment.getTime(), null))
                .map(this::resolveDuration)
                .findFirst()
                .orElse(fallbackDuration);
    }

    private Integer durationByFeeType(String feeType) {
        if (feeType == null) {
            return null;
        }
        return "FIRST".equalsIgnoreCase(feeType) ? 60 : 30;
    }

    private boolean isSlotInBlock(AvailabilityBlock block, LocalTime time, Integer requestedDuration) {
        int duration = resolveDuration(requestedDuration, block);
        if (time.isBefore(block.startTime()) || time.plusMinutes(duration).isAfter(block.endTime())) {
            return false;
        }
        return isAlignedWithBlock(block, time, duration);
    }

    private boolean isAlignedWithBlock(AvailabilityBlock block, LocalTime time, int duration) {
        int step = duration + Math.max(block.bufferMinutes(), 0);
        long offset = Duration.between(block.startTime(), time).toMinutes();
        return offset >= 0 && offset % step == 0;
    }

    private boolean hasReachedDailyLimit(AvailabilityBlock block, int activeAppointments) {
        return block.maxDailyAppointments() != null && activeAppointments >= block.maxDailyAppointments();
    }

    private boolean overlapsAny(LocalTime start, LocalTime end, Collection<TimeRange> ranges) {
        return ranges.stream().anyMatch(range -> start.isBefore(range.end()) && range.start().isBefore(end));
    }

    private boolean isFutureSlot(LocalDate date, LocalTime time) {
        return LocalDateTime.of(date, time).isAfter(LocalDateTime.now());
    }

    private boolean supportsModality(AppointmentModality available, AppointmentModality requested) {
        if (requested == null) {
            return true;
        }
        AppointmentModality effective = available != null ? available : AppointmentModality.HYBRID;
        return effective == AppointmentModality.HYBRID || effective == requested;
    }

    private boolean supportsLocation(String availableLocation, String requestedLocation) {
        if (requestedLocation == null || requestedLocation.isBlank()) {
            return true;
        }
        return availableLocation == null || availableLocation.isBlank()
                || availableLocation.equalsIgnoreCase(requestedLocation.trim());
    }

    private boolean isFullDayBlock(ProfessionalAvailabilityExceptionEntity exception) {
        return exception.getType() != AvailabilityExceptionType.SPECIAL_HOURS
                && (exception.getStartTime() == null || exception.getEndTime() == null);
    }

    private boolean isTimedBlock(ProfessionalAvailabilityExceptionEntity exception) {
        return exception.getType() != AvailabilityExceptionType.SPECIAL_HOURS
                && exception.getStartTime() != null
                && exception.getEndTime() != null;
    }

    private int resolveDuration(AvailabilityBlock block) {
        return resolveDuration(null, block);
    }

    private int resolveDuration(Integer requestedDuration, AvailabilityBlock block) {
        return requestedDuration != null ? requestedDuration : block.slotDurationMinutes();
    }

    private AvailabilityBlock toBlock(ProfessionalScheduleEntity schedule) {
        return new AvailabilityBlock(
                schedule.getId(),
                schedule.getStartTime(),
                schedule.getEndTime(),
                schedule.getSlotDurationMinutes(),
                schedule.getBufferMinutes() != null ? schedule.getBufferMinutes() : 0,
                schedule.getMaxDailyAppointments(),
                schedule.getModality() != null ? schedule.getModality() : AppointmentModality.HYBRID,
                schedule.getLocationKey()
        );
    }

    private AvailabilityBlock toBlock(ProfessionalAvailabilityExceptionEntity exception) {
        return new AvailabilityBlock(
                null,
                exception.getStartTime(),
                exception.getEndTime(),
                exception.getSlotDurationMinutes() != null ? exception.getSlotDurationMinutes() : 30,
                exception.getBufferMinutes() != null ? exception.getBufferMinutes() : 0,
                exception.getMaxDailyAppointments(),
                exception.getModality() != null ? exception.getModality() : AppointmentModality.HYBRID,
                exception.getLocationKey()
        );
    }

    private TimeRange toRange(ProfessionalScheduleBreakEntity scheduleBreak) {
        return new TimeRange(scheduleBreak.getStartTime(), scheduleBreak.getEndTime());
    }

    private record AvailabilityContext(
            List<AvailabilityBlock> blocks,
            List<TimeRange> recurringBreaks,
            List<TimeRange> exceptionBlocks,
            boolean hasFullDayBlock
    ) {
    }

    private record AvailabilityBlock(
            Long scheduleId,
            LocalTime startTime,
            LocalTime endTime,
            int slotDurationMinutes,
            int bufferMinutes,
            Integer maxDailyAppointments,
            AppointmentModality modality,
            String locationKey
    ) {
    }

    private record TimeRange(LocalTime start, LocalTime end) {
    }
}
