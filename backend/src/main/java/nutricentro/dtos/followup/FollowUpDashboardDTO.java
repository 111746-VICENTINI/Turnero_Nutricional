package nutricentro.dtos.followup;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class FollowUpDashboardDTO {
    private long activePatients;
    private long patientsOverThreeMonths;
    private long patientsOverSixMonths;
    private long patientsOverOneYear;
}
