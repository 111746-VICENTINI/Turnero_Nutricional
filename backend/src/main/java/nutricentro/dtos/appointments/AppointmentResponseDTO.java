package nutricentro.dtos.appointments;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import nutricentro.enums.AppointmentStatus;

import java.time.LocalDate;
import java.time.LocalTime;
import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AppointmentResponseDTO {
    private Long id;
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate date;
    private LocalTime time;
    private AppointmentStatus status;
    private String reason;
    private Long patientId;
    private String patientFullName;
    private Long professionalId;
    private String professionalFullName;
    private Long secretaryId;
    private String secretaryFullName;
    private BigDecimal appliedFee;
    private String feeType;
    private String feeCurrency;
    private Boolean feeEditable;
}
