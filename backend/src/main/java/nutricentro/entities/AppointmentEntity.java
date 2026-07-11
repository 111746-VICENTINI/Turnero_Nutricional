package nutricentro.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import nutricentro.enums.AppointmentStatus;

import java.time.LocalDate;
import java.time.LocalTime;
import java.math.BigDecimal;

@Entity
@Table(name = "appointments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true, onlyExplicitlyIncluded = true)
public class AppointmentEntity extends BaseEntity{

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private LocalTime time;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private AppointmentStatus status;

    private String reason; //motivo
    private BigDecimal appliedFee;
    private String feeType;
    private String feeCurrency;
    private Boolean feeEditable;

    @ManyToOne
    @JoinColumn(name = "patient_id", nullable = false)
    private PatientEntity patient;

    @ManyToOne
    @JoinColumn(name = "professional_id", nullable = false)
    private ProfessionalEntity professional;

    @ManyToOne
    @JoinColumn(name = "secretary_id")
    private SecretaryEntity secretary;

    @OneToOne(mappedBy = "appointment", fetch = FetchType.LAZY)
    private ConsultationEntity consultation;
}
