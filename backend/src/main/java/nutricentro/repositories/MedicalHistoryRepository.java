package nutricentro.repositories;

import nutricentro.entities.MedicalHistoryEntity;
import nutricentro.entities.ProfessionalEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface MedicalHistoryRepository extends JpaRepository<MedicalHistoryEntity, Long>, JpaSpecificationExecutor<ProfessionalEntity> {
}
