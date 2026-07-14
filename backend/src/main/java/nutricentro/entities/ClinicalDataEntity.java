package nutricentro.entities;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "clinical_data")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true, onlyExplicitlyIncluded = true)
public class ClinicalDataEntity extends BaseEntity {
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

    private String diseases; //enfermedades
    private String allergies;
    private String medications;
    private String familyHistory;
    private String surgeries; //cirugias
    @Column(columnDefinition = "TEXT")
    private String pathologies;
    @Column(columnDefinition = "TEXT")
    private String observations;

    @OneToMany(mappedBy = "clinicalData", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<MedicationEntity> medicationRecords = new ArrayList<>();

    @OneToMany(mappedBy = "clinicalData", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AllergyEntity> allergyRecords = new ArrayList<>();

    @OneToOne
    @JoinColumn(name = "medical_history_id")
    private MedicalHistoryEntity medicalHistory;
}
