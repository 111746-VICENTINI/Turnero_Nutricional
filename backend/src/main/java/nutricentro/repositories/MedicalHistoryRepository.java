package nutricentro.repositories;

import nutricentro.entities.MedicalHistoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MedicalHistoryRepository extends JpaRepository<MedicalHistoryEntity, Long>, JpaSpecificationExecutor<MedicalHistoryEntity> {
    Optional<MedicalHistoryEntity> findByPatientId(Long patientId);
}
