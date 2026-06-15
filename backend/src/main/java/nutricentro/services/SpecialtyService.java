package nutricentro.services;

import nutricentro.dtos.specialties.SpecialtyRequestDTO;
import nutricentro.dtos.specialties.SpecialtyResponseDTO;
import nutricentro.dtos.specialties.SpecialtyUpdateDTO;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public interface SpecialtyService {
    SpecialtyResponseDTO createSpecialty(SpecialtyRequestDTO dto);
    List<SpecialtyResponseDTO> getAllSpecialties();
    SpecialtyResponseDTO getSpecialtyById(Long id);
    void delete (Long id);
    SpecialtyResponseDTO update (Long id, SpecialtyUpdateDTO specialty);
}
