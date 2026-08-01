package nutricentro.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "medical_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true, onlyExplicitlyIncluded = true)
public class MedicalHistoryEntity extends BaseEntity{

    @Column(nullable = false)
    private Date consultationDate;
    private String consultationReason;
    private String anthropometry;
    private String mealPlan;

    // Derived cache: last known non-null weight from anthropometries.
    private Double weight;

    // Derived cache: last known non-null height from anthropometries.
    private Double height;

    @Column(columnDefinition = "TEXT")
    private String observations;

    @OneToOne
    @JoinColumn(name = "patient_id")
    private PatientEntity patient;

    @ManyToOne
    @JoinColumn(name = "professional_id")
    private ProfessionalEntity professional;

    @OneToOne(mappedBy = "medicalHistory", cascade = CascadeType.ALL, orphanRemoval = true)
    private ClinicalDataEntity clinicalData;

    @OneToOne(mappedBy = "medicalHistory", cascade = CascadeType.ALL, orphanRemoval = true)
    private NutritionalDataEntity nutritionalData;

    @OneToMany(mappedBy = "medicalHistory", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<LaboratoryEntity> laboratories = new ArrayList<>();

    @OneToMany(mappedBy = "medicalHistory", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AntropometryEntity> anthropometries = new ArrayList<>();

    @OneToMany(mappedBy = "medicalHistory", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ConsultationEntity> consultations = new ArrayList<>();

    @OneToMany(mappedBy = "medicalHistory", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<FoodPlanEntity> foodPlans = new ArrayList<>();

    @OneToMany(mappedBy = "medicalHistory", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ClinicalFileEntity> files = new ArrayList<>();
}
