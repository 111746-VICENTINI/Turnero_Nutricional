package nutricentro.services.implementation;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import nutricentro.dtos.patients.PatientRequestDTO;
import nutricentro.dtos.patients.PatientResponseDTO;
import nutricentro.dtos.patients.PatientUpdateDTO;
import nutricentro.entities.AppointmentEntity;
import nutricentro.entities.PatientEntity;
import nutricentro.enums.GenderType;
import nutricentro.enums.PersonStatus;
import nutricentro.repositories.PatientRepository;
import nutricentro.repositories.AppointmentRepository;
import nutricentro.repositories.ConsultationRepository;
import nutricentro.services.CurrentProfessionalProvider;
import nutricentro.services.PatientService;
import nutricentro.exception.ApiException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.Period;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PatientServiceImpl implements PatientService {

    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final ConsultationRepository consultationRepository;
    private final CurrentProfessionalProvider currentProfessionalProvider;

    @Override
    public List<PatientResponseDTO> getAllPatients() {
        Long professionalId = scopedProfessionalId();
        if (professionalId != null) {
            return patientRepository.findAll(byProfessional(professionalId)).stream()
                    .map(this::toResponse)
                    .collect(Collectors.toList());
        }
        return patientRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public PatientResponseDTO getPatientById(Long id) {
        PatientEntity patient = patientRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Paciente no encontrado"));
        validatePatientScope(patient.getId());
        return toResponse(patient);
    }

    @Override
    public PatientResponseDTO createPatient(PatientRequestDTO patient) {
        validateUniqueDocumentForCreate(patient.getDocument());
        PatientEntity patientEntity = new PatientEntity();
        patientEntity.setFirstName(patient.getFirstName());
        patientEntity.setLastName(patient.getLastName());
        patientEntity.setEmail(patient.getEmail());
        patientEntity.setDocument(patient.getDocument());
        patientEntity.setAddress(patient.getAddress());
        patientEntity.setGender(patient.getGender());
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
        validatePatientScope(patient.getId());
        patient.setStatus(PersonStatus.INACTIVE);
        patientRepository.save(patient);
    }

    @Override
    public PatientResponseDTO update(Long id, PatientUpdateDTO patient) {
        PatientEntity patientEntity = patientRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Paciente no encontrado"));
        validatePatientScope(patientEntity.getId());
        validateUniqueDocumentForUpdate(patient.getDocument(), patientEntity.getId());
        patientEntity.setFirstName(patient.getFirstName());
        patientEntity.setLastName(patient.getLastName());
        patientEntity.setEmail(patient.getEmail());
        patientEntity.setDocument(patient.getDocument());
        patientEntity.setGender(patient.getGender());
        patientEntity.setMobile(patient.getMobile());
        patientEntity.setAddress(patient.getAddress());
        if (patient.getStatus() != null) {
            patientEntity.setStatus(patient.getStatus());
        }
        patientEntity.setBirthDate(patient.getBirthDate());
        PatientEntity saved = patientRepository.save(patientEntity);
        return toResponse(saved);
    }

    @Override
    public Page<PatientResponseDTO> searchPatients(String search, GenderType gender, PersonStatus status, Long professionalId, Pageable pageable) {
        Long scopedProfessionalId = currentProfessionalProvider != null && currentProfessionalProvider.isProfessional()
                ? currentProfessionalProvider.requireCurrentProfessionalId()
                : professionalId;
        Specification<PatientEntity> spec = Specification.allOf(
                bySearch(search),
                byGender(gender),
                byStatus(status),
                byProfessional(scopedProfessionalId)
        );

        return patientRepository
                .findAll(spec, pageable)
                .map(this::toResponse);
    }

    private PatientResponseDTO toResponse(PatientEntity saved) {
        return PatientResponseDTO.builder()
                .id(saved.getId())
                .gender(saved.getGender())
                .document(saved.getDocument())
                .firstName(saved.getFirstName())
                .lastName(saved.getLastName())
                .email(saved.getEmail())
                .mobile(saved.getMobile())
                .address(saved.getAddress())
                .age(calculateAge(saved.getBirthDate()))
                .birthDate(saved.getBirthDate())
                .status(saved.getStatus() != null ? saved.getStatus() : null)
                .build();
    }

    private Integer calculateAge(LocalDate birthDate){
        if (birthDate == null) {
            return null;
        }
        return Period.between(birthDate, LocalDate.now()).getYears();
    }

    private Specification<PatientEntity> bySearch(String search) {
        return (root, query, cb) -> {
            if (search == null || search.isBlank()) {
                return cb.conjunction();
            }

            String pattern = "%" + search.toLowerCase() + "%";

            return cb.or(
                    cb.like(cb.lower(root.get("firstName")), pattern),
                    cb.like(cb.lower(root.get("lastName")), pattern),
                    cb.like(cb.lower(root.get("email")), pattern),
                    cb.like(cb.lower(root.get("mobile")), pattern),
                    cb.like(root.get("document").as(String.class), pattern)
            );
        };
    }

    private Specification<PatientEntity> byGender(GenderType gender) {
        return (root, query, cb) -> {

            if (gender == null) {
                return cb.conjunction();
            }

            return cb.equal(root.get("gender"), gender);
        };
    }

    private Specification<PatientEntity> byStatus(PersonStatus status) {
        return (root, query, cb) -> {

            if (status == null) {
                return cb.conjunction();
            }

            return cb.equal(root.get("status"), status);
        };
    }

    private Specification<PatientEntity> byProfessional(Long professionalId) {
        return (root, query, cb) -> {
            if (professionalId == null) {
                return cb.conjunction();
            }

            var appointmentSubquery = query.subquery(Long.class);
            var appointment = appointmentSubquery.from(AppointmentEntity.class);

            appointmentSubquery
                    .select(appointment.get("patient").get("id"))
                    .where(cb.equal(appointment.get("professional").get("id"), professionalId));

            return root.get("id").in(appointmentSubquery);
        };
    }

    private void validatePatientScope(Long patientId) {
        Long professionalId = scopedProfessionalId();
        if (professionalId != null
                && !appointmentRepository.existsByPatientIdAndProfessionalId(patientId, professionalId)
                && !consultationRepository.existsByPatientIdAndProfessionalId(patientId, professionalId)) {
            throw new EntityNotFoundException("Paciente no encontrado");
        }
    }

    private void validateUniqueDocumentForCreate(Integer document) {
        if (document != null && patientRepository.existsByDocument(document)) {
            throw new ApiException("Ya existe un paciente registrado con ese DNI.", HttpStatus.CONFLICT.value());
        }
    }

    private void validateUniqueDocumentForUpdate(Integer document, Long patientId) {
        if (document != null && patientRepository.existsByDocumentAndIdNot(document, patientId)) {
            throw new ApiException("Ya existe un paciente registrado con ese DNI.", HttpStatus.CONFLICT.value());
        }
    }

    private Long scopedProfessionalId() {
        return currentProfessionalProvider != null && currentProfessionalProvider.isProfessional()
                ? currentProfessionalProvider.requireCurrentProfessionalId()
                : null;
    }

}
