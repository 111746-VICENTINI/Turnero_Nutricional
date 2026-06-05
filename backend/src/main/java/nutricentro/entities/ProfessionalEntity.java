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
@Table(name = "professionals")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProfessionalEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long professionalId;

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

    @NotNull(message = "El dni es obligatorio")
    @Column(nullable = false)
    private Integer document;

    @NotBlank(message = "La especialidad es obligatoria")
    @NotNull(message = "La especialidad es obligatoria")
    @Column(nullable = false)
    private String specialty;

    @NotBlank(message = "La matricula es obligatoria")
    @NotNull(message = "La matricula es obligatoria")
    @Column(nullable = false)
    private String tuition;

    private String mobile;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private GenderType gender;

    @Email(message = "El formato email no es válido")
    private String email;

    private String registration;

    private String state;

    @Enumerated(EnumType.STRING)
    private PersonStatus status;

    @OneToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private UserEntity user;
}
