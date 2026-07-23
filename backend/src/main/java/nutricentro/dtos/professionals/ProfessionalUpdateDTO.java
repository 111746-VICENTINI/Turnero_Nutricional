package nutricentro.dtos.professionals;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Email;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import nutricentro.enums.GenderType;
import nutricentro.enums.PersonStatus;

import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ProfessionalUpdateDTO {
    private String firstName;
    private String lastName;

    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate birthDate;

    private Integer document;
    private List<Long> specialtyIds;
    private Long userId;
    private String tuition;

    @Email(message = "El formato email no es válido")
    private String email;

    private String mobile;
    private GenderType gender;
    private String registration;
    private PersonStatus status;
    private BigDecimal firstConsultationFee;
    private BigDecimal followUpConsultationFee;
    private BigDecimal onlineConsultationFee;
    private String feeCurrency;
    private Boolean allowAppointmentFeeOverride;
}
