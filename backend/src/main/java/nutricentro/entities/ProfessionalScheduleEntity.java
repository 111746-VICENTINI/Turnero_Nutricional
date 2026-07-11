package nutricentro.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import nutricentro.enums.AppointmentModality;
import nutricentro.enums.PersonStatus;

import java.time.DayOfWeek;
import java.time.LocalTime;

@Entity
@Table(name = "professional_schedules",
        uniqueConstraints = {
                @UniqueConstraint(
                        columnNames = {"professional_id", "day_of_week", "start_time"}
                )
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true, onlyExplicitlyIncluded = true)
public class ProfessionalScheduleEntity extends BaseEntity {
    @Column(nullable = false)
    private LocalTime startTime;

    @Column(nullable = false)
    private LocalTime endTime;

    @Column(nullable = false)
    private Integer slotDurationMinutes;

    private Integer bufferMinutes = 0;

    private Integer maxDailyAppointments;

    @Enumerated(EnumType.STRING)
    private AppointmentModality modality = AppointmentModality.HYBRID;

    private String locationKey;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PersonStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DayOfWeek dayOfWeek;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "professional_id", nullable = false)
    private ProfessionalEntity professional;
}
