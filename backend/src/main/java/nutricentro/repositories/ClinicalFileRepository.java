package nutricentro.repositories;

import nutricentro.entities.ClinicalFileEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ClinicalFileRepository extends JpaRepository<ClinicalFileEntity, Long> {
    List<ClinicalFileEntity> findByMedicalHistoryIdOrderByFileDateDescIdDesc(Long historyId);
}
