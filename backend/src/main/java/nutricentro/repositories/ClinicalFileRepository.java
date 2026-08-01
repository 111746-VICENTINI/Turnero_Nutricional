package nutricentro.repositories;

import nutricentro.entities.ClinicalFileEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ClinicalFileRepository extends JpaRepository<ClinicalFileEntity, Long> {
    @Query("""
    select clinicalFile
    from ClinicalFileEntity clinicalFile
    left join fetch clinicalFile.consultation consultation
    left join fetch consultation.professional
    where clinicalFile.medicalHistory.id = :historyId
    order by clinicalFile.fileDate desc, clinicalFile.id desc
    """)
    List<ClinicalFileEntity> findByMedicalHistoryIdOrderByFileDateDescIdDesc(@Param("historyId") Long historyId);

    @Modifying
    @Query("""
    update ClinicalFileEntity clinicalFile
    set clinicalFile.consultation = null
    where clinicalFile.consultation.id = :consultationId
    """)
    int clearConsultationReference(@Param("consultationId") Long consultationId);
}
