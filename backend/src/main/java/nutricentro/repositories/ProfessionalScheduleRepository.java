package nutricentro.repositories;

import nutricentro.entities.ProfessionalScheduleEntity;
import nutricentro.enums.PersonStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

public interface ProfessionalScheduleRepository extends JpaRepository<ProfessionalScheduleEntity, Long>,
                                                        JpaSpecificationExecutor<ProfessionalScheduleEntity> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select schedule from ProfessionalScheduleEntity schedule where schedule.id = :id")
    Optional<ProfessionalScheduleEntity> findByIdForUpdate(@Param("id") Long id);

    List<ProfessionalScheduleEntity> findByProfessionalId(Long professionalId);
    List<ProfessionalScheduleEntity> findByProfessionalIdAndStatus(Long professionalId, PersonStatus status);
    List<ProfessionalScheduleEntity> findByProfessionalIdAndDayOfWeekAndStatus(Long professionalId, DayOfWeek dayOfWeek, PersonStatus status);
    Optional<ProfessionalScheduleEntity> findByProfessionalIdAndDayOfWeekAndStartTime(Long professionalId, DayOfWeek dayOfWeek, LocalTime startTime);
    boolean existsByProfessionalIdAndDayOfWeekAndStartTimeAndIdNot(Long professionalId, DayOfWeek dayOfWeek, LocalTime startTime, Long id);

    boolean existsByProfessionalIdAndDayOfWeekAndStatusAndStartTimeLessThanAndEndTimeGreaterThan(Long professionalId, DayOfWeek dayOfWeek,
                                                                                                 PersonStatus status, LocalTime endTime,
                                                                                                 LocalTime startTime);

    @Query("""
    SELECT COUNT(ps) > 0
    FROM ProfessionalScheduleEntity ps
    WHERE ps.id <> :scheduleId
    AND ps.professional.id = :professionalId
    AND ps.dayOfWeek = :dayOfWeek
    AND ps.status = 'ACTIVE'
    AND :startTime < ps.endTime
    AND :endTime > ps.startTime
    """)
    boolean existsOverlappingScheduleExcludingId(Long scheduleId, Long professionalId, DayOfWeek dayOfWeek, LocalTime startTime, LocalTime endTime);
}
