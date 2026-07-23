package nutricentro.services.implementation;

import lombok.RequiredArgsConstructor;
import nutricentro.dtos.followup.FollowUpDashboardDTO;
import nutricentro.dtos.followup.PatientFollowUpStatusDTO;
import nutricentro.entities.AppointmentEntity;
import nutricentro.entities.ConsultationEntity;
import nutricentro.entities.PatientEntity;
import nutricentro.enums.AppointmentStatus;
import nutricentro.enums.ConsultationStatus;
import nutricentro.enums.FollowUpStatus;
import nutricentro.enums.NotificationPriority;
import nutricentro.exception.ApiException;
import nutricentro.repositories.AppointmentRepository;
import nutricentro.repositories.ConsultationRepository;
import nutricentro.repositories.PatientRepository;
import nutricentro.services.CurrentProfessionalProvider;
import nutricentro.services.CurrentUserContext;
import nutricentro.services.CurrentUserProvider;
import nutricentro.services.PatientFollowUpService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.Date;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class PatientFollowUpServiceImpl implements PatientFollowUpService {

    private final AppointmentRepository appointmentRepository;
    private final ConsultationRepository consultationRepository;
    private final PatientRepository patientRepository;
    private final CurrentUserProvider currentUserProvider;
    private final CurrentProfessionalProvider currentProfessionalProvider;

    @Value("${patient-follow-up.thresholds.use-days:false}")
    private boolean useDayThresholds;
    @Value("${patient-follow-up.thresholds.over-three-months-days:90}")
    private long overThreeMonthsDays;
    @Value("${patient-follow-up.thresholds.over-six-months-days:180}")
    private long overSixMonthsDays;
    @Value("${patient-follow-up.thresholds.over-one-year-days:365}")
    private long overOneYearDays;

    @Override
    @Transactional(readOnly = true)
    public PatientFollowUpStatusDTO getPatientStatus(Long patientId) {
        PatientEntity patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Paciente no encontrado"));
        Long professionalId = resolveProfessionalScopeId();

        return buildLatestByPatient(professionalId).values().stream()
                .filter(candidate -> Objects.equals(candidate.patientId(), patientId))
                .max(Comparator.comparing(FollowUpCandidate::lastConsultationDate))
                .map(this::toStatus)
                .orElseGet(() -> withoutValidConsultation(patient));
    }

    @Override
    @Transactional(readOnly = true)
    public FollowUpDashboardDTO getDashboardMetrics() {
        Map<Long, PatientFollowUpStatusDTO> latestByPatient = buildLatestByPatient(resolveProfessionalScopeId()).values()
                .stream()
                .collect(
                        LinkedHashMap::new,
                        (map, candidate) -> map.merge(
                                candidate.patientId(),
                                toStatus(candidate),
                                (current, next) -> current.getLastConsultationDate().isAfter(next.getLastConsultationDate())
                                        ? current
                                        : next
                        ),
                        Map::putAll
                );

        return FollowUpDashboardDTO.builder()
                .activePatients(countByStatus(latestByPatient, FollowUpStatus.ACTIVE))
                .patientsOverThreeMonths(countByStatus(latestByPatient, FollowUpStatus.OVER_THREE_MONTHS))
                .patientsOverSixMonths(countByStatus(latestByPatient, FollowUpStatus.OVER_SIX_MONTHS))
                .patientsOverOneYear(countByStatus(latestByPatient, FollowUpStatus.OVER_ONE_YEAR))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PatientFollowUpStatusDTO> getInactivePatientsForCurrentUser() {
        return buildLatestByPatientAndProfessional(resolveProfessionalScopeId()).values().stream()
                .map(this::toStatus)
                .filter(status -> status.getStatus() != FollowUpStatus.ACTIVE)
                .filter(status -> status.getStatus() != FollowUpStatus.WITHOUT_VALID_CONSULTATION)
                .sorted(Comparator
                        .comparing(PatientFollowUpStatusDTO::getPriority).reversed()
                        .thenComparing(PatientFollowUpStatusDTO::getLastConsultationDate))
                .toList();
    }

    private Long countByStatus(Map<Long, PatientFollowUpStatusDTO> statuses, FollowUpStatus status) {
        return statuses.values().stream()
                .filter(item -> item.getStatus() == status)
                .count();
    }

    private Map<String, FollowUpCandidate> buildLatestByPatientAndProfessional(Long professionalId) {
        LocalDate today = LocalDate.now();
        Date consultationLimitDate = consultationLimitDate(today);
        Map<String, FollowUpCandidate> latest = new LinkedHashMap<>();
        Set<Long> patientsWithFinalizedConsultation = patientsWithAnyFinalizedConsultation(
                consultationLimitDate,
                professionalId
        );

        List<ConsultationEntity> finalizedConsultations = consultationRepository.findFinalizedConsultationsForFollowUp(
                ConsultationStatus.FINALIZADA,
                consultationLimitDate,
                professionalId
        );
        finalizedConsultations.forEach(consultation -> {
            FollowUpCandidate candidate = fromConsultation(consultation);
            putLatest(latest, candidate, true);
        });

        List<AppointmentEntity> completedAppointments = appointmentRepository.findValidCompletedAppointmentsForFollowUp(
                AppointmentStatus.COMPLETED,
                today,
                professionalId
        );
        completedAppointments.stream()
                .map(this::fromAppointment)
                .filter(candidate -> candidate != null)
                .filter(candidate -> !patientsWithFinalizedConsultation.contains(candidate.patientId()))
                .forEach(candidate -> putLatest(latest, candidate, true));

        return latest;
    }

    private Map<String, FollowUpCandidate> buildLatestByPatient(Long professionalId) {
        LocalDate today = LocalDate.now();
        Date consultationLimitDate = consultationLimitDate(today);
        Map<String, FollowUpCandidate> latest = new LinkedHashMap<>();
        Set<Long> patientsWithFinalizedConsultation = patientsWithAnyFinalizedConsultation(
                consultationLimitDate,
                professionalId
        );

        List<ConsultationEntity> finalizedConsultations = consultationRepository.findFinalizedConsultationsForFollowUp(
                ConsultationStatus.FINALIZADA,
                consultationLimitDate,
                professionalId
        );
        finalizedConsultations.forEach(consultation -> {
            FollowUpCandidate candidate = fromConsultation(consultation);
            putLatest(latest, candidate, false);
        });

        List<AppointmentEntity> completedAppointments = appointmentRepository.findValidCompletedAppointmentsForFollowUp(
                AppointmentStatus.COMPLETED,
                today,
                professionalId
        );
        completedAppointments.stream()
                .map(this::fromAppointment)
                .filter(candidate -> candidate != null)
                .filter(candidate -> !patientsWithFinalizedConsultation.contains(candidate.patientId()))
                .forEach(candidate -> putLatest(latest, candidate, false));

        return latest;
    }

    private Set<Long> patientsWithAnyFinalizedConsultation(Date consultationLimitDate, Long professionalId) {
        List<Long> patientIds = consultationRepository.findPatientIdsWithFinalizedConsultations(
                ConsultationStatus.FINALIZADA,
                consultationLimitDate,
                professionalId
        );
        return patientIds == null ? Set.of() : new HashSet<>(patientIds);
    }

    private Date consultationLimitDate(LocalDate today) {
        return Date.from(today.plusDays(1).atStartOfDay(ZoneId.systemDefault()).toInstant());
    }

    private void putLatest(Map<String, FollowUpCandidate> latest, FollowUpCandidate candidate, boolean includeProfessional) {
        if (candidate == null) {
            return;
        }

        String key = includeProfessional
                ? candidate.patientId() + ":" + candidate.professionalId()
                : String.valueOf(candidate.patientId());
        latest.merge(key, candidate, (current, next) ->
                current.lastConsultationDate().isAfter(next.lastConsultationDate()) ? current : next
        );
    }

    private FollowUpCandidate fromAppointment(AppointmentEntity appointment) {
        if (appointment.getPatient() == null || appointment.getProfessional() == null) {
            return null;
        }
        return new FollowUpCandidate(
                appointment.getPatient().getId(),
                fullName(appointment.getPatient().getFirstName(), appointment.getPatient().getLastName()),
                appointment.getProfessional().getId(),
                fullName(appointment.getProfessional().getFirstName(), appointment.getProfessional().getLastName()),
                appointment.getDate()
        );
    }

    private FollowUpCandidate fromConsultation(ConsultationEntity consultation) {
        if (consultation.getPatient() == null || consultation.getProfessional() == null || consultation.getDate() == null) {
            return null;
        }
        LocalDate consultationDate = consultation.getDate()
                .toInstant()
                .atZone(ZoneId.systemDefault())
                .toLocalDate();
        return new FollowUpCandidate(
                consultation.getPatient().getId(),
                fullName(consultation.getPatient().getFirstName(), consultation.getPatient().getLastName()),
                consultation.getProfessional().getId(),
                fullName(consultation.getProfessional().getFirstName(), consultation.getProfessional().getLastName()),
                consultationDate
        );
    }

    private PatientFollowUpStatusDTO toStatus(FollowUpCandidate candidate) {
        LocalDate today = LocalDate.now();
        long days = ChronoUnit.DAYS.between(candidate.lastConsultationDate(), today);
        long months = ChronoUnit.MONTHS.between(candidate.lastConsultationDate(), today);
        FollowUpStatus status = resolveStatus(candidate.lastConsultationDate(), today);

        return PatientFollowUpStatusDTO.builder()
                .patientId(candidate.patientId())
                .patientFullName(candidate.patientFullName())
                .professionalId(candidate.professionalId())
                .professionalFullName(candidate.professionalFullName())
                .lastConsultationDate(candidate.lastConsultationDate())
                .daysSinceLastConsultation(days)
                .monthsSinceLastConsultation(months)
                .status(status)
                .priority(resolvePriority(status))
                .label(resolveLabel(status, months, days))
                .recommendation(resolveRecommendation(status))
                .build();
    }

    private PatientFollowUpStatusDTO withoutValidConsultation(PatientEntity patient) {
        return PatientFollowUpStatusDTO.builder()
                .patientId(patient.getId())
                .patientFullName(fullName(patient.getFirstName(), patient.getLastName()))
                .status(FollowUpStatus.WITHOUT_VALID_CONSULTATION)
                .priority(NotificationPriority.LOW)
                .label("Sin controles finalizados")
                .recommendation("Se recomienda registrar o programar un control nutricional.")
                .build();
    }

    private FollowUpStatus resolveStatus(LocalDate lastConsultationDate, LocalDate today) {
        if (exceedsThreshold(lastConsultationDate, today, overOneYearDays, today.minusYears(1))) {
            return FollowUpStatus.OVER_ONE_YEAR;
        }
        if (exceedsThreshold(lastConsultationDate, today, overSixMonthsDays, today.minusMonths(6))) {
            return FollowUpStatus.OVER_SIX_MONTHS;
        }
        if (exceedsThreshold(lastConsultationDate, today, overThreeMonthsDays, today.minusMonths(3))) {
            return FollowUpStatus.OVER_THREE_MONTHS;
        }
        return FollowUpStatus.ACTIVE;
    }

    private boolean exceedsThreshold(LocalDate lastConsultationDate,
                                     LocalDate today,
                                     long dayThreshold,
                                     LocalDate calendarThresholdDate) {
        if (useDayThresholds) {
            return ChronoUnit.DAYS.between(lastConsultationDate, today) >= dayThreshold;
        }
        return lastConsultationDate.isBefore(calendarThresholdDate);
    }

    private NotificationPriority resolvePriority(FollowUpStatus status) {
        return switch (status) {
            case OVER_ONE_YEAR -> NotificationPriority.CRITICAL;
            case OVER_SIX_MONTHS -> NotificationPriority.HIGH;
            case OVER_THREE_MONTHS -> NotificationPriority.MEDIUM;
            default -> NotificationPriority.LOW;
        };
    }

    private String resolveLabel(FollowUpStatus status, long months, long days) {
        String elapsed = months > 0 ? months + " meses" : days + " días";
        return switch (status) {
            case ACTIVE -> "Paciente activo";
            case OVER_THREE_MONTHS -> "Ultimo control hace " + elapsed;
            case OVER_SIX_MONTHS -> "Ultimo control hace " + elapsed;
            case OVER_ONE_YEAR -> "Hace más de 1 año que no realiza controles";
            case WITHOUT_VALID_CONSULTATION -> "Sin controles finalizados";
        };
    }

    private String resolveRecommendation(FollowUpStatus status) {
        return switch (status) {
            case ACTIVE -> "El paciente tuvo controles recientes.";
            case OVER_THREE_MONTHS, OVER_SIX_MONTHS, OVER_ONE_YEAR ->
                    "Se recomienda contactar al paciente para realizar un seguimiento nutricional.";
            case WITHOUT_VALID_CONSULTATION -> "Se recomienda registrar o programar un control nutricional.";
        };
    }

    private Long resolveProfessionalScopeId() {
        CurrentUserContext currentUser = currentUserProvider.getCurrentUser();
        if ("ADMIN".equals(currentUser.role())) {
            return null;
        }
        if ("PROFESSIONAL".equals(currentUser.role())) {
            return currentProfessionalProvider.requireCurrentProfessionalId();
        }
        throw new ApiException("No tenes permisos para consultar seguimiento de pacientes", HttpStatus.FORBIDDEN.value());
    }

    private String fullName(String firstName, String lastName) {
        String fullName = ((firstName == null ? "" : firstName) + " " + (lastName == null ? "" : lastName)).trim();
        return fullName.isBlank() ? "Nombre no informado" : fullName;
    }

    private record FollowUpCandidate(
            Long patientId,
            String patientFullName,
            Long professionalId,
            String professionalFullName,
            LocalDate lastConsultationDate
    ) {
    }
}
