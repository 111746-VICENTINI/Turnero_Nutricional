package nutricentro.services.implementation;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import nutricentro.dtos.availability.ProfessionalAvailabilityExceptionRequestDTO;
import nutricentro.dtos.availability.ProfessionalAvailabilityExceptionResponseDTO;
import nutricentro.entities.ProfessionalAvailabilityExceptionEntity;
import nutricentro.entities.ProfessionalEntity;
import nutricentro.enums.AppointmentModality;
import nutricentro.enums.AvailabilityExceptionType;
import nutricentro.enums.PersonStatus;
import nutricentro.exception.ApiException;
import nutricentro.repositories.ProfessionalAvailabilityExceptionRepository;
import nutricentro.repositories.ProfessionalRepository;
import nutricentro.repositories.ProfessionalScheduleRepository;
import nutricentro.services.ProfessionalAvailabilityExceptionService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProfessionalAvailabilityExceptionServiceImpl implements ProfessionalAvailabilityExceptionService {

    private final ProfessionalAvailabilityExceptionRepository exceptionRepository;
    private final ProfessionalRepository professionalRepository;
    private final ProfessionalScheduleRepository scheduleRepository;

    @Override
    @Transactional
    public ProfessionalAvailabilityExceptionResponseDTO create(ProfessionalAvailabilityExceptionRequestDTO dto) {
        validate(dto);

        ProfessionalEntity professional = null;
        if (dto.getProfessionalId() != null) {
            professional = professionalRepository.findByIdForUpdate(dto.getProfessionalId())
                    .orElseThrow(() -> new EntityNotFoundException("Profesional no encontrado"));
            if (professional.getStatus() != PersonStatus.ACTIVE) {
                throw new ApiException("El profesional no está activo", HttpStatus.CONFLICT.value());
            }
        }

        validateTimedBlockAgainstAvailability(dto, professional);

        ProfessionalAvailabilityExceptionEntity exception = new ProfessionalAvailabilityExceptionEntity();
        exception.setProfessional(professional);
        exception.setAppliesToAllProfessionals(Boolean.TRUE.equals(dto.getAppliesToAllProfessionals()));
        exception.setDate(dto.getDate());
        exception.setStartTime(dto.getStartTime());
        exception.setEndTime(dto.getEndTime());
        exception.setType(dto.getType());
        exception.setSlotDurationMinutes(dto.getSlotDurationMinutes());
        exception.setBufferMinutes(dto.getBufferMinutes());
        exception.setMaxDailyAppointments(dto.getMaxDailyAppointments());
        exception.setModality(dto.getModality());
        exception.setLocationKey(normalizeLocationKey(dto.getLocationKey()));
        exception.setReason(dto.getReason());
        exception.setStatus(dto.getStatus() != null ? dto.getStatus() : PersonStatus.ACTIVE);

        return toResponse(exceptionRepository.save(exception));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProfessionalAvailabilityExceptionResponseDTO> getByProfessionalAndDate(Long professionalId, LocalDate date) {
        return exceptionRepository.findActiveForProfessionalAndDate(professionalId, date, PersonStatus.ACTIVE)
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public void delete(Long id) {
        ProfessionalAvailabilityExceptionEntity exception = exceptionRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new EntityNotFoundException("Excepción de disponibilidad no encontrada"));
        if (exception.getDate().isBefore(LocalDate.now())) {
            throw new ApiException("No es posible eliminar un bloque correspondiente a una fecha pasada.", HttpStatus.BAD_REQUEST.value());
        }
        exception.setStatus(PersonStatus.INACTIVE);
        exceptionRepository.save(exception);
    }

    private void validate(ProfessionalAvailabilityExceptionRequestDTO dto) {
        if (dto.getDate() == null || dto.getDate().isBefore(LocalDate.now())) {
            throw new ApiException("No es posible crear disponibilidad para fechas anteriores al día actual.", HttpStatus.BAD_REQUEST.value());
        }
        if (!Boolean.TRUE.equals(dto.getAppliesToAllProfessionals()) && dto.getProfessionalId() == null) {
            throw new ApiException("La excepción debe indicar un profesional o aplicar a todos", HttpStatus.BAD_REQUEST.value());
        }
        validateTimeRange(dto.getType(), dto.getStartTime(), dto.getEndTime(), dto.getSlotDurationMinutes());
        if (dto.getBufferMinutes() != null && dto.getBufferMinutes() < 0) {
            throw new ApiException("El tiempo entre turnos no puede ser negativo", HttpStatus.BAD_REQUEST.value());
        }
        if (dto.getMaxDailyAppointments() != null && dto.getMaxDailyAppointments() < 1) {
            throw new ApiException("El máximo diario de pacientes debe ser mayor a cero", HttpStatus.BAD_REQUEST.value());
        }
    }

    private void validateTimeRange(AvailabilityExceptionType type, LocalTime startTime, LocalTime endTime, Integer slotDurationMinutes) {
        boolean hasPartialTime = startTime != null || endTime != null;
        if (type == AvailabilityExceptionType.SPECIAL_HOURS) {
            if (startTime == null || endTime == null || slotDurationMinutes == null) {
                throw new ApiException("El horario especial requiere inicio, fin y duración", HttpStatus.BAD_REQUEST.value());
            }
            if (slotDurationMinutes < 15) {
                throw new ApiException("La duración minima de un turno es de 15 minutos", HttpStatus.BAD_REQUEST.value());
            }
        }
        if (hasPartialTime && (startTime == null || endTime == null)) {
            throw new ApiException("Debe informar inicio y fin del bloqueo", HttpStatus.BAD_REQUEST.value());
        }
        if (startTime != null && !startTime.isBefore(endTime)) {
            throw new ApiException("La hora de inicio debe ser anterior a la hora de fin", HttpStatus.BAD_REQUEST.value());
        }
        if (slotDurationMinutes != null && startTime != null && Duration.between(startTime, endTime).toMinutes() < slotDurationMinutes) {
            throw new ApiException("La franja horaria es menor que la duración configurada", HttpStatus.BAD_REQUEST.value());
        }
    }

    private void validateTimedBlockAgainstAvailability(ProfessionalAvailabilityExceptionRequestDTO dto,
                                                       ProfessionalEntity professional) {
        if (professional == null || dto.getType() == AvailabilityExceptionType.SPECIAL_HOURS || dto.getStartTime() == null || dto.getEndTime() == null) {
            return;
        }

        boolean overlapsSchedule = scheduleRepository.findByProfessionalIdAndDayOfWeekAndStatus(
                professional.getId(), dto.getDate().getDayOfWeek(), PersonStatus.ACTIVE)
                .stream()
                .anyMatch(schedule -> dto.getStartTime().isBefore(schedule.getEndTime())
                        && schedule.getStartTime().isBefore(dto.getEndTime()));
        if (!overlapsSchedule) {
            throw new ApiException("No es posible bloquear un horario inexistente.", HttpStatus.BAD_REQUEST.value());
        }

        boolean overlapsExistingBlock = exceptionRepository
                .findActiveForProfessionalAndDate(professional.getId(), dto.getDate(), PersonStatus.ACTIVE)
                .stream()
                .filter(exception -> exception.getType() != AvailabilityExceptionType.SPECIAL_HOURS)
                .anyMatch(exception -> exception.getStartTime() == null
                        || exception.getEndTime() == null
                        || (dto.getStartTime().isBefore(exception.getEndTime())
                        && exception.getStartTime().isBefore(dto.getEndTime())));
        if (overlapsExistingBlock) {
            throw new ApiException("El horario seleccionado se superpone con otro bloque existente.", HttpStatus.CONFLICT.value());
        }
    }

    private ProfessionalAvailabilityExceptionResponseDTO toResponse(ProfessionalAvailabilityExceptionEntity exception) {
        return ProfessionalAvailabilityExceptionResponseDTO.builder()
                .id(exception.getId())
                .professionalId(exception.getProfessional() != null ? exception.getProfessional().getId() : null)
                .appliesToAllProfessionals(exception.getAppliesToAllProfessionals())
                .date(exception.getDate())
                .startTime(exception.getStartTime())
                .endTime(exception.getEndTime())
                .type(exception.getType())
                .slotDurationMinutes(exception.getSlotDurationMinutes())
                .bufferMinutes(exception.getBufferMinutes())
                .maxDailyAppointments(exception.getMaxDailyAppointments())
                .modality(exception.getModality() != null ? exception.getModality() : AppointmentModality.HYBRID)
                .locationKey(exception.getLocationKey())
                .reason(exception.getReason())
                .status(exception.getStatus())
                .build();
    }

    private String normalizeLocationKey(String locationKey) {
        return locationKey == null || locationKey.isBlank() ? null : locationKey.trim();
    }
}
