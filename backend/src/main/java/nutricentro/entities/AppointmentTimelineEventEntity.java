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
import nutricentro.enums.AppointmentEventType;
import nutricentro.enums.AppointmentStatus;

import java.time.LocalDateTime;

@Entity
@Table( name = "appointment_timeline_events",
        indexes = @Index(
                name = "idx_appointment_timeline_appointment_occurred",
                columnList = "appointment_id, occurred_at"
        ))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true, onlyExplicitlyIncluded = true)

/** Representa un evento funcional dentro del timeline de un turno. */
public class AppointmentTimelineEventEntity extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id", nullable = false)
    private AppointmentEntity appointment;

    @Column(name = "occurred_at", nullable = false)
    private LocalDateTime occurredAt;

    @Column(name = "responsible_user_id")
    private Long responsibleUserId;

    @Column(name = "responsible_username")
    private String responsibleUsername;

    @Column(name = "responsible_role")
    private String responsibleRole;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false)
    private AppointmentEventType eventType;

    @Enumerated(EnumType.STRING)
    @Column(name = "previous_status")
    private AppointmentStatus previousStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "new_status")
    private AppointmentStatus newStatus;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(columnDefinition = "TEXT")
    private String observations;

    @Column(name = "notification_requested")
    private Boolean notificationRequested = false;

    @Column(name = "notification_requested_at")
    private LocalDateTime notificationRequestedAt;
}