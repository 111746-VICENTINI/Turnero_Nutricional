package nutricentro.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import nutricentro.dtos.professionals.ProfessionalRequestDTO;
import nutricentro.dtos.professionals.ProfessionalResponseDTO;
import nutricentro.dtos.professionals.ProfessionalUpdateDTO;
import nutricentro.enums.GenderType;
import nutricentro.enums.PersonStatus;
import nutricentro.services.ProfessionalService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/professional")
@RequiredArgsConstructor
@CrossOrigin("*")
public class ProfessionalController {
    private final ProfessionalService professionalService;

    @PostMapping("/create")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProfessionalResponseDTO> createProfessional(@Valid @RequestBody ProfessionalRequestDTO professional) {
        return ResponseEntity.status(HttpStatus.CREATED).body(professionalService.createProfessional(professional));
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESSIONAL')")
    public ResponseEntity<List<ProfessionalResponseDTO>> getAllProfessionals() {
        return ResponseEntity.ok(professionalService.getAllProfessionals());
    }

    @GetMapping("{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESSIONAL')")
    public ResponseEntity<ProfessionalResponseDTO> getProfessionalById(@PathVariable Long id) {
        return ResponseEntity.ok(professionalService.getProfessionalById(id));
    }

    @PutMapping("{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProfessionalResponseDTO> update(@PathVariable Long id,
                                                          @Valid @RequestBody ProfessionalUpdateDTO professional) {
        return ResponseEntity.ok(professionalService.update(id, professional));
    }

    @PatchMapping("{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        professionalService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public ResponseEntity<Page<ProfessionalResponseDTO>>searchProfessionals(

            @RequestParam(required = false)
            String search,

            @RequestParam(required = false)
            GenderType gender,

            @RequestParam(required = false)
            PersonStatus status,

            @RequestParam(required = false)
            Long specialtyId,

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
                professionalService.searchProfessionals(
                        search,
                        gender,
                        status,
                        specialtyId,
                        pageRequest
                )
        );
    }
}
