package nutricentro.dtos.historyClinical;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ClinicalDataDTO {
    private Long id;
    private String employmentSituation;
    private String occupation;
    private String company;
    private String workingHours;
    private String workShift;
    private Boolean sedentaryWork;
    private Boolean activeWork;
    private Boolean nightWork;
    private String livingSituation;
    private Integer householdPeopleCount;
    private String responsibleForFood;
    private String cooksAtHome;
    private String buysFood;
    private String organizesMeals;
    private Boolean eatsOutsideHome;
    private Boolean pregnancies;
    private Integer pregnancyCount;
    private Boolean lactation;
    private Boolean menopause;
    private String menstrualCycle;
    private String contraceptiveMethod;
    private Boolean smoker;
    private String dailyCigarettes;
    private String smokingStartDate;
    private Boolean alcohol;
    private String alcoholFrequency;
    private String alcoholicBeverageType;
    private Boolean caffeine;
    private Boolean mate;
    private Boolean energyDrinks;
    private Boolean recreationalDrugs;
    private Boolean supplements;
    private String supplementationDetails;
    private Double sleepHoursPerNight;
    private String sleepQuality;
    private Boolean wakesUpAtNight;
    private Boolean snores;
    private Boolean diagnosedApnea;
    private String stressLevel;
    private Boolean anxiety;
    private Boolean depression;
    private Boolean emotionalEating;
    private Boolean bingeEating;
    private Boolean snacking;
    private Boolean nightHunger;
    private Boolean heartburn;
    private Boolean reflux;
    private Boolean constipation;
    private Boolean diarrhea;
    private Boolean abdominalDistension;
    private Boolean irritableBowel;
    private Boolean abdominalPain;
    private List<String> pathologies;
    private String diseases;
    private String allergies;
    private String medications;
    private List<MedicationDTO> medicationRecords;
    private List<AllergyDTO> allergyRecords;
    private String familyHistory;
    private String surgeries;
    private String observations;
}
