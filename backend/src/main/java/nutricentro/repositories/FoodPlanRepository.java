package nutricentro.repositories;

import nutricentro.entities.FoodPlanEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FoodPlanRepository extends JpaRepository<FoodPlanEntity, Long> {
    List<FoodPlanEntity> findByMedicalHistoryIdOrderByStartDateDesc(Long medicalHistoryId);
}
