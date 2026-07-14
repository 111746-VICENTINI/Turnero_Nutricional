package nutricentro.repositories;

import nutricentro.entities.AppointmentTimelineEventEntity;
import nutricentro.enums.AppointmentEventType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
/** Consulta eventos del timeline funcional de turnos. */
public interface AppointmentTimelineEventRepository extends JpaRepository<AppointmentTimelineEventEntity, Long> {

    /** Obtiene el timeline de un turno en orden cronológico. */
    List<AppointmentTimelineEventEntity> findByAppointmentIdOrderByOccurredAtAscIdAsc(Long appointmentId);

    /** Busca turnos que ya tienen determinados eventos registrados. */
    @Query("""
    select distinct event.appointment.id
    from AppointmentTimelineEventEntity event
    where event.appointment.id in :appointmentIds
    and event.eventType in :eventTypes
    """)
    List<Long> findAppointmentIdsWithEventTypes(
            @Param("appointmentIds") Collection<Long> appointmentIds,
            @Param("eventTypes") Collection<AppointmentEventType> eventTypes
    );

    /** Obtiene el ultimo evento registrado para los tipos indicados. */
    Optional<AppointmentTimelineEventEntity> findTopByEventTypeInOrderByOccurredAtDescIdDesc(Collection<AppointmentEventType> eventTypes);
}
