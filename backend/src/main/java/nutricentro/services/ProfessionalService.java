package nutricentro.services;

import nutricentro.dtos.professionals.ProfessionalRequestDTO;
import nutricentro.dtos.professionals.ProfessionalResponseDTO;
import nutricentro.dtos.professionals.ProfessionalUpdateDTO;
import nutricentro.dtos.users.UserResponseDTO;
import nutricentro.enums.GenderType;
import nutricentro.enums.PersonStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public interface ProfessionalService {

    ProfessionalResponseDTO createProfessional(ProfessionalRequestDTO professional);
    List<ProfessionalResponseDTO> getAllProfessionals();
    ProfessionalResponseDTO getProfessionalById(Long id);
    void delete (Long id);
    ProfessionalResponseDTO update (Long id, ProfessionalUpdateDTO professional);
    Page<ProfessionalResponseDTO> searchProfessionals(String search, GenderType gender,
                                                      PersonStatus status, Long specialtyId, Pageable pageable);
    List<UserResponseDTO> getAvailableProfessionalUsers(Long professionalId);
}
