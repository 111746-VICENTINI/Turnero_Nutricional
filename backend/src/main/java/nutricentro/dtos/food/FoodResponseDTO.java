package nutricentro.dtos.food;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class FoodResponseDTO {
    private Long id;
    private String externalId;
    private String name;
    private String brand;
    private Double calories;
    private Double protein;
    private Double carbohydrates;
    private Double fat;
    private Double healthyFat;
    private String imageUrl;
    private String source;
}
