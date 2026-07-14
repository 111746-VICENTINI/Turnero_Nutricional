package nutricentro.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import nutricentro.enums.ConsultationStatus;

import java.time.LocalTime;
import java.util.Date;

@Entity
@Table(name = "consultation")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true, onlyExplicitlyIncluded = true)
/** Momento clínico realizado durante la atención del paciente. */

public class ConsultationEntity extends BaseEntity {
    private Date date;
    private LocalTime startTime;
    private LocalTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ConsultationStatus status = ConsultationStatus.BORRADOR;

    private String reason;
    private String diagnosis;
    private String treatment;
    private String goal;
    private String evolution;
    private String observations;
    private String indications;
    private String nextConsultation;

    @ManyToOne
    @JoinColumn(name = "patient_id")
    private PatientEntity patient;

    @ManyToOne
    @JoinColumn(name = "medical_history_id")
    private MedicalHistoryEntity medicalHistory;

    @ManyToOne
    @JoinColumn(name = "professional_id")
    private ProfessionalEntity professional;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id", unique = true)
    private AppointmentEntity appointment;
}
