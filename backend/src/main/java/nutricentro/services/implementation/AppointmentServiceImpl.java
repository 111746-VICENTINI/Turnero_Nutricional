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
import nutricentro.entities.SecretaryEntity;
import nutricentro.enums.AppointmentStatus;
import nutricentro.exception.ApiException;
import nutricentro.repositories.AppointmentRepository;
import nutricentro.repositories.PatientRepository;
import nutricentro.repositories.ProfessionalRepository;
import nutricentro.repositories.SecretaryRepository;
import nutricentro.services.AppointmentService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AppointmentServiceImpl implements AppointmentService {

    private static final List<AppointmentStatus> NON_BLOCKING_STATUSES = Arrays.asList(
            AppointmentStatus.CANCELED,
            AppointmentStatus.REJECTED
    );

    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final ProfessionalRepository professionalRepository;
    private final SecretaryRepository secretaryRepository;

    @Override
    public AppointmentResponseDTO createAppointment(AppointmentRequestDTO dto) {
        PatientEntity patient = patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new EntityNotFoundException("Paciente no encontrado"));
        ProfessionalEntity professional = professionalRepository.findById(dto.getProfessionalId())
                .orElseThrow(() -> new EntityNotFoundException("Profesional no encontrado"));
        SecretaryEntity secretary = findSecretary(dto.getSecretaryId());
        AppointmentStatus status = dto.getStatus() != null ? dto.getStatus() : AppointmentStatus.PENDING;

        validateScheduleAvailable(null, professional.getId(), dto.getDate(), dto.getTime(), status);

        AppointmentEntity appointment = new AppointmentEntity();
        appointment.setDate(dto.getDate());
        appointment.setTime(dto.getTime());
        appointment.setStatus(status);
        appointment.setReason(dto.getReason());
        appointment.setPatient(patient);
        appointment.setProfessional(professional);
        appointment.setSecretary(secretary);

        AppointmentEntity saved = appointmentRepository.save(appointment);
        return toResponse(saved);
    }

    @Override
    public List<AppointmentResponseDTO> getAllAppointments() {
        return appointmentRepository.findAll(Sort.by("date").ascending().and(Sort.by("time").ascending())).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public AppointmentResponseDTO getAppointmentById(Long id) {
        AppointmentEntity appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Turno no encontrado"));
        return toResponse(appointment);
    }

    @Override
    public AppointmentResponseDTO updateAppointment(Long id, AppointmentUpdateDTO dto) {
        AppointmentEntity appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Turno no encontrado"));

        LocalDate date = dto.getDate() != null ? dto.getDate() : appointment.getDate();
        LocalTime time = dto.getTime() != null ? dto.getTime() : appointment.getTime();
        AppointmentStatus status = dto.getStatus() != null ? dto.getStatus() : appointment.getStatus();
        PatientEntity patient = dto.getPatientId() != null
                ? patientRepository.findById(dto.getPatientId())
                .orElseThrow(() -> new EntityNotFoundException("Paciente no encontrado"))
                : appointment.getPatient();
        ProfessionalEntity professional = dto.getProfessionalId() != null
                ? professionalRepository.findById(dto.getProfessionalId())
                .orElseThrow(() -> new EntityNotFoundException("Profesional no encontrado"))
                : appointment.getProfessional();
        SecretaryEntity secretary = dto.getSecretaryId() != null
                ? findSecretary(dto.getSecretaryId())
                : appointment.getSecretary();

        validateScheduleAvailable(id, professional.getId(), date, time, status);

        appointment.setDate(date);
        appointment.setTime(time);
        appointment.setStatus(status);
        if (dto.getReason() != null) {
            appointment.setReason(dto.getReason());
        }
        appointment.setPatient(patient);
        appointment.setProfessional(professional);
        appointment.setSecretary(secretary);

        AppointmentEntity saved = appointmentRepository.save(appointment);
        return toResponse(saved);
    }

    @Override
    public void deleteAppointment(Long id) {
        AppointmentEntity appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Turno no encontrado"));
        appointment.setStatus(AppointmentStatus.CANCELED);
        appointmentRepository.save(appointment);
    }

    @Override
    public List<AppointmentResponseDTO> getAppointmentsByStatus(AppointmentStatus status) {
        return appointmentRepository.findAll(byStatus(status), Sort.by("date").ascending().and(Sort.by("time").ascending()))
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
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

        Specification<AppointmentEntity> spec = Specification.where(byStatus(status))
                .and(dateGreaterThanOrEqual(dateFrom))
                .and(dateLessThanOrEqual(dateTo))
                .and(byPatient(patientId))
                .and(byProfessional(professionalId))
                .and(bySecretary(secretaryId))
                .and(bySearch(search));

        return appointmentRepository.findAll(spec, pageable).map(this::toResponse);
    }

    private AppointmentResponseDTO toResponse(AppointmentEntity saved) {
        return AppointmentResponseDTO.builder()
                .id(saved.getId())
                .date(saved.getDate())
                .time(saved.getTime())
                .status(saved.getStatus())
                .reason(saved.getReason())
                .patientId(saved.getPatient() != null ? saved.getPatient().getId() : null)
                .patientFullName(saved.getPatient() != null ? fullName(saved.getPatient().getFirstName(), saved.getPatient().getLastName()) : null)
                .professionalId(saved.getProfessional() != null ? saved.getProfessional().getId() : null)
                .professionalFullName(saved.getProfessional() != null ? fullName(saved.getProfessional().getFirstName(), saved.getProfessional().getLastName()) : null)
                .secretaryId(saved.getSecretary() != null ? saved.getSecretary().getId() : null)
                .secretaryFullName(saved.getSecretary() != null ? fullName(saved.getSecretary().getFirstName(), saved.getSecretary().getLastName()) : null)
                .build();
    }

    private SecretaryEntity findSecretary(Long secretaryId) {
        if (secretaryId == null) {
            return null;
        }

        return secretaryRepository.findById(secretaryId)
                .orElseThrow(() -> new EntityNotFoundException("Secretaria no encontrada"));
    }

    private void validateScheduleAvailable(Long appointmentId,
                                           Long professionalId,
                                           LocalDate date,
                                           LocalTime time,
                                           AppointmentStatus status) {
        if (NON_BLOCKING_STATUSES.contains(status)) {
            return;
        }

        boolean hasConflict = appointmentId == null
                ? appointmentRepository.existsByProfessionalProfessionalIdAndDateAndTimeAndStatusNotIn(
                professionalId, date, time, NON_BLOCKING_STATUSES)
                : appointmentRepository.existsByProfessionalProfessionalIdAndDateAndTimeAndStatusNotInAndIdNot(
                professionalId, date, time, NON_BLOCKING_STATUSES, appointmentId);

        if (hasConflict) {
            throw new ApiException("El profesional ya tiene un turno activo en esa fecha y hora", HttpStatus.CONFLICT.value());
        }
    }

    private Specification<AppointmentEntity> byStatus(AppointmentStatus status) {
        return (root, query, criteriaBuilder) -> status == null
                ? criteriaBuilder.conjunction()
                : criteriaBuilder.equal(root.get("status"), status);
    }

    private Specification<AppointmentEntity> dateGreaterThanOrEqual(LocalDate dateFrom) {
        return (root, query, criteriaBuilder) -> dateFrom == null
                ? criteriaBuilder.conjunction()
                : criteriaBuilder.greaterThanOrEqualTo(root.get("date"), dateFrom);
    }

    private Specification<AppointmentEntity> dateLessThanOrEqual(LocalDate dateTo) {
        return (root, query, criteriaBuilder) -> dateTo == null
                ? criteriaBuilder.conjunction()
                : criteriaBuilder.lessThanOrEqualTo(root.get("date"), dateTo);
    }

    private Specification<AppointmentEntity> byPatient(Long patientId) {
        return (root, query, criteriaBuilder) -> patientId == null
                ? criteriaBuilder.conjunction()
                : criteriaBuilder.equal(root.get("patient").get("patientId"), patientId);
    }

    private Specification<AppointmentEntity> byProfessional(Long professionalId) {
        return (root, query, criteriaBuilder) -> professionalId == null
                ? criteriaBuilder.conjunction()
                : criteriaBuilder.equal(root.get("professional").get("professionalId"), professionalId);
    }

    private Specification<AppointmentEntity> bySecretary(Long secretaryId) {
        return (root, query, criteriaBuilder) -> secretaryId == null
                ? criteriaBuilder.conjunction()
                : criteriaBuilder.equal(root.get("secretary").get("id"), secretaryId);
    }

    private Specification<AppointmentEntity> bySearch(String search) {
        return (root, query, criteriaBuilder) -> {
            if (search == null || search.trim().isEmpty()) {
                return criteriaBuilder.conjunction();
            }

            String pattern = "%" + search.trim().toLowerCase() + "%";
            Join<AppointmentEntity, PatientEntity> patient = root.join("patient", JoinType.LEFT);
            Join<AppointmentEntity, ProfessionalEntity> professional = root.join("professional", JoinType.LEFT);
            Join<AppointmentEntity, SecretaryEntity> secretary = root.join("secretary", JoinType.LEFT);

            return criteriaBuilder.or(
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("reason").as(String.class)), pattern),
                    criteriaBuilder.like(criteriaBuilder.lower(patient.get("firstName").as(String.class)), pattern),
                    criteriaBuilder.like(criteriaBuilder.lower(patient.get("lastName").as(String.class)), pattern),
                    criteriaBuilder.like(criteriaBuilder.lower(professional.get("firstName").as(String.class)), pattern),
                    criteriaBuilder.like(criteriaBuilder.lower(professional.get("lastName").as(String.class)), pattern),
                    criteriaBuilder.like(criteriaBuilder.lower(secretary.get("firstName").as(String.class)), pattern),
                    criteriaBuilder.like(criteriaBuilder.lower(secretary.get("lastName").as(String.class)), pattern)
            );
        };
    }

    private String fullName(String firstName, String lastName) {
        return String.join(" ", firstName, lastName).trim();
    }
}
