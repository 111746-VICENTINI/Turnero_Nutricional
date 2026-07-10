package nutricentro.dtos.laboratory;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class LaboratoryRequestDTO {
    private Date date;
    private Double glucose;
    private Double cholesterol;
    private Double hdl;
    private Double ldl;
    private Double triglycerides;
    private Double vitaminD;
    private Double vitaminB12;
    private Double iron;
    private Double ferritin;
    private Double insulin;
    private Double hba1c;
    private Double pcr;
    private Double ast;
    private Double alt;
    private Double tsgo;
    private Double tsgp;
    private Double sodium;
    private Double potassium;
    private Double calcium;
    private Double magnesium;
    private Double phosphorus;
    private Double proteins;
    private Double albumin;
    private Double cortisol;
    private Double testosterone;
    private Double estradiol;
    private Double fsh;
    private Double lh;
    private Double t3;
    private Double tsh;
    private Double t4;
    private Double hemoglobin;
    private String customParameters;
    private String observations;
}
