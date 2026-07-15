package nutricentro.dtos.email;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import nutricentro.enums.EmailStatus;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailResponseDTO {
    private Long auditId;
    private EmailStatus status;
    private String provider;
    private String messageId;
    private String errorMessage;
    private LocalDateTime sentAt;
}
