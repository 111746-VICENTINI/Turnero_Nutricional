package nutricentro.repositories;

import nutricentro.entities.ClinicalDataEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClinicalDataRepository extends JpaRepository<ClinicalDataEntity, Long> {
    Optional<ClinicalDataEntity> findByMedicalHistoryId(Long medicalHistoryId);
}
