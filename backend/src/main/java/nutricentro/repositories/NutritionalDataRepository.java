package nutricentro.repositories;

import nutricentro.entities.NutritionalDataEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NutritionalDataRepository extends JpaRepository<NutritionalDataEntity, Long> {
    Optional<NutritionalDataEntity> findByMedicalHistoryId(Long medicalHistoryId);
}
