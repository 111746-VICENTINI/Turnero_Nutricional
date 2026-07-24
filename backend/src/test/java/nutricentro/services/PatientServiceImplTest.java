package nutricentro.services;

import nutricentro.dtos.patients.PatientRequestDTO;
import nutricentro.dtos.patients.PatientResponseDTO;
import nutricentro.dtos.patients.PatientUpdateDTO;
import nutricentro.entities.PatientEntity;
import nutricentro.enums.GenderType;
import nutricentro.enums.PersonStatus;
import nutricentro.exception.ApiException;
import nutricentro.repositories.AppointmentRepository;
import nutricentro.repositories.ConsultationRepository;
import nutricentro.repositories.PatientRepository;
import nutricentro.services.implementation.PatientServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PatientServiceImplTest {

    @Mock
    private PatientRepository patientRepository;
    @Mock
    private AppointmentRepository appointmentRepository;
    @Mock
    private ConsultationRepository consultationRepository;
    @Mock
    private CurrentProfessionalProvider currentProfessionalProvider;

    @InjectMocks
    private PatientServiceImpl service;

    @Test
    void createRejectsDuplicatedDocument() {
        PatientRequestDTO request = request(30111222);
        when(patientRepository.existsByDocument(30111222)).thenReturn(true);

        ApiException exception = assertThrows(ApiException.class, () -> service.createPatient(request));

        assertEquals(409, exception.getStatus());
        assertEquals("Ya existe un paciente registrado con ese DNI.", exception.getMessage());
        verify(patientRepository, never()).save(any());
    }

    @Test
    void updateRejectsDocumentOwnedByAnotherPatient() {
        PatientEntity patient = patient(1L, 30111222, PersonStatus.ACTIVE);
        PatientUpdateDTO request = updateRequest(38999888, PersonStatus.ACTIVE);
        when(patientRepository.findById(1L)).thenReturn(Optional.of(patient));
        when(patientRepository.existsByDocumentAndIdNot(38999888, 1L)).thenReturn(true);

        ApiException exception = assertThrows(ApiException.class, () -> service.update(1L, request));

        assertEquals(409, exception.getStatus());
        assertEquals("Ya existe un paciente registrado con ese DNI.", exception.getMessage());
        verify(patientRepository, never()).save(any());
    }

    @Test
    void updateReactivatesPatientWhenStatusIsActive() {
        PatientEntity patient = patient(1L, 30111222, PersonStatus.INACTIVE);
        PatientUpdateDTO request = updateRequest(30111222, PersonStatus.ACTIVE);
        when(patientRepository.findById(1L)).thenReturn(Optional.of(patient));
        when(patientRepository.save(patient)).thenReturn(patient);

        PatientResponseDTO response = service.update(1L, request);

        assertEquals(PersonStatus.ACTIVE, response.getStatus());
    }

    @Test
    void updateKeepsCurrentStatusWhenStatusIsNotProvided() {
        PatientEntity patient = patient(1L, 30111222, PersonStatus.ACTIVE);
        PatientUpdateDTO request = updateRequest(30111222, null);
        when(patientRepository.findById(1L)).thenReturn(Optional.of(patient));
        when(patientRepository.save(patient)).thenReturn(patient);

        PatientResponseDTO response = service.update(1L, request);

        assertEquals(PersonStatus.ACTIVE, response.getStatus());
    }

    private PatientRequestDTO request(Integer document) {
        return PatientRequestDTO.builder()
                .firstName("Paciente")
                .lastName("Prueba")
                .document(document)
                .birthDate(LocalDate.of(1990, 1, 1))
                .gender(GenderType.FEMALE)
                .build();
    }

    private PatientUpdateDTO updateRequest(Integer document, PersonStatus status) {
        return PatientUpdateDTO.builder()
                .firstName("Paciente")
                .lastName("Prueba")
                .document(document)
                .birthDate(LocalDate.of(1990, 1, 1))
                .gender(GenderType.FEMALE)
                .status(status)
                .build();
    }

    private PatientEntity patient(Long id, Integer document, PersonStatus status) {
        PatientEntity patient = new PatientEntity();
        patient.setId(id);
        patient.setFirstName("Paciente");
        patient.setLastName("Prueba");
        patient.setDocument(document);
        patient.setBirthDate(LocalDate.of(1990, 1, 1));
        patient.setGender(GenderType.FEMALE);
        patient.setStatus(status);
        return patient;
    }
}
