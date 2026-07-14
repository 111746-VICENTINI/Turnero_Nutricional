package nutricentro.services;

import nutricentro.dtos.availability.ProfessionalAvailabilityExceptionRequestDTO;
import nutricentro.dtos.availability.ProfessionalAvailabilityExceptionResponseDTO;

import java.time.LocalDate;
import java.util.List;

public interface ProfessionalAvailabilityExceptionService {
    ProfessionalAvailabilityExceptionResponseDTO create(ProfessionalAvailabilityExceptionRequestDTO dto);
    List<ProfessionalAvailabilityExceptionResponseDTO> getByProfessionalAndDate(Long professionalId, LocalDate date);
    void delete(Long id);
}
