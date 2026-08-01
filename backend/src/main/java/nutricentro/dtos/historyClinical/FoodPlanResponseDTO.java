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
public class FoodPlanResponseDTO {
    private Long id;
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
    private Double totalCalories;
    private Double totalProtein;
    private Double totalCarbohydrates;
    private Double totalFat;
    private Long consultationId;
    private Date consultationDate;
    private String consultationStatus;
    private String consultationReason;
    private String consultationProfessionalName;
    private String consultationObservations;
}
