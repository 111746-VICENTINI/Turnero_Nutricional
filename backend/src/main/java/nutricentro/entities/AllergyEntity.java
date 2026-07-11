package nutricentro.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "allergy")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true, onlyExplicitlyIncluded = true)
public class AllergyEntity extends BaseEntity {
    private String type;
    private String name;
    private String severity;

    @Column(columnDefinition = "TEXT")
    private String observations;

    @ManyToOne
    @JoinColumn(name = "clinical_data_id")
    private ClinicalDataEntity clinicalData;
}
