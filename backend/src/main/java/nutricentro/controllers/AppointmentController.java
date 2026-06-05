package nutricentro.controllers;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/appointment")
@RequiredArgsConstructor
@CrossOrigin("*")
public class AppointmentController {
//    @Autowired
//    private TurnoService turnoService;
//
//    // Las secretarias y admins pueden ver y agendar todos los turnos
//    @GetMapping("/todos")
//    @PreAuthorize("hasAnyRole('ADMIN', 'SECRETARIA')")
//    public ResponseEntity<List<TurnoDTO>> obtenerTodosLosTurnos() {
//        return ResponseEntity.ok(turnoService.findAll());
//    }
//
//    // El profesional SOLO ve sus propios turnos.
//    // Extraemos su 'sub' (ID único de Auth0) del token JWT para filtrar en MySQL.
//    @GetMapping("/mis-turnos")
//    @PreAuthorize("hasRole('PROFESIONAL')")
//    public ResponseEntity<List<TurnoDTO>> obtenerMisTurnos(@AuthenticationPrincipal Jwt jwt) {
//        String profesionalAuth0Id = jwt.getSubject();
//        return ResponseEntity.ok(turnoService.findByProfesionalId(profesionalAuth0Id));
//    }
}
