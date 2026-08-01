package nutricentro.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.hibernate.envers.NotAudited;

import java.time.LocalDate;

@Entity
@Table(name = "clinical_files")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true, onlyExplicitlyIncluded = true)
public class ClinicalFileEntity extends BaseEntity {
    @Column(nullable = false)
    private String originalName;

    @Column(nullable = false)
    private String contentType;

    @Column(nullable = false)
    private Long size;

    @Column(nullable = false)
    private String type;

    @Column(columnDefinition = "TEXT")
    private String comment;

    private LocalDate fileDate;
    private String professional;

    @Lob
    @NotAudited
    @Column(nullable = false, columnDefinition = "LONGBLOB")
    private byte[] content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medical_history_id", nullable = false)
    private MedicalHistoryEntity medicalHistory;

    // Optional consultation context. Historical records can remain null.
    // Never infer this relation from dates or an active consultation.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "consultation_id")
    private ConsultationEntity consultation;
}
