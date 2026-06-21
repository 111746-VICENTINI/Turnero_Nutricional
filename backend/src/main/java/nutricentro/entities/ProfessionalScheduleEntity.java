package nutricentro.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
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
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class ProfessionalScheduleEntity extends BaseEntity {
    @Column(nullable = false)
    private LocalTime startTime;

    @Column(nullable = false)
    private LocalTime endTime;

    @Column(nullable = false)
    private Integer slotDurationMinutes;

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
