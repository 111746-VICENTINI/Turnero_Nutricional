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
@Table(name = "secretaries")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SecretaryEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "El nombre es obligatorio")
    @Column(nullable = false)
    private String firstName;

    @NotBlank(message = "El apellido es obligatorio")
    @Column(nullable = false)
    private String lastName;

    @NotNull(message = "El DNI es obligatorio")
    @Column(nullable = false, unique = true)
    private Integer dni;

    @NotNull(message = "La edad es obligatoria")
    @Column(nullable = false)
    private Integer age;

    @NotNull(message = "El dni es obligatorio")
    @Column(nullable = false)
    private Integer document;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private GenderType gender;

    @Email
    private String email;

    private String mobile;

    @Enumerated(EnumType.STRING)
    private PersonStatus status;

    @OneToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private UserEntity user;
}
