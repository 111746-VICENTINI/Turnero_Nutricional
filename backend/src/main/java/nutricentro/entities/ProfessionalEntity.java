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

import java.time.LocalDate;

@Entity
@Table(name = "professionals")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProfessionalEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long professionalId;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    @Column(nullable = false)
    private LocalDate birthDate;

    @Column(nullable = false)
    private Integer document;

    @Column(nullable = false)
    private String specialty;

    @Column(nullable = false)
    private String tuition;

    private String mobile;
    private String registration;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private GenderType gender;

    private String email;

    @Enumerated(EnumType.STRING)
    private PersonStatus status;

    @OneToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private UserEntity user;
}
