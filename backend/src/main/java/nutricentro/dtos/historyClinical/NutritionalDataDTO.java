package nutricentro.dtos.historyClinical;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class NutritionalDataDTO {
    private Long id;
    private String dietType;
    private String preferences;
    private String breakfast;
    private String midMorningSnack;
    private String lunch;
    private String snack;
    private String midAfternoonSnack;
    private String dinner;
    private String favoriteFoods;
    private String dislikedFoods;
    private String prohibitedFoods;
    private String restrictions;
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
    private String observations;
}
