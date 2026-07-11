package nutricentro.dtos.historyClinical;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class FoodPlanItemDTO {
    private Long foodId;
    private String externalId;
    private String name;
    private Double grams;
    private Double calories;
    private Double protein;
    private Double carbohydrates;
    private Double fat;
}
