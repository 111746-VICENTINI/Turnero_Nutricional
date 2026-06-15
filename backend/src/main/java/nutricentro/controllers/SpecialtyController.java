package nutricentro.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import nutricentro.dtos.specialties.SpecialtyRequestDTO;
import nutricentro.dtos.specialties.SpecialtyResponseDTO;
import nutricentro.dtos.specialties.SpecialtyUpdateDTO;
import nutricentro.services.SpecialtyService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/specialty")
@RequiredArgsConstructor
@CrossOrigin("*")
public class SpecialtyController {

    private final SpecialtyService specialtyService;

    @PostMapping("/create")
    @PreAuthorize("hasAnyRole('ADMIN')")
    public ResponseEntity<SpecialtyResponseDTO> createSpecialty(@Valid @RequestBody SpecialtyRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(specialtyService.createSpecialty(dto));
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESSIONAL')")
    public ResponseEntity<List<SpecialtyResponseDTO>> getAllSpecialties() {
        return ResponseEntity.ok(specialtyService.getAllSpecialties());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESSIONAL')")
    public ResponseEntity<SpecialtyResponseDTO> getSpecialtyById(@PathVariable Long id) {
        return ResponseEntity.ok(specialtyService.getSpecialtyById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESSIONAL')")
    public ResponseEntity<SpecialtyResponseDTO> updateSpecialty(@PathVariable Long id,
                                                                @Valid @RequestBody SpecialtyUpdateDTO dto) {
        return ResponseEntity.ok(specialtyService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESSIONAL')")
    public ResponseEntity<Void> deleteSpecialty(@PathVariable Long id) {
        specialtyService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
