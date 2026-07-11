package nutricentro.dtos.historyClinical;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class FoodPlanRequestDTO {
    private String title;
    private String description;
    private Date startDate;
    private Date endDate;
    private Boolean active;
    private String pdfUrl;
    private Boolean planDelivered;
    private Date planDeliveredDate;
    private String planDeliveryMedium;
    private Boolean menuDelivered;
    private Date menuDeliveredDate;
    private String menuMaterialName;
    private String menuMaterialUrl;
    private String menu;
    private String notes;
    private String observations;
    private List<FoodPlanItemDTO> items;
}
