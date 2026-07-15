package nutricentro.dtos.email;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailRequestDTO {
    @NotEmpty(message = "Debe indicar al menos un destinatario")
    @Builder.Default
    private List<@Email(message = "El email destinatario no es valido") String> to = new ArrayList<>();

    @Builder.Default
    private List<@Email(message = "El email en copia no es valido") String> cc = new ArrayList<>();

    @Builder.Default
    private List<@Email(message = "El email en copia oculta no es valido") String> bcc = new ArrayList<>();

    @NotBlank(message = "El asunto es obligatorio")
    private String subject;

    private String htmlMessage;

    private String textMessage;

    @Email(message = "El responder a no es valido")
    private String replyTo;

    private String fromName;

    private Long patientId;

    private Long historyId;

    private Boolean includeFoodPlan;

    private Boolean includeAnthropometry;

    private Boolean includeLaboratories;

    private Boolean includeClinicalFiles;

    @Valid
    @Builder.Default
    private List<AttachmentDTO> attachments = new ArrayList<>();
}
