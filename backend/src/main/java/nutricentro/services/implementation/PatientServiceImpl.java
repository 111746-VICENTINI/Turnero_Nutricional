package nutricentro.services.implementation;

import lombok.RequiredArgsConstructor;
import nutricentro.dtos.patients.PatientRequestDTO;
import nutricentro.dtos.patients.PatientResponseDTO;
import nutricentro.entities.PatientEntity;
import nutricentro.enums.GenderType;
import nutricentro.enums.PersonStatus;
import nutricentro.repositories.PatientRepository;
import nutricentro.services.PatientService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PatientServiceImpl implements PatientService {

    private final PatientRepository patientRepository;

    @Override
    public List<PatientResponseDTO> getAllPatients() {
        return patientRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public PatientResponseDTO getPatientById(Long id) {
        PatientEntity patient = patientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Paciente no encontrado"));
        return toResponse(patient);
    }

    @Override
    public PatientResponseDTO createPatient(PatientRequestDTO patient) {
        PatientEntity patientEntity = new PatientEntity();
        patientEntity.setFirstName(patient.getFirstName());
        patientEntity.setLastName(patient.getLastName());
        patientEntity.setEmail(patient.getEmail());
        patientEntity.setDocument(patient.getDocument());
        patientEntity.setAddress(patient.getAddress());
        patientEntity.setGender(GenderType.valueOf(patient.getGender().toUpperCase()));
        patientEntity.setStatus(PersonStatus.ACTIVE);
        patientEntity.setMobile(patient.getMobile());
        patientEntity.setAge(patient.getAge());
        PatientEntity saved = patientRepository.save(patientEntity);
        return toResponse(saved);
    }

    private PatientResponseDTO toResponse(PatientEntity saved) {
        return PatientResponseDTO.builder()
                .id(saved.getPatientId())
                .firstName(saved.getFirstName())
                .lastName(saved.getLastName())
                .age(saved.getAge())
                .email(saved.getEmail())
                .mobile(saved.getMobile())
                .status(saved.getStatus() != null ? saved.getStatus() : null)
                .build();
    }

}
