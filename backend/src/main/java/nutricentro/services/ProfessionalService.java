package nutricentro.services;

import nutricentro.dtos.professionals.ProfessionalRequestDTO;
import nutricentro.dtos.professionals.ProfessionalResponseDTO;
import nutricentro.dtos.professionals.ProfessionalUpdateDTO;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public interface ProfessionalService {

    ProfessionalResponseDTO createProfessional(ProfessionalRequestDTO professional);
    List<ProfessionalResponseDTO> getAllProfessionals();
    ProfessionalResponseDTO getProfessionalById(Long id);
    void delete (Long id);
    ProfessionalResponseDTO update (Long id, ProfessionalUpdateDTO professional);
}
