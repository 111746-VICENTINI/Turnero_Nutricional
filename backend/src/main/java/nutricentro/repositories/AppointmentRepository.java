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
public interface AppointmentRepository extends JpaRepository<AppointmentEntity, Long>,
        JpaSpecificationExecutor<AppointmentEntity> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select appointment from AppointmentEntity appointment where appointment.id = :id")
    java.util.Optional<AppointmentEntity> findByIdForUpdate(@Param("id") Long id);

    List<AppointmentEntity> findByProfessionalIdAndDateAndStatusNotIn(Long professionalId, LocalDate date, Collection<AppointmentStatus> status);
    List<AppointmentEntity> findByPatientIdAndDateAndStatusNotIn(Long patientId, LocalDate date, Collection<AppointmentStatus> status);
    List<AppointmentEntity> findByProfessionalIdAndDateGreaterThanEqualAndStatusNotIn(
            Long professionalId,
            LocalDate date,
            Collection<AppointmentStatus> status
    );
}
