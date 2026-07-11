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
import java.math.BigDecimal;
import java.util.List;

@Entity
@Table(name = "professionals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true, onlyExplicitlyIncluded = true)
public class ProfessionalEntity extends BaseEntity {

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    @Column(nullable = false)
    private LocalDate birthDate;

    @Column(nullable = false)
    private Integer document;

    @Column(nullable = false)
    private String tuition;

    private String mobile;
    private String registration;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private GenderType gender;

    private String email;

    private BigDecimal firstConsultationFee;
    private BigDecimal followUpConsultationFee;
    private BigDecimal onlineConsultationFee;
    private String feeCurrency;
    private Boolean allowAppointmentFeeOverride = true;

    @Enumerated(EnumType.STRING)
    private PersonStatus status;

    @OneToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private UserEntity user;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "professional_specialties",
            joinColumns = @JoinColumn(name = "professional_id"),
            inverseJoinColumns = @JoinColumn(name = "specialty_id")
    )
    private List<SpecialtyEntity> specialties;
}
