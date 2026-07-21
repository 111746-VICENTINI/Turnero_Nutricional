package nutricentro.exception;

import jakarta.persistence.EntityNotFoundException;
import lombok.NoArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.AuthenticationException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.nio.file.AccessDeniedException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@ControllerAdvice
@NoArgsConstructor
public class GlobalExceptionHandler {

    private static final Logger LOGGER = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorApi> handleApiException(ApiException ex) {
        ErrorApi error = ErrorApi.builder()
                .timestamp(LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME))
                .status(ex.getStatus())
                .error(HttpStatus.valueOf(ex.getStatus()).name())
                .message(ex.getMessage())
                .build();
        LOGGER.warn("ApiException capturada: {}", ex.getMessage(), ex);
        return new ResponseEntity<>(error, HttpStatus.valueOf(ex.getStatus()));
    }

    @ExceptionHandler(EmailException.class)
    public ResponseEntity<ErrorApi> handleEmailException(EmailException ex) {
        ErrorApi error = ErrorApi.builder()
                .timestamp(LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME))
                .status(HttpStatus.BAD_REQUEST.value())
                .error("EMAIL_ERROR")
                .message(ex.getMessage())
                .build();
        LOGGER.warn("EmailException: {}", ex.getMessage());
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    //cuando falla una validacion de dto
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorApi> handleValidationErrors(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .findFirst()
                .orElse("Error de validación");

        ErrorApi error = ErrorApi.builder()
                .timestamp(LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME))
                .status(HttpStatus.BAD_REQUEST.value())
                .error("VALIDATION_ERROR")
                .message(message)
                .build();
        LOGGER.warn("MethodArgumentNotValidException (Error de validación): {}", message);
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorApi> handleIllegalArgument(IllegalArgumentException ex) {
        ErrorApi error = ErrorApi.builder()
                .timestamp(LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME))
                .status(HttpStatus.BAD_REQUEST.value())
                .error(HttpStatus.BAD_REQUEST.name())
                .message(ex.getMessage())
                .build();
        LOGGER.warn("IllegalArgumentException: {}", ex.getMessage());
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorApi> handleAuthenticationException(AuthenticationException ex) {
        ErrorApi error = ErrorApi.builder()
                .timestamp(LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME))
                .status(HttpStatus.UNAUTHORIZED.value())
                .error(HttpStatus.UNAUTHORIZED.name())
                .message("Credenciales invalidas")
                .build();
        LOGGER.warn("AuthenticationException: {}", ex.getMessage());
        return new ResponseEntity<>(error, HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorApi> handleGenericException(Exception ex) {
        ErrorApi error = ErrorApi.builder()
                .timestamp(LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME))
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .error("INTERNAL_SERVER_ERROR")
                .message("Ocurrió un error interno. Revisá los datos ingresados o intentá nuevamente.")
                .build();
        LOGGER.error("Exception no controlada: {}", ex.getMessage(), ex);
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler(StackOverflowError.class)
    public ResponseEntity<ErrorApi> handleStackOverflow(StackOverflowError ex) {
        ErrorApi error = ErrorApi.builder()
                .timestamp(LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME))
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .error("INTERNAL_SERVER_ERROR")
                .message("Ocurrió un error interno al procesar relaciones del sistema.")
                .build();
        LOGGER.error("StackOverflowError no controlado", ex);
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ErrorApi> handleEntityNotFound(EntityNotFoundException ex) {
        ErrorApi error = ErrorApi.builder()
                .timestamp(LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME))
                .status(HttpStatus.NOT_FOUND.value())
                .error(HttpStatus.NOT_FOUND.name())
                .message(ex.getMessage())
                .build();
        LOGGER.warn("Entidad no encontrada: {}", ex.getMessage());
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorApi> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        ErrorApi error = ErrorApi.builder()
                .timestamp(LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME))
                .status(HttpStatus.CONFLICT.value())
                .error(HttpStatus.CONFLICT.name())
                .message("No se pudo completar la operación porque existen datos relacionados.")
                .build();
        LOGGER.warn("DataIntegrityViolationException: {}", ex.getMostSpecificCause().getMessage(), ex);
        return new ResponseEntity<>(error, HttpStatus.CONFLICT);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorApi> handleAccessDenied(AccessDeniedException ex) {
        ErrorApi error = ErrorApi.builder()
                .timestamp(LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME))
                .status(HttpStatus.FORBIDDEN.value())
                .error(HttpStatus.FORBIDDEN.name())
                .message(ex.getMessage())
                .build();
        LOGGER.warn("Excepción de acceso denegado: {}", ex.getMessage());
        return new ResponseEntity<>(error, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<ErrorApi> handleSpringAccessDenied(org.springframework.security.access.AccessDeniedException ex) {
        ErrorApi error = ErrorApi.builder()
                .timestamp(LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME))
                .status(HttpStatus.FORBIDDEN.value())
                .error(HttpStatus.FORBIDDEN.name())
                .message("No tenés permisos para realizar esta acción.")
                .build();
        LOGGER.warn("Acceso denegado por seguridad: {}", ex.getMessage());
        return new ResponseEntity<>(error, HttpStatus.FORBIDDEN);
    }

    //error de parametro: /abc (espera long)
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorApi> handleTypeMismatch(
            MethodArgumentTypeMismatchException ex) {

        ErrorApi error = ErrorApi.builder()
                .timestamp(LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME))
                .status(HttpStatus.BAD_REQUEST.value())
                .error(HttpStatus.BAD_REQUEST.name())
                .message("Parámetro inválido: " + ex.getName())
                .build();

        return ResponseEntity.badRequest().body(error);
    }

    //json mal formado
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorApi> handleJsonError(
            HttpMessageNotReadableException ex) {
        String detail = ex.getMostSpecificCause() != null && ex.getMostSpecificCause().getMessage() != null
                ? ex.getMostSpecificCause().getMessage()
                : ex.getMessage();

        ErrorApi error = ErrorApi.builder()
                .timestamp(LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME))
                .status(HttpStatus.BAD_REQUEST.value())
                .error(HttpStatus.BAD_REQUEST.name())
                .message(readableJsonMessage(detail))
                .build();

        return ResponseEntity.badRequest().body(error);
    }

    private String readableJsonMessage(String detail) {
        String normalized = detail == null ? "" : detail;
        if (normalized.contains("LocalTime")) {
            return "Hora invalida. Use el formato HH:mm.";
        }
        if (normalized.contains("LocalDate")) {
            return "Fecha invalida. Use el formato yyyy-MM-dd.";
        }
        if (normalized.contains("java.util.Date") || normalized.contains("Date value")) {
            return "Fecha invalida. Use el formato yyyy-MM-dd.";
        }
        if (normalized.contains("Unrecognized field")) {
            return "El formulario envio campos no permitidos para esta operacion.";
        }
        if (normalized.contains("maxDailyAppointments")) {
            return "El maximo diario debe ser un numero entero.";
        }
        if (normalized.contains("AppointmentModality")) {
            return "Modalidad invalida.";
        }
        if (normalized.contains("DayOfWeek")) {
            return "Dia invalido.";
        }
        if (normalized.contains("PersonStatus")) {
            return "Estado invalido.";
        }
        return "El formato enviado no es valido. Revise los datos ingresados.";
    }
}
