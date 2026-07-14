package nutricentro.dtos.historyClinical;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class MenuMaterialDTO {
    private Boolean delivered;
    private Date deliveredDate;
    private String materialName;
    private String materialUrl;
}
