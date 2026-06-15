package nutricentro.services;

import nutricentro.dtos.appointments.AppointmentRequestDTO;
import nutricentro.dtos.appointments.AppointmentResponseDTO;
import nutricentro.dtos.appointments.AppointmentUpdateDTO;
import nutricentro.enums.AppointmentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public interface AppointmentService {
    AppointmentResponseDTO createAppointment(AppointmentRequestDTO dto);
    List<AppointmentResponseDTO> getAllAppointments();
    AppointmentResponseDTO getAppointmentById(Long id);
    AppointmentResponseDTO updateAppointment(Long id, AppointmentUpdateDTO dto);
    void deleteAppointment(Long id);
    List<AppointmentResponseDTO> getAppointmentsByStatus(AppointmentStatus status);
    Page<AppointmentResponseDTO> searchAppointments(
            AppointmentStatus status,
            LocalDate dateFrom,
            LocalDate dateTo,
            Long patientId,
            Long professionalId,
            Long secretaryId,
            String search,
            Pageable pageable
    );
}
