package nutricentro.repositories;

import nutricentro.entities.AntropometryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AntropometryRepository extends JpaRepository<AntropometryEntity, Long> {
    List<AntropometryEntity> findByMedicalHistoryIdOrderByDateDesc(Long medicalHistoryId);
}
