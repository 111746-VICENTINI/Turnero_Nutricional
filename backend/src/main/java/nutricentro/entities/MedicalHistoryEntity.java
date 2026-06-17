package nutricentro.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.Date;

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
}
