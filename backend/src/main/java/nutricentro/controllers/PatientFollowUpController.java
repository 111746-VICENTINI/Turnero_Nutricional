package nutricentro.controllers;

import lombok.RequiredArgsConstructor;
import nutricentro.dtos.followup.FollowUpDashboardDTO;
import nutricentro.dtos.followup.PatientFollowUpStatusDTO;
import nutricentro.services.PatientFollowUpService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/follow-up")
@RequiredArgsConstructor
@CrossOrigin(origins = "${app.cors.allowed-origins:*}")
@PreAuthorize("hasAnyRole('ADMIN', 'PROFESSIONAL')")
public class PatientFollowUpController {

    private final PatientFollowUpService patientFollowUpService;

    @GetMapping("/patients/{patientId}/status")
    public ResponseEntity<PatientFollowUpStatusDTO> getPatientStatus(@PathVariable Long patientId) {
        return ResponseEntity.ok(patientFollowUpService.getPatientStatus(patientId));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<FollowUpDashboardDTO> getDashboardMetrics() {
        return ResponseEntity.ok(patientFollowUpService.getDashboardMetrics());
    }
}
