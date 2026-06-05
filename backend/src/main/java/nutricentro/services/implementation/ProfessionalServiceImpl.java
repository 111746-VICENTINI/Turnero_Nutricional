package nutricentro.services.implementation;

import lombok.RequiredArgsConstructor;
import nutricentro.dtos.professionals.ProfessionalRequestDTO;
import nutricentro.dtos.professionals.ProfessionalResponseDTO;
import nutricentro.entities.ProfessionalEntity;
import nutricentro.repositories.ProfessionalRepository;
import nutricentro.services.ProfessionalService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProfessionalServiceImpl implements ProfessionalService {
    private final ProfessionalRepository professionalRepository;

    @Override
    public ProfessionalResponseDTO createProfessional(ProfessionalRequestDTO professional) {
        ProfessionalEntity professionalEntity = new ProfessionalEntity();
        professionalEntity.setFirstName(professional.getFirstName());
        professionalEntity.setLastName(professional.getLastName());
        professionalEntity.setAge(professional.getAge());
        professionalEntity.setDocument(professional.getDocument());
        professionalEntity.setSpecialty(professional.getSpecialty());
        professionalEntity.setTuition(professional.getTuition());
        professionalEntity.setMobile(professional.getMobile());
        professionalEntity.setGender(professional.getGender());
        professionalEntity.setEmail(professional.getEmail());
        professionalEntity.setRegistration(professional.getRegistration());
        professionalEntity.setState(professional.getState());
        ProfessionalEntity saved = professionalRepository.save(professionalEntity);
        return toResponse(saved);
    }

    private ProfessionalResponseDTO toResponse(ProfessionalEntity saved) {
        return ProfessionalResponseDTO.builder()
                .id(saved.getProfessionalId())
                .age(saved.getAge())
                .email(saved.getEmail())
                .firstName(saved.getFirstName())
                .lastName(saved.getLastName())
                .mobile(saved.getMobile())
                .gender(saved.getGender())
                .state(saved.getState())
                .status(saved.getStatus() != null ? saved.getStatus() : null)
                .build();
    }

    @Override
    public List<ProfessionalResponseDTO> getAllProfessionals() {
        return professionalRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public ProfessionalResponseDTO getProfessionalById(Long id) {
        ProfessionalEntity professionalEntity = professionalRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Profesional no encontrado"));
        return toResponse(professionalEntity);
    }

}
