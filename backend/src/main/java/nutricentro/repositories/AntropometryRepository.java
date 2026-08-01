package nutricentro.repositories;

import nutricentro.entities.AntropometryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AntropometryRepository extends JpaRepository<AntropometryEntity, Long> {
    @Query("""
    select antropometry
    from AntropometryEntity antropometry
    left join fetch antropometry.consultation consultation
    left join fetch consultation.professional
    where antropometry.medicalHistory.id = :medicalHistoryId
    order by antropometry.date desc
    """)
    List<AntropometryEntity> findByMedicalHistoryIdOrderByDateDesc(@Param("medicalHistoryId") Long medicalHistoryId);

    @Modifying
    @Query("""
    update AntropometryEntity antropometry
    set antropometry.consultation = null
    where antropometry.consultation.id = :consultationId
    """)
    int clearConsultationReference(@Param("consultationId") Long consultationId);
}
