package nutricentro.services.implementation;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import nutricentro.dtos.professionalSchedule.ProfessionalScheduleRequestDTO;
import nutricentro.dtos.professionalSchedule.ProfessionalScheduleResponseDTO;
import nutricentro.dtos.professionalSchedule.ProfessionalScheduleUpdateDTO;
import nutricentro.entities.AppointmentEntity;
import nutricentro.entities.ProfessionalEntity;
import nutricentro.entities.ProfessionalScheduleEntity;
import nutricentro.enums.AppointmentStatus;
import nutricentro.enums.PersonStatus;
import nutricentro.exception.ApiException;
import nutricentro.repositories.AppointmentRepository;
import nutricentro.repositories.ProfessionalRepository;
import nutricentro.repositories.ProfessionalScheduleRepository;
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
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class ProfessionalScheduleServiceImpl implements ProfessionalScheduleService {

    private static final List<AppointmentStatus> NON_BLOCKING_STATUSES = List.of(AppointmentStatus.CANCELED, AppointmentStatus.REJECTED);

    private final ProfessionalScheduleRepository scheduleRepository;
    private final ProfessionalRepository professionalRepository;
    private final AppointmentRepository appointmentRepository;

    @Override
    @Transactional
    public ProfessionalScheduleResponseDTO create(ProfessionalScheduleRequestDTO dto) {
        validate(dto.getStartTime(), dto.getEndTime(), dto.getSlotDurationMinutes());

        ProfessionalEntity professional = professionalRepository.findByIdForUpdate(dto.getProfessionalId())
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

        ProfessionalScheduleEntity schedule = new ProfessionalScheduleEntity();
        schedule.setProfessional(professional);
        schedule.setDayOfWeek(dto.getDayOfWeek());
        schedule.setStartTime(dto.getStartTime());
        schedule.setEndTime(dto.getEndTime());
        schedule.setSlotDurationMinutes(dto.getSlotDurationMinutes());
        schedule.setStatus(status);

        return toResponse(scheduleRepository.save(schedule));
    }

    @Override
    @Transactional
    public ProfessionalScheduleResponseDTO update(Long id, ProfessionalScheduleUpdateDTO dto) {
        ProfessionalScheduleEntity schedule = findScheduleForUpdate(id);

        LocalTime startTime = dto.getStartTime() != null ? dto.getStartTime() : schedule.getStartTime();
        LocalTime endTime = dto.getEndTime() != null ? dto.getEndTime() : schedule.getEndTime();
        Integer duration = dto.getSlotDurationMinutes() != null
                ? dto.getSlotDurationMinutes()
                : schedule.getSlotDurationMinutes();
        DayOfWeek day = dto.getDayOfWeek() != null ? dto.getDayOfWeek() : schedule.getDayOfWeek();
        PersonStatus status = dto.getStatus() != null ? dto.getStatus() : schedule.getStatus();

        validate(startTime, endTime, duration);
        if (status == PersonStatus.ACTIVE && hasOverlap(schedule.getId(), schedule.getProfessional().getId(), day, startTime, endTime)) {
            throw new ApiException("El horario se superpone con otra franja activa", HttpStatus.CONFLICT.value());
        }

        validateFutureAppointmentsRemainCovered(schedule, day, startTime, endTime, duration, status);

        schedule.setStartTime(startTime);
        schedule.setEndTime(endTime);
        schedule.setSlotDurationMinutes(duration);
        schedule.setDayOfWeek(day);
        schedule.setStatus(status);

        return toResponse(scheduleRepository.save(schedule));
    }

    @Override
    public ProfessionalScheduleResponseDTO getById(Long id) {
        return toResponse(findSchedule(id));
    }

    @Override
    public List<ProfessionalScheduleResponseDTO> getByProfessional(Long professionalId) {
        return scheduleRepository.findByProfessionalId(professionalId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public void delete(Long id) {
        ProfessionalScheduleEntity schedule = findScheduleForUpdate(id);
        if (schedule.getStatus() == PersonStatus.INACTIVE) {
            return;
        }

        validateFutureAppointmentsRemainCovered(schedule, schedule.getDayOfWeek(), schedule.getStartTime(),
                schedule.getEndTime(), schedule.getSlotDurationMinutes(), PersonStatus.INACTIVE);

        schedule.setStatus(PersonStatus.INACTIVE);
        scheduleRepository.save(schedule);
    }

    @Override
    public List<LocalTime> getAvailableSlots(Long professionalId, LocalDate date) {
        if (date.isBefore(LocalDate.now())) {
            return List.of();
        }

        List<ProfessionalScheduleEntity> schedules = scheduleRepository.findByProfessionalIdAndDayOfWeekAndStatus
                                                (professionalId, date.getDayOfWeek(), PersonStatus.ACTIVE);
        if (schedules.isEmpty()) {
            return List.of();
        }

        List<AppointmentEntity> appointments = appointmentRepository.findByProfessionalIdAndDateAndStatusNotIn(professionalId, date, NON_BLOCKING_STATUSES);
        List<LocalTime> availableSlots = new ArrayList<>();

        for (ProfessionalScheduleEntity schedule : schedules) {
            LocalTime current = schedule.getStartTime();
            int duration = schedule.getSlotDurationMinutes();

            while (!current.plusMinutes(duration).isAfter(schedule.getEndTime())) {
                LocalDateTime slotDateTime = LocalDateTime.of(date, current);
                if (slotDateTime.isAfter(LocalDateTime.now())
                        && isFree(current, duration, appointments, schedules)) {
                    availableSlots.add(current);
                }
                current = current.plusMinutes(duration);
            }
        }

        return availableSlots.stream()
                .distinct()
                .sorted()
                .toList();
    }

    @Override
    public Page<ProfessionalScheduleResponseDTO> search(Long professionalId,
                                                        DayOfWeek dayOfWeek,
                                                        PersonStatus status,
                                                        String search,
                                                        Pageable pageable) {
        Specification<ProfessionalScheduleEntity> spec = Specification.allOf(byProfessional(professionalId),
                                                        byDay(dayOfWeek), byStatus(status), bySearch(search));

        return scheduleRepository.findAll(spec, pageable).map(this::toResponse);
    }

    private boolean isFree(LocalTime slot, int duration, List<AppointmentEntity> appointments, List<ProfessionalScheduleEntity> schedules) {
        LocalTime slotEnd = slot.plusMinutes(duration);
        return appointments.stream().noneMatch(appointment -> {
            int appointmentDuration = schedules.stream()
                    .filter(schedule -> isSlotInSchedule(schedule, appointment.getTime()))
                    .map(ProfessionalScheduleEntity::getSlotDurationMinutes)
                    .findFirst()
                    .orElse(duration);
            LocalTime appointmentEnd = appointment.getTime().plusMinutes(appointmentDuration);
            return slot.isBefore(appointmentEnd) && appointment.getTime().isBefore(slotEnd);
        });
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
                .findByProfessionalIdAndDateGreaterThanEqualAndStatusNotIn(professionalId, LocalDate.now(), NON_BLOCKING_STATUSES)
                .stream().filter(appointment -> LocalDateTime.of(appointment.getDate(), appointment.getTime())
                        .isAfter(LocalDateTime.now()))
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
                                + ". Reprogramelo o cancelelo antes de modificar el horario.",
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
                            NON_BLOCKING_STATUSES
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

    private void validate(LocalTime startTime, LocalTime endTime, Integer duration) {
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

    private ProfessionalScheduleEntity findSchedule(Long id) {
        return scheduleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Horario no encontrado"));
    }

    private ProfessionalScheduleEntity findScheduleForUpdate(Long id) {
        return scheduleRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new EntityNotFoundException("Horario no encontrado"));
    }

    private ProfessionalScheduleResponseDTO toResponse(ProfessionalScheduleEntity schedule) {
        return ProfessionalScheduleResponseDTO.builder()
                .id(schedule.getId())
                .professionalId(schedule.getProfessional().getId())
                .dayOfWeek(schedule.getDayOfWeek())
                .status(schedule.getStatus())
                .slotDurationMinutes(schedule.getSlotDurationMinutes())
                .startTime(schedule.getStartTime())
                .endTime(schedule.getEndTime())
                .professionalName(
                        schedule.getProfessional().getFirstName()
                                + " "
                                + schedule.getProfessional().getLastName()
                )
                .build();
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
