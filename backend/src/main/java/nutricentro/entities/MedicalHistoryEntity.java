package nutricentro.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Entity
@Table(name = "medical_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MedicalHistoryEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "La fecha es obligatoria")
    @NotBlank(message = "La fecha es obligatoria")
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
    private PatientEntity patientId;

    @ManyToOne
    @JoinColumn(name = "professional_id")
    private ProfessionalEntity professionalId;
}
