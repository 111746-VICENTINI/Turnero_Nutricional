package nutricentro.dtos.email;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttachmentDTO {
    @NotBlank(message = "El nombre del adjunto es obligatorio")
    private String filename;

    private String contentType;
    private String contentBase64;
    private Long sizeBytes;
}