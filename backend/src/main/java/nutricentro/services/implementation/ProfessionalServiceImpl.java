package nutricentro.services.implementation;

import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.criteria.Join;
import lombok.RequiredArgsConstructor;
import nutricentro.dtos.professionals.ProfessionalRequestDTO;
import nutricentro.dtos.professionals.ProfessionalResponseDTO;
import nutricentro.dtos.professionals.ProfessionalUpdateDTO;
import nutricentro.dtos.specialties.SpecialtyOnlyNameDTO;
import nutricentro.entities.ProfessionalEntity;
import nutricentro.entities.SpecialtyEntity;
import nutricentro.enums.GenderType;
import nutricentro.enums.PersonStatus;
import nutricentro.repositories.ProfessionalRepository;
import nutricentro.repositories.SpecialtyRepository;
import nutricentro.services.ProfessionalService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.Period;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProfessionalServiceImpl implements ProfessionalService {
    private final ProfessionalRepository professionalRepository;
    private final SpecialtyRepository specialtyRepository;

    @Override
    public ProfessionalResponseDTO createProfessional(ProfessionalRequestDTO professional) {
        List<SpecialtyEntity> specialties = specialtyRepository.
                findAllById(professional.getSpecialtyIds());

        if (specialties.size() != professional.getSpecialtyIds().size()) {
            throw new EntityNotFoundException("Una o más especialidades no existen");
        }

        ProfessionalEntity professionalEntity = new ProfessionalEntity();
        professionalEntity.setFirstName(professional.getFirstName());
        professionalEntity.setLastName(professional.getLastName());
        professionalEntity.setBirthDate(professional.getBirthDate());
        professionalEntity.setDocument(professional.getDocument());
        professionalEntity.setSpecialties(specialties);
        professionalEntity.setTuition(professional.getTuition());
        professionalEntity.setMobile(professional.getMobile());
        professionalEntity.setGender(professional.getGender());
        professionalEntity.setEmail(professional.getEmail());
        professionalEntity.setRegistration(professional.getRegistration());
        professionalEntity.setStatus(PersonStatus.ACTIVE);
        ProfessionalEntity saved = professionalRepository.save(professionalEntity);
        return toResponse(saved);
    }

    @Override
    public List<ProfessionalResponseDTO> getAllProfessionals() {
        return professionalRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public ProfessionalResponseDTO getProfessionalById(Long id) {
        ProfessionalEntity professionalEntity = professionalRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Profesional no encontrado"));
        return toResponse(professionalEntity);
    }

    @Override
    public void delete(Long id) {
        ProfessionalEntity professionalEntity = professionalRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Profesional no encontrado"));
        professionalEntity.setStatus(PersonStatus.INACTIVE);
        professionalRepository.save(professionalEntity);
    }

    @Override
    public ProfessionalResponseDTO update(Long id, ProfessionalUpdateDTO professional) {
        ProfessionalEntity professionalEntity = professionalRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Profesional no encontrado"));

        List<SpecialtyEntity> specialties = specialtyRepository.findAllById(professional.getSpecialtyIds());

        if (specialties.size() != professional.getSpecialtyIds().size()) {
            throw new EntityNotFoundException("Una o más especialidades no existen");
        }

        professionalEntity.setFirstName(professional.getFirstName());
        professionalEntity.setLastName(professional.getLastName());
        professionalEntity.setMobile(professional.getMobile());
        professionalEntity.setGender(professional.getGender());
        professionalEntity.setEmail(professional.getEmail());
        professionalEntity.setStatus(professional.getStatus());
        professionalEntity.setBirthDate(professional.getBirthDate());
        professionalEntity.setDocument(professional.getDocument());
        professionalEntity.setSpecialties(specialties);
        professionalEntity.setTuition(professional.getTuition());
        professionalEntity.setRegistration(professional.getRegistration());
        ProfessionalEntity saved = professionalRepository.save(professionalEntity);
        return toResponse(saved);
    }

    @Override
    public Page<ProfessionalResponseDTO> searchProfessionals(String search, GenderType gender, PersonStatus status, Long specialtyId, Pageable pageable) {
        Specification<ProfessionalEntity> spec = Specification.where(bySearch(search))
                .and(byGender(gender))
                .and(byStatus(status))
                .and(bySpecialty(specialtyId));

        return professionalRepository.findAll(spec, pageable).map(this::toResponse);
    }

    private ProfessionalResponseDTO toResponse(ProfessionalEntity saved) {
        return ProfessionalResponseDTO.builder()
                .id(saved.getId())
                .age(calculateAge(saved.getBirthDate()))
                .email(saved.getEmail())
                .firstName(saved.getFirstName())
                .lastName(saved.getLastName())
                .mobile(saved.getMobile())
                .gender(saved.getGender())
                .document(saved.getDocument())
                .birthDate(saved.getBirthDate())
                .tuition(saved.getTuition())
                .registration(saved.getRegistration())
                .status(saved.getStatus() != null ? saved.getStatus() : null)
                .specialties(saved.getSpecialties().stream()
                        .map(s -> SpecialtyOnlyNameDTO.builder()
                                .id(s.getId())
                                .name(s.getName())
                                .build())
                        .toList())
                .build();
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

            return cb.or(
                    cb.like(cb.lower(root.get("firstName")), pattern),
                    cb.like(cb.lower(root.get("lastName")), pattern),
                    cb.like(cb.lower(root.get("email")), pattern)
            );
        };
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
