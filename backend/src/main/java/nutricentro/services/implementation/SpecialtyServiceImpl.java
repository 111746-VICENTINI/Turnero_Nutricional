package nutricentro.services.implementation;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import nutricentro.dtos.specialties.SpecialtyRequestDTO;
import nutricentro.dtos.specialties.SpecialtyResponseDTO;
import nutricentro.dtos.specialties.SpecialtyUpdateDTO;
import nutricentro.entities.SpecialtyEntity;
import nutricentro.repositories.ProfessionalRepository;
import nutricentro.repositories.SpecialtyRepository;
import nutricentro.services.SpecialtyService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SpecialtyServiceImpl implements SpecialtyService {
    private final SpecialtyRepository specialtyRepository;
    private final ProfessionalRepository professionalRepository;

    @Override
    public SpecialtyResponseDTO createSpecialty(SpecialtyRequestDTO dto) {
        SpecialtyEntity specialty = new SpecialtyEntity();
        specialty.setName(dto.getName());
        specialty.setDescription(dto.getDescription());
        specialty.setIsActive(true);
        SpecialtyEntity saved = specialtyRepository.save(specialty);
        return toResponse(saved);
    }

    @Override
    public List<SpecialtyResponseDTO> getAllSpecialties() {
        return specialtyRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public SpecialtyResponseDTO getSpecialtyById(Long id) {
        SpecialtyEntity specialty = specialtyRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Especialidad no encontrada"));

        return toResponse(specialty);
    }

    @Override
    public void delete(Long id) {
        SpecialtyEntity specialty = specialtyRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Especialidad no encontrada"));

        if (professionalRepository.existsBySpecialties_Id(id)){
            throw new IllegalStateException("No se puede eliminar la especialidad porque está asociada a profesionales");
        }

//        specialtyRepository.delete(specialty);
        specialty.setIsActive(false);
        specialtyRepository.save(specialty);
    }

    @Override
    public SpecialtyResponseDTO update(Long id, SpecialtyUpdateDTO specialty) {
        SpecialtyEntity specialtyEntity = specialtyRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Especialidad no encontrada"));

        specialtyEntity.setName(specialty.getName());
        specialtyEntity.setDescription(specialty.getDescription());
        specialtyEntity.setIsActive(specialty.getIsActive());
        SpecialtyEntity saved = specialtyRepository.save(specialtyEntity);
        return toResponse(saved);
    }

    @Override
    public Page<SpecialtyResponseDTO> searchSpecialties(String name, Boolean active, Pageable pageable) {
        Specification<SpecialtyEntity> spec = Specification.where(byName(name))
                .and(byActive(active));

        return specialtyRepository.findAll(spec, pageable).map(this::toResponse);
    }

    private SpecialtyResponseDTO toResponse(SpecialtyEntity specialty){
        return SpecialtyResponseDTO.builder()
                .id(specialty.getId())
                .name(specialty.getName())
                .description(specialty.getDescription())
                .isActive(specialty.getIsActive())
                .build();
    }

    private Specification<SpecialtyEntity> byName(String name) {
        return (root, query, cb) -> {
            if (name == null || name.isBlank()) {
                return cb.conjunction();
            }

            return cb.like(
                    cb.lower(root.get("name")),
                    "%" + name.toLowerCase() + "%"
            );
        };
    }

    private Specification<SpecialtyEntity> byActive(Boolean active) {
        return (root, query, cb) -> {
            if (active == null) {
                return cb.conjunction();
            }

            return cb.equal(root.get("isActive"), active);
        };
    }
}
