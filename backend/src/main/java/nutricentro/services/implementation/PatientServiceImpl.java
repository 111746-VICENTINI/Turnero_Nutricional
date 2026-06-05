package nutricentro.services.implementation;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import nutricentro.dtos.patients.PatientRequestDTO;
import nutricentro.dtos.patients.PatientResponseDTO;
import nutricentro.dtos.patients.PatientUpdateDTO;
import nutricentro.entities.PatientEntity;
import nutricentro.enums.GenderType;
import nutricentro.enums.PersonStatus;
import nutricentro.repositories.PatientRepository;
import nutricentro.services.PatientService;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.Period;
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
                .orElseThrow(() -> new EntityNotFoundException("Paciente no encontrado"));
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
        patientEntity.setGender(GenderType.valueOf(patient.getGender().toLowerCase()));
        patientEntity.setStatus(PersonStatus.ACTIVE);
        patientEntity.setMobile(patient.getMobile());
        patientEntity.setBirthDate(patient.getBirthDate());
        PatientEntity saved = patientRepository.save(patientEntity);
        return toResponse(saved);
    }

    @Override
    public void delete(Long id) {
        PatientEntity patient = patientRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Paciente no encontrado"));
        patient.setStatus(PersonStatus.INACTIVE);
        patientRepository.save(patient);
    }

    @Override
    public PatientResponseDTO update(Long id, PatientUpdateDTO patient) {
        PatientEntity patientEntity = patientRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Paciente no encontrado"));
        patientEntity.setFirstName(patient.getFirstName());
        patientEntity.setLastName(patient.getLastName());
        patientEntity.setEmail(patient.getEmail());
        patientEntity.setDocument(patient.getDocument());
        patientEntity.setGender(GenderType.valueOf(patient.getGender().toLowerCase()));
        patientEntity.setMobile(patient.getMobile());
        patientEntity.setStatus(patient.getStatus());
        patientEntity.setBirthDate(patient.getBirthDate());
        PatientEntity saved = patientRepository.save(patientEntity);
        return toResponse(saved);
    }

    private PatientResponseDTO toResponse(PatientEntity saved) {
        return PatientResponseDTO.builder()
                .id(saved.getPatientId())
                .firstName(saved.getFirstName())
                .lastName(saved.getLastName())
                .email(saved.getEmail())
                .mobile(saved.getMobile())
                .age(calculateAge(saved.getBirthDate()))
                .birthDate(saved.getBirthDate())
                .status(saved.getStatus() != null ? saved.getStatus() : null)
                .build();
    }

    private Integer calculateAge(LocalDate birthDate){
        return Period.between(birthDate, LocalDate.now()).getYears();
    }

}
