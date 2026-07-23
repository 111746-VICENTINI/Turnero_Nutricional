package nutricentro.services.implementation;

import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import lombok.RequiredArgsConstructor;
import nutricentro.dtos.professionals.ProfessionalRequestDTO;
import nutricentro.dtos.professionals.ProfessionalResponseDTO;
import nutricentro.dtos.professionals.ProfessionalUpdateDTO;
import nutricentro.dtos.specialties.SpecialtyOnlyNameDTO;
import nutricentro.dtos.users.UserResponseDTO;
import nutricentro.entities.ProfessionalEntity;
import nutricentro.entities.RoleEntity;
import nutricentro.entities.SpecialtyEntity;
import nutricentro.entities.UserEntity;
import nutricentro.enums.GenderType;
import nutricentro.enums.PersonStatus;
import nutricentro.exception.ApiException;
import nutricentro.repositories.ProfessionalRepository;
import nutricentro.repositories.SpecialtyRepository;
import nutricentro.repositories.UserRepository;
import nutricentro.services.CurrentProfessionalProvider;
import nutricentro.services.ProfessionalService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Period;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProfessionalServiceImpl implements ProfessionalService {
    private final ProfessionalRepository professionalRepository;
    private final SpecialtyRepository specialtyRepository;
    private final UserRepository userRepository;
    private final CurrentProfessionalProvider currentProfessionalProvider;

    @Override
    public ProfessionalResponseDTO createProfessional(ProfessionalRequestDTO professional) {
        List<Long> specialtyIds = professional.getSpecialtyIds() != null ? professional.getSpecialtyIds() : List.of();
        List<SpecialtyEntity> specialties = specialtyRepository.findAllById(specialtyIds);

        if (specialties.size() != specialtyIds.size()) {
            throw new EntityNotFoundException("Una o más especialidades no existen");
        }

        ProfessionalEntity professionalEntity = new ProfessionalEntity();
        professionalEntity.setFirstName(resolveRequiredText(professional.getFirstName(), professionalEntity.getFirstName(), "El nombre es obligatorio"));
        professionalEntity.setLastName(resolveRequiredText(professional.getLastName(), professionalEntity.getLastName(), "El apellido es obligatorio"));
        professionalEntity.setBirthDate(professional.getBirthDate());
        professionalEntity.setDocument(professional.getDocument());
        professionalEntity.setUser(resolveProfessionalUser(professional.getUserId(), null));
        professionalEntity.setSpecialties(specialties);
        professionalEntity.setTuition(professional.getTuition());
        professionalEntity.setMobile(professional.getMobile());
        professionalEntity.setGender(professional.getGender());
        professionalEntity.setEmail(professional.getEmail());
        professionalEntity.setRegistration(professional.getRegistration());
        applyFees(professionalEntity,
                professional.getFirstConsultationFee(),
                professional.getFollowUpConsultationFee(),
                professional.getOnlineConsultationFee(),
                professional.getFeeCurrency(),
                professional.getAllowAppointmentFeeOverride());
        professionalEntity.setStatus(PersonStatus.ACTIVE);
        ProfessionalEntity saved = professionalRepository.save(professionalEntity);
        return toResponse(saved);
    }

    @Override
    public List<ProfessionalResponseDTO> getAllProfessionals() {
        Long currentProfessionalId = scopedProfessionalId();
        if (currentProfessionalId != null) {
            return professionalRepository.findById(currentProfessionalId)
                    .stream()
                    .map(this::toResponse)
                    .toList();
        }
        return professionalRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public ProfessionalResponseDTO getProfessionalById(Long id) {
        ProfessionalEntity professionalEntity = professionalRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Profesional no encontrado"));
        validateProfessionalScope(professionalEntity.getId());
        return toResponse(professionalEntity);
    }

    @Override
    public void delete(Long id) {
        ProfessionalEntity professionalEntity = professionalRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Profesional no encontrado"));
        validateProfessionalScope(professionalEntity.getId());
        professionalEntity.setStatus(PersonStatus.INACTIVE);
        professionalRepository.save(professionalEntity);
    }

    @Override
    @Transactional
    public ProfessionalResponseDTO update(Long id, ProfessionalUpdateDTO professional) {
        ProfessionalEntity professionalEntity = professionalRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Profesional no encontrado"));
        validateProfessionalScope(professionalEntity.getId());

        List<SpecialtyEntity> specialties = resolveSpecialtiesForUpdate(professionalEntity, professional.getSpecialtyIds());
        if (scopedProfessionalId() != null) {
            professionalEntity.setSpecialties(specialties);
            applyFeeUpdates(professionalEntity,
                    professional.getFirstConsultationFee(),
                    professional.getFollowUpConsultationFee(),
                    professional.getOnlineConsultationFee(),
                    professional.getFeeCurrency(),
                    professional.getAllowAppointmentFeeOverride());
            return toResponse(professionalRepository.save(professionalEntity));
        }

        professionalEntity.setFirstName(resolveRequiredText(professional.getFirstName(), professionalEntity.getFirstName(), "El nombre es obligatorio"));
        professionalEntity.setLastName(resolveRequiredText(professional.getLastName(), professionalEntity.getLastName(), "El apellido es obligatorio"));
        if (professional.getMobile() != null) {
            professionalEntity.setMobile(professional.getMobile());
        }
        if (professional.getGender() != null) {
            professionalEntity.setGender(professional.getGender());
        }
        if (professional.getEmail() != null) {
            professionalEntity.setEmail(professional.getEmail());
        }
        if (professional.getStatus() != null) {
            professionalEntity.setStatus(professional.getStatus());
        }
        if (professional.getBirthDate() != null) {
            professionalEntity.setBirthDate(professional.getBirthDate());
        }
        if (professional.getDocument() != null) {
            professionalEntity.setDocument(professional.getDocument());
        }
        if (professional.getUserId() != null) {
            professionalEntity.setUser(resolveProfessionalUser(professional.getUserId(), professionalEntity.getId()));
        }
        professionalEntity.setSpecialties(specialties);
        professionalEntity.setTuition(resolveRequiredText(professional.getTuition(), professionalEntity.getTuition(), "La matricula es obligatoria"));
        if (professional.getRegistration() != null) {
            professionalEntity.setRegistration(professional.getRegistration());
        }
        applyFeeUpdates(professionalEntity,
                professional.getFirstConsultationFee(),
                professional.getFollowUpConsultationFee(),
                professional.getOnlineConsultationFee(),
                professional.getFeeCurrency(),
                professional.getAllowAppointmentFeeOverride());
        ProfessionalEntity saved = professionalRepository.save(professionalEntity);
        return toResponse(saved);
    }

    @Override
    public Page<ProfessionalResponseDTO> searchProfessionals(String search, GenderType gender, PersonStatus status, Long specialtyId, Pageable pageable) {
        Long currentProfessionalId = scopedProfessionalId();
        Specification<ProfessionalEntity> spec = Specification.allOf(
                byId(currentProfessionalId),
                bySearch(search),
                byGender(gender),
                byStatus(status),
                bySpecialty(specialtyId)
        );

        return professionalRepository.findAll(spec, pageable).map(this::toResponse);
    }

    @Override
    public List<UserResponseDTO> getAvailableProfessionalUsers(Long professionalId) {
        List<UserEntity> users = professionalId == null
                ? userRepository.findActiveUnlinkedProfessionalUsers()
                : userRepository.findActiveAvailableProfessionalUsers(professionalId);
        return users.stream().map(this::toUserResponse).toList();
    }

    private ProfessionalResponseDTO toResponse(ProfessionalEntity saved) {
        return ProfessionalResponseDTO.builder()
                .id(saved.getId())
                .age(calculateAge(saved.getBirthDate()))
                .email(saved.getEmail())
                .userId(saved.getUser() != null ? saved.getUser().getId() : null)
                .username(saved.getUser() != null ? saved.getUser().getUsername() : null)
                .userEmail(saved.getUser() != null ? saved.getUser().getEmail() : null)
                .firstName(saved.getFirstName())
                .lastName(saved.getLastName())
                .mobile(saved.getMobile())
                .gender(saved.getGender())
                .document(saved.getDocument())
                .birthDate(saved.getBirthDate())
                .tuition(saved.getTuition())
                .registration(saved.getRegistration())
                .status(saved.getStatus() != null ? saved.getStatus() : null)
                .firstConsultationFee(saved.getFirstConsultationFee())
                .followUpConsultationFee(saved.getFollowUpConsultationFee())
                .onlineConsultationFee(saved.getOnlineConsultationFee())
                .feeCurrency(saved.getFeeCurrency() != null ? saved.getFeeCurrency() : "ARS")
                .allowAppointmentFeeOverride(!Boolean.FALSE.equals(saved.getAllowAppointmentFeeOverride()))
                .specialties((saved.getSpecialties() != null ? saved.getSpecialties() : List.<SpecialtyEntity>of()).stream()
                        .map(s -> SpecialtyOnlyNameDTO.builder()
                                .id(s.getId())
                                .name(s.getName())
                                .build())
                        .toList())
                .build();
    }

    private UserEntity resolveProfessionalUser(Long userId, Long professionalId) {
        if (userId == null) {
            throw new ApiException("El usuario asociado es obligatorio", HttpStatus.BAD_REQUEST.value());
        }

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException("El usuario asociado no existe", HttpStatus.BAD_REQUEST.value()));

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new ApiException("El usuario asociado debe estar activo", HttpStatus.BAD_REQUEST.value());
        }
        if (!hasRole(user, "PROFESSIONAL")) {
            throw new ApiException("El usuario asociado debe tener rol PROFESSIONAL", HttpStatus.BAD_REQUEST.value());
        }
        if (hasRole(user, "ADMIN") || hasRole(user, "SECRETARY")) {
            throw new ApiException("No se puede asociar un usuario ADMIN o SECRETARY como profesional", HttpStatus.BAD_REQUEST.value());
        }

        boolean alreadyLinked = professionalId == null
                ? professionalRepository.existsByUserId(userId)
                : professionalRepository.existsByUserIdAndIdNot(userId, professionalId);
        if (alreadyLinked) {
            throw new ApiException("El usuario asociado ya esta vinculado a otro profesional", HttpStatus.CONFLICT.value());
        }

        return user;
    }

    private boolean hasRole(UserEntity user, String roleName) {
        return user.getRoles() != null && user.getRoles().stream()
                .map(RoleEntity::getName)
                .anyMatch(role -> roleName.equalsIgnoreCase(role));
    }

    private void validateProfessionalScope(Long professionalId) {
        Long currentProfessionalId = scopedProfessionalId();
        if (currentProfessionalId != null && !currentProfessionalId.equals(professionalId)) {
            throw new EntityNotFoundException("Profesional no encontrado");
        }
    }

    private Long scopedProfessionalId() {
        return currentProfessionalProvider != null && currentProfessionalProvider.isProfessional()
                ? currentProfessionalProvider.requireCurrentProfessionalId()
                : null;
    }

    private UserResponseDTO toUserResponse(UserEntity user) {
        return new UserResponseDTO(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getIsActive(),
                user.getPasswordConfigured() == null || Boolean.TRUE.equals(user.getPasswordConfigured()),
                user.getAcceptedTerms() == null || Boolean.TRUE.equals(user.getAcceptedTerms()),
                user.getAcceptedTermsAt(),
                user.getRoles().stream().map(RoleEntity::getName).collect(Collectors.toSet()));
    }

    private Integer calculateAge(LocalDate birthDate){
        if (birthDate == null) {
            return null;
        }
        return Period.between(birthDate, LocalDate.now()).getYears();
    }

    private Specification<ProfessionalEntity> bySearch(String search) {
        return (root, query, cb) -> {

            if (search == null || search.isBlank()) {
                return cb.conjunction();
            }

            String pattern = "%" + search.toLowerCase() + "%";
            Join<ProfessionalEntity, SpecialtyEntity> specialty = root.join("specialties", JoinType.LEFT);
            query.distinct(true);

            return cb.or(
                    cb.like(cb.lower(root.get("firstName")), pattern),
                    cb.like(cb.lower(root.get("lastName")), pattern),
                    cb.like(cb.lower(root.get("email")), pattern),
                    cb.like(cb.lower(root.get("mobile")), pattern),
                    cb.like(root.get("document").as(String.class), pattern),
                    cb.like(cb.lower(root.get("registration")), pattern),
                    cb.like(cb.lower(root.get("tuition")), pattern),
                    cb.like(cb.lower(specialty.get("name")), pattern)
            );
        };
    }

    private Specification<ProfessionalEntity> byId(Long professionalId) {
        return (root, query, cb) -> professionalId == null
                ? cb.conjunction()
                : cb.equal(root.get("id"), professionalId);
    }

    private List<SpecialtyEntity> resolveSpecialtiesForUpdate(ProfessionalEntity professional, List<Long> requestedIds) {
        if (requestedIds == null) {
            return professional.getSpecialties() != null ? professional.getSpecialties() : List.of();
        }
        if (requestedIds.isEmpty()) {
            throw new ApiException("La especialidad es obligatoria", HttpStatus.BAD_REQUEST.value());
        }
        List<SpecialtyEntity> specialties = specialtyRepository.findAllById(requestedIds);
        if (specialties.size() != requestedIds.size()) {
            throw new EntityNotFoundException("Una o mas especialidades no existen");
        }
        return specialties;
    }

    private String resolveRequiredText(String requested, String current, String message) {
        if (requested == null) {
            if (current == null || current.isBlank()) {
                throw new ApiException(message, HttpStatus.BAD_REQUEST.value());
            }
            return current;
        }
        if (requested.isBlank()) {
            throw new ApiException(message, HttpStatus.BAD_REQUEST.value());
        }
        return requested;
    }

    private void applyFees(ProfessionalEntity professional,
                           BigDecimal firstConsultationFee,
                           BigDecimal followUpConsultationFee,
                           BigDecimal onlineConsultationFee,
                           String feeCurrency,
                           Boolean allowOverride) {
        validateFee(firstConsultationFee, "El valor de primera consulta no puede ser negativo");
        validateFee(followUpConsultationFee, "El valor de consulta de control no puede ser negativo");
        validateFee(onlineConsultationFee, "El valor de consulta online no puede ser negativo");
        professional.setFirstConsultationFee(firstConsultationFee);
        professional.setFollowUpConsultationFee(followUpConsultationFee);
        professional.setOnlineConsultationFee(onlineConsultationFee);
        professional.setFeeCurrency(feeCurrency == null || feeCurrency.isBlank() ? "ARS" : feeCurrency.trim().toUpperCase());
        professional.setAllowAppointmentFeeOverride(!Boolean.FALSE.equals(allowOverride));
    }

    private void applyFeeUpdates(ProfessionalEntity professional,
                                 BigDecimal firstConsultationFee,
                                 BigDecimal followUpConsultationFee,
                                 BigDecimal onlineConsultationFee,
                                 String feeCurrency,
                                 Boolean allowOverride) {
        validateFee(firstConsultationFee, "El valor de primera consulta no puede ser negativo");
        validateFee(followUpConsultationFee, "El valor de consulta de control no puede ser negativo");
        validateFee(onlineConsultationFee, "El valor de consulta online no puede ser negativo");
        if (firstConsultationFee != null) {
            professional.setFirstConsultationFee(firstConsultationFee);
        }
        if (followUpConsultationFee != null) {
            professional.setFollowUpConsultationFee(followUpConsultationFee);
        }
        if (onlineConsultationFee != null) {
            professional.setOnlineConsultationFee(onlineConsultationFee);
        }
        if (feeCurrency != null) {
            professional.setFeeCurrency(feeCurrency.isBlank() ? "ARS" : feeCurrency.trim().toUpperCase());
        }
        if (allowOverride != null) {
            professional.setAllowAppointmentFeeOverride(allowOverride);
        }
    }

    private void validateFee(BigDecimal value, String message) {
        if (value != null && value.compareTo(BigDecimal.ZERO) < 0) {
            throw new ApiException(message, HttpStatus.BAD_REQUEST.value());
        }
    }

    private Specification<ProfessionalEntity> byGender(GenderType gender) {
        return (root, query, cb) -> {

            if (gender == null) {
                return cb.conjunction();
            }
            return cb.equal(root.get("gender"), gender);
        };
    }

    private Specification<ProfessionalEntity> byStatus(PersonStatus status) {
        return (root, query, cb) -> {

            if (status == null) {
                return cb.conjunction();
            }

            return cb.equal(root.get("status"), status);
        };
    }

    private Specification<ProfessionalEntity> bySpecialty(Long specialtyId) {
        return (root, query, cb) -> {

            if (specialtyId == null) {
                return cb.conjunction();
            }

            Join<ProfessionalEntity, SpecialtyEntity> specialty = root.join("specialties");

            return cb.equal(specialty.get("id"), specialtyId);
        };
    }
}
