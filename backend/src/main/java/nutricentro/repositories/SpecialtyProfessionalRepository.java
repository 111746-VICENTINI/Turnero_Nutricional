package nutricentro.repositories;

import nutricentro.entities.SpecialtyEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SpecialtyProfessionalRepository extends JpaRepository<SpecialtyEntity, Long> {
}
