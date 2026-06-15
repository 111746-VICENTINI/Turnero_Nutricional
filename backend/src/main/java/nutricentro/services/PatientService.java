package nutricentro.services;

import nutricentro.dtos.patients.PatientRequestDTO;
import nutricentro.dtos.patients.PatientResponseDTO;
import nutricentro.dtos.patients.PatientUpdateDTO;
import nutricentro.enums.GenderType;
import nutricentro.enums.PersonStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public interface PatientService {
    List<PatientResponseDTO> getAllPatients();
    PatientResponseDTO getPatientById(Long id);
    PatientResponseDTO createPatient(PatientRequestDTO patient);
    void delete (Long id);
    PatientResponseDTO update (Long id, PatientUpdateDTO patient);
    Page<PatientResponseDTO> searchPatients(String search, GenderType gender, PersonStatus status, Pageable pageable);
}
