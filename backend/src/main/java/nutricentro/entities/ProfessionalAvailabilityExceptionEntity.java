package nutricentro.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import nutricentro.enums.AppointmentModality;
import nutricentro.enums.AvailabilityExceptionType;
import nutricentro.enums.PersonStatus;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(
        name = "professional_availability_exceptions",
        indexes = {
                @Index(name = "idx_availability_exception_professional_date", columnList = "professional_id,date"),
                @Index(name = "idx_availability_exception_date_type", columnList = "date,type")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true, onlyExplicitlyIncluded = true)
public class ProfessionalAvailabilityExceptionEntity extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "professional_id")
    private ProfessionalEntity professional;

    @Column(nullable = false)
    private LocalDate date;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AvailabilityExceptionType type;

    @Enumerated(EnumType.STRING)
    private AppointmentModality modality;

    @Column(nullable = false)
    private Boolean appliesToAllProfessionals = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PersonStatus status;

    private Integer slotDurationMinutes;
    private Integer bufferMinutes;
    private Integer maxDailyAppointments;
    private LocalTime startTime;
    private LocalTime endTime;
    private String reason;
    private String locationKey;
}
