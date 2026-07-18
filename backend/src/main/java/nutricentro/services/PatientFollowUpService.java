package nutricentro.services;

import nutricentro.dtos.followup.FollowUpDashboardDTO;
import nutricentro.dtos.followup.PatientFollowUpStatusDTO;

import java.util.List;

public interface PatientFollowUpService {
    PatientFollowUpStatusDTO getPatientStatus(Long patientId);
    FollowUpDashboardDTO getDashboardMetrics();
    List<PatientFollowUpStatusDTO> getInactivePatientsForCurrentUser();
}
