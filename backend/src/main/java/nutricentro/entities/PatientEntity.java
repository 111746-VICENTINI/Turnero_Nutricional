package nutricentro.entities;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import nutricentro.enums.GenderType;
import nutricentro.enums.PersonStatus;

@Entity
@Table(name = "patients")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PatientEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long patientId;

    @NotBlank(message = "El nombre es obligatorio")
    @NotNull(message = "El nombre es obligatorio")
    @Column(nullable = false)
    private String firstName;

    @NotBlank(message = "El apellido es obligatorio")
    @NotNull(message = "El apellido es obligatorio")
    @Column(nullable = false)
    private String lastName;

    @NotNull(message = "La edad es obligatoria")
    @Column(nullable = false)
    private Integer age;

    //fecha de cumpleaños?

    @NotNull(message = "El dni es obligatorio")
    @Column(nullable = false)
    private Integer document;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private GenderType gender;

    @Email(message = "El formato email no es válido")
    private String email;

    private String mobile;

    private String address;

    private String observations;

    @Enumerated(EnumType.STRING)
    private PersonStatus status;

    @OneToOne(mappedBy = "patientId", cascade = CascadeType.ALL, orphanRemoval = true)
    private MedicalHistoryEntity medicalHistory;
}
