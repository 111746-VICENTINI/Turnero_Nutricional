package nutricentro.services.implementation;

import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import lombok.RequiredArgsConstructor;
import nutricentro.dtos.appointments.AppointmentRequestDTO;
import nutricentro.dtos.appointments.AppointmentResponseDTO;
import nutricentro.dtos.appointments.AppointmentUpdateDTO;
import nutricentro.entities.AppointmentEntity;
import nutricentro.entities.PatientEntity;
import nutricentro.entities.ProfessionalEntity;
import nutricentro.entities.ProfessionalScheduleEntity;
import nutricentro.entities.SecretaryEntity;
import nutricentro.enums.AppointmentStatus;
import nutricentro.enums.PersonStatus;
import nutricentro.exception.ApiException;
import nutricentro.repositories.AppointmentRepository;
import nutricentro.repositories.PatientRepository;
import nutricentro.repositories.ProfessionalRepository;
import nutricentro.repositories.ProfessionalScheduleRepository;
import nutricentro.repositories.SecretaryRepository;
import nutricentro.services.AppointmentService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.EnumSet;
import java.util.List;
import java.util.Objects;
import java.util.OptionalInt;

@Service
@RequiredArgsConstructor
public class AppointmentServiceImpl implements AppointmentService {

    private static final List<AppointmentStatus> NON_BLOCKING_STATUSES = List.of(
            AppointmentStatus.CANCELED,
            AppointmentStatus.REJECTED
    );
    private static final EnumSet<AppointmentStatus> TERMINAL_STATUSES = EnumSet.of(
            AppointmentStatus.COMPLETED,
            AppointmentStatus.CANCELED,
            AppointmentStatus.REJECTED
    );
    private static final EnumSet<AppointmentStatus> ACTIVE_STATUSES = EnumSet.of(
            AppointmentStatus.PENDING,
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.RESCHEDULED
    );

    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final ProfessionalRepository professionalRepository;
    private final ProfessionalScheduleRepository professionalScheduleRepository;
    private final SecretaryRepository secretaryRepository;

    @Override
    @Transactional
    public AppointmentResponseDTO createAppointment(AppointmentRequestDTO dto) {
        AppointmentStatus status = dto.getStatus() != null ? dto.getStatus() : AppointmentStatus.PENDING;
        if (status != AppointmentStatus.PENDING && status != AppointmentStatus.CONFIRMED) {
            throw new ApiException(
                    "Un turno nuevo solo puede crearse como PENDIENTE o CONFIRMADO",
                    HttpStatus.BAD_REQUEST.value()
            );
        }

        PatientEntity patient = patientRepository.findByIdForUpdate(dto.getPatientId())
                .orElseThrow(() -> new EntityNotFoundException("Paciente no encontrado"));
        ProfessionalEntity professional = professionalRepository.findByIdForUpdate(dto.getProfessionalId())
                .orElseThrow(() -> new EntityNotFoundException("Profesional no encontrado"));
        validateActivePeople(patient, professional);

        SecretaryEntity secretary = findSecretary(dto.getSecretaryId());
        validateActiveAppointment(null, professional.getId(), patient.getId(), dto.getDate(), dto.getTime());

        AppointmentEntity appointment = new AppointmentEntity();
        appointment.setDate(dto.getDate());
        appointment.setTime(dto.getTime());
        appointment.setStatus(status);
        appointment.setReason(dto.getReason());
        appointment.setPatient(patient);
        appointment.setProfessional(professional);
        appointment.setSecretary(secretary);

        return toResponse(appointmentRepository.save(appointment));
    }

    @Override
    public AppointmentResponseDTO getAppointmentById(Long id) {
        return toResponse(findAppointment(id));
    }

    @Override
    @Transactional
    public AppointmentResponseDTO updateAppointment(Long id, AppointmentUpdateDTO dto) {
        AppointmentEntity appointment = findAppointmentForUpdate(id);
        if (TERMINAL_STATUSES.contains(appointment.getStatus())) {
            throw new ApiException(
                    "No se puede modificar un turno finalizado, cancelado o rechazado",
                    HttpStatus.CONFLICT.value()
            );
        }

        LocalDate date = dto.getDate() != null ? dto.getDate() : appointment.getDate();
        LocalTime time = dto.getTime() != null ? dto.getTime() : appointment.getTime();
        Long patientId = dto.getPatientId() != null
                ? dto.getPatientId()
                : appointment.getPatient().getId();
        PatientEntity patient = patientRepository.findByIdForUpdate(patientId)
                .orElseThrow(() -> new EntityNotFoundException("Paciente no encontrado"));
        Long professionalId = dto.getProfessionalId() != null
                ? dto.getProfessionalId()
                : appointment.getProfessional().getId();
        ProfessionalEntity professional = professionalRepository.findByIdForUpdate(professionalId)
                .orElseThrow(() -> new EntityNotFoundException("Profesional no encontrado"));
        SecretaryEntity secretary = dto.getSecretaryId() != null
                ? findSecretary(dto.getSecretaryId())
                : appointment.getSecretary();

        boolean scheduleChanged = !Objects.equals(date, appointment.getDate())
                || !Objects.equals(time, appointment.getTime())
                || !Objects.equals(professional.getId(), appointment.getProfessional().getId());
        boolean patientChanged = !Objects.equals(patient.getId(), appointment.getPatient().getId());

        AppointmentStatus status = dto.getStatus() != null ? dto.getStatus() : appointment.getStatus();
        if (scheduleChanged) {
            if (TERMINAL_STATUSES.contains(status)) {
                throw new ApiException(
                        "No se puede reprogramar y finalizar/cancelar el turno en la misma operación",
                        HttpStatus.BAD_REQUEST.value()
                );
            }
            status = AppointmentStatus.RESCHEDULED;
        }

        validateStatusTransition(appointment.getStatus(), status, appointment.getDate(), appointment.getTime());

        if (ACTIVE_STATUSES.contains(status)) {
            validateActivePeople(patient, professional);
            validateActiveAppointment(id, professional.getId(), patient.getId(), date, time);
        } else {
            if (patientChanged) {
                throw new ApiException(
                        "No se puede cambiar el paciente al finalizar o cancelar un turno",
                        HttpStatus.BAD_REQUEST.value()
                );
            }
            validateTerminalStatusDate(status, appointment.getDate(), appointment.getTime());
        }

        appointment.setDate(date);
        appointment.setTime(time);
        appointment.setStatus(status);
        if (dto.getReason() != null) {
            appointment.setReason(dto.getReason());
        }
        appointment.setPatient(patient);
        appointment.setProfessional(professional);
        appointment.setSecretary(secretary);

        return toResponse(appointmentRepository.save(appointment));
    }

    @Override
    @Transactional
    public void deleteAppointment(Long id) {
        AppointmentEntity appointment = findAppointmentForUpdate(id);
        if (appointment.getStatus() == AppointmentStatus.CANCELED) {
            return;
        }
        if (appointment.getStatus() == AppointmentStatus.COMPLETED
                || appointment.getStatus() == AppointmentStatus.REJECTED) {
            throw new ApiException(
                    "No se puede cancelar un turno finalizado o rechazado",
                    HttpStatus.CONFLICT.value()
            );
        }
        validateTerminalStatusDate(AppointmentStatus.CANCELED, appointment.getDate(), appointment.getTime());
        appointment.setStatus(AppointmentStatus.CANCELED);
        appointmentRepository.save(appointment);
    }

    @Override
    public List<AppointmentResponseDTO> getAppointmentsByStatus(AppointmentStatus status) {
        return appointmentRepository.findAll(
                        byStatus(status),
                        Sort.by("date").ascending().and(Sort.by("time").ascending())
                ).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public Page<AppointmentResponseDTO> searchAppointments(AppointmentStatus status,
                                                           LocalDate dateFrom,
                                                           LocalDate dateTo,
                                                           Long patientId,
                                                           Long professionalId,
                                                           Long secretaryId,
                                                           String search,
                                                           Pageable pageable) {
        if (dateFrom != null && dateTo != null && dateFrom.isAfter(dateTo)) {
            throw new IllegalArgumentException("La fecha desde no puede ser posterior a la fecha hasta");
        }

        Specification<AppointmentEntity> spec = Specification.allOf(
                byStatus(status),
                dateGreaterThanOrEqual(dateFrom),
                dateLessThanOrEqual(dateTo),
                byPatient(patientId),
                byProfessional(professionalId),
                bySecretary(secretaryId),
                bySearch(search)
        );

        return appointmentRepository.findAll(spec, pageable).map(this::toResponse);
    }

    private void validateActiveAppointment(Long appointmentId, Long professionalId, Long patientId, LocalDate date, LocalTime time) {
        LocalDateTime requestedDateTime = LocalDateTime.of(date, time);
        if (!requestedDateTime.isAfter(LocalDateTime.now())) {
            throw new ApiException(
                    "La fecha y hora del turno deben ser futuras",
                    HttpStatus.BAD_REQUEST.value()
            );
        }

        int duration = resolveSlotDuration(professionalId, date, time)
                .orElseThrow(() -> new ApiException(
                        "El horario seleccionado no pertenece a la agenda activa del profesional",
                        HttpStatus.BAD_REQUEST.value()
                ));

        boolean professionalConflict = appointmentRepository
                .findByProfessionalIdAndDateAndStatusNotIn(professionalId, date, NON_BLOCKING_STATUSES)
                .stream()
                .filter(other -> !Objects.equals(other.getId(), appointmentId))
                .anyMatch(other -> overlaps(time, duration, other, duration));
        if (professionalConflict) {
            throw new ApiException(
                    "El profesional ya tiene un turno que se superpone con ese horario",
                    HttpStatus.CONFLICT.value()
            );
        }

        boolean patientConflict = appointmentRepository
                .findByPatientIdAndDateAndStatusNotIn(patientId, date, NON_BLOCKING_STATUSES)
                .stream()
                .filter(other -> !Objects.equals(other.getId(), appointmentId))
                .anyMatch(other -> overlaps(time, duration, other, duration));
        if (patientConflict) {
            throw new ApiException(
                    "El paciente ya tiene otro turno que se superpone con ese horario",
                    HttpStatus.CONFLICT.value()
            );
        }
    }

    private boolean overlaps(LocalTime requestedTime, int requestedDuration, AppointmentEntity other, int fallbackDuration) {
        int otherDuration = resolveSlotDuration(other.getProfessional().getId(), other.getDate(), other.getTime()).orElse(fallbackDuration);
        LocalTime requestedEnd = requestedTime.plusMinutes(requestedDuration);
        LocalTime otherEnd = other.getTime().plusMinutes(otherDuration);
        return requestedTime.isBefore(otherEnd) && other.getTime().isBefore(requestedEnd);
    }

    private OptionalInt resolveSlotDuration(Long professionalId, LocalDate date, LocalTime time) {
        return professionalScheduleRepository
                .findByProfessionalIdAndDayOfWeekAndStatus(
                        professionalId,
                        date.getDayOfWeek(),
                        PersonStatus.ACTIVE
                ).stream()
                .filter(schedule -> isSlotInSchedule(schedule, time))
                .mapToInt(ProfessionalScheduleEntity::getSlotDurationMinutes)
                .findFirst();
    }

    private boolean isSlotInSchedule(ProfessionalScheduleEntity schedule, LocalTime time) {
        int duration = schedule.getSlotDurationMinutes();
        if (time.isBefore(schedule.getStartTime())
                || time.plusMinutes(duration).isAfter(schedule.getEndTime())) {
            return false;
        }
        long offset = Duration.between(schedule.getStartTime(), time).toMinutes();
        return offset % duration == 0;
    }

    private void validateStatusTransition(AppointmentStatus current, AppointmentStatus target, LocalDate date, LocalTime time) {
        if (current == target) {
            return;
        }

        boolean allowed = switch (current) {
            case PENDING -> EnumSet.of(
                    AppointmentStatus.CONFIRMED,
                    AppointmentStatus.CANCELED,
                    AppointmentStatus.REJECTED,
                    AppointmentStatus.RESCHEDULED
            ).contains(target);
            case CONFIRMED -> EnumSet.of(
                    AppointmentStatus.COMPLETED,
                    AppointmentStatus.CANCELED,
                    AppointmentStatus.REJECTED,
                    AppointmentStatus.RESCHEDULED
            ).contains(target);
            case RESCHEDULED -> EnumSet.of(
                    AppointmentStatus.CONFIRMED,
                    AppointmentStatus.COMPLETED,
                    AppointmentStatus.CANCELED,
                    AppointmentStatus.REJECTED
            ).contains(target);
            case COMPLETED, CANCELED, REJECTED -> false;
        };

        if (!allowed) {
            throw new ApiException(
                    "Transición de estado inválida: " + current + " -> " + target,
                    HttpStatus.CONFLICT.value()
            );
        }

        if (target == AppointmentStatus.COMPLETED
                && LocalDateTime.of(date, time).isAfter(LocalDateTime.now())) {
            throw new ApiException(
                    "No se puede completar un turno que todavía no ocurrió",
                    HttpStatus.BAD_REQUEST.value()
            );
        }
    }

    private void validateTerminalStatusDate(AppointmentStatus status, LocalDate date, LocalTime time) {
        LocalDateTime appointmentDateTime = LocalDateTime.of(date, time);
        if (status == AppointmentStatus.CANCELED && !appointmentDateTime.isAfter(LocalDateTime.now())) {
            throw new ApiException(
                    "No se puede cancelar un turno que ya ocurrió",
                    HttpStatus.BAD_REQUEST.value()
            );
        }
        if (status == AppointmentStatus.COMPLETED && appointmentDateTime.isAfter(LocalDateTime.now())) {
            throw new ApiException(
                    "No se puede completar un turno que todavía no ocurrió",
                    HttpStatus.BAD_REQUEST.value()
            );
        }
    }

    private void validateActivePeople(PatientEntity patient, ProfessionalEntity professional) {
        if (patient.getStatus() != PersonStatus.ACTIVE) {
            throw new ApiException("El paciente no está activo", HttpStatus.CONFLICT.value());
        }
        if (professional.getStatus() != PersonStatus.ACTIVE) {
            throw new ApiException("El profesional no está activo", HttpStatus.CONFLICT.value());
        }
    }

    private AppointmentEntity findAppointment(Long id) {
        return appointmentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Turno no encontrado"));
    }

    private AppointmentEntity findAppointmentForUpdate(Long id) {
        return appointmentRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new EntityNotFoundException("Turno no encontrado"));
    }

    private SecretaryEntity findSecretary(Long secretaryId) {
        if (secretaryId == null) {
            return null;
        }
        SecretaryEntity secretary = secretaryRepository.findById(secretaryId)
                .orElseThrow(() -> new EntityNotFoundException("Secretaria no encontrada"));
        if (secretary.getStatus() != PersonStatus.ACTIVE) {
            throw new ApiException("La secretaria no está activa", HttpStatus.CONFLICT.value());
        }
        return secretary;
    }

    private AppointmentResponseDTO toResponse(AppointmentEntity appointment) {
        return AppointmentResponseDTO.builder()
                .id(appointment.getId())
                .date(appointment.getDate())
                .time(appointment.getTime())
                .status(appointment.getStatus())
                .reason(appointment.getReason())
                .patientId(appointment.getPatient() != null ? appointment.getPatient().getId() : null)
                .patientFullName(appointment.getPatient() != null
                        ? fullName(appointment.getPatient().getFirstName(), appointment.getPatient().getLastName())
                        : null)
                .professionalId(appointment.getProfessional() != null ? appointment.getProfessional().getId() : null)
                .professionalFullName(appointment.getProfessional() != null
                        ? fullName(appointment.getProfessional().getFirstName(), appointment.getProfessional().getLastName())
                        : null)
                .secretaryId(appointment.getSecretary() != null ? appointment.getSecretary().getId() : null)
                .secretaryFullName(appointment.getSecretary() != null
                        ? fullName(appointment.getSecretary().getFirstName(), appointment.getSecretary().getLastName())
                        : null)
                .build();
    }

    private Specification<AppointmentEntity> byStatus(AppointmentStatus status) {
        return (root, query, cb) -> status == null
                ? cb.conjunction()
                : cb.equal(root.get("status"), status);
    }

    private Specification<AppointmentEntity> dateGreaterThanOrEqual(LocalDate dateFrom) {
        return (root, query, cb) -> dateFrom == null
                ? cb.conjunction()
                : cb.greaterThanOrEqualTo(root.get("date"), dateFrom);
    }

    private Specification<AppointmentEntity> dateLessThanOrEqual(LocalDate dateTo) {
        return (root, query, cb) -> dateTo == null
                ? cb.conjunction()
                : cb.lessThanOrEqualTo(root.get("date"), dateTo);
    }

    private Specification<AppointmentEntity> byPatient(Long patientId) {
        return (root, query, cb) -> patientId == null
                ? cb.conjunction()
                : cb.equal(root.get("patient").get("id"), patientId);
    }

    private Specification<AppointmentEntity> byProfessional(Long professionalId) {
        return (root, query, cb) -> professionalId == null
                ? cb.conjunction()
                : cb.equal(root.get("professional").get("id"), professionalId);
    }

    private Specification<AppointmentEntity> bySecretary(Long secretaryId) {
        return (root, query, cb) -> secretaryId == null
                ? cb.conjunction()
                : cb.equal(root.get("secretary").get("id"), secretaryId);
    }

    private Specification<AppointmentEntity> bySearch(String search) {
        return (root, query, cb) -> {
            if (search == null || search.isBlank()) {
                return cb.conjunction();
            }

            String pattern = "%" + search.trim().toLowerCase() + "%";
            Join<AppointmentEntity, PatientEntity> patient = root.join("patient", JoinType.LEFT);
            Join<AppointmentEntity, ProfessionalEntity> professional = root.join("professional", JoinType.LEFT);
            Join<AppointmentEntity, SecretaryEntity> secretary = root.join("secretary", JoinType.LEFT);

            return cb.or(
                    cb.like(cb.lower(root.get("reason").as(String.class)), pattern),
                    cb.like(cb.lower(patient.get("firstName").as(String.class)), pattern),
                    cb.like(cb.lower(patient.get("lastName").as(String.class)), pattern),
                    cb.like(cb.lower(professional.get("firstName").as(String.class)), pattern),
                    cb.like(cb.lower(professional.get("lastName").as(String.class)), pattern),
                    cb.like(cb.lower(secretary.get("firstName").as(String.class)), pattern),
                    cb.like(cb.lower(secretary.get("lastName").as(String.class)), pattern)
            );
        };
    }

    private String fullName(String firstName, String lastName) {
        return String.join(" ", firstName, lastName).trim();
    }
}
