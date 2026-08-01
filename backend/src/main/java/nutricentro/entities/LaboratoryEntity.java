package nutricentro.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.Date;

@Entity
@Table(name = "laboratory")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true, onlyExplicitlyIncluded = true)
public class LaboratoryEntity extends BaseEntity {
    private Date date;
    private Double glucose;
    private Double cholesterol;
    private Double hdl;
    private Double ldl;
    private Double triglycerides;
    private Double vitaminD;
    private Double vitaminB12;
    private Double iron;
    private Double ferritin;
    private Double insulin;
    private Double hba1c;
    private Double pcr;
    private Double ast;
    private Double alt;
    private Double tsgo;
    private Double tsgp;
    private Double sodium;
    private Double potassium;
    private Double calcium;
    private Double magnesium;
    private Double phosphorus;
    private Double proteins;
    private Double albumin;
    private Double cortisol;
    private Double testosterone;
    private Double estradiol;
    private Double fsh;
    private Double lh;
    private Double t3;
    private Double tsh;
    private Double t4;
    private Double hemoglobin;
    @Column(columnDefinition = "TEXT")
    private String customParameters;
    @Column(columnDefinition = "TEXT")
    private String observations;

    @ManyToOne
    private MedicalHistoryEntity medicalHistory;

    // Optional consultation context. Historical records can remain null.
    // Never infer this relation from dates or an active consultation.
    @ManyToOne
    @JoinColumn(name = "consultation_id")
    private ConsultationEntity consultation;
}
