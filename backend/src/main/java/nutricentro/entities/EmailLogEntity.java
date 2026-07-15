package nutricentro.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import nutricentro.enums.EmailStatus;

import java.time.LocalDateTime;

@Entity
@Table(name = "email_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true, onlyExplicitlyIncluded = true)
public class EmailLogEntity extends BaseEntity {

    @Column(name = "requested_at", nullable = false)
    private LocalDateTime requestedAt;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "sender_user_id")
    private Long senderUserId;

    @Column(name = "sender_username")
    private String senderUsername;

    @Column(name = "patient_id")
    private Long patientId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String recipients;

    @Column(columnDefinition = "TEXT")
    private String cc;

    @Column(columnDefinition = "TEXT")
    private String bcc;

    @Column(nullable = false)
    private String subject;

    @Column(nullable = false)
    private String provider;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EmailStatus status;

    @Column(name = "message_id")
    private String messageId;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;
}
