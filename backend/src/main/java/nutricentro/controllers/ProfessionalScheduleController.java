package nutricentro.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import nutricentro.dtos.professionalSchedule.ProfessionalScheduleRequestDTO;
import nutricentro.dtos.professionalSchedule.ProfessionalScheduleResponseDTO;
import nutricentro.dtos.professionalSchedule.ProfessionalScheduleUpdateDTO;
import nutricentro.enums.AppointmentModality;
import nutricentro.enums.PersonStatus;
import nutricentro.services.ProfessionalScheduleService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/professional-schedule")
@RequiredArgsConstructor
@CrossOrigin(origins = "${app.cors.allowed-origins:*}")
public class ProfessionalScheduleController {
    private final ProfessionalScheduleService professionalScheduleService;

    @PostMapping("/create")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESSIONAL')")
    public ResponseEntity<ProfessionalScheduleResponseDTO> create(@RequestBody @Valid ProfessionalScheduleRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(professionalScheduleService.create(dto));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECRETARY', 'PROFESSIONAL')")
    public ResponseEntity<ProfessionalScheduleResponseDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(professionalScheduleService.getById(id));
    }

    @GetMapping("/professional/{professionalId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECRETARY', 'PROFESSIONAL')")
    public ResponseEntity<List<ProfessionalScheduleResponseDTO>> getByProfessional(@PathVariable Long professionalId) {
        return ResponseEntity.ok(professionalScheduleService.getByProfessional(professionalId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESSIONAL')")
    public ResponseEntity<ProfessionalScheduleResponseDTO> update(@PathVariable Long id,
                                                                  @RequestBody ProfessionalScheduleUpdateDTO dto) {
        return ResponseEntity.ok(professionalScheduleService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROFESSIONAL')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        professionalScheduleService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SECRETARY', 'PROFESSIONAL')")
    public ResponseEntity<Page<ProfessionalScheduleResponseDTO>> search(
            @RequestParam(required = false) Long professionalId,
            @RequestParam(required = false) DayOfWeek dayOfWeek,
            @RequestParam(required = false) PersonStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "dayOfWeek") String sortBy,
            @RequestParam(defaultValue = "asc") String direction) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.fromString(direction),sortBy));

        return ResponseEntity.ok(professionalScheduleService.search(professionalId, dayOfWeek, status, search, pageable));
    }

    @GetMapping("/available-slots")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECRETARY', 'PROFESSIONAL')")
    public ResponseEntity<List<LocalTime>> getAvailableSlots(@RequestParam Long professionalId,
                                                             @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                                                             LocalDate date,
                                                             @RequestParam(required = false) AppointmentModality modality,
                                                             @RequestParam(required = false) String locationKey,
                                                             @RequestParam(required = false) Integer durationMinutes) {
        return ResponseEntity.ok(professionalScheduleService.getAvailableSlots(
                professionalId,
                date,
                modality,
                locationKey,
                durationMinutes
        ));
    }
}
