package nutricentro.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import nutricentro.dtos.availability.ProfessionalAvailabilityExceptionRequestDTO;
import nutricentro.dtos.availability.ProfessionalAvailabilityExceptionResponseDTO;
import nutricentro.services.ProfessionalAvailabilityExceptionService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/professional-availability-exception")
@RequiredArgsConstructor
@CrossOrigin(origins = "${app.cors.allowed-origins:*}")
public class ProfessionalAvailabilityExceptionController {

    private final ProfessionalAvailabilityExceptionService exceptionService;

    @PostMapping("/create")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESSIONAL')")
    public ResponseEntity<ProfessionalAvailabilityExceptionResponseDTO> create(
            @RequestBody @Valid ProfessionalAvailabilityExceptionRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(exceptionService.create(dto));
    }

    @GetMapping("/professional/{professionalId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECRETARY', 'PROFESSIONAL')")
    public ResponseEntity<List<ProfessionalAvailabilityExceptionResponseDTO>> getByProfessionalAndDate(
            @PathVariable Long professionalId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(exceptionService.getByProfessionalAndDate(professionalId, date));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESSIONAL')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        exceptionService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
