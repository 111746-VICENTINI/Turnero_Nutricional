package nutricentro.dtos.anthropometry;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AntropometryRequestDTO {
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
    private Double arm;
    private Double bodyFatPercentage;
    private Double muscleMass;
    private Double muscleBoneIndex;
    private Double armMuscleArea;
    private Double thighMuscleArea;
    private Double calfMuscleArea;
    private Double zScore;
    private Double peakHeightVelocityAge;
    private String maturation;
    private Double bsa;
    private String softwareSource;
    private String externalReference;
    private Map<String, Double> rawMeasurements;
    private String observations;
}
