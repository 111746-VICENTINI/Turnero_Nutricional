package nutricentro.repositories;

import nutricentro.entities.ProfessionalScheduleBreakEntity;
import nutricentro.enums.PersonStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ProfessionalScheduleBreakRepository extends JpaRepository<ProfessionalScheduleBreakEntity, Long> {
    List<ProfessionalScheduleBreakEntity> findByScheduleIdInAndStatus(Collection<Long> scheduleIds, PersonStatus status);
    List<ProfessionalScheduleBreakEntity> findByScheduleIdAndStatus(Long scheduleId, PersonStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select scheduleBreak from ProfessionalScheduleBreakEntity scheduleBreak where scheduleBreak.id = :id")
    Optional<ProfessionalScheduleBreakEntity> findByIdForUpdate(@Param("id") Long id);
}
