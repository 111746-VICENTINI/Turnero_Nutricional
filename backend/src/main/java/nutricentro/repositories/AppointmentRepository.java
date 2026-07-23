package nutricentro.repositories;

import nutricentro.entities.AppointmentEntity;
import nutricentro.enums.AppointmentStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

@Repository
/** Consulta y bloquea turnos para operaciones de agenda. */
public interface AppointmentRepository extends JpaRepository<AppointmentEntity, Long>,
        JpaSpecificationExecutor<AppointmentEntity> {

    /** Busca un turno por id aplicando bloqueo de escritura. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select appointment from AppointmentEntity appointment where appointment.id = :id")
    java.util.Optional<AppointmentEntity> findByIdForUpdate(@Param("id") Long id);

    /** Busca turnos de un profesional en una fecha excluyendo estados no bloqueantes. */
    List<AppointmentEntity> findByProfessionalIdAndDateAndStatusNotIn(Long professionalId, LocalDate date, Collection<AppointmentStatus> status);

    /** Busca turnos de un paciente en una fecha excluyendo estados no bloqueantes. */
    List<AppointmentEntity> findByPatientIdAndDateAndStatusNotIn(Long patientId, LocalDate date, Collection<AppointmentStatus> status);

    boolean existsByPatientIdAndProfessionalId(Long patientId, Long professionalId);

    /** Busca turnos futuros de un profesional excluyendo estados no bloqueantes. */
    List<AppointmentEntity> findByProfessionalIdAndDateGreaterThanEqualAndStatusNotIn(
            Long professionalId,
            LocalDate date,
            Collection<AppointmentStatus> status
    );

    /** Busca turnos pendientes para asociar respuestas recibidas por WhatsApp. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
    select appointment
    from AppointmentEntity appointment
    join fetch appointment.patient
    join fetch appointment.professional
    where appointment.date >= :date
    and appointment.status in :statuses
    order by appointment.date asc, appointment.time asc
    """)
    List<AppointmentEntity> findWhatsAppReplyCandidatesForUpdate(
            @Param("date") LocalDate date,
            @Param("statuses") Collection<AppointmentStatus> statuses
    );

    /** Busca turnos candidatos para enviar recordatorios automáticos. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
    select appointment
    from AppointmentEntity appointment
    join fetch appointment.patient
    join fetch appointment.professional
    where appointment.date between :dateFrom and :dateTo
    and appointment.status in :statuses
    order by appointment.date asc, appointment.time asc
    """)
    List<AppointmentEntity> findReminderCandidatesForUpdate(
            @Param("dateFrom") LocalDate dateFrom,
            @Param("dateTo") LocalDate dateTo,
            @Param("statuses") Collection<AppointmentStatus> statuses
    );

    /** Busca controles realizados para calcular seguimiento sin persistir datos derivados. */
    @Query("""
    select appointment
    from AppointmentEntity appointment
    join fetch appointment.patient patient
    join fetch appointment.professional professional
    where appointment.status = :status
    and appointment.date <= :date
    and patient.status = nutricentro.enums.PersonStatus.ACTIVE
    and (:professionalId is null or professional.id = :professionalId)
    order by appointment.date desc, appointment.time desc
    """)
    List<AppointmentEntity> findValidCompletedAppointmentsForFollowUp(
            @Param("status") AppointmentStatus status,
            @Param("date") LocalDate date,
            @Param("professionalId") Long professionalId
    );
}
