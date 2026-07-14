package nutricentro.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "nutritional_data")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true, onlyExplicitlyIncluded = true)
public class NutritionalDataEntity extends BaseEntity {
    private String dietType;
    private String breakfast;
    private String midMorningSnack;
    private String lunch;
    private String snack;
    private String midAfternoonSnack;
    private String dinner;
    private String favoriteFoods;
    private String dislikedFoods;
    private String waterIntake;
    private Double waterLitersPerDay;
    private Boolean drinksWater;
    private Boolean drinksSoda;
    private String breakfastTime;
    private String lunchTime;
    private String snackTime;
    private String dinnerTime;
    private Integer snackCount;
    private String physicalActivity;
    private String sport;
    private String sportGoal;
    private Boolean competition;
    private Boolean recreational;
    private Boolean professionalSport;
    private String position;
    private String category;
    private String coach;
    private Integer trainingSessionsPerWeek;
    private String activityFrequency;
    private String activityIntensity;
    private String activityDuration;
    private String trainingPlace;
    private Boolean strengthTraining;
    private Boolean cardioTraining;
    private Boolean mobilityTraining;
    private String otherTraining;
    @Column(columnDefinition = "TEXT")
    private String preferences;
    @Column(columnDefinition = "TEXT")
    private String prohibitedFoods;
    @Column(columnDefinition = "TEXT")
    private String restrictions;
    @Column(columnDefinition = "TEXT")
    private String observations;

    @OneToOne
    @JoinColumn(name = "medical_history_id")
    private MedicalHistoryEntity medicalHistory;
}
