package nutricentro.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "medical_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class MedicalHistoryEntity extends BaseEntity{

    @Column(nullable = false)
    private Date consultationDate;
    private String consultationReason;
    private String anthropometry;
    private String mealPlan;
    private Double weight; //peso
    private Double height; //altura

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
