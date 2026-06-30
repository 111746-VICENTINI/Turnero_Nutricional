package nutricentro.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import nutricentro.dtos.patients.PatientRequestDTO;
import nutricentro.dtos.patients.PatientResponseDTO;
import nutricentro.dtos.patients.PatientUpdateDTO;
import nutricentro.enums.GenderType;
import nutricentro.enums.PersonStatus;
import nutricentro.services.PatientService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/patient")
@RequiredArgsConstructor
@CrossOrigin("*")
public class PatientController {
    private final PatientService patientService;

    @PostMapping("/create")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECRETARY')")
    public ResponseEntity<PatientResponseDTO> createPatient(@Valid @RequestBody PatientRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(patientService.createPatient(dto));
    }

    @GetMapping("/all")
    public ResponseEntity<List<PatientResponseDTO>> getAllPatients() {
        return ResponseEntity.ok(patientService.getAllPatients());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PatientResponseDTO> getPatientsById(@PathVariable Long id) {
        return ResponseEntity.ok(patientService.getPatientById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECRETARY', 'PROFESSIONAL')")
    public ResponseEntity<PatientResponseDTO> update(@PathVariable Long id,
                                                     @Valid @RequestBody PatientUpdateDTO dto) {
        return ResponseEntity.ok(patientService.update(id, dto));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECRETARY', 'PROFESSIONAL')")
    public ResponseEntity<Void> delete(@PathVariable Long id){
        patientService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping()
    @PreAuthorize("hasAnyRole('ADMIN', 'SECRETARY', 'PROFESSIONAL')")
    public ResponseEntity<Page<PatientResponseDTO>> searchPatients(

            @RequestParam(required = false)
            String search,

            @RequestParam(required = false)
            GenderType gender,

            @RequestParam(required = false)
            PersonStatus status,

            @RequestParam(required = false)
            Long professionalId,

            @RequestParam(defaultValue = "0")
            int page,

            @RequestParam(defaultValue = "10")
            int size,

            @RequestParam(defaultValue = "lastName")
            String sortBy,

            @RequestParam(defaultValue = "asc")
            String direction
    ) {

        PageRequest pageRequest = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Direction.fromString(direction), sortBy)
        );

        return ResponseEntity.ok(
                patientService.searchPatients(
                        search,
                        gender,
                        status,
                        professionalId,
                        pageRequest
                )
        );
    }
}
