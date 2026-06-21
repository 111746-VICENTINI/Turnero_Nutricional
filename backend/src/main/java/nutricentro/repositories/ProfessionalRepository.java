package nutricentro.repositories;

import nutricentro.entities.ProfessionalEntity;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ProfessionalRepository extends JpaRepository<ProfessionalEntity, Long>, JpaSpecificationExecutor<ProfessionalEntity> {
    boolean existsBySpecialties_Id(Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select professional from ProfessionalEntity professional where professional.id = :id")
    java.util.Optional<ProfessionalEntity> findByIdForUpdate(@Param("id") Long id);
}
