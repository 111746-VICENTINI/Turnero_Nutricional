package nutricentro.repositories;

import nutricentro.entities.PatientEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PatientRepository extends JpaRepository<PatientEntity, Long> {
    boolean existsByDocument(Integer dni);
    boolean existsByEmail(String email);
}
