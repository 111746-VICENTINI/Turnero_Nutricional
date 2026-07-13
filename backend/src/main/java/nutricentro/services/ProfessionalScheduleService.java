package nutricentro.services;

import nutricentro.dtos.professionalSchedule.ProfessionalScheduleRequestDTO;
import nutricentro.dtos.professionalSchedule.ProfessionalScheduleResponseDTO;
import nutricentro.dtos.professionalSchedule.ProfessionalScheduleUpdateDTO;
import nutricentro.enums.AppointmentModality;
import nutricentro.enums.PersonStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
public interface ProfessionalScheduleService {
    ProfessionalScheduleResponseDTO create(ProfessionalScheduleRequestDTO dto);
    ProfessionalScheduleResponseDTO update(Long id, ProfessionalScheduleUpdateDTO dto);
    ProfessionalScheduleResponseDTO getById(Long id);
    List<ProfessionalScheduleResponseDTO> getByProfessional(Long professionalId);
    List<LocalTime> getAvailableSlots(Long professionalId, LocalDate date);
    List<LocalTime> getAvailableSlots(Long professionalId,
                                      LocalDate date,
                                      AppointmentModality modality,
                                      String locationKey,
                                      Integer durationMinutes);
    void delete(Long id);
    Page<ProfessionalScheduleResponseDTO> search(Long professionalId, DayOfWeek dayOfWeek, PersonStatus status,
                                                 String search, Pageable pageable);
}
