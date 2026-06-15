package nutricentro.entities;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import nutricentro.enums.GenderType;
import nutricentro.enums.PersonStatus;

import java.time.LocalDate;

@Entity
@Table(name = "patients")
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
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

    @OneToOne(mappedBy = "patientId", cascade = CascadeType.ALL, orphanRemoval = true)
    private MedicalHistoryEntity medicalHistory;
}
