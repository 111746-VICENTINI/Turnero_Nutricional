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
@Table(name = "antropometry")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true, onlyExplicitlyIncluded = true)
public class AntropometryEntity extends BaseEntity {
    private Date date;
    private String professionalName;
    private String source;
    private Double weight;
    private Double height;
    private Double sittingHeight;
    private Double anthropometricAge;
    private String anthropometricGoal;

    private Double headCircumference;
    private Double relaxedArmCircumference;
    private Double flexedArmCircumference;
    private Double forearmCircumference;
    private Double thoraxCircumference;
    private Double waist;
    private Double umbilicalWaist;
    private Double hips;
    private Double maxThighCircumference;
    private Double medialThighCircumference;
    private Double calfCircumference;

    private Double biacromialDiameter;
    private Double transverseThoraxDiameter;
    private Double anteroposteriorThoraxDiameter;
    private Double biiliocristalDiameter;
    private Double humeralDiameter;
    private Double femoralDiameter;

    private Double tricepsSkinfold;
    private Double subscapularSkinfold;
    private Double supraspinaleSkinfold;
    private Double abdominalSkinfold;
    private Double medialThighSkinfold;
    private Double calfSkinfold;
    private Double skinfoldSum;

    private Double adiposeMassPercentage;
    private Double adiposeMassKg;
    private Double muscleMassPercentage;
    private Double muscleMassKg;
    private Double boneMassPercentage;
    private Double boneMassKg;
    private Double residualMassPercentage;
    private Double residualMassKg;
    private Double skinMassPercentage;
    private Double skinMassKg;

    private Double waistHipRatio;
    private Double bmi;
    private Double bmr;
    private Double muscleBoneIndex;
    private Double armMuscleArea;
    private Double thighMuscleArea;
    private Double calfMuscleArea;
    private Double zScore;
    private Double peakHeightVelocityAge;
    private String maturation;
    private Double bsa;

    private Double arm;
    private Double bodyFatPercentage;
    private Double muscleMass;
    private String softwareSource;
    private String externalReference;
    @Column(columnDefinition = "TEXT")
    private String rawMeasurements;
    @Column(columnDefinition = "TEXT")
    private String observations;

    @ManyToOne
    @JoinColumn(name = "medical_history_id")
    private MedicalHistoryEntity medicalHistory;

    // Optional consultation context. Historical records can remain null.
    // Never infer this relation from dates or an active consultation.
    @ManyToOne
    @JoinColumn(name = "consultation_id")
    private ConsultationEntity consultation;
}
