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
import nutricentro.entities.SpecialtyEntity;
import nutricentro.enums.AppointmentEventType;
import nutricentro.enums.AppointmentStatus;
import nutricentro.enums.PersonStatus;
import nutricentro.exception.ApiException;
import nutricentro.repositories.AppointmentRepository;
import nutricentro.repositories.AppointmentTimelineEventRepository;
import nutricentro.repositories.ConsultationRepository;
import nutricentro.repositories.PatientRepository;
import nutricentro.repositories.ProfessionalRepository;
import nutricentro.repositories.SecretaryRepository;
import nutricentro.services.AppointmentAvailabilityCriteria;
import nutricentro.services.AppointmentAvailabilityService;
import nutricentro.services.AppointmentService;
import nutricentro.services.AppointmentSnapshot;
import nutricentro.services.AppointmentStateMachine;
import nutricentro.services.AppointmentTimelineService;
import nutricentro.services.CurrentProfessionalProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.EnumSet;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;

@Service
@RequiredArgsConstructor
/** Implementa la gestión transaccional de turnos, WhatsApp y recordatorios. */
public class AppointmentServiceImpl implements AppointmentService {

    private static final Logger log = LoggerFactory.getLogger(AppointmentServiceImpl.class);
    private static final Set<DayOfWeek> DEFAULT_BUSINESS_DAYS = Set.of(
            DayOfWeek.MONDAY,
            DayOfWeek.TUESDAY,
            DayOfWeek.WEDNESDAY,
            DayOfWeek.THURSDAY,
            DayOfWeek.FRIDAY
    );

    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;
    private final ProfessionalRepository professionalRepository;
    private final SecretaryRepository secretaryRepository;
    private final AppointmentAvailabilityService appointmentAvailabilityService;
    private final AppointmentStateMachine appointmentStateMachine;
    private final AppointmentTimelineService appointmentTimelineService;
    private final AppointmentTimelineEventRepository appointmentTimelineEventRepository;
    private final ConsultationRepository consultationRepository;
    private final WhatsAppNotificationService whatsAppNotificationService;
    private final CurrentProfessionalProvider currentProfessionalProvider;
    @Value("${appointment.reminder.enabled:true}")
    private boolean reminderEnabled = true;
    @Value("${appointment.reminder.hours-before:24}")
    private long reminderHoursBefore = 24;
    @Value("${appointment.reminder.look-ahead-days:7}")
    private long reminderLookAheadDays = 7;
    @Value("${appointment.reminder.business-days:MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY}")
    private String reminderBusinessDays;
    private Clock clock = Clock.systemDefaultZone();

    private static final List<AppointmentStatus> REMINDER_STATUSES = List.of(
            AppointmentStatus.PENDING,
            AppointmentStatus.CONFIRMED,
            AppointmentStatus.RESCHEDULED
    );
    private static final List<AppointmentEventType> REMINDER_EVENT_TYPES = List.of(
            AppointmentEventType.WHATSAPP_REMINDER_SENT,
            AppointmentEventType.WHATSAPP_REMINDER_FAILED
    );
    private static final Set<String> CONFIRMATION_REPLIES = Set.of(
            "si",
            "confirmo",
            "voy",
            "asisto",
            "ok",
            "\uD83D\uDC4D"
    );
    private static final Set<String> CANCELLATION_REPLIES = Set.of(
            "no",
            "cancelo",
            "cancelar",
            "no voy",
            "\uD83D\uDC4E"
    );

    @Override
    @Transactional
    /** Crea un turno validando disponibilidad, timeline y mensaje inicial. */
    public AppointmentResponseDTO createAppointment(AppointmentRequestDTO dto) {
        AppointmentStatus status = appointmentStateMachine.resolveCreationStatus(dto.getStatus());

        PatientEntity patient = patientRepository.findByIdForUpdate(dto.getPatientId())
                .orElseThrow(() -> new EntityNotFoundException("Paciente no encontrado"));
        Long professionalId = writableProfessionalId(dto.getProfessionalId(), null);
        ProfessionalEntity professional = professionalRepository.findByIdForUpdate(professionalId)
                .orElseThrow(() -> new EntityNotFoundException("Profesional no encontrado"));
        validateActivePeople(patient, professional);

        SecretaryEntity secretary = findSecretary(dto.getSecretaryId());
        String feeType = resolveRequestedFeeType(dto.getFeeType(), patient.getId(), professional.getId());
        validateActiveAppointment(
                null,
                professional.getId(),
                patient.getId(),
                dto.getDate(),
                dto.getTime(),
                feeType
        );

        AppointmentEntity appointment = new AppointmentEntity();
        appointment.setDate(dto.getDate());
        appointment.setTime(dto.getTime());
        appointment.setStatus(status);
        appointment.setReason(dto.getReason());
        appointment.setPatient(patient);
        appointment.setProfessional(professional);
        appointment.setSecretary(secretary);
        applyAppointmentFee(appointment, dto.getAppliedFee(), dto.getFeeType(), dto.getFeeCurrency());

        AppointmentEntity savedAppointment = appointmentRepository.save(appointment);
        appointmentTimelineService.recordCreation(savedAppointment);
        sendInitialWhatsAppMessage(savedAppointment);
        return toResponse(savedAppointment);
    }

    @Override
    /** Obtiene un turno por identificador. */
    public AppointmentResponseDTO getAppointmentById(Long id) {
        AppointmentEntity appointment = findAppointment(id);
        validateProfessionalCanAccess(appointment);
        return toResponse(appointment);
    }

    @Override
    @Transactional
    /** Actualiza un turno y registra sus cambios funcionales. */
    public AppointmentResponseDTO updateAppointment(Long id, AppointmentUpdateDTO dto) {
        AppointmentEntity appointment = findAppointmentForUpdate(id);
        validateProfessionalCanAccess(appointment);
        AppointmentSnapshot previousSnapshot = AppointmentSnapshot.from(appointment);

        LocalDate date = dto.getDate() != null ? dto.getDate() : appointment.getDate();
        LocalTime time = dto.getTime() != null ? dto.getTime() : appointment.getTime();
        Long patientId = dto.getPatientId() != null
                ? dto.getPatientId()
                : appointment.getPatient().getId();
        PatientEntity patient = patientRepository.findByIdForUpdate(patientId)
                .orElseThrow(() -> new EntityNotFoundException("Paciente no encontrado"));
        Long professionalId = writableProfessionalId(dto.getProfessionalId(), appointment.getProfessional().getId());
        ProfessionalEntity professional = professionalRepository.findByIdForUpdate(professionalId)
                .orElseThrow(() -> new EntityNotFoundException("Profesional no encontrado"));
        validateProfessionalCanUseTarget(professional.getId());
        SecretaryEntity secretary = dto.getSecretaryId() != null
                ? findSecretary(dto.getSecretaryId())
                : appointment.getSecretary();

        boolean scheduleChanged = !Objects.equals(date, appointment.getDate())
                || !Objects.equals(time, appointment.getTime())
                || !Objects.equals(professional.getId(), appointment.getProfessional().getId());
        boolean patientChanged = !Objects.equals(patient.getId(), appointment.getPatient().getId());

        AppointmentStatus status = appointmentStateMachine.resolveUpdateStatus(
                appointment.getStatus(),
                dto.getStatus(),
                scheduleChanged,
                appointment.getDate(),
                appointment.getTime()
        );

        if (appointmentStateMachine.isActive(status)) {
            validateActivePeople(patient, professional);
            String feeType = resolveRequestedFeeType(
                    dto.getFeeType() != null ? dto.getFeeType() : appointment.getFeeType(),
                    patient.getId(),
                    professional.getId()
            );
            boolean durationChanged = dto.getFeeType() != null && !Objects.equals(dto.getFeeType(), appointment.getFeeType());
            if (scheduleChanged || patientChanged || durationChanged) {
                validateActiveAppointment(id, professional.getId(), patient.getId(), date, time, feeType);
            }
        } else {
            if (patientChanged) {
                throw new ApiException(
                        "No se puede cambiar el paciente al finalizar o cancelar un turno",
                        HttpStatus.BAD_REQUEST.value()
                );
            }
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
        if (dto.getAppliedFee() != null || dto.getFeeType() != null || dto.getFeeCurrency() != null) {
            applyAppointmentFee(appointment, dto.getAppliedFee(), dto.getFeeType(), dto.getFeeCurrency());
        }

        AppointmentEntity savedAppointment = appointmentRepository.save(appointment);
        appointmentTimelineService.recordChanges(previousSnapshot, savedAppointment);
        return toResponse(savedAppointment);
    }

    @Override
    @Transactional
    /** Cancela un turno usando la máquina de estados. */
    public void deleteAppointment(Long id) {
        AppointmentEntity appointment = findAppointmentForUpdate(id);
        validateProfessionalCanAccess(appointment);
        if (appointment.getStatus() == AppointmentStatus.CANCELED) {
            return;
        }
        AppointmentSnapshot previousSnapshot = AppointmentSnapshot.from(appointment);
        appointmentStateMachine.validateCancellation(appointment.getStatus(), appointment.getDate(), appointment.getTime());
        validateNoLinkedConsultationForCancellation(appointment);
        appointment.setStatus(AppointmentStatus.CANCELED);
        AppointmentEntity savedAppointment = appointmentRepository.save(appointment);
        appointmentTimelineService.recordChanges(previousSnapshot, savedAppointment);
    }

    @Override
    /** Lista turnos por estado. */
    public List<AppointmentResponseDTO> getAppointmentsByStatus(AppointmentStatus status) {
        Long visibleProfessionalId = visibleProfessionalId(null);
        return appointmentRepository.findAll(
                        Specification.allOf(byStatus(status), byProfessional(visibleProfessionalId)),
                        Sort.by("date").ascending().and(Sort.by("time").ascending())
                ).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    /** Busca turnos aplicando filtros dinámicos y paginación. */
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

        Long visibleProfessionalId = visibleProfessionalId(professionalId);
        Specification<AppointmentEntity> spec = Specification.allOf(
                byStatus(status),
                dateGreaterThanOrEqual(dateFrom),
                dateLessThanOrEqual(dateTo),
                byPatient(patientId),
                byProfessional(visibleProfessionalId),
                bySecretary(secretaryId),
                bySearch(search)
        );

        return appointmentRepository.findAll(spec, pageable).map(this::toResponse);
    }

    @Override
    @Transactional
    /** Interpreta respuestas de WhatsApp y actualiza el turno asociado. */
    public void handleWhatsAppTextReply(String phone, String text) {
        String normalizedPhone = normalizePhone(phone);
        String normalizedReply = normalizeReply(text);
        if (normalizedPhone.isBlank() || normalizedReply.isBlank()) {
            return;
        }

        List<AppointmentEntity> candidates = appointmentRepository
                .findWhatsAppReplyCandidatesForUpdate(LocalDate.now(), List.of(AppointmentStatus.PENDING))
                .stream()
                .filter(appointment -> normalizedPhone.equals(normalizePhone(appointment.getPatient().getMobile())))
                .toList();

        if (candidates.isEmpty()) {
            return;
        }
        if (candidates.size() > 1) {
            candidates.forEach(appointment -> appointmentTimelineService.recordWhatsAppResponse(
                    appointment,
                    AppointmentEventType.WHATSAPP_RESPONSE_AMBIGUOUS,
                    text
            ));
            return;
        }

        AppointmentEntity appointment = candidates.get(0);
        appointmentTimelineService.recordWhatsAppResponse(
                appointment,
                AppointmentEventType.WHATSAPP_RESPONSE_RECEIVED,
                text
        );

        AppointmentStatus targetStatus = resolveWhatsAppTargetStatus(normalizedReply);
        if (targetStatus == null) {
            appointmentTimelineService.recordWhatsAppResponse(
                    appointment,
                    AppointmentEventType.WHATSAPP_RESPONSE_INVALID,
                    text
            );
            return;
        }

        AppointmentSnapshot previousSnapshot = AppointmentSnapshot.from(appointment);
        if (targetStatus == AppointmentStatus.CANCELED) {
            appointmentStateMachine.validateCancellation(appointment.getStatus(), appointment.getDate(), appointment.getTime());
            validateNoLinkedConsultationForCancellation(appointment);
        } else {
            appointmentStateMachine.validateTransition(
                    appointment.getStatus(),
                    targetStatus,
                    appointment.getDate(),
                    appointment.getTime()
            );
        }

        appointment.setStatus(targetStatus);
        AppointmentEntity savedAppointment = appointmentRepository.save(appointment);
        appointmentTimelineService.recordChanges(previousSnapshot, savedAppointment);
    }

    private void validateNoLinkedConsultationForCancellation(AppointmentEntity appointment) {
        if (appointment.getId() == null) {
            return;
        }
        if (consultationRepository.findByAppointmentId(appointment.getId()).isPresent()) {
            throw new ApiException(
                    "No se puede cancelar un turno con una consulta clinica asociada",
                    HttpStatus.CONFLICT.value()
            );
        }
    }

    private void validateProfessionalCanAccess(AppointmentEntity appointment) {
        Long professionalId = currentProfessionalId();
        if (professionalId == null) {
            return;
        }
        Long appointmentProfessionalId = appointment.getProfessional() != null
                ? appointment.getProfessional().getId()
                : null;
        if (!Objects.equals(professionalId, appointmentProfessionalId)) {
            throw new EntityNotFoundException("Turno no encontrado");
        }
    }

    private void validateProfessionalCanUseTarget(Long targetProfessionalId) {
        Long professionalId = currentProfessionalId();
        if (professionalId != null && !Objects.equals(professionalId, targetProfessionalId)) {
            throw new EntityNotFoundException("Profesional no encontrado");
        }
    }

    private Long visibleProfessionalId(Long requestedProfessionalId) {
        Long professionalId = currentProfessionalId();
        return professionalId != null ? professionalId : requestedProfessionalId;
    }

    private Long writableProfessionalId(Long requestedProfessionalId, Long currentAppointmentProfessionalId) {
        Long professionalId = currentProfessionalId();
        if (professionalId != null) {
            return professionalId;
        }
        Long targetProfessionalId = requestedProfessionalId != null ? requestedProfessionalId : currentAppointmentProfessionalId;
        if (targetProfessionalId == null) {
            throw new ApiException("Debe indicar un profesional", HttpStatus.BAD_REQUEST.value());
        }
        return targetProfessionalId;
    }

    private Long currentProfessionalId() {
        return currentProfessionalProvider != null && currentProfessionalProvider.isProfessional()
                ? currentProfessionalProvider.requireCurrentProfessionalId()
                : null;
    }

    @Override
    @Scheduled(cron = "${appointment.reminder.cron}")
    @Transactional
    /** Envía recordatorios pendientes en días hábiles configurados. */
    public void sendDueAppointmentReminders() {
        if (!reminderEnabled) {
            return;
        }

        LocalDateTime now = LocalDateTime.now(clock);
        Set<DayOfWeek> businessDays = configuredBusinessDays();
        if (!isBusinessDate(now.toLocalDate(), businessDays)) {
            return;
        }

        if (reminderHoursBefore <= 0 || reminderLookAheadDays <= 0) {
            log.warn("La configuración de recordatorios debe tener horas previas y búsqueda futura mayores a cero");
            return;
        }

        LocalDate queryTo = now.toLocalDate().plusDays(reminderLookAheadDays);
        List<AppointmentEntity> dueAppointments = appointmentRepository.findReminderCandidatesForUpdate(
                        now.toLocalDate(),
                        queryTo,
                        REMINDER_STATUSES
                )
                .stream()
                .filter(appointment -> isReminderDue(appointment, now, businessDays))
                .toList();

        if (dueAppointments.isEmpty()) {
            return;
        }

        List<Long> dueAppointmentIds = dueAppointments.stream()
                .map(AppointmentEntity::getId)
                .filter(Objects::nonNull)
                .toList();
        if (dueAppointmentIds.isEmpty()) {
            return;
        }

        Set<Long> processedAppointmentIds = new HashSet<>(appointmentTimelineEventRepository.findAppointmentIdsWithEventTypes(
                dueAppointmentIds,
                REMINDER_EVENT_TYPES
        ));

        dueAppointments.stream()
                .filter(appointment -> appointment.getId() != null)
                .filter(appointment -> !processedAppointmentIds.contains(appointment.getId()))
                .forEach(this::sendReminderSafely);
    }

    private void validateActiveAppointment(Long appointmentId,
                                           Long professionalId,
                                           Long patientId,
                                           LocalDate date,
                                           LocalTime time,
                                           String feeType) {
        appointmentAvailabilityService.validateAvailability(new AppointmentAvailabilityCriteria(
                appointmentId,
                professionalId,
                patientId,
                date,
                time,
                durationByFeeType(feeType),
                null,
                null
        ));
    }

    private void sendInitialWhatsAppMessage(AppointmentEntity appointment) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    sendInitialWhatsAppMessageSafely(appointment);
                }
            });
            return;
        }

        sendInitialWhatsAppMessageSafely(appointment);
    }

    private void sendInitialWhatsAppMessageSafely(AppointmentEntity appointment) {
        try {
            whatsAppNotificationService.sendAppointmentCreatedMessage(appointment);
        } catch (Exception exception) {
            log.warn(
                    "No se pudo solicitar el envio de WhatsApp para el turno {}. {}",
                    appointment.getId(),
                    exception.getMessage()
            );
        }
    }

    private boolean isReminderDue(AppointmentEntity appointment, LocalDateTime now, Set<DayOfWeek> businessDays) {
        LocalDateTime appointmentDateTime = LocalDateTime.of(appointment.getDate(), appointment.getTime());
        if (!appointmentDateTime.isAfter(now)) {
            return false;
        }
        LocalDateTime reminderDateTime = previousBusinessDateTime(
                appointmentDateTime.minusHours(reminderHoursBefore),
                businessDays
        );
        return !reminderDateTime.isAfter(now);
    }

    private LocalDateTime previousBusinessDateTime(LocalDateTime dateTime, Set<DayOfWeek> businessDays) {
        LocalDateTime businessDateTime = dateTime;
        while (!isBusinessDate(businessDateTime.toLocalDate(), businessDays)) {
            businessDateTime = businessDateTime.minusDays(1);
        }
        return businessDateTime;
    }

    private boolean isBusinessDate(LocalDate date, Set<DayOfWeek> businessDays) {
        return businessDays.contains(date.getDayOfWeek());
    }

    private Set<DayOfWeek> configuredBusinessDays() {
        if (reminderBusinessDays == null || reminderBusinessDays.isBlank()) {
            return DEFAULT_BUSINESS_DAYS;
        }

        EnumSet<DayOfWeek> businessDays = EnumSet.noneOf(DayOfWeek.class);
        Arrays.stream(reminderBusinessDays.split(","))
                .map(day -> day.trim().toUpperCase(Locale.ROOT))
                .filter(day -> !day.isBlank())
                .forEach(day -> addBusinessDay(day, businessDays));

        return businessDays.isEmpty() ? DEFAULT_BUSINESS_DAYS : businessDays;
    }

    private void addBusinessDay(String day, Set<DayOfWeek> businessDays) {
        try {
            businessDays.add(DayOfWeek.valueOf(day));
        } catch (IllegalArgumentException exception) {
            log.warn("Dia habil invalido para recordatorios: {}", day);
        }
    }

    private void sendReminderSafely(AppointmentEntity appointment) {
        try {
            whatsAppNotificationService.sendAppointmentReminderMessage(appointment);
        } catch (Exception exception) {
            String error = exception.getMessage() != null ? exception.getMessage() : exception.getClass().getSimpleName();
            log.warn("No se pudo enviar el recordatorio de WhatsApp para el turno {}. {}", appointment.getId(), error);
            try {
                appointmentTimelineService.recordWhatsAppReminderResult(appointment, false, error);
            } catch (Exception timelineException) {
                log.warn("No se pudo registrar el error del recordatorio en el timeline del turno {}", appointment.getId());
            }
        }
    }

    private AppointmentStatus resolveWhatsAppTargetStatus(String reply) {
        if (CONFIRMATION_REPLIES.contains(reply)) {
            return AppointmentStatus.CONFIRMED;
        }
        if (CANCELLATION_REPLIES.contains(reply)) {
            return AppointmentStatus.CANCELED;
        }
        return null;
    }

    private String normalizeReply(String text) {
        if (text == null) {
            return "";
        }
        return Normalizer.normalize(text.trim().toLowerCase(Locale.ROOT), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
    }

    private String normalizePhone(String phone) {
        return phone == null ? "" : phone.replaceAll("[^0-9]", "");
    }

    private void validateActivePeople(PatientEntity patient, ProfessionalEntity professional) {
        if (patient.getStatus() != PersonStatus.ACTIVE) {
            throw new ApiException("El paciente no esta activo", HttpStatus.CONFLICT.value());
        }
        if (professional.getStatus() != PersonStatus.ACTIVE) {
            throw new ApiException("El profesional no esta activo", HttpStatus.CONFLICT.value());
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
        if (secretaryId == null || secretaryId <= 0) {
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
                .appliedFee(appointment.getAppliedFee())
                .feeType(appointment.getFeeType())
                .feeCurrency(appointment.getFeeCurrency())
                .feeEditable(appointment.getFeeEditable())
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
            Join<ProfessionalEntity, SpecialtyEntity> specialty = professional.join("specialties", JoinType.LEFT);
            query.distinct(true);

            return cb.or(
                    cb.like(cb.lower(root.get("reason").as(String.class)), pattern),
                    cb.like(cb.lower(patient.get("firstName").as(String.class)), pattern),
                    cb.like(cb.lower(patient.get("lastName").as(String.class)), pattern),
                    cb.like(patient.get("document").as(String.class), pattern),
                    cb.like(cb.lower(patient.get("mobile").as(String.class)), pattern),
                    cb.like(cb.lower(professional.get("firstName").as(String.class)), pattern),
                    cb.like(cb.lower(professional.get("lastName").as(String.class)), pattern),
                    cb.like(professional.get("document").as(String.class), pattern),
                    cb.like(cb.lower(professional.get("registration").as(String.class)), pattern),
                    cb.like(cb.lower(specialty.get("name").as(String.class)), pattern),
                    cb.like(cb.lower(secretary.get("firstName").as(String.class)), pattern),
                    cb.like(cb.lower(secretary.get("lastName").as(String.class)), pattern)
            );
        };
    }

    private void applyAppointmentFee(AppointmentEntity appointment,
                                     BigDecimal requestedFee,
                                     String requestedFeeType,
                                     String requestedCurrency) {
        ProfessionalEntity professional = appointment.getProfessional();
        String feeType = normalizeFeeType(requestedFeeType);
        if (feeType == null) {
            feeType = resolveAutomaticFeeType(appointment.getPatient().getId(), professional.getId());
        }

        boolean feeEditable = !Boolean.FALSE.equals(professional.getAllowAppointmentFeeOverride());
        BigDecimal configuredFee = feeForType(professional, feeType);
        BigDecimal appliedFee = feeEditable && requestedFee != null ? requestedFee : configuredFee;
        if (appliedFee != null && appliedFee.compareTo(BigDecimal.ZERO) < 0) {
            throw new ApiException("El importe del turno no puede ser negativo", HttpStatus.BAD_REQUEST.value());
        }

        appointment.setFeeType(feeType);
        appointment.setAppliedFee(appliedFee);
        appointment.setFeeCurrency(resolveCurrency(requestedCurrency, professional.getFeeCurrency()));
        appointment.setFeeEditable(feeEditable);
    }

    private String resolveAutomaticFeeType(Long patientId, Long professionalId) {
        return consultationRepository.countByPatientIdAndProfessionalId(patientId, professionalId) > 0
                ? "CONTROL"
                : "FIRST";
    }

    private String resolveRequestedFeeType(String requestedFeeType, Long patientId, Long professionalId) {
        String feeType = normalizeFeeType(requestedFeeType);
        return feeType != null ? feeType : resolveAutomaticFeeType(patientId, professionalId);
    }

    private int durationByFeeType(String feeType) {
        return "FIRST".equalsIgnoreCase(feeType) ? 60 : 30;
    }

    private BigDecimal feeForType(ProfessionalEntity professional, String feeType) {
        return switch (feeType) {
            case "ONLINE" -> professional.getOnlineConsultationFee() != null
                    ? professional.getOnlineConsultationFee()
                    : professional.getFollowUpConsultationFee();
            case "CONTROL" -> professional.getFollowUpConsultationFee();
            default -> professional.getFirstConsultationFee();
        };
    }

    private String normalizeFeeType(String feeType) {
        if (feeType == null || feeType.isBlank()) {
            return null;
        }
        String normalized = feeType.trim().toUpperCase(Locale.ROOT);
        if (Set.of("FIRST", "CONTROL", "ONLINE").contains(normalized)) {
            return normalized;
        }
        return null;
    }

    private String resolveCurrency(String requestedCurrency, String professionalCurrency) {
        String currency = requestedCurrency != null && !requestedCurrency.isBlank()
                ? requestedCurrency
                : professionalCurrency;
        return currency == null || currency.isBlank() ? "ARS" : currency.trim().toUpperCase(Locale.ROOT);
    }

    private String fullName(String firstName, String lastName) {
        return String.join(" ", firstName, lastName).trim();
    }
}
