package nutricentro.services.implementation;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import nutricentro.dtos.professionalSchedule.ProfessionalScheduleRequestDTO;
import nutricentro.dtos.professionalSchedule.ProfessionalScheduleBreakRequestDTO;
import nutricentro.dtos.professionalSchedule.ProfessionalScheduleBreakResponseDTO;
import nutricentro.dtos.professionalSchedule.ProfessionalScheduleResponseDTO;
import nutricentro.dtos.professionalSchedule.ProfessionalScheduleUpdateDTO;
import nutricentro.entities.AppointmentEntity;
import nutricentro.entities.ProfessionalEntity;
import nutricentro.entities.ProfessionalScheduleBreakEntity;
import nutricentro.entities.ProfessionalScheduleEntity;
import nutricentro.enums.AppointmentModality;
import nutricentro.enums.PersonStatus;
import nutricentro.exception.ApiException;
import nutricentro.repositories.AppointmentRepository;
import nutricentro.repositories.ProfessionalRepository;
import nutricentro.repositories.ProfessionalScheduleBreakRepository;
import nutricentro.repositories.ProfessionalScheduleRepository;
import nutricentro.services.AppointmentAvailabilityService;
import nutricentro.services.AppointmentStateMachine;
import nutricentro.services.CurrentProfessionalProvider;
import nutricentro.services.ProfessionalScheduleService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class ProfessionalScheduleServiceImpl implements ProfessionalScheduleService {

    private final ProfessionalScheduleRepository scheduleRepository;
    private final ProfessionalScheduleBreakRepository scheduleBreakRepository;
    private final ProfessionalRepository professionalRepository;
    private final AppointmentRepository appointmentRepository;
    private final AppointmentStateMachine appointmentStateMachine;
    private final AppointmentAvailabilityService appointmentAvailabilityService;
    private final CurrentProfessionalProvider currentProfessionalProvider;

    @Override
    @Transactional
    public ProfessionalScheduleResponseDTO create(ProfessionalScheduleRequestDTO dto) {
        validate(dto.getStartTime(), dto.getEndTime(), dto.getSlotDurationMinutes(),
                dto.getBufferMinutes(), dto.getMaxDailyAppointments());

        Long professionalId = scopedProfessionalId(dto.getProfessionalId());
        ProfessionalEntity professional = professionalRepository.findByIdForUpdate(professionalId)
                .orElseThrow(() -> new EntityNotFoundException("Profesional no encontrado"));
        if (professional.getStatus() != PersonStatus.ACTIVE) {
            throw new ApiException("El profesional no está activo", HttpStatus.CONFLICT.value());
        }

        PersonStatus status = dto.getStatus() != null ? dto.getStatus() : PersonStatus.ACTIVE;
        if (status == PersonStatus.ACTIVE && hasOverlap(
                null,
                professional.getId(),
                dto.getDayOfWeek(),
                dto.getStartTime(),
                dto.getEndTime()
        )) {
            throw new ApiException("Ya existe un horario activo para ese rango", HttpStatus.CONFLICT.value());
        }

        ProfessionalScheduleEntity schedule = scheduleRepository
                .findByProfessionalIdAndDayOfWeekAndStartTime(professional.getId(), dto.getDayOfWeek(), dto.getStartTime())
                .filter(existingSchedule -> existingSchedule.getStatus() == PersonStatus.INACTIVE)
                .orElseGet(ProfessionalScheduleEntity::new);
        schedule.setProfessional(professional);
        schedule.setDayOfWeek(dto.getDayOfWeek());
        schedule.setStartTime(dto.getStartTime());
        schedule.setEndTime(dto.getEndTime());
        schedule.setSlotDurationMinutes(dto.getSlotDurationMinutes());
        schedule.setBufferMinutes(dto.getBufferMinutes() != null ? dto.getBufferMinutes() : 0);
        schedule.setMaxDailyAppointments(dto.getMaxDailyAppointments());
        schedule.setModality(dto.getModality() != null ? dto.getModality() : AppointmentModality.HYBRID);
        schedule.setLocationKey(normalizeLocationKey(dto.getLocationKey()));
        schedule.setStatus(status);

        ProfessionalScheduleEntity savedSchedule = scheduleRepository.save(schedule);
        syncBreaks(savedSchedule, dto.getBreaks());
        return toResponse(savedSchedule);
    }

    @Override
    @Transactional
    public ProfessionalScheduleResponseDTO update(Long id, ProfessionalScheduleUpdateDTO dto) {
        ProfessionalScheduleEntity schedule = findScheduleForUpdate(id);
        validateScheduleScope(schedule);

        LocalTime startTime = dto.getStartTime() != null ? dto.getStartTime() : schedule.getStartTime();
        LocalTime endTime = dto.getEndTime() != null ? dto.getEndTime() : schedule.getEndTime();
        Integer duration = dto.getSlotDurationMinutes() != null
                ? dto.getSlotDurationMinutes()
                : schedule.getSlotDurationMinutes();
        Integer bufferMinutes = dto.getBufferMinutes() != null
                ? dto.getBufferMinutes()
                : schedule.getBufferMinutes();
        Integer maxDailyAppointments = dto.getMaxDailyAppointments() != null
                ? dto.getMaxDailyAppointments()
                : schedule.getMaxDailyAppointments();
        AppointmentModality modality = dto.getModality() != null
                ? dto.getModality()
                : schedule.getModality();
        String locationKey = dto.getLocationKey() != null
                ? normalizeLocationKey(dto.getLocationKey())
                : schedule.getLocationKey();
        DayOfWeek day = dto.getDayOfWeek() != null ? dto.getDayOfWeek() : schedule.getDayOfWeek();
        PersonStatus status = dto.getStatus() != null ? dto.getStatus() : schedule.getStatus();

        validate(startTime, endTime, duration, bufferMinutes, maxDailyAppointments);
        if (scheduleRepository.existsByProfessionalIdAndDayOfWeekAndStartTimeAndIdNot(
                schedule.getProfessional().getId(), day, startTime, schedule.getId())) {
            throw new ApiException("Ya existe un horario para ese profesional, dia e inicio", HttpStatus.CONFLICT.value());
        }
        if (status == PersonStatus.ACTIVE && hasOverlap(schedule.getId(), schedule.getProfessional().getId(), day, startTime, endTime)) {
            throw new ApiException("El horario se superpone con otra franja activa", HttpStatus.CONFLICT.value());
        }

        validateFutureAppointmentsRemainCovered(schedule, day, startTime, endTime, duration, status);

        schedule.setStartTime(startTime);
        schedule.setEndTime(endTime);
        schedule.setSlotDurationMinutes(duration);
        schedule.setBufferMinutes(bufferMinutes != null ? bufferMinutes : 0);
        schedule.setMaxDailyAppointments(maxDailyAppointments);
        schedule.setModality(modality != null ? modality : AppointmentModality.HYBRID);
        schedule.setLocationKey(locationKey);
        schedule.setDayOfWeek(day);
        schedule.setStatus(status);

        ProfessionalScheduleEntity savedSchedule = scheduleRepository.save(schedule);
        if (dto.getBreaks() != null) {
            syncBreaks(savedSchedule, dto.getBreaks());
        }
        return toResponse(savedSchedule);
    }

    @Override
    public ProfessionalScheduleResponseDTO getById(Long id) {
        ProfessionalScheduleEntity schedule = findSchedule(id);
        validateScheduleScope(schedule);
        return toResponse(schedule);
    }

    @Override
    public List<ProfessionalScheduleResponseDTO> getByProfessional(Long professionalId) {
        return scheduleRepository.findByProfessionalId(scopedProfessionalId(professionalId)).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public void delete(Long id) {
        ProfessionalScheduleEntity schedule = findScheduleForUpdate(id);
        validateScheduleScope(schedule);
        if (schedule.getStatus() == PersonStatus.INACTIVE) {
            return;
        }

        validateFutureAppointmentsRemainCovered(schedule, schedule.getDayOfWeek(), schedule.getStartTime(),
                schedule.getEndTime(), schedule.getSlotDurationMinutes(), PersonStatus.INACTIVE);

        schedule.setStatus(PersonStatus.INACTIVE);
        scheduleRepository.save(schedule);
        List<ProfessionalScheduleBreakEntity> activeBreaks = scheduleBreakRepository.findByScheduleIdAndStatus(schedule.getId(), PersonStatus.ACTIVE);
        activeBreaks.forEach(scheduleBreak -> scheduleBreak.setStatus(PersonStatus.INACTIVE));
        scheduleBreakRepository.saveAll(activeBreaks);
    }

    @Override
    public List<LocalTime> getAvailableSlots(Long professionalId, LocalDate date) {
        return getAvailableSlots(professionalId, date, null, null, null);
    }

    @Override
    public List<LocalTime> getAvailableSlots(Long professionalId, LocalDate date, AppointmentModality modality,
                                             String locationKey, Integer durationMinutes) {
        return appointmentAvailabilityService.getAvailableSlots(scopedProfessionalId(professionalId), date, modality, locationKey, durationMinutes);
    }

    @Override
    public Page<ProfessionalScheduleResponseDTO> search(Long professionalId,
                                                        DayOfWeek dayOfWeek,
                                                        PersonStatus status,
                                                        String search,
                                                        Pageable pageable) {
        Specification<ProfessionalScheduleEntity> spec = Specification.allOf(byProfessional(scopedProfessionalId(professionalId)),
                                                        byDay(dayOfWeek), byStatus(status), bySearch(search));

        return scheduleRepository.findAll(spec, pageable).map(this::toResponse);
    }

    private void validateFutureAppointmentsRemainCovered(ProfessionalScheduleEntity changedSchedule,
                                                           DayOfWeek proposedDay,
                                                           LocalTime proposedStart,
                                                           LocalTime proposedEnd,
                                                           int proposedDuration,
                                                           PersonStatus proposedStatus) {
        Long professionalId = changedSchedule.getProfessional().getId();
        List<ProfessionalScheduleEntity> otherActiveSchedules = scheduleRepository
                .findByProfessionalIdAndStatus(professionalId, PersonStatus.ACTIVE)
                .stream()
                .filter(schedule -> !Objects.equals(schedule.getId(), changedSchedule.getId()))
                .toList();

        List<AppointmentEntity> futureAppointments = appointmentRepository
                .findByProfessionalIdAndDateGreaterThanEqualAndStatusNotIn(professionalId, LocalDate.now(),
                        appointmentStateMachine.getNonBlockingStatuses())
                .stream().filter(appointment -> LocalDateTime.of(appointment.getDate(), appointment.getTime())
                        .isAfter(LocalDateTime.now()))
                .filter(appointment -> appointment.getDate().getDayOfWeek() == changedSchedule.getDayOfWeek())
                .filter(appointment -> isSlotInSchedule(changedSchedule, appointment.getTime()))
                .toList();

        for (AppointmentEntity appointment : futureAppointments) {
            Integer durationFromAnotherSchedule = otherActiveSchedules.stream()
                    .filter(schedule -> schedule.getDayOfWeek() == appointment.getDate().getDayOfWeek()
                            && isSlotInSchedule(schedule, appointment.getTime()))
                    .map(ProfessionalScheduleEntity::getSlotDurationMinutes)
                    .findFirst()
                    .orElse(null);
            boolean coveredByProposedSchedule = proposedStatus == PersonStatus.ACTIVE
                    && proposedDay == appointment.getDate().getDayOfWeek()
                    && isSlotInRange(proposedStart, proposedEnd, proposedDuration, appointment.getTime());

            if (durationFromAnotherSchedule == null && !coveredByProposedSchedule) {
                throw new ApiException(
                        "El cambio deja fuera de agenda el turno " + appointment.getId()
                                + " del " + appointment.getDate() + " a las " + appointment.getTime()
                                + ". Reprográmelo o cancélelo antes de modificar el horario.",
                        HttpStatus.CONFLICT.value()
                );
            }

            int effectiveDuration = durationFromAnotherSchedule != null
                    ? durationFromAnotherSchedule
                    : proposedDuration;
            boolean patientOverlap = appointmentRepository
                    .findByPatientIdAndDateAndStatusNotIn(
                            appointment.getPatient().getId(),
                            appointment.getDate(),
                            appointmentStateMachine.getNonBlockingStatuses()
                    ).stream()
                    .filter(other -> !Objects.equals(other.getId(), appointment.getId()))
                    .anyMatch(other -> overlapsPatientAppointment(
                            appointment,
                            effectiveDuration,
                            other
                    ));
            if (patientOverlap) {
                throw new ApiException(
                        "El cambio de duración superpone el turno " + appointment.getId()
                                + " con otro turno del paciente. Reprográmelo antes de modificar el horario.",
                        HttpStatus.CONFLICT.value()
                );
            }
        }
    }

    private boolean overlapsPatientAppointment(AppointmentEntity appointment, int duration, AppointmentEntity other) {
        int otherDuration = scheduleRepository
                .findByProfessionalIdAndDayOfWeekAndStatus(
                        other.getProfessional().getId(),
                        other.getDate().getDayOfWeek(),
                        PersonStatus.ACTIVE
                ).stream()
                .filter(schedule -> isSlotInSchedule(schedule, other.getTime()))
                .map(ProfessionalScheduleEntity::getSlotDurationMinutes)
                .findFirst()
                .orElse(duration);

        LocalTime appointmentEnd = appointment.getTime().plusMinutes(duration);
        LocalTime otherEnd = other.getTime().plusMinutes(otherDuration);
        return appointment.getTime().isBefore(otherEnd)
                && other.getTime().isBefore(appointmentEnd);
    }

    private boolean hasOverlap(Long scheduleId, Long professionalId, DayOfWeek day, LocalTime start, LocalTime end) {
        if (scheduleId == null) {
            return scheduleRepository.existsByProfessionalIdAndDayOfWeekAndStatusAndStartTimeLessThanAndEndTimeGreaterThan(
                            professionalId, day, PersonStatus.ACTIVE, end, start);
        }
        return scheduleRepository.existsOverlappingScheduleExcludingId(scheduleId, professionalId, day, start, end);
    }

    private void validate(LocalTime startTime,
                          LocalTime endTime,
                          Integer duration,
                          Integer bufferMinutes,
                          Integer maxDailyAppointments) {
        if (startTime == null || endTime == null || duration == null) {
            throw new ApiException("El horario y la duración son obligatorios", HttpStatus.BAD_REQUEST.value());
        }
        if (!startTime.isBefore(endTime)) {
            throw new ApiException(
                    "La hora de inicio debe ser anterior a la hora de fin",
                    HttpStatus.BAD_REQUEST.value()
            );
        }
        if (duration < 15) {
            throw new ApiException(
                    "La duración mínima de un turno es de 15 minutos",
                    HttpStatus.BAD_REQUEST.value()
            );
        }
        if (Duration.between(startTime, endTime).toMinutes() < duration) {
            throw new ApiException(
                    "La franja horaria es menor que la duración del turno",
                    HttpStatus.BAD_REQUEST.value()
            );
        }
        if (bufferMinutes != null && bufferMinutes < 0) {
            throw new ApiException(
                    "El tiempo entre turnos no puede ser negativo",
                    HttpStatus.BAD_REQUEST.value()
            );
        }
        if (maxDailyAppointments != null && maxDailyAppointments < 1) {
            throw new ApiException(
                    "El máximo diario de pacientes debe ser mayor a cero",
                    HttpStatus.BAD_REQUEST.value()
            );
        }
    }

    private boolean isSlotInSchedule(ProfessionalScheduleEntity schedule, LocalTime time) {
        return isSlotInRange(schedule.getStartTime(), schedule.getEndTime(), schedule.getSlotDurationMinutes(), time);
    }

    private boolean isSlotInRange(LocalTime start, LocalTime end, int duration, LocalTime time) {
        if (time.isBefore(start) || time.plusMinutes(duration).isAfter(end)) {
            return false;
        }
        return Duration.between(start, time).toMinutes() % duration == 0;
    }

    private void syncBreaks(ProfessionalScheduleEntity schedule, List<ProfessionalScheduleBreakRequestDTO> breaks) {
        List<ProfessionalScheduleBreakRequestDTO> requestedBreaks = breaks != null ? breaks : List.of();
        validateBreaks(schedule, requestedBreaks);

        List<ProfessionalScheduleBreakEntity> existingBreaks = scheduleBreakRepository
                .findByScheduleIdAndStatus(schedule.getId(), PersonStatus.ACTIVE);
        existingBreaks.forEach(scheduleBreak -> scheduleBreak.setStatus(PersonStatus.INACTIVE));
        scheduleBreakRepository.saveAll(existingBreaks);

        List<ProfessionalScheduleBreakEntity> newBreaks = requestedBreaks.stream()
                .map(dto -> {
                    ProfessionalScheduleBreakEntity scheduleBreak = new ProfessionalScheduleBreakEntity();
                    scheduleBreak.setSchedule(schedule);
                    scheduleBreak.setStartTime(dto.getStartTime());
                    scheduleBreak.setEndTime(dto.getEndTime());
                    scheduleBreak.setStatus(PersonStatus.ACTIVE);
                    return scheduleBreak;
                })
                .toList();
        scheduleBreakRepository.saveAll(newBreaks);
    }

    private void validateBreaks(ProfessionalScheduleEntity schedule, List<ProfessionalScheduleBreakRequestDTO> breaks) {
        for (ProfessionalScheduleBreakRequestDTO scheduleBreak : breaks) {
            if (scheduleBreak.getStartTime() == null || scheduleBreak.getEndTime() == null) {
                throw new ApiException("El inicio y fin de la pausa son obligatorios", HttpStatus.BAD_REQUEST.value());
            }
            if (!scheduleBreak.getStartTime().isBefore(scheduleBreak.getEndTime())) {
                throw new ApiException("La pausa debe tener inicio anterior al fin", HttpStatus.BAD_REQUEST.value());
            }
            if (scheduleBreak.getStartTime().isBefore(schedule.getStartTime())
                    || scheduleBreak.getEndTime().isAfter(schedule.getEndTime())) {
                throw new ApiException("La pausa debe estar dentro de la franja horaria", HttpStatus.BAD_REQUEST.value());
            }
        }

        for (int i = 0; i < breaks.size(); i++) {
            for (int j = i + 1; j < breaks.size(); j++) {
                ProfessionalScheduleBreakRequestDTO first = breaks.get(i);
                ProfessionalScheduleBreakRequestDTO second = breaks.get(j);
                if (first.getStartTime().isBefore(second.getEndTime())
                        && second.getStartTime().isBefore(first.getEndTime())) {
                    throw new ApiException("Las pausas no pueden superponerse", HttpStatus.BAD_REQUEST.value());
                }
            }
        }
    }

    private ProfessionalScheduleEntity findSchedule(Long id) {
        return scheduleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Horario no encontrado"));
    }

    private ProfessionalScheduleEntity findScheduleForUpdate(Long id) {
        return scheduleRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new EntityNotFoundException("Horario no encontrado"));
    }

    private Long scopedProfessionalId(Long requestedProfessionalId) {
        return currentProfessionalProvider != null && currentProfessionalProvider.isProfessional()
                ? currentProfessionalProvider.requireCurrentProfessionalId()
                : requestedProfessionalId;
    }

    private void validateScheduleScope(ProfessionalScheduleEntity schedule) {
        if (currentProfessionalProvider == null || !currentProfessionalProvider.isProfessional()) {
            return;
        }
        Long currentProfessionalId = currentProfessionalProvider.requireCurrentProfessionalId();
        if (schedule.getProfessional() == null || !currentProfessionalId.equals(schedule.getProfessional().getId())) {
            throw new EntityNotFoundException("Horario no encontrado");
        }
    }

    private ProfessionalScheduleResponseDTO toResponse(ProfessionalScheduleEntity schedule) {
        return ProfessionalScheduleResponseDTO.builder()
                .id(schedule.getId())
                .professionalId(schedule.getProfessional().getId())
                .dayOfWeek(schedule.getDayOfWeek())
                .status(schedule.getStatus())
                .slotDurationMinutes(schedule.getSlotDurationMinutes())
                .bufferMinutes(schedule.getBufferMinutes() != null ? schedule.getBufferMinutes() : 0)
                .maxDailyAppointments(schedule.getMaxDailyAppointments())
                .modality(schedule.getModality() != null ? schedule.getModality() : AppointmentModality.HYBRID)
                .locationKey(schedule.getLocationKey())
                .breaks(toBreakResponses(schedule))
                .startTime(schedule.getStartTime())
                .endTime(schedule.getEndTime())
                .professionalName(
                        schedule.getProfessional().getFirstName()
                                + " "
                                + schedule.getProfessional().getLastName()
                )
                .build();
    }

    private String normalizeLocationKey(String locationKey) {
        return locationKey == null || locationKey.isBlank() ? null : locationKey.trim();
    }

    private List<ProfessionalScheduleBreakResponseDTO> toBreakResponses(ProfessionalScheduleEntity schedule) {
        if (schedule.getId() == null) {
            return List.of();
        }
        return scheduleBreakRepository.findByScheduleIdAndStatus(schedule.getId(), PersonStatus.ACTIVE)
                .stream()
                .map(scheduleBreak -> ProfessionalScheduleBreakResponseDTO.builder()
                        .id(scheduleBreak.getId())
                        .startTime(scheduleBreak.getStartTime())
                        .endTime(scheduleBreak.getEndTime())
                        .build()
                )
                .toList();
    }

    private Specification<ProfessionalScheduleEntity> byProfessional(Long professionalId) {
        return (root, query, cb) -> professionalId == null
                ? cb.conjunction()
                : cb.equal(root.get("professional").get("id"), professionalId);
    }

    private Specification<ProfessionalScheduleEntity> byDay(DayOfWeek day) {
        return (root, query, cb) -> day == null
                ? cb.conjunction()
                : cb.equal(root.get("dayOfWeek"), day);
    }

    private Specification<ProfessionalScheduleEntity> byStatus(PersonStatus status) {
        return (root, query, cb) -> status == null
                ? cb.conjunction()
                : cb.equal(root.get("status"), status);
    }

    private Specification<ProfessionalScheduleEntity> bySearch(String search) {
        return (root, query, cb) -> {
            if (search == null || search.isBlank()) {
                return cb.conjunction();
            }

            String pattern = "%" + search.trim().toLowerCase() + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("professional").get("firstName")), pattern),
                    cb.like(cb.lower(root.get("professional").get("lastName")), pattern)
            );
        };
    }
}
