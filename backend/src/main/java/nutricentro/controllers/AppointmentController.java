package nutricentro.controllers;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import nutricentro.dtos.appointments.AppointmentRequestDTO;
import nutricentro.dtos.appointments.AppointmentResponseDTO;
import nutricentro.dtos.appointments.AppointmentTimelineEventResponseDTO;
import nutricentro.dtos.appointments.AppointmentUpdateDTO;
import nutricentro.enums.AppointmentStatus;
import nutricentro.services.AppointmentService;
import nutricentro.services.AppointmentTimelineService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/appointment")
@RequiredArgsConstructor
@CrossOrigin(origins = "${app.cors.allowed-origins:*}")
/** Expone endpoints para gestionar turnos y consultar su timeline. */
public class AppointmentController {
    private final AppointmentService appointmentService;
    private final AppointmentTimelineService appointmentTimelineService;

    @PostMapping("/create")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECRETARY')")
    /** Crea un turno desde la API. */
    public ResponseEntity<AppointmentResponseDTO> createAppointment(@Valid @RequestBody AppointmentRequestDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(appointmentService.createAppointment(dto));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SECRETARY', 'PROFESSIONAL')")
    /** Busca turnos aplicando filtros, orden y paginación. */
    public ResponseEntity<Page<AppointmentResponseDTO>> searchAppointments(
            @RequestParam(required = false) AppointmentStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(required = false) Long patientId,
            @RequestParam(required = false) Long professionalId,
            @RequestParam(required = false) Long secretaryId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "date") String sortBy,
            @RequestParam(defaultValue = "asc") String direction
    ) {
        int pageNumber = Math.max(page, 0);
        int pageSize = Math.min(Math.max(size, 1), 100);
        Sort.Direction sortDirection = Sort.Direction.fromString(direction);
        PageRequest pageRequest = PageRequest.of(
                pageNumber,
                pageSize,
                Sort.by(sortDirection, sortBy).and(Sort.by(sortDirection, "time"))
        );

        return ResponseEntity.ok(appointmentService.searchAppointments(
                status,
                dateFrom,
                dateTo,
                patientId,
                professionalId,
                secretaryId,
                search,
                pageRequest
        ));
    }

    @GetMapping("/status/{status}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECRETARY', 'PROFESSIONAL')")
    /** Lista turnos por estado. */
    public ResponseEntity<List<AppointmentResponseDTO>> getAppointmentsByStatus(@PathVariable AppointmentStatus status) {
        return ResponseEntity.ok(appointmentService.getAppointmentsByStatus(status));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECRETARY', 'PROFESSIONAL')")
    /** Obtiene el detalle de un turno. */
    public ResponseEntity<AppointmentResponseDTO> getAppointmentById(@PathVariable Long id) {
        return ResponseEntity.ok(appointmentService.getAppointmentById(id));
    }

    @GetMapping("/{id}/timeline")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECRETARY', 'PROFESSIONAL')")
    /** Obtiene el timeline funcional de un turno. */
    public ResponseEntity<List<AppointmentTimelineEventResponseDTO>> getAppointmentTimeline(@PathVariable Long id) {
        return ResponseEntity.ok(appointmentTimelineService.getTimeline(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECRETARY', 'PROFESSIONAL')")
    /** Actualiza un turno existente. */
    public ResponseEntity<AppointmentResponseDTO> updateAppointment(@PathVariable Long id,
                                                     @Valid @RequestBody AppointmentUpdateDTO dto) {
        return ResponseEntity.ok(appointmentService.updateAppointment(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SECRETARY')")
    /** Cancela un turno existente. */
    public ResponseEntity<Void> deleteAppointment(@PathVariable Long id) {
        appointmentService.deleteAppointment(id);
        return ResponseEntity.noContent().build();
    }
}
