package nutricentro.repositories;

import nutricentro.entities.ConsultationEntity;
import nutricentro.enums.ConsultationStatus;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Repository
public interface ConsultationRepository extends JpaRepository<ConsultationEntity, Long> {
    List<ConsultationEntity> findByMedicalHistoryIdOrderByDateDesc(Long medicalHistoryId);
    Optional<ConsultationEntity> findByAppointmentId(Long appointmentId);
    boolean existsByAppointmentId(Long appointmentId);
    boolean existsByAppointmentIdAndIdNot(Long appointmentId, Long id);
    boolean existsByPatientIdAndProfessionalId(Long patientId, Long professionalId);
    long countByPatientIdAndProfessionalId(Long patientId, Long professionalId);

    // Busca consultas clinicas finalizadas para calcular seguimiento sin persistir datos derivados
    @Query("""
    select consultation
    from ConsultationEntity consultation
    join fetch consultation.patient patient
    left join fetch consultation.professional professional
    where consultation.status = :status
    and consultation.date <= :date
    and patient.status = nutricentro.enums.PersonStatus.ACTIVE
    and (:professionalId is null or professional.id = :professionalId)
    order by consultation.date desc
    """)
    List<ConsultationEntity> findFinalizedConsultationsForFollowUp(
            @Param("status") ConsultationStatus status,
            @Param("date") Date date,
            @Param("professionalId") Long professionalId
    );

    //Busca pacientes con al menos una consulta finalizada para aplicar fallback de agenda solo si corresponde
    @Query("""
    select distinct patient.id
    from ConsultationEntity consultation
    join consultation.patient patient
    left join consultation.professional professional
    where consultation.status = :status
    and consultation.date <= :date
    and patient.status = nutricentro.enums.PersonStatus.ACTIVE
    and (:professionalId is null or professional.id = :professionalId)
    """)
    List<Long> findPatientIdsWithFinalizedConsultations(
            @Param("status") ConsultationStatus status,
            @Param("date") Date date,
            @Param("professionalId") Long professionalId
    );
}
