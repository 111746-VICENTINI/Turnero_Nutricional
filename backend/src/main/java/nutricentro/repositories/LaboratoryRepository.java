package nutricentro.repositories;

import nutricentro.entities.LaboratoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LaboratoryRepository extends JpaRepository<LaboratoryEntity, Long> {
    List<LaboratoryEntity> findByMedicalHistoryIdOrderByDateDesc(Long medicalHistoryId);
}
