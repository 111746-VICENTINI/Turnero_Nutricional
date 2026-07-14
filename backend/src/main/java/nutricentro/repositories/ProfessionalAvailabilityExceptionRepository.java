package nutricentro.repositories;

import nutricentro.entities.ProfessionalAvailabilityExceptionEntity;
import nutricentro.enums.PersonStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ProfessionalAvailabilityExceptionRepository
        extends JpaRepository<ProfessionalAvailabilityExceptionEntity, Long> {

    @Query("""
    SELECT exception
    FROM ProfessionalAvailabilityExceptionEntity exception
    LEFT JOIN exception.professional professional
    WHERE exception.date = :date
    AND exception.status = :status
    AND (
        exception.appliesToAllProfessionals = true
        OR professional.id = :professionalId
    )
    """)
    List<ProfessionalAvailabilityExceptionEntity> findActiveForProfessionalAndDate(
            @Param("professionalId") Long professionalId,
            @Param("date") LocalDate date,
            @Param("status") PersonStatus status
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select exception from ProfessionalAvailabilityExceptionEntity exception where exception.id = :id")
    Optional<ProfessionalAvailabilityExceptionEntity> findByIdForUpdate(@Param("id") Long id);
}
