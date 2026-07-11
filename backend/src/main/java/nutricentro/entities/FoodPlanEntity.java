package nutricentro.entities;

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
@Table(name = "foods_plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true, onlyExplicitlyIncluded = true)
public class FoodPlanEntity extends BaseEntity {
    private String title;
    private String description;
    private Date startDate;
    private Date endDate;
    private Boolean active;
    private String pdfUrl;
    private Boolean planDelivered;
    private Date planDeliveredDate;
    private String planDeliveryMedium;
    private Boolean menuDelivered;
    private Date menuDeliveredDate;
    private String menuMaterialName;
    private String menuMaterialUrl;
    private String menu;
    private String notes;
    private String observations;
    private Double totalCalories;
    private Double totalProtein;
    private Double totalCarbohydrates;
    private Double totalFat;

    @ManyToOne
    @JoinColumn(name = "medical_history_id")
    private MedicalHistoryEntity medicalHistory;

    @ManyToOne
    @JoinColumn(name = "patient_id")
    private PatientEntity patient;
}
