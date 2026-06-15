package nutricentro.repositories;

import nutricentro.entities.ProfessionalEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface ProfessionalRepository extends JpaRepository<ProfessionalEntity, Long>, JpaSpecificationExecutor<ProfessionalEntity> {
    boolean existsBySpecialties_Id(Long id);
}
