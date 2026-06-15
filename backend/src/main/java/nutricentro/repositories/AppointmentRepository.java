package nutricentro.repositories;

import nutricentro.entities.AppointmentEntity;
import nutricentro.enums.AppointmentStatus;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;

@Repository
public interface AppointmentRepository extends JpaRepository<AppointmentEntity, Long>,
        JpaSpecificationExecutor<AppointmentEntity> {

    boolean existsByProfessionalProfessionalIdAndDateAndTimeAndStatusNotIn(
            Long professionalId,
            LocalDate date,
            LocalTime time,
            Collection<AppointmentStatus> status
    );

    boolean existsByProfessionalProfessionalIdAndDateAndTimeAndStatusNotInAndIdNot(
            Long professionalId,
            LocalDate date,
            LocalTime time,
            Collection<AppointmentStatus> status,
            Long id
    );
}
