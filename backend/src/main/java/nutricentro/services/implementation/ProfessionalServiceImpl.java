package nutricentro.services.implementation;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import nutricentro.dtos.professionals.ProfessionalRequestDTO;
import nutricentro.dtos.professionals.ProfessionalResponseDTO;
import nutricentro.dtos.professionals.ProfessionalUpdateDTO;
import nutricentro.entities.ProfessionalEntity;
import nutricentro.enums.PersonStatus;
import nutricentro.repositories.ProfessionalRepository;
import nutricentro.services.ProfessionalService;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.Period;
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
        professionalEntity.setBirthDate(professional.getBirthDate());
        professionalEntity.setDocument(professional.getDocument());
        professionalEntity.setSpecialty(professional.getSpecialty());
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
        professionalEntity.setFirstName(professional.getFirstName());
        professionalEntity.setLastName(professional.getLastName());
        professionalEntity.setMobile(professional.getMobile());
        professionalEntity.setGender(professional.getGender());
        professionalEntity.setEmail(professional.getEmail());
        professionalEntity.setStatus(professional.getStatus());
        professionalEntity.setBirthDate(professional.getBirthDate());
        professionalEntity.setDocument(professional.getDocument());
        professionalEntity.setSpecialty(professional.getSpecialty());
        professionalEntity.setTuition(professional.getTuition());
        professionalEntity.setRegistration(professional.getRegistration());
        ProfessionalEntity saved = professionalRepository.save(professionalEntity);
        return toResponse(saved);
    }

    private ProfessionalResponseDTO toResponse(ProfessionalEntity saved) {
        return ProfessionalResponseDTO.builder()
                .id(saved.getProfessionalId())
                .age(calculateAge(saved.getBirthDate()))
                .email(saved.getEmail())
                .firstName(saved.getFirstName())
                .lastName(saved.getLastName())
                .mobile(saved.getMobile())
                .gender(saved.getGender())
                .status(saved.getStatus() != null ? saved.getStatus() : null)
                .build();
    }

    private Integer calculateAge(LocalDate birthDate){
        return Period.between(birthDate, LocalDate.now()).getYears();
    }

}
