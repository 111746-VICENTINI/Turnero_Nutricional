package nutricentro.repositories;

import nutricentro.entities.PatientEntity;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PatientRepository extends JpaRepository<PatientEntity, Long>, JpaSpecificationExecutor<PatientEntity> {
    boolean existsByDocument(Integer dni);
    boolean existsByDocumentAndIdNot(Integer dni, Long id);
    boolean existsByEmail(String email);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select patient from PatientEntity patient where patient.id = :id")
    java.util.Optional<PatientEntity> findByIdForUpdate(@Param("id") Long id);
}
