package nutricentro.dtos.users;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UserRoleDTO {
    @JsonProperty("id")
    private Long id;

    @JsonProperty("description")
    private String description;
}

