package nutricentro.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import nutricentro.enums.GenderType;
import nutricentro.enums.PersonStatus;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "patients")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true, onlyExplicitlyIncluded = true)
public class PatientEntity extends BaseEntity {

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    @Column(nullable = false)
    private LocalDate birthDate;

    @Column(nullable = false)
    private Integer document;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private GenderType gender;

    private String email;
    private String mobile;
    private String address;
    private String observations;

    @Enumerated(EnumType.STRING)
    private PersonStatus status;

    @OneToOne(mappedBy = "patient", cascade = CascadeType.ALL, orphanRemoval = true)
    private MedicalHistoryEntity medicalHistory;

    @OneToMany(mappedBy = "patient")
    private List<ConsultationEntity> consultations = new ArrayList<>();
}
