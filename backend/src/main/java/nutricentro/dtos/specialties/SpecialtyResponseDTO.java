package nutricentro.dtos.specialties;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import nutricentro.entities.SpecialtyEntity;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class SpecialtyResponseDTO {

    private Long id;
    private String name;
    private String description;
    private Boolean isActive;

}
