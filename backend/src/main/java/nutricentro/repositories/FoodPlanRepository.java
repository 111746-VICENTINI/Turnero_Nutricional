package nutricentro.repositories;

import nutricentro.entities.FoodPlanEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FoodPlanRepository extends JpaRepository<FoodPlanEntity, Long> {
    @Query("""
    select foodPlan
    from FoodPlanEntity foodPlan
    left join fetch foodPlan.consultation consultation
    left join fetch consultation.professional
    where foodPlan.medicalHistory.id = :medicalHistoryId
    order by foodPlan.startDate desc
    """)
    List<FoodPlanEntity> findByMedicalHistoryIdOrderByStartDateDesc(@Param("medicalHistoryId") Long medicalHistoryId);

    @Modifying
    @Query("""
    update FoodPlanEntity foodPlan
    set foodPlan.consultation = null
    where foodPlan.consultation.id = :consultationId
    """)
    int clearConsultationReference(@Param("consultationId") Long consultationId);
}
